import React from 'react';

export default function Pokemon({ query }) {
  return (
    <div>
      <a href="/">Home</a>
      <h1>
        {query.name}
      </h1>
    </div>
  );
}
