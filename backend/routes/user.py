from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from database import get_db_connection

router = APIRouter(prefix="/api", tags=["users"])

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=13, le=120)
    height: float = Field(..., gt=0, lt=250, description="Height in cm")
    weight: float = Field(..., gt=30, lt=300, description="Weight in kg")
    goal: Literal['lose_fat', 'gain_muscle', 'maintain']
    experienceLevel: Literal['beginner', 'intermediate', 'advanced']
    daysPerWeek: int = Field(default=3, ge=1, le=7)
    workout_location: Literal['home', 'gym', 'both'] = Field(..., description="Preferred workout location")
    diet_preference: Optional[Literal["standard", "vegetarian", "vegan", "keto", "paleo"]] = None


class UserResponse(BaseModel):
    id: int
    name: str
    age: int
    height: float
    weight: float
    goal: str
    experience_level: str
    days_per_week: int
    workout_location: str
    diet_preference: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# POST /api/users - Create or update user profile
@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_or_update_user(user: UserCreate, user_id: Optional[int] = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if user_id:
            # UPDATE existing user
            cursor.execute("""
                UPDATE users 
                SET name = %s, age = %s, height = %s, weight = %s, goal = %s,
                    experience_level = %s, days_per_week = %s, workout_location = %s, diet_preference = %s, updated_at = NOW()
                WHERE id = %s
                RETURNING *
            """, (
                user.name, user.age, user.height, user.weight, user.goal,
                user.experienceLevel,user.daysPerWeek, user.workout_location,
                user.diet_preference, user_id
            ))
            
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            conn.commit()
            return {
                "message": "Profile updated successfully",
                "user": dict(result)
            }
        else:
            # CREATE new user
            cursor.execute("""
                INSERT INTO users 
                (name, age, height, weight, goal, experience_level, days_per_week, workout_location,
                diet_preference, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING *
            """, (
                user.name, user.age, user.height, user.weight, user.goal,
                user.experienceLevel, user.daysPerWeek, user.workout_location, user.diet_preference
                
            ))
            
            result = cursor.fetchone()
            conn.commit()
            
            return {
                "message": "Profile created successfully",
                "user": dict(result)
            }
            
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        conn.close()

# GET /api/users/:id - Fetch user profile
@router.get("/users/{user_id}", response_model=dict)
async def get_user(user_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"user": dict(result)}
        
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        conn.close()