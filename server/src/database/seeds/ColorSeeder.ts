import { AppDataSource } from "../../config/database";


// Color Seeder
export const seedStandardColors = async () => {
    const colorRepository = AppDataSource.getRepository('StandardColor');
    
    const colors = [
        { name: 'Pearl White', hex_code: '#F8F8FF', color_family: 'white', is_common: true },
        { name: 'Solid White', hex_code: '#FFFFFF', color_family: 'white', is_common: true },
        { name: 'Jet Black', hex_code: '#000000', color_family: 'black', is_common: true },
        { name: 'Metallic Black', hex_code: '#1C1C1C', color_family: 'black', is_common: true },
        { name: 'Silver Metallic', hex_code: '#C0C0C0', color_family: 'silver', is_common: true },
        { name: 'Space Gray', hex_code: '#4A4A4A', color_family: 'gray', is_common: true },
        { name: 'Midnight Blue', hex_code: '#191970', color_family: 'blue', is_common: true },
        { name: 'Royal Blue', hex_code: '#4169E1', color_family: 'blue', is_common: true },
        { name: 'Cherry Red', hex_code: '#DC143C', color_family: 'red', is_common: true },
        { name: 'Metallic Red', hex_code: '#B22222', color_family: 'red', is_common: true },
        { name: 'Forest Green', hex_code: '#228B22', color_family: 'green', is_common: false },
        { name: 'Champagne Gold', hex_code: '#F7E7CE', color_family: 'yellow', is_common: false },
        { name: 'Bronze', hex_code: '#CD7F32', color_family: 'brown', is_common: false },
        { name: 'Maroon', hex_code: '#800000', color_family: 'red', is_common: false }
    ];

    for (const color of colors) {
        const existing = await colorRepository.findOne({ where: { name: color.name } });
        if (!existing) {
            await colorRepository.save(color);
        }
    }
};
