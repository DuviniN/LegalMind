import json
import re
from datetime import datetime, timezone

from fastapi import HTTPException
from langsmith import traceable

from simple_agent.core.config import settings
from simple_agent.db.mongodb import db

_REQUIRED_FIELDS = ["employee_name", "employee_id", "leave_type", "single_date_or_range", "day_duration", "reason"]
_ALLOWED_LEAVE_TYPES = {"annual_leave", "sick_leave", "casual_leave", "unpaid_leave"}
_WEEKDAY_WORDS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
_MONTH_PATTERN = r"jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december"
_EMPTY = {"", "-", "na", "n/a", "none", "nil", "unknown", "not sure"}


def _has_value(value: str | None) -> bool:
    return value is not None and value.strip().lower() not in _EMPTY


def _normalize_leave_type(value: str | None) -> str:
    text = (value or "").strip().lower().replace("-", "_").replace(" ", "_")
    return {
        "annual": "annual_leave",
        "annual_leave": "annual_leave",
        "sick": "sick_leave",
        "sick_leave": "sick_leave",
        "casual": "casual_leave",
        "casual_leave": "casual_leave",
        "unpaid": "unpaid_leave",
        "unpaid_leave": "unpaid_leave",
    }.get(text, text)


def _valid_employee_name(value: str | None) -> bool:
    return bool(value and re.fullmatch(r"[A-Za-z][A-Za-z\s'.-]{1,59}", value.strip()) and not re.search(r"\d", value))


def _valid_leave_date(value: str | None) -> bool:
    if not _has_value(value):
        return False
    text = value.strip().lower()
    return bool(
        text in _WEEKDAY_WORDS
        or text in {"today", "tomorrow", "day after tomorrow"}
        or re.search(r"\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b", text)
        or re.search(rf"\b({_MONTH_PATTERN})\b", text)
    )


def _valid_day_duration(value: str | None) -> bool:
    if not _has_value(value):
        return False
    text = value.strip().lower().replace("-", "_").replace(" ", "_")
    return text in {"full_day", "half_day", "half_day_morning", "half_day_evening"}


def _valid_reason(value: str | None) -> bool:
    return _has_value(value) and len(value.strip()) >= 3


def _extract_fields(message: str) -> dict[str, str]:
    text = message.strip()
    lower = text.lower()
    data: dict[str, str] = {}

    employee_id = re.search(r"\b(?:employee\s*id|emp\s*id|id)\s*[:\-]?\s*([a-zA-Z0-9\-_/]+)", text, flags=re.IGNORECASE)
    if employee_id:
        data["employee_id"] = employee_id.group(1).strip()

    name = re.search(r"\b(?:my\s+name\s+is|i\s+am)\s+([A-Za-z][A-Za-z\s'.-]{1,60})", text, flags=re.IGNORECASE)
    if name:
        data["employee_name"] = name.group(1).strip()

    if re.search(r"\bannual\s*leave\b|\bannual\b", lower):
        data["leave_type"] = "annual_leave"
    elif re.search(r"\bsick\s*leave\b|\bsick\b", lower):
        data["leave_type"] = "sick_leave"
    elif re.search(r"\bcasual\s*leave\b|\bcasual\b", lower):
        data["leave_type"] = "casual_leave"
    elif re.search(r"\bunpaid\s*leave\b|\bunpaid\b", lower):
        data["leave_type"] = "unpaid_leave"

    if re.search(r"\bhalf\s*-?\s*day\b", lower):
        if "morning" in lower:
            data["day_duration"] = "half_day_morning"
        elif "evening" in lower:
            data["day_duration"] = "half_day_evening"
        else:
            data["day_duration"] = "half_day"
    elif re.search(r"\bfull\s*-?\s*day\b", lower):
        data["day_duration"] = "full_day"

    date = re.search(r"\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b", lower)
    if date:
        data["single_date"] = date.group(0)

    if re.search(r"\bfrom\s+([^,.;]+?)\s+to\s+([^,.;]+)", lower):
        match = re.search(r"\bfrom\s+([^,.;]+?)\s+to\s+([^,.;]+)", lower)
        if match:
            start = match.group(1).strip()
            end = match.group(2).strip()
            if _valid_leave_date(start):
                data["start_date"] = start
            if _valid_leave_date(end):
                data["end_date"] = end

    reason = re.search(r"\breason\s*[:\-]\s*(.+)$", text, flags=re.IGNORECASE)
    if reason:
        data["reason"] = reason.group(1).strip()

    return data


