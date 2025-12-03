-- Useful SQL Queries for O-Positive Database

-- ============================================
-- USER STATISTICS
-- ============================================

-- Get user profile with basic stats
SELECT 
  u.id,
  u.name,
  u.email,
  u.age,
  u.height,
  u.weight,
  u.goals,
  u.experience,
  (SELECT COUNT(*) FROM friends WHERE user_id = u.id AND status = 'accepted') as friend_count,
  (SELECT COUNT(*) FROM water_logs WHERE user_id = u.id AND DATE(logged_at) = CURRENT_DATE) as water_logs_today,
  (SELECT SUM(steps) FROM steps_logs WHERE user_id = u.id AND DATE(logged_at) = CURRENT_DATE) as steps_today,
  (SELECT SUM(calories) FROM calories_logs WHERE user_id = u.id AND DATE(logged_at) = CURRENT_DATE) as calories_today
FROM users u
WHERE u.deleted_at IS NULL AND u.id = $1;

-- Get user's daily summary
SELECT 
  u.name,
  DATE(w.logged_at) as date,
  COALESCE(SUM(CASE WHEN w.logged_at IS NOT NULL THEN w.amount ELSE 0 END), 0) as total_water_ml,
  COALESCE((SELECT SUM(steps) FROM steps_logs s WHERE s.user_id = u.id AND DATE(s.logged_at) = DATE(w.logged_at)), 0) as total_steps,
  COALESCE((SELECT SUM(calories) FROM calories_logs c WHERE c.user_id = u.id AND DATE(c.logged_at) = DATE(w.logged_at)), 0) as total_calories
FROM users u
LEFT JOIN water_logs w ON u.id = w.user_id
WHERE u.id = $1
GROUP BY u.name, DATE(w.logged_at)
ORDER BY date DESC
LIMIT 30;

-- ============================================
-- FRIEND MANAGEMENT
-- ============================================

-- Get all friends of a user (accepted friendships)
SELECT 
  u.id,
  u.name,
  u.email,
  u.age,
  f.created_at as friendship_date
FROM users u
JOIN friends f ON u.id = f.friend_id
WHERE f.user_id = $1 AND f.status = 'accepted'
ORDER BY u.name;

-- Get pending friend requests
SELECT 
  u.id,
  u.name,
  u.email,
  f.created_at as request_date
FROM users u
JOIN friends f ON u.id = f.friend_id
WHERE f.user_id = $1 AND f.status = 'pending'
ORDER BY f.created_at DESC;

-- Get mutual friends between two users
SELECT 
  u.id,
  u.name,
  u.email
FROM users u
WHERE u.id IN (
  SELECT f1.friend_id FROM friends f1 WHERE f1.user_id = $1 AND f1.status = 'accepted'
  INTERSECT
  SELECT f2.friend_id FROM friends f2 WHERE f2.user_id = $2 AND f2.status = 'accepted'
);

-- ============================================
-- WORKOUT TRACKING
-- ============================================

-- Get all available workouts
SELECT 
  id,
  name,
  type,
  equipment,
  muscles,
  SUBSTR(instructions, 1, 100) as instructions_preview,
  created_at
FROM workouts
ORDER BY type, name;

-- Get home workouts vs gym workouts count
SELECT 
  type,
  COUNT(*) as workout_count
FROM workouts
GROUP BY type;

-- Get workouts by muscle group
SELECT 
  id,
  name,
  type,
  muscles,
  equipment
FROM workouts
WHERE muscles ILIKE $1 || '%'
ORDER BY name;

-- ============================================
-- LOGGING & TRACKING
-- ============================================

-- Get water intake trend (last 7 days)
SELECT 
  DATE(logged_at) as date,
  SUM(amount) as total_water_ml,
  COUNT(*) as log_entries
FROM water_logs
WHERE user_id = $1 AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(logged_at)
ORDER BY date DESC;

-- Get steps trend (last 7 days)
SELECT 
  DATE(logged_at) as date,
  SUM(steps) as total_steps,
  COUNT(*) as log_entries
FROM steps_logs
WHERE user_id = $1 AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(logged_at)
ORDER BY date DESC;

-- Get calorie intake trend (last 7 days)
SELECT 
  DATE(logged_at) as date,
  SUM(calories) as total_calories,
  ROUND(SUM(protein), 2) as total_protein,
  ROUND(SUM(carbs), 2) as total_carbs,
  ROUND(SUM(fat), 2) as total_fat,
  COUNT(*) as food_items
