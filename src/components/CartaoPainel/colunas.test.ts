import { test } from "node:test";
import assert from "node:assert/strict";
import { prioridadesParaLib, type ColunaTabela } from "./colunas.ts";

const prioridades = (colunas: ColunaTabela[]) => prioridadesParaLib(colunas).map((c) => c.sortingPriority);

test("ranking: posição (0), BDP (1) e fornecedor (2) viram, na ordem do engine [fornecedor, posição, BDP], [1, 2, 0]", () => {
  const colunas = [
    { type: "measure", qDef: "Only(Rank)", sortingPriority: 0 },
    { type: "dimension", qFieldDefs: ["nmCredor"], sortingPriority: 2 },
    { type: "measure", qDef: "Avg(MedBDP)", sortingPriority: 1 },
  ] as ColunaTabela[];
  // Na ordem da config: a dimensão (engine 0) recebe 1, posição (engine 1) recebe 2, BDP (engine 2) recebe 0
  assert.deepEqual(prioridades(colunas), [2, 1, 0]);
});

test("só dimensões em ordem crescente, ou sem prioridade, não mudam", () => {
  const dims = (prioridadesIniciais: (number | undefined)[]) =>
    prioridadesIniciais.map((sortingPriority, i) => ({ type: "dimension", qFieldDefs: [`c${i}`], sortingPriority })) as ColunaTabela[];
  assert.deepEqual(prioridades(dims([0, 1, 2])), [0, 1, 2]);
  assert.deepEqual(prioridades(dims([undefined, undefined])), [0, 1]);
  // Nota (prioridade 1) ordena antes de Fornecedor (prioridade 2): o engine lê [0, 2, 1]
  assert.deepEqual(prioridades(dims([0, 2, 1])), [0, 2, 1]);
});
