# Aula — Tratamento de erros com try...catch em JavaScript

**Período e PM:** 2º período · PM 3 (Projeto Mensal)
**Material de origem:** `material/2o_periodo/pm3/try-catch/`

- `Tratamento_de_Erros_com_try...catch_em_JavaScript.pdf` (12 slides, Prof. Riad Younes)

Página única para projetar e rolar durante a aula: 16 seções numeradas, um laboratório livre, uma
referência rápida e a atividade final em três partes. Abre por duplo clique no `index.html`, sem
servidor e sem Internet (só a fonte dos títulos vem do Google Fonts, com Arial Narrow de reserva).

## Como as demonstrações funcionam

Todo console da página é **execução real**: o código do painel ao lado roda num quadro invisível
(`iframe srcdoc`) e o `console.log`, o `console.warn`, o `console.error` e os erros não tratados
voltam para a página por `postMessage`. Nada é escrito à mão.

- **Botões de chamada** (`dividir(10, 0)`, `testar(NaN)`...) rodam o código do painel mais aquela
  linha. A linha enviada aparece no console depois do sinal `›`.
- **Erros não tratados** aparecem como `Uncaught ...` em vermelho forte, como no F12. O console
  real do navegador continua limpo: o quadro cancela o relatório padrão.
- **Passo a passo** (seções 03, 04 e 09): destaca a linha que está rodando, risca no fim as linhas
  que nunca rodaram e mostra os blocos `try`, `catch` e `finally` com tracejados verde, vermelho e
  roxo. As linhas do console vêm de uma execução real do mesmo código; os passos só decidem quantas
  já aparecem.
- **Seção 14**: o HTML do painel roda num quadro visível; o aluno digita a nota e clica.
- As **mensagens de erro são as do navegador** em uso. No Chrome, no Firefox e no Safari o texto
  muda; o tipo (`TypeError`, `SyntaxError`) é o mesmo.
- O **resultado esperado da atividade** usa uma implementação de referência escondida em
  `js/aula.js` (`calcularMediaRef` e a simulação de `carregarUsuarios`). A página mostra só o
  comportamento, não o código da solução.

## Seções

| # | Seção | Demonstração |
|---|---|---|
| 01 | Erros: o inesperado acontece | JSON com erro de digitação para o script; `Infinity`, `NaN` e `undefined` não lançam erro |
| 02 | Tipos de erro | um console por tipo; `SyntaxError` no próprio código não chega ao `catch` |
| 03 | Sem try...catch | passo a passo do script que para na linha do erro |
| 04 | try...catch: sintaxe e fluxo | passo a passo com JSON válido e inválido (as três regras do fluxo) |
| 05 | Bloco try | erro dentro do try; `let` dentro do bloco some depois dele |
| 06 | Bloco catch e o objeto error | `name`, `message` e `stack` com números de linha; `catch` sem parâmetro; fallback |
| 07 | throw | dividir por zero com e sem `throw`; `TypeError` e `RangeError`; `throw` de texto |
| 08 | finally | sem erro, com erro, `try...finally` sem catch, `return` no finally |
| 09 | Exemplo completo | passo a passo de `dividir(10, 2)` e `dividir(10, 0)` |
| 10 | Um tratamento por tipo | `instanceof` e relançar com `throw error` |
| 11 | Erros personalizados | `class ValidacaoError extends Error`; `{ cause }` |
| 12 | Erros assíncronos | `setTimeout` escapa do try; promessa sem `await`; `async/await`; `.catch()` |
| 13 | Não silencie, seja específico | `catch` vazio x que registra; `try` gigante x específico |
| 14 | Feedback amigável | formulário de nota com mensagem para quem usa e erro técnico no console |
| 15 | Registro e monitoramento | ouvintes de `error` e `unhandledrejection` |
| 16 | Validando entradas | `typeof NaN`; `Number.isFinite`; `validarIdade` |

## O que foi corrigido ou atualizado em relação ao material

