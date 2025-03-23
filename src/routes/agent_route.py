import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage, AnyMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from src.models.schemas import AgentChatRequest
from src import config
from src.tools.current_date_tool import CurrentTimeTool
from src.tools.table_availability_tool import GetTableAvailabilityTool
from src.tools.save_booking_tool import SaveBookingTool
from src.tools.join_waitinglist_tool import JoinWaitingListTool
from src.utils.utils import verify_token


router = APIRouter(prefix=f"/api/{config.API_VERSION}/agent", tags=["AGENT"])


def format_chat_history(agent_chat_request: AgentChatRequest) -> AnyMessage:
    formatted_messages = []
    formatted_messages.append(
        SystemMessage(
            content="""You are an AI agent to helps users book tables at restaurants and provide information about restraurants.
Never assume any value, try to use the tools otherwise always ask for clarity if the request is ambiguous.""",
            name="System",
        )
    )
    for ch in agent_chat_request.chat_history:
        formatted_messages.append(HumanMessage(content=ch.query, name="User"))
        formatted_messages.append(AIMessage(content=ch.response, name="Model"))
    formatted_messages.append(
        HumanMessage(content=agent_chat_request.query, name="User")
    )
    return formatted_messages


model = ChatOpenAI(model=config.OPENAI_MODEL, api_key=config.OPENAI_API_KEY)

tools = []

current_date_tool = CurrentTimeTool()
get_availability_tool = GetTableAvailabilityTool()
save_booking_tool = SaveBookingTool()
join_waitinglist_tool = JoinWaitingListTool()

tools.append(current_date_tool)
tools.append(get_availability_tool)
tools.append(save_booking_tool)
tools.append(join_waitinglist_tool)


@router.post("/chat", response_model=None)
async def post_chat(
    agent_chat_request: AgentChatRequest, is_varified: bool = Depends(verify_token)
):
    formatted_chat_history = format_chat_history(agent_chat_request=agent_chat_request)
    memory = MemorySaver()
    memory_config = {"configurable": {"thread_id": agent_chat_request.user_id}}
    agent_executor = create_react_agent(model=model, tools=tools, checkpointer=memory)

    async def generate():
        async for chunk in agent_executor.astream(
            input={"messages": formatted_chat_history},
            config=memory_config,
            stream_mode="updates",
        ):
            try:
                if "agent" in chunk and chunk["agent"]["messages"][0].content != "":
                    yield (
                        json.dumps(
                            {
                                "type": "answer",
                                "content": chunk["agent"]["messages"][0].content,
                            }
                        )
                        + "\n"
                    )
                if "agent" in chunk and chunk["agent"]["messages"][0].content == "":
                    for message in chunk["agent"]["messages"]:
                        for tool in message.additional_kwargs["tool_calls"]:
                            yield (
                                json.dumps(
                                    {
                                        "type": "tool_name",
                                        "content": tool["function"]["name"],
                                    }
                                )
                                + "\n"
                            )
                            if tool["function"]["arguments"] == {}:
                                yield (
                                    json.dumps(
                                        {
                                            "type": "tool_args",
                                            "content": "No arguments",
                                        }
                                    )
                                    + "\n"
                                )
                            else:
                                yield (
                                    json.dumps(
                                        {
                                            "type": "tool_args",
                                            "content": tool["function"]["arguments"],
                                        }
                                    )
                                    + "\n"
                                )
                if "tools" in chunk:
                    for tool in chunk["tools"]["messages"]:
                        if tool.content != "":
                            yield (
                                json.dumps(
                                    {
                                        "type": "tool_content",
                                        "content": tool.content,
                                    }
                                )
                                + "\n"
                            )
            except Exception as e:
                print(f"Error at /agent/chat: {e}")
                yield (
                    json.dumps({"type": "answer", "content": config.ERROR_MESSAGE})
                    + "\n"
                )

    return StreamingResponse(generate(), media_type="application/json")
