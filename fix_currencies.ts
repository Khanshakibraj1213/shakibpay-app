import { setDocById } from './src/lib/firebaseDb';

const globalCurrencies = [
  { id: 'c1', name: 'USD', rate: 120 },
  { id: 'c2', name: 'USDT', rate: 121 },
  { id: 'c3', name: 'EUR', rate: 130 },
  { id: 'c4', name: 'GBP', rate: 152 },
  { id: 'c5', name: 'SAR', rate: 32 },
  { id: 'c6', name: 'AED', rate: 32.6 },
  { id: 'c7', name: 'MYR', rate: 25.5 },
  { id: 'c8', name: 'SGD', rate: 89 },
  { id: 'c9', name: 'QAR', rate: 33 },
  { id: 'c10', name: 'KWD', rate: 391 },
  { id: 'c11', name: 'OMR', rate: 311 },
  { id: 'c12', name: 'BHD', rate: 318 },
  { id: 'c13', name: 'INR', rate: 1.44 }
];

async function seed() {
  await setDocById("system_settings", "site_config", { currencies: globalCurrencies });
  console.log('Currencies seeded.');
  process.exit(0);
}
seed();
