// tests/integration/auth.test.ts
import request from 'supertest';
import appInstance from '../../src/app';
import { createTestUser } from '../helpers/testHelpers';

const app = appInstance.getApp();

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'register@example.com',
        password: 'Password123!',
        first_name: 'Register',
        last_name: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const password = 'Password123!';
      const hashedPassword = await require('bcryptjs').hash(password, 12);
      
      await createTestUser({
        email: 'login@example.com',
        password_hash: hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: password
        })
        .expect(200);

      expect(response.body.data.token).toBeDefined();
    });
  });
});