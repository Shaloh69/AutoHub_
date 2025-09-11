import { AppDataSource } from "../../config/database";

// Currency Seeder
export const seedCurrencies = async () => {
    const currencyRepository = AppDataSource.getRepository('Currency');
    
    const currencies = [
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱', exchange_rate_to_php: 1.0000 },
        { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate_to_php: 56.50 },
        { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate_to_php: 61.20 },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchange_rate_to_php: 0.38 },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchange_rate_to_php: 37.80 },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchange_rate_to_php: 42.10 }
    ];

    for (const currency of currencies) {
        const existing = await currencyRepository.findOne({ where: { code: currency.code } });
        if (!existing) {
            await currencyRepository.save(currency);
        }
    }
};