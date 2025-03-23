import datetime

from langchain_core.tools import BaseTool


class CurrentTimeTool(BaseTool):
    name: str = "current_time"
    description: str = "Returns the current date in DD/MM/YYYY format"

    def _run(self) -> str:
        """Synchronous current time lookup."""
        now = datetime.datetime.now(datetime.timezone.utc)
        return now.strftime("%c")

    async def _arun(self) -> str:
        """Asynchronous current time lookup."""
        now = datetime.datetime.now(datetime.timezone.utc)
        return now.strftime("%c")
