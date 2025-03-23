from typing import Type, Any, Dict, List

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool

from src import logging

logger = logging.getLogger(__name__)


class SaveBookingToolInput(BaseModel):
    restaurant_name: str = Field(
        description="Name of the restaurant to get table information"
    )
    date: str = Field(description="Reservation date, format dd/mm/yyyy")
    time_window: List[str] = Field(
        description="Reservation time window, start time, end time, end time can be 00:00, format hh:mm"
    )
    number_of_person: int = Field(
        description="Number of people to book reservation for"
    )
    user_name: str = Field(description="Name of the user")
    mobile_number: str = Field(description="Mobile number of the user")


class SaveBookingTool(BaseTool):
    name: str = "save_booking"
    description: str = "Save booking into to the database via API"
    args_schema: Type[BaseModel] = SaveBookingToolInput

    """Call the actual API to save the booking data
    """

    def _run(self, **kwargs) -> Dict[str, Any]:
        """Synchronous API call."""
        args = SaveBookingToolInput.model_validate(kwargs)
        return f"Your booking {args.restaurant_name} on {args.date} is saved, booking id: 123456"

    async def _arun(self, **kwargs) -> Dict[str, Any]:
        """Asynchronous API call."""
        args = SaveBookingToolInput.model_validate(kwargs)
        return f"Your booking {args.restaurant_name} on {args.date} is saved, booking id: 123456"
