import { appPromise } from '../server';

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
