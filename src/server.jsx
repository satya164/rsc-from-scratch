import Router from '@koa/router';
import { transform } from 'esbuild';
import Koa from 'koa';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile, readdir, stat } from 'node:fs/promises';
import { register } from 'node:module';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';

register('./loader.js', import.meta.url);

const html = String.raw;

const PORT = 5172;

const app = new Koa();
const router = new Router();

router.get('/(.*).(js|jsx)', async (ctx) => {
  const content = await readFile(join(import.meta.dirname, ctx.path), 'utf8');
  const transformed = await transform(content, {
    loader: 'jsx',
    format: 'esm',
    target: 'es2020',
  });

  ctx.type = 'text/javascript';
  ctx.body = transformed.code;
});

router.get('/:path*', async (ctx) => {
  const filepath = `./app/${ctx.params.path ?? 'index'}.jsx`;

  if (!(await stat(join(import.meta.dirname, filepath)))) {
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

  const files = await readdir(join(import.meta.dirname, 'app'));
  const imports = await Promise.all(
    files.map((file) => import(join(import.meta.dirname, 'app', file)))
  );

  const modules = imports.reduce((acc, mod, i) => {
    if (mod.default?.$$typeof === Symbol.for('react.client.reference')) {
      acc += `
        import $${i} from './${mod.default.filename}';

        window.__CLIENT_MODULES__['${mod.default.filename}'] = $${i};
      `;
    }

    return acc;
  }, `window.__CLIENT_MODULES__ = {};`);

  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);
  const clientHtml = html`
    ${renderToString(
      await storage.run({ ssr: true }, () => renderJSXToClientJSX(jsx))
    )}

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
    <script type="module">
      ${modules};
    </script>
    <script type="module" src="/client.js"></script>
  `;

  ctx.type = 'text/html';
  ctx.body = clientHtml;
}

function stringifyJSX(key, value) {
  if (value === Symbol.for('react.element')) {
    return '$RE';
  } else if (value === Symbol.for('react.client.reference')) {
    return '$RE_M';
  } else if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value;
  } else {
    return value;
  }
}

const storage = new AsyncLocalStorage();

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
      } else if (jsx.type.$$typeof === Symbol.for('react.client.reference')) {
        const ssr = storage.getStore()?.ssr;

        if (!ssr) {
          return jsx;
        }

        const m = await import(`./${jsx.type.filename}?original`);

        return { ...jsx, type: m[jsx.type.name] };
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
