# Aula — Fluxo de desenvolvimento assíncrono em JavaScript

**Período e PM:** 2º período · PM 4 (Projeto Mensal)
**Material de origem:** `material/2o_periodo/pm4/fluxo-assincrono/`

- `Aula 1 — Introdução ao fluxo de execução assíncrono.pdf` (16 slides)
- `Aula 2 — Callbacks, iterators, promises e async await.pdf` (30 slides)

As duas aulas dos slides viraram uma página só: 23 seções numeradas (01–09 vêm da Aula 1, 10–23 da
Aula 2), um laboratório livre e uma referência rápida. **Esta aula não tem atividade final**: ela
foi retirada a pedido do professor (os slides propõem quatro atividades na Pokédex, que não estão na
página). Abre por
duplo clique no `index.html`, sem servidor e sem Internet (só a fonte dos títulos vem do Google
Fonts, com Arial Narrow de reserva). Não há seção “Materiais da Aula”: nenhum arquivo foi liberado
para download dos alunos.

## Como as demonstrações funcionam

Todo console da página é **execução real**: o código do painel ao lado roda num quadro invisível
(`iframe srcdoc`) e o `console.log`, o `console.warn`, o `console.error` e os erros não tratados
voltam para a página por `postMessage`. Nada é escrito à mão.

- **Tempo de cada linha** (`data-tempo`): o número à esquerda é medido dentro do próprio quadro,
  desde o início da execução. Por isso o `while` da seção 04 aparece em 1,0 s mesmo com a página
  inteira travada durante esse tempo.
- **Botões de chamada** (`mostrar(25)`, `buscarDois(1, 99)`…) rodam o código do painel mais aquela
  linha. A linha enviada aparece depois de `›`.
- **Sessões** (`data-sessao`, seções 13 e 14): o quadro continua vivo e cada clique em `it.next()`
  ou `g.next()` roda só aquela linha, como no console do F12. O valor devolvido aparece depois de
  `←`. O botão “recomeçar” cria o iterator de novo.
- **Módulos** (`data-modulo`, seções 20–22): o código roda em `<script type="module">`, onde
  `await` no topo é permitido, como nos slides.
- **Pokédex simulada** (`data-api`): antes do código, o quadro carrega `pokedex` e as funções
  `buscarPokemonCB`, `buscarPokemon`, `mostrarCarregando` e `esconderCarregando`. O texto vem dos
  próprios painéis da página (`#c-json`, `#c-cb`, `#c-promise`, `#c-carregando`): o que roda é o que
  está na tela.
- **fetch e localStorage**: por `file://` o `fetch` de verdade não lê arquivos locais. Dentro dos
  quadros, um servidor simulado responde a `pokedex.json` em 0,4 s (404 para outros nomes, falha de
  rede para endereços com `offline`), e o `localStorage` é trocado por um armazenamento em memória
  que começa vazio a cada execução, para o exemplo de cache dar o mesmo resultado sempre. A página
  avisa isso aos alunos nas seções 09 e 21.
- **Visualizador do Event Loop** (seções 06, 07 e 08): a cada “próximo passo” destaca a linha e
  mostra Call Stack, Web APIs, microtarefas e fila de tarefas. O console vem de uma execução real do
  mesmo código; os passos (objeto `LOOPS` em `js/aula.js`) só decidem quantas linhas já aparecem.
- **Previsão de ordem** (seções 06, 07 e 08): o aluno clica nas letras na ordem que imagina e
  “rodar e conferir” executa o código e marca cada posição certa ou errada.

## Seções

| # | Seção | Demonstração |
|---|---|---|
| 01 | Código síncrono | `prepararPedido` |
| 02 | O problema do bloqueio | relógio animado + contador: `while` de 3 s trava tudo, `setTimeout` não |
| 03 | Síncrono x assíncrono | analogia da lanchonete, tabela, resultado lido cedo demais (`undefined`) |
| 04 | Uma thread só | timer de 100 ms atrasado por um `while` de 1 s |
| 05 | Os bastidores | diagrama das quatro peças; Call Stack com funções aninhadas |
| 06 | Hora de prever | previsão A/B/C + visualizador passo a passo |
| 07 | Duas filas | previsão 1–4 + visualizador com microtarefas |
| 08 | Exercício rápido | previsão A–E + correção passo a passo |
| 09 | No dia a dia | `fetch`, `setInterval`, `addEventListener`, `localStorage` |
| 10 | Dados da Pokédex | `pokedex.json` e funções de carregando |
| 11 | Callbacks | `buscarPokemonCB` com 25 e 99 |
| 12 | Callback hell | time de três em 3 s, erro tratado em cada nível |
| 13 | Iterators | `it.next()` em sessão; `for…of`; objeto não iterável |
| 14 | Geradores | `porTipo` em sessão; `yield` pausando; métodos de iterator (ES2025) |
| 15 | Promises: estados | tela com pending/fulfilled/rejected; `resolve` duas vezes |
| 16 | Busca com promise | `.then/.catch`; promise rejeitada sem catch |
| 17 | Encadear | `.then/.catch/.finally`; `return` esquecido; `.then` aninhado |
| 18 | Combinar | `all`, `allSettled`, `race`, `any` |
| 19 | async / await | `try/catch/finally`; pausa a função; sempre promise; `await` esquecido; `await` fora de `async` |
| 20 | Três estilos | a mesma busca com callback, promise e async |
| 21 | fetch e cache | `carregarPokedex` (rede e cache); 404 não rejeita; sem rede rejeita |
| 22 | Sequência x paralelo | 3 s x 1 s; `await` dentro de `forEach` |
| 23 | Limite de tempo | `Promise.race` com `tempoLimite` |

