import { useEffect, useState } from "react";

const QUOTES = [
  {
    line: "Imagine that summer nyash.",
    author: "O-Positive",
  },
  {
    line: "Show up for the future you, not the tired you.",
    author: "O-Positive",
  },
  {
    line: "Don't think, just do the next rep. PUSH!",
    author: "O-Positive",
  },
  {
    line: "The way I see it, if you want the rainbow, you gotta put up with the rain.",
    author: "O-Positive",
  },
];

function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function HomeScreen() {
  const [quote, setQuote] = useState(QUOTES[0]);

  // nutrition state
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foods, setFoods] = useState(() => loadFromStorage("foodsToday", []));

  // pick a random quote on first load
  useEffect(() => {
    const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(random);
  }, []);

  // keep foods in localStorage
  useEffect(() => {
    window.localStorage.setItem("foodsToday", JSON.stringify(foods));
  }, [foods]);

  const totalCalories = foods.reduce((sum, item) => sum + item.calories, 0);

  function handleAddFood(e) {
    e.preventDefault();
    const trimmedName = foodName.trim();
    const cals = Number(foodCalories);

    if (!trimmedName || !cals || cals <= 0) return;

    const entry = {
      id: Date.now(),
      name: trimmedName,
      calories: cals,
    };

    setFoods([entry, ...foods]);
    setFoodName("");
    setFoodCalories("");
  }

  return (
    <>
      {/* Top row: motivation + simple weekly graph */}
      <section className="home-row">
        <div className="card motivation-card">
          <p className="card-label">Daily note</p>
          <p className="quote-text">“{quote.line}”</p>
          <p className="quote-author">{quote.author}</p>
        </div>

        <div className="card graph-card">
          <div className="card-header">
            <h2 className="card-title">This week</h2>
            <span className="card-label">Activity snapshot</span>
          </div>
          <div className="mini-graph">
            <div className="mini-bar mini-bar--low" />
            <div className="mini-bar mini-bar--med" />
            <div className="mini-bar mini-bar--high mini-bar--today" />
            <div className="mini-bar mini-bar--med" />
            <div className="mini-bar mini-bar--low" />
            <div className="mini-bar mini-bar--med" />
            <div className="mini-bar mini-bar--high" />
          </div>
          <div className="mini-graph-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </section>

      {/* Today overview */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Today&apos;s overview</h2>
          <span className="card-label">Mon • Weekly goal: 5 workouts</span>
        </div>
        <div className="stats-row">
          <div className="stat-pill">
            <span>Steps</span>
            <span className="value value-move">6,248</span>
          </div>
          <div className="stat-pill">
            <span>Active minutes</span>
            <span className="value value-focus">32</span>
          </div>
          <div className="stat-pill">
            <span>Calories burned</span>
            <span className="value value-intense">420 kcal</span>
          </div>
        </div>
        <div className="progress-row">
          <div className="progress-meter">
            <span className="progress-label">Steps</span>
            <div className="progress-track">
              <div
                className="progress-fill progress-fill--energy"
                style={{ width: "78%" }}
              />
            </div>
          </div>
          <div className="progress-meter">
            <span className="progress-label">Active minutes</span>
            <div className="progress-track">
              <div
                className="progress-fill progress-fill--focus"
                style={{ width: "64%" }}
              />
            </div>
          </div>
          <div className="progress-meter">
            <span className="progress-label">Calories burned</span>
            <div className="progress-track">
              <div
                className="progress-fill progress-fill--calm"
                style={{ width: "52%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Food intake / calories */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Nutrition today</h2>
          <span className="card-label">
            Frontend-only • manual food &amp; calories
          </span>
        </div>

        <form className="food-form" onSubmit={handleAddFood}>
          <input
            type="text"
            placeholder="Food (e.g. Greek yogurt, apple)"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Calories"
            value={foodCalories}
            onChange={(e) => setFoodCalories(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        <div className="food-summary">
          <span>Total today</span>
          <span className="food-summary-value">{totalCalories} kcal</span>
        </div>

        <div className="food-list">
          {foods.length === 0 && (
            <p className="screen-text-muted">
              No items logged yet. Start with your next meal or snack.
            </p>
          )}
          {foods.map((item) => (
            <div key={item.id} className="food-row">
              <span className="food-name">{item.name}</span>
              <span className="food-calories">{item.calories} kcal</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured workout example */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Featured session</h2>
          <span className="card-label">Lower body • 25 min</span>
        </div>
        <p className="screen-text">
          A simple, strong workout you can do at home or in the gym.
        </p>
        <ul className="workout-list">
          <li>5 min brisk walk or light bike to warm up</li>
          <li>3 × 12 bodyweight or goblet squats</li>
          <li>3 × 10 glute bridges</li>
          <li>3 × 12 alternating reverse lunges</li>
          <li>5 min easy walk + stretch to cool down</li>
        </ul>
      </section>
    </>
  );
}