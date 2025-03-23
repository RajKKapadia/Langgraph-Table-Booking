from typing import Type, Any, Dict, List

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool


class JoinWaitingListToolInput(BaseModel):
    restaurant_name: str = Field(description="Name of the restaurant")
    date: str = Field(description="Reservation date, format dd/mm/yyyy")
    time_window: List[str] = Field(
        description="Reservation time window, start time, end time, end time can be 00:00, format hh:mm"
    )
    number_of_person: int = Field(
        description="Number of people to book reservation for"
    )
    user_name: str = Field(description="Name of the user")
    mobile_number: str = Field(description="Mobile number of the user")


class JoinWaitingListTool(BaseTool):
    name: str = "join_waiting_list"
    description: str = "Add user into to the waiting list in the database via API"
    args_schema: Type[BaseModel] = JoinWaitingListToolInput

    """Call the actual API to save in to waiting list
    """

    def _run(self, **kwargs) -> Dict[str, Any]:
        """Synchronous API call."""
        args = JoinWaitingListToolInput.model_validate(kwargs)
        return f"Your are now in the waiting list at {args.restaurant_name}, your number is 3rd in the queue."

    async def _arun(self, **kwargs) -> Dict[str, Any]:
        """Asynchronous API call."""
        args = JoinWaitingListToolInput.model_validate(kwargs)
        return f"Your are now in the waiting list at {args.restaurant_name}, your number is 3rd in the queue."
