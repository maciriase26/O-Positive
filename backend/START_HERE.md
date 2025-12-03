
## DATABASE OVERVIEW

### 7 Core Tables
```
1. users               (1:M) → friends, water_logs, steps_logs, calories_logs, schedules
2. friends            Pivot table for user relationships
3. workouts           Reference table (read-only library)
4. water_logs         Time-series data (user hydration)
5. steps_logs         Time-series data (user activity)
6. calories_logs      Time-series data (user nutrition)
7. schedules          AI-generated weekly fitness plans
```

## QUICK START

### 1. Copy Environment File
```bash
cp backend/.env.example backend/.env
```

### 2. Edit .env with Your Credentials
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=opositive
```

### 3. Create Database
```bash
createdb opositive
```

### 4. Run Migrations
```bash
cd backend
npm run migrate
```

### 5. (Optional) Seed Workouts
```bash
npm run seed
```




## 🔧 AVAILABLE COMMANDS

```bash
# Migrations
npm run migrate              # Run pending migrations
npm run migrate:down         # Rollback last migration

# Seed Data
npm run seed                 # Populate initial workouts

# Testing
npm test                     # Run all tests
npm test __tests__/schema    # Test schema validation

# Server
npm start                    # Start Express server
```
## VERIFICATION CHECKLIST

Use this to verify everything is working:

```bash
# 1. Check files exist
ls -la backend/db/connection.js       # Should exist
ls -la backend/migrations/*.js        # Should have 2 files
ls -la backend/seeds/workouts.js      # Should exist

# 2. Test database connection
npm run migrate                       # Should run without error

# 3. Seed data
npm run seed                          # Should insert 10 workouts

# 4. Run tests
npm test __tests__/schema.test.js     # Should pass

# 5. Verify tables
psql opositive -c "\dt"               # Should list 7 tables

# 6. Count records
psql opositive -c "SELECT COUNT(*) FROM workouts"  # Should be 10
```


