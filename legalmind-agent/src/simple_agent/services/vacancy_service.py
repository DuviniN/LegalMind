from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

from simple_agent.db.mongodb import db

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
POSTER_DIR = UPLOAD_DIR / "vacancy_posters"
CV_DIR = UPLOAD_DIR / "cvs"
POSTER_DIR.mkdir(parents=True, exist_ok=True)
CV_DIR.mkdir(parents=True, exist_ok=True)

VALID_STATUSES = {"open", "closed"}


def _serialize_vacancy(doc: dict) -> dict:
    created_at = doc.get("created_at")
    updated_at = doc.get("updated_at")
    return {
        "id": str(doc["_id"]),
        "company_id": doc.get("company_id", ""),
        "title": doc.get("title", ""),
        "department": doc.get("department", ""),
        "location": doc.get("location", ""),
        "employment_type": doc.get("employment_type", ""),
        "description": doc.get("description", ""),
        "requirements": doc.get("requirements", ""),
        "poster_filename": doc.get("poster_filename"),
        "status": doc.get("status", "open"),
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


def _serialize_application(doc: dict, include_text: bool = False) -> dict:
    ranked_at = doc.get("ranked_at")
    applied_at = doc.get("applied_at")
    result = {
        "id": str(doc["_id"]),
        "vacancy_id": str(doc["vacancy_id"]),
        "candidate_name": doc.get("candidate_name", ""),
        "candidate_email": doc.get("candidate_email", ""),
        "candidate_phone": doc.get("candidate_phone"),
        "cv_file_name": doc.get("cv_file_name", ""),
        "match_score": doc.get("match_score"),
        "match_summary": doc.get("match_summary"),
        "ranked_at": ranked_at.isoformat() if ranked_at else None,
        "applied_at": applied_at.isoformat() if applied_at else None,
    }
    if include_text:
        result["cv_text"] = doc.get("cv_text", "")
    return result


async def create_vacancy(company: dict, fields: dict, poster: UploadFile | None) -> dict:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    timestamp = datetime.now(timezone.utc)

    poster_filename = None
    poster_stored_name = None
    poster_path = None
    if poster is not None and poster.filename:
        poster_stored_name = f"{int(timestamp.timestamp())}_{Path(poster.filename).name}"
        company_dir = POSTER_DIR / str(company["_id"])
        company_dir.mkdir(parents=True, exist_ok=True)
        save_path = company_dir / poster_stored_name
        with open(save_path, "wb") as out_file:
            out_file.write(await poster.read())
        poster_filename = poster.filename
        poster_path = str(save_path)

    document = {
        "company_id": str(company["_id"]),
        "title": fields["title"],
        "department": fields["department"],
        "location": fields["location"],
        "employment_type": fields["employment_type"],
        "description": fields["description"],
        "requirements": fields["requirements"],
        "poster_filename": poster_filename,
        "poster_stored_name": poster_stored_name,
        "poster_path": poster_path,
        "status": "open",
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    result = await db.database["vacancies"].insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_vacancy(document)


async def list_vacancies(company_id: str, status: str | None = None) -> list[dict]:
    if db.database is None:
        return []

    query: dict = {"company_id": company_id}
    if status:
        query["status"] = status

    cursor = db.database["vacancies"].find(query).sort("created_at", -1)
    return [_serialize_vacancy(doc) async for doc in cursor]


async def get_vacancy(vacancy_id: str) -> dict:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    try:
        object_id = ObjectId(vacancy_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Vacancy not found") from exc

    doc = await db.database["vacancies"].find_one({"_id": object_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return _serialize_vacancy(doc)


async def update_vacancy_status(vacancy_id: str, status: str) -> dict:
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Status must be 'open' or 'closed'")
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    try:
        object_id = ObjectId(vacancy_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Vacancy not found") from exc

    result = await db.database["vacancies"].find_one_and_update(
        {"_id": object_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return _serialize_vacancy(result)


async def submit_cv_application(vacancy: dict, fields: dict, cv_file: UploadFile) -> dict:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")
    if vacancy.get("status") != "open":
        raise HTTPException(status_code=400, detail="This vacancy is no longer accepting applications")
    if not cv_file.filename or not cv_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    timestamp = datetime.now(timezone.utc)
    vacancy_id = vacancy["id"]
    safe_name = f"{int(timestamp.timestamp())}_{Path(cv_file.filename).name}"
    vacancy_dir = CV_DIR / vacancy_id
    vacancy_dir.mkdir(parents=True, exist_ok=True)
    save_path = vacancy_dir / safe_name

    file_bytes = await cv_file.read()
    with open(save_path, "wb") as out_file:
        out_file.write(file_bytes)

    try:
        reader = PdfReader(str(save_path))
        cv_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        cv_text = ""

    document = {
        "vacancy_id": ObjectId(vacancy_id),
        "company_id": vacancy["company_id"],
        "candidate_name": fields["candidate_name"],
        "candidate_email": fields["candidate_email"],
        "candidate_phone": fields.get("candidate_phone") or None,
        "cv_file_name": cv_file.filename,
        "cv_stored_name": safe_name,
        "cv_path": str(save_path),
        "cv_text": cv_text,
        "match_score": None,
        "match_summary": None,
        "ranked_at": None,
        "applied_at": timestamp,
    }
    result = await db.database["cv_applications"].insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_application(document)


async def list_applications(vacancy_id: str) -> list[dict]:
    if db.database is None:
        return []

    try:
        object_id = ObjectId(vacancy_id)
    except Exception:
        return []

    cursor = db.database["cv_applications"].find({"vacancy_id": object_id})
    applications = [doc async for doc in cursor]
    applications.sort(
        key=lambda doc: (
            doc.get("match_score") if doc.get("match_score") is not None else -1,
            doc.get("applied_at") or datetime.min.replace(tzinfo=timezone.utc),
        ),
        reverse=True,
    )
    return [_serialize_application(doc) for doc in applications]


async def _get_raw_applications(vacancy_id: str) -> list[dict]:
    if db.database is None:
        return []

    try:
        object_id = ObjectId(vacancy_id)
    except Exception:
        return []

    cursor = db.database["cv_applications"].find({"vacancy_id": object_id})
    return [doc async for doc in cursor]
