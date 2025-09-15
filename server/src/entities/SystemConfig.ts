import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ConfigDataType {
    STRING = 'string',
    TEXT = 'text',
    INTEGER = 'integer',
    FLOAT = 'float',
    BOOLEAN = 'boolean',
    JSON = 'json',
    DATE = 'date',
    DATETIME = 'datetime'
}

export enum ConfigCategory {
    GENERAL = 'general',
    EMAIL = 'email',
    UPLOADS = 'uploads',
    LISTINGS = 'listings',
    PAYMENTS = 'payments',
    SECURITY = 'security',
    NOTIFICATIONS = 'notifications',
    ANALYTICS = 'analytics',
    SEARCH = 'search',
    SOCIAL = 'social',
    CONTACT = 'contact',
    SMS = 'sms',
    INTEGRATIONS = 'integrations'
}

@Entity('system_configs')
@Index(['config_key'], { unique: true })
@Index(['category'])
@Index(['is_public'])
export class SystemConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    config_key: string;

    @Column({ type: 'text' })
    config_value: string;

    @Column({
        type: 'enum',
        enum: ConfigDataType,
        default: ConfigDataType.STRING
    })
    data_type: ConfigDataType;

    @Column({
        type: 'enum',
        enum: ConfigCategory,
        default: ConfigCategory.GENERAL
    })
    category: ConfigCategory;

    @Column({ length: 500, nullable: true })
    description: string;

    @Column({ default: false })
    is_public: boolean; // Whether this config can be accessed by frontend

    @Column({ default: true })
    is_editable: boolean; // Whether this config can be edited through admin panel

    @Column({ type: 'text', nullable: true })
    validation_rules: string; // JSON string with validation rules

    @Column({ type: 'text', nullable: true })
    options: string; // JSON string with possible options for select fields

    @Column({ type: 'text', nullable: true })
    default_value: string;

    @Column({ default: 0 })
    sort_order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Virtual getters
    get parsed_value(): any {
        return this.parseValue(this.config_value);
    }

    get parsed_validation_rules(): any {
        try {
            return this.validation_rules ? JSON.parse(this.validation_rules) : {};
        } catch {
            return {};
        }
    }

    get parsed_options(): any[] {
        try {
            return this.options ? JSON.parse(this.options) : [];
        } catch {
            return [];
        }
    }

    get parsed_default_value(): any {
        return this.parseValue(this.default_value || this.config_value);
    }

    // Helper methods
    private parseValue(value: string): any {
        if (!value) return null;

        switch (this.data_type) {
            case ConfigDataType.BOOLEAN:
                return value.toLowerCase() === 'true';
            
            case ConfigDataType.INTEGER:
                return parseInt(value, 10);
            
            case ConfigDataType.FLOAT:
                return parseFloat(value);
            
            case ConfigDataType.JSON:
                try {
                    return JSON.parse(value);
                } catch {
                    return {};
                }
            
            case ConfigDataType.DATE:
            case ConfigDataType.DATETIME:
                return new Date(value);
            
            case ConfigDataType.STRING:
            case ConfigDataType.TEXT:
            default:
                return value;
        }
    }

    // Static methods for common operations
    static formatValue(value: any, dataType: ConfigDataType): string {
        if (value === null || value === undefined) return '';

        switch (dataType) {
            case ConfigDataType.BOOLEAN:
                return value ? 'true' : 'false';
            
            case ConfigDataType.JSON:
                return JSON.stringify(value);
            
            case ConfigDataType.DATE:
            case ConfigDataType.DATETIME:
                return value instanceof Date ? value.toISOString() : String(value);
            
            default:
                return String(value);
        }
    }

    static validateValue(value: any, dataType: ConfigDataType, validationRules?: any): boolean {
        switch (dataType) {
            case ConfigDataType.BOOLEAN:
                return typeof value === 'boolean' || 
                       (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase()));
            
            case ConfigDataType.INTEGER:
                const intVal = parseInt(String(value), 10);
                if (isNaN(intVal)) return false;
                if (validationRules?.min !== undefined && intVal < validationRules.min) return false;
                if (validationRules?.max !== undefined && intVal > validationRules.max) return false;
                return true;
            
            case ConfigDataType.FLOAT:
                const floatVal = parseFloat(String(value));
                if (isNaN(floatVal)) return false;
                if (validationRules?.min !== undefined && floatVal < validationRules.min) return false;
                if (validationRules?.max !== undefined && floatVal > validationRules.max) return false;
                return true;
            
            case ConfigDataType.STRING:
            case ConfigDataType.TEXT:
                const strVal = String(value);
                if (validationRules?.minLength !== undefined && strVal.length < validationRules.minLength) return false;
                if (validationRules?.maxLength !== undefined && strVal.length > validationRules.maxLength) return false;
                if (validationRules?.pattern && !new RegExp(validationRules.pattern).test(strVal)) return false;
                return true;
            
            case ConfigDataType.JSON:
                try {
                    JSON.parse(String(value));
                    return true;
                } catch {
                    return false;
                }
            
            case ConfigDataType.DATE:
            case ConfigDataType.DATETIME:
                return !isNaN(Date.parse(String(value)));
            
            default:
                return true;
        }
    }
}