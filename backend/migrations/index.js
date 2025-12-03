const fs = require('fs');
const path = require('path');
const pool = require('../db/connection');

const migrationsDir = path.join(__dirname);

/**
 * Runs pending migrations in order
 */
async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort();

    console.log(`Found ${files.length} migration(s)`);

    // Get already executed migrations
    const result = await client.query('SELECT name FROM migrations;');
    const executedMigrations = new Set(result.rows.map(row => row.name));

    // Run pending migrations
    for (const file of files) {
      const migrationName = file.replace('.js', '');
      
      if (executedMigrations.has(migrationName)) {
        console.log(`⊘ Migration ${migrationName} already executed, skipping...`);
        continue;
      }

      try {
        console.log(`→ Running migration ${migrationName}...`);
        const migration = require(path.join(migrationsDir, file));
        await migration.up();
        
        // Record migration in database
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1);',
          [migrationName]
        );
        
        console.log(`✓ Migration ${migrationName} completed`);
      } catch (error) {
        console.error(`✗ Migration ${migrationName} failed:`, error.message);
        throw error;
      }
    }

    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rolls back the last migration
 */
async function rollbackMigration() {
  const client = await pool.connect();
  try {
    // Get the last executed migration
    const result = await client.query(`
      SELECT name FROM migrations 
      ORDER BY executed_at DESC 
      LIMIT 1;
    `);

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const migrationName = result.rows[0].name;
    const file = `${migrationName}.js`;
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file ${file} not found`);
    }

    try {
      console.log(`→ Rolling back migration ${migrationName}...`);
      const migration = require(filePath);
      await migration.down();
      
      // Remove migration from database
      await client.query(
        'DELETE FROM migrations WHERE name = $1;',
        [migrationName]
      );
      
      console.log(`✓ Migration ${migrationName} rolled back`);
    } catch (error) {
      console.error(`✗ Rollback of migration ${migrationName} failed:`, error.message);
      throw error;
    }
  } catch (error) {
    console.error('Rollback process failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations, rollbackMigration };
