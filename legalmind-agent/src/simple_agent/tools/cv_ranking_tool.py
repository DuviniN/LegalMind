import json
import re
from datetime import datetime, timezone
from typing import Any

from fastapi.concurrency import run_in_threadpool

from simple_agent.db.mongodb import db
from simple_agent.services.rag_service import _get_llm


def _safe_json_loads(text: str) -> dict[str, Any] | None:
    raw = (text or "").strip()
    if not raw:
        return None
    match = re.search(r"```json\s*(.*?)\s*```", raw, flags=re.IGNORECASE | re.DOTALL)
    if match:
        raw = match.group(1).strip()
    try:
        value = json.loads(raw)
    except Exception:
        return None
    return value if isinstance(value, dict) else None


class CVRankingTool:
    async def rank(self, *, vacancy: dict, applications: list[dict]) -> list[dict]:
        results = []
        for application in applications:
            score, summary = await run_in_threadpool(self._rank_one, vacancy, application)
            now = datetime.now(timezone.utc)
            await db.database["cv_applications"].update_one(
                {"_id": application["_id"]},
                {"$set": {"match_score": score, "match_summary": summary, "ranked_at": now}},
            )
            applied_at = application.get("applied_at")
            results.append(
                {
                    "id": str(application["_id"]),
                    "vacancy_id": str(application["vacancy_id"]),
                    "candidate_name": application.get("candidate_name", ""),
                    "candidate_email": application.get("candidate_email", ""),
                    "candidate_phone": application.get("candidate_phone"),
                    "cv_file_name": application.get("cv_file_name", ""),
                    "match_score": score,
                    "match_summary": summary,
                    "ranked_at": now.isoformat(),
                    "applied_at": applied_at.isoformat() if applied_at else None,
                }
            )
        return sorted(results, key=lambda item: item["match_score"], reverse=True)

    def _rank_one(self, vacancy: dict, application: dict) -> tuple[int, str]:
        cv_text = (application.get("cv_text") or "").strip()
        if not cv_text:
            return 0, "No extractable text found in CV."

        prompt = (
            "You are an HR recruiting assistant. Compare the candidate's CV against the job "
            "requirements and return ONLY valid JSON like "
            '{"score": 78, "summary": "short explanation"}.\n'
            "score: integer 0-100 representing how well the CV matches the requirements.\n"
            "summary: one or two sentences explaining the score (key matching/missing skills).\n\n"
            f"Job Title: {vacancy.get('title', '')}\n"
            f"Job Requirements:\n{vacancy.get('requirements', '')}\n\n"
            f"Candidate CV Text:\n{cv_text[:6000]}\n"
        )
        try:
            response = _get_llm().invoke(prompt)
            payload = _safe_json_loads(getattr(response, "content", "") or "")
            score = int((payload or {}).get("score", 0))
            score = max(0, min(100, score))
            summary = ((payload or {}).get("summary") or "").strip() or "No summary available."
        except Exception:
            score, summary = 0, "Ranking failed: could not reach the language model."
        return score, summary


cv_ranking_tool = CVRankingTool()
