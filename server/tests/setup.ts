// tests/setup.ts
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'car_marketplace_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

beforeEach(async () => {
  // Clean up database before each test
  const entities = AppDataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.clear();
  }
});