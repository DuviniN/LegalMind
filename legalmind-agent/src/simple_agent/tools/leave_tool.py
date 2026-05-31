from simple_agent.services.leave_service import list_leave_requests, submit_leave_request


class LeaveTool:
    async def submit(self, *, company_id: str, message: str, draft: dict | None = None) -> dict:
        return await submit_leave_request(company_id=company_id, employee_message=message, draft=draft)

    async def list(self, *, company_id: str) -> list[dict]:
        return await list_leave_requests(company_id=company_id)


leave_tool = LeaveTool()
