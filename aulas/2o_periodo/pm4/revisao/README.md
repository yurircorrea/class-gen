# Aula — Revisão para a prova

**Período e PM:** 2º período · PM 4 (Projeto Mensal)
**Material de origem:** `material/2o_periodo/pm4/revisao/` (30 capturas de tela com o banco de
questões da prova: 20 objetivas, sendo uma captura repetida, 6 no estilo ENADE e 3 dissertativas)

Página única para projetar e rolar durante a aula de revisão: 23 seções numeradas em 5 partes, um
laboratório livre, uma referência rápida e, **no lugar da atividade, uma seção de perguntas
simuladas**. Abre por duplo clique no `index.html`, sem servidor e sem Internet (só a fonte dos
títulos vem do Google Fonts, com Arial Narrow de reserva).

## Como a revisão foi montada

Cada questão do banco foi associada a um assunto, e cada assunto a uma aula anterior que o
ensinou. Entraram **só as aulas que atendem às questões**:

| Aula anterior | Onde está | O que a revisão aproveita |
|---|---|---|
| Web APIs e HTTP | `aulas/2o_periodo/pm3/web-apis-http` | cliente e servidor, HTTP sem estado, métodos, GET e a URL, códigos de status |
| Tratamento de erros com try...catch | `aulas/2o_periodo/pm3/try-catch` | `try...catch` com `await`, erros assíncronos |
| Fluxo assíncrono | `aulas/2o_periodo/pm4/fluxo-assincrono` | síncrono x assíncrono, estados da Promise, `.then`, `async/await` |
| AJAX e Intl | `aulas/2o_periodo/pm4/internacionalizacao-ajax` | `fetch`, `Response`, `json()`, `ok`/`status`, POST com JSON, DOM, `Intl.DateTimeFormat`, `timeZone` |

Flexbox e Bootstrap (PM 2) ficaram de fora: nenhuma questão os cobra.

**Assuntos da prova sem aula própria** (incluídos com a concordância do professor, marcados na
página com o selo “novo nesta revisão”):

- **IIFE e escopo** (seções 20 e 21): nenhuma aula tratou.
- **`export default`** (seção 23): a aula de Intl só usou exportação nomeada.
- **HTTPS e TLS** (seção 06): a aula de HTTP só citou HTTPS numa linha de tabela.

Cada seção tem um selo de origem (`aula: Web APIs e HTTP · PM 3`, por exemplo) para o aluno saber
onde estudar de novo.

## Perguntas simuladas

Sete objetivas e três ENADE, escolhidas para cobrir assuntos diferentes. **Nenhuma outra questão
do banco aparece na página**: os exemplos das seções usam outros cenários e outro código (a API de
filmes), sem repetir enunciados, URLs ou valores das questões não escolhidas.

| # | Fonte | Assunto | Captura de origem | Resposta na página |
|---|---|---|---|---|
| 01 | Objetiva | síncrono x assíncrono | `145226` | C |
| 02 | Objetiva | estados da Promise | `145603` | E |
| 03 | Objetiva | async/await x Promises | `145418` | B |
| 04 | Objetiva | HTTP sem estado | `145159` | D |
| 05 | Objetiva | faixas de status | `145406` | C |
| 06 | Objetiva | `JSON.stringify` e `Content-Type` | `145429` | E |
| 07 | Objetiva | IIFE e escopo | `145331` | D |
| 08 | ENADE | `fetch` devolve `Response` (asserções) | `145628` | A |
| 09 | ENADE | `Intl.DateTimeFormat` com `timeZone` | `145641` | D |
| 10 | ENADE | `export default` | `145708` | C |

- Os enunciados e as alternativas são os do banco. **A ordem das alternativas foi embaralhada**
  nas questões de múltipla escolha comum, porque no banco a correta é sempre a A. A questão 08
  (asserção/razão) mantém a ordem padrão do ENADE, em que a A é a correta.
- Clicar numa alternativa marca a escolhida, mostra a certa, abre a explicação com o link para a
  seção correspondente e soma no placar. “tentar de novo” refaz uma questão; “recomeçar o
  simulado” zera todas. Nada fica salvo: recarregar a página também zera.
