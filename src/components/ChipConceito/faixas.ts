import type { FaixaBdp } from "@/shared/qlik/periodo";

// Mesma cor para o conceito de uma avaliação e para a faixa em que uma média cai
export const corFaixa: Record<FaixaBdp, string> = {
  bom: "text-n-success",
  razoavel: "text-n-alerta",
  ruim: "text-destructive",
};

export const fundoFaixa: Record<FaixaBdp, string> = {
  bom: "bg-n-success",
  razoavel: "bg-n-alerta",
  ruim: "bg-destructive",
};
