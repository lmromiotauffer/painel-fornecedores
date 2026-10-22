import { useEffect, useState } from "react";
import { KPIParams, useGenericKPI, useText } from "@cluster-data-experience/qlik-modules";
import Card from "@/components/Card/components/Root/Root";
import { Variant1 } from "@/components/KPI/kpi-variant1";
import { corFaixa } from "@/components/ChipConceito/faixas";
import { Skeleton } from "@/components/shadcn/skeleton";
import { comoExibido, faixaBdp, leituraBdp, leituraCurtaBdp, mesContexto, noPeriodo } from "@/shared/qlik/periodo";
import { cn } from "@/shared/utils/tailwind/cn";

// Medidas dos objetos Jyjww, ZCWMf e FpmYneQ do app, com o formato #.##0 que eles usam.
// O BDP médio do período em contexto é novo: a mesma medida do ranking, sem quebrar por fornecedor
const indicadores = [
  { rotulo: "Fornecedores", icone: "ellipse-blocks", expressao: "Num(Count(distinct [_skCredor]), '#.##0')" },
  { rotulo: "Contratos", icone: "ellipse-layers", expressao: "Num(Count(distinct [_skContrato]), '#.##0')" },
  {
    rotulo: "Obras",
    icone: "ellipse-boxes",
    expressao: "Num(Count(distinct {<cdTipoObra = {15, 30, 33, 35, 37, 41, 45}>} [_skObra]), '#.##0')",
  },
  { rotulo: "BDP médio", icone: "ellipse-percent-diamond", expressao: `Num(Avg({<${noPeriodo}>} MedBDP), '#.##0,0')` },
] as const;

const kpis: KPIParams[] = indicadores.map(({ rotulo, expressao }) => ({ label: rotulo, expression: expressao }));

const tituloBdp = `='BDP médio de ' & ${mesContexto}`;

// A seção está nas duas páginas e remonta a cada troca: o hook recomeça sem dados, e o cartão piscava o skeleton,
// o título curto e reassentava o mesmo número. O último resultado segura a tela até o novo chegar
const ultimo: { data?: ReturnType<typeof useGenericKPI>["data"]; rotuloBdp?: string } = {};

export const KpisFornecedores = () => {
  const { data: dadoNovo, error } = useGenericKPI(kpis);
  const { text: rotuloNovo } = useText(tituloBdp);
  // Com erro vale o travessão, não o valor antigo
  const data = dadoNovo ?? (error ? null : ultimo.data);
  const rotuloBdp = rotuloNovo || ultimo.rotuloBdp;
  useEffect(() => {
    if (dadoNovo) ultimo.data = dadoNovo;
    if (rotuloNovo) ultimo.rotuloBdp = rotuloNovo;
  }, [dadoNovo, rotuloNovo]);

  // Valores com que a seção montou não entram de novo; o que mudou desde então sai da lista e passa a assentar sempre
  const [valoresMontagem, setValoresMontagem] = useState<(string | undefined)[] | undefined>(() => ultimo.data?.map((celula) => celula.qText));
  if (data && valoresMontagem?.some((texto, indice) => texto !== undefined && texto !== data[indice]?.qText)) {
    setValoresMontagem(valoresMontagem.map((texto, indice) => (texto === data[indice]?.qText ? texto : undefined)));
  }

  return (
    // No celular o BDP médio (o número que mais importa, com a leitura) vai primeiro em largura cheia
    // e as três contagens dividem a linha seguinte sem ícone; de sm em diante, 2×2; de xl, quatro em linha
    <section aria-label="Indicadores" className="grid shrink-0 grid-cols-6 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {indicadores.map(({ rotulo, icone }, indice) => {
        const celula = data?.[indice];
        // Com erro do Qlik o cartão mostra o travessão em vez de pulsar para sempre
        const valor = celula?.qText ?? "–";
        const ehBdp = rotulo === "BDP médio";
        // Uma casa, como o '#.##0,0' da expressão: "7,5" não pode vir com a leitura de Razoável
        const bdp = ehBdp && Number.isFinite(celula?.qNum) ? comoExibido(celula!.qNum as number, 1) : null;
        return (
          <Card
            key={rotulo}
            className={cn("px-4 py-3", ehBdp ? "order-first col-span-6 sm:order-none sm:col-span-1" : "col-span-2 sm:col-span-1")}
            title={!data && error ? "Indicador indisponível no momento" : undefined}
          >
            {data || error ? (
              <Variant1
                icon={icone}
                title={ehBdp ? rotuloBdp || rotulo : rotulo}
                className={cn(!ehBdp && "max-sm:[&>svg]:hidden")}
                value={
                  // key pelo valor: ao filtrar, só o número que mudou assenta de novo
                  <span
                    key={valor}
                    className={cn("inline-flex flex-wrap items-baseline gap-x-2", valor !== valoresMontagem?.[indice] && "animate-entrar-chip")}
                  >
                    {valor}
                    {bdp !== null && (
                      // A leitura diz entre quais referências oficiais a média está
                      <span title={leituraBdp(bdp)} className={cn("text-[11px] font-medium leading-4 whitespace-nowrap", corFaixa[faixaBdp(bdp)])}>
                        {leituraCurtaBdp(bdp)}
                      </span>
                    )}
                  </span>
                }
              />
            ) : (
              <Skeleton className="h-[42px] w-full rounded-lg bg-muted" />
            )}
          </Card>
        );
      })}
    </section>
  );
};
