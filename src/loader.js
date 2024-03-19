import { relative } from 'path';
import { fileURLToPath } from 'url';
import { renderToString } from 'react-dom/server';

export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad);

  if (result.format === 'module' && !url.includes('?original')) {
    const code = result.source.toString();

    if (/['"]use client['"]/.test(code)) {
      const source = `
        export default {
          $$typeof: Symbol.for('react.client.reference'),
          name: 'default',
          filename: ${JSON.stringify(
            relative(import.meta.dirname, fileURLToPath(url))
          )},
        }
      `;

      return { source, format: 'module' };
    }
  }

  return result;
}
