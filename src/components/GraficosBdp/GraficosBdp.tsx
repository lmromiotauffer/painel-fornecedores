import { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react/esm/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTable, type Column } from "@cluster-data-experience/qlik-modules";
import { crescente, semTotais } from "@/components/CartaoPainel/colunas";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import { celulasOrdemEngine } from "@/shared/utils/celulasOrdemEngine";
import { referenciasBdp } from "@/shared/qlik/periodo";

// Só os módulos usados: o echarts completo pesa ~1 MB minificado
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

// Expressões dos objetos ekdRwjm e RHQwU do app (objetos-fornecedores.json)
const colunasMedia: Column[] = [
  { type: "dimension", qFieldDefs: ["DEANOMES"], qFieldLabels: ["Ano/mês da medição"], qSortCriterias: [{ qSortByNumeric: crescente }], qNullSuppression: true },
  { type: "measure", qDef: "Num(Avg(Aggr(BDP, [_skTempo], [_skMedicao], [_skObra])), '#.##0,00')", qLabel: "BDP" },
];

// O original é um combo de dois eixos (quantidade e %); aqui o % vai no rótulo e no tooltip, num eixo só
const colunasDistribuicao: Column[] = [
  // As faixas são texto (">= 0 e < 2"...): a ordem alfabética vai da menor nota para a maior.
  // -1 porque o qReverseSort: true do useTable também inverte a ordem alfabética das dimensões (conferido no navegador)
  { type: "dimension", qFieldDefs: ["IntervaloBDP"], qFieldLabels: ["Faixa de nota"], qSortCriterias: [{ qSortByAscii: -1 as unknown as EngineAPI.TypeSortDirection }], qNullSuppression: true },
  { type: "measure", qDef: "Count(MedBDP)", qLabel: "Quantidade" },
  { type: "measure", qDef: "Num(Count(MedBDP) / Count(Total MedBDP), '0,0%')", qLabel: "%" },
];

// O canvas precisa de cores resolvidas: lê as paletas --palette-{light,dark}-* de index.css, que não dependem
// da classe do documento (a troca de tema não lê a cor anterior). Referências nas cores de status do tema:
// as do objeto ekdRwjm (#0ca30c, #fab219) não passam de 4,5:1 sobre o cartão claro para o rótulo de 10 px
const useCoresGrafico = () => {
  const { isDark } = useTheme();
  return useMemo(() => {
    const estilos = getComputedStyle(document.documentElement);
    const ler = (papel: string) => estilos.getPropertyValue(`--palette-${isDark ? "dark" : "light"}-${papel}`).trim();
    return {
      superficie: ler("surface"),
      texto: ler("text"),
      suave: ler("muted"),
      borda: ler("border"),
      primaria: ler("primary"),
      referencia: { Bom: ler("success"), Razoável: ler("alerta"), Ruim: ler("destructive") } as Record<string, string>,
      fonte: getComputedStyle(document.body).fontFamily,
    };
  }, [isDark]);
};

type Cores = ReturnType<typeof useCoresGrafico>;

const baseGrafico = (cores: Cores) => ({
  backgroundColor: "transparent",
  // A animação do ECharts é JS e escapa do CSS de movimento reduzido
  animation: !movimentoReduzido(),
  // Ritmo do vocabulário (painel 400 ms, atualização 250 ms, ease-out); o padrão da lib é 1 s cubicInOut
  animationDuration: 400,
  animationDurationUpdate: 250,
  animationEasing: "cubicOut",
  animationEasingUpdate: "cubicOut",
  textStyle: { fontFamily: cores.fonte },
  // ECharts 6: outerBoundsMode "same" + outerBoundsContain "axisLabel" é o containLabel: true de antes (depreciado)
  grid: { left: 8, right: 56, top: 24, bottom: 8, outerBoundsMode: "same", outerBoundsContain: "axisLabel" },
  tooltip: {
    trigger: "axis",
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    textStyle: { color: cores.texto, fontSize: 12 },
    transitionDuration: 0.15,
  },
});

const eixoCategorias = (cores: Cores, dados: string[]) => ({
  type: "category",
  data: dados,
  axisLabel: { color: cores.suave, fontSize: 10 },
  axisLine: { lineStyle: { color: cores.borda } },
  axisTick: { show: false },
});

const eixoValores = (cores: Cores) => ({
  type: "value",
  axisLabel: { color: cores.suave, fontSize: 10 },
  splitLine: { lineStyle: { color: cores.borda } },
});

