const request = require('supertest');

const API = 'http://localhost:4000';

describe('Friends API (smoke)', () => {
  test('GET /health', async () => {
    const res = await request(API).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /friends/list returns array', async () => {
    const res = await request(API).get('/friends/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.friends)).toBe(true);
  });

  test('POST /friends/add adds friend', async () => {
    const name = `test-${Date.now()}`;
    const res = await request(API).post('/friends/add').send({ name });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('friend');
    expect(res.body.friend).toHaveProperty('name');
  });

  test('POST /friends/nudge returns ok', async () => {
    // nudge friend id 1 (seeded)
    const res = await request(API).post('/friends/nudge').send({ id: 1, message: 'test nudge' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});
