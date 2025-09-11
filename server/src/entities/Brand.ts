import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Car } from './Car';
import { Model } from './Model';

export enum BrandType {
    LUXURY = 'luxury',
    MAINSTREAM = 'mainstream',
    ECONOMY = 'economy',
    COMMERCIAL = 'commercial',
    MOTORCYCLE = 'motorcycle'
}

@Entity('brands')
@Index(['name'])
@Index(['brand_type'])
@Index(['is_popular_in_ph'])
export class Brand {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ length: 500, nullable: true })
    logo_url: string;

    @Column({ length: 100, nullable: true })
    country_origin: string;

    @Column({
        type: 'enum',
        enum: BrandType,
        default: BrandType.MAINSTREAM
    })
    brand_type: BrandType;

    @Column({ default: false })
    is_popular_in_ph: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ length: 150, unique: true, nullable: true })
    seo_slug: string;

    @Column({ length: 255, nullable: true })
    meta_title: string;

    @Column({ type: 'text', nullable: true })
    meta_description: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Car, car => car.brand)
    cars: Car[];

    @OneToMany(() => Model, model => model.brand)
    models: Model[];
}

@Entity('models')
@Index(['brand_id'])
@Index(['body_type'])
@Index(['is_popular_in_ph'])
export class Model {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    brand_id: number;

    @Column({ length: 100 })
    name: string;

    @Column({
        type: 'enum',
        enum: ['sedan', 'hatchback', 'suv', 'coupe', 'convertible', 'pickup', 'van', 'wagon', 'crossover', 'minivan', 'mpv', 'jeepney', 'tricycle']
    })
    body_type: string;

    @Column({ length: 50, nullable: true })
    generation: string;

    @Column({ nullable: true })
    year_start: number;

    @Column({ nullable: true })
    year_end: number;

    @Column({ default: false })
    is_popular_in_ph: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ length: 200, unique: true, nullable: true })
    seo_slug: string;

    @Column({ length: 255, nullable: true })
    meta_title: string;

    @Column({ type: 'text', nullable: true })
    meta_description: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Brand, brand => brand.models)
    brand: Brand;

    @OneToMany(() => Car, car => car.model)
    cars: Car[];
}

@Entity('categories')
@Index(['name'])
@Index(['parent_id'])
@Index(['is_featured'])
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    parent_id: number;

    @Column({ length: 100, nullable: true })
    icon_class: string;

    @Column({ length: 500, nullable: true })
    image_url: string;

    @Column({ default: false })
    is_featured: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ length: 150, unique: true, nullable: true })
    seo_slug: string;

    @Column({ length: 255, nullable: true })
    meta_title: string;

    @Column({ type: 'text', nullable: true })
    meta_description: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Category, { nullable: true })
    parent: Category;

    @OneToMany(() => Category, category => category.parent)
    children: Category[];

    @OneToMany(() => Car, car => car.category)
    cars: Car[];
}

@Entity('features')
@Index(['name'])
@Index(['category'])
@Index(['is_popular'])
export class Feature {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({
        type: 'enum',
        enum: ['safety', 'comfort', 'technology', 'performance', 'exterior', 'interior', 'entertainment', 'convenience']
    })
    category: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ length: 100, nullable: true })
    icon_class: string;

    @Column({ default: false })
    is_premium: boolean;

    @Column({ default: false })
    is_popular: boolean;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => CarFeature, carFeature => carFeature.feature)
    carFeatures: CarFeature[];
}

@Entity('car_features')
export class CarFeature {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    car_id: number;

    @Column()
    feature_id: number;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => Car, car => car.carFeatures, { onDelete: 'CASCADE' })
    car: Car;

    @ManyToOne(() => Feature, feature => feature.carFeatures, { onDelete: 'CASCADE' })
    feature: Feature;
}

@Entity('car_images')
@Index(['car_id'])
@Index(['is_primary'])
@Index(['image_type'])
export class CarImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    car_id: number;

    @Column({ length: 500 })
    image_url: string;

    @Column({ length: 500, nullable: true })
    thumbnail_url: string;

    @Column({ length: 500, nullable: true })
    medium_url: string;

    @Column({ length: 500, nullable: true })
    large_url: string;

    @Column({ length: 255, nullable: true })
    alt_text: string;

    @Column({ default: false })
    is_primary: boolean;

    @Column({ default: 0 })
    display_order: number;

    @Column({ nullable: true })
    file_size: number;

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({
        type: 'enum',
        enum: ['exterior', 'interior', 'engine', 'documents', 'damage', 'service_records', 'other'],
        default: 'exterior'
    })
    image_type: string;

    @Column({
        type: 'enum',
        enum: ['front', 'rear', 'side_left', 'side_right', 'interior_dashboard', 'interior_seats', 'engine_bay', 'document', 'other'],
        nullable: true
    })
    view_angle: string;

    @Column({ default: false })
    is_360_view: boolean;

    @Column({
        type: 'enum',
        enum: ['uploading', 'processing', 'ready', 'failed'],
        default: 'uploading'
    })
    processing_status: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => Car, car => car.images, { onDelete: 'CASCADE' })
    car: Car;
}

