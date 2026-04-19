import json
import re
from datetime import datetime, timezone

from fastapi import HTTPException
from langchain_groq import ChatGroq
from langsmith import traceable

from app.core.config import settings
from app.db.mongodb import db

_llm: ChatGroq | None = None
_leave_indexes_ready = False


def _get_llm() -> ChatGroq:
	global _llm
	if _llm is None:
		if not settings.groq_api_key:
			raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in backend .env")
		_llm = ChatGroq(
			api_key=settings.groq_api_key,
			model=settings.groq_model_name or "llama-3.1-8b-instant",
			temperature=0.0,
		)
	return _llm


def _extract_json_block(text: str) -> dict:
	match = re.search(r"```json\s*(.*?)\s*```", text, flags=re.IGNORECASE | re.DOTALL)
	json_text = match.group(1) if match else text.strip()
	json_text = json_text.strip()
	return json.loads(json_text)


_REQUIRED_FIELDS = ["employee_name", "employee_id", "leave_type", "single_date_or_range", "day_duration", "reason"]
_FIELD_QUESTIONS = {
	"employee_name": "What is the employee name?",
	"employee_id": "What is the employee ID?",
	"leave_type": "What is the leave type? Choose one: Annual leave, Sick leave, Casual leave, or Unpaid leave.",
	"single_date": "What is the leave date? Type in this format: YYYY-MM-DD (example: 2026-04-20) or weekday (example: Monday).",
	"start_date": "What is the start date? Type in this format: YYYY-MM-DD.",
	"end_date": "What is the end date? Type in this format: YYYY-MM-DD.",
	"day_duration": "Is this Full day or Half day? If half day, mention morning or evening.",
	"reason": "Please provide the reason for leave.",
}

_EMPTY_LIKE_VALUES = {"", "-", "na", "n/a", "none", "nil", "unknown", "not sure"}
_WEEKDAY_WORDS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
_MONTH_PATTERN = r"jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december"
_GENERIC_REASON_PATTERN = re.compile(r"^(leave|short leave|need leave|i need leave|day off|permission)$", re.IGNORECASE)
_ALLOWED_LEAVE_TYPES = {"annual_leave", "sick_leave", "casual_leave", "unpaid_leave"}


def _normalize_leave_kind(value: str | None) -> str:
	text = (value or "").strip().lower().replace("-", "_").replace(" ", "_")
	mapping = {
		"annual": "annual_leave",
		"annual_leave": "annual_leave",
		"sick": "sick_leave",
		"sick_leave": "sick_leave",
		"casual": "casual_leave",
		"casual_leave": "casual_leave",
		"unpaid": "unpaid_leave",
		"unpaid_leave": "unpaid_leave",
	}
	return mapping.get(text, text)


def _field_question(field_name: str) -> str:
	return _FIELD_QUESTIONS.get(field_name, f"Please provide {field_name.replace('_', ' ')}.")


def _has_meaningful_value(value: str | None) -> bool:
	if value is None:
		return False
	normalized = value.strip().lower()
	return normalized not in _EMPTY_LIKE_VALUES


def _is_valid_leave_date(value: str | None) -> bool:
	if not _has_meaningful_value(value):
		return False
	text = value.strip().lower()
	if text in _WEEKDAY_WORDS:
		return True
	if text in {"today", "tomorrow", "day after tomorrow"}:
		return True
	if re.search(r"\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b", text):
		return True
	if re.search(rf"\b({_MONTH_PATTERN})\b", text):
		return True
	return False


def _parse_date(value: str | None) -> datetime | None:
	if not _is_valid_leave_date(value):
		return None
	text = (value or "").strip()
	for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d-%m", "%d/%m"]:
		try:
			parsed = datetime.strptime(text, fmt)
			if fmt in {"%d-%m", "%d/%m"}:
				parsed = parsed.replace(year=datetime.now().year)
			return parsed
		except ValueError:
			continue
	return None


def _is_valid_leave_time(value: str | None) -> bool:
	if not _has_meaningful_value(value):
		return False
	text = value.strip().lower()
	if re.search(r"\bfull\s*-?\s*day\b", text):
		return True
	if re.search(r"\bhalf\s*-?\s*day\b", text):
		return True
	if any(term in text for term in ["morning", "afternoon"]):
		return True
	if re.search(r"\b\d{1,2}(:\d{2})?\s*(am|pm)?\b", text):
		return True
	return False


