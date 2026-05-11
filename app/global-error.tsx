"use client";

import React from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Erro Crítico</title>
      </head>
      <body>
        <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Erro Crítico na Aplicação</h2>
          <p>Ocorreu um erro fatal que impediu a renderização da página.</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: "20px" }}>
            Recarregar a Página
          </button>
        </div>
      </body>
    </html>
  );
}
