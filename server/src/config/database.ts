import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Car } from '../entities/Car';
import { Brand } from '../entities/Brand';
import { Model } from '../entities/Model';
import { Category } from '../entities/Category';
import { Feature } from '../entities/Feature';
import { CarFeature } from '../entities/CarFeature';
import { CarImage } from '../entities/CarImage';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { UserSubscription } from '../entities/UserSubscription';
import { Inquiry } from '../entities/Inquiry';
import { InquiryResponse } from '../entities/InquiryResponse';
import { Transaction } from '../entities/Transaction';
import { Notification } from '../entities/Notification';
import { Favorite } from '../entities/Favorite';
import { PriceHistory } from '../entities/PriceHistory';
import { UserAction } from '../entities/UserAction';
import { PhRegion } from '../entities/PhRegion';
import { PhProvince } from '../entities/PhProvince';
import { PhCity } from '../entities/PhCity';
import { Currency } from '../entities/Currency';
import { StandardColor } from '../entities/StandardColor';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_marketplace_ph',
    synchronize: process.env.NODE_ENV === 'development', // Only in development
    logging: process.env.NODE_ENV === 'development',
    entities: [
        User,
        Car,
        Brand,
        Model,
        Category,
        Feature,
        CarFeature,
        CarImage,
        SubscriptionPlan,
        UserSubscription,
        Inquiry,
        InquiryResponse,
        Transaction,
        Notification,
        Favorite,
        PriceHistory,
        UserAction,
        PhRegion,
        PhProvince,
        PhCity,
        Currency,
        StandardColor
    ],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
    timezone: '+08:00' // Philippines timezone
});

export const connectDatabase = async (): Promise<DataSource> => {
    try {
        const dataSource = await AppDataSource.initialize();
        console.log('Database connected successfully');
        return dataSource;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};