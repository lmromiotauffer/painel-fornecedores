import { createRoot } from "react-dom/client";
import "./index.css";
import App, { type ConnectionConfig } from "./App.tsx";

// =============================================================================
// Utilitários
// =============================================================================

/**
 * Carrega a configuração de conexão do arquivo connection.json
 */
async function loadConnectionConfig(): Promise<ConnectionConfig> {
  const response = await fetch("./connection.json");
  if (!response.ok) {
    throw new Error(
      `Falha ao carregar connection.json: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

// =============================================================================
// Inicialização
// =============================================================================

async function bootstrap(): Promise<void> {
  try {
    // 1. Carrega a configuração de conexão
    const connectionConfig = await loadConnectionConfig();

    // 2. Renderiza a aplicação
    createRoot(document.getElementById("root")!).render(
      <App config={connectionConfig} />,
    );
  } catch (error) {
    console.error("[Bootstrap] Failed to initialize application:", error);
    // Renderiza uma mensagem de erro básica
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center;">
            <h1>Erro ao inicializar aplicação</h1>
            <p>Não foi possível carregar a configuração de conexão.</p>
            <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px;">${error}</pre>
          </div>
        </div>
      `;
    }
  }
}

// Inicia a aplicação
bootstrap();
