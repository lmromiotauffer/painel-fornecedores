import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useQlikSelections, useTable, type Column } from "@cluster-data-experience/qlik-modules";
import { Button } from "@/components/shadcn/button";
import { decrescente, semTotais } from "@/components/CartaoPainel/colunas";
import { ChipConceito } from "@/components/ChipConceito/ChipConceito";
import { GraficoMedia } from "@/components/GraficosBdp/GraficosBdp";
import { Skeleton } from "@/components/shadcn/skeleton";
import { celulasOrdemEngine } from "@/shared/utils/celulasOrdemEngine";
import { cn } from "@/shared/utils/tailwind/cn";
import { camposCadastro, colunasCadastro, semValor } from "./cadastro";

// Índices em camposCadastro: nome e CNPJ vão no título; os demais em duas listas, pelo que o visitante procura
const grupos = [
  { titulo: "Empresa", indices: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { titulo: "Contato", indices: [13, 14, 15, 16] },
];

// Avaliações do fornecedor: colunas do objeto zTDbPC, da mais recente para a mais antiga; a ficha mostra só o último dia
const colunasUltimas: Column[] = [
  {
    type: "dimension",
    qFieldDefs: ["Data da avaliação"],
    qFieldLabels: ["Data da avaliação"],
    qSortCriterias: [{ qSortByNumeric: decrescente }],
    qNullSuppression: true,
    sortingPriority: 0,
  },
  { type: "dimension", qFieldDefs: ["deMedicao"], qFieldLabels: ["Medição"], sortingPriority: 1 },
  { type: "dimension", qFieldDefs: ["deCriterio"], qFieldLabels: ["Critério"], sortingPriority: 2 },
  { type: "dimension", qFieldDefs: ["deConceito"], qFieldLabels: ["Conceito"], sortingPriority: 3 },
  { type: "dimension", qFieldDefs: ["vlNota"], qFieldLabels: ["Nota"], sortingPriority: 4 },
];

const Titulo = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 text-xs font-medium text-muted-foreground">{children}</h3>
);

const Vazio = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
);

