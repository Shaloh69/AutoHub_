import 'reflect-metadata';
import { AppDataSource } from '../../config/database';
import { seedCurrencies } from './CurrencySeeder';
import { seedPhilippinesLocations } from './LocationSeeder';
import { seedStandardColors } from './ColorSeeder';
import { seedBrandsAndModels } from './BrandSeeder';
import { seedCategories } from './CategorySeeder';
import { seedFeatures } from './FeatureSeeder';
import { seedSubscriptionPlans } from './SubscriptionPlanSeeder';
import { seedAdminUser } from './UserSeeder';
import { seedSystemConfig } from './SystemConfigSeeder';

class DatabaseSeeder {
    private async connectDatabase() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('Database connected for seeding');
        }
    }

    private async disconnectDatabase() {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Database connection closed');
        }
    }

    async run() {
        try {
            await this.connectDatabase();
            
            console.log('🌱 Starting database seeding...');
            console.log('');

            // Seed in order of dependencies
            await this.seedWithProgress('Currencies', seedCurrencies);
            await this.seedWithProgress('Philippines Locations', seedPhilippinesLocations);
            await this.seedWithProgress('Standard Colors', seedStandardColors);
            await this.seedWithProgress('Brands and Models', seedBrandsAndModels);
            await this.seedWithProgress('Categories', seedCategories);
            await this.seedWithProgress('Features', seedFeatures);
            await this.seedWithProgress('Subscription Plans', seedSubscriptionPlans);
            await this.seedWithProgress('Admin User', seedAdminUser);
            await this.seedWithProgress('System Configuration', seedSystemConfig);

            console.log('');
            console.log('✅ Database seeding completed successfully!');
            
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            process.exit(1);
        } finally {
            await this.disconnectDatabase();
        }
    }

    private async seedWithProgress(name: string, seederFunction: () => Promise<void>) {
        try {
            process.stdout.write(`   Seeding ${name}... `);
            await seederFunction();
            console.log('✅');
        } catch (error) {
            console.log('❌');
            throw new Error(`Failed to seed ${name}: ${error.message}`);
        }
    }
}



// Run seeder if called directly
if (require.main === module) {
    const seeder = new DatabaseSeeder();
    seeder.run().catch(console.error);
}

export default DatabaseSeeder;