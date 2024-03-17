import Router from '@koa/router';
import Koa from 'koa';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';

const PORT = 5172;

const app = new Koa();
const router = new Router();

router.get('/:path*', async (ctx) => {
  const filepath = `./app/${ctx.params.path ?? 'index'}.jsx`;

  if (!(await stat(join(import.meta.dirname, filepath)))) {
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
