import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Brand } from './Brand';
import { Model } from './Model';
import { Category } from './Category';
import { CarImage } from './CarImage';
import { CarFeature } from './CarFeature';
import { Inquiry } from './Inquiry';
import { Transaction } from './Transaction';
import { Favorite } from './Favorite';
import { PriceHistory } from './PriceHistory';
import { PhCity } from './PhCity';
import { PhProvince } from './PhProvince';
import { PhRegion } from './PhRegion';
import { StandardColor } from './StandardColor';
import { Currency } from './Currency';

export enum CarStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SOLD = 'sold',
    RESERVED = 'reserved',
    REMOVED = 'removed',
    EXPIRED = 'expired',
    SUSPENDED = 'suspended'
}

export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    NEEDS_REVISION = 'needs_revision'
}

export enum FuelType {
    GASOLINE = 'gasoline',
    DIESEL = 'diesel',
    HYBRID = 'hybrid',
    ELECTRIC = 'electric',
    CNG = 'cng',
    LPG = 'lpg',
    PLUGIN_HYBRID = 'plugin-hybrid'
}

export enum TransmissionType {
    MANUAL = 'manual',
    AUTOMATIC = 'automatic',
    SEMI_AUTOMATIC = 'semi-automatic',
    CVT = 'cvt'
}

export enum ConditionRating {
    EXCELLENT = 'excellent',
    VERY_GOOD = 'very_good',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor'
}

export enum Drivetrain {
    FWD = 'fwd',
    RWD = 'rwd',
    AWD = 'awd',
    FOUR_WD = '4wd'
}

@Entity('cars')
@Index(['seller_id'])
@Index(['brand_id', 'model_id'])
@Index(['price'])
@Index(['year'])
@Index(['status', 'approval_status'])
@Index(['city_id', 'province_id', 'region_id'])
@Index(['fuel_type', 'transmission'])
@Index(['is_featured', 'featured_until'])
@Index(['is_premium', 'premium_until'])
export class Car {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    year: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    original_price: number;

    @Column({ length: 3, default: 'PHP' })
    currency: string;

    @Column({ default: true })
    negotiable: boolean;

    @Column({ default: false })
    financing_available: boolean;

    @Column({ default: false })
    trade_in_accepted: boolean;

    // Technical Specifications
    @Column()
    mileage: number;

    @Column({ type: 'enum', enum: FuelType })
    fuel_type: FuelType;

    @Column({ type: 'enum', enum: TransmissionType })
    transmission: TransmissionType;

    @Column({ length: 20, nullable: true })
    engine_size: string;

    @Column({ nullable: true })
    horsepower: number;

    @Column({ type: 'enum', enum: Drivetrain, nullable: true })
    drivetrain: Drivetrain;

    // Colors
    @Column({ nullable: true })
    exterior_color_id: number;

    @Column({ nullable: true })
    interior_color_id: number;

    @Column({ length: 50, nullable: true })
    custom_exterior_color: string;

    @Column({ length: 50, nullable: true })
    custom_interior_color: string;

    // Condition & History
    @Column({ type: 'enum', enum: ConditionRating })
    condition_rating: ConditionRating;

    @Column({ default: false })
    accident_history: boolean;

    @Column({ type: 'text', nullable: true })
    accident_details: string;

    @Column({ default: false })
    flood_history: boolean;

    @Column({ default: true })
    service_history: boolean;

    @Column({ default: false })
    service_records_available: boolean;

    @Column({ default: 1 })
    number_of_owners: number;

    @Column({ default: false })
    warranty_remaining: boolean;

    @Column({ type: 'text', nullable: true })
    warranty_details: string;

    // Vehicle Identification
    @Column({ length: 17, unique: true, nullable: true })
    vin: string;

    @Column({ length: 50, nullable: true })
    engine_number: string;

    @Column({ length: 50, nullable: true })
    chassis_number: string;

    @Column({ length: 20, nullable: true })
    plate_number: string;

    @Column({ type: 'date', nullable: true })
    registration_expiry: Date;

    @Column({ default: true })
    or_cr_available: boolean;

    // Philippines Specific
    @Column({ default: true })
    lto_registered: boolean;

    @Column({ default: false })
    casa_maintained: boolean;

