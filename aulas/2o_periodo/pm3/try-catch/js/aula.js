/* =========================================================
   Aula: Tratamento de erros com try...catch em JavaScript
   aula.js - motor da aula em página única
   1. Colorização dos blocos de código (JS e HTML)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Motor de execução: roda o código de um painel num quadro
      isolado e traz o console de volta para a página
   4. Consoles ao vivo e chamadas
   5. Passo a passo da execução (linha atual, linhas puladas)
   6. Laboratório livre e resultado esperado da atividade

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

  /* JavaScript: textos, palavras-chave, tipos de erro e números */
  var RE_JS = new RegExp(
    "(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)" +
    "|\\b(let|const|var|for|of|in|new|function|return|if|else|async|await|try|catch|finally|throw|" +
    "class|extends|super|this|typeof|instanceof|true|false|null|undefined|NaN|Infinity)\\b" +
    "|\\b((?:[A-Z]\\w*)?Error|Promise|JSON|Number)\\b" +
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
       linha 1: <script>preparação</script><script>código do aluno
     A preparação ocupa uma linha só, então a linha N do painel
     é a linha N do quadro: o stack mostra os números certos.

     No quadro, console.log/warn/error e os erros não tratados
     (evento "error" e "unhandledrejection") viram mensagens para
     a página. O erro não tratado só é mostrado se o próprio
     código não chamou preventDefault(), como no navegador.
     O console real (F12) fica limpo: a preparação cancela o
     relatório padrão.
     ====================================================== */

  /* Esta função é convertida em texto e roda DENTRO do quadro.
     Regras: sem comentários de linha, ponto e vírgula sempre. */
  function prepararQuadro(ID, TELA) {
    var P = window.parent;
    function enviar(d) { d.tipo = "console-exec"; d.id = ID; P.postMessage(d, "*"); }
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
      if (typeof Promise !== "undefined" && v instanceof Promise) return "Promise {…}";
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
    if (TELA) {
      var medir = function () { enviar({ nivel: "altura", altura: Math.ceil(document.body.getBoundingClientRect().height) + 2 }); };
      window.addEventListener("load", medir);
      new ResizeObserver(medir).observe(document.body);
    }
  }

  var PREPARO = "(" + prepararQuadro.toString().replace(/\s*\n\s*/g, " ") + ")";

  var ESTILO_TELA =
    "body{margin:0;padding:18px 20px;font:18px/1.45 Arial,Helvetica,sans-serif;color:#000;background:#fff}" +
    "label{display:block;font-weight:700;margin-bottom:8px}" +
    "input{font:18px ui-monospace,Consolas,monospace;padding:8px 10px;width:150px;border:1px solid #98A2A9;border-radius:8px}" +
    "button{font:700 16px ui-monospace,Consolas,monospace;padding:9px 16px;border-radius:8px;border:2px solid #0A2A1E;background:#00E88F;cursor:pointer;margin-left:8px}" +
    "p{margin:14px 0 0;min-height:1.45em}.ok{color:#0E7A4B;font-weight:700}.erro{color:#8C2F1F;font-weight:700}";

  var execucoes = {};
  var contador = 0;

  /* codigo: texto a rodar. op: { linha(nivel, texto), fim(), tela, html } */
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
    var preparo = "<script>" + PREPARO + "(" + JSON.stringify(id) + "," + (op.tela ? "true" : "false") + ");<\/script>";
    var codigoSeguro = codigo.replace(/<\/script/gi, "<\\/script");
    var fim = "<script>setTimeout(function(){parent.postMessage({tipo:'console-exec',id:'" + id + "',nivel:'fim'},'*');},0);<\/script>";
    quadro.srcdoc = op.tela
      ? '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>' + ESTILO_TELA + "</style></head><body>" +
        op.html + preparo + "<script>" + codigoSeguro + "\n<\/script>" + fim + "</body></html>"
      : "<!doctype html>" + preparo + "<script>" + codigoSeguro + "\n<\/script>" + fim;
    execucoes[id] = { op: op, quadro: quadro };
    return {
      parar: function () {
        delete execucoes[id];
        if (!op.tela) quadro.remove();
      }
    };
  }

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || d.tipo !== "console-exec") return;
    var x = execucoes[d.id];
    if (!x || ev.source !== x.quadro.contentWindow) return;
    if (d.nivel === "altura") { x.quadro.style.height = Math.max(120, d.altura) + "px"; return; }
    if (d.nivel === "fim") { if (x.op.fim) x.op.fim(); return; }
    if (x.op.linha) x.op.linha(d.nivel, d.texto);
  });

  /* ======================================================
     4. CONSOLES AO VIVO E CHAMADAS

     <div data-exec data-codigo="id-do-pre">
       <button data-chamada="dividir(10, 0);"></button>   (opcional)
       <div class="console" data-console></div>
     </div>
     Sem data-codigo, usa o primeiro pre.codigo de dentro.
     Cada chamada roda o código do painel + aquela linha.
     ====================================================== */

  function criarConsole(el) {
    var vazio = el.getAttribute("data-vazio") || "(nada foi escrito no console)";
    var linhas = 0, marca = null;
    function add(nivel, texto) {
      var d = document.createElement("div");
      d.className = "cl cl--" + nivel;
      d.textContent = texto;
      el.appendChild(d);
      return d;
    }
    return {
      limpar: function () { el.innerHTML = ""; linhas = 0; marca = null; },
      eco: function (t) { add("eco", t); },
      linha: function (nivel, texto) {
        if (marca) { marca.remove(); marca = null; }
        linhas++;
        add(nivel, texto);
      },
      fim: function () { if (!linhas && !marca) marca = add("vazio", vazio); }
    };
  }

  document.querySelectorAll("[data-exec]").forEach(function (el) {
    var idCodigo = el.getAttribute("data-codigo");
    var pre = idCodigo ? document.getElementById(idCodigo) : el.querySelector("pre.codigo");
    var preHtml = el.getAttribute("data-html") ? document.getElementById(el.getAttribute("data-html")) : null;
    var tela = el.querySelector("[data-tela]");
    var cons = criarConsole(el.querySelector("[data-console]"));
    var botoes = Array.prototype.slice.call(el.querySelectorAll("[data-chamada]"));
    var atual = null;

    function rodar(chamada) {
      if (atual) atual.parar();
      cons.limpar();
      if (chamada) cons.eco(chamada);
      var codigo = fonteDe(pre) + (chamada ? "\n" + chamada : "");
      atual = executar(codigo, {
        linha: cons.linha, fim: cons.fim,
        tela: tela, html: preHtml ? fonteDe(preHtml) : ""
      });
    }

    botoes.forEach(function (b) {
      if (!b.textContent.trim()) b.textContent = b.getAttribute("data-chamada");
      b.classList.add("chamada");
      b.type = "button";
      b.addEventListener("click", function () {
        botoes.forEach(function (o) { o.classList.toggle("ativa", o === b); });
        rodar(b.getAttribute("data-chamada"));
      });
    });

    var rodarDeNovo = el.querySelector("[data-rodar]");
    if (rodarDeNovo) rodarDeNovo.addEventListener("click", function () {
      var ativo = botoes.filter(function (b) { return b.classList.contains("ativa"); })[0];
      rodar(ativo ? ativo.getAttribute("data-chamada") : "");
    });

    if (botoes.length) { botoes[0].classList.add("ativa"); rodar(botoes[0].getAttribute("data-chamada")); }
    else rodar("");
  });

  /* ======================================================
     5. PASSO A PASSO DA EXECUÇÃO

     A saída mostrada vem de uma execução REAL do código no
     motor acima; cada passo só decide quantas linhas dessa
     saída já apareceram (s) e qual linha do painel destacar (l).
     ====================================================== */

  var PASSOS = {
    "sem-try": {
      cenarios: [{
        rotulo: "rodar o script",
        chamada: "",
        passos: [
          { l: 6, n: "O script chega à chamada <code>processarDados(null)</code>: o parâmetro <code>dados</code> recebe <code>null</code>." },
          { l: 2, erro: true, s: 1, n: "<code>dados.nome</code> com <code>dados</code> valendo <code>null</code>: <code>null</code> não tem propriedades. O JavaScript <b>lança</b> um <code>TypeError</code>." },
          { puladas: [3, 7], n: "Ninguém capturou o erro: o script <b>para na hora</b>. As linhas 3 e 7 nunca rodaram, nem a mensagem de sucesso nem o “Fim do programa”." }
        ]
      }]
    },
    "fluxo": {
      blocos: { "try": [2, 5], "catch": [6, 8] },
      cenarios: [{
        rotulo: "lerPerfil('{\"nome\": \"Ana\"}');",
        chamada: "lerPerfil('{\"nome\": \"Ana\"}');",
        passos: [
          { l: 3, s: 1, n: "<b>Regra 1.</b> O código dentro do <code>try</code> é executado normalmente." },
          { l: 4, n: "<code>JSON.parse</code> lê o texto sem problema: <code>perfil</code> recebe <code>{ nome: \"Ana\" }</code>." },
          { l: 5, s: 2, n: "O <code>try</code> chega ao fim sem erro." },
          { l: 9, s: 3, puladas: [7], n: "<b>Regra 3.</b> Nenhum erro aconteceu: o <code>catch</code> é totalmente ignorado e o programa segue na linha 9." }
        ]
      }, {
        rotulo: "lerPerfil('{nome: Ana}');",
        chamada: "lerPerfil('{nome: Ana}');",
        passos: [
          { l: 3, s: 1, n: "<b>Regra 1.</b> O código dentro do <code>try</code> é executado normalmente." },
          { l: 4, erro: true, n: "<b>Regra 2.</b> <code>{nome: Ana}</code> não é JSON válido (faltam aspas): <code>JSON.parse</code> lança um <code>SyntaxError</code>. O <code>try</code> para aqui e o controle vai para o <code>catch</code>." },
          { l: 7, s: 2, n: "O <code>catch</code> recebe o erro no parâmetro <code>error</code>. <code>error.name</code> é <code>\"SyntaxError\"</code>." },
          { l: 9, s: 3, puladas: [5], n: "O erro foi tratado: o programa continua normalmente. A linha 5 nunca rodou." }
        ]
      }]
    },
    "completo": {
      blocos: { "try": [2, 6], "catch": [7, 9], "finally": [10, 12] },
      cenarios: [{
        rotulo: "console.log(dividir(10, 2));",
        chamada: "console.log(dividir(10, 2));",
        passos: [
          { l: 3, n: "<code>b</code> vale <code>2</code>: a condição <code>b === 0</code> é falsa." },
          { l: 6, n: "<code>return a / b</code>: o valor <code>5</code> fica <b>guardado</b>, mas a função ainda não terminou. Antes de sair, o <code>finally</code> precisa rodar." },
          { l: 11, s: 1, n: "O <code>finally</code> roda. Por isso “Operação finalizada.” aparece <b>antes</b> do resultado." },
          { s: 2, puladas: [4, 8, 9], n: "Só agora a função devolve <code>5</code> e o <code>console.log</code> de quem chamou escreve o valor. O <code>catch</code> foi ignorado." }
        ]
      }, {
        rotulo: "console.log(dividir(10, 0));",
        chamada: "console.log(dividir(10, 0));",
        passos: [
          { l: 3, n: "<code>b</code> vale <code>0</code>: a condição <code>b === 0</code> é verdadeira." },
          { l: 4, erro: true, n: "<code>throw</code> lança o erro. O resto do <code>try</code> (a linha 6) é abandonado." },
          { l: 8, s: 1, n: "O <code>catch</code> mostra a mensagem com <code>console.error</code>, em vermelho." },
          { l: 9, n: "<code>return null</code>: o valor fica guardado até o <code>finally</code> terminar." },
          { l: 11, s: 2, n: "O <code>finally</code> roda também quando houve erro." },
          { s: 3, puladas: [6], n: "A função devolve <code>null</code> e quem chamou escreve o valor. A linha 6 nunca rodou." }
        ]
      }]
    }
  };

  document.querySelectorAll("[data-passos]").forEach(function (box) {
    var def = PASSOS[box.getAttribute("data-passos")];
    if (!def) return;
    var pre = box.querySelector("pre.codigo");
    var linhas = Array.prototype.slice.call(pre.querySelectorAll(".ln"));
    var cenBox = box.querySelector("[data-cenarios]");
    var nota = box.querySelector("[data-nota]");
    var conta = box.querySelector("[data-conta]");
    var prox = box.querySelector("[data-proximo]");
    var reini = box.querySelector("[data-reiniciar]");
    var cons = criarConsole(box.querySelector("[data-console]"));
    var inicio = "Clique em <b>próximo passo</b> para seguir a execução linha a linha.";

    Object.keys(def.blocos || {}).forEach(function (nome) {
      var faixa = def.blocos[nome];
      for (var n = faixa[0]; n <= faixa[1]; n++) linhas[n - 1].classList.add("b-" + nome);
    });

    var cen = null, saida = [], pronto = false, i = -1, mostradas = 0, exec = null;

    var botoesCen = def.cenarios.map(function (c, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chamada";
      b.textContent = c.rotulo;
      b.addEventListener("click", function () { escolher(k); });
      cenBox.appendChild(b);
      return b;
    });

    function limparLinhas() {
      linhas.forEach(function (l) { l.classList.remove("atual", "erro", "feita", "pulada"); });
    }

    function reiniciar() {
      i = -1;
      mostradas = 0;
      limparLinhas();
      cons.limpar();
      if (cen.chamada) cons.eco(cen.chamada);
      nota.innerHTML = inicio;
      nota.classList.remove("erro");
      conta.textContent = "passo 0 de " + cen.passos.length;
      prox.disabled = !pronto;
    }

    function escolher(k) {
      cen = def.cenarios[k];
      botoesCen.forEach(function (b, j) { b.classList.toggle("ativa", j === k); });
      if (exec) exec.parar();
      saida = [];
      pronto = false;
      exec = executar(fonteDe(pre) + (cen.chamada ? "\n" + cen.chamada : ""), {
        linha: function (nivel, texto) { saida.push([nivel, texto]); },
        fim: function () { pronto = true; if (i < cen.passos.length - 1) prox.disabled = false; }
      });
      reiniciar();
    }

    function avancar() {
      if (!pronto || i >= cen.passos.length - 1) return;
      i++;
      var p = cen.passos[i];
      limparLinhas();
      for (var j = 0; j < i; j++) {
        var q = cen.passos[j];
        if (q.l) linhas[q.l - 1].classList.add(q.erro ? "erro" : "feita");
      }
      if (p.l) linhas[p.l - 1].classList.add(p.erro ? "erro" : "atual");
      if (p.s) {
        while (mostradas < p.s && mostradas < saida.length) {
          cons.linha(saida[mostradas][0], saida[mostradas][1]);
          mostradas++;
        }
      }
      nota.innerHTML = p.n;
      nota.classList.toggle("erro", !!p.erro);
      conta.textContent = "passo " + (i + 1) + " de " + cen.passos.length;
      if (i === cen.passos.length - 1) {
        (p.puladas || []).forEach(function (n) { linhas[n - 1].classList.add("pulada"); });
        prox.disabled = true;
      }
    }

    prox.addEventListener("click", avancar);
    reini.addEventListener("click", reiniciar);
    escolher(0);
  });

  /* ======================================================
     6. LABORATÓRIO LIVRE E ATIVIDADE
     ====================================================== */

  var EXEMPLOS = {
    json: "// JSON.parse lança SyntaxError quando o texto não é JSON\nfunction lerJson(texto) {\n  try {\n    return JSON.parse(texto);\n  } catch (error) {\n    console.error(error.name + \": \" + error.message);\n    return null;\n  }\n}\n\nconsole.log(lerJson('{\"nome\": \"Ana\", \"nota\": 9}'));\nconsole.log(lerJson(\"{nome: 'Ana'}\"));",
    dividir: "// try, catch e finally juntos\nfunction dividir(a, b) {\n  try {\n    if (b === 0) {\n      throw new Error(\"Divisão por zero!\");\n    }\n    return a / b;\n  } catch (error) {\n    console.error(error.message);\n    return null;\n  } finally {\n    console.log(\"Operação finalizada.\");\n  }\n}\n\nconsole.log(dividir(10, 2));\nconsole.log(dividir(10, 0));",
    personalizado: "// um tipo de erro só seu\nclass SaldoError extends Error {\n  constructor(saldo, valor) {\n    super(`Saldo de ${saldo} não cobre ${valor}`);\n    this.name = \"SaldoError\";\n    this.falta = valor - saldo;\n  }\n}\n\nfunction sacar(saldo, valor) {\n  if (valor > saldo) throw new SaldoError(saldo, valor);\n  return saldo - valor;\n}\n\ntry {\n  console.log(\"Novo saldo:\", sacar(100, 30));\n  console.log(\"Novo saldo:\", sacar(100, 250));\n} catch (error) {\n  if (error instanceof SaldoError) {\n    console.warn(error.message, \"- faltam\", error.falta);\n  } else {\n    throw error;\n  }\n}",
    async: "// await traz o erro da promessa para dentro do try\nfunction buscarNota(id) {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      if (id === 1) resolve(9.5);\n      else reject(new Error(`nota ${id} não encontrada`));\n    }, 600);\n  });\n}\n\nasync function mostrar(id) {\n  console.log(\"carregando...\");\n  try {\n    const nota = await buscarNota(id);\n    console.log(\"nota:\", nota);\n  } catch (error) {\n    console.error(\"falhou:\", error.message);\n  } finally {\n    console.log(\"pronto (com ou sem erro)\");\n  }\n}\n\nawait mostrar(1);\nawait mostrar(7);",
    relancar: "// trate o que você conhece, relance o resto\nfunction converter(texto) {\n  try {\n    const dados = JSON.parse(texto);\n    return dados.valor.toFixed(2);\n  } catch (error) {\n    if (error instanceof SyntaxError) {\n      console.warn(\"texto inválido:\", texto);\n      return \"0.00\";\n    }\n    throw error;\n  }\n}\n\nconsole.log(converter('{\"valor\": 3.14159}'));\nconsole.log(converter(\"nada\"));\nconsole.log(converter(\"{}\"));   // TypeError: relançado",
    global: "// o último recurso: ouvir os erros que ninguém tratou\nwindow.addEventListener(\"error\", (evento) => {\n  console.warn(\"registrado:\", evento.message);\n});\n\nsetTimeout(() => {\n  const aluno = undefined;\n  console.log(aluno.nome);\n}, 300);\n\nconsole.log(\"o script terminou; o erro vem depois\");",
    vazio: "// por que só uma nota foi salva?\nconst notas = [];\n\nfunction salvar(texto) {\n  try {\n    notas.push(JSON.parse(texto).valor);\n  } catch (error) {\n  }\n}\n\nsalvar('{\"valor\": 8}');\nsalvar(\"{valor: 9}\");\nsalvar('{\"valor\": 7,}');\nconsole.log(notas);"
  };

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var seletor = pg.querySelector("[data-exemplos]");
    var consPg = criarConsole(pg.querySelector("[data-console]"));
    var execPg = null;

    /* o laboratório aceita await direto: o código roda dentro de uma função async */
    var rodarPg = function () {
      if (execPg) execPg.parar();
      consPg.limpar();
      var codigo = "(async () => {\n" + editor.value + "\n})().catch((e) => { setTimeout(() => { throw e; }); });";
      execPg = executar(codigo, { linha: consPg.linha, fim: consPg.fim });
    };
    pg.querySelector("[data-rodar-pg]").addEventListener("click", rodarPg);
    editor.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarPg(); }
    });
    seletor.addEventListener("change", function () {
      if (EXEMPLOS[seletor.value]) { editor.value = EXEMPLOS[seletor.value]; rodarPg(); }
    });
    editor.value = EXEMPLOS.json;
    rodarPg();
  }

  /* ---------- resultado esperado da atividade ---------- */

  function formatar(v) {
    if (typeof v === "string") return "'" + v + "'";
    if (Array.isArray(v)) return "[" + v.map(formatar).join(", ") + "]";
    return String(v);
  }
  function descrever(v) {
    if (typeof v === "string") return 'o texto "' + v + '"';
    return String(v);
  }

  /* comportamento pedido nas partes 1 e 2 (a solução não aparece na página) */
  function calcularMediaRef(n1, n2, log) {
    try {
      [["nota1", n1], ["nota2", n2]].forEach(function (par) {
        var v = par[1];
        if (typeof v !== "number" || !Number.isFinite(v)) {
          throw new TypeError(par[0] + " precisa ser um número (recebi " + descrever(v) + ")");
        }
        if (v < 0 || v > 10) {
          throw new RangeError(par[0] + " precisa estar entre 0 e 10 (recebi " + v + ")");
        }
      });
      return (n1 + n2) / 2;
    } catch (error) {
      log("error", error.name + ": " + error.message);
      return null;
    }
  }

  var CASOS_MEDIA = [
    ["calcularMedia(7, 9)", 7, 9],
    ["calcularMedia(10, 6.5)", 10, 6.5],
    ["calcularMedia(7, \"9\")", 7, "9"],
    ["calcularMedia(11, 5)", 11, 5],
    ["calcularMedia(NaN, 8)", NaN, 8],
    ["calcularMedia(-1, Infinity)", -1, Infinity]
  ];

  var boxMedia = document.querySelector("[data-esperado-media]");
  if (boxMedia) {
    var consMedia = criarConsole(boxMedia.querySelector("[data-console]"));
    var areaMedia = boxMedia.querySelector("[data-casos]");
    var botoesMedia = CASOS_MEDIA.map(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chamada";
      b.textContent = c[0];
      b.addEventListener("click", function () {
        botoesMedia.forEach(function (o) { o.classList.toggle("ativa", o === b); });
        consMedia.limpar();
        consMedia.eco("console.log(" + c[0] + ");");
        var r = calcularMediaRef(c[1], c[2], consMedia.linha);
        consMedia.linha("log", formatar(r));
      });
      areaMedia.appendChild(b);
      return b;
    });
    botoesMedia[0].click();
  }

  var boxUsuarios = document.querySelector("[data-esperado-usuarios]");
  if (boxUsuarios) {
    var consUs = criarConsole(boxUsuarios.querySelector("[data-console]"));
    var ocupado = false;
    var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    var tentativa = function (n) {
      consUs.linha("log", "tentativa " + n + ": buscando usuários...");
      return esperar(450).then(function () {
        if (Math.random() < 0.5) throw new Error("o servidor não respondeu");
        return ["Ana", "Bia", "Caio"];
      }).then(function (lista) {
        consUs.linha("log", lista.length + " usuários carregados");
        return lista;
      }, function (error) {
        consUs.linha("warn", "tentativa " + n + " falhou: " + error.message);
        return null;
      }).then(function (r) {
        consUs.linha("log", "fim da tentativa " + n);
        return r;
      });
    };

    var carregar = function (maximo) {
      if (ocupado) return;
      ocupado = true;
      consUs.limpar();
      consUs.eco(maximo > 1 ? "console.log(await carregarUsuarios());   // até 3 tentativas" : "console.log(carregarUsuarios());");
      var n = 0;
      var passo = function () {
        n++;
        return tentativa(n).then(function (r) {
          if (r) return r;
          if (n < maximo) return passo();
          if (maximo > 1) consUs.linha("error", "Desisti depois de " + maximo + " tentativas.");
          return [];
        });
      };
      passo().then(function (r) {
        consUs.linha("log", formatar(r));
        ocupado = false;
      });
    };

    boxUsuarios.querySelector("[data-uma]").addEventListener("click", function () { carregar(1); });
    boxUsuarios.querySelector("[data-tres]").addEventListener("click", function () { carregar(3); });
    carregar(1);
  }
})();
