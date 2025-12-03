Title: feat(friends): add friends management, basic stats, and nudges

Summary
-------
This branch (`issue/friends-nudges`) adds a simple friends management feature with the ability to:
- List friends (GET /friends/list)
- Add a friend (POST /friends/add)
- Accept a friend (POST /friends/accept)
- Send a nudge (POST /friends/nudge)

Implementation notes
--------------------
- Backend (`backend/index.js`): DB-aware endpoints. When a Postgres connection (via `backend/db/connection.js`) is available the endpoints will persist/look up users and friendships in the DB. If DB is not available the endpoints fall back to an in-memory demo store so the frontend and tests can be exercised without needing DB setup.
- Frontend (`frontend/src/screens/FriendsScreen.js`): wired to the endpoints. Fetches `/friends/list` on load, posts to `/friends/add` when inviting, and posts to `/friends/nudge` when sending a nudge.

Files changed (high level)
-------------------------
- backend/index.js (DB-aware friends endpoints + nudge recording)
- frontend/src/screens/FriendsScreen.js (wire to backend endpoints)
- backend/__tests__/friends.api.test.js (Jest + supertest smoke tests)
- PR_FRIENDS_NUDGES.md (this file)

How to run locally (smoke flow)
--------------------------------
1) Start backend (uses fallback if Postgres unavailable):

   cd backend
   npm install
   PORT=4000 npm start

   - Confirm: curl http://localhost:4000/health
   - Confirm: curl http://localhost:4000/friends/list

2) Start frontend (in separate terminal):

   cd frontend
   npm install
   REACT_APP_API_BASE="http://localhost:4000" npm start

   - Open http://localhost:3000 and navigate to Friends
   - Invite a friend and click "Send a nudge"

3) Run API tests (backend)

   cd backend
   npm install --include=dev
   npm test -- __tests__/friends.api.test.js

What I validated here
---------------------
- Backend started and responded to /health.
- GET /friends/list returned seeded demo friends.
- POST /friends/add successfully added a friend to the in-memory list.
- POST /friends/nudge recorded a nudge event (in-memory) and returned OK.
- Jest + supertest smoke tests pass against the running backend.

Notes about DB persistence
-------------------------
- The repo includes migrations and `backend/db/connection.js`. If you want persistent friends/nudges you should:
  1. Install and run Postgres locally (or configure a remote DB).
  2. Copy `.env.example` to `.env` and update DB credentials.
  3. Create the database (e.g. `createdb opositive`).
  4. Run migrations: `npm run migrate` from `backend/`.
  5. Restart the backend. Endpoints will switch to DB-backed behavior when a DB connection is available.

Testing checklist for reviewers
-----------------------------
- [ ] Backend starts and `GET /health` returns 200.
- [ ] `GET /friends/list` returns an array of friends.
- [ ] `POST /friends/add` with body `{ name: 'Name' }` returns a friend object.
- [ ] `POST /friends/nudge` with body `{ id: <friendId>, message: '...' }` returns `{ ok: true }`.
- [ ] Frontend Friends screen loads the list, adding a friend updates the UI, and "Send a nudge" triggers a success behavior.

Follow-ups (recommended)
------------------------
- Persist friends/nudges to DB and migrate tests to use a test database.
- Add friend-request accept/reject flows in the UI.
- Replace browser `alert()` with a toast UI for nudges.
- Add unit/integration tests for frontend interactions.

PR creation
-----------
I pushed the branch `issue/friends-nudges` to the remote. Create the PR using this URL:

https://github.com/maciriase26/O-Positive/pull/new/issue/friends-nudges

Or I can create the PR description for you if you provide a GitHub API token; otherwise please open the URL and paste the content of this file into the PR body.

If you'd like I can also:
- Run the DB migrations and persist friends/nudges (if you confirm Postgres is available), or
- Add Playwright UI tests to exercise the Friends screen end-to-end.
