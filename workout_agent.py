from langchain.tools import tool
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain_anthropic import ChatAnthropic

from dotenv import load_dotenv
load_dotenv()

SYSTEM_PROMPT = """ You are a work out agent that helps users create a workout schedule based on their preferences and goals."""

@tool
def get_user_preferences(user_id: str) -> str:
    """Fetch user preferences for workout scheduling."""
    # In a real implementation, this would fetch data from a database or API
    return "User prefers morning workouts, 5 days a week, focusing on strength training."

Workout_Planner_agent = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-5-20250929", max_tokens=2048), # type: ignore
    system_prompt=SYSTEM_PROMPT,
    tools = [get_user_preferences],
)

