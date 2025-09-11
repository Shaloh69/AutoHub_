// tests/helpers/testHelpers.ts
import { User, UserRole } from '../../src/entities/User';
import { Car } from '../../src/entities/Car';
import { AuthService } from '../../src/services/AuthService';
import { AppDataSource } from '../../src/config/database';

export const createTestUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const userRepository = AppDataSource.getRepository(User);
  
  const userData = {
    email: 'test@example.com',
    password_hash: '$2a$12$hashedpassword',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.BUYER,
    is_active: true,
    email_verified: true,
    ...overrides
  };
  
  const user = userRepository.create(userData);
  return await userRepository.save(user);
};

export const createTestCar = async (sellerId: number, overrides: Partial<Car> = {}): Promise<Car> => {
  const carRepository = AppDataSource.getRepository(Car);
  
  const carData = {
    title: 'Test Car',
    description: 'Test car description',
    year: 2020,
    price: 500000,
    mileage: 50000,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    condition_rating: 'good',
    brand_id: 1,
    model_id: 1,
    seller_id: sellerId,
    city_id: 1,
    province_id: 1,
    region_id: 1,
    ...overrides
  };
  
  const car = carRepository.create(carData);
  return await carRepository.save(car);
};

export const loginTestUser = async (email: string = 'test@example.com'): Promise<string> => {
  const authService = new AuthService();
  const result = await authService.login({ email, password: 'password123' }, '127.0.0.1');
  return result.token;
};

