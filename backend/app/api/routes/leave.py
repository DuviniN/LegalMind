from fastapi import APIRouter, Depends

from app.api.dependencies import get_chat_company
from app.schemas.leave import LeaveRequestCreate, LeaveRequestListResponse, LeaveRequestResponse
from app.services.leave_service import list_leave_requests, submit_leave_request

router = APIRouter(tags=["leave"])


@router.post("/leave/request", response_model=LeaveRequestResponse)
async def create_leave_request(payload: LeaveRequestCreate, company: dict = Depends(get_chat_company)):
	return await submit_leave_request(company_id=str(company["_id"]), employee_message=payload.message, draft=payload.draft)


@router.get("/leave/requests", response_model=LeaveRequestListResponse)
async def get_leave_requests(company: dict = Depends(get_chat_company)):
	items = await list_leave_requests(company_id=str(company["_id"]))
	return {"requests": items}