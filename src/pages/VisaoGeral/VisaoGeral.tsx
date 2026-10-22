import { useState } from "react";
import { Medal } from "lucide-react";
import { useText, type Cell } from "@cluster-data-experience/qlik-modules";
import { Cartao, TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { crescente, decrescente, type ColunaTabela } from "@/components/CartaoPainel/colunas";
import { fundoFaixa } from "@/components/ChipConceito/faixas";
import { KpisFornecedores } from "@/components/KpisFornecedores/KpisFornecedores";
import Tabs from "@/components/Tabs/Tabs";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { comoExibido, faixaBdp, leituraBdp, mesContexto, noPeriodo, referenciasBdp } from "@/shared/qlik/periodo";
import { cn } from "@/shared/utils/tailwind/cn";
import { colunasCadastro } from "./cadastro";
import { FichaFornecedor } from "./FichaFornecedor";

// Um ranking só, do mês em contexto: une a tabela por ano/mês (JBHzUkJ) e o Top 10 (dJBrNLQ) do app.
// O histórico por mês é o filtro Ano/mês da medição; a posição vem do campo Rank, já calculado por mês.
// Só o Top 10 do mês entra: fora dele as medidas ficam nulas e a linha sai pelo qSuppressZero (empates repetem posição)
const top10 = `${noPeriodo}, Rank = {">0<=10"}`;
const posicao = `Only({<${top10}>} Rank)`;

const tituloRanking = `='Ranking de ' & ${mesContexto}`;

// Fornecedores sem posição no mês ficam com todas as medidas nulas e saem pelo qSuppressZero
const semPosicao: Partial<EngineAPI.IHyperCubeDef> = { qSuppressZero: true };

// Ouro #a67a08: 3:1 sobre o cartão claro (o #b8860b dava 2,8)
const corMedalha: Record<number, string> = { 1: "text-[#a67a08]", 2: "text-[#7c8390]", 3: "text-[#a0623b]" };

// Numeral grande em célula fixa; medalha desenhada só no pódio (empates repetem a posição)
const celulaPosicao = (celula: Cell) => {
  const numero = Number.isFinite(celula?.qNum) ? (celula.qNum as number) : null;
  return (
    <span className="flex items-center justify-end gap-1.5">
      {numero !== null && numero <= 3 && <Medal className={cn("size-4 shrink-0", corMedalha[numero])} aria-hidden />}
      <span className="text-lg font-semibold leading-none tabular-nums">{celula?.qText}</span>
    </span>
  );
};

// Barra de 0 a 10 com as três marcas de referência; a cor diz a faixa em que a média cai
const celulaBdp = (compacta: boolean) => (celula: Cell) => {
  // Duas casas, como o '#.##0,00' da medida: a cor da faixa segue o número que a célula mostra
  const valor = Number.isFinite(celula?.qNum) ? comoExibido(celula.qNum as number, 2) : null;
  if (valor === null) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="flex items-center justify-end gap-2 lg:gap-3" title={`BDP ${celula.qText}: ${leituraBdp(valor)}`}>
      <span className={cn("relative h-1.5 shrink-0 overflow-hidden rounded-full bg-muted", compacta ? "w-14" : "w-28")} aria-hidden>
        <span className={cn("absolute inset-y-0 left-0 rounded-full", fundoFaixa[faixaBdp(valor)])} style={{ width: `${valor * 10}%` }} />
        {/* Entalhes nas referências 2,5 / 5 / 7,5: a cor do fundo do cartão abre a barra onde a marca passa */}
        {referenciasBdp.map(({ valor: referencia }) => (
          <span key={referencia} className="absolute inset-y-0 w-0.5 bg-popover" style={{ left: `calc(${referencia * 10}% - 1px)` }} />
        ))}
      </span>
      <span className="w-9 font-semibold tabular-nums">{celula.qText}</span>
    </span>
  );
};

// sortingPriority vai para qInterColumnSortOrder na ordem do engine (dimensões e depois medidas):
// posição, BDP, fornecedor
const colunasRanking = (compacta: boolean): ColunaTabela[] => [
  {
    type: "measure",
    qDef: `If(${posicao} > 0, Dual(${posicao} & 'º', ${posicao}))`,
    // "Pos." cabe na célula de 72px do celular sem truncar
    qLabel: compacta ? "Pos." : "Posição",
    qSortBy: { qSortByNumeric: crescente },
    sortingPriority: 0,
    largura: compacta ? 72 : 96,
    renderizar: celulaPosicao,
  },
  // O nome toma a folga da tabela: a barra de BDP fica ao lado dele, não no canto de uma célula vazia
  { type: "dimension", qFieldDefs: ["nmCredor"], qFieldLabels: ["Fornecedor"], qNullSuppression: true, sortingPriority: 2, largura: compacta ? 144 : "resto" },
  {
    type: "measure",
    qDef: `Num(Avg({<${top10}>} MedBDP), '#.##0,00')`,
    qLabel: "BDP",
    qSortBy: { qSortByNumeric: decrescente },
    sortingPriority: 1,
    largura: compacta ? 124 : 200,
    renderizar: celulaBdp(compacta),
  },
];

