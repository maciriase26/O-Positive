const pool = require('../db/connection');

describe('Database Schema', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('Tables Existence', () => {
    test('should have users table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have friends table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'friends'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have workouts table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'workouts'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have water_logs table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'water_logs'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have steps_logs table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'steps_logs'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have calories_logs table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'calories_logs'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have schedules table', async () => {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'schedules'
        )`
      );
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Users Table Columns', () => {
    test('should have required columns', async () => {
      const result = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'users'
         ORDER BY ordinal_position`
      );
      const columns = result.rows.map(r => r.column_name);
      
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('password_hash');
      expect(columns).toContain('age');
      expect(columns).toContain('height');
      expect(columns).toContain('weight');
      expect(columns).toContain('goals');
      expect(columns).toContain('experience');
      expect(columns).toContain('preferences');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
      expect(columns).toContain('deleted_at');
    });
  });

  describe('Friends Table Constraints', () => {
    test('should prevent duplicate friendships', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insert a user first
        const userResult = await client.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
          ['Test User', 'test@example.com', 'hash123']
        );
        const userId = userResult.rows[0].id;

        // Insert a friend relationship
        await client.query(
          'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
          [userId, userId + 1, 'pending']
        );

        // Try to insert duplicate - should fail
        await expect(
          client.query(
            'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
            [userId, userId + 1, 'pending']
          )
        ).rejects.toThrow();

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });

  describe('Workouts Table Constraints', () => {
    test('should only allow valid workout types', async () => {
      const client = await pool.connect();
      try {
        // Valid type
        await client.query(
          'INSERT INTO workouts (name, type, instructions) VALUES ($1, $2, $3)',
          ['Test Workout', 'home', 'Do push-ups']
        );

        // Clean up
        await client.query('DELETE FROM workouts WHERE name = $1', ['Test Workout']);

        // Invalid type should fail
        await expect(
          client.query(
            'INSERT INTO workouts (name, type, instructions) VALUES ($1, $2, $3)',
            ['Test Workout', 'invalid', 'Do push-ups']
          )
        ).rejects.toThrow();
      } finally {
        client.release();
      }
    });
  });

  describe('Schedules Table Constraints', () => {
    test('should enforce unique user_id and week_start_date combination', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert a user
        const userResult = await client.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
          ['Schedule User', 'schedule@example.com', 'hash456']
        );
        const userId = userResult.rows[0].id;

        // Insert first schedule
        await client.query(
          'INSERT INTO schedules (user_id, week_start_date, plan_data) VALUES ($1, $2, $3)',
          [userId, '2025-12-01', JSON.stringify({ week: 1 })]
        );

        // Try to insert duplicate - should fail
        await expect(
          client.query(
            'INSERT INTO schedules (user_id, week_start_date, plan_data) VALUES ($1, $2, $3)',
            [userId, '2025-12-01', JSON.stringify({ week: 1 })]
          )
        ).rejects.toThrow();

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });

  describe('Indexes', () => {
    test('should have indexes for performance', async () => {
      const result = await pool.query(
        `SELECT indexname FROM pg_indexes 
         WHERE tablename IN ('friends', 'water_logs', 'steps_logs', 'calories_logs', 'schedules')
         ORDER BY indexname`
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
