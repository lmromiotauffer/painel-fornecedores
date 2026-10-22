import type { ReactNode } from "react";
import type { Cell, Column } from "@cluster-data-experience/qlik-modules";

export const semTotais = { show: false, position: "noTotals" } as const;

// @types/qlik-engineapi tipa a direção como string ("1"), mas o engine espera número.
// O useTable grava qReverseSort: true em dimensões e medidas, o que inverte o sentido: por isso os sinais trocados
export const crescente = -1 as unknown as EngineAPI.TypeSortDirection;
export const decrescente = 1 as unknown as EngineAPI.TypeSortDirection;

export type ColunaTabela = Column & {
  // largura em px: as colunas curtas cabem no cartão sem rolagem lateral; "resto" absorve a folga da tabela
  largura?: number | "resto";
  // Dimensão que é quantidade (ex.: nota): alinha à direita e vai como número para a planilha
  alinhamento?: "direita";
  // Desenho próprio da célula (barra, chip, medalha); recebe a célula e a linha na ordem do engine
  renderizar?: (celula: Cell, linha: Cell[]) => ReactNode;
};

/**
 * Nas páginas, sortingPriority é a prioridade da coluna (0 = ordena primeiro). A lib monta qInterColumnSortOrder
 * lendo o sortingPriority da coluna na posição k do engine como "coluna que ordena em k-ésimo lugar", o inverso.
 * Esta função converte uma leitura na outra.
 * shortcut: compensa a qlik-modules 2.9.2; quando a lib ordenar por prioridade, apagar isto e a chamada em TabelaCartao
 */
export const prioridadesParaLib = (colunas: ColunaTabela[]): ColunaTabela[] => {
  const engine = [...colunas.filter((c) => c.type === "dimension"), ...colunas.filter((c) => c.type !== "dimension")];
  const ordem = engine
    .map((coluna, indice) => ({ indice, prioridade: coluna.sortingPriority ?? indice }))
    .sort((a, b) => a.prioridade - b.prioridade)
    .map(({ indice }) => indice);
  const valor = new Map(engine.map((coluna, posicao) => [coluna, ordem[posicao]]));
  return colunas.map((coluna) => ({ ...coluna, sortingPriority: valor.get(coluna) }));
};