def _is_valid_reason(value: str | None) -> bool:
	if not _has_meaningful_value(value):
		return False
	text = value.strip()
	lower = text.lower()
	if len(text) < 3:
		return False
	if _GENERIC_REASON_PATTERN.fullmatch(text):
		return False
	if re.search(r"\bfull\s*-?\s*day\b|\bhalf\s*-?\s*day\b", lower):
		return False
	if lower in _WEEKDAY_WORDS or lower in {"today", "tomorrow", "day after tomorrow"}:
		return False
	if re.search(r"\b\d{1,2}(:\d{2})?\s*(am|pm)?\b", lower):
		return False
	return True


def _is_valid_employee_name(value: str | None) -> bool:
	if not _has_meaningful_value(value):
		return False
	text = (value or "").strip()
	if len(text) < 2 or len(text) > 60:
		return False
	if re.search(r"\d", text):
		return False
	# Allow common real-name characters only.
	return bool(re.fullmatch(r"[A-Za-z][A-Za-z\s'.-]{1,59}", text))


def _field_invalid_message(field_name: str, user_value: str) -> str | None:
	value = user_value.strip()
	if field_name == "employee_name":
		if not _is_valid_employee_name(value):
			return (
				"That employee name is invalid. Please use letters only (spaces, apostrophe, dot, hyphen allowed), "
				"for example: Chamoda Perera."
			)
		return None

	if field_name == "employee_id":
		if not re.fullmatch(r"(?:EMP[-_/]?\d{2,}|\d{4,})", value, flags=re.IGNORECASE):
			return "That employee ID is invalid. Please provide at least 4 digits (example: 34215) or format EMP-34215."
		return None

	if field_name == "leave_type":
		normalized = _normalize_leave_kind(value)
		if normalized not in _ALLOWED_LEAVE_TYPES:
			return "That leave type is invalid. Please choose exactly one: Annual leave, Sick leave, Casual leave, Unpaid leave."
		return None

	if field_name in {"single_date", "start_date", "end_date"}:
		if not _is_valid_leave_date(value):
			return "That date is invalid. Please use YYYY-MM-DD (example: 2026-04-20) or a weekday name (example: Monday)."
		return None

	if field_name == "day_duration":
		if not _is_valid_day_duration(value):
			return "That day duration is invalid. Please answer: Full day, Half day morning, or Half day evening."
		return None

	if field_name == "reason":
		if not _is_valid_reason(value):
			return "That reason is too short or unclear. Please provide a clear reason in a few words (example: medical appointment)."
		return None

	return None


def _is_valid_day_duration(value: str | None) -> bool:
	if not _has_meaningful_value(value):
		return False
	text = (value or "").strip().lower().replace("-", "_").replace(" ", "_")
	return text in {"full_day", "half_day", "half_day_morning", "half_day_evening"}


def _compute_missing_fields(data: dict[str, str]) -> list[str]:
	missing_fields: list[str] = []
	if not _is_valid_employee_name(data.get("employee_name")):
		missing_fields.append("employee_name")

	if not _has_meaningful_value(data.get("employee_id")):
		missing_fields.append("employee_id")

	if _normalize_leave_kind(data.get("leave_type")) not in _ALLOWED_LEAVE_TYPES:
		missing_fields.append("leave_type")

	has_single = _is_valid_leave_date(data.get("single_date"))
	has_range = _is_valid_leave_date(data.get("start_date")) and _is_valid_leave_date(data.get("end_date"))
	if not has_single and not has_range:
		if not _is_valid_leave_date(data.get("start_date")):
			missing_fields.append("start_date")
		if not _is_valid_leave_date(data.get("end_date")):
			missing_fields.append("end_date")

	if not _is_valid_day_duration(data.get("day_duration")):
		missing_fields.append("day_duration")

	if not _is_valid_reason(data.get("reason")):
		missing_fields.append("reason")
	return missing_fields


def _calculate_number_of_days(data: dict[str, str]) -> float:
	day_duration = (data.get("day_duration") or "").strip().lower()
	half_day = "half" in day_duration

	if _is_valid_leave_date(data.get("single_date")):
		return 0.5 if half_day else 1.0

	start = _parse_date(data.get("start_date"))
	end = _parse_date(data.get("end_date"))
	if not start or not end:
		return 1.0
	if end < start:
		return 1.0
	days = float((end - start).days + 1)
	if half_day and days == 1:
		return 0.5
	return days


