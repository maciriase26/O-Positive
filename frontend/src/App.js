import "./App.css";
import { Routes, Route, NavLink } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import FriendsScreen from "./screens/FriendsScreen";
import WorkoutsScreen from "./screens/WorkoutsScreen";
import ProfileScreen from "./screens/ProfileScreen";

function App() {
  return (
    <div className="app-root">
      <div className="app-shell">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1 className="app-title">O-Positive Fitness</h1>
            <p className="app-subtitle">
              Your daily movement, water &amp; accountability hub
            </p>
          </div>
          <span className="app-badge">alpha</span>
        </header>

        {/* Top navigation */}
        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " active" : "")
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/workouts"
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " active" : "")
            }
          >
            Workouts
          </NavLink>

          <NavLink
            to="/friends"
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " active" : "")
            }
          >
            Friends
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              "app-nav-link" + (isActive ? " active" : "")
            }
          >
            Profile
          </NavLink>
        </nav>

        {/* Main content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/friends" element={<FriendsScreen />} />
            <Route path="/workouts" element={<WorkoutsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;