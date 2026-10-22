import { test } from "node:test";
import assert from "node:assert/strict";
import { comoExibido, faixaBdp, leituraBdp, leituraCurtaBdp } from "./periodo.ts";

test("faixaBdp: as referências 7,5 e 5 entram na faixa de cima", () => {
  assert.equal(faixaBdp(10), "bom");
  assert.equal(faixaBdp(7.5), "bom");
  assert.equal(faixaBdp(7.49), "razoavel");
  assert.equal(faixaBdp(5), "razoavel");
  assert.equal(faixaBdp(4.99), "ruim");
  assert.equal(faixaBdp(0), "ruim");
});

test("comoExibido: a faixa segue o número arredondado da tela, não o valor bruto", () => {
  const media = (7.3 + 5.1 + 9.9 + 7.7) / 4; // 7,499999999999999 em ponto flutuante
  assert.equal(faixaBdp(media), "razoavel");
  assert.equal(faixaBdp(comoExibido(media, 2)), "bom");
  assert.equal(faixaBdp(comoExibido(7.46, 1)), "bom");
  assert.equal(faixaBdp(comoExibido(7.44, 1)), "razoavel");
  assert.equal(faixaBdp(comoExibido(4.96, 1)), "razoavel");
});

test("leituraBdp diz entre quais referências a média está", () => {
  assert.equal(leituraBdp(8), "acima de Bom (7,5)");
  assert.equal(leituraBdp(6), "entre Razoável (5) e Bom (7,5)");
  assert.equal(leituraBdp(3), "entre Ruim (2,5) e Razoável (5)");
  assert.equal(leituraBdp(1), "abaixo de Ruim (2,5)");
});

test("leituraCurtaBdp cabe numa linha e distingue as quatro faixas", () => {
  assert.equal(leituraCurtaBdp(8), "≥ 7,5 Bom");
  assert.equal(leituraCurtaBdp(6), "≥ 5 Razoável");
  assert.equal(leituraCurtaBdp(3), "≥ 2,5 Ruim");
  assert.equal(leituraCurtaBdp(1), "< 2,5 Ruim");
});
