async function fetchClientHTML(pathname) {
  const response = await fetch(pathname);
  const clientHtml = await response.text();

  return clientHtml;
}

let currentPathname = window.location.pathname;

async function navigate(pathname) {
  currentPathname = pathname;

  const clientHtml = await fetchClientHTML(pathname);

  if (pathname === currentPathname) {
    document.body.innerHTML = clientHtml;
  }
}

window.addEventListener(
  'click',
  (e) => {
    if (e.target.tagName !== 'A') {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const href = e.target.getAttribute('href');

    if (!href.startsWith('/')) {
      return;
    }

    e.preventDefault();

    window.history.pushState(null, null, href);

    navigate(href);
  },
  true
);

window.addEventListener('popstate', () => {
  navigate(window.location.pathname);
});
