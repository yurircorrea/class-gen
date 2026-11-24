/* =========================================================
   Aula: Fluxo de desenvolvimento assíncrono em JavaScript
   aula.js - motor da aula em página única
   1. Colorização dos blocos de código (JS e HTML)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Motor de execução: roda o código de um painel num quadro
      isolado e traz o console de volta para a página
   4. Consoles ao vivo, chamadas e sessões
   5. Visualizador do Event Loop (passo a passo)
   6. Previsão da ordem de saída
   7. Laboratório livre

   JavaScript puro, sem dependência, sem Internet.
   Funciona por file:// (os quadros conversam por postMessage).
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. COLORIZAÇÃO DE CÓDIGO

     Linha a linha. O conteúdo é lido de pre.textContent:
     no HTML fonte todo "<" precisa estar escapado como &lt;.
     data-lang: js ou html (padrão).
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* HTML: <tag atributo="valor"> */
  function hlHtml(linha) {
    var re = /(<\/?)([a-zA-Z][-\w]*)|([-\w:@.]+)(=)("[^"]*"|'[^']*')/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) out += span("tk-tag", m[1] + m[2]);
      else out += span("tk-attr", m[3]) + esc(m[4]) + span("tk-str", m[5]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* JavaScript: textos, palavras-chave, objetos nativos e números */
  var RE_JS = new RegExp(
    "(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)" +
    "|\\b(let|const|var|for|of|in|new|function\\*?|return|if|else|async|await|try|catch|finally|throw|" +
    "while|break|yield|class|this|typeof|instanceof|true|false|null|undefined)\\b" +
    "|\\b((?:[A-Z]\\w*)?Error|Promise|JSON|Number|Symbol|Date|Math|AbortSignal|localStorage|document|console)\\b" +
    "|(\\b\\d+(?:\\.\\d+)?\\b)", "g");

  function hlJs(linha) {
    var out = "", ultimo = 0, m;
    RE_JS.lastIndex = 0;
    while ((m = RE_JS.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-val", m[2]);
      else if (m[3]) out += span("tk-tag", m[3]);
      else out += span("tk-num", m[4]);
      ultimo = RE_JS.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* posição do // que começa um comentário (ignora // dentro de textos) */
  function inicioComentarioJs(linha) {
    var aspas = "";
    for (var i = 0; i < linha.length; i++) {
      var c = linha.charAt(i);
      if (aspas) {
        if (c === "\\") { i++; continue; }
        if (c === aspas) aspas = "";
      } else if (c === '"' || c === "'" || c === "`") {
        aspas = c;
      } else if (c === "/" && linha.charAt(i + 1) === "/") {
        return i;
      }
    }
    return -1;
  }

  function hlLinha(linha, lang) {
    if (lang === "js") {
      var iJ = inicioComentarioJs(linha);
      if (iJ !== -1) return hlJs(linha.slice(0, iJ)) + span("tk-com", linha.slice(iJ));
      return hlJs(linha);
    }
    var iH = linha.indexOf("<!--");
    if (iH !== -1) return hlLinha(linha.slice(0, iH), lang) + span("tk-com", linha.slice(iH));
    return hlHtml(linha);
  }

  /* guarda o texto original em pre.fonte: é ele que o motor executa */
  function colorir(pre) {
    var lang = pre.getAttribute("data-lang") || "html";
    var fonte = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    pre.fonte = fonte;
    var html = fonte.split("\n").map(function (l) { return hlLinha(l, lang); });
    if (pre.classList.contains("codigo--numeros")) {
      pre.innerHTML = html.map(function (h) { return '<span class="ln">' + h + "</span>"; }).join("");
    } else {
      pre.innerHTML = html.join("\n");
    }
  }

  function fonteDe(pre) { return pre ? (pre.fonte !== undefined ? pre.fonte : pre.textContent) : ""; }

  document.querySelectorAll("pre.codigo").forEach(colorir);

  /* ======================================================
     2. NAVEGAÇÃO
     ====================================================== */

  var progresso = document.querySelector(".progresso");
  var botaoTopo = document.querySelector(".voltar-topo");
  var links = Array.prototype.slice.call(document.querySelectorAll(".barra-menu a"));
  var alvos = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function aoRolar() {
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    var pct = altura > 0 ? (window.scrollY / altura) * 100 : 0;
    if (progresso) progresso.style.width = pct + "%";
    if (botaoTopo) botaoTopo.classList.toggle("visivel", window.scrollY > 600);

    var atual = -1;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i].getBoundingClientRect().top <= 140) atual = i;
    }
    links.forEach(function (a, i) { a.classList.toggle("ativo", i === atual); });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();

  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ======================================================
     3. MOTOR DE EXECUÇÃO

     Cada execução cria um quadro (iframe srcdoc) com:
       <script>preparação</script>
       <script>api.js da Pokédex</script>      (com data-api)
       <script>código do painel</script>

     No quadro, console.log/warn/error e os erros não tratados
     (evento "error" e "unhandledrejection") viram mensagens para
     a página. O console real (F12) fica limpo.

     A preparação também troca, só dentro do quadro:
     - fetch: um servidor simulado responde a "pokedex.json" em
       0,4 s (por file:// o fetch de verdade não lê arquivos);
     - localStorage: um armazenamento em memória que começa vazio
       a cada execução, para o exemplo de cache ser repetível.

     Em uma sessão (data-sessao) o quadro continua vivo e cada
     botão envia uma linha para rodar nele, como no console do F12.
     ====================================================== */

  /* Esta função é convertida em texto e roda DENTRO do quadro.
     Regras: sem comentários de linha, ponto e vírgula sempre. */
  function prepararQuadro(ID, TELA, SESSAO, DADOS) {
    var P = window.parent;
    function enviar(d) { d.tipo = "console-exec"; d.id = ID; d.t = performance.now(); P.postMessage(d, "*"); }
    enviar({ nivel: "inicio" });
    function f(v, d) {
      d = d || 0;
      if (typeof v === "string") return d ? "'" + v + "'" : v;
      if (v === null) return "null";
      if (v === undefined) return "undefined";
      if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
      if (typeof v === "boolean" || typeof v === "bigint") return String(v);
      if (typeof v === "symbol") return v.toString();
      if (typeof v === "function") return "ƒ " + (v.name || "anônima") + "()";
      if (v instanceof Error) return (v.name || "Error") + ": " + v.message;
      var tag = Object.prototype.toString.call(v).slice(8, -1);
      if (!Array.isArray(v) && tag !== "Object") return tag + " {…}";
      if (d > 3) return Array.isArray(v) ? "[…]" : "{…}";
      if (Array.isArray(v)) return "[" + v.map(function (x) { return f(x, d + 1); }).join(", ") + "]";
      var chaves = Object.keys(v);
      if (!chaves.length) return "{}";
      return "{ " + chaves.map(function (k) { return k + ": " + f(v[k], d + 1); }).join(", ") + " }";
    }
    function texto(e) {
      if (e !== null && typeof e === "object" && "message" in e) return (e.name || "Error") + ": " + e.message;
      return f(e, 0);
    }
    function saida(nivel, args) {
      enviar({ nivel: nivel, texto: Array.prototype.map.call(args, function (v) { return f(v, 0); }).join(" ") });
    }
    console.log = function () { saida("log", arguments); };
    console.info = console.log;
    console.debug = console.log;
    console.warn = function () { saida("warn", arguments); };
    console.error = function () { saida("error", arguments); };
    function vigiar(tipo, prefixo, motivo) {
      window.addEventListener(tipo, function (ev) {
        var tratado = false, pd = ev.preventDefault;
        ev.preventDefault = function () { tratado = true; pd.call(ev); };
        pd.call(ev);
        var t = motivo(ev);
        setTimeout(function () { if (!tratado) enviar({ nivel: "uncaught", texto: prefixo + t }); }, 0);
      });
    }
    vigiar("error", "Uncaught ", function (ev) {
      if (ev.error !== undefined && ev.error !== null) return texto(ev.error);
      return String(ev.message).replace(/^Uncaught /, "");
    });
    vigiar("unhandledrejection", "Uncaught (in promise) ", function (ev) { return texto(ev.reason); });
    window.fetch = function (url) {
      return new Promise(function (ok, falha) {
        setTimeout(function () {
          var u = String(url);
          if (/offline/.test(u)) { falha(new TypeError("Failed to fetch")); return; }
          if (/pokedex\.json$/.test(u)) { ok(new Response(DADOS, { status: 200, headers: { "Content-Type": "application/json" } })); return; }
          ok(new Response("Not Found", { status: 404, statusText: "Not Found" }));
        }, 400);
      });
    };
    var mem = {};
    var armazenamento = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; },
      key: function (i) { return Object.keys(mem)[i] || null; }
    };
    Object.defineProperty(armazenamento, "length", { get: function () { return Object.keys(mem).length; } });
    try { Object.defineProperty(window, "localStorage", { value: armazenamento, configurable: true }); } catch (e) { /* fica o localStorage do navegador */ }
    if (SESSAO) {
      window.addEventListener("message", function (ev) {
        if (!ev.data || ev.data.tipo !== "sessao") return;
        var r;
        try { r = (0, eval)(ev.data.codigo); } catch (e) { enviar({ nivel: "uncaught", texto: "Uncaught " + texto(e) }); return; }
        if (r !== undefined) enviar({ nivel: "ret", texto: f(r, 1) });
      });
    }
    if (TELA) {
      var medir = function () { enviar({ nivel: "altura", altura: Math.ceil(document.body.getBoundingClientRect().height) + 2 }); };
      window.addEventListener("load", medir);
      new ResizeObserver(medir).observe(document.body);
    }
  }

  var PREPARO = "(" + prepararQuadro.toString().replace(/\s*\n\s*/g, " ") + ")";

  /* pokedex.json e api.js: lidos dos próprios painéis da aula, para
     que o que roda seja exatamente o que está na tela */
  var JSON_POKEDEX = fonteDe(document.getElementById("c-json"));
  var API = null;
  function api() {
    if (API === null) {
      API = "const pokedex = " + JSON_POKEDEX + ";\n" +
        fonteDe(document.getElementById("c-cb")) + "\n" +
        fonteDe(document.getElementById("c-promise")) + "\n" +
        fonteDe(document.getElementById("c-carregando")) + "\n";
    }
    return API;
  }

  var ESTILO_TELA =
    "body{margin:0;padding:18px 20px;font:18px/1.45 Arial,Helvetica,sans-serif;color:#000;background:#fff}" +
    "button{font:700 16px ui-monospace,Consolas,monospace;padding:9px 16px;border-radius:8px;border:2px solid #0A2A1E;background:#00E88F;cursor:pointer;margin:0 8px 8px 0}" +
    "button.sec{background:#fff}" +
    "p{margin:12px 0 0;min-height:1.45em}" +
    ".relogio{font:700 44px ui-monospace,Consolas,monospace;letter-spacing:1px}" +
    ".trilho{height:14px;border-radius:7px;background:#EEF1EF;overflow:hidden;margin-top:10px}" +
    ".bola{height:100%;width:22%;border-radius:7px;background:#00E88F}" +
    ".estado{display:inline-block;font:700 18px ui-monospace,Consolas,monospace;padding:4px 14px;border-radius:999px;border:2px solid #98A2A9;color:#5B6660}" +
    ".estado.pending{border-color:#C99A00;background:#FFF7DB;color:#6B5200}" +
    ".estado.fulfilled{border-color:#0E7A4B;background:#00E88F;color:#000}" +
    ".estado.rejected{border-color:#D9483B;background:#FFF3F1;color:#8C2F1F}" +
    ".mono{font-family:ui-monospace,Consolas,monospace}";

  var execucoes = {};
  var contador = 0;

  /* codigo: texto a rodar. op: { linha(nivel, texto), fim(), tela, html, api, sessao } */
  function executar(codigo, op) {
    var id = "x" + (++contador);
    var quadro = document.createElement("iframe");
    quadro.tabIndex = -1;
    if (op.tela) {
      quadro.title = "Resultado da demonstração";
      op.tela.innerHTML = "";
      op.tela.appendChild(quadro);
    } else {
      quadro.className = "caixa-de-areia";
      quadro.title = "Execução do exemplo";
      quadro.setAttribute("aria-hidden", "true");
      document.body.appendChild(quadro);
    }
    var preparo = "<script>" + PREPARO + "(" + JSON.stringify(id) + "," + (op.tela ? "true" : "false") + "," +
      (op.sessao ? "true" : "false") + "," + JSON.stringify(JSON_POKEDEX).replace(/<\//g, "<\\/") + ");<\/script>";
    var prelude = op.api ? "<script>" + api().replace(/<\/script/gi, "<\\/script") + "<\/script>" : "";
    var codigoSeguro = codigo.replace(/<\/script/gi, "<\\/script");
    /* data-modulo: o painel roda como módulo, onde await no topo é permitido */
    var abre = op.modulo ? '<script type="module">' : "<script>";
    var fim = abre + "setTimeout(function(){parent.postMessage({tipo:'console-exec',id:'" + id + "',nivel:'fim'},'*');},0);<\/script>";
    quadro.srcdoc = op.tela
      ? '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>' + ESTILO_TELA + "</style></head><body>" +
        op.html + preparo + prelude + abre + codigoSeguro + "\n<\/script>" + fim + "</body></html>"
      : "<!doctype html>" + preparo + prelude + abre + codigoSeguro + "\n<\/script>" + fim;
    execucoes[id] = { op: op, quadro: quadro };
    return {
      parar: function () {
        delete execucoes[id];
        if (!op.tela) quadro.remove();
      },
      enviar: function (linha) {
        if (quadro.contentWindow) quadro.contentWindow.postMessage({ tipo: "sessao", codigo: linha }, "*");
      }
    };
  }

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || d.tipo !== "console-exec") return;
    var x = execucoes[d.id];
    if (!x || ev.source !== x.quadro.contentWindow) return;
    if (d.nivel === "altura") { x.quadro.style.height = Math.max(60, d.altura) + "px"; return; }
    if (d.nivel === "fim") { if (x.op.fim) x.op.fim(); return; }
    /* o relógio do console começa quando o código começa a rodar, não quando o quadro foi criado */
    if (d.nivel === "inicio") { x.t0 = d.t; if (x.op.inicio) x.op.inicio(); return; }
    /* o tempo é carimbado dentro do quadro: se a thread estava ocupada, a mensagem
       chega atrasada, mas o carimbo mostra quando a linha realmente rodou */
    if (x.op.linha) x.op.linha(d.nivel, d.texto, x.t0 !== undefined ? d.t - x.t0 : undefined);
  });

  /* ======================================================
     4. CONSOLES AO VIVO, CHAMADAS E SESSÕES

     <div data-exec data-codigo="id-do-pre" [data-api] [data-tempo] [data-sessao]>
       <button data-chamada="buscar(25);"></button>   (opcional)
       <div class="console" data-console></div>
     </div>
     Sem data-codigo, usa o primeiro pre.codigo de dentro.
     data-api   carrega pokedex e api.js antes do código
     data-tempo mostra, em cada linha, o tempo desde o início
     Normal: cada chamada roda o código do painel + aquela linha.
     Sessão: o código roda uma vez; cada chamada roda só a linha,
     no mesmo quadro (o estado continua de um clique para o outro).
     ====================================================== */

  function criarConsole(el, tempo) {
    /* demonstração só com tela, sem console: um console invisível */
    if (!el) el = document.createElement("div");
    var vazio = el.getAttribute("data-vazio") || "(nada foi escrito no console)";
    var linhas = 0, marca = null, t0 = performance.now();
    function add(nivel, texto, comTempo, ms) {
      var d = document.createElement("div");
      d.className = "cl cl--" + nivel;
      if (comTempo) {
        var t = document.createElement("span");
        t.className = "cl-t";
        if (ms === undefined) ms = performance.now() - t0;
        t.textContent = (Math.max(0, ms) / 1000).toFixed(1).replace(".", ",") + " s";
        d.appendChild(t);
      }
      d.appendChild(document.createTextNode(texto));
      el.appendChild(d);
      return d;
    }
    return {
      limpar: function () { el.innerHTML = ""; linhas = 0; marca = null; t0 = performance.now(); },
      zerarTempo: function () { t0 = performance.now(); },
      eco: function (t) { add("eco", t, false); },
      linha: function (nivel, texto, ms) {
        if (marca) { marca.remove(); marca = null; }
        linhas++;
        add(nivel, texto, tempo && nivel !== "ret", ms);
      },
      fim: function () { if (!linhas && !marca) marca = add("vazio", vazio, false); }
    };
  }

  document.querySelectorAll("[data-exec]").forEach(function (el) {
    var idCodigo = el.getAttribute("data-codigo");
    var pre = idCodigo ? document.getElementById(idCodigo) : el.querySelector("pre.codigo");
    var preHtml = el.getAttribute("data-html") ? document.getElementById(el.getAttribute("data-html")) : null;
    var tela = el.querySelector("[data-tela]");
    var sessao = el.hasAttribute("data-sessao");
    var cons = criarConsole(el.querySelector("[data-console]"), el.hasAttribute("data-tempo"));
    var botoes = Array.prototype.slice.call(el.querySelectorAll("[data-chamada]"));
    var atual = null;

    function rodar(chamada) {
      if (atual) atual.parar();
      cons.limpar();
      if (chamada) cons.eco(chamada);
      var codigo = fonteDe(pre) + (chamada ? "\n" + chamada : "");
      atual = executar(codigo, {
        linha: cons.linha, fim: cons.fim, inicio: cons.zerarTempo,
        tela: tela, html: preHtml ? fonteDe(preHtml) : "",
        api: el.hasAttribute("data-api"), sessao: sessao, modulo: el.hasAttribute("data-modulo")
      });
    }

    botoes.forEach(function (b) {
      if (!b.textContent.trim()) b.textContent = b.getAttribute("data-chamada");
      b.classList.add("chamada");
      b.type = "button";
      b.addEventListener("click", function () {
        if (sessao) {
          cons.eco(b.getAttribute("data-chamada"));
          atual.enviar(b.getAttribute("data-chamada"));
          return;
        }
        botoes.forEach(function (o) { o.classList.toggle("ativa", o === b); });
        rodar(b.getAttribute("data-chamada"));
      });
    });

    var rodarDeNovo = el.querySelector("[data-rodar]");
    if (rodarDeNovo) rodarDeNovo.addEventListener("click", function () {
      var ativo = botoes.filter(function (b) { return b.classList.contains("ativa"); })[0];
      rodar(ativo && !sessao ? ativo.getAttribute("data-chamada") : "");
    });

    if (botoes.length && !sessao) { botoes[0].classList.add("ativa"); rodar(botoes[0].getAttribute("data-chamada")); }
    else rodar("");
  });

  /* ======================================================
     5. VISUALIZADOR DO EVENT LOOP

     A saída do console vem de uma execução REAL do código do
     painel; cada passo decide quantas linhas dessa saída já
     apareceram (s), qual linha destacar (l) e o que há em cada
     peça: pilha (de baixo para cima), web, micro, macro.
     laco: texto do Event Loop quando ele age naquele passo.
     ====================================================== */

  var LOOPS = {
    "abc": [
      { l: 1, pilha: ["(script)", 'console.log("A")'], s: 1,
        n: "O script começa na Call Stack. <code>console.log(\"A\")</code> é síncrono: entra na pilha, escreve e sai." },
      { l: 2, pilha: ["(script)", "setTimeout(…, 0)"], web: ["timer de 0 ms › callback B"],
        n: "<code>setTimeout</code> não espera nada: entrega o timer ao navegador (Web APIs) e sai da pilha na hora." },
      { l: 5, pilha: ["(script)", 'console.log("C")'], macro: ["callback B"], s: 2,
        n: "O timer de 0 ms já venceu e o callback B foi para a <b>fila de tarefas</b>. Mas a pilha está ocupada com o script: B espera." },
      { pilha: [], macro: ["callback B"], laco: "a pilha está <b>vazia</b>: o Event Loop olha a fila",
        n: "O script terminou e a pilha esvaziou. Só agora o Event Loop pode agir." },
      { l: 3, pilha: ["callback B", 'console.log("B")'], s: 3, laco: "levou o callback B da fila para a pilha",
        n: "O Event Loop leva o callback B para a pilha, e “B” aparece por último." },
      { pilha: [], n: "Fim: A, C, B. <code>setTimeout(…, 0)</code> quer dizer “assim que a pilha estiver livre”, não “agora”." }
    ],
    "filas": [
      { l: 1, pilha: ["(script)", 'console.log("1")'], s: 1, n: "Linha síncrona: escreve “1” na hora." },
      { l: 2, pilha: ["(script)", "setTimeout(…, 0)"], web: ["timer de 0 ms › log 2"],
        n: "O timer vai para as Web APIs. Quando vencer, o callback entra na fila de <b>tarefas</b> (macrotarefas)." },
      { l: 3, pilha: ["(script)", "Promise.resolve().then(…)"], micro: ["() › log 3"], macro: ["() › log 2"],
        n: "A promise já está resolvida: o callback do <code>.then</code> vai direto para a fila de <b>microtarefas</b>. O timer venceu e o 2 está na fila de tarefas." },
      { l: 4, pilha: ["(script)", 'console.log("4")'], micro: ["() › log 3"], macro: ["() › log 2"], s: 2,
        n: "Linha síncrona: escreve “4”. As duas filas continuam esperando a pilha esvaziar." },
      { pilha: [], micro: ["() › log 3"], macro: ["() › log 2"], laco: "pilha vazia: primeiro <b>todas</b> as microtarefas",
        n: "Com a pilha vazia, o Event Loop esvazia a fila de microtarefas inteira antes de olhar a de tarefas." },
      { l: 3, pilha: ["() › log 3", 'console.log("3")'], macro: ["() › log 2"], s: 3, laco: "levou a microtarefa para a pilha",
        n: "A microtarefa roda: “3”." },
      { l: 2, pilha: ["() › log 2", 'console.log("2")'], s: 4, laco: "microtarefas vazias: agora uma tarefa",
        n: "Só com as microtarefas zeradas a tarefa do timer roda: “2”." },
      { pilha: [], n: "Fim: 1, 4, 3, 2. Promise passa na frente do timer, mesmo o timer tendo sido criado antes." }
    ],
    "exercicio": [
      { l: 1, pilha: ["(script)", 'console.log("A")'], s: 1, n: "Síncrona: “A”." },
      { l: 2, pilha: ["(script)", "setTimeout(…, 100)"], web: ["timer de 100 ms › log B"], n: "Timer de 100 ms entregue ao navegador." },
      { l: 3, pilha: ["(script)", "setTimeout(…, 0)"], web: ["timer de 100 ms › log B", "timer de 0 ms › log C"], n: "Timer de 0 ms entregue ao navegador." },
      { l: 4, pilha: ["(script)", "Promise.resolve().then(…)"], web: ["timer de 100 ms › log B"], micro: ["() › log D"], macro: ["() › log C"],
        n: "O <code>.then</code> vai para as microtarefas. O timer de 0 ms venceu: C está na fila de tarefas. O de 100 ms continua contando." },
      { l: 5, pilha: ["(script)", 'console.log("E")'], web: ["timer de 100 ms › log B"], micro: ["() › log D"], macro: ["() › log C"], s: 2,
        n: "Síncrona: “E”. Acabaram as linhas síncronas: A, E." },
      { l: 4, pilha: ["() › log D", 'console.log("D")'], web: ["timer de 100 ms › log B"], macro: ["() › log C"], s: 3,
        laco: "pilha vazia: primeiro as microtarefas", n: "Microtarefa: “D”." },
      { l: 3, pilha: ["() › log C", 'console.log("C")'], web: ["timer de 100 ms › log B"], s: 4,
        laco: "microtarefas vazias: uma tarefa", n: "Tarefa do timer de 0 ms: “C”." },
      { pilha: [], web: ["timer de 100 ms › log B"], laco: "filas vazias: o Event Loop <b>espera</b>",
        n: "Nada para rodar. O Event Loop fica esperando o timer de 100 ms vencer." },
      { l: 2, pilha: ["() › log B", 'console.log("B")'], s: 5, laco: "o timer venceu: B passou pela fila e foi para a pilha",
        n: "Depois de 100 ms, “B”. Saída final: A, E, D, C, B." }
    ]
  };

  var PECAS = ["pilha", "web", "micro", "macro"];

  document.querySelectorAll("[data-loop]").forEach(function (box) {
    var passos = LOOPS[box.getAttribute("data-loop")];
    if (!passos) return;
    var pre = box.querySelector("pre.codigo");
    var linhas = Array.prototype.slice.call(pre.querySelectorAll(".ln"));
    var nota = box.querySelector("[data-nota]");
    var conta = box.querySelector("[data-conta]");
    var prox = box.querySelector("[data-proximo]");
    var reini = box.querySelector("[data-reiniciar]");
    var laco = box.querySelector("[data-laco]");
    var lacoTexto = laco.querySelector("span:last-child");
    var cons = criarConsole(box.querySelector("[data-console]"), false);
    var caixas = {};
    PECAS.forEach(function (p) { caixas[p] = box.querySelector('[data-peca="' + p + '"]'); });
    var inicio = "Clique em <b>próximo passo</b> e acompanhe cada peça.";
    var lacoInicio = "esperando a pilha esvaziar";

    var saida = [], pronto = false, i = -1, mostradas = 0, anterior = {};

    function desenhar(estado, marcar) {
      PECAS.forEach(function (p) {
        var itens = estado[p] || [];
        var lista = caixas[p].querySelector(".motor-itens");
        var chave = JSON.stringify(itens);
        var mudou = chave !== JSON.stringify(anterior[p] || []);
        if (mudou || !marcar) {
          lista.innerHTML = "";
          if (!itens.length) {
            var v = document.createElement("span");
            v.className = "motor-vazio";
            v.textContent = "vazia";
            lista.appendChild(v);
          }
          itens.forEach(function (t) {
            var d = document.createElement("div");
            d.className = "motor-item";
            d.textContent = t;
            lista.appendChild(d);
          });
        }
        caixas[p].classList.toggle("mexeu", !!(marcar && mudou));
        anterior[p] = itens;
      });
    }

    function reiniciar() {
      i = -1;
      mostradas = 0;
      anterior = {};
      linhas.forEach(function (l) { l.classList.remove("atual", "feita"); });
      cons.limpar();
      desenhar({}, false);
      laco.classList.remove("ativo");
      lacoTexto.innerHTML = lacoInicio;
      nota.innerHTML = inicio;
      conta.textContent = "passo 0 de " + passos.length;
      prox.disabled = !pronto;
    }

    function avancar() {
      if (!pronto || i >= passos.length - 1) return;
      i++;
      var p = passos[i];
      linhas.forEach(function (l) { l.classList.remove("atual"); });
      for (var j = 0; j < i; j++) if (passos[j].l) linhas[passos[j].l - 1].classList.add("feita");
      if (p.l) linhas[p.l - 1].classList.add("atual");
      desenhar(p, true);
      laco.classList.toggle("ativo", !!p.laco);
      lacoTexto.innerHTML = p.laco || lacoInicio;
      if (p.s) {
        while (mostradas < p.s && mostradas < saida.length) {
          cons.linha(saida[mostradas][0], saida[mostradas][1]);
          mostradas++;
        }
      }
      nota.innerHTML = p.n;
      conta.textContent = "passo " + (i + 1) + " de " + passos.length;
      if (i === passos.length - 1) prox.disabled = true;
    }

    executar(fonteDe(pre), {
      linha: function (nivel, texto) { saida.push([nivel, texto]); },
      fim: function () {
        /* a saída real chega só depois do último timer; espera o mais longo dos exemplos */
        setTimeout(function () { pronto = true; if (i < passos.length - 1) prox.disabled = false; }, 250);
      }
    });

    prox.addEventListener("click", avancar);
    reini.addEventListener("click", reiniciar);
    reiniciar();
  });

  /* ======================================================
     6. PREVISÃO DA ORDEM DE SAÍDA

     <div class="prever" data-prever data-codigo="id" data-fichas="A,B,C">
     O aluno clica nas fichas na ordem que acha certa; "rodar e
     conferir" executa o código de verdade e compara.
     ====================================================== */

  document.querySelectorAll("[data-prever]").forEach(function (box) {
    var pre = document.getElementById(box.getAttribute("data-codigo"));
    var fichas = box.getAttribute("data-fichas").split(",");
    var areaFichas = box.querySelector("[data-fichas-area]");
    var palpite = box.querySelector("[data-palpite]");
    var conferir = box.querySelector("[data-conferir]");
    var limpar = box.querySelector("[data-limpar]");
    var veredito = box.querySelector("[data-veredito]");
    var cons = criarConsole(box.querySelector("[data-console]"), true);
    var ordem = [], exec = null;

    var botoes = fichas.map(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ficha";
      b.textContent = f;
      b.addEventListener("click", function () {
        ordem.push(f);
        b.disabled = true;
        desenhar();
      });
      areaFichas.appendChild(b);
      return b;
    });

    function desenhar(real) {
      palpite.innerHTML = "";
      if (!ordem.length) {
        var v = document.createElement("span");
        v.className = "palpite-vazio";
        v.textContent = "clique nas letras na ordem em que você acha que elas aparecem no console";
        palpite.appendChild(v);
      }
      ordem.forEach(function (f, k) {
        var s = document.createElement("span");
        s.className = "pos" + (real ? (real[k] === f ? " certo" : " errado") : "");
        s.textContent = f;
        palpite.appendChild(s);
      });
      conferir.disabled = ordem.length !== fichas.length;
    }

    function zerar() {
      if (exec) exec.parar();
      ordem = [];
      botoes.forEach(function (b) { b.disabled = false; });
      veredito.textContent = "";
      veredito.className = "veredito";
      cons.limpar();
      cons.fim();
      desenhar();
    }

    conferir.addEventListener("click", function () {
      if (exec) exec.parar();
      cons.limpar();
      conferir.disabled = true;
      var real = [];
      veredito.textContent = "rodando…";
      veredito.className = "veredito";
      exec = executar(fonteDe(pre), {
        inicio: cons.zerarTempo,
        linha: function (nivel, texto, ms) {
          cons.linha(nivel, texto, ms);
          real.push(texto);
          if (real.length === fichas.length) {
            desenhar(real);
            var acertou = real.join() === ordem.join();
            veredito.textContent = acertou ? "Acertou: " + real.join(", ") + "." : "A ordem real é " + real.join(", ") + ".";
            veredito.className = "veredito " + (acertou ? "ok" : "nao");
          }
        }
      });
    });
    limpar.addEventListener("click", zerar);
    zerar();
  });

  /* ======================================================
     7. LABORATÓRIO LIVRE
     ====================================================== */

  var EXEMPLOS = {
    ordem: "// preveja antes de executar\nconsole.log(\"A\");\nsetTimeout(() => console.log(\"B\"), 100);\nsetTimeout(() => console.log(\"C\"), 0);\nPromise.resolve().then(() => console.log(\"D\"));\nconsole.log(\"E\");",
    bloqueio: "// o while segura a única thread: o timer de 100 ms atrasa\nsetTimeout(() => console.log(\"timer de 100 ms\"), 100);\n\nconst fim = Date.now() + 1500;\nwhile (Date.now() < fim) {}   // 1,5 s de CPU ocupada\n\nconsole.log(\"o while terminou\");",
    callback: "// callback com erro primeiro\nbuscarPokemonCB(25, (erro, pokemon) => {\n  if (erro) {\n    console.error(erro.message);\n    return;\n  }\n  console.log(pokemon.nome, pokemon.tipos);\n});\n\nbuscarPokemonCB(99, (erro, pokemon) => {\n  if (erro) {\n    console.error(erro.message);\n    return;\n  }\n  console.log(pokemon.nome);\n});\n\nconsole.log(\"Buscando…\");",
    gerador: "// gerador: pausa em cada yield\nfunction* porTipo(lista, tipo) {\n  for (const pokemon of lista) {\n    if (pokemon.tipos.includes(tipo)) {\n      yield pokemon;\n    }\n  }\n}\n\nconst agua = porTipo(pokedex, \"água\");\nconsole.log(agua.next());\nconsole.log(agua.next());\nconsole.log(agua.next());\n\n// for...of usa o mesmo protocolo\nfor (const p of porTipo(pokedex, \"fogo\")) console.log(p.nome);",
    all: "// paralelo com Promise.all\nconsole.log(\"buscando o time…\");\ntry {\n  const time = await Promise.all([1, 4, 7].map(buscarPokemon));\n  console.log(time.map((p) => p.nome));\n} catch (erro) {\n  console.error(erro.message);\n}\n\n// troque um id por 99 e execute de novo",
    settled: "// allSettled: o resultado de cada uma\nconst resultados = await Promise.allSettled([25, 99, 7].map(buscarPokemon));\nfor (const r of resultados) {\n  if (r.status === \"fulfilled\") console.log(\"ok:\", r.value.nome);\n  else console.warn(\"falhou:\", r.reason.message);\n}",
    sequencia: "// em sequência x em paralelo: compare os tempos\nconst ids = [1, 4, 7];\n\nconst t1 = Date.now();\nfor (const id of ids) await buscarPokemon(id);\nconsole.log(\"sequência:\", Date.now() - t1, \"ms\");\n\nconst t2 = Date.now();\nawait Promise.all(ids.map(buscarPokemon));\nconsole.log(\"paralelo:\", Date.now() - t2, \"ms\");",
    fetch: "// fetch + JSON + cache no localStorage\nasync function carregarPokedex() {\n  const salvo = localStorage.getItem(\"pokedex\");\n  if (salvo) return JSON.parse(salvo);\n  const resposta = await fetch(\"pokedex.json\");\n  if (!resposta.ok) throw new Error(\"Falha ao carregar\");\n  const dados = await resposta.json();\n  localStorage.setItem(\"pokedex\", JSON.stringify(dados));\n  return dados;\n}\n\nconsole.log((await carregarPokedex()).length, \"Pokémon (rede)\");\nconsole.log((await carregarPokedex()).length, \"Pokémon (cache)\");",
    race: "// limite de tempo com Promise.race\nfunction tempoLimite(ms) {\n  return new Promise((_, reject) =>\n    setTimeout(() => reject(new Error(\"Tempo esgotado\")), ms)\n  );\n}\n\ntry {\n  const p = await Promise.race([buscarPokemon(25), tempoLimite(500)]);\n  console.log(p.nome);\n} catch (erro) {\n  console.error(erro.message);\n}\n\n// troque 500 por 1500 e execute de novo",
    esqueceu: "// o erro mais comum: esquecer o await\nasync function nomeDo(id) {\n  const pokemon = buscarPokemon(id);   // sem await!\n  return pokemon.nome;\n}\n\nconsole.log(await nomeDo(25));"
  };

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var seletor = pg.querySelector("[data-exemplos]");
    var consPg = criarConsole(pg.querySelector("[data-console]"), true);
    var execPg = null;

    /* o laboratório aceita await direto: o código roda dentro de uma função async */
    var rodarPg = function () {
      if (execPg) execPg.parar();
      consPg.limpar();
      var codigo = "(async () => {\n" + editor.value + "\n})().catch((e) => { setTimeout(() => { throw e; }); });";
      execPg = executar(codigo, { linha: consPg.linha, fim: consPg.fim, inicio: consPg.zerarTempo, api: true });
    };
    pg.querySelector("[data-rodar-pg]").addEventListener("click", rodarPg);
    editor.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarPg(); }
    });
    seletor.addEventListener("change", function () {
      if (EXEMPLOS[seletor.value]) { editor.value = EXEMPLOS[seletor.value]; rodarPg(); }
    });
    editor.value = EXEMPLOS.ordem;
    rodarPg();
  }
})();
