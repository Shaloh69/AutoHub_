import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { SubscriptionPlan, BillingCycle } from './SubscriptionPlan';

export enum SubscriptionStatus {
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
    PAST_DUE = 'past_due',
    EXPIRED = 'expired',
    TRIALING = 'trialing',
    INCOMPLETE = 'incomplete'
}

@Entity('user_subscriptions')
@Index(['user_id'])
@Index(['status'])
@Index(['current_period_end'])
export class UserSubscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    plan_id: number;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE
    })
    status: SubscriptionStatus;

    @Column({
        type: 'enum',
        enum: BillingCycle,
        default: BillingCycle.MONTHLY
    })
    billing_cycle: BillingCycle;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monthly_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    yearly_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    current_price: number;

    @Column({ length: 3, default: 'PHP' })
    currency: string;

    @Column({ type: 'timestamp' })
    started_at: Date;

    @Column({ type: 'timestamp' })
    current_period_start: Date;

    @Column({ type: 'timestamp' })
    current_period_end: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date;

    @Column({ type: 'text', nullable: true })
    cancellation_reason: string;

    @Column({ default: true })
    auto_renew: boolean;

    @Column({ length: 255, nullable: true })
    external_subscription_id: string; // Stripe subscription ID

    @Column({ length: 255, nullable: true })
    external_customer_id: string; // Stripe customer ID

    @Column({ type: 'timestamp', nullable: true })
    last_payment_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    next_payment_at: Date;

    @Column({ default: 0 })
    failed_payment_attempts: number;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => User, user => user.subscriptions)
    user: User;

    @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions)
    plan: SubscriptionPlan;

    // Virtual getters
    get is_active(): boolean {
        return this.status === SubscriptionStatus.ACTIVE && this.current_period_end > new Date();
    }

    get days_until_expiry(): number {
        const now = new Date();
        const expiry = new Date(this.current_period_end);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    get is_expired(): boolean {
        return this.current_period_end < new Date();
    }

    get total_amount_paid(): number {
        // This would typically be calculated from payment history
        return this.current_price;
    }
}