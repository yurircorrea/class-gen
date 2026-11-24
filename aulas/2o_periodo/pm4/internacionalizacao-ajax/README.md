# Aula — AJAX com fetch e Internacionalização com Intl

**Período e PM:** 2º período · PM 4 (Projeto Mensal)
**Material de origem:** `material/2o_periodo/pm4/internacionalizacao-ajax/`

- `Requisições AJAX com fetch.pdf` (20 slides): Parte 1 da aula
- `Internacionalização com Intl — Aula de JavaScript.pdf` (15 slides): Parte 2 da aula

Página única para projetar e rolar durante a aula: 28 seções numeradas (01 a 13 de AJAX, 14 a 27
de Intl e a 28, que junta as duas), a seção Materiais da Aula, um laboratório livre, uma
referência rápida e a atividade final em três partes. Abre por duplo clique no `index.html`, sem
servidor e sem Internet (só a fonte dos títulos vem do Google Fonts, com Arial Narrow de reserva).

## Como as demonstrações funcionam

Todo console da página é **execução real**: o código do painel ao lado roda num quadro invisível
(`iframe srcdoc`) e `console.log`, `console.warn`, `console.error` e os erros não tratados voltam
para a página por `postMessage`. O código roda dentro de uma função `async`, então `await` funciona
direto, como no console do navegador.

- **Servidor simulado.** Dentro de cada quadro, `window.fetch` é trocado por um servidor simulado
  (`servidor()` em `js/aula.js`) que responde como as APIs reais: ViaCEP, JSONPlaceholder e
  AwesomeAPI. As respostas foram copiadas das APIs em 24/11/2026, inclusive os detalhes que viram
  lição: `"erro": "true"` como texto na ViaCEP, o 400 da ViaCEP sem cabeçalho de CORS (o `fetch`
  rejeita com `TypeError`), o 500 do JSONPlaceholder para corpo que não é JSON e o corpo ignorado
  quando falta `Content-Type`. Assim a aula funciona sem Internet e a demonstração sai igual em
  toda turma.
- **Botão "servidor simulado / APIs reais"** na barra do topo: troca para a Internet de verdade
  (ViaCEP, JSONPlaceholder e AwesomeAPI). As rotas fictícias da aula (`/api/frete`,
  `/api/produtos`, `/api/curtidas`, `/api/mensagens`, `/produto/mochila`) continuam simuladas. A
  escolha fica guardada no `localStorage` do navegador. No modo Internet, o console do F12 mostra
  os 404, 500 e bloqueios de CORS reais: é o esperado.
- **Painel de rede** (como a aba Rede do F12): método, status, endereço e tempo de cada
  requisição do exemplo.
- **Carimbo de tempo** nos consoles de AJAX: quantos segundos depois do início cada linha
  apareceu. É o que torna visível o "assíncrono".
- **Botões de chamada** rodam o painel mais aquela linha. `data-rede="offline"` no botão roda o
  mesmo código sem Internet; `data-latencia="6000"` simula um servidor lento.
- **Telas** (seções 12, 13, 26 e 28): o HTML e o JavaScript dos painéis rodam num quadro visível.
- **Intl** roda no navegador em uso: Chrome, Firefox e Safari podem diferir num detalhe de
  formatação (e a mensagem de erro de `dateStyle` com `day` no Chrome é a pouco clara
  "Invalid option : option").
- **Resultado esperado da atividade**: implementação de referência escondida em `js/aula.js`
  (seção 9 do arquivo). A página mostra o comportamento, não o código da solução. O histórico de
  CEPs fica no `localStorage` com a chave `aula-ajax-intl-historico`.

## Seções

