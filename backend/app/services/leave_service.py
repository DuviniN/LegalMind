from app.services.agent_client import agent_get


async def list_leave_requests(company_id: str) -> list[dict]:
    response = await agent_get("/leave/requests", params={"company_id": company_id})
    return response.get("requests", [])
