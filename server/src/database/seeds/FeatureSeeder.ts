import { AppDataSource } from "../../config/database";

// Feature Seeder
export const seedFeatures = async () => {
    const featureRepository = AppDataSource.getRepository('Feature');

    const features = [
        // Safety Features
        {
            name: 'Anti-lock Braking System (ABS)',
            category: 'safety',
            description: 'Prevents wheels from locking during braking',
            icon_class: 'fas fa-shield-alt',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Electronic Stability Control (ESC)',
            category: 'safety',
            description: 'Helps maintain vehicle stability during turns',
            icon_class: 'fas fa-balance-scale',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Airbags (Front)',
            category: 'safety',
            description: 'Front airbags for driver and passenger protection',
            icon_class: 'fas fa-life-ring',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Airbags (Side)',
            category: 'safety',
            description: 'Side airbags for additional protection',
            icon_class: 'fas fa-life-ring',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Airbags (Curtain)',
            category: 'safety',
            description: 'Curtain airbags for head protection',
            icon_class: 'fas fa-life-ring',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Blind Spot Monitoring',
            category: 'safety',
            description: 'Alerts driver of vehicles in blind spots',
            icon_class: 'fas fa-eye',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Lane Departure Warning',
            category: 'safety',
            description: 'Warns when vehicle drifts out of lane',
            icon_class: 'fas fa-road',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Forward Collision Warning',
            category: 'safety',
            description: 'Alerts driver of potential frontal collision',
            icon_class: 'fas fa-exclamation-triangle',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Automatic Emergency Braking',
            category: 'safety',
            description: 'Automatically applies brakes in emergency situations',
            icon_class: 'fas fa-hand-paper',
            is_premium: true,
            is_popular: false
        },

        // Comfort Features
        {
            name: 'Air Conditioning',
            category: 'comfort',
            description: 'Climate control system',
            icon_class: 'fas fa-snowflake',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Automatic Climate Control',
            category: 'comfort',
            description: 'Automatically maintains set temperature',
            icon_class: 'fas fa-thermometer-half',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Power Steering',
            category: 'comfort',
            description: 'Assists with steering effort',
            icon_class: 'fas fa-steering-wheel',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Power Windows',
            category: 'comfort',
            description: 'Electric window controls',
            icon_class: 'fas fa-window-maximize',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Central Locking',
            category: 'comfort',
            description: 'Remote central door locking system',
            icon_class: 'fas fa-key',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Keyless Entry',
            category: 'comfort',
            description: 'Remote keyless entry system',
            icon_class: 'fas fa-key',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Push Button Start',
            category: 'comfort',
            description: 'Start engine with push button',
            icon_class: 'fas fa-power-off',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Cruise Control',
            category: 'comfort',
            description: 'Maintains constant speed automatically',
            icon_class: 'fas fa-tachometer-alt',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Heated Seats',
            category: 'comfort',
            description: 'Electrically heated front seats',
            icon_class: 'fas fa-fire',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Ventilated Seats',
            category: 'comfort',
            description: 'Air-conditioned front seats',
            icon_class: 'fas fa-wind',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Memory Seats',
            category: 'comfort',
            description: 'Programmable seat positions',
            icon_class: 'fas fa-chair',
            is_premium: true,
            is_popular: false
        },

        // Technology Features
        {
            name: 'Touchscreen Infotainment',
            category: 'technology',
            description: 'Touch-operated display screen',
            icon_class: 'fas fa-mobile-alt',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Apple CarPlay',
            category: 'technology',
            description: 'iPhone integration system',
            icon_class: 'fab fa-apple',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Android Auto',
            category: 'technology',
            description: 'Android phone integration system',
            icon_class: 'fab fa-android',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Bluetooth Connectivity',
            category: 'technology',
            description: 'Wireless device connectivity',
            icon_class: 'fab fa-bluetooth',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'USB Ports',
            category: 'technology',
            description: 'USB charging and connectivity ports',
            icon_class: 'fab fa-usb',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Wireless Charging',
            category: 'technology',
            description: 'Wireless phone charging pad',
            icon_class: 'fas fa-battery-full',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Navigation System',
            category: 'technology',
            description: 'Built-in GPS navigation',
            icon_class: 'fas fa-map-marked-alt',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Backup Camera',
            category: 'technology',
            description: 'Rear-view camera for parking assistance',
            icon_class: 'fas fa-video',
            is_premium: true,
            is_popular: true
        },
        {
            name: '360-Degree Camera',
            category: 'technology',
            description: 'Surround view camera system',
            icon_class: 'fas fa-eye',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Parking Sensors',
            category: 'technology',
            description: 'Ultrasonic parking assistance',
            icon_class: 'fas fa-satellite-dish',
            is_premium: true,
            is_popular: true
        },

        // Performance Features
        {
            name: 'Turbo Engine',
            category: 'performance',
            description: 'Turbocharged engine for extra power',
            icon_class: 'fas fa-tachometer-alt',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'All-Wheel Drive (AWD)',
            category: 'performance',
            description: 'Power sent to all four wheels',
            icon_class: 'fas fa-cogs',
            is_premium: true,
            is_popular: false
        },
        {
            name: '4WD (Four-Wheel Drive)',
            category: 'performance',
            description: 'Selectable four-wheel drive system',
            icon_class: 'fas fa-mountain',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Sport Mode',
            category: 'performance',
            description: 'Enhanced performance driving mode',
            icon_class: 'fas fa-flag-checkered',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Paddle Shifters',
            category: 'performance',
            description: 'Manual gear selection paddles',
            icon_class: 'fas fa-hand-point-up',
            is_premium: true,
            is_popular: false
        },

        // Exterior Features
        {
            name: 'LED Headlights',
            category: 'exterior',
            description: 'Energy-efficient LED headlamps',
            icon_class: 'fas fa-lightbulb',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'LED Daytime Running Lights',
            category: 'exterior',
            description: 'LED lights for daytime visibility',
            icon_class: 'fas fa-sun',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Fog Lights',
            category: 'exterior',
            description: 'Additional lights for poor visibility',
            icon_class: 'fas fa-cloud',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Sunroof',
            category: 'exterior',
            description: 'Openable roof panel',
            icon_class: 'fas fa-sun',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Panoramic Sunroof',
            category: 'exterior',
            description: 'Large glass roof panel',
            icon_class: 'fas fa-sun',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Alloy Wheels',
            category: 'exterior',
            description: 'Lightweight alloy wheel rims',
            icon_class: 'fas fa-circle',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Roof Rails',
            category: 'exterior',
            description: 'Rails for carrying roof cargo',
            icon_class: 'fas fa-bars',
            is_premium: false,
            is_popular: false
        },

        // Interior Features
        {
            name: 'Leather Seats',
            category: 'interior',
            description: 'Premium leather upholstery',
            icon_class: 'fas fa-chair',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Fabric Seats',
            category: 'interior',
            description: 'Cloth seat upholstery',
            icon_class: 'fas fa-chair',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Third Row Seating',
            category: 'interior',
            description: 'Additional seating row',
            icon_class: 'fas fa-users',
            is_premium: false,
            is_popular: false
        },
        {
            name: 'Split-Folding Rear Seats',
            category: 'interior',
            description: 'Foldable rear seats for extra cargo',
            icon_class: 'fas fa-couch',
            is_premium: false,
            is_popular: true
        },
        {
            name: 'Premium Audio System',
            category: 'entertainment',
            description: 'High-quality sound system',
            icon_class: 'fas fa-volume-up',
            is_premium: true,
            is_popular: true
        },
        {
            name: 'Ambient Lighting',
            category: 'interior',
            description: 'Decorative interior lighting',
            icon_class: 'fas fa-lightbulb',
            is_premium: true,
            is_popular: false
        },

        // Convenience Features
        {
            name: 'Rain-Sensing Wipers',
            category: 'convenience',
            description: 'Automatic windshield wipers',
            icon_class: 'fas fa-cloud-rain',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Auto-Dimming Mirrors',
            category: 'convenience',
            description: 'Automatically dimming rearview mirrors',
            icon_class: 'fas fa-mirror',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Power Tailgate',
            category: 'convenience',
            description: 'Electrically operated rear door',
            icon_class: 'fas fa-door-open',
            is_premium: true,
            is_popular: false
        },
        {
            name: 'Hands-Free Tailgate',
            category: 'convenience',
            description: 'Foot-activated tailgate opening',
            icon_class: 'fas fa-hand-paper',
            is_premium: true,
            is_popular: false
        }
    ];

    for (const feature of features) {
        const existing = await featureRepository.findOne({ where: { name: feature.name } });
        if (!existing) {
            await featureRepository.save(feature);
        }
    }
};