import type { Cell } from "@cluster-data-experience/qlik-modules";
import { Cartao, TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { decrescente, type ColunaTabela } from "@/components/CartaoPainel/colunas";
import { ChipConceito } from "@/components/ChipConceito/ChipConceito";
import { GraficoDistribuicao, GraficoMedia } from "@/components/GraficosBdp/GraficosBdp";
import { KpisFornecedores } from "@/components/KpisFornecedores/KpisFornecedores";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";

// Colunas do objeto zTDbPC do app (objetos-fornecedores.json), com o resultado (critério, conceito, nota)
// logo depois do fornecedor: na largura comum as dez colunas não cabem e o fim da linha era o que mais importava.
// sortingPriority é a prioridade de ordenação do objeto original (data, nota, conceito, critério…)
const camposAvaliacao: [string, string, number, number?][] = [
  ["Data da avaliação", "Data da avaliação", 0, 176],
  ["nmCredor", "Fornecedor", 7, 200],
  ["deCriterio", "Critério", 3, 190],
  ["deConceito", "Conceito", 2, 110],
  ["vlNota", "Nota", 1, 96],
  ["deMedicao", "Medição", 6, 170],
  ["cdContrato", "Contrato", 8, 130],
  ["cdLote", "Código da obra", 9, 148],
  ["nmFiscal", "Fiscal", 4, 180],
  ["DEANOMES", "Ano/mês da medição", 5, 168],
];

// No celular, Data | Fornecedor | Conceito | Nota cabem em 390 px e o resto fica na rolagem lateral
// 88 + 104 + 80 + 60 = 332 px: a área útil da tabela em 390 px tem 336
const larguraCompacta: Record<string, number> = { "Data da avaliação": 88, nmCredor: 104, deConceito: 80, vlNota: 60 };
// Rótulos curtos: com a lupa de filtro e a seta de ordenação no cabeçalho, o nome longo virava "D…"
const rotuloCompacto: Record<string, string> = { "Data da avaliação": "Data" };
const ordemCompacta = ["Data da avaliação", "nmCredor", "deConceito", "vlNota"];
// Campos fora da lista ficam depois, na ordem original (sort estável)
const posicaoCompacta = (campo: string) => (ordemCompacta.includes(campo) ? ordemCompacta.indexOf(campo) : ordemCompacta.length);

const colunasAvaliacao = (compacta: boolean): ColunaTabela[] => {
  const campos = [...camposAvaliacao].sort(([a], [b]) => (compacta ? posicaoCompacta(a) - posicaoCompacta(b) : 0));
  // Conceito como chip na cor da faixa da nota; a nota vem da mesma linha, na ordem das colunas do cubo
  // (que é a ordem já reordenada no celular), e sai em destaque
  const indiceNota = campos.findIndex(([campo]) => campo === "vlNota");
  const desenhos: Record<string, (celula: Cell, linha: Cell[]) => React.ReactNode> = {
    deConceito: (celula, linha) => {
      if (!celula?.qText || celula.qText === "-") return "-";
      const nota = linha[indiceNota]?.qNum;
      return <ChipConceito conceito={celula.qText} nota={Number.isFinite(nota) ? (nota as number) : undefined} />;
    },
    vlNota: (celula) => <span className="font-semibold tabular-nums">{celula?.qText}</span>,
  };
  return campos.map(([campo, rotulo, prioridade, largura]) => ({
      type: "dimension",
      qFieldDefs: [campo],
      qFieldLabels: [compacta ? (rotuloCompacto[campo] ?? rotulo) : rotulo],
      sortingPriority: prioridade,
      largura: compacta ? (larguraCompacta[campo] ?? largura) : largura,
      renderizar: desenhos[campo],
      ...(campo === "Data da avaliação" && { qSortCriterias: [{ qSortByNumeric: decrescente }], qNullSuppression: true }),
      ...(campo === "nmCredor" && { qNullSuppression: true }),
      ...(campo === "vlNota" && { alinhamento: "direita" }),
    }));
};

export const Avaliacoes = () => {
  const compacta = useMobileScreen(1024);
  return (
    // A partir de lg os cartões dividem a altura da janela (gráficos em 2/5, tabela em 3/5) e só rolam a página quando a
    // janela é baixa demais para os mínimos (1366×768: a tabela, que é o relatório, fica com 4 linhas e a página rola ~90 px
    // até o rodapé; com mínimos que coubessem sem rolar sobrava uma linha e meia). Abaixo de lg, cartões de altura fixa e a página rola
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      <KpisFornecedores />
      <div className="grid shrink-0 gap-2 md:grid-cols-2 lg:min-h-[200px] lg:flex-[2] lg:shrink">
        <Cartao titulo="Média da avaliação (BDP) por ano/mês da medição" className="h-[300px]">
          {() => <GraficoMedia />}
        </Cartao>
        <Cartao titulo="Distribuição das avaliações (BDP) por faixa de nota" className="h-[300px]">
          {() => <GraficoDistribuicao />}
        </Cartao>
      </div>
      <Cartao titulo="Avaliação por medição e critério" className="h-[520px] shrink-0 lg:min-h-[360px] lg:flex-[3] lg:shrink">
        {(slot) => (
          <TabelaCartao
            // key: a ordem das colunas muda com a largura e o cubo precisa ser recriado
            key={compacta ? "avaliacoes-compacto" : "avaliacoes"}
            colunas={colunasAvaliacao(compacta)}
            // Sem a lupa nos cabeçalhos estreitos: "Conceito" virava "Con…"; a barra de filtros cobre a busca
            filtroNoCabecalho={!compacta}
            slotExportar={slot}
            nomeArquivo="avaliacao-por-medicao-e-criterio"
          />
        )}
      </Cartao>
    </div>
  );
};
