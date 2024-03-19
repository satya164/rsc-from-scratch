import Router from '@koa/router';
import Koa from 'koa';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const html = String.raw;

const PORT = 5172;

const app = new Koa();
const router = new Router();

router.get('/favicon.ico', async (ctx) => {
  const stream = createReadStream(join(__dirname, ctx.path));

  ctx.type = 'image/x-icon';
  ctx.body = stream;
});

router.get('/client.js', (ctx) => {
  const stream = createReadStream(join(__dirname, ctx.path));

  ctx.type = 'text/javascript';
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

  await respond(
    ctx,
    <Document>
      <Page query={ctx.request.query} />
    </Document>
  );
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

async function respond(ctx, jsx) {
  const clientJSX = await renderJSXToClientJSX(jsx);

  if (ctx.request.query.jsx != null) {
    const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);

    ctx.type = 'application/json';
    ctx.body = clientJSXString;

    return;
  }

  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);
  const clientHtml = html`
    ${renderToString(clientJSX)}

    <script>
      window.__INITIAL_CLIENT_JSX_STRING__ = ${JSON.stringify(
        clientJSXString
      ).replace(/</g, '\\u003c')};
    </script>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@canary",
          "react-dom/client": "https://esm.sh/react-dom@canary/client"
        }
      }
    </script>
    <script type="module" src="/client.js"></script>
  `;

  ctx.type = 'text/html';
  ctx.body = clientHtml;
}

function stringifyJSX(key, value) {
  if (value === Symbol.for('react.element')) {
    return '$RE';
  } else if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value;
  } else {
    return value;
  }
}

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === 'string' ||
    typeof jsx === 'number' ||
    typeof jsx === 'boolean' ||
    jsx == null
  ) {
    return jsx;
  } else if (Array.isArray(jsx)) {
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)));
  } else if (jsx != null && typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.element')) {
      if (typeof jsx.type === 'string') {
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        };
      } else if (typeof jsx.type === 'function') {
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);

        return renderJSXToClientJSX(returnedJsx);
      } else {
        throw new Error('Not implemented.');
      }
    } else {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      );
    }
  } else {
    throw new Error('Not implemented');
  }
}
