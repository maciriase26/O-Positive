# O-Positive Database Entity Relationship Diagram

## ASCII ERD

```
┌─────────────────────────────────────┐
│           USERS                     │
├─────────────────────────────────────┤
│ PK  id                  SERIAL      │
│     name                VARCHAR     │
│     email               VARCHAR (U) │
│     password_hash       VARCHAR     │
│     age                 INTEGER     │
│     height              DECIMAL     │
│     weight              DECIMAL     │
│     goals               TEXT        │
│     experience          VARCHAR     │
│     preferences         JSONB       │
│     created_at          TIMESTAMP   │
│     updated_at          TIMESTAMP   │
│     deleted_at          TIMESTAMP   │
└─────────────────────────────────────┘
           │                      │
           │ (1:M)                │
           │                      │
    ┌──────▼──────────────────────▼──────┐
    │         FRIENDS (Pivot)            │
    ├───────────────────────────────────┤
    │ PK  id                    SERIAL   │
    │ FK  user_id  ──────────► USERS.id  │
    │ FK  friend_id ─────────► USERS.id  │
    │     status      VARCHAR (pending,  │
    │                 accepted, blocked) │
    │     created_at          TIMESTAMP  │
    │     updated_at          TIMESTAMP  │
    │ UQ  (user_id, friend_id)           │
    │ CK  user_id ≠ friend_id            │
    └──────────────────────────────────┘

┌─────────────────────────────────────┐
│         WORKOUTS                    │
├─────────────────────────────────────┤
│ PK  id                  SERIAL      │
│     name                VARCHAR     │
│     type                VARCHAR (U) │
│                         (home, gym) │
│     equipment           TEXT        │
│     muscles             TEXT        │
│     instructions        TEXT        │
│     image_url           VARCHAR     │
│     created_at          TIMESTAMP   │
│     updated_at          TIMESTAMP   │
└─────────────────────────────────────┘

┌──────────────────────────────────┐
│       WATER_LOGS (1:M)           │
├──────────────────────────────────┤
│ PK  id                 SERIAL    │
│ FK  user_id ──────► USERS.id     │
│     amount            DECIMAL    │
│     unit              VARCHAR    │
│     logged_at         TIMESTAMP  │
│     created_at        TIMESTAMP  │
│     updated_at        TIMESTAMP  │
│ IX  (user_id, logged_at)         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       STEPS_LOGS (1:M)           │
├──────────────────────────────────┤
│ PK  id                 SERIAL    │
│ FK  user_id ──────► USERS.id     │
│     steps             INTEGER    │
│     logged_at         TIMESTAMP  │
│     created_at        TIMESTAMP  │
│     updated_at        TIMESTAMP  │
│ IX  (user_id, logged_at)         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      CALORIES_LOGS (1:M)         │
├──────────────────────────────────┤
│ PK  id                 SERIAL    │
│ FK  user_id ──────► USERS.id     │
│     food_name         VARCHAR    │
│     calories          INTEGER    │
│     protein           DECIMAL    │
│     carbs             DECIMAL    │
│     fat               DECIMAL    │
│     fiber             DECIMAL    │
│     sugar             DECIMAL    │
│     serving_size      VARCHAR    │
│     logged_at         TIMESTAMP  │
│     created_at        TIMESTAMP  │
│     updated_at        TIMESTAMP  │
│ IX  (user_id, logged_at)         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       SCHEDULES (1:M)            │
├──────────────────────────────────┤
│ PK  id                 SERIAL    │
│ FK  user_id ──────► USERS.id     │
│     week_start_date   DATE       │
│     plan_data         JSONB      │
│     created_at        TIMESTAMP  │
│     updated_at        TIMESTAMP  │
│ UQ  (user_id,                    │
│      week_start_date)            │
│ IX  user_id                      │
└──────────────────────────────────┘

Legend:
PK  = Primary Key
FK  = Foreign Key
U   = Unique
UQ  = Unique Constraint
CK  = Check Constraint
IX  = Index
M   = Many
(1:M) = One-to-Many relationship
──► = Foreign Key relationship
```

## Data Flow Diagram

```
User Registration
    │
    ▼
┌────────────────────┐
│   CREATE USER      │
│   (users table)    │
└────────────────────┘
    │
    ├─────────────────────────────────┐
    │                                 │
    ▼                                 ▼
Friend Requests              Health Tracking
    │                              │
    ├──────────────┐               ├─────────────┬─────────────┐
    │              │               │             │             │
    ▼              ▼               ▼             ▼             ▼
 FRIENDS      (status:        WATER_LOGS   STEPS_LOGS   CALORIES_LOGS
            pending/accepted)
    │              │               │             │             │
    └──────────────┘               │             │             │
         │                         │             │             │
         │                         └─────────────┴─────────────┘
         │                                 │
         └─────────────┬───────────────────┘
                       │
                       ▼
             ┌──────────────────┐
             │   AI ANALYSIS    │
             │   & GENERATION   │
             └──────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   SCHEDULES      │
              │ (weekly plans)   │
              └──────────────────┘
```

