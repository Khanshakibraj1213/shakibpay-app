import { getDocById } from './src/lib/firebaseDb';
async function run() {
  const doc = await getDocById("system_settings", "site_config");
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}
run();
