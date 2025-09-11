// tests/globalTeardown.ts
import { AppDataSource } from '../src/config/database';

export default async () => {
  console.log('Tearing down test database...');
  
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    console.log('Test database teardown complete');
  } catch (error) {
    console.error('Failed to teardown test database:', error);
  }
};