## Cardinality Relationships

```
USERS (1) ◄─────────► (Many) WATER_LOGS
One user can have many water intake logs

USERS (1) ◄─────────► (Many) STEPS_LOGS
One user can have many step logs

USERS (1) ◄─────────► (Many) CALORIES_LOGS
One user can have many food intake logs

USERS (1) ◄─────────► (Many) SCHEDULES
One user can have many weekly schedules

USERS (1) ◄─────────► (Many) FRIENDS
One user can have many friendships
(Friendship is bidirectional via friend_id)

WORKOUTS (independent)
Shared across all users (read-only lookup table)
```

## State Transitions

### Friendship Status States
```
                   ┌─────────────┐
                   │   PENDING   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  ACCEPTED   │ ◄─────┐
                   └──────┬──────┘       │
                          │             │
                          │ (optional)  │
                          ▼             │
                   ┌─────────────┐      │
                   │   BLOCKED   ├──────┘
                   └─────────────┘

Actions:
- Request Friend: pending
- Accept: pending → accepted
- Unblock: blocked → accepted
- Block: pending/accepted → blocked
```

## Temporal Data Pattern

```
For each log table (water, steps, calories):

┌─────────────────────────────────────┐
│ Timestamp Hierarchy                 │
├─────────────────────────────────────┤
│ logged_at    ← When user logged it   │
│              (business timestamp)   │
│                                     │
│ created_at   ← When DB record       │
│              created (auto)         │
│                                     │
│ updated_at   ← When record updated  │
│              (maintenance)          │
└─────────────────────────────────────┘

Benefits:
- Correct time ordering for user's entries
- Audit trail for data modifications
- Support for backdating entries
```

## Indexing Strategy

```
Primary Indexes (for filtering):
├── users(id)              - Primary key, auto-indexed
├── friends(user_id)       - Find user's friendships
├── friends(friend_id)     - Find who friended a user
├── water_logs(user_id)    - Find user's water logs
├── steps_logs(user_id)    - Find user's step logs
├── calories_logs(user_id) - Find user's calorie logs
└── schedules(user_id)     - Find user's schedules

Range Query Indexes (for time queries):
├── water_logs(logged_at)    - Date range queries
├── steps_logs(logged_at)    - Date range queries
├── calories_logs(logged_at) - Date range queries
└── schedules(week_start_date) - Weekly queries

Composite Indexes (for common patterns):
├── water_logs(user_id, logged_at)
├── steps_logs(user_id, logged_at)
└── calories_logs(user_id, logged_at)
```

## JSON Schema Examples

### User Preferences (JSONB)
```json
{
  "workout_type": "home",
  "notification_enabled": true,
  "dietary_restrictions": ["vegetarian", "gluten-free"],
  "dark_mode": false,
  "language": "en",
  "metric_system": true
}
```

### Schedule Plan Data (JSONB)
```json
{
  "week": "2025-12-02",
  "workouts": [
    {
      "day": "Monday",
      "workout_id": 5,
      "duration": 45,
      "intensity": "high",
      "type": "strength"
    },
    {
      "day": "Wednesday",
      "workout_id": 8,
      "duration": 30,
      "intensity": "moderate",
      "type": "cardio"
    }
  ],
  "nutrition": {
    "daily_calories": 2000,
    "macros": {
      "protein_g": 150,
      "carbs_g": 200,
      "fat_g": 65
    },
    "meal_plan": [
      {"meal": "breakfast", "calories": 400},
      {"meal": "lunch", "calories": 600},
      {"meal": "dinner", "calories": 800},
      {"meal": "snacks", "calories": 200}
    ]
  },
  "hydration": {
    "daily_target_ml": 2500
  },
  "steps": {
    "daily_target": 10000
  }
}
```

## Performance Considerations

```
Query Patterns Optimized:
├── Get daily stats for user    → Indexed on (user_id, logged_at)
├── Get user's friends list     → Indexed on (user_id, status)
├── Get time-range data         → Indexed on (user_id, logged_at)
├── Get recent activities       → Indexes support DESC queries
└── Get unique values           → Unique constraints prevent dupes

Cascade Deletions:
├── Delete user        → Auto-delete all logs
├── Delete user        → Auto-delete friendships
└── Delete user        → Auto-delete schedules
    (Referential integrity maintained)
```

---

This schema is designed for:
✅ Scalability with proper indexing
✅ Data consistency with constraints
✅ Flexibility with JSONB fields
✅ Performance with strategic indexes
✅ Maintainability with clear structure
✅ Auditability with timestamps
