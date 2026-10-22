import type { Cell } from "@cluster-data-experience/qlik-modules";
import type { ColunaTabela } from "@/components/CartaoPainel/colunas";

// Campos do objeto RMhxv (dados cadastrais) do app (objetos-fornecedores.json)
export const camposCadastro: [string, string][] = [
  ["nmCredor", "Fornecedor"],
  ["nuIdentSujeito", "CNPJ"],
  ["nmMunicipio", "Município"],
  ["sgUnidadeFederal", "UF"],
  ["deRamoAtividade", "Ramo de atividade"],
  ["Endereço", "Endereço"],
  ["deComplemento", "Complemento"],
  ["nmBairro", "Bairro"],
  ["nuCEP", "CEP"],
  ["nuTelefone", "Telefone da empresa"],
  ["nmContatoEmpresa", "Telefone 2 da empresa"],
  ["nuCelular", "Celular da empresa"],
  ["deEmailEmpresa", "Email da empresa"],
  ["nmContato", "Contato"],
  ["deCargo", "Cargo"],
  ["nuTelefone3", "Telefone do contato"],
  ["deEmail", "Email do contato"],
];

// O dado traz "Não informado" como texto: vira ausência, como o nulo e o "-". Mesma regra na tabela e na ficha
export const semValor = (celula: Cell | undefined) =>
  !!celula?.qIsNull || !celula?.qText || celula.qText === "-" || /^n[aã]o informado$/i.test(celula.qText.trim());

export const colunasCadastro: ColunaTabela[] = camposCadastro.map(([campo, rotulo]) => ({
  type: "dimension",
  qFieldDefs: [campo],
  qFieldLabels: [rotulo],
  renderizar: (celula) => (semValor(celula) ? <span className="text-muted-foreground">não informado</span> : celula.qText),
}));
