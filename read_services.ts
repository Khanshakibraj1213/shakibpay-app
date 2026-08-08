import { getServices } from './src/lib/firebaseDb';
async function run() {
  const docs = await getServices();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
}
run();