def _build_summary(parsed: dict) -> str:
	name = parsed.get("employee_name") or "Employee"
	employee_id = parsed.get("employee_id") or "Not provided"
	leave_date = parsed.get("single_date") or f"{parsed.get('start_date', '-') } to {parsed.get('end_date', '-') }"
	reason = parsed.get("reason") or "Not provided"
	return (
		f"Leave Request: {name} (Employee ID: {employee_id}) requested leave on {leave_date}. "
		f"Reason: {reason}."
	)


def _extract_direct_fields(employee_message: str) -> dict[str, str]:
	text = employee_message.strip()
	lower = text.lower()
	direct: dict[str, str] = {}

	employee_id_labeled = re.search(r"\b(?:employee\s*id|emp\s*id|id)\s*[:\-]?\s*([a-zA-Z0-9\-_/]+)", text, flags=re.IGNORECASE)
	if employee_id_labeled and employee_id_labeled.group(1).strip():
		direct["employee_id"] = employee_id_labeled.group(1).strip()
	else:
		standalone_id = re.fullmatch(r"(?:EMP[-_/]?\d{2,}|\d{4,})", text, flags=re.IGNORECASE)
		if standalone_id:
			direct["employee_id"] = standalone_id.group(0).strip()

	if re.search(r"\bfull\s*-?\s*day\b", lower):
		direct["leave_time"] = "Full day"
	elif re.search(r"\bhalf\s*-?\s*day\b", lower):
		direct["leave_time"] = "Half day"

	time_range = re.search(r"\b\d{1,2}(:\d{2})?\s*(am|pm)?\s*(to|-|until)\s*\d{1,2}(:\d{2})?\s*(am|pm)?\b", lower)
	if time_range:
		direct["leave_time"] = time_range.group(0)

	date_match = re.search(r"\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b", lower)
	if date_match:
		direct["leave_date"] = date_match.group(0)
	elif any(day in lower for day in _WEEKDAY_WORDS):
		for day in _WEEKDAY_WORDS:
			if day in lower:
				direct["leave_date"] = day.capitalize()
				break

	reason_match = re.search(r"\breason\s*[:\-]\s*(.+)$", text, flags=re.IGNORECASE)
	if reason_match and reason_match.group(1).strip():
		direct["reason"] = reason_match.group(1).strip()
	else:
		because_match = re.search(r"\b(?:because|due to)\b\s*(.+)$", text, flags=re.IGNORECASE)
		if because_match and because_match.group(1).strip():
			direct["reason"] = because_match.group(1).strip()

	name_match = re.search(r"\b(?:my\s+name\s+is|i\s+am)\s+([A-Za-z][A-Za-z\s'.-]{1,60})", text, flags=re.IGNORECASE)
	if name_match:
		direct["employee_name"] = name_match.group(1).strip()

	if re.search(r"\bannual\s*leave\b|\bannual\b", lower):
		direct["leave_type"] = "annual_leave"
	elif re.search(r"\bsick\s*leave\b|\bsick\b", lower):
		direct["leave_type"] = "sick_leave"
	elif re.search(r"\bcasual\s*leave\b|\bcasual\b", lower):
		direct["leave_type"] = "casual_leave"
	elif re.search(r"\bunpaid\s*leave\b|\bunpaid\b", lower):
		direct["leave_type"] = "unpaid_leave"

	if re.search(r"\bhalf\s*-?\s*day\b", lower):
		direct["day_duration"] = "half_day_morning" if "morning" in lower else ("half_day_evening" if "evening" in lower else "half_day")
	elif re.search(r"\bfull\s*-?\s*day\b", lower):
		direct["day_duration"] = "full_day"

	if re.search(r"\burgent\b|\bemergency\b", lower):
		direct["is_emergency"] = "true"

	email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
	phone_match = re.search(r"\+?\d[\d\s\-]{7,}\d", text)
	if email_match:
		direct["contact_during_leave"] = email_match.group(0)
	elif phone_match:
		direct["contact_during_leave"] = phone_match.group(0).strip()

	from_to = re.search(r"\bfrom\s+([^,.;]+?)\s+to\s+([^,.;]+)", lower)
	if from_to:
		start_candidate = from_to.group(1).strip()
		end_candidate = from_to.group(2).strip()
		if _is_valid_leave_date(start_candidate):
			direct["start_date"] = start_candidate
		if _is_valid_leave_date(end_candidate):
			direct["end_date"] = end_candidate

	return direct