const abas = [
  { label: "Ranking", value: "ranking" },
  { label: "Dados cadastrais", value: "cadastro" },
];

export const VisaoGeral = () => {
  const { text: titulo } = useText(tituloRanking);
  const [aba, setAba] = useState("ranking");
  // Sentido da última troca (+1 direita, -1 esquerda): a tabela nova entra do lado para onde a pílula andou
  const [sentidoAba, setSentidoAba] = useState(0);
  const trocarAba = (nova: string) => {
    setSentidoAba(Math.sign(abas.findIndex(({ value }) => value === nova) - abas.findIndex(({ value }) => value === aba)));
    setAba(nova);
  };
  const compacta = useMobileScreen(1024);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <KpisFornecedores />
      <Cartao
        titulo={
          // key: o título troca junto com a pílula, num esmaecer curto em vez de um corte
          <span key={aba} className="animate-esmaecer inline-block">
            {aba === "ranking" ? titulo || "Ranking" : "Dados cadastrais"}
          </span>
        }
        className="h-auto min-h-[560px] shrink-0 lg:min-h-0 lg:flex-1"
        acoes={<Tabs tabs={abas} activeTab={aba} onTabChange={trocarAba} className="w-auto shrink-0" />}
      >
        {(slot) => (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div
              role="tabpanel"
              aria-label={abas.find(({ value }) => value === aba)?.label}
              className="min-h-0 flex-1"
              style={sentidoAba ? ({ "--desloc-revelar": `${sentidoAba * 12}px 0` } as React.CSSProperties) : undefined}
            >
              {aba === "ranking" ? (
                <TabelaCartao
                  // key: o conjunto de colunas muda com a largura e o cubo precisa ser recriado
                  key={compacta ? "ranking-compacto" : "ranking"}
                  colunas={colunasRanking(compacta)}
                  slotExportar={slot}
                  nomeArquivo="ranking-do-mes"
                  linhasIniciais={100}
                  // Linhas de no mínimo 36 px: o Top 10 (com empates) cabe inteiro no cartão a 1080p sem rolar;
                  // sobrando altura, as linhas se esticam para ocupar o cartão. No celular, 44 px: alvo de toque
                  className={compacta ? "[&_td]:h-11 [&_th]:h-11" : "[&_td]:h-9 [&_th]:h-9"}
                  preencherAltura
                  selecionarLinha
                  filtroNoCabecalho={!compacta}
                  hipercubo={semPosicao}
                  // A ficha é o fornecedor selecionado no Qlik: a tabela fica com a linha dele e a ficha abre embaixo.
                  // qDimensionInfo[0] é Fornecedor: o engine lista dimensões antes das medidas, mesmo sendo a 2ª coluna.
                  // Em qInSelections o clique ainda não foi confirmado e as linhas são as de antes: a ficha espera a confirmação
                  detalhe={(layout) =>
                    !layout?.qSelectionInfo?.qInSelections &&
                    layout?.qHyperCube?.qDimensionInfo?.[0]?.qStateCounts?.qSelected === 1 && <FichaFornecedor className="min-h-0 flex-1" />
                  }
                  // Com a ficha aberta, "Nenhum dado encontrado" mentia: o fornecedor existe, só não ranqueou no mês
                  mensagemVazia={(layout) =>
                    layout?.qHyperCube?.qDimensionInfo?.[0]?.qStateCounts?.qSelected === 1 ? (
                      <>
                        <p className="text-lg font-medium">Fora do Top 10 {titulo ? `de ${titulo.replace("Ranking de ", "")}` : "do mês"}</p>
                        <p className="text-sm">A ficha abaixo mostra o cadastro e o histórico do fornecedor.</p>
                      </>
                    ) : undefined
                  }
                />
              ) : (
                // No cadastro a tabela já é a ficha
                <TabelaCartao key="cadastro" colunas={colunasCadastro} slotExportar={slot} nomeArquivo="dados-cadastrais" selecionarLinha />
              )}
            </div>
          </div>
        )}
      </Cartao>
    </div>
  );
};
