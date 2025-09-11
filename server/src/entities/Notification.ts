import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Car } from './Car';
import { Inquiry } from './Inquiry';
import { Transaction } from './Transaction';

export enum NotificationType {
    CAR_APPROVED = 'car_approved',
    CAR_REJECTED = 'car_rejected',
    CAR_NEEDS_REVISION = 'car_needs_revision',
    NEW_INQUIRY = 'new_inquiry',
    INQUIRY_RESPONSE = 'inquiry_response',
    CAR_SOLD = 'car_sold',
    NEW_RATING = 'new_rating',
    PRICE_DROP_ALERT = 'price_drop_alert',
    SAVED_SEARCH_MATCH = 'saved_search_match',
    FEATURED_CAR_EXPIRING = 'featured_car_expiring',
    CAR_EXPIRING = 'car_expiring',
    PAYMENT_RECEIVED = 'payment_received',
    DOCUMENT_REQUIRED = 'document_required',
    TEST_DRIVE_SCHEDULED = 'test_drive_scheduled',
    SYSTEM_MAINTENANCE = 'system_maintenance',
    ACCOUNT_VERIFICATION = 'account_verification',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    PROMOTION = 'promotion',
    SUBSCRIPTION_EXPIRING = 'subscription_expiring',
    SUBSCRIPTION_EXPIRED = 'subscription_expired',
    PAYMENT_FAILED = 'payment_failed'
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

@Entity('notifications')
@Index(['user_id'])
@Index(['type'])
@Index(['is_read'])
@Index(['created_at'])
@Index(['user_id', 'is_read', 'created_at'])
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column({
        type: 'enum',
        enum: NotificationType
    })
    type: NotificationType;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ length: 100, nullable: true })
    action_text: string;

    @Column({ length: 500, nullable: true })
    action_url: string;

    @Column({ default: false })
    is_read: boolean;

    @Column({ default: false })
    is_push_sent: boolean;

    @Column({ default: false })
    is_email_sent: boolean;

    @Column({ default: false })
    is_sms_sent: boolean;

    // Related objects
    @Column({ nullable: true })
    related_car_id: number;

    @Column({ nullable: true })
    related_inquiry_id: number;

    @Column({ nullable: true })
    related_transaction_id: number;

    @Column({ nullable: true })
    related_user_id: number;

    // Scheduling
    @Column({ type: 'timestamp', nullable: true })
    send_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    // Priority and grouping
    @Column({
        type: 'enum',
        enum: NotificationPriority,
        default: NotificationPriority.MEDIUM
    })
    priority: NotificationPriority;

    @Column({ length: 100, nullable: true })
    notification_group: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    read_at: Date;

    // Relations
    @ManyToOne(() => User, user => user.notifications)
    user: User;

    @ManyToOne(() => Car, { nullable: true })
    related_car: Car;

    @ManyToOne(() => Inquiry, { nullable: true })
    related_inquiry: Inquiry;

    @ManyToOne(() => Transaction, { nullable: true })
    related_transaction: Transaction;

    @ManyToOne(() => User, { nullable: true })
    related_user: User;

    // Virtual getters
    get is_expired(): boolean {
        return this.expires_at ? this.expires_at < new Date() : false;
    }

    get age_minutes(): number {
        const now = new Date();
        const created = new Date(this.created_at);
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    }

    get should_send_push(): boolean {
        return !this.is_push_sent && !this.is_expired && 
               (this.send_at ? this.send_at <= new Date() : true);
    }
}

// Additional entities referenced
@Entity('inquiries')
export class Inquiry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    car_id: number;

    @Column()
    buyer_id: number;

    @Column()
    seller_id: number;

    @Column({ length: 255, nullable: true })
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ length: 200, nullable: true })
    buyer_name: string;

    @Column({ length: 255, nullable: true })
    buyer_email: string;

    @Column({ length: 20, nullable: true })
    buyer_phone: string;

    @Column({
        type: 'enum',
        enum: ['general', 'test_drive', 'price_negotiation', 'inspection', 'purchase_intent', 'financing', 'trade_in'],
        default: 'general'
    })
    inquiry_type: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    offered_price: number;

    @Column({ default: false })
    test_drive_requested: boolean;

    @Column({ default: false })
    inspection_requested: boolean;

    @Column({ default: false })
    financing_needed: boolean;

    @Column({ type: 'text', nullable: true })
    trade_in_vehicle: string;

    @Column({
        type: 'enum',
        enum: ['new', 'read', 'replied', 'in_negotiation', 'test_drive_scheduled', 'closed', 'converted', 'spam'],
        default: 'new'
    })
    status: string;

    @Column({ default: false })
    is_read: boolean;

    @Column({
        type: 'enum',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    })
    priority: string;

    @Column({ default: 0 })
    response_count: number;

    @Column({ type: 'timestamp', nullable: true })
    last_response_at: Date;

    @Column({ nullable: true })
    last_response_by: number;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // Relations
    @ManyToOne(() => Car)
    car: Car;

    @ManyToOne(() => User)
    buyer: User;

    @ManyToOne(() => User)
    seller: User;
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    car_id: number;

    @Column()
    seller_id: number;

    @Column()
    buyer_id: number;

    @Column({ nullable: true })
    inquiry_id: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    agreed_price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    original_price: number;

    @Column({ length: 3, default: 'PHP' })
    currency: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    deposit_amount: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    balance_amount: number;

    @Column({
        type: 'enum',
        enum: ['cash', 'bank_transfer', 'financing', 'trade_in', 'installment', 'check'],
        default: 'cash'
    })
    payment_method: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'deposit_paid', 'financing_approved', 'documents_ready', 'completed', 'cancelled', 'disputed', 'refunded'],
        default: 'pending'
    })
    status: string;

    @Column({ type: 'timestamp', nullable: true })
    agreement_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    completion_date: Date;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => Car)
    car: Car;

    @ManyToOne(() => User)
    buyer: User;

    @ManyToOne(() => User)
    seller: User;

    @ManyToOne(() => Inquiry, { nullable: true })
    inquiry: Inquiry;
}