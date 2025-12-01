const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

const API_KEY = process.env.CALORIE_API_KEY;

app.get('/calories/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const mockResults = getMockResults(query);
  res.json({ results: mockResults, isMock: true });
});

function getMockResults(query) {
  const mockDatabase = [
    { name: 'apple', servingSize: '182g', calories: 95, macros: { protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 } },
    { name: 'banana', servingSize: '118g', calories: 105, macros: { protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14 } },
    { name: 'chicken breast', servingSize: '100g', calories: 165, macros: { protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 } },
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

describe('Calorie API', () => {
  describe('GET /calories/search', () => {
    it('should return 400 if no query parameter is provided', async () => {
      const response = await request(app).get('/calories/search');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query parameter "q" is required');
    });

    it('should return results for a valid food search', async () => {
      const response = await request(app).get('/calories/search?q=apple');
      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should return normalized food data with required fields', async () => {
      const response = await request(app).get('/calories/search?q=apple');
      const food = response.body.results[0];
      
      expect(food).toHaveProperty('id');
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('servingSize');
      expect(food).toHaveProperty('calories');
      expect(food).toHaveProperty('macros');
      expect(food.macros).toHaveProperty('protein');
      expect(food.macros).toHaveProperty('carbs');
      expect(food.macros).toHaveProperty('fat');
    });

    it('should return correct calorie data for apple', async () => {
      const response = await request(app).get('/calories/search?q=apple');
      const apple = response.body.results[0];
      
      expect(apple.name).toBe('apple');
      expect(apple.calories).toBe(95);
      expect(apple.servingSize).toBe('182g');
    });

    it('should return results for chicken breast', async () => {
      const response = await request(app).get('/calories/search?q=chicken');
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBeGreaterThan(0);
      
      const chicken = response.body.results[0];
      expect(chicken.name).toBe('chicken breast');
      expect(chicken.macros.protein).toBe(31);
    });

    it('should return generic result for unknown food', async () => {
      const response = await request(app).get('/calories/search?q=unknownfood123');
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBe(1);
      expect(response.body.results[0].name).toBe('unknownfood123');
    });

    it('should handle empty query string', async () => {
      const response = await request(app).get('/calories/search?q=');
      expect(response.status).toBe(400);
    });
  });
});

describe('Food Data Structure', () => {
  it('should have valid macro nutrients', async () => {
    const response = await request(app).get('/calories/search?q=banana');
    const food = response.body.results[0];
    
    expect(typeof food.macros.protein).toBe('number');
    expect(typeof food.macros.carbs).toBe('number');
    expect(typeof food.macros.fat).toBe('number');
    expect(food.macros.protein).toBeGreaterThanOrEqual(0);
    expect(food.macros.carbs).toBeGreaterThanOrEqual(0);
    expect(food.macros.fat).toBeGreaterThanOrEqual(0);
  });

  it('should have positive calorie values', async () => {
    const response = await request(app).get('/calories/search?q=apple');
    const food = response.body.results[0];
    
    expect(food.calories).toBeGreaterThan(0);
  });
});