**A página não cita o material de origem**, como na aula de HTTP deste PM: os alunos não recebem os
slides. Cada ponto abaixo aparece na aula como armadilha ou como cartão de destaque, escrito para se
sustentar sozinho. A única exceção é a linha discreta de créditos no rodapé (`.rodape-creditos`).

- **Ordem da saída de `dividir`**: o slide mostra `5` antes de “Operação finalizada.” (e `null`
  antes dela no segundo caso). A ordem real é a inversa: o `finally` roda antes de a função
  devolver o valor. A seção 09 mostra a execução real e um cartão explica a armadilha.
- **SyntaxError** aparece como erro comum sem ressalva. Um `SyntaxError` no próprio código impede
  o script de começar e nenhum `catch` o pega; só o de execução (`JSON.parse`) é capturável.
  Demonstrado na seção 02.
- **finally e “liberação de memória”**: JavaScript tem coletor de lixo; o `finally` fecha recursos
  que você abriu (conexão, arquivo, indicador de carregando). Cartão na seção 08.
- **Ferramentas de monitoramento**: o slide cita Sentry, Amplitude e New Relic. Amplitude é uma
  ferramenta de análise de uso de produto, não de monitoramento de erros; a aula cita Sentry,
  New Relic e Datadog.
- **Atividade individual**: a dica `typeof nota !== 'number'` deixa passar `NaN` e `Infinity`. A
  Parte 1 mantém a dica; a Parte 2 (desafio) exige recusar os dois, e a seção 16 mostra o porquê.
- **Acrescentado** (o slide final lista erros assíncronos e erros personalizados como próximos
  passos): `catch` sem parâmetro (ES2019), `instanceof` e relançar, `class ... extends Error`,
  `{ cause }` (ES2022), `async/await`, `.catch()`, `fetch` que não lança em 404, ouvintes globais
  de erro, dados pessoais em registros (LGPD), escopo de `let` dentro do `try` e `return` dentro
  do `finally`.

## Estrutura

```
try-catch/
├── index.html      a aula inteira
├── css/
│   ├── estilo.css  identidade visual (paleta Descomplica + UniAmérica, a mesma do PM 2 e do PM 3)
│   └── demos.css   console ao vivo, passo a passo, blocos try/catch/finally, laboratório, atividade
├── js/
│   └── aula.js     realce de código (JS e HTML), navegação, motor de execução em quadros,
│                   consoles e chamadas, passo a passo, laboratório livre, resultado esperado
├── img/
│   └── logo.png
└── README.md
```

## Editando

- Os passos das seções 03, 04 e 09 ficam no objeto `PASSOS` em `js/aula.js`: `l` é a linha a
  destacar, `s` quantas linhas da saída real já aparecem e `puladas` as linhas riscadas no fim. Se
  mudar o código de um desses painéis, confira os números.
- Para um console novo: um elemento com `data-exec` (e `data-codigo="id-do-pre"`, ou um
  `pre.codigo` dentro dele), botões `data-chamada="..."` opcionais e um `div.console[data-console]`.
- No HTML fonte, todo `<` dentro de código precisa estar escrito como `&lt;`.
- A assinatura da capa não tem nome de professor. Para incluir, edite `.assinatura` em `index.html`.

## Atribuição

Baseada nos slides *Tratamento de Erros com try...catch em JavaScript*, de Riad Younes. Os
exemplos foram reescritos e ampliados; o crédito aparece no rodapé da página.

## Verificação feita

- Chrome em 1500 px e 375 px: sem transbordo horizontal, sem erros no console do navegador, menu
  com os 16 itens sem corte, nenhuma área vazia acima de 250 px entre código e demonstração.
- Todos os consoles, todas as chamadas, os cinco cenários de passo a passo (comparados com a
  execução real), o formulário da seção 14 e o laboratório livre exercitados.
- Captura de cada seção com Chrome headless e perfil novo a cada captura.
- Abertura por `file://`: todos os consoles e o quadro da seção 14 funcionam.
