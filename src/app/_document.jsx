import React from 'react';

export default function Document({ children }) {
  return (
    <html>
      <body>
        <input type="text" defaultValue="" />
        <main>{children}</main>
      </body>
    </html>
  );
}
