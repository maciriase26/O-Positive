// Example API Integration with Database
// These are sample implementations for common routes

const pool = require('./db/connection');

// ============================================
// USER ROUTES EXAMPLES
// ============================================

/**
 * Create a new user
 * POST /users
 */
async function createUser(req, res) {
  const { name, email, password_hash, age, height, weight, goals, experience } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, age, height, weight, goals, experience, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash, age, height, weight, goals, experience, '{}']
    );
    
    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get user profile
 * GET /users/:id
 */
async function getUser(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT id, name, email, age, height, weight, goals, experience, preferences, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update user profile
 * PUT /users/:id
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, age, height, weight, goals, experience, preferences } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           age = COALESCE($2, age),
           height = COALESCE($3, height),
           weight = COALESCE($4, weight),
           goals = COALESCE($5, goals),
           experience = COALESCE($6, experience),
           preferences = COALESCE($7, preferences),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND deleted_at IS NULL
       RETURNING id, name, email, updated_at`,
      [name, age, height, weight, goals, experience, preferences, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Soft delete user
 * DELETE /users/:id
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// FRIENDS ROUTES EXAMPLES
// ============================================

/**
 * Send friend request
 * POST /friends/request
 */
async function sendFriendRequest(req, res) {
  const { userId, friendId } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, status, created_at`,
      [userId, friendId]
    );
    
    res.status(201).json({ success: true, friendship: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Friendship already exists' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * Accept friend request
 * PUT /friends/:id/accept
 */
async function acceptFriendRequest(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE friends 
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING id, status, updated_at`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ success: true, friendship: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get user's friends
 * GET /users/:id/friends
 */
async function getUserFriends(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.age, f.created_at
       FROM users u
       JOIN friends f ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY u.name`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// LOGGING ROUTES EXAMPLES
// ============================================

/**
 * Log water intake
 * POST /logs/water
 */
async function logWater(req, res) {
  const { userId, amount, unit = 'ml' } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO water_logs (user_id, amount, unit, logged_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, amount, unit, logged_at`,
      [userId, amount, unit]
    );
    
    res.status(201).json({ success: true, log: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Log calories/food
 * POST /logs/calories
 */
async function logCalories(req, res) {
  const { userId, foodName, calories, protein, carbs, fat, fiber, sugar, servingSize } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO calories_logs 
       (user_id, food_name, calories, protein, carbs, fat, fiber, sugar, serving_size, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       RETURNING id, food_name, calories, logged_at`,
      [userId, foodName, calories, protein, carbs, fat, fiber, sugar, servingSize]
    );
    
    res.status(201).json({ success: true, log: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Log steps
 * POST /logs/steps
 */
async function logSteps(req, res) {
  const { userId, steps } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO steps_logs (user_id, steps, logged_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING id, steps, logged_at`,
      [userId, steps]
    );
    
    res.status(201).json({ success: true, log: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get daily summary
 * GET /users/:id/daily-summary?date=2025-12-02
 */
async function getDailySummary(req, res) {
  const { id } = req.params;
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN w.logged_at IS NOT NULL THEN w.amount ELSE 0 END), 0) as total_water_ml,
        COALESCE((SELECT SUM(steps) FROM steps_logs s WHERE s.user_id = $1 AND DATE(s.logged_at) = $2::DATE), 0) as total_steps,
        COALESCE((SELECT SUM(calories) FROM calories_logs c WHERE c.user_id = $1 AND DATE(c.logged_at) = $2::DATE), 0) as total_calories,
        COALESCE((SELECT SUM(protein) FROM calories_logs c WHERE c.user_id = $1 AND DATE(c.logged_at) = $2::DATE), 0) as total_protein,
        COALESCE((SELECT SUM(carbs) FROM calories_logs c WHERE c.user_id = $1 AND DATE(c.logged_at) = $2::DATE), 0) as total_carbs,
        COALESCE((SELECT SUM(fat) FROM calories_logs c WHERE c.user_id = $1 AND DATE(c.logged_at) = $2::DATE), 0) as total_fat
       FROM water_logs w
       WHERE w.user_id = $1 AND DATE(w.logged_at) = $2::DATE`,
      [id, date]
    );
    
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// SCHEDULES ROUTES EXAMPLES
// ============================================

/**
 * Create weekly schedule
 * POST /schedules
 */
async function createSchedule(req, res) {
  const { userId, weekStartDate, planData } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO schedules (user_id, week_start_date, plan_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, week_start_date) 
       DO UPDATE SET plan_data = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING id, week_start_date, created_at, updated_at`,
      [userId, weekStartDate, JSON.stringify(planData)]
    );
    
    res.status(201).json({ success: true, schedule: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get current week's schedule
 * GET /users/:id/schedule/current
 */
async function getCurrentSchedule(req, res) {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT id, week_start_date, plan_data, created_at, updated_at
       FROM schedules
       WHERE user_id = $1 
         AND week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No schedule found for current week' });
    }
    
    res.json({
      ...result.rows[0],
      plan_data: typeof result.rows[0].plan_data === 'string' 
        ? JSON.parse(result.rows[0].plan_data) 
        : result.rows[0].plan_data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get workouts list
 * GET /workouts?type=home
 */
async function getWorkouts(req, res) {
  const { type } = req.query;
  
  try {
    let query = 'SELECT id, name, type, equipment, muscles, image_url FROM workouts';
    const params = [];
    
    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXPORT ROUTES
// ============================================

module.exports = {
  // User routes
  createUser,
  getUser,
  updateUser,
  deleteUser,
  
  // Friend routes
  sendFriendRequest,
  acceptFriendRequest,
  getUserFriends,
  
  // Logging routes
  logWater,
  logCalories,
  logSteps,
  getDailySummary,
  
  // Schedule routes
  createSchedule,
  getCurrentSchedule,
  
  // Workout routes
  getWorkouts
};
