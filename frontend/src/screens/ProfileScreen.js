import React, { useState } from "react";

const SECRET_MESSAGES = [
  "Reminder: You don't have to earn rest. Today counts, even if it was small.",
  "Your future self is already proud that you didn't give up.",
  "Slow progress is still progress. The only bad workout is the one that never happened.",
  "You are allowed to take up space in the gym, on the trail, and in your own life.",
];

function pickSecretMessage() {
  const index = Math.floor(Math.random() * SECRET_MESSAGES.length);
  return SECRET_MESSAGES[index];
}

function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("overview");
  const [journalText, setJournalText] = useState("");
  const [journalPrivate, setJournalPrivate] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [revealedIds, setRevealedIds] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const [secretMessage, setSecretMessage] = useState(pickSecretMessage());

  const handleAddEntry = () => {
    const text = journalText.trim();
    if (!text) return;

    const now = new Date();
    const formatted = now.toLocaleString();

    setJournalEntries((prev) => [
      {
        id: now.getTime(),
        date: formatted,
        text,
        isPrivate: journalPrivate,
      },
      ...prev,
    ]);
    setJournalText("");
    setJournalPrivate(false);
  };

  const handleDeleteEntry = (id) => {
    setJournalEntries((prev) => prev.filter((entry) => entry.id !== id));
    setRevealedIds((prev) => prev.filter((entryId) => entryId !== id));
  };

  const handleRevealSecret = () => {
    setShowSecret(true);
    setSecretMessage(pickSecretMessage());
  };

  const toggleRevealEntry = (id) => {
    setRevealedIds((prev) =>
      prev.includes(id)
        ? prev.filter((entryId) => entryId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="screen">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Your profile</h2>
          <span className="card-label">Goals, journal &amp; weigh-ins</span>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            type="button"
            className={
              "profile-tab" +
              (activeTab === "overview" ? " profile-tab--active" : "")
            }
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={
              "profile-tab" +
              (activeTab === "journal" ? " profile-tab--active" : "")
            }
            onClick={() => setActiveTab("journal")}
          >
            Journal
          </button>
          <button
            type="button"
            className={
              "profile-tab" +
              (activeTab === "weighins" ? " profile-tab--active" : "")
            }
            onClick={() => setActiveTab("weighins")}
          >
            Weigh-ins
          </button>
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="profile-section">
            <p className="screen-text">
              Here you can see or adjust your basic goals. Other teammates can
              later hook this into real backend data.
            </p>
            <div className="stats-row" style={{ marginTop: "0.9rem" }}>
              <div className="stat-pill">
                <span>Steps goal</span>
                <span className="value">8,000</span>
              </div>
              <div className="stat-pill">
                <span>Water goal</span>
                <span className="value">8 cups</span>
              </div>
              <div className="stat-pill">
                <span>Workouts / week</span>
                <span className="value">4</span>
              </div>
            </div>
          </div>
        )}

        {/* Journal tab */}
        {activeTab === "journal" && (
          <div className="profile-section">
            <p className="screen-text">
              Use this space to log how you felt after workouts, energy levels,
              or anything you&apos;re tracking.
            </p>

            <button
              type="button"
              className="journal-secret-trigger"
              onClick={handleRevealSecret}
            >
              psst… need a quiet pep talk?
            </button>

            {showSecret && (
              <div className="journal-secret-box">
                <p className="journal-secret-text">“{secretMessage}”</p>
              </div>
            )}

            <div className="journal-input-row">
              <textarea
                className="journal-textarea"
                rows={5}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="How did your body feel today? Did you hit your goals? Anything you're proud of?"
              />
              <div className="journal-input-footer">
                <label className="journal-private-toggle">
                  <input
                    type="checkbox"
                    checked={journalPrivate}
                    onChange={(e) => setJournalPrivate(e.target.checked)}
                  />
                  <span>Mark this entry as private</span>
                </label>
                <button
                  type="button"
                  className="journal-add-btn"
                  onClick={handleAddEntry}
                >
                  + Add entry
                </button>
              </div>
            </div>

            <div className="journal-entries">
              {journalEntries.length === 0 ? (
                <p className="screen-text-muted">
                  No entries yet. Your future self will thank you for starting.
                </p>
              ) : (
                journalEntries.map((entry) => {
                  const isRevealed =
                    !entry.isPrivate || revealedIds.includes(entry.id);

                  return (
                    <article key={entry.id} className="journal-entry">
                      <div className="journal-entry-meta">
                        <span className="journal-entry-date">{entry.date}</span>
                        <div className="journal-entry-actions">
                          {entry.isPrivate && (
                            <button
                              type="button"
                              className="journal-entry-lock"
                              onClick={() => toggleRevealEntry(entry.id)}
                            >
                              {isRevealed ? "Hide" : "Reveal"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="journal-entry-delete"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            delete
                          </button>
                        </div>
                      </div>
                      {entry.isPrivate && (
                        <p className="journal-entry-privacy-pill">
                          Private entry
                        </p>
                      )}
                      <p
                        className={
                          "journal-entry-text" +
                          (entry.isPrivate && !isRevealed
                            ? " journal-entry-text--hidden"
                            : "")
                        }
                      >
                        {entry.text}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Weigh-ins tab */}
        {activeTab === "weighins" && (
          <div className="profile-section">
            <p className="screen-text">
              In a later iteration, this tab could show a simple weight graph
              and notes about how your clothes &amp; lifts feel. For now it&apos;s
              a placeholder so the team can wire up backend data later.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfileScreen;