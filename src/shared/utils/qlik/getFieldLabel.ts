import type { FilterConfig } from "@/shared/qlik/filtros";

// Rótulos dos campos selecionados fora da barra de filtros (cliques nas tabelas e gráficos).
// Vêm do fieldLabels do mashup antigo (Qlik/painel_fornecedores/painel_fornecedores.js).
const fieldLabels: Record<string, string> = {
  vlNota: "Nota",
  nmBairro: "Bairro",
  nuCEP: "CEP",
  nmContato: "Contato",
  deRamoAtividade: "Ramo de atividade",
  deCriterio: "Critério",
  deMedicao: "Medição",
  nmFiscal: "Fiscal",
  deComplemento: "Complemento",
  nuTelefone: "Telefone da empresa",
  nuTelefone2: "Telefone 2 da empresa",
  nmContatoEmpresa: "Telefone 2 da empresa",
  nuCelular: "Celular da empresa",
  deEmailEmpresa: "Email da empresa",
  deCargo: "Cargo",
  nuTelefone3: "Telefone do contato",
  nuTelefone4: "Telefone 2 do contato",
  deEmail: "Email do contato",
  cdContrato: "Contrato",
  cdLote: "Código da obra",
  deConceito: "Conceito",
  nmCredor: "Fornecedor",
  nmMunicipio: "Município do fornecedor",
  nuIdentSujeito: "CNPJ",
  sgUnidadeFederal: "UF",
  DEANOMES: "Ano/mês da medição",
  IntervaloBDP: "Faixa de nota",
};

/** Nome do campo numa expressão de filtro: "=[Situação atual do contrato]" vira "Situação atual do contrato" */
export const campoDaExpressao = (expressao: string): string =>
  expressao.replace(/^=/, "").replace(/^\[(.*)\]$/, "$1");

export const getFieldLabel = (field: string, filters: FilterConfig[]): string =>
  filters.find(({ expression }) => campoDaExpressao(expression) === field)?.label ?? fieldLabels[field] ?? field;