/** Ficha do fornecedor selecionado: cadastro, evolução do BDP e últimas avaliações. Só monta com um fornecedor em contexto. */
export const FichaFornecedor = ({ className }: { className?: string }) => {
  // pageHeight 1: a ficha assume uma linha de cadastro por fornecedor; com mais de uma, avisa que mostra a primeira
  const cadastro = useTable({ columns: colunasCadastro, pageHeight: 1, totals: semTotais });
  const linhasCadastro = cadastro.layout?.qHyperCube?.qSize?.qcy ?? 0;
  const avaliacoes = useTable({ columns: colunasUltimas, pageHeight: 100, totals: semTotais });

  const dados = useMemo(() => {
    const linha = cadastro.data?.rows?.[0];
    if (!linha) return null;
    return celulasOrdemEngine(linha.cells, cadastro.layout?.qHyperCube).map((celula) => (semValor(celula) ? null : celula.qText));
  }, [cadastro.data, cadastro.layout]);

  // Só as avaliações do último dia registrado: as linhas chegam da mais recente para a mais antiga
  const ultimas = useMemo(() => {
    const linhas = (avaliacoes.data?.rows ?? []).map((linha) => {
      const [data, medicao, criterio, conceito, nota] = celulasOrdemEngine(linha.cells, avaliacoes.layout?.qHyperCube);
      return {
        data: data?.qText ?? "",
        medicao: medicao?.qText ?? "",
        criterio: criterio?.qText ?? "",
        conceito: conceito?.qText ?? "",
        nota: nota?.qText ?? "",
        valorNota: Number.isFinite(nota?.qNum) ? (nota.qNum as number) : undefined,
      };
    });
    return linhas.filter(({ data }) => data === linhas[0]?.data);
  }, [avaliacoes.data, avaliacoes.layout]);
  const totalAvaliacoes = avaliacoes.layout?.qHyperCube?.qSize?.qcy ?? 0;

  // Voltar = limpar a seleção de fornecedor; o chip da barra de filtros faz o mesmo, mas fica longe da ficha
  const { items } = useQlikSelections();
  const selecaoFornecedor = items.find(({ fieldName }) => fieldName === "nmCredor");

  return (
    <section
      aria-label="Ficha do fornecedor"
      // data-ordem só com os dados: a cascata rodava nos esqueletos e o conteúdo real chegava num corte
      data-revelar="obra"
      className={cn(
        // Sem borda própria: a ficha é a continuação do cartão abaixo da linha selecionada, separada por uma régua
        "flex flex-col gap-3 overflow-y-auto border-t border-border px-1 pt-3",
        className,
      )}
    >
      <div data-ordem={dados ? "" : undefined} style={{ "--ordem": 0 } as React.CSSProperties} className="flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
        {dados ? (
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight text-foreground">{dados[0] ?? "Fornecedor"}</h2>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">CNPJ {dados[1] ?? "não informado"}</p>
            {linhasCadastro > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {linhasCadastro} linhas de cadastro para este fornecedor; a ficha mostra a primeira.
              </p>
            )}
          </div>
        ) : (
          <Skeleton className="h-10 w-64 rounded-lg bg-muted" />
        )}
        <Button
          variant="outline"
          size="sm"
          // A ficha some com o botão focado dentro: o foco vai para a aba ativa, logo acima do ranking
          onClick={() => {
            document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
            selecaoFornecedor?.clear();
          }}
          className="border-input bg-sidebar text-foreground"
        >
          <ArrowLeft aria-hidden />
          Voltar ao ranking
        </Button>
      </div>

      {/* flex-1 sem min-h-0: a grade toma a folga da seção, mas nunca encolhe abaixo do conteúdo (a seção rola) */}
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] lg:gap-0 lg:divide-x lg:divide-border">
      <div data-ordem={dados ? "" : undefined} style={{ "--ordem": 1 } as React.CSSProperties} className="min-w-0 lg:pr-4">
        {dados ? (
          <>
            {grupos.map(({ titulo, indices }, posicao) => (
              // Coluna de rótulos fixa: os valores de Empresa e Contato alinham entre si
              <dl key={titulo} className={cn("grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs", posicao > 0 && "mt-4")}>
                <dt className="col-span-2 font-medium text-muted-foreground">{titulo}</dt>
                {indices.map((indice) => (
                  <div key={indice} className="contents">
                    <dt className="whitespace-nowrap text-muted-foreground">{camposCadastro[indice][1]}</dt>
                    <dd className={cn("min-w-0 break-words text-foreground", !dados[indice] && "text-muted-foreground")}>
                      {dados[indice] ?? "não informado"}
                    </dd>
                  </div>
                ))}
              </dl>
            ))}
          </>
        ) : (
          <Skeleton className="h-40 w-full rounded-lg bg-muted" />
        )}
      </div>

      <div data-ordem style={{ "--ordem": 2 } as React.CSSProperties} className="flex min-h-56 min-w-0 flex-col lg:px-4">
        <Titulo>BDP do fornecedor por ano/mês da medição</Titulo>
        <div className="min-h-0 flex-1">
          <GraficoMedia />
        </div>
      </div>

      <div data-ordem={avaliacoes.data ? "" : undefined} style={{ "--ordem": 3 } as React.CSSProperties} className="flex min-w-0 flex-col lg:pl-4">
        <Titulo>{ultimas.length ? `Avaliações de ${ultimas[0].data}` : "Últimas avaliações"}</Titulo>
        {avaliacoes.data ? (
          ultimas.length === 0 ? (
            <Vazio>Nenhuma avaliação para os filtros atuais.</Vazio>
          ) : (
            <ol className="flex flex-col divide-y divide-border text-xs">
              {ultimas.map((avaliacao, indice) => (
                <li key={indice} className="grid grid-cols-[minmax(0,1fr)_auto_2.5rem] items-center gap-x-3 py-1.5">
                  <span className="min-w-0 truncate text-foreground" title={`${avaliacao.medicao} · ${avaliacao.criterio}`}>
                    {avaliacao.criterio}
                    <span className="text-muted-foreground"> · {avaliacao.medicao}</span>
                  </span>
                  <ChipConceito conceito={avaliacao.conceito} nota={avaliacao.valorNota} />
                  <span className="text-right font-semibold tabular-nums text-foreground">{avaliacao.nota}</span>
                </li>
              ))}
            </ol>
          )
        ) : (
          <Skeleton className="h-40 w-full rounded-lg bg-muted" />
        )}
        {totalAvaliacoes > ultimas.length && (
          <Link
            to="/avaliacoes"
            className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/70 rounded-sm"
          >
            Ver todas as {totalAvaliacoes.toLocaleString("pt-BR")} avaliações
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>
      </div>
    </section>
  );
};
