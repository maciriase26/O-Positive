"""
Simple test script to verify the workout agent works
Run with: python backend/agent/test_agent.py
"""

from workout_agent import (
    get_user_profile,
    get_available_workouts,
    get_previous_schedules,
    generate_weekly_schedule
)

print("=" * 60)
print("Testing Workout Agent")
print("=" * 60)

# Test 1: Get user profile
print("\n1. Testing get_user_profile...")
try:
    profile = get_user_profile.invoke({"user_id": 1})
    if "error" in profile:
        print(f"   ⚠️  {profile['error']}")
        print("   Make sure you have a user with ID=1 in the database")
    else:
        print(f"   ✅ Found user: {profile.get('name')}")
        print(f"      Goals: {profile.get('goals')}")
        print(f"      Experience: {profile.get('experience')}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Get available workouts
print("\n2. Testing get_available_workouts...")
try:
    workouts = get_available_workouts.invoke({"workout_type": ""})
    print(f"   ✅ Found {len(workouts)} workouts in database")
    if workouts:
        print(f"      Examples: {', '.join([w['name'] for w in workouts[:3]])}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Get previous schedules
print("\n3. Testing get_previous_schedules...")
try:
    schedules = get_previous_schedules.invoke({"user_id": 1, "limit": 3})
    if schedules:
        print(f"   ✅ Found {len(schedules)} previous schedules")
    else:
        print(f"   ℹ️  No previous schedules (this is ok for new users)")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Generate schedule (full agent test)
print("\n4. Testing generate_weekly_schedule (LLM agent)...")
print("   This will take 10-30 seconds...")
try:
    result = generate_weekly_schedule(user_id=1)
    if result.get("success"):
        print(f"   ✅ Schedule generated successfully!")
        print(f"      Week starting: {result.get('week_start_date')}")
        print(f"      Schedule preview: {str(result.get('schedule'))[:200]}...")
    else:
        print(f"   ❌ Failed: {result.get('error')}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("Test complete!")
print("=" * 60)
print("\nIf all tests passed, you can start the API server:")
print("  uvicorn backend.agent.api:app --reload --port 8000")
print("\nThen test the API:")
print("  curl http://localhost:8000/")
print("  curl -X POST http://localhost:8000/ai/schedule -H 'Content-Type: application/json' -d '{\"user_id\": 1}'")