## O que foi corrigido ou atualizado em relação ao material

- **Período e PM**: os slides trazem “PM02” na capa; a aula foi registrada no **PM 4** do 2º
  período, como pedido.
- **Callback hell (Aula 2, slide 8)**: o código do slide testa `if (e1 || e2 || e3)` só no nível
  mais fundo, embora o texto diga que o tratamento se repete em cada nível. Com o teste só no fim,
  uma falha na primeira busca não interrompe as outras e o erro some sem mensagem. A seção 12 mostra
  o teste em cada nível e um cartão explica a armadilha.
- **Dados da Pokédex**: os slides mostram 4 Pokémon. A aula usa os mesmos 4 e mais 6 (Vulpix,
  Oddish, Psyduck, Growlithe, Voltorb, Eevee), para o gerador por tipo e o botão Próximo terem mais
  de um resultado. Com isso `porTipo(pokedex, "fogo")` devolve três Pokémon, não um como no slide 11.
- **“Macrotarefas”**: a especificação do HTML chama só de *tasks*; o cartão da seção 07 registra que
  “macrotarefa” é apelido.
- **Atualizações**: métodos de iterator (`.values().filter().map().take()`, ES2025, Baseline desde
  2025) na seção 14; `AbortSignal.timeout()` como forma de cancelar um `fetch` de verdade na seção 23
  (o `Promise.race` dos slides não cancela nada).
- **Acrescentado**: `fetch` só rejeita sem rede (404 chega como resposta), `await` dentro de
  `forEach`, `return` esquecido no `.then`, timer de 0 ms com mínimo de 4 ms em timers aninhados,
  microtarefa sem fim travando a tela, Web Workers para cálculo pesado.
- **Atividade**: as quatro atividades dos slides (Aula 2, slides 22 a 29) não entram na página. O
  desafio extra do `Promise.race` (slide 28) continua como conteúdo, na seção 23.

## Estrutura

```
fluxo-assincrono/
├── index.html      a aula inteira
├── css/
│   ├── estilo.css  identidade visual (paleta Descomplica + UniAmérica, a mesma do PM 2 e do PM 3)
│   └── demos.css   console com tempo, visualizador do Event Loop, previsão, laboratório
├── js/
│   └── aula.js     realce de código, navegação, motor de execução em quadros, consoles e sessões,
│                   visualizador, previsão, laboratório livre
├── img/
│   └── logo.png
└── README.md
```

## Editando

- Passos do visualizador: objeto `LOOPS` em `js/aula.js`. `l` é a linha destacada, `s` quantas
  linhas da saída real já aparecem, `pilha`/`web`/`micro`/`macro` o conteúdo de cada peça e `laco` o
  texto do Event Loop. Se mudar o código de um desses painéis, confira os passos.
- Para um console novo: um elemento com `data-exec` (e `data-codigo="id-do-pre"`, ou um `pre.codigo`
  dentro dele), botões `data-chamada="..."` opcionais, um `div.console[data-console]` e, se precisar,
  `data-api`, `data-tempo`, `data-sessao` ou `data-modulo`.
- Mudar os dados da Pokédex: edite o painel `pokedex.json` da seção 10; todos os exemplos, o
  `fetch` simulado leem dali.
- No HTML fonte, todo `<` dentro de código precisa estar escrito como `&lt;`.

## Atribuição

Baseada nos slides *Aula 1 — Introdução ao fluxo de execução assíncrono* e *Aula 2 — Callbacks,
iterators, promises e async/await* (Métodos Ágeis, Protótipos de Alta Fidelidade e Telas
Funcionais). Os exemplos foram reescritos e ampliados; o crédito aparece no rodapé. Pokémon e os
nomes dos personagens são marcas da Nintendo, Game Freak e Creatures, usados como exemplo de dados.

## Verificação feita

- Chrome em 1500 px e 375 px: sem transbordo horizontal, sem erros no console do navegador, menu com
  os 15 itens sem corte, nenhuma diferença acima de 250 px entre código e demonstração lado a lado.
- Os 44 consoles conferidos com a saída esperada, incluindo os tempos (3,0 s em sequência, 1,0 s em
  paralelo, 0,5 s no limite de tempo). Os três visualizadores do Event Loop percorridos até o fim
  (A, C, B · 1, 4, 3, 2 · A, E, D, C, B), as três previsões e as três sessões exercitadas.
- Captura de cada seção com Chrome headless e perfil novo a cada captura.
- Abertura por `file://`: consoles, quadros com tela e módulos funcionam.
