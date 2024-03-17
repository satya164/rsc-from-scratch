import React from 'react';

export default async function Index() {
  const data = await fetch(
    'https://pokeapi.co/api/v2/pokemon?limit=10&offset=0'
  ).then((res) => res.json());

  return (
    <ul>
      {data.results.map((pokemon) => {
        return (
          <li key={pokemon.name}>
            <a href={`/pokemon?name=${pokemon.name}`}>{pokemon.name}</a>
          </li>
        );
      })}
    </ul>
  );
}
