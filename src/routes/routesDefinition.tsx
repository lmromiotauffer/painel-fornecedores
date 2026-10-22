import type { ReactElement } from "react";
import { ChartColumn, Table2 } from "lucide-react";
import { Avaliacoes } from "@/pages/Avaliacoes/Avaliacoes";
import { VisaoGeral } from "@/pages/VisaoGeral/VisaoGeral";

const default_description =
  "Ranking, cadastro e avaliações dos fornecedores da SINFRA-MT.";

export interface RouteDefinition {
  label: string;
  href: string;
  element: ReactElement;
  icon?: ReactElement;
  description?: string;
}

export const routesDefinition: RouteDefinition[] = [
  {
    label: "Visão geral",
    href: "/visao-geral",
    description: default_description,
    element: <VisaoGeral />,
    icon: <Table2 size={16} />,
  },
  {
    label: "Avaliações",
    href: "/avaliacoes",
    description: default_description,
    element: <Avaliacoes />,
    icon: <ChartColumn size={16} />,
  },
];
