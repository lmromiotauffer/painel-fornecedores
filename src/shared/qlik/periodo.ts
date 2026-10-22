// Expressões do período em contexto, dos objetos JBHzUkJ e dJBrNLQ do app (objetos-fornecedores.json)

const ignorar = "$(vIgnorar_Campos_DIM_Contrato), $(vIgnorar_Campos_DIM_Obra), [_skCredor] = P([_skCredor])";

// Sem mês selecionado, o ranking mostra o mês anterior ao último ranking disponível, como no app.
// {1<DEANOMES = $::DEANOMES>}: só o filtro de ano/mês muda o mês em contexto; selecionar um fornecedor
// ou município não pode trocar o mês debaixo do visitante (o app original trocava)
const ultimoRanking = "Date#(Max({1<DEANOMES = $::DEANOMES>} _skTempoRankingFornecedor), 'YYYYMMDD')";
const mesEmContexto = `If(GetSelectedCount(DEANOMES) = 0, AddMonths(${ultimoRanking}, -1), ${ultimoRanking})`;

export const periodo = `Date(${mesEmContexto}, 'YYYYMMDD')`;

// Modificador de conjunto que prende uma medida ao período em contexto
export const noPeriodo = `[_skTempo] = {"$(=${periodo})"}, ${ignorar}`;

// "set 2026": nome do mês em contexto, para títulos
export const mesContexto = `MonthName(${mesEmContexto})`;

// Referências oficiais da nota BDP (objeto ekdRwjm): a leitura de uma média diz entre quais ela está
export const referenciasBdp = [
  { valor: 7.5, rotulo: "Bom" },
  { valor: 5, rotulo: "Razoável" },
  { valor: 2.5, rotulo: "Ruim" },
] as const;

export type FaixaBdp = "bom" | "razoavel" | "ruim";

const [bom, razoavel] = referenciasBdp;

export const faixaBdp = (valor: number): FaixaBdp =>
  valor >= bom.valor ? "bom" : valor >= razoavel.valor ? "razoavel" : "ruim";

/**
 * Valor com as casas que a tela mostra, para a faixa concordar com o número: 7,46 aparece como "7,5" e
 * 7,499999999999999 (média de ponto flutuante) como "7,50", e ambos têm de cair em Bom
 */
export const comoExibido = (valor: number, casas: number) => Number(valor.toFixed(casas));

const formatar = (valor: number) => valor.toLocaleString("pt-BR");

/** "≥ 7,5 Bom", "≥ 5 Razoável", "≥ 2,5 Ruim", "< 2,5 Ruim": cabe numa linha ao lado do número (a longa quebrava em 1366 px) */
export const leituraCurtaBdp = (valor: number): string => {
  const [bom, razoavel, ruim] = referenciasBdp;
  if (valor >= bom.valor) return `≥ ${formatar(bom.valor)} ${bom.rotulo}`;
  if (valor >= razoavel.valor) return `≥ ${formatar(razoavel.valor)} ${razoavel.rotulo}`;
  if (valor >= ruim.valor) return `≥ ${formatar(ruim.valor)} ${ruim.rotulo}`;
  return `< ${formatar(ruim.valor)} ${ruim.rotulo}`;
};

/** "acima de Bom (7,5)", "entre Razoável (5) e Bom (7,5)"… */
export const leituraBdp = (valor: number): string => {
  const [bom, razoavel, ruim] = referenciasBdp;
  if (valor >= bom.valor) return `acima de ${bom.rotulo} (${formatar(bom.valor)})`;
  if (valor >= razoavel.valor) return `entre ${razoavel.rotulo} (${formatar(razoavel.valor)}) e ${bom.rotulo} (${formatar(bom.valor)})`;
  if (valor >= ruim.valor) return `entre ${ruim.rotulo} (${formatar(ruim.valor)}) e ${razoavel.rotulo} (${formatar(razoavel.valor)})`;
  return `abaixo de ${ruim.rotulo} (${formatar(ruim.valor)})`;
};
