from datetime import datetime, timezone
from pathlib import Path

from fastapi.concurrency import run_in_threadpool
from fastapi import HTTPException, UploadFile

from app.db.mongodb import db
from app.services.rag_service import ingest_pdf_to_vector_store

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def upload_pdf(file: UploadFile, company: dict) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    timestamp = datetime.now(timezone.utc)
    safe_name = f"{int(timestamp.timestamp())}_{Path(file.filename).name}"
    company_dir = UPLOAD_DIR / str(company["_id"])
    company_dir.mkdir(parents=True, exist_ok=True)
    save_path = company_dir / safe_name

    content = await file.read()
    with open(save_path, "wb") as out_file:
        out_file.write(content)

    result = await db.database["documents"].insert_one(
        {
            "company_id": company["_id"],
            "file_name": file.filename,
            "stored_name": safe_name,
            "path": str(save_path),
            "uploaded_at": timestamp,
            "indexing_status": "processing",
        }
    )

    document_id = str(result.inserted_id)
    try:
        chunks_indexed = await run_in_threadpool(
            ingest_pdf_to_vector_store,
            save_path,
            str(company["_id"]),
            document_id,
            file.filename,
        )
        await db.database["documents"].update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "indexing_status": "indexed",
                    "chunks_indexed": chunks_indexed,
                    "indexed_at": datetime.now(timezone.utc),
                }
            },
        )
    except Exception as exc:
        await db.database["documents"].update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "indexing_status": "failed",
                    "indexing_error": str(exc),
                }
            },
        )
        raise HTTPException(status_code=500, detail=f"PDF uploaded but indexing failed: {exc}") from exc

    return {
        "message": "File uploaded successfully",
        "document_id": document_id,
        "file_name": file.filename,
        "chunks_indexed": chunks_indexed,
        "uploaded_at": timestamp.isoformat(),
    }


async def list_company_documents(company: dict) -> dict:
    cursor = db.database["documents"].find({"company_id": company["_id"]}).sort("uploaded_at", -1)

    documents = []
    async for item in cursor:
        uploaded_at = item.get("uploaded_at")
        documents.append(
            {
                "id": str(item.get("_id")),
                "file_name": item.get("file_name", ""),
                "path": item.get("path", ""),
                "uploaded_at": uploaded_at.isoformat() if uploaded_at else None,
                "indexing_status": item.get("indexing_status"),
                "chunks_indexed": item.get("chunks_indexed"),
            }
        )

    return {"documents": documents}
