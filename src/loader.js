import { dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad);

  if (result.format === 'module' && !url.includes('?original')) {
    const code = result.source.toString();

    if (code.includes("'use client'") || code.includes('"use client"')) {
      const source = `
        export default {
          $$typeof: Symbol.for('react.client.reference'),
          name: 'default',
          filename: ${JSON.stringify(relative(__dirname, fileURLToPath(url)))},
        }
      `;

      return { source, format: 'module' };
    }
  }

  return defaultLoad(url, context, defaultLoad);
}
