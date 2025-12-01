import { Routes, Route, Link } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen.js";
import FriendsScreen from "./screens/FriendsScreen.js";
import WorkoutsScreen from "./screens/WorkoutsScreen.js";
import ProfileScreen from "./screens/ProfileScreen.js";

function App() {
  return (
    <div>
      <nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/friends">Friends</Link>
        <Link to="/workouts">Workouts</Link>
        <Link to="/profile">Profile</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/friends" element={<FriendsScreen />} />
        <Route path="/workouts" element={<WorkoutsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </div>
  );
}

export default App;