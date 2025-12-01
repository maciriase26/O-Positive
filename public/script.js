let goals = {
    water: 2000,
    steps: 10000,
    calories: 2000
};

// Initialize the dashboard
async function initDashboard() {
    try {
        // Load goals
        const goalsResponse = await fetch('/api/goals');
        goals = await goalsResponse.json();

        // Update goal displays
        document.getElementById('waterGoal').textContent = goals.water;
        document.getElementById('stepsGoal').textContent = goals.steps;
        document.getElementById('caloriesGoal').textContent = goals.calories;

        // Load current data
        await updateWaterDisplay();
        await updateStepsDisplay();
        await updateCaloriesDisplay();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Water functions
async function logWater(amount) {
    try {
        await fetch('/api/logs/water', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        });
        await updateWaterDisplay();
    } catch (error) {
        console.error('Error logging water:', error);
    }
}

async function logCustomWater() {
    const input = document.getElementById('customWater');
    const amount = parseInt(input.value);
    if (amount && amount > 0) {
        await logWater(amount);
        input.value = '';
    }
}

async function updateWaterDisplay() {
    const response = await fetch('/api/logs/water');
    const data = await response.json();

    const percentage = Math.min((data.total / goals.water) * 100, 100);
    const fillHeight = Math.min(percentage, 100);

    document.getElementById('waterAmount').textContent = `${data.total} ml`;
    document.getElementById('waterPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('waterProgressBar').style.width = `${percentage}%`;
    document.getElementById('waterFill').style.height = `${fillHeight}%`;
}

// Steps functions
async function logSteps(amount) {
    try {
        await fetch('/api/logs/steps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        });
        await updateStepsDisplay();
    } catch (error) {
        console.error('Error logging steps:', error);
    }
}

async function logCustomSteps() {
    const input = document.getElementById('customSteps');
    const amount = parseInt(input.value);
    if (amount && amount > 0) {
        await logSteps(amount);
        input.value = '';
    }
}

async function updateStepsDisplay() {
    const response = await fetch('/api/logs/steps');
    const data = await response.json();

    const percentage = Math.min((data.total / goals.steps) * 100, 100);

    document.getElementById('stepsAmount').textContent = data.total.toLocaleString();
    document.getElementById('stepsPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('stepsProgressBar').style.width = `${percentage}%`;
}

// Calories functions
async function logCalories(amount) {
    try {
        await fetch('/api/logs/calories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        });
        await updateCaloriesDisplay();
    } catch (error) {
        console.error('Error logging calories:', error);
    }
}

async function logCustomCalories() {
    const input = document.getElementById('customCalories');
    const amount = parseInt(input.value);
    if (amount && amount > 0) {
        await logCalories(amount);
        input.value = '';
    }
}

async function updateCaloriesDisplay() {
    const response = await fetch('/api/logs/calories');
    const data = await response.json();

    const percentage = Math.min((data.total / goals.calories) * 100, 100);

    document.getElementById('caloriesAmount').textContent = `${data.total} kcal`;
    document.getElementById('caloriesPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('caloriesProgressBar').style.width = `${percentage}%`;
}

// Enter key support for custom inputs
document.getElementById('customWater').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') logCustomWater();
});

document.getElementById('customSteps').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') logCustomSteps();
});

document.getElementById('customCalories').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') logCustomCalories();
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
