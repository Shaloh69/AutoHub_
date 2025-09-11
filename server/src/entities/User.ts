import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Car } from './Car';
import { UserSubscription } from './UserSubscription';
import { Inquiry } from './Inquiry';
import { Transaction } from './Transaction';
import { Notification } from './Notification';
import { Favorite } from './Favorite';
import { PhCity } from './PhCity';
import { PhProvince } from './PhProvince';
import { PhRegion } from './PhRegion';
import { Currency } from './Currency';

export enum UserRole {
    BUYER = 'buyer',
    SELLER = 'seller',
    DEALER = 'dealer',
    ADMIN = 'admin',
    MODERATOR = 'moderator'
}

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['is_active', 'is_banned'])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255 })
    password_hash: string;

    @Column({ length: 100 })
    first_name: string;

    @Column({ length: 100 })
    last_name: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.BUYER
    })
    role: UserRole;

    @Column({ length: 500, nullable: true })
    profile_image: string;

    // Philippines Address
    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ nullable: true })
    city_id: number;

    @Column({ nullable: true })
    province_id: number;

    @Column({ nullable: true })
    region_id: number;

    @Column({ length: 10, nullable: true })
    postal_code: string;

    @Column({ length: 100, nullable: true })
    barangay: string;

    // Business Information (for dealers)
    @Column({ length: 200, nullable: true })
    business_name: string;

    @Column({ length: 100, nullable: true })
    business_permit_number: string;

    @Column({ length: 20, nullable: true })
    tin_number: string;

    @Column({ length: 100, nullable: true })
    dealer_license_number: string;

    // Verification Status
    @Column({ default: false })
    email_verified: boolean;

    @Column({ default: false })
    phone_verified: boolean;

    @Column({ default: false })
    identity_verified: boolean;

    @Column({ default: false })
    business_verified: boolean;

    // Verification Documents
    @Column({ length: 500, nullable: true })
    valid_id_front_url: string;

    @Column({ length: 500, nullable: true })
    valid_id_back_url: string;

    @Column({ length: 500, nullable: true })
    selfie_with_id_url: string;

    @Column({ length: 500, nullable: true })
    business_permit_url: string;

    // Rating Statistics
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    average_rating: number;

    @Column({ default: 0 })
    total_ratings: number;

    @Column({ default: 0 })
    total_sales: number;

    @Column({ default: 0 })
    total_purchases: number;

    // Account Status
    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_banned: boolean;

    @Column({ type: 'text', nullable: true })
    ban_reason: string;

    @Column({ type: 'timestamp', nullable: true })
    ban_expires_at: Date;

    // Fraud Prevention
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
    fraud_score: number;

    @Column({ default: 0 })
    warning_count: number;

    @Column({ type: 'timestamp', nullable: true })
    last_warning_at: Date;

    // Preferences
    @Column({ length: 3, default: 'PHP' })
    preferred_currency: string;

    @Column({ default: true })
    email_notifications: boolean;

    @Column({ default: true })
    sms_notifications: boolean;

    @Column({ default: true })
    push_notifications: boolean;

    // Tracking
    @Column({ type: 'timestamp', nullable: true })
    last_login_at: Date;

    @Column({ length: 45, nullable: true })
    last_login_ip: string;

    @Column({ default: 0 })
    login_count: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => PhCity, { nullable: true })
    city: PhCity;

    @ManyToOne(() => PhProvince, { nullable: true })
    province: PhProvince;

    @ManyToOne(() => PhRegion, { nullable: true })
    region: PhRegion;

    @ManyToOne(() => Currency)
    currency: Currency;

    @OneToMany(() => Car, car => car.seller)
    cars: Car[];

    @OneToMany(() => UserSubscription, subscription => subscription.user)
    subscriptions: UserSubscription[];

    @OneToMany(() => Inquiry, inquiry => inquiry.buyer)
    inquiries_sent: Inquiry[];

    @OneToMany(() => Inquiry, inquiry => inquiry.seller)
    inquiries_received: Inquiry[];

    @OneToMany(() => Transaction, transaction => transaction.buyer)
    purchases: Transaction[];

    @OneToMany(() => Transaction, transaction => transaction.seller)
    sales: Transaction[];

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];

    @OneToMany(() => Favorite, favorite => favorite.user)
    favorites: Favorite[];

    // Virtual getters
    get full_name(): string {
        return `${this.first_name} ${this.last_name}`;
    }

    get is_dealer(): boolean {
        return this.role === UserRole.DEALER;
    }

    get is_admin(): boolean {
        return [UserRole.ADMIN, UserRole.MODERATOR].includes(this.role);
    }
}