const pool = require('../db/connection');

/**
 * Migration: 001_create_initial_schema.js
 * Creates initial database schema for O-Positive app
 */

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        age INTEGER,
        height DECIMAL(5, 2),
        weight DECIMAL(6, 2),
        goals TEXT,
        experience VARCHAR(50),
        preferences JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // Create friends pivot table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id),
        CHECK (user_id != friend_id)
      );
    `);

    // Create workouts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        equipment TEXT,
        muscles TEXT,
        instructions TEXT NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (type IN ('home', 'gym'))
      );
    `);

    // Create water logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'ml',
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create steps logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS steps_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        steps INTEGER NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create calories logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS calories_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_name VARCHAR(255) NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(8, 2),
        carbs DECIMAL(8, 2),
        fat DECIMAL(8, 2),
        fiber DECIMAL(8, 2),
        sugar DECIMAL(8, 2),
        serving_size VARCHAR(100),
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create schedules table for AI-generated weekly plans
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_start_date DATE NOT NULL,
        plan_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start_date)
      );
    `);

    // Create indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_water_logs_logged_at ON water_logs(logged_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_steps_logs_user_id ON steps_logs(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_steps_logs_logged_at ON steps_logs(logged_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_calories_logs_user_id ON calories_logs(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_calories_logs_logged_at ON calories_logs(logged_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);`);

    await client.query('COMMIT');
    console.log('✓ Migration 001_create_initial_schema completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration 001_create_initial_schema failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop tables in reverse order of creation
    await client.query('DROP TABLE IF EXISTS schedules CASCADE;');
    await client.query('DROP TABLE IF EXISTS calories_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS steps_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS water_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS workouts CASCADE;');
    await client.query('DROP TABLE IF EXISTS friends CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    await client.query('COMMIT');
    console.log('✓ Rollback of migration 001_create_initial_schema completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Rollback of migration 001_create_initial_schema failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
