/* =========================================================
   Aula: Revisão para a prova (2º período · PM 4)
   aula.js - motor da aula em página única
   1. Colorização dos blocos de código (JS e HTML)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Servidor simulado: a API de filmes da aula
      (api.cinema.local), sem Internet
   4. Motor de execução: roda o código de um painel num quadro
      isolado (normal, script clássico ou módulos ES) e traz o
      console e a rede de volta para a página
   5. Consoles ao vivo, painel de rede e chamadas
   6. Demonstrações: cliente e servidor, códigos de status,
      HTTPS, bloqueio, estados de uma Promise
   7. Laboratório de Intl.DateTimeFormat
   8. Laboratório livre
   9. Perguntas simuladas

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
    "|\\b(let|const|var|for|of|in|new|function|return|if|else|async|await|try|catch|finally|throw|" +
    "import|export|default|from|as|class|this|typeof|instanceof|true|false|null|undefined|NaN)\\b" +
    "|\\b((?:[A-Z]\\w*)?Error|Promise|JSON|Number|Intl|Date|Response|URLSearchParams|FormData|fetch|document|window|setTimeout)\\b" +
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
      } else if (c === "/" && linha.charAt(i + 1) === "/" && linha.charAt(i - 1) !== ":") {
        return i;
      }
    }
    return -1;
  }

  /* texto puro (mensagens HTTP): só destaca a primeira linha e os nomes de cabeçalho */
  function hlHttp(linha, i) {
    if (i === 0) return span("tk-tag", linha);
    var m = linha.match(/^([A-Za-z-]+)(:)(.*)$/);
    if (m) return span("tk-attr", m[1]) + esc(m[2]) + span("tk-str", m[3]);
    return esc(linha);
  }

  function hlLinha(linha, lang, i) {
    if (lang === "http") return hlHttp(linha, i);
    if (lang === "texto") return esc(linha);
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
    pre.innerHTML = fonte.split("\n").map(function (l, i) { return hlLinha(l, lang, i); }).join("\n");
  }

  function fonteDe(pre) { return pre ? (pre.fonte !== undefined ? pre.fonte : pre.textContent) : ""; }

  function escreverCodigo(pre, texto) {
    pre.textContent = texto;
    colorir(pre);
  }

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
     3. SERVIDOR SIMULADO

     Uma API REST de filmes em https://api.cinema.local,
     criada para a aula. A função é autossuficiente: roda na
     própria página (demonstrações) e é convertida em texto
     para rodar DENTRO de cada quadro, onde substitui
     window.fetch. Cada quadro começa com os dados originais.

     modo "simulado": tudo responde daqui, sem Internet.
     modo "offline":  toda requisição falha como sem Internet.
     ====================================================== */

  function servidor(W, cfg) {
    var HOST = "api.cinema.local";
    var TOKEN = "tk-7f3a9c";
    var pendentes = 0, contador = 0;
    var NOMES = {
      200: "OK", 201: "Created", 204: "No Content", 301: "Moved Permanently", 302: "Found", 304: "Not Modified",
      400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
      415: "Unsupported Media Type", 422: "Unprocessable Content", 429: "Too Many Requests",
      500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout"
    };

    var filmes = [
      { id: 1, titulo: "Cidade de Deus", ano: 2002, genero: "drama", nota: 8.6 },
      { id: 2, titulo: "O Auto da Compadecida", ano: 2000, genero: "comédia", nota: 8.5 },
      { id: 3, titulo: "Bacurau", ano: 2019, genero: "suspense", nota: 7.4 },
      { id: 4, titulo: "Tropa de Elite", ano: 2007, genero: "ação", nota: 8.0 },
      { id: 5, titulo: "Lisbela e o Prisioneiro", ano: 2003, genero: "comédia", nota: 7.6 },
      { id: 6, titulo: "O Som ao Redor", ano: 2012, genero: "drama", nota: 7.1 }
    ];
    var proximoId = 7;

    function copia(o) { return JSON.parse(JSON.stringify(o)); }
    function json(status, obj) { return { status: status, corpo: obj === null ? null : JSON.stringify(obj, null, 2), tipo: "application/json; charset=utf-8" }; }
    function achar(id) { for (var i = 0; i < filmes.length; i++) if (filmes[i].id === id) return i; return -1; }

    /* lê o corpo como uma API de verdade: só aceita JSON declarado no Content-Type */
    function lerCorpo(corpo, tipo) {
      if (!/application\/json/i.test(tipo)) return { erro: json(415, { erro: "envie o corpo como application/json", contentTypeRecebido: tipo || "(nenhum)" }) };
      try { return { dados: JSON.parse(corpo) }; }
      catch (e) { return { erro: json(400, { erro: "o corpo não é um JSON válido", corpoRecebido: corpo }) }; }
    }

    function rotear(metodo, u, corpo, cab) {
      if (u.hostname !== HOST) return null;
      var caminho = u.pathname.replace(/\/+$/, "") || "/", m, lido, i;
      var tipo = cab.get("content-type") || "";

      if (caminho === "/filmes") {
        if (metodo === "GET") {
          var genero = u.searchParams.get("genero"), desde = Number(u.searchParams.get("desde")) || 0;
          return json(200, filmes.filter(function (f) {
            return (!genero || f.genero === genero) && f.ano >= desde;
          }));
        }
        if (metodo === "POST") {
          lido = lerCorpo(corpo, tipo);
          if (lido.erro) return lido.erro;
          if (!lido.dados || typeof lido.dados !== "object" || !lido.dados.titulo) return json(400, { erro: "o campo titulo é obrigatório" });
          var novo = Object.assign({ id: proximoId++ }, lido.dados);
          filmes.push(novo);
          return json(201, novo);
        }
        return json(405, { erro: "método não permitido em /filmes" });
      }

      m = caminho.match(/^\/filmes\/(\d+)$/);
      if (m) {
        var id = Number(m[1]);
        i = achar(id);
        if (i === -1) return json(404, { erro: "o filme " + id + " não existe" });
        if (metodo === "GET") return json(200, filmes[i]);
        if (metodo === "DELETE") { filmes.splice(i, 1); return json(204, null); }
        if (metodo === "PUT" || metodo === "PATCH") {
          lido = lerCorpo(corpo, tipo);
          if (lido.erro) return lido.erro;
          /* PUT troca o recurso inteiro; PATCH junta só os campos enviados */
          filmes[i] = metodo === "PUT"
            ? Object.assign({ id: id }, lido.dados)
            : Object.assign({}, filmes[i], lido.dados, { id: id });
          return json(200, filmes[i]);
        }
        return json(405, { erro: "método não permitido" });
      }

      if (caminho === "/login" && metodo === "POST") {
        lido = lerCorpo(corpo, tipo);
        if (lido.erro) return lido.erro;
        if (!lido.dados.usuario || !lido.dados.senha) return json(400, { erro: "informe usuario e senha" });
        return json(200, { token: TOKEN });
      }

      if (caminho === "/perfil" && metodo === "GET") {
        if (cab.get("authorization") !== "Bearer " + TOKEN) return json(401, { erro: "quem é você? envie o token no cabeçalho Authorization" });
        return json(200, { usuario: "bia", plano: "estudante", favoritos: [1, 3] });
      }

      m = caminho.match(/^\/status\/(\d{3})$/);
      if (m) {
        var st = Number(m[1]);
        if (st < 200 || st > 599) return json(400, { erro: "use um código entre 200 e 599" });
        if (st === 204 || st === 304) return json(st, null);
        return json(st, { status: st, mensagem: NOMES[st] || "código de exemplo" });
      }

      if (caminho === "/instavel") return json(500, { erro: "serviço indisponível, tente mais tarde" });

      return json(404, { erro: "rota não existe: " + caminho });
    }

    function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
    function latencia() { return cfg.latencia ? Number(cfg.latencia) : 300 + Math.round(Math.random() * 350); }
    function avisar(reg) {
      if (cfg.avisar) cfg.avisar({ n: reg.n, metodo: reg.metodo, url: reg.url, status: reg.status, ms: reg.ms });
    }

    function responder(r, url) {
      var resp = new W.Response(r.corpo, { status: r.status, statusText: NOMES[r.status] || "", headers: r.corpo === null ? {} : { "Content-Type": r.tipo } });
      try { Object.defineProperty(resp, "url", { value: url }); } catch (e) { /* segue sem url */ }
      return resp;
    }

    function buscar(entrada, op) {
      op = op || {};
      var bruto = entrada && typeof entrada === "object" && "url" in entrada ? entrada.url : String(entrada);
      var url;
      try { url = new W.URL(bruto, cfg.base || W.location.href); }
      catch (e) { return Promise.reject(new TypeError("Failed to execute 'fetch' on 'Window': Failed to parse URL from " + bruto)); }
      var metodo = String(op.method || "GET").toUpperCase();
      var reg = { n: ++contador, metodo: metodo, url: url.href, status: null, ms: null };
      var t0 = Date.now();
      var p;
      avisar(reg);
      pendentes++;
      if (cfg.modo === "offline") {
        p = esperar(180 + Math.round(Math.random() * 120)).then(function () { throw new TypeError("Failed to fetch"); });
      } else {
        p = esperar(latencia()).then(function () {
          /* o corpo viaja como texto: um objeto vira "[object Object]" */
          var corpo = op.body === undefined || op.body === null ? "" : String(op.body);
          var cab;
          try { cab = new W.Headers(op.headers || {}); } catch (e) { cab = new W.Headers(); }
          if (!cab.get("content-type") && corpo) cab.set("content-type", "text/plain;charset=UTF-8");
          var r = rotear(metodo, url, corpo, cab);
          if (!r) throw new TypeError("Failed to fetch");
          return responder(r, url.href);
        });
      }
      return p.then(function (resp) {
        pendentes--; reg.status = resp.status; reg.ms = Date.now() - t0; avisar(reg);
        return resp;
      }, function (e) {
        pendentes--; reg.ms = Date.now() - t0; reg.status = "falhou";
        avisar(reg);
        throw e;
      });
    }

    return { fetch: buscar, pendentes: function () { return pendentes; }, rotear: rotear, nomes: NOMES };
  }

  var SERVIDOR_SRC = servidor.toString();

  /* ======================================================
     4. MOTOR DE EXECUÇÃO

     Cada execução cria um quadro (iframe srcdoc) com:
       a preparação (console e erros voltam para a página),
       o servidor simulado no lugar de window.fetch e
       o código do painel, de um destes jeitos:
         "async"    dentro de uma função async (await direto,
                    como no console do navegador) - padrão
         "classico" um <script> comum: var global vira
                    propriedade de window, como num arquivo .js
         "modulo"   <script type="module"> com os arquivos da
                    demonstração ligados por um import map
     ====================================================== */

  /* Esta função é convertida em texto e roda DENTRO do quadro. */
  function prepararQuadro(ID, TELA, MODULO) {
    var P = window.parent;
    function enviar(d) { d.tipo = "console-exec"; d.id = ID; P.postMessage(d, "*"); }
    function nomeDe(v) {
      var proto = Object.getPrototypeOf(v);
      if (!proto || proto === Object.prototype) return "";
      return proto.constructor && proto.constructor.name ? proto.constructor.name + " " : "";
    }
    function f(v, d) {
      d = d || 0;
      if (typeof v === "string") return d ? "'" + v + "'" : v;
      if (v === null) return "null";
      if (v === undefined) return "undefined";
      if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
      if (typeof v === "boolean" || typeof v === "bigint") return String(v);
      if (typeof v === "symbol") return v.toString();
      if (typeof v === "function") return "ƒ " + (v.name || "anônima") + "()";
      if (v instanceof Error || (typeof DOMException !== "undefined" && v instanceof DOMException)) return (v.name || "Error") + ": " + v.message;
      if (v instanceof Promise) return "Promise {…}";
      if (v instanceof Date) return isNaN(v) ? "Invalid Date" : v.toString();
      if (typeof Response !== "undefined" && v instanceof Response) {
        return "Response { status: " + v.status + ", ok: " + v.ok + ", statusText: '" + v.statusText + "', url: '" + v.url +
          "', headers: Headers {…}, body: " + (v.body ? "ReadableStream" : "null") + " }";
      }
      if (typeof Headers !== "undefined" && v instanceof Headers) return "Headers {…}";
      if (typeof URLSearchParams !== "undefined" && v instanceof URLSearchParams) return "URLSearchParams { '" + v.toString() + "' }";
      if (d > 3) return Array.isArray(v) ? "[…]" : "{…}";
      if (Array.isArray(v)) return "[" + v.map(function (x) { return f(x, d + 1); }).join(", ") + "]";
      var chaves = Object.keys(v);
      if (!chaves.length) return nomeDe(v) + "{}";
      return nomeDe(v) + "{ " + chaves.map(function (k) { return (/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'") + ": " + f(v[k], d + 1); }).join(", ") + " }";
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
    console.table = console.log;
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
    window.__avisar = function (req) { enviar({ nivel: "rede", req: req }); };
    var fimEnviado = false;
    window.__fim = function () {
      var inicio = Date.now();
      (function checar() {
        var srv = window.__srv;
        if (srv && srv.pendentes() > 0 && Date.now() - inicio < 15000) { setTimeout(checar, 60); return; }
        setTimeout(function () { if (!fimEnviado) { fimEnviado = true; enviar({ nivel: "fim" }); } }, 120);
      })();
    };
    /* um módulo com import errado nem começa a rodar: o erro encerra a execução */
    if (MODULO) window.addEventListener("error", function () { setTimeout(window.__fim, 30); });
    if (TELA) {
      var medir = function () { enviar({ nivel: "altura", altura: Math.ceil(document.body.getBoundingClientRect().height) + 2 }); };
      window.addEventListener("load", medir);
      new ResizeObserver(medir).observe(document.body);
    }
  }

  var PREPARO = "(" + prepararQuadro.toString() + ")";

  var ESTILO_TELA =
    "*{box-sizing:border-box}body{margin:0;padding:18px 20px;font:17px/1.45 Arial,Helvetica,sans-serif;color:#000;background:#fff}" +
    "body>*:last-child{margin-bottom:0}h3{font:700 24px 'Arial Narrow',Arial,sans-serif;margin:0 0 6px}" +
    "form,.grade{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px 12px;margin:0 0 10px}" +
    "label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:15px;grid-column:span 2}" +
    "input,select{font:17px ui-monospace,Consolas,monospace;padding:7px 9px;border:1px solid #98A2A9;border-radius:8px;min-width:0;width:100%;background:#fff}" +
    "button{font:700 15px ui-monospace,Consolas,monospace;padding:8px 14px;border-radius:8px;border:2px solid #0A2A1E;background:#00E88F;cursor:pointer;align-self:end}" +
    "button:disabled{opacity:.5;cursor:wait}" +
    ".msg,p{margin:4px 0 8px;min-height:1.45em}.url{font:15px ui-monospace,Consolas,monospace;background:#F2F4F3;border-radius:8px;padding:8px 12px;overflow-wrap:anywhere}" +
    ".ok{color:#0E7A4B;font-weight:700}.erro{color:#8C2F1F;font-weight:700}.espera{color:#5B6660;font-style:italic}" +
    "ul{margin:6px 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}" +
    "li{border:2px dashed #98A2A9;border-radius:10px;padding:8px 12px}li b{display:block;font-size:18px}li span{font-size:15px;color:#5B6660}";

  var execucoes = {};
  var contador = 0;

  function dataUrl(codigo) { return "data:text/javascript;charset=utf-8," + encodeURIComponent(codigo); }

  /* codigo: texto a rodar. op: { linha(nivel, texto), rede(req), fim(), tela, html, modo, latencia, jeito, arquivos } */
  function executar(codigo, op) {
    var id = "x" + (++contador);
    var quadro = document.createElement("iframe");
    var jeito = op.jeito || "async";
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
    var cfg = { modo: op.modo || "simulado", latencia: op.latencia || 0, base: "https://api.cinema.local/" };
    var preparo = "<script>" + PREPARO + "(" + JSON.stringify(id) + "," + (op.tela ? "true" : "false") + "," + (jeito === "modulo" ? "true" : "false") + ");" +
      "window.__srv=(" + SERVIDOR_SRC + ")(window," + JSON.stringify(cfg).replace(/\}$/, ",avisar:window.__avisar}") + ");" +
      "window.fetch=window.__srv.fetch;<\/script>";
    var seguro = function (t) { return t.replace(/<\/script/gi, "<\\/script"); };
    var corpo;
    if (jeito === "classico") {
      corpo = "<script>\n" + seguro(codigo) + "\n<\/script><script>window.__fim();<\/script>";
    } else if (jeito === "modulo") {
      var mapa = {};
      Object.keys(op.arquivos || {}).forEach(function (nome) { mapa[nome] = dataUrl(op.arquivos[nome]); });
      corpo = '<script type="importmap">' + JSON.stringify({ imports: mapa }) + "<\/script>" +
        '<script type="module">\n' + seguro(codigo) + "\nwindow.__fim();\n<\/script>";
    } else {
      corpo = "<script>window.__comecou=true;(async () => {\n" + seguro(codigo) +
        "\n})().catch(function (e) { setTimeout(function () { throw e; }); }).finally(function () { window.__fim(); });\n<\/script>" +
        "<script>setTimeout(function(){ if (!window.__comecou) window.__fim(); }, 0);<\/script>";
    }
    quadro.srcdoc = op.tela
      ? '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>' + ESTILO_TELA + "</style></head><body>" +
        op.html + preparo + corpo + "</body></html>"
      : '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"></head><body>' + preparo + corpo + "</body></html>";
    execucoes[id] = { op: op, quadro: quadro, t0: performance.now() };
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
    if (d.nivel === "rede") { if (x.op.rede) x.op.rede(d.req); return; }
    if (x.op.linha) x.op.linha(d.nivel, d.texto, (performance.now() - x.t0) / 1000);
  });

  /* ======================================================
     5. CONSOLES AO VIVO, PAINEL DE REDE E CHAMADAS

     <div data-exec data-codigo="id-do-pre">
       data-jeito="classico" | "modulo"  (padrão: async)
       data-arquivos="id1 id2"  (módulo: <pre data-arquivo="./x.js">)
       <button data-chamada="carregar(1);"></button>   (opcional)
       data-rede="offline" na chamada: roda sem Internet
       data-latencia="2000" na chamada: servidor lento
       <div class="console" data-console data-tempo></div>
       <div data-painel-rede></div>                    (opcional)
     </div>
     ====================================================== */

  function fmtSeg(s) { return s.toFixed(1).replace(".", ",") + " s"; }

  function criarConsole(el) {
    var vazio = el.getAttribute("data-vazio") || "(nada foi escrito no console)";
    var comTempo = el.hasAttribute("data-tempo");
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
      linha: function (nivel, texto, seg) {
        if (marca) { marca.remove(); marca = null; }
        linhas++;
        var d = add(nivel, texto);
        if (comTempo && typeof seg === "number") d.setAttribute("data-t", fmtSeg(seg));
      },
      fim: function () { if (!linhas && !marca) marca = add("vazio", vazio); }
    };
  }

  function rotuloStatus(st) {
    if (st === null) return ["…", "p"];
    if (typeof st === "number") return [String(st), String(st).charAt(0)];
    return [st, "x"];
  }

  function criarRede(el) {
    if (!el) return null;
    el.classList.add("rede");
    el.innerHTML = '<div class="rede-topo"><span>rede · requisições deste exemplo</span><span>método · status · endereço · tempo</span></div>';
    var corpo = document.createElement("div");
    el.appendChild(corpo);
    var linhas = {};
    function vazio() { corpo.innerHTML = '<div class="rede-vazia">nenhuma requisição ainda</div>'; linhas = {}; }
    vazio();
    return {
      limpar: vazio,
      req: function (r) {
        var lin = linhas[r.n];
        if (!lin) {
          if (!Object.keys(linhas).length) corpo.innerHTML = "";
          lin = document.createElement("div");
          lin.className = "rede-linha";
          corpo.appendChild(lin);
          linhas[r.n] = lin;
        }
        var st = rotuloStatus(r.status);
        lin.innerHTML = '<span class="rede-metodo">' + esc(r.metodo) + '</span><span class="st st--' + st[1] + '">' + esc(st[0]) +
          '</span><span class="rede-url">' + esc(r.url) + '</span><span class="rede-tempo">' +
          (r.ms === null ? "…" : esc(r.ms + " ms")) + "</span>";
      }
    };
  }

  document.querySelectorAll("[data-exec]").forEach(function (el) {
    var idCodigo = el.getAttribute("data-codigo");
    var pre = idCodigo ? document.getElementById(idCodigo) : el.querySelector("pre.codigo:not([data-arquivo])");
    var preHtml = el.getAttribute("data-html") ? document.getElementById(el.getAttribute("data-html")) : null;
    var tela = el.querySelector("[data-tela]");
    var cons = el.querySelector("[data-console]") ? criarConsole(el.querySelector("[data-console]")) : null;
    var rede = criarRede(el.querySelector("[data-painel-rede]"));
    var botoes = Array.prototype.slice.call(el.querySelectorAll("[data-chamada]"));
    var jeito = el.getAttribute("data-jeito") || "async";
    var preArquivos = (el.getAttribute("data-arquivos") || "").split(/\s+/).filter(Boolean)
      .map(function (i) { return document.getElementById(i); });
    el.querySelectorAll("pre.codigo[data-arquivo]").forEach(function (p) { preArquivos.push(p); });
    var atual = null;

    function rodar(botao) {
      if (atual) atual.parar();
      var chamada = botao ? botao.getAttribute("data-chamada") : "";
      var modo = botao && botao.getAttribute("data-rede") === "offline" ? "offline" : null;
      var latencia = botao && botao.getAttribute("data-latencia") ? Number(botao.getAttribute("data-latencia")) : 0;
      if (cons) {
        cons.limpar();
        if (chamada) cons.eco(chamada + (modo === "offline" ? "   (sem Internet)" : latencia ? "   (servidor lento)" : ""));
        else if (modo === "offline") cons.eco("(sem Internet)");
      }
      if (rede) rede.limpar();
      var arquivos = {};
      preArquivos.forEach(function (p) { arquivos[p.getAttribute("data-arquivo")] = fonteDe(p); });
      atual = executar(fonteDe(pre) + (chamada ? "\n" + chamada : ""), {
        linha: cons ? cons.linha : null, fim: cons ? cons.fim : null,
        rede: rede ? rede.req : null,
        /* <script src> do HTML exibido não roda no quadro: o código vem do painel */
        tela: tela, html: preHtml ? fonteDe(preHtml).replace(/<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi, "") : "",
        modo: modo, latencia: latencia, jeito: jeito, arquivos: arquivos
      });
    }

    botoes.forEach(function (b) {
      if (!b.textContent.trim()) b.textContent = b.getAttribute("data-chamada");
      b.classList.add("chamada");
      b.type = "button";
      b.addEventListener("click", function () {
        botoes.forEach(function (o) { o.classList.toggle("ativa", o === b); });
        rodar(b);
      });
    });

    var rodarDeNovo = el.querySelector("[data-rodar]");
    if (rodarDeNovo) rodarDeNovo.addEventListener("click", function () {
      rodar(botoes.filter(function (b) { return b.classList.contains("ativa"); })[0] || null);
    });

    var ativo = botoes.filter(function (b) { return b.classList.contains("ativa"); })[0];
    if (!ativo && botoes.length) { ativo = botoes[0]; ativo.classList.add("ativa"); }
    rodar(ativo || null);
  });

  /* servidor da própria página, para as demonstrações abaixo */
  var SRV = servidor(window, { modo: "simulado", base: "https://api.cinema.local/" });
  function esperarMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ======================================================
     6. DEMONSTRAÇÕES
     ====================================================== */

  /* ---------- 01 · cliente e servidor: o caminho de um pedido ---------- */
  (function () {
    var box = document.querySelector("[data-caminho]");
    if (!box) return;
    var etapas = box.querySelectorAll(".etapa");
    var pedidoEl = box.querySelector("[data-pedido]");
    var respostaEl = box.querySelector("[data-resposta]");
    var telaEl = box.querySelector("[data-tela-cliente]");
    var botoes = box.querySelectorAll("[data-filme]");
    var ocupado = false;

    function marcar(i, cls) {
      etapas.forEach(function (e, k) {
        e.classList.remove("ativa", "falhou");
        e.classList.toggle("feita", k < i);
        if (k === i) e.classList.add(cls || "ativa");
      });
    }

    async function pedir(id) {
      if (ocupado) return;
      ocupado = true;
      var caminho = "/filmes/" + id;
      escreverCodigo(pedidoEl, "GET " + caminho + " HTTP/1.1\nHost: api.cinema.local\nAccept: application/json\nUser-Agent: navegador da turma");
      escreverCodigo(respostaEl, "(esperando…)");
      telaEl.innerHTML = '<span class="espera">buscando…</span>';
      marcar(0); await esperarMs(700);
      marcar(1); await esperarMs(500);
      var resp = await SRV.fetch("https://api.cinema.local" + caminho);
      var corpo = await resp.text();
      marcar(2); await esperarMs(600);
      escreverCodigo(respostaEl, "HTTP/1.1 " + resp.status + " " + resp.statusText + "\nContent-Type: " + resp.headers.get("content-type") +
        "\nContent-Length: " + new Blob([corpo]).size + "\n\n" + corpo);
      marcar(3, resp.ok ? "ativa" : "falhou");
      var dados = JSON.parse(corpo);
      telaEl.innerHTML = resp.ok
        ? "<b>" + esc(dados.titulo) + "</b> (" + dados.ano + ") · " + esc(dados.genero) + " · nota " + String(dados.nota).replace(".", ",")
        : '<span class="erro">' + esc(dados.erro) + "</span>";
      ocupado = false;
    }

    botoes.forEach(function (b) {
      b.addEventListener("click", function () {
        botoes.forEach(function (o) { o.classList.toggle("ativa", o === b); });
        pedir(b.getAttribute("data-filme"));
      });
    });
    escreverCodigo(pedidoEl, "(nenhum pedido ainda)");
    escreverCodigo(respostaEl, "(nenhuma resposta ainda)");

    /* o primeiro pedido roda sozinho quando a seção aparece na tela */
    var disparar = function () { if (!box.querySelector(".chamada.ativa")) botoes[0].click(); };
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (itens) {
        if (itens[0].isIntersecting) { obs.disconnect(); disparar(); }
      }, { threshold: 0.35 });
      obs.observe(box);
    } else {
      disparar();
    }
  })();

  /* ---------- 05 · códigos de status ---------- */
  (function () {
    var box = document.querySelector("[data-status-lab]");
    if (!box) return;
    var campo = box.querySelector("input");
    var palco = box.querySelector("[data-palco]");
    var saida = box.querySelector("[data-saida]");
    var FAIXAS = {
      1: ["1xx · informação", "O pedido chegou e o processamento continua. Raro no dia a dia do front-end.", "ninguém: é aviso", "p"],
      2: ["2xx · sucesso", "O servidor entendeu e atendeu o pedido.", "ninguém: deu certo", "2"],
      3: ["3xx · redirecionamento", "O recurso está em outro lugar (ou não mudou). O cliente precisa dar mais um passo.", "o cliente segue o novo endereço (o navegador faz sozinho)", "3"],
      4: ["4xx · erro do cliente", "O pedido veio errado: endereço que não existe, falta de credencial, dados inválidos.", "quem fez o pedido: corrigir URL, login ou dados", "4"],
      5: ["5xx · erro do servidor", "O pedido estava certo, mas o servidor falhou ao atender.", "a equipe do servidor (back-end, infraestrutura)", "5"]
    };
    var EXEMPLOS = {
      100: "Continue: pode mandar o resto do corpo", 101: "Switching Protocols: troca para WebSocket",
      200: "OK: deu certo e a resposta tem corpo", 201: "Created: o recurso foi criado (resposta de um POST)",
      204: "No Content: deu certo e não há corpo (comum no DELETE)", 301: "Moved Permanently: o endereço mudou de vez",
      302: "Found: endereço temporário", 304: "Not Modified: use a cópia que você já tem em cache",
      400: "Bad Request: o pedido está mal formado", 401: "Unauthorized: falta se identificar (login, token)",
      403: "Forbidden: identificado, mas sem permissão", 404: "Not Found: o recurso não existe",
      405: "Method Not Allowed: o método não vale nesse endereço", 415: "Unsupported Media Type: formato do corpo não aceito",
      422: "Unprocessable Content: dados com erro de validação", 429: "Too Many Requests: pedidos demais, espere",
      500: "Internal Server Error: o código do servidor quebrou", 502: "Bad Gateway: um servidor intermediário recebeu resposta inválida",
      503: "Service Unavailable: fora do ar ou sobrecarregado", 504: "Gateway Timeout: o servidor de trás demorou demais"
    };
    function mostrar() {
      var n = Math.round(Number(campo.value));
      box.querySelectorAll("[data-codigo-st]").forEach(function (b) { b.classList.toggle("ativa", Number(b.getAttribute("data-codigo-st")) === n); });
      if (!(n >= 100 && n <= 599)) {
        palco.innerHTML = '<div class="resultado-erro">Códigos de status vão de 100 a 599.</div>';
        escreverCodigo(saida, "// fora da faixa");
        return;
      }
      var fx = FAIXAS[String(n).charAt(0)];
      var ok = n >= 200 && n <= 299;
      palco.innerHTML = '<div class="st-grande st--' + fx[3] + '">' + n + '</div><div class="st-info"><h4>' + esc(fx[0]) + "</h4><p>" + esc(fx[1]) + "</p>" +
        (EXEMPLOS[n] ? "<p><b>" + esc(EXEMPLOS[n]) + "</b></p>" : "") + '<p class="st-quem">quem age: ' + esc(fx[2]) + "</p></div>";
      escreverCodigo(saida, "resposta.status   // " + n + "\nresposta.ok       // " + ok + (ok ? "  (só 200 a 299 dão true)" : "  (fetch NÃO rejeita: confira você)"));
    }
    box.querySelectorAll("[data-codigo-st]").forEach(function (b) {
      b.type = "button";
      b.classList.add("chamada");
      b.addEventListener("click", function () { campo.value = b.getAttribute("data-codigo-st"); mostrar(); });
    });
    campo.addEventListener("input", mostrar);
    mostrar();
  })();

  /* ---------- 06 · HTTPS: o que o intermediário vê ---------- */
  (function () {
    var box = document.querySelector("[data-https]");
    if (!box) return;
    var entrada = box.querySelector("textarea");
    var redeEl = box.querySelector("[data-na-rede]");
    var servEl = box.querySelector("[data-no-servidor]");
    var rotRede = box.querySelector("[data-rotulo-rede]");
    var botoes = box.querySelectorAll("[data-protocolo]");
    var adulterar = box.querySelector("[data-adulterar]");
    var protocolo = "http";
    var chave = null, ultimo = null;
    var temCripto = !!(window.crypto && crypto.subtle);
    var enc = new TextEncoder(), dec = new TextDecoder();

    function hex(bytes) {
      var s = "";
      for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16) + (i % 24 === 23 ? "\n" : " ");
      return s.trim();
    }

    async function cifrar() {
      if (!chave) chave = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var dados = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, chave, enc.encode(entrada.value)));
      return { iv: iv, dados: dados };
    }

    async function atualizar(mexer) {
      box.classList.toggle("https-seguro", protocolo === "https");
      botoes.forEach(function (b) { b.classList.toggle("ativa", b.getAttribute("data-protocolo") === protocolo); });
      if (protocolo === "http") {
        var bytes = enc.encode(entrada.value);
        if (mexer) {
          /* troca um caractere da senha no caminho: ninguém percebe */
          var t = entrada.value, i = t.lastIndexOf("girassol");
          var alterado = i === -1 ? t.replace(/.$/, "X") : t.slice(0, i) + "Girassol" + t.slice(i + 8);
          bytes = enc.encode(alterado);
        }
        rotRede.textContent = "o que passa pelo Wi-Fi (qualquer um na rede lê)";
        escreverCodigo(redeEl, dec.decode(bytes));
        servEl.className = "https-servidor";
        servEl.textContent = dec.decode(bytes) + (mexer ? "\n\n⚠ o servidor recebeu o texto alterado e não tem como saber" : "");
        return;
      }
      rotRede.textContent = "o que passa pelo Wi-Fi (cifrado com TLS)";
      if (!temCripto) {
        escreverCodigo(redeEl, "(este navegador não liberou a criptografia nesta página)");
        servEl.textContent = entrada.value;
        return;
      }
      if (!mexer || !ultimo) ultimo = await cifrar();
      var dados = ultimo.dados;
      if (mexer) { dados = dados.slice(); dados[7] ^= 1; }
      escreverCodigo(redeEl, hex(dados));
      redeEl.classList.add("cifrado");
      try {
        var claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ultimo.iv }, chave, dados);
        servEl.className = "https-servidor";
        servEl.textContent = dec.decode(claro);
      } catch (e) {
        servEl.className = "https-servidor https-rejeitado";
        servEl.textContent = "✖ mensagem rejeitada: 1 bit mudou no caminho e a verificação de integridade falhou (" + e.name + ")";
      }
    }

    botoes.forEach(function (b) {
      b.type = "button";
      b.addEventListener("click", function () { protocolo = b.getAttribute("data-protocolo"); redeEl.classList.remove("cifrado"); atualizar(false); });
    });
    adulterar.addEventListener("click", function () { atualizar(true); });
    entrada.addEventListener("input", function () { ultimo = null; redeEl.classList.remove("cifrado"); atualizar(false); });
    atualizar(false);
  })();

  /* ---------- 07 · síncrono x assíncrono: a página travada ---------- */
  (function () {
    var box = document.querySelector("[data-bloqueio]");
    if (!box) return;
    var relogio = box.querySelector("[data-relogio]");
    var bolinha = box.querySelector("[data-bolinha]");
    var cliques = box.querySelector("[data-cliques]");
    var log = box.querySelector("[data-log]");
    var n = 0, t0 = performance.now();

    (function quadro() {
      var t = performance.now() - t0;
      relogio.textContent = (t / 1000).toFixed(1).replace(".", ",") + " s";
      var pista = Math.max(0, bolinha.parentNode.clientWidth - 48);
      var x = pista ? (t / 3) % (2 * pista) : 0;
      bolinha.style.transform = "translateX(" + (x > pista ? 2 * pista - x : x) + "px)";
      requestAnimationFrame(quadro);
    })();

    function registrar(t, cls) {
      var d = document.createElement("div");
      d.className = "cl" + (cls ? " cl--" + cls : "");
      d.textContent = t;
      log.appendChild(d);
      while (log.children.length > 6) log.firstChild.remove();
    }

    registrar("a bolinha e o relógio só andam enquanto a página está livre", "vazio");

    box.querySelector("[data-clique]").addEventListener("click", function () {
      n++;
      cliques.textContent = n;
    });

    box.querySelector("[data-sincrono]").addEventListener("click", function () {
      registrar("síncrono: consultando… (a página inteira para)");
      var antes = n;
      setTimeout(function () {
        var inicio = performance.now();
        while (performance.now() - inicio < 2500) { /* espera ocupada: ninguém mais roda */ }
        registrar("síncrono: pronto. A tela ficou 2,5 s congelada", "warn");
        setTimeout(function () {
          if (n > antes) registrar("os " + (n - antes) + " cliques feitos durante a trava só foram atendidos agora", "warn");
        }, 0);
      }, 30);
    });

    box.querySelector("[data-assincrono]").addEventListener("click", function () {
      registrar("assíncrono: pedido enviado, a página continua livre");
      var antes = n;
      SRV.fetch("https://api.cinema.local/filmes").then(function () {
        return esperarMs(2000);
      }).then(function () {
        registrar("assíncrono: a resposta chegou. " + (n - antes) + " cliques atendidos enquanto isso", "ok");
      });
    });
  })();

  /* ---------- 08 · os estados de uma Promise ---------- */
  (function () {
    var box = document.querySelector("[data-promessa]");
    if (!box) return;
    var estadoEl = box.querySelector("[data-estado]");
    var valorEl = box.querySelector("[data-valor]");
    var log = box.querySelector("[data-log]");
    var p, resolver, rejeitar, estado;

    function registrar(t, cls) {
      var d = document.createElement("div");
      d.className = "cl" + (cls ? " cl--" + cls : "");
      d.textContent = t;
      log.appendChild(d);
      while (log.children.length > 7) log.firstChild.remove();
    }
    function pintar() {
      box.querySelectorAll(".estado").forEach(function (e) { e.classList.toggle("atual", e.getAttribute("data-e") === estado); });
      estadoEl.textContent = estado === "pendente" ? "pendente (pending)" : estado === "realizada" ? "realizada (fulfilled)" : "rejeitada (rejected)";
    }
    function nova() {
      estado = "pendente";
      valorEl.textContent = "ainda não há valor";
      p = new Promise(function (res, rej) { resolver = res; rejeitar = rej; });
      p.then(function (v) { estado = "realizada"; valorEl.textContent = "valor: " + JSON.stringify(v); pintar(); },
        function (e) { estado = "rejeitada"; valorEl.textContent = "motivo: " + e.name + ": " + e.message; pintar(); });
      log.innerHTML = "";
      registrar("const p = new Promise((resolve, reject) => { … })", "eco");
      registrar("estado: pendente");
      pintar();
    }
    function tentar(acao) {
      var antes = estado;
      registrar((acao === "ok" ? 'resolve("ingressos: 2")' : 'reject(new Error("sessão esgotada"))'), "eco");
      if (acao === "ok") resolver("ingressos: 2"); else rejeitar(new Error("sessão esgotada"));
      setTimeout(function () {
        if (antes !== "pendente") registrar("ignorado: a Promise já está " + antes + " e não volta atrás", "warn");
        else registrar("estado: " + estado, estado === "realizada" ? "ok" : "error");
      }, 0);
    }
    box.querySelector("[data-nova]").addEventListener("click", nova);
    box.querySelector("[data-resolver]").addEventListener("click", function () { tentar("ok"); });
    box.querySelector("[data-rejeitar]").addEventListener("click", function () { tentar("erro"); });
    nova();
  })();

  /* ======================================================
     7. LABORATÓRIO DE Intl.DateTimeFormat
     ====================================================== */

  function q(s) { return JSON.stringify(s); }

  (function () {
    var lab = document.querySelector("[data-lab-data]");
    if (!lab) return;
    var campos = Array.prototype.slice.call(lab.querySelectorAll("[data-campo]"));
    var palco = lab.querySelector("[data-palco]");
    var saida = lab.querySelector("[data-saida]");
    var ORDEM = ["weekday", "day", "month", "year", "hour", "minute", "hour12", "timeZone"];
    function atualizar() {
      var v = {};
      campos.forEach(function (c) { v[c.getAttribute("data-campo")] = c.value; });
      var op = {};
      ORDEM.forEach(function (k) { if (v[k]) op[k] = k === "hour12" ? v[k] === "true" : v[k]; });
      var chaves = Object.keys(op);
      var opTxt = chaves.length ? ", {\n" + chaves.map(function (k) { return "  " + k + ": " + (typeof op[k] === "string" ? q(op[k]) : String(op[k])); }).join(",\n") + "\n}" : "";
      var html, comentario;
      try {
        var texto = new Intl.DateTimeFormat(v.locale, op).format(new Date(v.instante));
        html = '<div class="resultado-grande resultado-grande--data">' + esc(texto) + "</div>";
        comentario = "// " + q(texto);
      } catch (e) {
        html = '<div class="resultado-erro">' + esc(e.name + ": " + e.message) + "</div>";
        comentario = "// " + e.name + ": a chamada lança erro";
      }
      palco.innerHTML = html;
      escreverCodigo(saida, "const quando = new Date(" + q(v.instante) + ");\nconst formatador = new Intl.DateTimeFormat(" + q(v.locale) + opTxt + ");\nformatador.format(quando);\n" + comentario);
    }
    campos.forEach(function (c) { c.addEventListener("input", atualizar); c.addEventListener("change", atualizar); });
    atualizar();
  })();

  /* ======================================================
     8. LABORATÓRIO LIVRE
     ====================================================== */

  var EXEMPLOS = {
    filmes: "// GET: buscar a lista, conferir ok e mostrar\nasync function listar() {\n  try {\n    const resposta = await fetch(\"https://api.cinema.local/filmes\");\n    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);\n    const filmes = await resposta.json();\n    for (const f of filmes) console.log(f.id, f.titulo, f.ano);\n  } catch (erro) {\n    console.error(\"Falhou:\", erro.message);\n  }\n}\nawait listar();",
    crud: "// POST, PATCH, PUT e DELETE no mesmo recurso\nconst base = \"https://api.cinema.local/filmes\";\nconst json = { \"Content-Type\": \"application/json\" };\n\nlet r = await fetch(base, { method: \"POST\", headers: json, body: JSON.stringify({ titulo: \"Aquarius\", ano: 2016 }) });\nconst criado = await r.json();\nconsole.log(\"POST  \", r.status, criado);\n\nr = await fetch(`${base}/${criado.id}`, { method: \"PATCH\", headers: json, body: JSON.stringify({ nota: 7.5 }) });\nconsole.log(\"PATCH \", r.status, await r.json());\n\nr = await fetch(`${base}/${criado.id}`, { method: \"PUT\", headers: json, body: JSON.stringify({ titulo: \"Aquarius\" }) });\nconsole.log(\"PUT   \", r.status, await r.json());\n\nr = await fetch(`${base}/${criado.id}`, { method: \"DELETE\" });\nconsole.log(\"DELETE\", r.status);\n\nr = await fetch(`${base}/${criado.id}`);\nconsole.log(\"GET   \", r.status, await r.json());",
    status: "// cada faixa de status: ok só é true em 2xx\nfor (const codigo of [200, 201, 204, 301, 400, 401, 403, 404, 500, 503]) {\n  const r = await fetch(`https://api.cinema.local/status/${codigo}`);\n  console.log(r.status, r.statusText.padEnd(22), \"ok:\", r.ok);\n}",
    token: "// HTTP não guarda estado: o token vai em todo pedido\nconst base = \"https://api.cinema.local\";\nconst r1 = await fetch(`${base}/login`, {\n  method: \"POST\",\n  headers: { \"Content-Type\": \"application/json\" },\n  body: JSON.stringify({ usuario: \"bia\", senha: \"1234\" })\n});\nconst { token } = await r1.json();\n\nconst comToken = await fetch(`${base}/perfil`, { headers: { Authorization: `Bearer ${token}` } });\nconsole.log(\"com token:\", comToken.status, await comToken.json());\n\nconst semToken = await fetch(`${base}/perfil`);\nconsole.log(\"sem token:\", semToken.status, await semToken.json());",
    ordem: "// qual linha aparece primeiro?\nconsole.log(\"A\");\nsetTimeout(() => console.log(\"B (timer)\"), 0);\nPromise.resolve().then(() => console.log(\"C (promise)\"));\nconsole.log(\"D\");",
    promise: "// criar uma Promise e acompanhar o estado\nfunction sortear() {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      const n = Math.random();\n      if (n > 0.5) resolve(n.toFixed(2));\n      else reject(new Error(`azar: ${n.toFixed(2)}`));\n    }, 500);\n  });\n}\n\nsortear()\n  .then(v => console.log(\"realizada com\", v))\n  .catch(e => console.warn(\"rejeitada:\", e.message))\n  .finally(() => console.log(\"fim (rode de novo)\"));",
    datas: "// um instante, vários fusos\nconst quando = new Date(\"2026-12-31T23:30:00Z\");\nfor (const timeZone of [\"UTC\", \"America/Sao_Paulo\", \"America/Manaus\", \"Europe/Lisbon\", \"Asia/Tokyo\"]) {\n  const f = new Intl.DateTimeFormat(\"pt-BR\", { dateStyle: \"short\", timeStyle: \"short\", timeZone });\n  console.log(timeZone.padEnd(18), f.format(quando));\n}",
    iife: "// IIFE com contador privado\nconst placar = (function () {\n  let pontos = 0;                  // ninguém de fora alcança\n  return {\n    marcar(n) { pontos += n; return pontos; },\n    ver() { return pontos; }\n  };\n})();\n\nplacar.marcar(3);\nplacar.marcar(2);\nconsole.log(placar.ver());\nconsole.log(typeof pontos);"
  };

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var seletor = pg.querySelector("[data-exemplos]");
    var consPg = criarConsole(pg.querySelector("[data-console]"));
    var redePg = criarRede(pg.querySelector("[data-painel-rede]"));
    var execPg = null;
    var rodarPg = function () {
      if (execPg) execPg.parar();
      consPg.limpar();
      redePg.limpar();
      execPg = executar(editor.value, { linha: consPg.linha, fim: consPg.fim, rede: redePg.req });
    };
    pg.querySelector("[data-rodar-pg]").addEventListener("click", rodarPg);
    editor.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarPg(); }
    });
    seletor.addEventListener("change", function () {
      if (EXEMPLOS[seletor.value]) { editor.value = EXEMPLOS[seletor.value]; rodarPg(); }
    });
    editor.value = EXEMPLOS.filmes;
    rodarPg();
  }

  /* ======================================================
     9. PERGUNTAS SIMULADAS

     <article data-questao data-correta="C">
       <ol class="alternativas"><li><button data-letra="A">…
       <div class="questao-explica" hidden>…
     Clicar numa alternativa marca a escolhida, mostra a certa
     e abre a explicação. O placar soma as respondidas.
     ====================================================== */

  (function () {
    var questoes = Array.prototype.slice.call(document.querySelectorAll("[data-questao]"));
    if (!questoes.length) return;
    var placar = document.querySelector("[data-placar]");
    var respondidas = 0, acertos = 0;

    function atualizarPlacar() {
      if (!placar) return;
      placar.innerHTML = "<b>" + acertos + "</b> acerto" + (acertos === 1 ? "" : "s") + " em <b>" + respondidas + "</b> de " + questoes.length + " respondidas";
    }

    questoes.forEach(function (qEl) {
      var correta = qEl.getAttribute("data-correta");
      var botoes = Array.prototype.slice.call(qEl.querySelectorAll("[data-letra]"));
      var explica = qEl.querySelector(".questao-explica");
      var refazer = qEl.querySelector("[data-refazer]");
      botoes.forEach(function (b) {
        b.type = "button";
        b.addEventListener("click", function () {
          if (qEl.classList.contains("respondida")) return;
          var acertou = b.getAttribute("data-letra") === correta;
          qEl.classList.add("respondida", acertou ? "acertou" : "errou");
          b.classList.add("escolhida");
          botoes.forEach(function (o) {
            o.disabled = true;
            if (o.getAttribute("data-letra") === correta) o.classList.add("certa");
            else if (o === b) o.classList.add("errada");
          });
          explica.hidden = false;
          respondidas++;
          if (acertou) acertos++;
          atualizarPlacar();
        });
      });
      if (refazer) {
        refazer.type = "button";
        refazer.addEventListener("click", function () {
          if (!qEl.classList.contains("respondida")) return;
          respondidas--;
          if (qEl.classList.contains("acertou")) acertos--;
          qEl.classList.remove("respondida", "acertou", "errou");
          botoes.forEach(function (o) { o.disabled = false; o.classList.remove("escolhida", "certa", "errada"); });
          explica.hidden = true;
          atualizarPlacar();
        });
      }
    });

    var zerar = document.querySelector("[data-zerar]");
    if (zerar) zerar.addEventListener("click", function () {
      questoes.forEach(function (qEl) { var r = qEl.querySelector("[data-refazer]"); if (r) r.click(); });
    });
    atualizarPlacar();
  })();
})();
