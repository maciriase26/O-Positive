import React, { useState } from "react";

const INITIAL_FRIENDS = [
  {
    id: 1,
    name: "Alex",
    streakDays: 6,
    lastCheckIn: "Today",
    status: "On track",
  },
  {
    id: 2,
    name: "Jordan",
    streakDays: 3,
    lastCheckIn: "Yesterday",
    status: "Check in",
  },
  {
    id: 3,
    name: "Sam",
    streakDays: 0,
    lastCheckIn: "3 days ago",
    status: "Ghosting",
  },
];

function FriendsScreen() {
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [newFriend, setNewFriend] = useState("");

  const handleAddFriend = (e) => {
    e.preventDefault();
    const name = newFriend.trim();
    if (!name) return;

    setFriends((prev) => [
      {
        id: Date.now(),
        name,
        streakDays: 0,
        lastCheckIn: "Not yet",
        status: "New",
      },
      ...prev,
    ]);
    setNewFriend("");
  };

  const totalStreak = friends.reduce((sum, f) => sum + f.streakDays, 0);
  const avgStreak =
    friends.length === 0 ? 0 : Math.round(totalStreak / friends.length);

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
            placeholder="Add a friend by name"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
          />
          <button type="submit">Invite</button>
        </form>

        <div className="friends-grid">
          {friends.map((friend) => {
            let statusClass = "status-pill--on";
            if (friend.status === "Check in") statusClass = "status-pill--check";
            if (friend.status === "Ghosting") statusClass = "status-pill--off";
            if (friend.status === "New") statusClass = "status-pill--new";

            return (
              <article key={friend.id} className="friend-card">
                <div className="friend-header">
                  <h3 className="friend-name">{friend.name}</h3>
                  <span className={`status-pill ${statusClass}`}>
                    {friend.status}
                  </span>
                </div>
                <p className="friend-meta">
                  Streak: <strong>{friend.streakDays} days</strong>
                </p>
                <p className="friend-meta">
                  Last check-in: {friend.lastCheckIn}
                </p>
                <button type="button" className="friend-nudge-btn">
                  Send a nudge
                </button>
              </article>
            );
          })}
          {friends.length === 0 && (
            <p className="screen-text-muted">
              No friends added yet. Start with one person who would love your
              encouragement.
            </p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Group snapshot</h2>
          <span className="card-label">Frontend-only placeholder</span>
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
                      : (friends.filter((f) => f.status === "On track").length /
                          friends.length) *
                        100
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

export default FriendsScreen;