| # | Seção | Demonstração |
|---|---|---|
| 01 | Recarregar tudo ou só uma parte | duas janelas da mesma loja: a clássica troca a página inteira (1.125 bytes, a observação some); a com AJAX troca só a linha do frete (58 bytes) |
| 02 | O que significa AJAX | ordem das linhas com `fetch`; `XMLHttpRequest` x `fetch` |
| 03 | O caminho de uma requisição | os quatro passos acendendo em sequência, com o JSON da resposta; roda sozinho quando a seção aparece |
| 04 | AJAX em sites que você usa | CEP, sugestões com debounce, curtir com botão desabilitado, chat por polling |
| 05 | HTTP: métodos e status | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` e 404 no JSONPlaceholder |
| 06 | A sintaxe do fetch | a Promise aparece antes da resposta |
| 07 | Promises e seus estados | o mesmo código com e sem Internet |
| 08 | .then() | `Response`, `json()`, `text()`; sem `return`; corpo lido duas vezes |
| 09 | async/await | `.then()` x `await`; sem `await`; `async` sempre devolve Promise |
| 10 | Quando dá errado | sem Internet, 400 sem CORS, 404 e `"erro": "true"` |
| 11 | POST | 201 e `id: 101`; sem `JSON.stringify` (500); sem `Content-Type` (corpo ignorado) |
| 12 | Mostrando na tela | formulário de CEP completo |
| 13 | Enquanto a resposta não chega | "buscando…", `disabled`, `finally`, `AbortSignal.timeout` com servidor lento |
| 14 | Formatar na mão quebra | `toFixed` e `getMonth` x Intl |
| 15 | Locale | laboratório com dez locales; `navigator.language`; lista de preferência |
| 16 | A família Intl | um exemplo de cada formatador; `toLocaleString`; `DurationFormat` |
| 17 | NumberFormat | casas decimais, `useGrouping` |
| 18 | Moeda | BRL, USD, `currencyDisplay`, iene, câmbio, `currency` faltando, espaço não separável |
| 19 | Percentual, unidade, compacto | três exemplos e o laboratório com todas as opções de `NumberFormat` |
| 20 | DateTimeFormat | `dateStyle`, campos, cinco fusos, estilo + campo; laboratório |
| 21 | Armadilhas de data | mês zero, instante, `"2026-11-04"` como UTC, ISO |
| 22 | RelativeTimeFormat | `numeric: "auto"`; régua de −400 a +400 dias com `escolherUnidade` |
| 23 | Collator | acento, `numeric`, `sensitivity: "base"`, maiúsculas |
| 24 | ListFormat e PluralRules | conectivos, plural (o zero em pt-BR), ordinais em inglês |
| 25 | Boas práticas | formatador dentro e fora do laço (medido), `resolvedOptions`, `formatToParts` |
| 26 | Módulo de formatadores | `formatadores.js` + tela do pedido |
| 27 | Seis tropeços | os seis rodando |
| 28 | AJAX + Intl | cotação do dólar e do euro na AwesomeAPI formatada com Intl |

## Materiais da Aula

A seção `#materiais` (logo depois do roteiro, com item no menu) oferece os dois PDFs, escolhidos
pelo professor. Os links apontam para os originais em `material/` (caminho
`../../../../material/2o_periodo/pm4/internacionalizacao-ajax/...`), sem cópia em `aulas/`:
**dependem de `material/` estar no mesmo repositório**. Os nomes dos arquivos estão gravados no
disco em Unicode decomposto (NFD, por exemplo `c` + cedilha combinante), e os links usam essa
mesma codificação (`Requisic%CC%A7o%CC%83es...`); se os PDFs forem renomeados ou recopiados, refaça
os links a partir do nome real. Não há imagens para baixar, então a aula não precisa de
`js/materiais.js`. Testado: os dois links baixam o arquivo idêntico ao original (SHA-256) por
http e resolvem no disco por `file://`.

## O que foi corrigido ou acrescentado em relação ao material

- **PM do slide de AJAX:** o rodapé dos slides diz "PM02" e cita outro tema de projeto; a aula
  segue o pedido do professor (2º período, PM 4).
- **CEP mal formado não chega como 400 ao seu código.** A ViaCEP responde 400 sem o cabeçalho
  `Access-Control-Allow-Origin`, então no navegador o `fetch` rejeita com `TypeError`, como numa
  queda de rede. O slide sugere tratar isso com `resposta.ok`. A seção 10 mostra os quatro casos
  (sem Internet, 400 sem CORS, 404 legível no JSONPlaceholder, CEP inexistente) e a Parte 3 da
  atividade pede para o aluno investigar na aba Rede.
- **`"erro": "true"` é texto** na ViaCEP de hoje. `if (dados.erro)` funciona; `=== true` não.
- **Corpo sem `Content-Type`:** o JSONPlaceholder ignora (`{ id: 101 }`); sem `JSON.stringify`
  com `Content-Type` JSON, responde 500. Os dois casos rodam na seção 11.
