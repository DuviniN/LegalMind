from pydantic import BaseModel, Field


class LeaveRequestItem(BaseModel):
	id: str
	company_id: str
	employee_name: str | None = None
	employee_id: str | None = None
	department: str | None = None
	leave_type: str
	start_date: str | None = None
	end_date: str | None = None
	single_date: str | None = None
	number_of_days: float | None = None
	day_duration: str | None = None
	is_emergency: bool | None = None
	contact_during_leave: str | None = None
	leave_date: str | None = None
	leave_time: str | None = None
	reason: str | None = None
	contact_number: str | None = None
	handover_notes: str | None = None
	manager_name: str | None = None
	summary: str | None = None
	raw_message: str | None = None
	status: str
	submitted_at: str


class LeaveRequestResponse(BaseModel):
	status: str = Field(description="submitted | needs_more_info")
	message: str
	missing_fields: list[str] = Field(default_factory=list)
	request: LeaveRequestItem | None = None
	draft: dict[str, str] = Field(default_factory=dict)
	next_question: str | None = None


class LeaveRequestListResponse(BaseModel):
	requests: list[LeaveRequestItem] = Field(default_factory=list)