- A resposta da questão 09 foi conferida no navegador: `sábado, 15 de março de 2025`.

Sem atividade, não há bloco de envio por e-mail. Os 30 prints ficam só em `material/` e **não**
são oferecidos para download (a aula não tem seção Materiais da Aula, por decisão do professor).

## Como as demonstrações funcionam

Todo console da página é **execução real**: o código do painel roda num quadro invisível
(`iframe srcdoc`) e `console.log`, `console.warn`, `console.error` e os erros não tratados voltam
para a página por `postMessage`. Três jeitos de rodar (`data-jeito`):

- **padrão:** dentro de uma função `async`, então `await` funciona direto, como no console do
  navegador.
- **`classico`:** um `<script>` comum, como num arquivo `.js`. Usado em IIFE e escopo, porque lá
  importa que `var` global vire `window.algo` e que o `SyntaxError` apareça como no navegador.
- **`modulo`:** `<script type="module">` de verdade. Os arquivos da demonstração
  (`<pre data-arquivo="./ingressos.js">`) viram URLs `data:` ligadas por um *import map*. Os erros
  de import (`does not provide an export named ...`) são os do próprio navegador. Funciona por
  `file://`.

**API de filmes simulada** (`servidor()` em `js/aula.js`): uma API REST em
`https://api.cinema.local`, criada para a revisão, que responde sem Internet e igual em toda
turma. Cada execução começa com os mesmos seis filmes.

| Rota | Comportamento |
|---|---|
| `GET /filmes?genero=&desde=` | lista, com filtros |
| `POST /filmes` | `201` com `id`; sem `Content-Type` JSON, `415`; corpo que não é JSON (objeto sem `stringify`), `400` |
| `GET` / `PUT` / `PATCH` / `DELETE /filmes/:id` | `PUT` troca o recurso inteiro, `PATCH` junta os campos, `DELETE` responde `204`; id inexistente, `404` |
| `POST /login` | devolve um token |
| `GET /perfil` | `401` sem `Authorization: Bearer <token>`, `200` com |
| `GET /status/:codigo` | responde com o código pedido (200 a 599) |
| `GET /instavel` | sempre `500` |

Botões com `data-rede="offline"` rodam o mesmo código sem Internet (o `fetch` rejeita com
`TypeError: Failed to fetch`); `data-latencia="3000"` simula servidor lento.

Demonstrações próprias da revisão:

- **01 · cliente e servidor:** o pedido e a resposta HTTP em texto, com as quatro etapas acendendo.
  O primeiro pedido roda sozinho quando a seção aparece na tela.
- **05 · códigos de status:** qualquer código de 100 a 599, com faixa, significado, quem age e o
  valor de `resposta.ok`.
- **06 · HTTPS:** o mesmo pedido de login com e sem TLS. A cifra é real (AES-GCM de 256 bits da Web
  Crypto API, chave nova a cada carga). “alguém altera a mensagem” troca um caractere no HTTP (o
  servidor aceita sem perceber) e 1 bit no HTTPS (a verificação de integridade rejeita).
- **07 · página travada:** a consulta síncrona é uma espera ocupada de 2,5 s que congela a página
  inteira de propósito (relógio, bolinha e cliques param); a assíncrona usa `fetch` e não trava.
- **08 · Promise:** uma Promise de verdade; resolver e depois rejeitar mostra que a segunda chamada
  é ignorada.
- **18 · laboratório de `Intl.DateTimeFormat`:** locale, campos, `hour12` e `timeZone`, com o
  código gerado.

## Seções

