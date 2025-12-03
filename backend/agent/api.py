"""
Workout Schedule Generator API
Standalone FastAPI server for the workout agent
Run with: uvicorn backend.agent.api:app --reload --port 8000

Endpoints:
- POST /ai/schedule - Generate schedule using LLM agent (calls Claude)
- GET /schedule/{user_id} - Fetch user's schedule (direct database)
- POST /schedule - Save schedule (direct database)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os

# Import the agent's main function
from workout_agent import generate_weekly_schedule

load_dotenv()

app = FastAPI(title="Workout Schedule Generator API", version="1.0.0")

# Enable CORS so the JavaScript backend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend/backend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# ===== Request/Response Models =====

class GenerateScheduleRequest(BaseModel):
    user_id: int
    week_start_date: Optional[str] = None  # If not provided, uses next Monday


class SaveScheduleRequest(BaseModel):
    user_id: int
    week_start_date: str
    plan_data: Dict[str, Any]  # Schedule JSON structure


# ===== API Endpoints =====

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "service": "Workout Schedule Generator API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/ai/schedule")
def generate_schedule(request: GenerateScheduleRequest):
    """
    Generate a personalized weekly workout schedule using AI agent.
    
    The JavaScript backend calls this endpoint like:
    POST http://localhost:8000/ai/schedule
    {
        "user_id": 1,
        "week_start_date": "2025-12-02"  // optional
    }
    """
    try:
        # Calculate week start date if not provided
        if request.week_start_date:
            week_start = request.week_start_date
        else:
            today = datetime.now()
            days_ahead = 0 - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            week_start = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        
        # Call the agent to generate schedule
        result = generate_weekly_schedule(request.user_id, week_start)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate schedule")
            )
        
        return {
            "success": True,
            "user_id": request.user_id,
            "week_start_date": week_start,
            "schedule": result.get("schedule"),
            "message": "Schedule generated and saved successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating schedule: {str(e)}"
        )


@app.get("/schedule/{user_id}")
def get_user_schedule(user_id: int, limit: int = 1):
    """
    Fetch user's schedule from database (direct database access, no agent).
    
    The JavaScript backend calls this like:
    GET http://localhost:8000/schedule/1?limit=1
    
    Returns the most recent schedule(s) for the user.
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT id, week_start_date, plan_data, created_at, updated_at
            FROM schedules
            WHERE user_id = %s
            ORDER BY week_start_date DESC
            LIMIT %s
        """, (user_id, limit))
        
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(
                status_code=404,
                detail="No schedules found for this user"
            )
        
        # Convert to list of dicts
        schedules = [dict(row) for row in results]
        
        return {
            "success": True,
            "user_id": user_id,
            "count": len(schedules),
            "schedules": schedules
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching schedule: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.post("/schedule")
def save_schedule(request: SaveScheduleRequest):
    """
    Save a workout schedule to database (direct database access, no agent).
    
    The JavaScript backend calls this like:
    POST http://localhost:8000/schedule
    {
        "user_id": 1,
        "week_start_date": "2025-12-02",
        "plan_data": {
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
    }
    """
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Convert plan_data dict to JSON string
        plan_json = json.dumps(request.plan_data)
        
        # Insert or update schedule
        cursor.execute("""
            INSERT INTO schedules (user_id, week_start_date, plan_data, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            ON CONFLICT (user_id, week_start_date)
            DO UPDATE SET plan_data = EXCLUDED.plan_data, updated_at = NOW()
            RETURNING id
        """, (request.user_id, request.week_start_date, plan_json))
        
        result = cursor.fetchone()
        schedule_id = result[0] if result else None
        conn.commit()
        
        return {
            "success": True,
            "message": "Schedule saved successfully",
            "schedule_id": schedule_id,
            "user_id": request.user_id,
            "week_start_date": request.week_start_date
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error saving schedule: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Run with: uvicorn backend.agent.api:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
