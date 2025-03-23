from typing import Type, Any, Dict, List
from random import random

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool


class GetTableAvailabilityToolInput(BaseModel):
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


class GetTableAvailabilityTool(BaseTool):
    name: str = "get_table_availability"
    description: str = "Get reservation info for a table via API"
    args_schema: Type[BaseModel] = GetTableAvailabilityToolInput

    """Call the actual API to fetch the real data about the table availability
    """

    def _run(self, **kwargs) -> Dict[str, Any]:
        """Synchronous API call."""
        args = GetTableAvailabilityToolInput.model_validate(kwargs)
        if random() > 0.5:
            return f"We have seats available at {args.restaurant_name} for {args.date}. Do you want to go ahead and book the table?"
        else:
            return f"We don't have seats available at {args.restaurant_name} for {args.date}. Do you want me to put you in waiting list?"

    async def _arun(self, **kwargs) -> Dict[str, Any]:
        """Asynchronous API call."""
        args = GetTableAvailabilityToolInput.model_validate(kwargs)
        if random() > 0.5:
            return f"We have seats available at {args.restaurant_name} for {args.date}. Do you want to go ahead and book the table?"
        else:
            return f"We don't have seats available at {args.restaurant_name} for {args.date}. Do you want me to put you in waiting list?"
