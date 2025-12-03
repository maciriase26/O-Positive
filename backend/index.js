require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Try to use DB if available, otherwise fall back to in-memory stores
let pool;
try {
  pool = require('./db/connection');
} catch (e) {
  console.warn('DB connection module not available, will use in-memory stores');
}

const inMemory = {
  friends: [
    { id: 1, name: "Alex", email: "alex@example.com", status: "On track", lastActive: "Today", streakDays: 6 },
    { id: 2, name: "Jordan", email: "jordan@example.com", status: "Check in", lastActive: "Yesterday", streakDays: 3 },
    { id: 3, name: "Sam", email: "sam@example.com", status: "Ghosting", lastActive: "3 days ago", streakDays: 0 },
  ],
  nudges: [],
};

// Demo current user id (in a real app use auth)
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@local';
let DEMO_USER_ID = null;

async function ensureDemoUser() {
  if (!pool) return null;
  try {
    const res = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [DEMO_USER_EMAIL]);
    if (res.rows.length > 0) {
      DEMO_USER_ID = res.rows[0].id;
      return DEMO_USER_ID;
    }
    const insert = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      ['Demo User', DEMO_USER_EMAIL, 'demo']
    );
    DEMO_USER_ID = insert.rows[0].id;
    return DEMO_USER_ID;
  } catch (err) {
    console.warn('Could not ensure demo user:', err.message);
    return null;
  }
}

// GET /friends/list — prefers DB, falls back
app.get('/friends/list', async (req, res) => {
  if (pool) {
    try {
      await ensureDemoUser();
      const q = `
        SELECT u.id, u.name, u.email, f.status, u.created_at as last_active
        FROM friends f
        JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = $1
        ORDER BY u.name
      `;
      const result = await pool.query(q, [DEMO_USER_ID]);
      return res.json({ friends: result.rows.map(r => ({ id: r.id, name: r.name, email: r.email, status: r.status, lastActive: r.last_active })) });
    } catch (err) {
      console.warn('DB friends list failed, falling back to memory:', err.message);
    }
  }
  res.json({ friends: inMemory.friends });
});

// POST /friends/add — create user if needed and friend pivot
app.post('/friends/add', async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) return res.status(400).json({ error: 'name or email required' });
  if (pool) {
    try {
      await ensureDemoUser();
      // find or create user
      const identifier = email || name;
      let userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1 LIMIT 1', [identifier]);
      if (userRes.rows.length === 0) {
        const ins = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email', [name || identifier, email || null, 'demo']);
        userRes = { rows: [ins.rows[0]] };
      }
      const friendId = userRes.rows[0].id;
      // insert friends pivot (user -> friend)
      try {
        await pool.query('INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)', [DEMO_USER_ID, friendId, 'pending']);
      } catch (e) {
        // ignore duplicate
      }
      return res.json({ friend: { id: friendId, name: userRes.rows[0].name, email: userRes.rows[0].email, status: 'Pending', lastActive: 'Not yet', streakDays: 0 } });
    } catch (err) {
      console.warn('DB add friend failed, falling back to memory:', err.message);
    }
  }
  // fallback
  const id = Date.now();
  const friend = { id, name: name || email, email: email || null, status: 'Pending', lastActive: 'Not yet', streakDays: 0 };
  inMemory.friends.unshift(friend);
  res.json({ friend });
});

// POST /friends/accept — set status accepted
app.post('/friends/accept', async (req, res) => {
  const { id } = req.body;
  if (pool) {
    try {
      await pool.query('UPDATE friends SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE friend_id = $2 AND user_id = $3', ['accepted', Number(id), DEMO_USER_ID]);
      return res.json({ friend: { id: Number(id), status: 'On track' } });
    } catch (err) {
      console.warn('DB accept friend failed:', err.message);
    }
  }
  const f = inMemory.friends.find(x => x.id === Number(id));
  if (!f) return res.status(404).json({ error: 'friend not found' });
  f.status = 'On track';
  res.json({ friend: f });
});

