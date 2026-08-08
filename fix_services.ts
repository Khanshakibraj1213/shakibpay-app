import { setDocById, getServices } from './src/lib/firebaseDb';

async function fix() {
  const services = await getServices();
  
  for (const s of services) {
    if (s.slug === 'ecommerce') {
      s.slug = 'calling_card';
      s.name = 'Calling Card';
      s.sortOrder = 7;
      await setDocById('services', s.id, s);
      console.log('Updated ecommerce to calling_card');
    }
    
    if (s.slug === 'make_agent') {
      s.sortOrder = 8;
      await setDocById('services', s.id, s);
      console.log('Updated make_agent');
    }
  }
  
  console.log('Fixed services.');
  process.exit(0);
}
fix();
