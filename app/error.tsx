"use client";
import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tentar Novamente</button>
    </div>
  );
}