// POST /friends/nudge — record a nudge event in DB or memory
app.post('/friends/nudge', async (req, res) => {
  const { id, message } = req.body;
  if (pool) {
    try {
      await ensureDemoUser();
      // insert into nudges table if exists
      await pool.query('INSERT INTO nudges (sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)', [DEMO_USER_ID, Number(id), message || 'Nudge!']);
      return res.json({ ok: true, event: { friendId: Number(id), message: message || 'Nudge!' } });
    } catch (err) {
      console.warn('DB nudge failed, falling back to memory:', err.message);
    }
  }
  const friend = inMemory.friends.find(x => x.id === Number(id));
  if (!friend) return res.status(404).json({ error: 'friend not found' });
  const event = { id: inMemory.nudges.length + 1, friendId: friend.id, message: message || 'Nudge!', at: new Date().toISOString() };
  inMemory.nudges.push(event);
  res.json({ ok: true, event });
});

const API_KEY = process.env.CALORIE_API_KEY;

app.get('/calories/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const response = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Api-Key': API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    const normalizedResults = data.items.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      name: item.name,
      servingSize: `${item.serving_size_g}g`,
      calories: Math.round(item.calories),
      macros: {
        protein: Math.round(item.protein_g * 10) / 10,
        carbs: Math.round(item.carbohydrates_total_g * 10) / 10,
        fat: Math.round(item.fat_total_g * 10) / 10,
        fiber: Math.round(item.fiber_g * 10) / 10,
        sugar: Math.round(item.sugar_g * 10) / 10
      }
    }));

    res.json({ results: normalizedResults });
  } catch (error) {
    console.error('Error fetching calorie data:', error);
    
    const mockResults = getMockResults(query);
    res.json({ results: mockResults, isMock: true });
  }
});

function getMockResults(query) {
  const mockDatabase = [
    { name: 'apple', servingSize: '182g', calories: 95, macros: { protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 } },
    { name: 'banana', servingSize: '118g', calories: 105, macros: { protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14 } },
    { name: 'chicken breast', servingSize: '100g', calories: 165, macros: { protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 } },
    { name: 'rice', servingSize: '100g', calories: 130, macros: { protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0 } },
    { name: 'egg', servingSize: '50g', calories: 78, macros: { protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6 } },
    { name: 'bread', servingSize: '30g', calories: 79, macros: { protein: 2.7, carbs: 15, fat: 1, fiber: 0.6, sugar: 1.5 } },
    { name: 'milk', servingSize: '244g', calories: 149, macros: { protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12 } },
    { name: 'salmon', servingSize: '100g', calories: 208, macros: { protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0 } },
    { name: 'broccoli', servingSize: '100g', calories: 34, macros: { protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7 } },
    { name: 'pasta', servingSize: '100g', calories: 131, macros: { protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6 } },
    { name: 'pizza', servingSize: '107g', calories: 285, macros: { protein: 12, carbs: 36, fat: 10, fiber: 2.5, sugar: 4 } },
    { name: 'salad', servingSize: '100g', calories: 20, macros: { protein: 1.5, carbs: 3.5, fat: 0.2, fiber: 2, sugar: 1.3 } },
    { name: 'orange', servingSize: '131g', calories: 62, macros: { protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12 } },
    { name: 'yogurt', servingSize: '170g', calories: 100, macros: { protein: 17, carbs: 6, fat: 0.7, fiber: 0, sugar: 4 } },
    { name: 'cheese', servingSize: '28g', calories: 113, macros: { protein: 7, carbs: 0.4, fat: 9, fiber: 0, sugar: 0.1 } },
  ];

  const queryLower = query.toLowerCase();
  const matches = mockDatabase.filter(item => 
    item.name.toLowerCase().includes(queryLower) || 
    queryLower.includes(item.name.toLowerCase())
  );

  if (matches.length === 0) {
    return [{
      id: `${Date.now()}-0`,
      name: query,
      servingSize: '100g',
      calories: 100,
      macros: { protein: 5, carbs: 15, fat: 3, fiber: 2, sugar: 5 }
    }];
  }

  return matches.map((item, index) => ({
    id: `${Date.now()}-${index}`,
    ...item
  }));
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Test calorie API: http://localhost:${PORT}/calories/search?q=apple`);
});