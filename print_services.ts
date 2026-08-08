import { getServices } from './src/lib/firebaseDb';

async function run() {
  const services = await getServices();
  const summary = services.map(s => ({ id: s.id, name: s.name, slug: s.slug, type: s.type }));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}
run();
