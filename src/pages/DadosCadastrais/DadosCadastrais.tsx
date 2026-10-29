import { Cartao, TabelaCartao } from "@/components/CartaoPainel/CartaoPainel";
import { KpisFornecedores } from "@/components/KpisFornecedores/KpisFornecedores";
import { colunasCadastro } from "@/pages/VisaoGeral/cadastro";

export const DadosCadastrais = () => (
  <div className="flex h-full flex-col gap-2 overflow-y-auto lg:overflow-hidden">
    <KpisFornecedores />
    <Cartao titulo="Dados cadastrais" className="h-auto min-h-[560px] shrink-0 lg:min-h-0 lg:flex-1">
      {/* A tabela já é a ficha do fornecedor */}
      {(slot) => <TabelaCartao colunas={colunasCadastro} slotExportar={slot} nomeArquivo="dados-cadastrais" selecionarLinha />}
    </Cartao>
  </div>
);
