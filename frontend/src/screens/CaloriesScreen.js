import React, { useState, useEffect } from 'react';
import './CaloriesScreen.css';

const API_BASE_URL = 'http://localhost:4000';

function CaloriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [todaysFoods, setTodaysFoods] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [goalInput, setGoalInput] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedFoods = JSON.parse(localStorage.getItem('todaysFoods')) || [];
    const savedGoal = parseInt(localStorage.getItem('dailyGoal')) || 2000;
    const lastDate = localStorage.getItem('lastDate');
    const today = new Date().toDateString();

    if (lastDate !== today) {
      localStorage.setItem('todaysFoods', JSON.stringify([]));
      localStorage.setItem('lastDate', today);
      setTodaysFoods([]);
    } else {
      setTodaysFoods(savedFoods);
    }
    
    setDailyGoal(savedGoal);
    setGoalInput(savedGoal);
  }, []);

  useEffect(() => {
    localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
  }, [todaysFoods]);

  const totals = todaysFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.macros.protein,
      carbs: acc.carbs + food.macros.carbs,
      fat: acc.fat + food.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const progressPercentage = Math.min((totals.calories / dailyGoal) * 100, 100);
  const isOverGoal = totals.calories > dailyGoal;

  const searchFoods = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/calories/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setIsMock(data.isMock || false);
      } else {
        setSearchResults([]);
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error connecting to server. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchFoods();
    }
  };

  const addToToday = (food) => {
    const foodWithTimestamp = {
      ...food,
      addedAt: Date.now(),
      uniqueId: `${food.id}-${Date.now()}`,
    };
    setTodaysFoods([...todaysFoods, foodWithTimestamp]);
  };

  const removeFromToday = (uniqueId) => {
    setTodaysFoods(todaysFoods.filter((food) => food.uniqueId !== uniqueId));
  };

  const clearAllFoods = () => {
    if (window.confirm('Are you sure you want to clear all foods for today?')) {
      setTodaysFoods([]);
    }
  };

  const handleSetGoal = () => {
    if (goalInput >= 1000 && goalInput <= 5000) {
      setDailyGoal(goalInput);
      localStorage.setItem('dailyGoal', goalInput);
    } else {
      alert('Please enter a goal between 1000 and 5000 kcal');
      setGoalInput(dailyGoal);
    }
  };

  return (
    <div className="calories-screen">
      <h1 className="screen-title">Calorie Tracker</h1>

      <section className="daily-summary">
        <h2>Today's Progress</h2>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className={`progress-fill ${isOverGoal ? 'over-goal' : ''}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="calorie-stats">
            <span className="current-calories">{Math.round(totals.calories)}</span>
            {' / '}
            <span className="goal-calories">{dailyGoal}</span> kcal
          </div>
        </div>
        <div className="macro-summary">
          <div className="macro-item">
            <span className="macro-label">Protein</span>
            <span className="macro-value">{Math.round(totals.protein)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Carbs</span>
            <span className="macro-value">{Math.round(totals.carbs)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Fat</span>
            <span className="macro-value">{Math.round(totals.fat)}g</span>
          </div>
        </div>
      </section>

      <section className="search-section">
        <h2>Search Foods</h2>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a food (e.g., apple, chicken breast, pizza)..."
            autoComplete="off"
          />
          <button onClick={searchFoods}>Search</button>
        </div>

        {isLoading && <div className="loading">Searching...</div>}
        {error && <p className="error-message">{error}</p>}

        {isMock && searchResults.length > 0 && (
          <p className="mock-notice">Using sample data (API key not configured)</p>
        )}

        <div className="search-results">
          {searchResults.map((food) => (
            <div key={food.id} className="food-item">
              <div className="food-info">
                <div className="food-name">{food.name}</div>
                <div className="food-details">Serving: {food.servingSize}</div>
                <div className="food-macros">
                  P: {food.macros.protein}g | C: {food.macros.carbs}g | F: {food.macros.fat}g
                </div>
              </div>
              <div className="food-calories">{food.calories} kcal</div>
              <button className="add-btn" onClick={() => addToToday(food)}>
                + Add
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="todays-foods">
        <h2>Today's Foods</h2>
        <div className="foods-list">
          {todaysFoods.length === 0 ? (
            <p className="empty-message">No foods added yet. Search and add foods above!</p>
          ) : (
            todaysFoods.map((food) => (
              <div key={food.uniqueId} className="food-item">
                <div className="food-info">
                  <div className="food-name">{food.name}</div>
                  <div className="food-details">{food.servingSize}</div>
                  <div className="food-macros">
                    P: {food.macros.protein}g | C: {food.macros.carbs}g | F: {food.macros.fat}g
                  </div>
                </div>
                <div className="food-calories">{food.calories} kcal</div>
                <button className="remove-btn" onClick={() => removeFromToday(food.uniqueId)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        {todaysFoods.length > 0 && (
          <button className="clear-btn" onClick={clearAllFoods}>
            Clear All
          </button>
        )}
      </section>

      <section className="goal-section">
        <h2>Daily Goal</h2>
        <div className="goal-input">
          <input
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(parseInt(e.target.value) || 0)}
            min="1000"
            max="5000"
          />
          <span>kcal</span>
          <button onClick={handleSetGoal}>Set Goal</button>
        </div>
      </section>
    </div>
  );
}

export default CaloriesScreen;