// Ao iniciar o gráfico: clique na faixa inteira da categoria (não só na marca: a barra de 1% e o ponto de 8px são alvos
// pequenos) e redimensionamento a cada quadro. No celular o toque só mostra o tooltip: a seleção filtrava a página
// sem chip nem "Limpar filtros" à vista para desfazer
const useIniciarGrafico = (selecionar: (indice: number) => void) => {
  const selecionarAtual = useRef(selecionar);
  const compacta = useMobileScreen(1024);
  const compactaAtual = useRef(compacta);
  const observador = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    selecionarAtual.current = selecionar;
    compactaAtual.current = compacta;
  });
  useEffect(() => () => observador.current?.disconnect(), []);
  return (grafico: echarts.EChartsType) => {
    // O sensor do echarts-for-react só vê a mudança ~150 ms depois: enquanto o cartão encolhe (busca expandida,
    // cabeçalho com padding em transição) o canvas antigo vazava pela borda e depois saltava para o tamanho novo
    // "auto": sem isso o painter reusa a altura numérica guardada nas opções e o resize não lê o DOM
    // O gráfico remonta ao voltar de "sem dados": o observador do canvas descartado sai antes
    observador.current?.disconnect();
    observador.current = new ResizeObserver(() => grafico.resize({ width: "auto", height: "auto" }));
    observador.current.observe(grafico.getDom());
    // A grade é clicável e precisa parecer: ponteiro só sobre ela
    grafico.getZr().on("mousemove", ({ offsetX, offsetY }) => {
      grafico.getZr().setCursorStyle(!compactaAtual.current && grafico.containPixel("grid", [offsetX, offsetY]) ? "pointer" : "default");
    });
    grafico.getZr().on("click", ({ offsetX, offsetY }) => {
      if (compactaAtual.current || !grafico.containPixel("grid", [offsetX, offsetY])) return;
      const [indice] = grafico.convertFromPixel({ seriesIndex: 0 }, [offsetX, offsetY]) as number[];
      selecionarAtual.current(Math.round(indice));
    });
  };
};

// A lib zera isLoading ao criar o objeto, antes do primeiro layout: sem dados ainda é "carregando", não "vazio"
const EstadoGrafico = ({ estado }: { estado: "carregando" | "erro" | "vazio" }) =>
  estado === "carregando" ? (
    <Skeleton className="h-full w-full rounded-lg bg-muted" />
  ) : (
    <p role="status" className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {estado === "erro" ? "Gráfico indisponível no momento." : "Sem dados para os filtros atuais."}
    </p>
  );

const estadoDe = (error: unknown, data: unknown, vazio: boolean) => (error ? "erro" : !data ? "carregando" : vazio ? "vazio" : null);

/** Média do BDP por ano/mês, com as três linhas de referência. Clicar num mês seleciona o ano/mês no Qlik. */
export const GraficoMedia = () => {
  const cores = useCoresGrafico();
  const { data, layout, error, selectCell } = useTable({ columns: colunasMedia, pageHeight: 500, totals: semTotais });
  const aoIniciar = useIniciarGrafico((indice) => selectCell(indice, 0));

  const pontos = useMemo(
    () =>
      (data?.rows ?? []).map((linha) => {
        const [mes, media] = celulasOrdemEngine(linha.cells, layout?.qHyperCube);
        return { mes: mes?.qText ?? "", valor: Number.isFinite(media?.qNum) ? media.qNum : null, texto: media?.qText ?? "-" };
      }),
    [data, layout],
  );

  const opcao = useMemo(
    () => ({
      ...baseGrafico(cores),
      tooltip: {
        ...baseGrafico(cores).tooltip,
        // O axisPointer não lê o animation global
        axisPointer: { type: "line", lineStyle: { color: cores.suave }, animation: !movimentoReduzido() },
        formatter: (params: { dataIndex: number }[]) => {
          const ponto = pontos[params[0]?.dataIndex ?? 0];
          return `<strong>${ponto?.mes}</strong><br/>BDP médio: ${ponto?.texto}`;
        },
      },
      xAxis: { ...eixoCategorias(cores, pontos.map((p) => p.mes)), boundaryGap: false },
      yAxis: { ...eixoValores(cores), min: 0, max: 10 },
      series: [
        {
          name: "BDP",
          type: "line",
          // A série de linha tem easing próprio (linear) e ignora o global
          animationEasing: "cubicOut",
          data: pontos.map((p) => p.valor),
          lineStyle: { width: 2, color: cores.primaria },
          itemStyle: { color: cores.primaria, borderColor: cores.superficie, borderWidth: 2 },
          symbol: "circle",
          symbolSize: 8,
          markLine: {
            silent: true,
            symbol: "none",
            // Referência fixa: não anima a partir da posição da série anterior ao trocar tema ou filtro
            animation: false,
            data: referenciasBdp.map(({ valor, rotulo }) => ({
              yAxis: valor,
              // 2 px: a 1,5 px o antialiasing diluía o âmbar abaixo de 3:1 no tema claro
              lineStyle: { color: cores.referencia[rotulo], type: [6, 4], width: 2, opacity: 1 },
              label: {
                formatter: `${rotulo} ${valor.toLocaleString("pt-BR")}`,
                position: "end",
                color: cores.referencia[rotulo],
                fontSize: 10,
                fontWeight: 500,
              },
            })),
          },
        },
      ],
    }),
    [cores, pontos],
  );

  const estado = estadoDe(error, data, pontos.length === 0);
  if (estado) return <EstadoGrafico estado={estado} />;
  return (
    // O canvas não tem semântica: o nome do gráfico vai no contêiner
    <div role="img" aria-label="Gráfico de linha: BDP médio por ano/mês da medição, com as referências Bom, Razoável e Ruim" className="h-full w-full">
      <ReactECharts
        echarts={echarts}
        option={opcao}
        notMerge
        style={{ height: "100%", width: "100%" }}
        onChartReady={aoIniciar}
      />
    </div>
  );
};

