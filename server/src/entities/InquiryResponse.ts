import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Inquiry } from './Inquiry';

@Entity('inquiry_responses')
@Index(['inquiry_id'])
@Index(['created_at'])
export class InquiryResponse {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    inquiry_id: number;

    @Column()
    responder_id: number;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: ['text', 'offer', 'counter_offer', 'acceptance', 'rejection', 'schedule', 'system'],
        default: 'text'
    })
    response_type: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    offered_price: number;

    @Column({ type: 'json', nullable: true })
    scheduling_details: Record<string, any>;

    @Column({ type: 'json', nullable: true })
    attachments: string[];

    @Column({ default: false })
    is_read: boolean;

    @Column({ default: false })
    is_internal_note: boolean;

    @Column({ length: 45, nullable: true })
    ip_address: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    read_at: Date;

    // Relations
    @ManyToOne(() => Inquiry, inquiry => inquiry.responses, { onDelete: 'CASCADE' })
    inquiry: Inquiry;

    @ManyToOne(() => User)
    responder: User;

    // Virtual getters
    get is_price_offer(): boolean {
        return this.response_type === 'offer' || this.response_type === 'counter_offer';
    }

    get is_scheduling_related(): boolean {
        return this.response_type === 'schedule';
    }

    get response_age_hours(): number {
        const now = new Date();
        const created = new Date(this.created_at);
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    }
}