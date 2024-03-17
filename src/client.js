import { hydrateRoot } from 'react-dom/client';

const root = hydrateRoot(document, getInitialClientJSX());

function getInitialClientJSX() {
  const clientJSX = JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX);
  return clientJSX;
}

function parseJSX(key, value) {
  if (value === '$RE') {
    return Symbol.for('react.element');
  } else if (typeof value === 'string' && value.startsWith('$$')) {
    return value.slice(1);
  } else {
    return value;
  }
}