/** Quantidade de avaliações por faixa de nota. Clicar numa faixa seleciona o intervalo no Qlik. */
export const GraficoDistribuicao = () => {
  const cores = useCoresGrafico();
  const { data, layout, error, selectCell } = useTable({ columns: colunasDistribuicao, pageHeight: 100, totals: semTotais });
  const faixas = useMemo(
    () =>
      (data?.rows ?? []).map((linha, linhaQlik) => {
        const [faixa, quantidade, percentual] = celulasOrdemEngine(linha.cells, layout?.qHyperCube);
        return {
          linhaQlik,
          faixa: faixa?.qText ?? "",
          quantidade: Number.isFinite(quantidade?.qNum) ? quantidade.qNum : 0,
          percentual: percentual?.qText ?? "",
        };
      })
        // Página zerada: o engine devolve uma linha "-" com Count 0 que o qNullSuppression não tira
        .filter((faixa) => (faixa.quantidade ?? 0) > 0),
    [data, layout],
  );

  // A barra clicada pode não ser a linha de mesmo índice no engine: as linhas zeradas saem antes do desenho
  const aoIniciar = useIniciarGrafico((indice) => {
    const linha = faixas[indice]?.linhaQlik;
    if (linha !== undefined) selectCell(linha, 0);
  });

  const opcao = useMemo(
    () => ({
      ...baseGrafico(cores),
      grid: { ...baseGrafico(cores).grid, right: 8 },
      tooltip: {
        ...baseGrafico(cores).tooltip,
        axisPointer: { type: "shadow", shadowStyle: { color: cores.borda, opacity: 0.4 }, animation: !movimentoReduzido() },
        formatter: (params: { dataIndex: number }[]) => {
          const faixa = faixas[params[0]?.dataIndex ?? 0];
          return `<strong>Nota ${faixa?.faixa}</strong><br/>${(faixa?.quantidade ?? 0).toLocaleString("pt-BR")} avaliações (${faixa?.percentual})`;
        },
      },
      xAxis: {
        ...eixoCategorias(cores, faixas.map((f) => f.faixa)),
        // Todas as cinco faixas, curtas: no celular o passo de 76px escondia duas delas (">= 4 e < 6" → "4–6")
        axisLabel: { color: cores.suave, fontSize: 10, interval: 0, formatter: (faixa: string) => faixa.replace(/>= (\d+) e <=? (\d+)/, "$1–$2") },
      },
      yAxis: eixoValores(cores),
      series: [
        {
          name: "Quantidade",
          type: "bar",
          data: faixas.map((f) => f.quantidade),
          barMaxWidth: 48,
          itemStyle: { color: cores.primaria, borderRadius: [4, 4, 0, 0] },
          label: {
            show: true,
            position: "top",
            color: cores.suave,
            fontSize: 10,
            formatter: ({ dataIndex }: { dataIndex: number }) => faixas[dataIndex]?.percentual ?? "",
          },
        },
      ],
    }),
    [cores, faixas],
  );

  const estado = estadoDe(error, data, faixas.length === 0);
  if (estado) return <EstadoGrafico estado={estado} />;
  return (
    <div role="img" aria-label="Gráfico de barras: quantidade de avaliações por faixa de nota" className="h-full w-full">
      <ReactECharts
        echarts={echarts}
        option={opcao}
        notMerge
        style={{ height: "100%", width: "100%" }}
        onChartReady={aoIniciar}
      />
    </div>
  );
};
