from fastapi import APIRouter, Depends

from app.api.dependencies import get_chat_company
from app.schemas.leave import LeaveRequestListResponse
from app.services.leave_service import list_leave_requests

router = APIRouter(tags=["leave"])


@router.get("/leave/requests", response_model=LeaveRequestListResponse)
async def get_leave_requests(company: dict = Depends(get_chat_company)):
	items = await list_leave_requests(company_id=str(company["_id"]))
	return {"requests": items}