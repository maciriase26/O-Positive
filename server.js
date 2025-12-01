// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (in production, use a database)
let logs = {
  water: [],
  steps: [],
  calories: []
};

// Daily goals
const dailyGoals = {
  water: 2000, // ml
  steps: 10000, // steps
  calories: 2000 // kcal
};

// Helper function to get today's date string
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Routes
app.get('/api/goals', (req, res) => {
  res.json(dailyGoals);
});

// Water endpoints
app.get('/api/logs/water', (req, res) => {
  const today = getToday();
  const todayLogs = logs.water.filter(log => log.date === today);
  const total = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  res.json({ total, logs: todayLogs });
});

app.post('/api/logs/water', (req, res) => {
  const { amount } = req.body;
  const today = getToday();
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const newLog = {
    id: Date.now(),
    date: today,
    amount: parseInt(amount),
    timestamp: new Date().toISOString()
  };
  
  logs.water.push(newLog);
  res.json(newLog);
});

// Steps endpoints
app.get('/api/logs/steps', (req, res) => {
  const today = getToday();
  const todayLogs = logs.steps.filter(log => log.date === today);
  const total = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  res.json({ total, logs: todayLogs });
});

app.post('/api/logs/steps', (req, res) => {
  const { amount } = req.body;
  const today = getToday();
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const newLog = {
    id: Date.now(),
    date: today,
    amount: parseInt(amount),
    timestamp: new Date().toISOString()
  };
  
  logs.steps.push(newLog);
  res.json(newLog);
});

// Calories endpoints
app.get('/api/logs/calories', (req, res) => {
  const today = getToday();
  const todayLogs = logs.calories.filter(log => log.date === today);
  const total = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  res.json({ total, logs: todayLogs });
});

app.post('/api/logs/calories', (req, res) => {
  const { amount } = req.body;
  const today = getToday();
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const newLog = {
    id: Date.now(),
    date: today,
    amount: parseInt(amount),
    timestamp: new Date().toISOString()
  };
  
  logs.calories.push(newLog);
  res.json(newLog);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});