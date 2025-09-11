// tests/globalSetup.ts
import { AppDataSource } from '../src/config/database';

export default async () => {
  console.log('Setting up test database...');
  
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'car_marketplace_test';
  
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Run migrations
    await AppDataSource.runMigrations();
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    process.exit(1);
  }
};

