# Painel de Fornecedores — SINFRA-MT

Mashup Qlik Sense para consultar o ranking, o cadastro e as avaliações dos fornecedores da SINFRA-MT (Secretaria de Estado de Infraestrutura e Logística de Mato Grosso). Desenvolvido com React 19, TypeScript e Vite.

O painel acessa o app Qlik de fornecedores pela biblioteca `@cluster-data-experience/qlik-modules`. O engine do Qlik calcula os indicadores; o front-end monta as consultas (hipercubos e expressões), aplica seleções e apresenta os resultados. Não há back-end nem banco de dados próprios.

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Qlik Sense](https://img.shields.io/badge/Qlik_Sense-mashup-009845?logo=qlik&logoColor=white)
![Tests](https://img.shields.io/badge/node--test-18_testes-2E7D32)

## Sumário

[Objetivo](#objetivo) · [Páginas](#páginas) · [Nota BDP](#nota-bdp) · [Arquitetura](#arquitetura) · [Tecnologias](#tecnologias) · [Estrutura](#estrutura-do-projeto) · [Como executar](#como-executar) · [Configuração](#configuração) · [Scripts](#scripts) · [Testes](#testes) · [Deploy](#deploy) · [Decisões](#decisões-de-projeto) · [Problemas comuns](#problemas-comuns) · [Licença](#licença)

## Objetivo

Dar ao público uma leitura direta do desempenho dos fornecedores da SINFRA-MT: quem está no topo do ranking do mês, como as avaliações evoluem e quais são os dados cadastrais de cada empresa, sem precisar abrir o app Qlik.

O painel reúne indicadores do período (fornecedores, contratos, obras e BDP médio), ranking Top 10, ficha do fornecedor, dados cadastrais e avaliações por medição e critério. Os gráficos mostram a média e a distribuição da nota BDP.

Também inclui:

- Barra de filtros do Qlik, com “Mais filtros” para os que não cabem e indicação das seleções atuais.
- Busca e filtro no cabeçalho das tabelas e exportação para Excel (`.xlsx`).
- Tema claro/escuro, layout para celular e aviso de sessão desconectada.

## Páginas

Sem seleção em Ano/mês da medição, o painel mostra o mês anterior ao último ranking disponível, como no app original. Só esse filtro troca o mês: selecionar um fornecedor ou município não muda o período (regra em `src/shared/qlik/periodo.ts`).

### Ranking (`/#/ranking`)

- Indicadores: Fornecedores, Contratos, Obras e BDP médio do mês em contexto, com indicação da faixa, como “≥ 7,5 Bom”.

- Ranking do mês: Top 10 por posição (campo `Rank`), com medalha no pódio e barra de BDP de 0 a 10 marcada nas referências oficiais. Empates repetem a posição.

- Ficha do fornecedor: ao selecionar uma linha, a tabela mostra apenas esse fornecedor e abre a ficha abaixo, com dados da empresa, contato, últimas avaliações e a evolução do BDP. Se o fornecedor não estiver no Top 10 do mês, a tabela avisa e a ficha continua disponível.

### Avaliações (`/#/avaliacoes`)

- Média da avaliação (BDP) por ano/mês da medição: gráfico de linha com as referências Bom, Razoável e Ruim.

- Distribuição das avaliações por faixa de nota: gráfico de barras com quantidade e percentual.

- Avaliação por medição e critério: tabela com data, fornecedor, critério, conceito (chip na cor da faixa), nota, medição, contrato, código da obra, fiscal e ano/mês.

### Dados Cadastrais (`/#/dados-cadastrais`)

- Tabela com CNPJ, município, ramo de atividade, endereço e contatos.

## Nota BDP

A nota BDP vai de 0 a 10. As referências oficiais definem a leitura de qualquer média:

| Faixa | Condição |
|-------|----------|
| 🟢 Bom | ≥ 7,5 |
| 🟡 Razoável | ≥ 5 e < 7,5 |
| 🔴 Ruim | < 5 (com marca de referência em 2,5) |

A cor da faixa é calculada sobre o valor exibido (`comoExibido`). Uma média de 7,4999… exibida como “7,50” fica na faixa Bom, mantendo a cor coerente com o número.

## Arquitetura

O navegador se conecta ao Qlik Sense em `painel.sinfra.mt.gov.br` por HTTPS e WebSocket. O `appId` em `connection.json` identifica o app de fornecedores.

| Arquivo ou diretório | Responsabilidade |
| --- | --- |
| `main.tsx` | Carrega `./connection.json` |
| `App.tsx` | Organiza os providers na ordem `ThemeProvider` → `QlikProvider` → `QlikSelectionsProvider` → `HashRouter` |
| `routes/` | Define o fluxo `ConnectionGuard` (aviso de desconexão) → `Layout` → páginas |
| `pages/` | Consulta hipercubos e expressões Qlik e apresenta os resultados em tabelas, KPIs e gráficos |

- O Qlik calcula os indicadores. O front-end declara colunas (`qFieldDefs`, `qDef`, set analysis) e recebe células prontas. As expressões vêm dos objetos do app original, citados pelo ID nos comentários.

- Filtros, cliques em linhas e a ficha do fornecedor usam o estado de seleção do Qlik, compartilhado entre páginas.

- Roteamento por hash (`HashRouter`): o mashup é servido como arquivos estáticos pelo Qlik, sem reescrita de URL no servidor.

## Tecnologias

| Área | Stack |
|------|-------|
| Base | React 19 · TypeScript 6 (strict) · Vite 8 |
| Qlik | `@cluster-data-experience/qlik-modules` (conexão, seleções, hipercubos, KPIs, busca) · `@types/qlik-engineapi` |
| Estilo | Tailwind CSS 4 · tailwind-merge · tailwind-variants · tailwindcss-animate |
| Componentes | Radix UI (padrão shadcn) · lucide-react · `@tanstack/react-virtual` (listas de filtro) |
| Gráficos | ECharts 6 (só os módulos usados) · echarts-for-react |
| Exportação | SheetJS (`xlsx`), carregado sob demanda |
| Roteamento | React Router 7 |
| Dev | ESLint · `vite-plugin-mkcert` (HTTPS local) · `vite-plugin-svgr` · `node --test` |

## Estrutura do projeto

```
painel-fornecedores/
├── public/
│   ├── connection.json          conexão com o servidor Qlik e o app
│   ├── fornecedores.qext        manifesto da extensão (mashup)
│   ├── wbfolder.wbl             lista de arquivos para o editor do Qlik
│   └── assets/favicon/
├── scripts/
│   ├── check-lib.cjs            impede build com a lib linkada
│   └── revert-lib.cjs           volta a lib linkada para a versão do registry
├── src/
│   ├── main.tsx · App.tsx       bootstrap e providers
│   ├── routes/                  rotas e ConnectionGuard
│   ├── layout/                  menu lateral, cabeçalho, filtros
│   ├── pages/
│   │   ├── VisaoGeral/          ranking, ficha e dados cadastrais
│   │   └── Avaliacoes/          gráficos e tabela de avaliações
│   ├── components/              KPIs, cartões, gráficos BDP, filtros, shadcn…
│   └── shared/
│       ├── qlik/                filtros da barra e expressões do período/BDP
│       ├── components/          CustomTable (tabela + exportação) e filtros
│       ├── contexts/            tema
│       ├── hooks/               mídia, movimento reduzido, busca Qlik
│       └── utils/
├── vite.config.ts · tsconfig*.json · eslint.config.js · components.json
```

## Como executar

Pré-requisitos:

- Node.js 22.18 ou superior. O projeto foi desenvolvido com Node.js 24. Embora o Vite 8 aceite 20.19+, `npm test` executa arquivos `.ts` diretamente e precisa do *type stripping* nativo.
- Acesso ao servidor Qlik configurado em `public/connection.json`.
- Origem `https://localhost:5174` liberada no servidor Qlik.

```bash
npm install
npm run dev          # https://localhost:5174
```

O `vite-plugin-mkcert` gera um certificado local na primeira execução (pode pedir permissão para instalar a CA). A porta é fixa (`strictPort`): se a 5174 estiver ocupada, o Vite falha em vez de trocar de porta, porque o Qlik só aceita a origem liberada.

## Configuração

A conexão é lida em tempo de execução de `connection.json`. Ela não é embutida no build, por isso basta trocar esse arquivo para apontar o mesmo pacote para outro servidor.

| Chave | Obrigatória | Descrição |
|-------|-------------|-----------|
| `host` | sim | Servidor Qlik Sense |
| `isSecure` | sim | `true` para HTTPS/WSS |
| `port` | sim | Porta do servidor |
| `prefix` | sim | Prefixo do virtual proxy (`/` para o padrão) |
| `appId` | sim | ID do app de fornecedores |
| `webIntegrationId` | não | Necessário apenas no Qlik Cloud |
| `debugMode` | não | Ativa os logs de depuração da lib |

Os filtros da barra e a ordem em que aparecem ficam em `src/shared/qlik/filtros.ts`.

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Garante a lib do registry (desfaz `npm link`) e sobe o Vite |
| `npm run dev:lib` | Linka a `qlik-modules` local (`npm link`) e sobe o Vite para desenvolver a lib junto |
| `npm run build` | Confere que a lib não está linkada, checa os tipos (`tsc -b`) e gera `dist/` |
| `npm run preview` | Serve o build em `https://localhost:5174` |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários com `node --test` |

## Testes

```bash
npm test
```

Os 18 testes em 5 arquivos cobrem a lógica pura e rodam diretamente no Node, sem framework adicional:

| Arquivo | O que cobre |
|---------|-------------|
| `shared/qlik/periodo.test.ts` | faixas e leitura da nota BDP |
| `shared/utils/celulasOrdemEngine.test.ts` | reordenação das células do engine para a ordem das colunas |
| `shared/components/CustomTable/exportarPlanilha.test.ts` | paginação da exportação dentro do limite do engine |
| `shared/components/FilterObjectContainer/opcoesFiltro.test.ts` | mescla de opções das listas de filtro |
| `components/CartaoPainel/colunas.test.ts` | prioridade de ordenação das colunas convertida para a ordem do engine |

A integração com o Qlik é conferida no navegador, contra o app real.

## Deploy

O painel é publicado como extensão do tipo mashup no Qlik Sense.

```bash
npm run build
```

O build gera `dist/` com `index.html`, `assets/`, `connection.json`, `fornecedores.qext` e `wbfolder.wbl`. Crie um `.zip` com o conteúdo de `dist/` na raiz do arquivo e importe em QMC → Extensions → Import. Para atualizar, remova a extensão anterior ou importe por cima, conforme a política do ambiente.

`base: ""` no Vite gera caminhos relativos, então o pacote funciona no caminho de extensões do Qlik sem ajuste.

## Decisões de projeto

| # | Decisão | Escolha e justificativa |
|---|---------|-------------------------|
| 1 | Onde calcular | No Qlik. O front-end declara as expressões do app original, sem duplicar as regras de cálculo. |
| 2 | Ranking | Um ranking só, do mês em contexto, unindo a tabela por ano/mês e o Top 10 do app. O histórico fica no filtro Ano/mês da medição. |
| 3 | Mês em contexto | Só o filtro de ano/mês troca o período (`{1<DEANOMES = $::DEANOMES>}`); selecionar fornecedor ou município não muda o mês. |
| 4 | Faixa da nota | Calculada sobre o valor exibido, para cor e número sempre concordarem. |
| 5 | Gráficos | ECharts modular: só linha, barra e componentes usados (o pacote completo pesa ~1 MB minificado). |
| 6 | Exportação | `xlsx` importado sob demanda, paginado em blocos de até 10 mil células (limite do engine). |
| 7 | Conexão | `connection.json` em tempo de execução, para trocar de servidor sem rebuild. |
| 8 | Rotas | `HashRouter`, porque o Qlik serve o mashup como estático, sem fallback de rota. |
| 9 | Acessibilidade | Contraste mínimo de 3:1 nos ícones e 4,5:1 nos textos dos gráficos; animações respeitam `prefers-reduced-motion`; alvos de toque de 44 px no celular. |

## Problemas comuns

"Erro ao inicializar aplicação / Não foi possível carregar a configuração de conexão": o `connection.json` não foi encontrado ao lado do `index.html`. Confira se ele está em `public/` (dev) ou na raiz do pacote (deploy).

Diálogo de sessão desconectada: o WebSocket com o Qlik caiu (rede, máquina suspensa ou timeout da sessão). A lib não reconecta sozinha: recarregue a página.

`Port 5174 is already in use`: outro processo ocupa a porta. Encerre-o; trocar a porta exige liberar a nova origem no Qlik.

Erro de CORS / WebSocket recusado no dev: o servidor Qlik não aceita a origem `https://localhost:5174`. Peça a liberação no virtual proxy (Host allow list).

`❌ A lib está linkada` no build: a `qlik-modules` está via `npm link`. Rode `node scripts/revert-lib.cjs` (ou `npm run dev`, que faz isso) e repita o build.

`npm install` falha no pacote `xlsx`: o SheetJS é baixado do CDN oficial (`cdn.sheetjs.com`), não do registry npm. O `.npmrc` (`allow-remote=all`) libera isso; confira se a rede permite o acesso ao CDN.

## Licença

Uso interno institucional da SINFRA-MT.
