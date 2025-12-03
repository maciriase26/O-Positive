"""
Workout Schedule Generator Agent
LangChain agent with PostgreSQL database tools
"""

from langchain.tools import tool
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain_anthropic import ChatAnthropic
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

# Database connection helper
def get_db_connection():
    """Create PostgreSQL database connection"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


SYSTEM_PROMPT = """You are a Workout Planning Agent that creates personalized weekly workout schedules.

You have access to tools to:
1. Fetch user profiles (age, weight, goals, experience level, preferences)
2. Get available workouts from the database (exercises for home/gym)
3. Check user's previous schedules to ensure variety
4. Save generated schedules to the database

Create balanced weekly schedules based on user's fitness goals, experience level, and available equipment.

Return schedules in this JSON structure:
{
  "workouts": [
    {
      "day": "Monday",
      "workout_ids": [1, 5, 8],
      "duration_minutes": 45,
      "intensity": "high",
      "notes": "Focus on upper body"
    }
  ],
  "rest_days": ["Sunday"],
  "weekly_summary": {
    "total_workouts": 4,
    "total_duration_minutes": 180,
    "primary_focus": "strength_training"
  }
}
"""


@tool
def get_user_profile(user_id: int) -> dict:
    """Fetch user's fitness profile from database."""
    conn = get_db_connection()
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, name, age, height, weight, goals, experience, preferences
            FROM users 
            WHERE id = %s AND deleted_at IS NULL
        """, (user_id,))
        result = cursor.fetchone()
        return dict(result) if result else {"error": "User not found"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cursor:
            cursor.close()
        conn.close()


@tool
def get_available_workouts(workout_type: str = "") -> list:
    """Get list of available workouts. Filter by 'home' or 'gym' if specified."""
    conn = get_db_connection()
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if workout_type and workout_type in ['home', 'gym']:
            cursor.execute("""
                SELECT id, name, type, equipment, muscles, instructions
                FROM workouts
                WHERE type = %s
                ORDER BY name
            """, (workout_type,))
        else:
            cursor.execute("""
                SELECT id, name, type, equipment, muscles, instructions
                FROM workouts
                ORDER BY name
            """)
        results = cursor.fetchall()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error fetching workouts: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        conn.close()


@tool
def get_previous_schedules(user_id: int, limit: int = 4) -> list:
    """Get user's previous workout schedules for context."""
    conn = get_db_connection()
    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT week_start_date, plan_data, created_at
            FROM schedules
            WHERE user_id = %s
            ORDER BY week_start_date DESC
            LIMIT %s
        """, (user_id, limit))
        results = cursor.fetchall()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error fetching schedules: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        conn.close()


@tool
def save_workout_schedule(user_id: int, week_start_date: str, plan_data: str) -> str:
    """Save generated workout schedule to database."""
    conn = get_db_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Convert to JSON if it's a dict
        if isinstance(plan_data, dict):
            plan_data = json.dumps(plan_data)
        
        cursor.execute("""
            INSERT INTO schedules (user_id, week_start_date, plan_data, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            ON CONFLICT (user_id, week_start_date)
            DO UPDATE SET plan_data = EXCLUDED.plan_data, updated_at = NOW()
            RETURNING id
        """, (user_id, week_start_date, plan_data))
        
        result = cursor.fetchone()
        schedule_id = result[0] if result else None
        conn.commit()
        return f"Schedule saved successfully with ID: {schedule_id}"
    except Exception as e:
        conn.rollback()
        return f"Error saving schedule: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        conn.close()


# Create the agent
Workout_Planner_agent = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=2048),  # type: ignore
    system_prompt=SYSTEM_PROMPT,
    tools=[
        get_user_profile,
        get_available_workouts,
        get_previous_schedules,
        save_workout_schedule
    ],
)


def generate_weekly_schedule(user_id: int, week_start_date: str | None = None) -> dict:
    """
    Main function to generate a weekly workout schedule.
    This is called by the FastAPI endpoints.
    """
    # Calculate week start date if not provided
    calculated_date: str
    if not week_start_date:
        today = datetime.now()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        calculated_date = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    else:
        calculated_date = week_start_date
    
    try:
        # Create prompt for the agent
        prompt = f"""
Generate a personalized weekly workout schedule for user ID {user_id} starting on {calculated_date}.

Steps:
1. Use get_user_profile to fetch their goals, experience, and preferences
2. Use get_available_workouts to see what exercises are available
3. Use get_previous_schedules to check what they've done recently
4. Create a balanced weekly schedule
5. Use save_workout_schedule to save it with user_id={user_id} and week_start_date="{calculated_date}"

Return the complete schedule as JSON.
"""
        
        # Invoke the agent
        response = Workout_Planner_agent.invoke({
            "messages": [HumanMessage(content=prompt)]
        })
        
        return {
            "success": True,
            "user_id": user_id,
            "week_start_date": calculated_date,
            "schedule": response["messages"][-1].content
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "week_start_date": calculated_date
        }