| # | Seção | Origem |
|---|---|---|
| 01 | Cliente e servidor: um pedido, uma resposta | Web APIs e HTTP |
| 02 | HTTP não guarda estado | Web APIs e HTTP |
| 03 | Métodos: GET, POST, PUT, PATCH, DELETE | Web APIs e HTTP |
| 04 | GET leva os parâmetros na URL | Web APIs e HTTP · AJAX |
| 05 | Códigos de status | Web APIs e HTTP |
| 06 | HTTPS: o mesmo HTTP, dentro do TLS | novo |
| 07 | Síncrono x assíncrono | Fluxo assíncrono |
| 08 | Promise: três estados | Fluxo assíncrono · AJAX |
| 09 | `.then`, `.catch` e `.finally` | Fluxo assíncrono · AJAX |
| 10 | `async/await` | Fluxo assíncrono · AJAX |
| 11 | `try...catch` com `await` | try...catch · AJAX |
| 12 | `fetch`: a API nativa | AJAX e Intl |
| 13 | O primeiro `.then` recebe um `Response` | AJAX e Intl |
| 14 | `response.json()` | AJAX e Intl |
| 15 | 404 e 500 não caem no `catch` | AJAX e Intl |
| 16 | POST com JSON | AJAX e Intl |
| 17 | Da resposta para a tela (DOM) | AJAX e Intl |
| 18 | `Intl.DateTimeFormat`: locale e opções | AJAX e Intl |
| 19 | `timeZone` | AJAX e Intl |
| 20 | IIFE | novo |
| 21 | Escopo | novo |
| 22 | Módulos: export e import com chaves | novo (visto de passagem em AJAX e Intl) |
| 23 | `export default` | novo |

## Estrutura

```
revisao/
├── index.html      a aula inteira
├── css/
│   ├── estilo.css  identidade visual (paleta Descomplica + UniAmérica, a mesma das outras aulas)
│   ├── demos.css   console, painel de rede, telas, laboratórios (o mesmo da aula de AJAX e Intl)
│   └── revisao.css selo de origem, caminho cliente-servidor, status, HTTPS, página travada,
│                   estados da Promise, anatomia da IIFE, módulos e perguntas simuladas
├── js/
│   └── aula.js     realce de código, navegação, API de filmes simulada, motor de execução
│                   (normal, clássico e módulo), demonstrações, laboratório de datas,
│                   laboratório livre e perguntas simuladas
├── img/
│   └── logo.png
└── README.md
```

## Editando

- Console novo: um elemento com `data-exec` (e `data-codigo="id-do-pre"`, ou um `pre.codigo`
  dentro dele), `data-jeito="classico"` ou `"modulo"` se precisar, botões `data-chamada="..."`
  opcionais e um `div.console[data-console]` (`data-tempo` liga o carimbo de tempo).
- Módulo: cada arquivo importado é um `<pre class="codigo" data-arquivo="./nome.js">`, dentro do
  `data-exec` ou ligado por `data-arquivos="id1 id2"`.
- Pergunta nova no simulado: copie um `<article class="questao" data-questao data-correta="X">`.
  `data-correta` é a letra certa **na ordem em que as alternativas aparecem na página**.
- Rota nova na API: função `rotear()` em `js/aula.js`.
- No HTML fonte, todo `<` dentro de código precisa estar escrito como `&lt;`.

## Verificação feita

- Chrome em 1500 px e 375 px: sem transbordo horizontal, menu com os 16 itens sem corte, maior
  diferença de altura entre código e demonstração lado a lado de 183 px (as seções 03, 17, 22 e 23
  usam o layout empilhado).
- Todos os 44 consoles das seções conferidos com a saída esperada, inclusive os erros reais (`SyntaxError` da
  IIFE sem parênteses e dos imports errados, `ReferenceError`, corpo lido duas vezes, `Uncaught (in
  promise)`), os botões “sem Internet” e “servidor lento”, as duas telas com altura justa e o
  laboratório livre.
- Demonstrações: caminho cliente-servidor (200 e 404), status, HTTPS (cifra e rejeição por
  integridade), Promise (segunda chamada ignorada), laboratório de datas.
- Simulado: certa e errada marcadas, explicação aberta, placar, “tentar de novo” e “recomeçar”.
- Captura de cada seção com Chrome headless e perfil novo a cada captura, por `http://` e por
  `file://`; por `file://` os módulos ES também rodam.
- Nenhum erro no console da página.