def _missing_fields(data: dict[str, str]) -> list[str]:
    missing: list[str] = []
    if not _valid_employee_name(data.get("employee_name")):
        missing.append("employee_name")
    if not _has_value(data.get("employee_id")):
        missing.append("employee_id")
    if _normalize_leave_type(data.get("leave_type")) not in _ALLOWED_LEAVE_TYPES:
        missing.append("leave_type")

    has_single = _valid_leave_date(data.get("single_date"))
    has_range = _valid_leave_date(data.get("start_date")) and _valid_leave_date(data.get("end_date"))
    if not has_single and not has_range:
        missing.extend([field for field in ["start_date", "end_date"] if not _valid_leave_date(data.get(field))])

    if not _valid_day_duration(data.get("day_duration")):
        missing.append("day_duration")
    if not _valid_reason(data.get("reason")):
        missing.append("reason")
    return missing


def _next_question(field: str) -> str:
    return {
        "employee_name": "What is the employee name?",
        "employee_id": "What is the employee ID?",
        "leave_type": "What is the leave type? Choose one: Annual leave, Sick leave, Casual leave, or Unpaid leave.",
        "start_date": "What is the start date? Use YYYY-MM-DD.",
        "end_date": "What is the end date? Use YYYY-MM-DD.",
        "day_duration": "Is this Full day or Half day? If half day, mention morning or evening.",
        "reason": "Please provide the reason for leave.",
    }.get(field, f"Please provide {field.replace('_', ' ')}.")


@traceable(name="Leave Request Agent", run_type="chain")
async def submit_leave_request(company_id: str, employee_message: str, draft: dict | None = None) -> dict:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    merged: dict[str, str] = {k: str(v).strip() for k, v in (draft or {}).items() if v is not None and str(v).strip()}
    merged.update(_extract_fields(employee_message))
    merged["leave_type"] = _normalize_leave_type(merged.get("leave_type"))

    missing = _missing_fields(merged)
    if missing:
        return {
            "status": "needs_more_info",
            "message": _next_question(missing[0]),
            "missing_fields": missing,
            "request": None,
            "draft": merged,
            "next_question": _next_question(missing[0]),
        }

    now = datetime.now(timezone.utc)
    record = {
        "company_id": company_id,
        "employee_name": merged.get("employee_name", ""),
        "employee_id": merged.get("employee_id", ""),
        "leave_type": merged.get("leave_type", ""),
        "start_date": merged.get("start_date"),
        "end_date": merged.get("end_date"),
        "single_date": merged.get("single_date"),
        "day_duration": merged.get("day_duration"),
        "reason": merged.get("reason"),
        "summary": f"Leave Request: {merged.get('employee_name', 'Employee')} requested {merged.get('leave_type', 'leave')}",
        "raw_message": employee_message,
        "status": "submitted",
        "submitted_at": now,
    }
    result = await db.database["leave_requests"].insert_one(record)

    return {
        "status": "submitted",
        "message": "Leave request submitted to managers dashboard.",
        "missing_fields": [],
        "request": {
            "id": str(result.inserted_id),
            **{k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in record.items() if k != "company_id"},
        },
        "draft": merged,
        "next_question": None,
    }


async def list_leave_requests(company_id: str) -> list[dict]:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    cursor = db.database["leave_requests"].find({"company_id": company_id}).sort("submitted_at", -1)
    items: list[dict] = []
    async for row in cursor:
        submitted_at = row.get("submitted_at")
        items.append(
            {
                "id": str(row.get("_id")),
                "company_id": str(row.get("company_id", "")),
                "employee_name": row.get("employee_name", ""),
                "employee_id": row.get("employee_id"),
                "leave_type": row.get("leave_type", ""),
                "start_date": row.get("start_date"),
                "end_date": row.get("end_date"),
                "single_date": row.get("single_date"),
                "day_duration": row.get("day_duration"),
                "reason": row.get("reason"),
                "summary": row.get("summary"),
                "status": row.get("status", "submitted"),
                "submitted_at": submitted_at.isoformat() if submitted_at else None,
            }
        )
    return items
