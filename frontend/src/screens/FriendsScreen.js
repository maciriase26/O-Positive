import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

function statusClassFor(status) {
  if (status === "On track") return "status-pill--on";
  if (status === "Check in") return "status-pill--check";
  if (status === "Ghosting") return "status-pill--off";
  if (status === "Pending") return "status-pill--new";
  return "status-pill--on";
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const res = await fetch(`${API_BASE}/friends/list`);
        const json = await res.json();
        if (json && json.friends) setFriends(json.friends);
      } catch (e) {
        console.warn("Could not load friends from backend, using local fallback", e);
        // fallback: keep empty list or you could seed with defaults
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, []);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    const name = newFriend.trim();
    if (!name) return;

    try {
      const res = await fetch(`${API_BASE}/friends/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.friend) {
        setFriends((prev) => [json.friend, ...prev]);
        setNewFriend("");
      }
    } catch (err) {
      console.error("add friend", err);
    }
  };

  const sendNudge = async (friendId) => {
    try {
      const res = await fetch(`${API_BASE}/friends/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: friendId, message: "You got a nudge!" }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("Nudge sent!");
      }
    } catch (err) {
      console.error("nudge error", err);
    }
  };

  const totalStreak = friends.reduce((sum, f) => sum + (f.streakDays || 0), 0);
  const avgStreak = friends.length === 0 ? 0 : Math.round(totalStreak / friends.length);

  return (
    <div className="screen">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Accountability circle</h2>
          <span className="card-label">Friends &amp; check-ins</span>
        </div>
        <p className="screen-text">
          Add friends you want to keep accountable. Later, other teammates can
          connect this to real notifications and streak tracking.
        </p>

        <form className="friends-form" onSubmit={handleAddFriend}>
          <input
            type="text"
            placeholder="Add a friend by name or email"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
          />
          <button type="submit">Invite</button>
        </form>

        <div className="friends-grid">
          {loading && <p className="screen-text-muted">Loading...</p>}
          {!loading && friends.length === 0 && (
            <p className="screen-text-muted">
              No friends added yet. Start with one person who would love your
              encouragement.
            </p>
          )}

          {friends.map((friend) => (
            <article key={friend.id} className="friend-card">
              <div className="friend-header">
                <h3 className="friend-name">{friend.name}</h3>
                <span className={`status-pill ${statusClassFor(friend.status)}`}>
                  {friend.status}
                </span>
              </div>
              <p className="friend-meta">
                Streak: <strong>{friend.streakDays || 0} days</strong>
              </p>
              <p className="friend-meta">Last check-in: {friend.lastActive || "-"}</p>
              <button type="button" className="friend-nudge-btn" onClick={() => sendNudge(friend.id)}>
                Send a nudge
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Group snapshot</h2>
          <span className="card-label">Frontend + backend demo</span>
        </div>
        <p className="screen-text">
          Quick peek at how your circle is doing. This could later become a real
          chart connected to steps, workouts, or streaks.
        </p>
        <div className="progress-row">
          <div className="progress-meter">
            <span className="progress-label">Avg streak</span>
            <div className="progress-track">
              <div
                className="progress-fill progress-fill--energy"
                style={{ width: `${Math.min(avgStreak * 10, 100)}%` }}
              />
            </div>
          </div>
          <div className="progress-meter">
            <span className="progress-label">On-track friends</span>
            <div className="progress-track">
              <div
                className="progress-fill progress-fill--focus"
                style={{
                  width: `${
                    friends.length === 0
                      ? 0
                      : (friends.filter((f) => f.status === "On track").length / friends.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}