import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserSubscription } from './UserSubscription';

export enum BillingCycle {
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ length: 255, nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monthly_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    yearly_price: number;

    @Column({ length: 3, default: 'PHP' })
    currency: string;

    @Column({ default: 3 })
    max_active_listings: number; // -1 for unlimited

    @Column({ default: 5 })
    max_images_per_listing: number;

    @Column({ default: false })
    featured_listings_included: boolean;

    @Column({ default: 0 })
    featured_listings_count: number;

    @Column({ default: false })
    premium_support: boolean;

    @Column({ default: false })
    analytics_access: boolean;

    @Column({ default: false })
    priority_approval: boolean;

    @Column({ default: false })
    auto_repost: boolean;

    @Column({ default: 30 })
    listing_duration_days: number;

    @Column({ default: 0 })
    boost_credits_monthly: number;

    @Column({ default: false })
    watermark_removal: boolean;

    @Column({ default: false })
    contact_protection: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_popular: boolean;

    @Column({ length: 150, unique: true, nullable: true })
    seo_slug: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => UserSubscription, subscription => subscription.plan)
    subscriptions: UserSubscription[];

    // Virtual getters
    get yearly_discount_percentage(): number {
        const monthlyTotal = this.monthly_price * 12;
        if (monthlyTotal === 0) return 0;
        return Math.round(((monthlyTotal - this.yearly_price) / monthlyTotal) * 100);
    }

    get is_unlimited_listings(): boolean {
        return this.max_active_listings === -1;
    }
}