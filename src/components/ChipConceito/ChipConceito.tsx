import { Badge } from "@/components/shadcn/badge";
import { faixaBdp } from "@/shared/qlik/periodo";
import { cn } from "@/shared/utils/tailwind/cn";
import { corFaixa } from "./faixas";

/** Conceito de uma avaliação (Excelente, Bom, Razoável, Ruim…) como chip na cor da faixa da nota; sem nota, fica neutro */
export const ChipConceito = ({ conceito, nota, className }: { conceito: string; nota?: number; className?: string }) => {
  const faixa = nota !== undefined && Number.isFinite(nota) ? faixaBdp(nota) : null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 whitespace-nowrap border-transparent px-2 py-0 text-[11px] font-medium leading-4",
        faixa ? cn(corFaixa[faixa], "bg-current/10") : "bg-muted text-foreground",
        className,
      )}
    >
      {conceito}
    </Badge>
  );
};
