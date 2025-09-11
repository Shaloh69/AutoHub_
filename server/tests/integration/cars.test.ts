// tests/integration/cars.test.ts
import request from 'supertest';
import appInstance from '../../src/app';
import { createTestUser, createTestCar, loginTestUser } from '../helpers/testHelpers';

const app = appInstance.getApp();

describe('Car Endpoints', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    testUser = await createTestUser({ role: 'seller' });
    authToken = await loginTestUser(testUser.email);
  });

  describe('POST /api/cars', () => {
    it('should create a new car listing', async () => {
      const carData = {
        title: 'Test Car Listing',
        description: 'A test car for sale',
        year: 2020,
        price: 500000,
        mileage: 30000,
        fuel_type: 'gasoline',
        transmission: 'automatic',
        condition_rating: 'good',
        brand_id: 1,
        model_id: 1,
        city_id: 1,
        province_id: 1,
        region_id: 1
      };

      const response = await request(app)
        .post('/api/cars')
        .set('Authorization', `Bearer ${authToken}`)
        .send(carData)
        .expect(201);

      expect(response.body.data.car.title).toBe(carData.title);
    });
  });

  describe('GET /api/cars', () => {
    it('should return paginated car listings', async () => {
      await createTestCar(testUser.id);
      await createTestCar(testUser.id, { title: 'Another Car' });

      const response = await request(app)
        .get('/api/cars')
        .expect(200);

      expect(response.body.data.cars).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter cars by price range', async () => {
      await createTestCar(testUser.id, { price: 300000 });
      await createTestCar(testUser.id, { price: 800000 });

      const response = await request(app)
        .get('/api/cars?min_price=400000&max_price=900000')
        .expect(200);

      expect(response.body.data.cars).toHaveLength(1);
      expect(response.body.data.cars[0].price).toBe(800000);
    });
  });
});