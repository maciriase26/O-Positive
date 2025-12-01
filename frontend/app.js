const API_BASE_URL = 'http://localhost:4000';

let todaysFoods = JSON.parse(localStorage.getItem('todaysFoods')) || [];
let dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 2000;

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const todaysList = document.getElementById('todaysList');
const currentCalories = document.getElementById('currentCalories');
const goalCalories = document.getElementById('goalCalories');
const progressFill = document.getElementById('progressFill');
const totalProtein = document.getElementById('totalProtein');
const totalCarbs = document.getElementById('totalCarbs');
const totalFat = document.getElementById('totalFat');
const goalInput = document.getElementById('goalInput');
const setGoalBtn = document.getElementById('setGoalBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

document.addEventListener('DOMContentLoaded', () => {
  goalInput.value = dailyGoal;
  updateDailySummary();
  renderTodaysFoods();
  checkDateReset();
});

function checkDateReset() {
  const lastDate = localStorage.getItem('lastDate');
  const today = new Date().toDateString();
  
  if (lastDate !== today) {
    todaysFoods = [];
    localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
    localStorage.setItem('lastDate', today);
    updateDailySummary();
    renderTodaysFoods();
  }
}

async function searchFoods(query) {
  if (!query.trim()) {
    searchResults.innerHTML = '';
    return;
  }

  searchResults.innerHTML = '<div class="loading">Searching</div>';

  try {
    const response = await fetch(`${API_BASE_URL}/calories/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      renderSearchResults(data.results, data.isMock);
    } else {
      searchResults.innerHTML = '<p class="empty-message">No results found. Try a different search term.</p>';
    }
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = '<p class="empty-message">Error connecting to server. Make sure the backend is running.</p>';
  }
}

function renderSearchResults(results, isMock = false) {
  searchResults.innerHTML = results.map(food => `
    <div class="food-item">
      <div class="food-info">
        <div class="food-name">${escapeHtml(food.name)}</div>
        <div class="food-details">Serving: ${food.servingSize}</div>
        <div class="food-macros">
          P: ${food.macros.protein}g | C: ${food.macros.carbs}g | F: ${food.macros.fat}g
        </div>
      </div>
      <div class="food-calories">${food.calories} kcal</div>
      <button class="add-btn" onclick='addToToday(${JSON.stringify(food).replace(/'/g, "\\'")})'>
        + Add
      </button>
    </div>
  `).join('');

  if (isMock) {
    searchResults.innerHTML = '<p style="font-size: 0.8rem; color: #888; margin-bottom: 10px; text-align: center;">Using sample data (API key not configured)</p>' + searchResults.innerHTML;
  }
}

function addToToday(food) {
  const foodWithTimestamp = {
    ...food,
    addedAt: Date.now(),
    uniqueId: `${food.id}-${Date.now()}`
  };
  
  todaysFoods.push(foodWithTimestamp);
  localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
  
  updateDailySummary();
  renderTodaysFoods();
  
  // Visual feedback
  const addBtns = document.querySelectorAll('.add-btn');
  addBtns.forEach(btn => {
    if (btn.onclick.toString().includes(food.id)) {
      btn.textContent = '✓ Added';
      setTimeout(() => {
        btn.textContent = '+ Add';
      }, 1000);
    }
  });
}

// Remove food from today's list
function removeFromToday(uniqueId) {
  todaysFoods = todaysFoods.filter(food => food.uniqueId !== uniqueId);
  localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
  
  updateDailySummary();
  renderTodaysFoods();
}

function renderTodaysFoods() {
  if (todaysFoods.length === 0) {
    todaysList.innerHTML = '<p class="empty-message">No foods added yet. Search and add foods above!</p>';
    clearAllBtn.style.display = 'none';
    return;
  }

  todaysList.innerHTML = todaysFoods.map(food => `
    <div class="food-item">
      <div class="food-info">
        <div class="food-name">${escapeHtml(food.name)}</div>
        <div class="food-details">${food.servingSize}</div>
        <div class="food-macros">
          P: ${food.macros.protein}g | C: ${food.macros.carbs}g | F: ${food.macros.fat}g
        </div>
      </div>
      <div class="food-calories">${food.calories} kcal</div>
      <button class="remove-btn" onclick="removeFromToday('${food.uniqueId}')">✕</button>
    </div>
  `).join('');

  clearAllBtn.style.display = 'block';
}

function updateDailySummary() {
  const totals = todaysFoods.reduce((acc, food) => {
    acc.calories += food.calories;
    acc.protein += food.macros.protein;
    acc.carbs += food.macros.carbs;
    acc.fat += food.macros.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  currentCalories.textContent = Math.round(totals.calories);
  goalCalories.textContent = dailyGoal;
  
  const percentage = Math.min((totals.calories / dailyGoal) * 100, 100);
  progressFill.style.width = `${percentage}%`;
  
  if (totals.calories > dailyGoal) {
    progressFill.classList.add('over-goal');
  } else {
    progressFill.classList.remove('over-goal');
  }

  totalProtein.textContent = `${Math.round(totals.protein)}g`;
  totalCarbs.textContent = `${Math.round(totals.carbs)}g`;
  totalFat.textContent = `${Math.round(totals.fat)}g`;
}

function clearAllFoods() {
  if (confirm('Are you sure you want to clear all foods for today?')) {
    todaysFoods = [];
    localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
    updateDailySummary();
    renderTodaysFoods();
  }
}

function setDailyGoal() {
  const newGoal = parseInt(goalInput.value);
  if (newGoal >= 1000 && newGoal <= 5000) {
    dailyGoal = newGoal;
    localStorage.setItem('dailyGoal', dailyGoal);
    updateDailySummary();
  } else {
    alert('Please enter a goal between 1000 and 5000 kcal');
    goalInput.value = dailyGoal;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

searchBtn.addEventListener('click', () => searchFoods(searchInput.value));

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchFoods(searchInput.value);
  }
});

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchInput.value.length >= 2) {
      searchFoods(searchInput.value);
    }
  }, 500);
});

setGoalBtn.addEventListener('click', setDailyGoal);

goalInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    setDailyGoal();
  }
});

clearAllBtn.addEventListener('click', clearAllFoods);
