export type FilterConfig = {
  expression: string;
  label: string;
};

// Filtros da barra, na ordem em que aparecem; os que não cabem vão para "Mais filtros"
export const filtros: FilterConfig[] = [
  { label: "Ano/mês da medição", expression: "DEANOMES" },
  { label: "Fornecedor", expression: "nmCredor" },
  { label: "Município do fornecedor", expression: "nmMunicipio" },
  { label: "Contrato", expression: "cdContrato" },
  { label: "Situação atual do contrato", expression: "=[Situação atual do contrato]" },
  { label: "Tipo da obra", expression: "deTipoObra" },
  { label: "Classificação da obra", expression: "deClasseObra" },
];
