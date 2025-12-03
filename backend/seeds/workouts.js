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
      },
      {
        name: 'Tricep Dips',
        type: 'home',
        equipment: 'Chair or Bench',
        muscles: 'Triceps, Shoulders, Chest',
        instructions: 'Sit on the edge of a chair with hands beside your hips. Slide forward and lower your body by bending your elbows. Push back up to starting position.'
      },
      {
        name: 'Glute Bridges',
        type: 'home',
        equipment: 'None',
        muscles: 'Glutes, Hamstrings, Core',
        instructions: 'Lie on your back with knees bent. Lift your hips by squeezing your glutes. Lower slowly and repeat.'
      },
      {
        name: 'High Knees',
        type: 'home',
        equipment: 'None',
        muscles: 'Legs, Core, Cardiovascular',
        instructions: 'Jog in place while lifting your knees as high as possible. Maintain a fast pace.'
      },
      {
        name: 'Russian Twists',
        type: 'home',
        equipment: 'None',
        muscles: 'Obliques, Core',
        instructions: 'Sit on the floor with knees bent. Lean back slightly and twist your torso side to side while keeping your core tight.'
      },
      {
        name: 'Jumping Jacks',
        type: 'home',
        equipment: 'None',
        muscles: 'Full Body, Cardiovascular',
        instructions: 'Jump your feet out while raising your arms overhead. Jump back to starting position and repeat.'
      },
      {
        name: 'Bicycle Crunches',
        type: 'home',
        equipment: 'None',
        muscles: 'Core, Obliques',
        instructions: 'Lie on your back and alternate bringing elbows to opposite knees in a pedaling motion.'
      },
      {
        name: 'Pull-Ups',
        type: 'gym',
        equipment: 'Pull-Up Bar',
        muscles: 'Back, Biceps, Shoulders',
        instructions: 'Hang from the bar with an overhand grip. Pull your body up until your chin is over the bar. Lower with control.'
      },
      {
        name: 'Seated Cable Row',
        type: 'gym',
        equipment: 'Cable Machine',
        muscles: 'Back, Biceps, Shoulders',
        instructions: 'Sit and grab the handle. Pull toward your torso while keeping your back straight. Return slowly to starting position.'
      },
      {
        name: 'Lat Pulldown',
        type: 'gym',
        equipment: 'Lat Pulldown Machine',
        muscles: 'Back, Biceps, Shoulders',
        instructions: 'Grip the bar wide and pull it down to your chest. Slowly release it back up.'
      },
      {
        name: 'Barbell Squat',
        type: 'gym',
        equipment: 'Barbell, Squat Rack',
        muscles: 'Quadriceps, Glutes, Hamstrings, Core',
        instructions: 'Position bar on your shoulders. Lower into a squat while keeping your chest up. Push through your heels to stand.'
      },
      {
        name: 'Chest Fly Machine',
        type: 'gym',
        equipment: 'Pec Deck Machine',
        muscles: 'Chest, Shoulders',
        instructions: 'Sit and bring the handles together in front of you. Slowly return to starting position with control.'
      },
      {
        name: 'Leg Curl',
        type: 'gym',
        equipment: 'Leg Curl Machine',
        muscles: 'Hamstrings',
        instructions: 'Position your legs under the pad and curl it toward your glutes. Lower slowly back down.'
      },
      {
        name: 'Shoulder Press',
        type: 'gym',
        equipment: 'Dumbbells or Machine',
        muscles: 'Shoulders, Triceps',
        instructions: 'Press the weights overhead until arms are extended. Lower slowly to shoulder height.'
      },
      {
        name: 'Stair Climber',
        type: 'gym',
        equipment: 'Stair Climber Machine',
        muscles: 'Legs, Glutes, Cardiovascular',
        instructions: 'Climb at a steady pace. Maintain proper posture and consistent breathing.'
      },
      {
        name: 'Cable Tricep Pushdown',
        type: 'gym',
        equipment: 'Cable Machine',
        muscles: 'Triceps',
        instructions: 'Hold the cable bar and push it down until your arms are fully extended. Return with control.'
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
