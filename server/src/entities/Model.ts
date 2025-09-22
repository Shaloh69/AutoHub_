import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from 'typeorm';
import { Brand } from './Brand';
import { Car } from './Car';

export enum BrandType {
    LUXURY = 'luxury',
    MAINSTREAM = 'mainstream',
    ECONOMY = 'economy',
    COMMERCIAL = 'commercial',
    MOTORCYCLE = 'motorcycle'
}

@Entity('models')
@Index(['brand_id'])
@Index(['body_type'])
@Index(['is_popular_in_ph'])
export class Model {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    brand_id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({
        type: 'enum',
        enum: ['sedan', 'hatchback', 'suv', 'coupe', 'convertible', 'pickup', 'van', 'wagon', 'crossover', 'minivan', 'mpv', 'jeepney', 'tricycle']
    })
    body_type!: string;

    @Column({ length: 50, nullable: true })
    generation!: string;

    @Column({ nullable: true })
    year_start!: number;

    @Column({ nullable: true })
    year_end!: number;

    @Column({ default: false })
    is_popular_in_ph!: boolean;

    @Column({ default: true })
    is_active!: boolean;

    @Column({ length: 200, unique: true, nullable: true })
    seo_slug!: string;

    @Column({ length: 255, nullable: true })
    meta_title!: string;

    @Column({ type: 'text', nullable: true })
    meta_description!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @ManyToOne(() => Brand, brand => brand.models)
    brand!: Brand;

    @OneToMany(() => Car, car => car.model)
    cars!: Car[];
}