import React from 'react';

export default function Index() {
  const pokemons = [
    { name: 'bulbasaur' },
    { name: 'ivysaur' },
    { name: 'venusaur' },
    { name: 'charmander' },
    { name: 'charmeleon' },
    { name: 'charizard' },
    { name: 'squirtle' },
    { name: 'wartortle' },
    { name: 'blastoise' },
    { name: 'caterpie' },
  ];

  return (
    <ul>
      {pokemons.map((pokemon) => {
        return (
          <li key={pokemon.name}>
            <a href={`/pokemon?name=${pokemon.name}`}>{pokemon.name}</a>
          </li>
        );
      })}
    </ul>
  );
}
