# Database Setup & Migrations Guide

## Quick Start

### Prerequisites
- PostgreSQL installed and running
- Node.js and npm installed
- Backend dependencies installed (`npm install`)

### Steps

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your PostgreSQL credentials:**
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=opositive
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

3. **Create the database:**
   ```bash
   createdb opositive
   ```

4. **Run migrations:**
   ```bash
   npm run migrate
   ```

5. **(Optional) Seed initial data:**
   ```bash
   npm run seed
   ```

## Database Schema

See `DB_SCHEMA.md` for detailed documentation on all tables, columns, and relationships.

### Core Tables
- **users** - User accounts and fitness profiles
- **friends** - User friendships with status tracking
- **workouts** - Workout templates (home/gym)
- **water_logs** - Water intake tracking
- **steps_logs** - Daily step tracking
- **calories_logs** - Food intake and calorie tracking
- **schedules** - AI-generated weekly fitness plans

## Available Commands

### Run Migrations
```bash
npm run migrate
```
Executes all pending migrations and creates the schema.

### Rollback Last Migration
```bash
npm run migrate:down
```
Rolls back the most recent migration (use with caution in production).

### Seed Data
```bash
npm run seed
```
Populates initial workout templates into the database.

## Migration System

Migrations are version-controlled and tracked in the database.

### File Structure
```
backend/
├── migrations/
│   ├── index.js                           # Migration runner
│   └── 001_create_initial_schema.js       # Initial schema
├── seeds/
│   └── workouts.js                        # Workout seeding
├── db/
│   └── connection.js                      # DB connection
└── migrate.js                             # CLI entrypoint
```

### Creating New Migrations

1. Create a new file: `migrations/002_your_migration_name.js`
2. Export `up()` and `down()` functions:
   ```javascript
   async function up() {
     const client = await pool.connect();
     try {
       await client.query('BEGIN');
       // Your migration SQL here
       await client.query('COMMIT');
       console.log('Migration completed');
     } catch (error) {
       await client.query('ROLLBACK');
       throw error;
     } finally {
       client.release();
     }
   }

   async function down() {
     // Rollback logic
   }

   module.exports = { up, down };
   ```

3. Run migrations:
   ```bash
   npm run migrate
   ```

## Troubleshooting

### Connection Error: "connect ECONNREFUSED"
- Ensure PostgreSQL is running
- Check DB credentials in `.env`
- Verify database exists: `psql -l`

### Permission Denied
- Ensure PostgreSQL user has proper permissions
- Try: `ALTER USER postgres CREATEDB;`

### Database Already Exists
- Drop existing database: `dropdb opositive`
- Or use a different DB_NAME in `.env`

### Migrations Not Running
- Check `.env` file is properly configured
- Verify database exists: `psql -d opositive -c '\dt'`
- Check migrations table: `SELECT * FROM migrations;`

## Development Workflow

1. **Creating schema changes:**
   - Create new migration file
   - Write up() and down() functions
   - Test with `npm run migrate`
   - Commit to git

2. **Team collaboration:**
   - Each team member runs `npm run migrate` after pulling changes
   - Migrations are applied in order (001, 002, etc.)
   - Never modify existing migrations, create new ones

3. **Rollback procedure:**
   - Run `npm run migrate:down` to rollback last migration
   - Can only rollback one migration at a time
   - Fix issue and create a new migration for the fix

## Performance Considerations

- Indexes are created on frequently queried columns
- JSONB columns for flexible data without additional tables
- Timestamps indexed on log tables for time-range queries
- Foreign keys with CASCADE for referential integrity

## Backup & Restore

### Backup database
```bash
pg_dump opositive > opositive_backup.sql
```

### Restore database
```bash
psql opositive < opositive_backup.sql
```

## Production Deployment

1. Use environment-specific `.env` files
2. Run migrations automatically during deployment
3. Test migrations in staging first
4. Keep migration history for audit trail
5. Use read replicas for large queries
6. Monitor migration performance on large datasets

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-postgres Documentation](https://node-postgres.com/)
- [DB_SCHEMA.md](./DB_SCHEMA.md) - Detailed schema documentation
