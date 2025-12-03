const pool = require('../db/connection');

/**
 * Seed script for initial workout data
 * Run with: npm run seed
 */

async function seedWorkouts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if workouts already exist
    const result = await client.query('SELECT COUNT(*) FROM workouts');
    if (result.rows[0].count > 0) {
      console.log('✓ Workouts table already populated, skipping seed...');
      await client.query('ROLLBACK');
      return;
    }

    const workouts = [
      {
        name: 'Push-ups',
        type: 'home',
        equipment: 'None',
        muscles: 'Chest, Shoulders, Triceps',
        instructions: 'Get in a plank position with hands shoulder-width apart. Lower your body until your chest nearly touches the floor. Push back up to the starting position. Repeat for desired reps.'
      },
      {
        name: 'Squats',
        type: 'home',
        equipment: 'None',
        muscles: 'Quadriceps, Glutes, Hamstrings',
        instructions: 'Stand with feet shoulder-width apart. Lower your body by bending your knees and hips. Keep your back straight. Push through your heels to return to starting position.'
      },
      {
        name: 'Plank',
        type: 'home',
        equipment: 'None',
        muscles: 'Core, Shoulders, Back',
        instructions: 'Hold a push-up position with forearms on the ground. Keep your body in a straight line. Hold for 20-60 seconds.'
      },
      {
        name: 'Lunges',
        type: 'home',
        equipment: 'None',
        muscles: 'Quadriceps, Glutes, Hamstrings',
        instructions: 'Step forward with one leg and lower your hips until both knees are bent at 90 degrees. Push back to starting position and alternate legs.'
      },
      {
        name: 'Burpees',
        type: 'home',
        equipment: 'None',
        muscles: 'Full Body',
        instructions: 'Squat down and place hands on ground. Jump back to plank position. Do a push-up. Jump feet back to squat position. Jump up with hands overhead.'
      },
      {
        name: 'Mountain Climbers',
        type: 'home',
        equipment: 'None',
        muscles: 'Core, Shoulders, Legs',
        instructions: 'Get in a plank position. Bring one knee towards your chest, then quickly switch legs. Continue alternating at a fast pace.'
      },
      {
        name: 'Dumbbell Bench Press',
        type: 'gym',
        equipment: 'Dumbbells, Bench',
        muscles: 'Chest, Shoulders, Triceps',
        instructions: 'Sit on a bench with dumbbells at shoulder height. Press the dumbbells upward until arms are extended. Lower back to starting position.'
      },
      {
        name: 'Barbell Deadlift',
        type: 'gym',
        equipment: 'Barbell, Weights',
        muscles: 'Back, Glutes, Hamstrings, Core',
        instructions: 'Stand with feet hip-width apart, barbell in front of shins. Grip the bar and keep it close to your body. Drive through heels to stand up with the bar.'
      },
      {
        name: 'Leg Press',
        type: 'gym',
        equipment: 'Leg Press Machine',
        muscles: 'Quadriceps, Glutes, Hamstrings',
        instructions: 'Sit in the machine with feet on the platform. Lower the platform by bending your knees. Push back to starting position.'
      },
      {
        name: 'Treadmill Running',
        type: 'gym',
        equipment: 'Treadmill',
        muscles: 'Cardiovascular, Legs',
        instructions: 'Start with a warm-up walk. Gradually increase speed to your desired pace. Maintain steady breathing throughout your run.'
      }
    ];

    for (const workout of workouts) {
      await client.query(
        `INSERT INTO workouts (name, type, equipment, muscles, instructions) 
         VALUES ($1, $2, $3, $4, $5)`,
        [workout.name, workout.type, workout.equipment, workout.muscles, workout.instructions]
      );
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully seeded ${workouts.length} workouts`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedWorkouts();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  })();
}

module.exports = { seedWorkouts };