    @Column({ default: false })
    comprehensive_insurance: boolean;

    @Column({ length: 100, nullable: true })
    insurance_company: string;

    @Column({ type: 'date', nullable: true })
    insurance_expiry: Date;

    // Location (Philippines specific)
    @Column()
    city_id: number;

    @Column()
    province_id: number;

    @Column()
    region_id: number;

    @Column({ length: 100, nullable: true })
    barangay: string;

    @Column({ type: 'text', nullable: true })
    detailed_address: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, default: 14.5995 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, default: 120.9842 })
    longitude: number;

    // Listing Management
    @Column({ type: 'enum', enum: CarStatus, default: CarStatus.PENDING })
    status: CarStatus;

    @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
    approval_status: ApprovalStatus;

    @Column({ nullable: true })
    approved_by: number;

    @Column({ type: 'timestamp', nullable: true })
    approved_at: Date;

    @Column({ type: 'text', nullable: true })
    rejection_reason: string;

    @Column({ type: 'text', nullable: true })
    revision_notes: string;

    // Premium Features
    @Column({ default: false })
    is_featured: boolean;

    @Column({ type: 'timestamp', nullable: true })
    featured_until: Date;

    @Column({ default: false })
    is_premium: boolean;

    @Column({ type: 'timestamp', nullable: true })
    premium_until: Date;

    @Column({ default: 0 })
    boost_count: number;

    @Column({ type: 'timestamp', nullable: true })
    last_boosted_at: Date;

    // Performance Metrics
    @Column({ default: 0 })
    views_count: number;

    @Column({ default: 0 })
    unique_views_count: number;

    @Column({ default: 0 })
    contact_count: number;

    @Column({ default: 0 })
    favorite_count: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    average_rating: number;

    @Column({ default: 0 })
    total_ratings: number;

    // Search & SEO
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    search_score: number;

    @Column({ length: 255, unique: true, nullable: true })
    seo_slug: string;

    @Column({ length: 255, nullable: true })
    meta_title: string;

    @Column({ type: 'text', nullable: true })
    meta_description: string;

    @Column({ type: 'text', nullable: true })
    keywords: string;

    // Quality Score
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    quality_score: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    completeness_score: number;

    // Timestamps
    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    sold_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    last_price_update: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => User, user => user.cars)
    seller: User;

    @Column()
    seller_id: number;

    @ManyToOne(() => Brand)
    brand: Brand;

    @Column()
    brand_id: number;

    @ManyToOne(() => Model)
    model: Model;

    @Column()
    model_id: number;

    @ManyToOne(() => Category, { nullable: true })
    category: Category;

    @Column({ nullable: true })
    category_id: number;

    @ManyToOne(() => User, { nullable: true })
    approver: User;

    @ManyToOne(() => Currency)
    currencyObj: Currency;

    @ManyToOne(() => StandardColor, { nullable: true })
    exterior_color: StandardColor;

    @ManyToOne(() => StandardColor, { nullable: true })
    interior_color: StandardColor;

    @ManyToOne(() => PhCity)
    city: PhCity;

    @ManyToOne(() => PhProvince)
    province: PhProvince;

    @ManyToOne(() => PhRegion)
    region: PhRegion;

    @OneToMany(() => CarImage, image => image.car)
    images: CarImage[];

    @OneToMany(() => CarFeature, carFeature => carFeature.car)
    carFeatures: CarFeature[];

    @OneToMany(() => Inquiry, inquiry => inquiry.car)
    inquiries: Inquiry[];

    @OneToMany(() => Transaction, transaction => transaction.car)
    transactions: Transaction[];

    @OneToMany(() => Favorite, favorite => favorite.car)
    favorites: Favorite[];

    @OneToMany(() => PriceHistory, priceHistory => priceHistory.car)
    priceHistory: PriceHistory[];

    // Virtual getters
    get is_sold(): boolean {
        return this.status === CarStatus.SOLD;
    }

    get is_approved(): boolean {
        return this.approval_status === ApprovalStatus.APPROVED;
    }

    get is_featured_active(): boolean {
        return this.is_featured && this.featured_until && new Date() < this.featured_until;
    }

    get is_premium_active(): boolean {
        return this.is_premium && this.premium_until && new Date() < this.premium_until;
    }
}