- **`dataCurta` sem `timeZone`** no módulo de formatadores do slide: a aula acrescenta
  `timeZone: "America/Sao_Paulo"`, seguindo a própria recomendação do material.
- **Unidade de `RelativeTimeFormat`:** o slide diz "no singular"; a API aceita singular e plural
  (`"day"` ou `"days"`).
- **Módulos por `file://`:** o exemplo `import ... from "./formatadores.js"` não carrega por duplo
  clique. Cartão na seção 26 e requisito na atividade (Live Server).
- **Acrescentado:** `XMLHttpRequest` x `fetch`, debounce, polling, `AbortSignal.timeout`,
  `finally` para reabilitar o botão, `innerHTML` com dados de fora, `ListFormat`, `PluralRules`
  (e o zero em pt-BR, que é `one`), `DurationFormat`, o espaço não separável depois de `R$`,
  `currency` inventado (`RangeError`), timestamp em segundos e a seção 28, que junta AJAX e Intl.
- **Atividade:** os dois exercícios dos slides (buscador de CEP com histórico; extrato com Intl)
  viraram uma atividade só, em três partes, com o bloco de envio por e-mail.

## Estrutura

```
internacionalizacao-ajax/
├── index.html      a aula inteira
├── css/
│   ├── estilo.css  identidade visual (paleta Descomplica + UniAmérica, a mesma do PM 2 e do PM 3)
│   └── demos.css   console, painel de rede, telas, caminho da requisição, laboratórios,
│                   materiais, AJAX no dia a dia e resultado esperado
├── js/
│   └── aula.js     realce de código, navegação, servidor simulado, motor de execução em
│                   quadros, consoles e chamadas, demonstrações da Parte 1, laboratórios de
│                   Intl, laboratório livre, resultado esperado da atividade
├── img/
│   └── logo.png
└── README.md
```

## Editando

- Para um console novo: um elemento com `data-exec` (e `data-codigo="id-do-pre"`, ou um
  `pre.codigo` dentro dele), botões `data-chamada="..."` opcionais, um `div.console[data-console]`
  (`data-tempo` liga o carimbo de tempo) e, se quiser, `<div data-painel-rede></div>`.
- Para uma tela: `data-html="id-do-pre-html"` e um `div.tela[data-tela]`. Tags
  `<script src>` do HTML exibido não rodam no quadro.
- Para uma rota nova no servidor simulado: função `rotear()` em `js/aula.js`. Os CEPs conhecidos
  ficam em `CEPS`; qualquer outro CEP de 8 dígitos devolve `{ "erro": "true" }`.
- No HTML fonte, todo `<` dentro de código precisa estar escrito como `&lt;`.
- A assinatura da capa não tem nome de professor. Para incluir, edite `.assinatura` em `index.html`.

## Atribuição

Baseada nos slides *Requisições AJAX com fetch* e *Internacionalização com Intl — Aula de
JavaScript* (sem autor indicado nos arquivos). Os exemplos foram reescritos e ampliados; o crédito
aparece no rodapé da página. Dados de exemplo das APIs públicas ViaCEP, JSONPlaceholder e
AwesomeAPI.

## Verificação feita

- Chrome em 1500 px e 375 px: sem transbordo horizontal, menu com os 16 itens sem corte, nenhuma
  diferença de altura acima de 250 px entre código e demonstração lado a lado.
- Todos os consoles conferidos linha a linha; todos os botões de chamada, inclusive "sem Internet" e
  "servidor lento"; as quatro telas com altura justa; os quatro laboratórios, inclusive os erros
  (`RangeError`, `TypeError`); as demonstrações das seções 01, 03 e 04; a régua de tempo relativo;
  o resultado esperado da atividade (CEP, histórico, idioma, cotação).
- Modo "APIs reais" testado contra ViaCEP, JSONPlaceholder e AwesomeAPI de verdade; foi esse
  teste que revelou o 400 sem CORS da ViaCEP.
- No modo simulado, a página não faz nenhuma requisição externa.
- Captura de cada seção com Chrome headless e perfil novo a cada captura.
- Abertura por `file://`: todos os consoles da carga inicial recebem saída e o painel de rede funciona.
- Links de Materiais da Aula: arquivo baixado idêntico ao original.
