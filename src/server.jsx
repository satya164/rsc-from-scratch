import Router from '@koa/router';
import Koa from 'koa';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 5172;

const app = new Koa();
const router = new Router();

router.get('/favicon.ico', async (ctx) => {
  const stream = createReadStream(join(__dirname, ctx.path));

  ctx.type = 'image/x-icon';
  ctx.body = stream;
});

router.get('/:path*', async (ctx) => {
  const filepath = `./app/${ctx.params.path ?? 'index'}.jsx`;

  if (!(await stat(join(__dirname, filepath)))) {
    ctx.status = 404;
    return;
  }

  const { default: Document } = await import('./app/_document.jsx');
  const { default: Page } = await import(filepath);

  const html = renderToString(
    <Document>
      <Page query={ctx.request.query} />
    </Document>
  );

  ctx.type = 'text/html';
  ctx.body = html;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