async def _ensure_leave_indexes() -> None:
	global _leave_indexes_ready
	if _leave_indexes_ready:
		return
	if db.database is None:
		raise HTTPException(status_code=500, detail="Database connection is not ready")

	await db.database["leave_requests"].create_index([("company_id", 1), (
		"submitted_at",
		-1,
	)], name="company_submitted_idx")
	_leave_indexes_ready = True


@traceable(name="Leave Request Agent", run_type="chain")
async def submit_leave_request(company_id: str, employee_message: str, draft: dict | None = None) -> dict:
	if db.database is None:
		raise HTTPException(status_code=500, detail="Database connection is not ready")

	current_draft = draft or {}
	current_missing = _compute_missing_fields({k: str(v) for k, v in current_draft.items() if v is not None})
	next_expected_field = current_missing[0] if current_missing else None
	reason_is_next_question = bool(current_missing) and current_missing[0] == "reason"
	employee_name_is_next_question = bool(current_missing) and current_missing[0] == "employee_name"
	employee_id_is_next_question = bool(current_missing) and current_missing[0] == "employee_id"
	leave_type_is_next_question = bool(current_missing) and current_missing[0] == "leave_type"
	day_duration_is_next_question = bool(current_missing) and current_missing[0] == "day_duration"
	prompt = (
		"Extract only the fields that appear in the employee message and merge them with the current draft. "
		"Return ONLY valid JSON with these keys: employee_name, employee_id, leave_type, start_date, end_date, single_date, reason, day_duration, is_emergency, contact_during_leave, department, manager_name. "
		"Use null when a value is missing. leave_type must be one of: annual_leave, sick_leave, casual_leave, unpaid_leave. "
		"The required fields are employee_name, employee_id, leave_type, leave duration (single_date OR start_date and end_date), day_duration, and reason. "
		"If only a name is provided, ask for the missing fields one by one. Do not invent details.\n\n"
		f"Current draft: {json.dumps(current_draft)}\n"
		f"Employee message: {employee_message}"
	)

	parsed: dict
	try:
		response = _get_llm().invoke(prompt)
		parsed = _extract_json_block((response.content or "").strip())
	except Exception:
		parsed = {}

	direct_fields = _extract_direct_fields(employee_message)
	if employee_name_is_next_question and "employee_name" not in direct_fields and employee_message.strip():
		direct_fields["employee_name"] = employee_message.strip()
	if reason_is_next_question and "reason" not in direct_fields and employee_message.strip():
		direct_fields["reason"] = employee_message.strip()
	if employee_id_is_next_question and "employee_id" not in direct_fields and employee_message.strip():
		direct_fields["employee_id"] = employee_message.strip()
	if leave_type_is_next_question and "leave_type" not in direct_fields and employee_message.strip():
		direct_fields["leave_type"] = employee_message.strip()
	if day_duration_is_next_question and "day_duration" not in direct_fields:
		text = employee_message.strip().lower()
		if "full" in text:
			direct_fields["day_duration"] = "full_day"
		elif "half" in text and "morning" in text:
			direct_fields["day_duration"] = "half_day_morning"
		elif "half" in text and "evening" in text:
			direct_fields["day_duration"] = "half_day_evening"
		elif "half" in text:
			direct_fields["day_duration"] = "half_day"
		elif "morning" in text:
			direct_fields["day_duration"] = "half_day_morning"
		elif "evening" in text:
			direct_fields["day_duration"] = "half_day_evening"

	if "employee_id" in parsed and "employee_id" not in direct_fields and not _has_meaningful_value(current_draft.get("employee_id")):
		parsed.pop("employee_id", None)

	if "employee_name" in parsed and "employee_name" not in direct_fields and not _has_meaningful_value(current_draft.get("employee_name")):
		parsed.pop("employee_name", None)

	if "leave_date" in parsed and "leave_date" not in direct_fields and not _has_meaningful_value(current_draft.get("leave_date")):
		parsed.pop("leave_date", None)

	if "leave_type" in parsed and "leave_type" not in direct_fields and not _has_meaningful_value(current_draft.get("leave_type")):
		parsed.pop("leave_type", None)

	if "reason" in parsed and "reason" not in direct_fields and not _has_meaningful_value(current_draft.get("reason")):
		parsed.pop("reason", None)

	for key, value in direct_fields.items():
		if value:
			parsed[key] = value

	merged: dict[str, str] = {}
	for source in (current_draft, parsed):
		for key, value in source.items():
			if value is not None and str(value).strip():
				merged[key] = str(value).strip()

	merged["leave_type"] = _normalize_leave_kind(merged.get("leave_type"))
	if _is_valid_leave_date(merged.get("leave_date")) and not _has_meaningful_value(merged.get("single_date")):
		merged["single_date"] = merged.get("leave_date", "")
	if _has_meaningful_value(merged.get("leave_time")) and not _has_meaningful_value(merged.get("day_duration")):
		merged["day_duration"] = merged.get("leave_time", "")
	missing_fields = _compute_missing_fields(merged)

	if missing_fields:
		if next_expected_field and next_expected_field in missing_fields and employee_message.strip():
			invalid_message = _field_invalid_message(next_expected_field, employee_message)
			if invalid_message:
				return {
					"status": "needs_more_info",
					"message": invalid_message,
					"missing_fields": missing_fields,
					"request": None,
					"draft": merged,
					"next_question": _field_question(next_expected_field),
				}
		return {
			"status": "needs_more_info",
			"message": _field_question(missing_fields[0]),
			"missing_fields": missing_fields,
			"request": None,
			"draft": merged,
			"next_question": _field_question(missing_fields[0]),
		}

	merged["summary"] = _build_summary(merged)
	merged["number_of_days"] = str(_calculate_number_of_days(merged))
	await _ensure_leave_indexes()
	now = datetime.now(timezone.utc)
	record = {
		"company_id": company_id,
		"employee_name": merged.get("employee_name", ""),
		"employee_id": merged.get("employee_id", ""),
		"department": merged.get("department", ""),
		"leave_type": merged.get("leave_type"),
		"start_date": merged.get("start_date"),
		"end_date": merged.get("end_date"),
		"single_date": merged.get("single_date"),
		"number_of_days": float(merged.get("number_of_days", "1")),
		"day_duration": merged.get("day_duration"),
		"is_emergency": (merged.get("is_emergency", "").strip().lower() == "true"),
		"contact_during_leave": merged.get("contact_during_leave"),
		"leave_date": merged.get("leave_date"),
		"leave_time": merged.get("leave_time"),
		"reason": merged.get("reason"),
		"contact_number": merged.get("contact_number"),
		"handover_notes": merged.get("handover_notes"),
		"manager_name": merged.get("manager_name"),
		"summary": merged.get("summary"),
		"raw_message": employee_message,
		"status": "submitted",
		"submitted_at": now,
	}
	result = await db.database["leave_requests"].insert_one(record)
	record_id = str(result.inserted_id)

	return {
		"status": "submitted",
		"message": "Leave request submitted to managers dashboard.",
		"missing_fields": [],
		"request": {
			"id": record_id,
			"company_id": company_id,
			"employee_name": record["employee_name"],
			"employee_id": record["employee_id"],
			"department": record["department"],
			"leave_type": record["leave_type"],
			"start_date": record["start_date"],
			"end_date": record["end_date"],
			"single_date": record["single_date"],
			"number_of_days": record["number_of_days"],
			"day_duration": record["day_duration"],
			"is_emergency": record["is_emergency"],
			"contact_during_leave": record["contact_during_leave"],
			"leave_date": record["leave_date"],
			"leave_time": record["leave_time"],
			"reason": record["reason"],
			"contact_number": record["contact_number"],
			"handover_notes": record["handover_notes"],
			"manager_name": record["manager_name"],
			"summary": record["summary"],
			"raw_message": record["raw_message"],
			"status": record["status"],
			"submitted_at": now.isoformat(),
		},
		"draft": merged,
		"next_question": None,
	}


async def list_leave_requests(company_id: str) -> list[dict]:
	if db.database is None:
		raise HTTPException(status_code=500, detail="Database connection is not ready")

	await _ensure_leave_indexes()
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
				"department": row.get("department"),
				"leave_type": row.get("leave_type", ""),
				"start_date": row.get("start_date"),
				"end_date": row.get("end_date"),
				"single_date": row.get("single_date"),
				"number_of_days": row.get("number_of_days"),
				"day_duration": row.get("day_duration"),
				"is_emergency": row.get("is_emergency"),
				"contact_during_leave": row.get("contact_during_leave"),
				"leave_date": row.get("leave_date"),
				"leave_time": row.get("leave_time"),
				"reason": row.get("reason"),
				"contact_number": row.get("contact_number"),
				"handover_notes": row.get("handover_notes"),
				"manager_name": row.get("manager_name"),
				"summary": row.get("summary"),
				"raw_message": row.get("raw_message"),
				"status": row.get("status", "submitted"),
				"submitted_at": submitted_at.isoformat() if submitted_at else None,
			}
		)
	return items