FROM calories_logs
WHERE user_id = $1 AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(logged_at)
ORDER BY date DESC;

-- Get top foods logged by calories
SELECT 
  food_name,
  COUNT(*) as times_logged,
  ROUND(AVG(calories)) as avg_calories,
  SUM(calories) as total_calories
FROM calories_logs
WHERE user_id = $1 AND logged_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY food_name
ORDER BY total_calories DESC
LIMIT 10;

-- Get macronutrient breakdown for a day
SELECT 
  ROUND(SUM(protein), 2) as total_protein_g,
  ROUND(SUM(carbs), 2) as total_carbs_g,
  ROUND(SUM(fat), 2) as total_fat_g,
  ROUND(SUM(fiber), 2) as total_fiber_g,
  ROUND(SUM(sugar), 2) as total_sugar_g,
  SUM(calories) as total_calories
FROM calories_logs
WHERE user_id = $1 AND DATE(logged_at) = $2;

-- ============================================
-- SCHEDULES
-- ============================================

-- Get current week's schedule
SELECT 
  id,
  week_start_date,
  plan_data,
  created_at,
  updated_at
FROM schedules
WHERE user_id = $1 
  AND week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE
ORDER BY created_at DESC;

-- Get all schedules for a user
SELECT 
  id,
  week_start_date,
  created_at,
  updated_at
FROM schedules
WHERE user_id = $1
ORDER BY week_start_date DESC
LIMIT 12;

-- Get schedules for a date range
SELECT 
  id,
  week_start_date,
  plan_data,
  created_at
FROM schedules
WHERE user_id = $1 
  AND week_start_date >= $2 
  AND week_start_date <= $3
ORDER BY week_start_date DESC;

-- ============================================
-- DATABASE MAINTENANCE
-- ============================================

-- Check total records in each table
SELECT 
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'friends', COUNT(*) FROM friends
UNION ALL
SELECT 'workouts', COUNT(*) FROM workouts
UNION ALL
SELECT 'water_logs', COUNT(*) FROM water_logs
UNION ALL
SELECT 'steps_logs', COUNT(*) FROM steps_logs
UNION ALL
SELECT 'calories_logs', COUNT(*) FROM calories_logs
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
ORDER BY table_name;

-- Get database size
SELECT 
  pg_size_pretty(pg_database_size('opositive')) as database_size;

-- Get table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Check for slow queries / most accessed tables
SELECT 
  schemaname,
  tablename,
  seq_scan,
  idx_scan,
  seq_tup_read,
  idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- ============================================
-- DATA CLEANUP
-- ============================================

-- Find users with no activity in 30 days
SELECT 
  u.id,
  u.name,
  u.email,
  u.created_at,
  MAX(GREATEST(
    (SELECT MAX(logged_at) FROM water_logs WHERE user_id = u.id),
    (SELECT MAX(logged_at) FROM steps_logs WHERE user_id = u.id),
    (SELECT MAX(logged_at) FROM calories_logs WHERE user_id = u.id)
  )) as last_activity
FROM users u
WHERE u.deleted_at IS NULL
GROUP BY u.id
HAVING MAX(GREATEST(
  (SELECT MAX(logged_at) FROM water_logs WHERE user_id = u.id),
  (SELECT MAX(logged_at) FROM steps_logs WHERE user_id = u.id),
  (SELECT MAX(logged_at) FROM calories_logs WHERE user_id = u.id)
)) < CURRENT_DATE - INTERVAL '30 days'
ORDER BY last_activity DESC;

-- Soft delete a user
UPDATE users 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE id = $1 AND deleted_at IS NULL;

-- Hard delete a user and all related data (CAUTION!)
-- Note: Foreign keys with CASCADE will handle related records
DELETE FROM users WHERE id = $1;

-- ============================================
-- USER PREFERENCES & SETTINGS
-- ============================================

-- Get user preferences (stored as JSONB)
SELECT 
  id,
  name,
  preferences
FROM users
WHERE id = $1;

-- Update user preferences
UPDATE users 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb),
  '{notification_enabled}',
  'true'::jsonb
)
WHERE id = $1;

-- Get users with specific preferences
SELECT 
  id,
  name,
  preferences
FROM users
WHERE preferences->>'workout_type' = 'home'
  AND deleted_at IS NULL;
