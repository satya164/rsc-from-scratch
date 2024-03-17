import React from 'react';

export default async function Pokemon({ query }) {
  const data = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${query.name}`
  ).then((res) => res.json());

  return (
    <div>
      <a href="/">Home</a>
      <h1>
        {query.name} ({data.types.map((type) => type.type.name).join(', ')})
      </h1>
      <img src={data.sprites.front_default} />
    </div>
  );
}
