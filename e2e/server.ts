import next from 'next';
import { createServer } from 'node:http';

export default async function setup() {
  const application = next({ dev: false, dir: process.cwd(), quiet: true });
  await application.prepare();
  const handler = application.getRequestHandler();
  const server = createServer((request, response) => { void handler(request, response); });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(3000, '127.0.0.1', resolve); });
  return async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await application.close();
  };
}
