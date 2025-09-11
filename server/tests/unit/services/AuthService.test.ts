// tests/unit/services/AuthService.test.ts
import { AuthService } from '../../../src/services/AuthService';
import { createTestUser } from '../../helpers/testHelpers';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.first_name).toBe(userData.first_name);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Existing',
        last_name: 'User'
      };

      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should authenticate valid user credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password_hash: await require('bcryptjs').hash('password123', 12)
      });

      const result = await authService.login({
        email: 'login@example.com',
        password: 'password123'
      });

      expect(result.user.id).toBe(user.id);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials');
    });
  });
});

