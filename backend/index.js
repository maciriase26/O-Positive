require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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