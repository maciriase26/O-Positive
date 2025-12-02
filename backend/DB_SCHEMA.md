# Database Schema Documentation

## Overview
This document describes the initial database schema for the O-Positive fitness application.

## Tables

### `users`
Stores user account information and fitness profile data.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | User's email (unique) |
| password_hash | VARCHAR(255) | Hashed password |
| age | INTEGER | User's age |
| height | DECIMAL(5,2) | Height in cm |
| weight | DECIMAL(6,2) | Weight in kg |
| goals | TEXT | Fitness goals (e.g., "lose weight", "build muscle") |
| experience | VARCHAR(50) | Fitness experience level (e.g., "beginner", "intermediate", "advanced") |
| preferences | JSONB | User preferences (e.g., workout types, dietary restrictions) |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

### `friends`
Pivot table for managing user friendships with status tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| friend_id | INTEGER | Foreign key to users(id) |
| status | VARCHAR(50) | Friendship status: 'pending', 'accepted', 'blocked' |
| created_at | TIMESTAMP | Friendship request creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- UNIQUE(user_id, friend_id) - Prevent duplicate friendships
- CHECK (user_id != friend_id) - Users cannot friend themselves
- ON DELETE CASCADE - Remove friendships when users are deleted

### `workouts`
Stores workout templates and exercise information.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Workout name |
| type | VARCHAR(50) | Workout type: 'home' or 'gym' |
| equipment | TEXT | Required equipment (comma-separated or JSON) |
| muscles | TEXT | Target muscle groups (comma-separated or JSON) |
| instructions | TEXT | Detailed exercise instructions |
| image_url | VARCHAR(500) | URL to workout image |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- CHECK (type IN ('home', 'gym')) - Only allow valid workout types

### `water_logs`
Tracks daily water intake for users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| amount | DECIMAL(10,2) | Amount of water consumed |
| unit | VARCHAR(50) | Unit of measurement (default: 'ml') |
| logged_at | TIMESTAMP | When the water was consumed |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `steps_logs`
Tracks daily step count for users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| steps | INTEGER | Number of steps |
| logged_at | TIMESTAMP | When the steps were logged |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `calories_logs`
Tracks food intake and calorie consumption.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| food_name | VARCHAR(255) | Name of food item |
| calories | INTEGER | Total calories |
| protein | DECIMAL(8,2) | Protein in grams |
| carbs | DECIMAL(8,2) | Carbohydrates in grams |
| fat | DECIMAL(8,2) | Fat in grams |
| fiber | DECIMAL(8,2) | Fiber in grams |
| sugar | DECIMAL(8,2) | Sugar in grams |
| serving_size | VARCHAR(100) | Serving size description |
| logged_at | TIMESTAMP | When the food was consumed |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `schedules`
Stores AI-generated weekly fitness plans.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users(id) |
| week_start_date | DATE | Start date of the week |
| plan_data | JSONB | Complete AI-generated weekly plan in JSON format |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- UNIQUE(user_id, week_start_date) - One plan per user per week

**plan_data Example:**
```json
{
  "week": "2025-12-02",
  "workouts": [
    {
      "day": "Monday",
      "type": "cardio",
      "duration": 30,
      "intensity": "moderate"
    }
  ],
  "nutrition": {
    "daily_calories": 2000,
    "macros": {
      "protein": 150,
      "carbs": 200,
      "fat": 65
    }
  },
  "hydration": {
    "daily_target": 2500
  },
  "steps": {
    "daily_target": 10000
  }
}
```

## Indexes

The following indexes are created for performance optimization:

- `idx_friends_user_id` - ON friends(user_id)
- `idx_friends_friend_id` - ON friends(friend_id)
- `idx_water_logs_user_id` - ON water_logs(user_id)
- `idx_water_logs_logged_at` - ON water_logs(logged_at)
- `idx_steps_logs_user_id` - ON steps_logs(user_id)
- `idx_steps_logs_logged_at` - ON steps_logs(logged_at)
- `idx_calories_logs_user_id` - ON calories_logs(user_id)
- `idx_calories_logs_logged_at` - ON calories_logs(logged_at)
- `idx_schedules_user_id` - ON schedules(user_id)

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the backend directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=opositive
DB_PASSWORD=your_password
DB_PORT=5432
```

### 2. Create PostgreSQL Database

```bash
createdb opositive
```

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Rollback Migrations (if needed)

```bash
npm run migrate:down
```

## Design Decisions

1. **Soft Deletes**: Users table includes `deleted_at` for soft deletes, allowing data recovery and referential integrity.

2. **JSONB for Flexibility**: 
   - `preferences` in users table allows flexible user settings without schema changes
   - `plan_data` in schedules stores complex AI-generated plans

3. **Status Field**: Friends table uses status field for friendship workflows (pending → accepted or blocked).

4. **Logging Precision**: Separate log tables for water, steps, and calories allow targeted queries and time-series analysis.

5. **Timestamps**: All tables include `created_at`, `updated_at`, and critical fields include `logged_at` for business logic timestamps.

6. **Constraints**:
   - Foreign keys with CASCADE deletion ensure data consistency
   - Unique constraints prevent duplicates
   - Check constraints enforce valid values

## Queries Examples

### Get user's daily stats
```sql
SELECT 
  (SELECT COALESCE(SUM(amount), 0) FROM water_logs WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE) as water_ml,
  (SELECT COALESCE(SUM(steps), 0) FROM steps_logs WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE) as steps,
  (SELECT COALESCE(SUM(calories), 0) FROM calories_logs WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE) as calories;
```

### Get user's friends
```sql
SELECT u.id, u.name, u.email, f.status
FROM friends f
JOIN users u ON u.id = f.friend_id
WHERE f.user_id = ? AND f.status = 'accepted';
```

### Get this week's schedule
```sql
SELECT * FROM schedules 
WHERE user_id = ? AND week_start_date = DATE_TRUNC('week', CURRENT_DATE);
```