@Entity('favorites')
@Index(['user_id'])
@Index(['car_id'])
export class Favorite {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    car_id: number;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, user => user.favorites, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Car, car => car.favorites, { onDelete: 'CASCADE' })
    car: Car;
}

@Entity('price_history')
@Index(['car_id'])
@Index(['created_at'])
export class PriceHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    car_id: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    old_price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    new_price: number;

    @Column({ length: 3, default: 'PHP' })
    currency: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    price_change_percent: number;

    @Column()
    changed_by: number;

    @Column({
        type: 'enum',
        enum: ['manual', 'market_adjustment', 'promotion', 'negotiation', 'currency_update', 'admin_correction'],
        default: 'manual'
    })
    change_reason: string;

    @Column({ type: 'text', nullable: true })
    reason_notes: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => Car, car => car.priceHistory, { onDelete: 'CASCADE' })
    car: Car;

    @ManyToOne(() => User)
    changer: User;

    @ManyToOne(() => Currency)
    currencyObj: Currency;
}

@Entity('user_actions')
@Index(['user_id'])
@Index(['action_type'])
@Index(['target_type', 'target_id'])
@Index(['created_at'])
export class UserAction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    user_id: number;

    @Column({ length: 255, nullable: true })
    session_id: string;

    @Column({
        type: 'enum',
        enum: ['view_car', 'search', 'contact_seller', 'favorite', 'unfavorite', 'share', 'report', 'save_search', 'login', 'register', 'upload_car']
    })
    action_type: string;

    @Column({
        type: 'enum',
        enum: ['car', 'user', 'search', 'category', 'brand', 'system']
    })
    target_type: string;

    @Column({ nullable: true })
    target_id: number;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @Column({ length: 45, nullable: true })
    ip_address: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Column({ length: 500, nullable: true })
    referrer: string;

    @Column({ length: 500, nullable: true })
    page_url: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    user: User;
}

// Philippines location entities
@Entity('ph_regions')
export class PhRegion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 10, unique: true })
    region_code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 200, nullable: true })
    long_name: string;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany(() => PhProvince, province => province.region)
    provinces: PhProvince[];

    @OneToMany(() => User, user => user.region)
    users: User[];

    @OneToMany(() => Car, car => car.region)
    cars: Car[];
}

@Entity('ph_provinces')
export class PhProvince {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    region_id: number;

    @Column({ length: 10, unique: true })
    province_code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 100, nullable: true })
    capital: string;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => PhRegion, region => region.provinces)
    region: PhRegion;

    @OneToMany(() => PhCity, city => city.province)
    cities: PhCity[];

    @OneToMany(() => User, user => user.province)
    users: User[];

    @OneToMany(() => Car, car => car.province)
    cars: Car[];
}

@Entity('ph_cities')
export class PhCity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    province_id: number;

    @Column({ length: 10, unique: true, nullable: true })
    city_code: string;

    @Column({ length: 100 })
    name: string;

    @Column({
        type: 'enum',
        enum: ['city', 'municipality', 'district'],
        default: 'city'
    })
    city_type: string;

    @Column({ default: false })
    is_highly_urbanized: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 8, default: 0 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, default: 0 })
    longitude: number;

    @Column({ type: 'json', nullable: true })
    postal_codes: string[];

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => PhProvince, province => province.cities)
    province: PhProvince;

    @OneToMany(() => User, user => user.city)
    users: User[];

    @OneToMany(() => Car, car => car.city)
    cars: Car[];
}

@Entity('currencies')
export class Currency {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 3, unique: true })
    code: string;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 10 })
    symbol: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 1.0000 })
    exchange_rate_to_php: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToMany(() => User, user => user.currency)
    users: User[];

    @OneToMany(() => Car, car => car.currencyObj)
    cars: Car[];
}

@Entity('standard_colors')
export class StandardColor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    name: string;

    @Column({ length: 7, nullable: true })
    hex_code: string;

    @Column({
        type: 'enum',
        enum: ['black', 'white', 'silver', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'brown', 'purple', 'other']
    })
    color_family: string;

    @Column({ default: true })
    is_common: boolean;

    @OneToMany(() => Car, car => car.exterior_color)
    cars_exterior: Car[];

    @OneToMany(() => Car, car => car.interior_color)
    cars_interior: Car[];
}