'use client';

import React from 'react';

export default function Favorite({ name }) {
  const [isFavorite, setIsFavorite] = React.useState(null);

  React.useEffect(() => {
    const isFavorite = localStorage.getItem(`${name}:favorite`) === 'true';

    setIsFavorite(isFavorite);
  }, [name]);

  const onClick = () => {
    setIsFavorite(!isFavorite);
    localStorage.setItem(`${name}:favorite`, String(!isFavorite));
  };

  return (
    <button disabled={isFavorite == null} onClick={onClick}>
      {isFavorite == null
        ? '…'
        : isFavorite
        ? 'Remove Favorite'
        : 'Add Favorite'}
    </button>
  );
}
