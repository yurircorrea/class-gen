/* =========================================================
   Aula: AJAX com fetch e Internacionalização com Intl
   aula.js - motor da aula em página única
   1. Colorização dos blocos de código (JS e HTML)
   2. Navegação: progresso, menu ativo, voltar ao topo
   3. Servidor simulado: responde como ViaCEP, JSONPlaceholder
      e AwesomeAPI, sem Internet
   4. Motor de execução: roda o código de um painel num quadro
      isolado e traz o console e a rede de volta para a página
   5. Consoles ao vivo, chamadas e o interruptor do servidor
   6. Demonstrações da Parte 1 (recarregar x AJAX, caminho,
      AJAX no dia a dia)
   7. Laboratórios da Parte 2 (locales, NumberFormat,
      DateTimeFormat, tempo relativo, formatToParts)
   8. Laboratório livre
   9. Resultado esperado da atividade

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
    "import|export|from|class|this|typeof|instanceof|true|false|null|undefined|NaN)\\b" +
    "|\\b((?:[A-Z]\\w*)?Error|Promise|JSON|Number|Intl|Date|Response|AbortSignal|AbortController|fetch|document|localStorage|navigator)\\b" +
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

  /* posição do // que começa um comentário (ignora // dentro de textos e de regex simples) */
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
    pre.innerHTML = fonte.split("\n").map(function (l) { return hlLinha(l, lang); }).join("\n");
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

     Esta função é autossuficiente: roda na própria página
     (demonstrações da Parte 1 e atividade) e é convertida em
     texto para rodar DENTRO de cada quadro de execução, onde
     substitui window.fetch.

     modo "simulado": tudo responde daqui, sem Internet.
     modo "internet": ViaCEP, JSONPlaceholder e AwesomeAPI vão
                      para a rede de verdade; as rotas /api/...
                      da aula continuam simuladas.
     modo "offline":  toda requisição falha como sem Internet.

     As respostas copiam as das APIs reais (consultadas em
     24/11/2026), inclusive "erro": "true" como texto na ViaCEP
     e o HTML devolvido com status 400 para CEP mal formado.
     ====================================================== */

  function servidor(W, cfg) {
    var REAIS = ["viacep.com.br", "jsonplaceholder.typicode.com", "economia.awesomeapi.com.br"];
    var original = W.fetch ? W.fetch.bind(W) : null;
    var pendentes = 0, contador = 0;
    var NOMES = { 200: "OK", 201: "Created", 400: "Bad Request", 404: "Not Found", 500: "Internal Server Error" };

    function end(cep, logradouro, complemento, unidade, bairro, localidade, uf, estado, regiao, ibge, gia, ddd, siafi) {
      return { cep: cep, logradouro: logradouro, complemento: complemento, unidade: unidade, bairro: bairro,
        localidade: localidade, uf: uf, estado: estado, regiao: regiao, ibge: ibge, gia: gia, ddd: ddd, siafi: siafi };
    }
    var CEPS = {
      "01001000": end("01001-000", "Praça da Sé", "lado ímpar", "", "Sé", "São Paulo", "SP", "São Paulo", "Sudeste", "3550308", "1004", "11", "7107"),
      "01310100": end("01310-100", "Avenida Paulista", "de 612 a 1510 - lado par", "", "Bela Vista", "São Paulo", "SP", "São Paulo", "Sudeste", "3550308", "1004", "11", "7107"),
      "20040002": end("20040-002", "Avenida Rio Branco", "de 128 a 144 - lado par", "", "Centro", "Rio de Janeiro", "RJ", "Rio de Janeiro", "Sudeste", "3304557", "", "21", "6001"),
      "70150900": end("70150-900", "Praça dos Três Poderes", "", "Presidência da República", "Zona Cívico-Administrativa", "Brasília", "DF", "Distrito Federal", "Centro-Oeste", "5300108", "", "61", "9701"),
      "85851010": end("85851-010", "Rua Almirante Barroso", "", "", "Centro", "Foz do Iguaçu", "PR", "Paraná", "Sul", "4108304", "", "45", "7563"),
      "30130010": end("30130-010", "Praça Sete de Setembro", "", "", "Centro", "Belo Horizonte", "MG", "Minas Gerais", "Sudeste", "3106200", "", "31", "4123")
    };

    var POST1 = {
      userId: 1, id: 1,
      title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
    };

    var COTACOES = {
      USD: ["Dólar Americano/Real Brasileiro", 5.9048],
      EUR: ["Euro/Real Brasileiro", 6.4732]
    };

    var PRODUTOS = ["Caderno universitário", "Caneta azul", "Caneca de café", "Cabo USB-C", "Calculadora científica",
      "Camiseta da turma", "Mochila escolar", "Monitor de 24 polegadas", "Mouse sem fio", "Teclado mecânico",
      "Fone de ouvido", "Garrafa térmica", "Lápis de cor", "Livro de JavaScript", "Luminária de mesa",
      "Agenda 2027", "Apontador", "Borracha branca", "Pen drive de 64 GB", "Régua de 30 cm"];

    var curtidas = { total: 41, eu: false };
    var CHAT = [["Bia", "Alguém já fez o buscador de CEP?"], ["Caio", "Fiz! A resposta chega em menos de um segundo."],
      ["Bia", "O meu volta erro: \"true\" com 99999-999"], ["Dani", "É assim mesmo: confira dados.erro."],
      ["Caio", "E lembra que 404 não cai no catch."], ["Bia", "Valeu, funcionou!"], ["Dani", "Agora vou formatar o frete com Intl."]];
    var mensagens = [{ id: 1, autor: CHAT[0][0], texto: CHAT[0][1] }, { id: 2, autor: CHAT[1][0], texto: CHAT[1][1] }];
    var ultimaMensagem = Date.now();

    var dataSP = new W.Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    });
    var horaSP = new W.Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "medium" });
    var brl = new W.Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    function json(status, obj) { return { status: status, corpo: JSON.stringify(obj, null, 2), tipo: "application/json; charset=utf-8" }; }
    function html(status, texto) { return { status: status, corpo: texto, tipo: "text/html; charset=utf-8" }; }
    /* A ViaCEP real responde 400 SEM o cabeçalho Access-Control-Allow-Origin:
       o navegador bloqueia a leitura (CORS) e o fetch rejeita com TypeError,
       igual a uma falha de rede. O simulador faz o mesmo. */
    function html400() {
      var r = html(400, "<html lang=\"pt-br\"><body><h1>Http 400</h1></body></html>");
      r.semCors = true;
      return r;
    }
    function ler(corpo, tipo) {
      if (!corpo) return {};
      if (/json/i.test(tipo)) { try { return JSON.parse(corpo); } catch (e) { return null; } }
      /* como o JSONPlaceholder: só entende JSON e formulário; texto puro é ignorado */
      if (!/x-www-form-urlencoded/i.test(tipo)) return {};
      var o = {};
      new W.URLSearchParams(corpo).forEach(function (v, k) { o[k] = v; });
      return o;
    }
    function post(id) {
      if (id === 1) return JSON.parse(JSON.stringify(POST1));
      return { userId: Math.ceil(id / 10), id: id, title: "título do post " + id, body: "texto do post " + id };
    }
    function semAcento(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
    function frete(cep) {
      var soma = cep.split("").reduce(function (a, d) { return a + Number(d); }, 0);
      return { cep: cep, prazoDias: 2 + (soma % 7), valor: Math.round((12 + (soma % 30) + 0.9) * 100) / 100 };
    }
    function paginaLoja(cep) {
      var f = /^\d{8}$/.test(cep) ? frete(cep) : null;
      var textoFrete = !cep ? "Informe o CEP para calcular o frete." :
        f ? "Frete para " + cep.slice(0, 5) + "-" + cep.slice(5) + ": " + brl.format(f.valor) + " · chega em " + f.prazoDias + " dias úteis" : "CEP inválido.";
      return "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n<title>Mochila escolar · Loja da Turma</title>\n" +
        "<link rel=\"stylesheet\" href=\"/css/loja.css\">\n<script src=\"/js/loja.js\" defer><\/script>\n</head>\n<body>\n" +
        "<header class=\"loja-topo\"><b>Loja da Turma</b><span class=\"loja-relogio\">página montada às " + horaSP.format(new Date()) + "</span></header>\n" +
        "<nav class=\"loja-menu\"><a href=\"/\">Início</a> · <a href=\"/mochilas\">Mochilas</a> · <a href=\"/cadernos\">Cadernos</a> · <a href=\"/ofertas\">Ofertas</a></nav>\n" +
        "<main>\n<div class=\"loja-produto\"><div class=\"loja-foto\"></div><div><h4>Mochila escolar</h4>" +
        "<div class=\"loja-preco\">" + brl.format(189.9) + " à vista</div></div></div>\n" +
        "<form class=\"loja-frete\" action=\"/produto/mochila\" method=\"get\">" +
        "<input name=\"cep\" value=\"" + cep + "\" placeholder=\"CEP\" aria-label=\"CEP\"> <button class=\"btn\">calcular frete</button></form>\n" +
        "<div class=\"loja-saida\">" + textoFrete + "</div>\n" +
        "<label class=\"loja-obs\">Observação para a entrega<textarea name=\"obs\"></textarea></label>\n</main>\n" +
        "<footer>Loja da Turma · Atendimento de segunda a sexta · Trocas em até 7 dias</footer>\n</body>\n</html>";
    }

    function cotacao(par) {
      var m = par.match(/^([A-Z]{3})-([A-Z]{3})$/);
      if (!m || m[2] !== "BRL" || !COTACOES[m[1]]) return null;
      var c = COTACOES[m[1]];
      var bid = c[1] * (1 + (Math.random() - 0.5) * 0.004);
      var pct = (Math.random() - 0.5) * 1.2;
      var quando = new Date(Date.now() - 25000 - Math.round(Math.random() * 60000));
      return {
        code: m[1], codein: "BRL", name: c[0],
        high: (bid * 1.008).toFixed(4), low: (bid * 0.991).toFixed(4),
        varBid: (bid * pct / 100).toFixed(4), pctChange: pct.toFixed(6),
        bid: bid.toFixed(4), ask: (bid + 0.001).toFixed(4),
        timestamp: String(Math.floor(quando.getTime() / 1000)), create_date: dataSP.format(quando)
      };
    }

    function rotear(metodo, u, corpo, tipo) {
      var host = u.hostname, caminho = u.pathname, m, id, dados;

      if (host === "viacep.com.br") {
        m = caminho.match(/^\/ws\/([^/]*)\/json\/?$/);
        if (!m || metodo !== "GET") return html400();
        var cep = decodeURIComponent(m[1]);
        if (!/^\d{8}$/.test(cep)) return html400();
        return json(200, CEPS[cep] || { erro: "true" });
      }

      if (host === "jsonplaceholder.typicode.com") {
        m = caminho.match(/^\/posts(?:\/(\d+))?\/?$/);
        if (!m) return json(404, {});
        dados = ler(corpo, tipo);
        /* como o real: corpo que diz ser JSON e não é derruba o servidor (500) */
        if (dados === null) return html(500, "SyntaxError: " + JSON.stringify(corpo) + " is not valid JSON\n    at JSON.parse (<anonymous>)");
        if (!m[1]) {
          if (metodo === "POST") return json(201, Object.assign({}, dados, { id: 101 }));
          if (metodo === "GET") {
            var lim = Math.min(100, Number(u.searchParams.get("_limit")) || 100), lista = [];
            for (var i = 1; i <= lim; i++) lista.push(post(i));
            return json(200, lista);
          }
          return json(404, {});
        }
        id = Number(m[1]);
        if (id < 1 || id > 100) return json(404, {});
        if (metodo === "GET") return json(200, post(id));
        if (metodo === "PUT") return json(200, Object.assign({}, dados, { id: id }));
        if (metodo === "PATCH") return json(200, Object.assign(post(id), dados));
        if (metodo === "DELETE") return json(200, {});
        return json(404, {});
      }

      if (host === "economia.awesomeapi.com.br") {
        m = caminho.match(/^\/json\/last\/([A-Za-z,-]+)\/?$/);
        if (!m) return json(404, { status: 404, code: "NotFound", message: "rota não encontrada" });
        var saida = {}, pares = m[1].toUpperCase().split(",");
        for (var k = 0; k < pares.length; k++) {
          var c = cotacao(pares[k]);
          if (!c) return json(404, { status: 404, code: "CoinNotExists", message: "moeda nao encontrada " + pares[k] });
          saida[c.code + c.codein] = c;
        }
        return json(200, saida);
      }

      if (REAIS.indexOf(host) === -1) {
        /* rotas da própria aula: um servidor de mentira para as demonstrações */
        if (caminho === "/api/produtos" && metodo === "GET") {
          var busca = semAcento(u.searchParams.get("busca") || "").trim();
          if (!busca) return json(200, []);
          return json(200, PRODUTOS.filter(function (p) {
            return semAcento(p).split(" ").some(function (pal) { return pal.indexOf(busca) === 0; }) || semAcento(p).indexOf(busca) === 0;
          }).slice(0, 6));
        }
        if (caminho === "/api/curtidas") {
          if (metodo === "POST") { curtidas.eu = !curtidas.eu; curtidas.total += curtidas.eu ? 1 : -1; }
          return json(200, { total: curtidas.total, curtiu: curtidas.eu });
        }
        if (caminho === "/api/mensagens" && metodo === "GET") {
          if (Date.now() - ultimaMensagem > 4200) {
            var prox = CHAT[mensagens.length % CHAT.length];
            mensagens.push({ id: mensagens.length + 1, autor: prox[0], texto: prox[1] });
            ultimaMensagem = Date.now();
          }
          var depois = Number(u.searchParams.get("depois")) || 0;
          return json(200, mensagens.filter(function (x) { return x.id > depois; }));
        }
        if (caminho === "/api/frete" && metodo === "GET") {
          var cf = (u.searchParams.get("cep") || "").replace(/\D/g, "");
          if (!/^\d{8}$/.test(cf)) return json(400, { erro: "CEP inválido" });
          return json(200, frete(cf));
        }
        if (caminho === "/produto/mochila" && metodo === "GET") {
          return html(200, paginaLoja((u.searchParams.get("cep") || "").replace(/\D/g, "")));
        }
        if (/^\/(api|produto)\//.test(caminho)) return json(404, { erro: "rota não existe" });
      }
      return null;
    }

    function motivo(s) {
      return s.reason !== undefined ? s.reason : new W.DOMException("signal is aborted without reason", "AbortError");
    }
    function esperar(ms, sinal) {
      return new Promise(function (ok, falha) {
        if (sinal && sinal.aborted) { falha(motivo(sinal)); return; }
        var t = setTimeout(ok, ms);
        if (sinal) sinal.addEventListener("abort", function () { clearTimeout(t); falha(motivo(sinal)); }, { once: true });
      });
    }
    function latencia() { return cfg.latencia ? Number(cfg.latencia) : 320 + Math.round(Math.random() * 380); }
    function avisar(reg) {
      if (cfg.avisar) cfg.avisar({ n: reg.n, metodo: reg.metodo, url: reg.url, status: reg.status, ms: reg.ms });
    }

    function responder(r, url) {
      var resp = new W.Response(r.corpo, { status: r.status, statusText: NOMES[r.status] || "", headers: { "Content-Type": r.tipo } });
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
      var modo = cfg.modo || "simulado";
      var real = modo === "internet" && original && REAIS.indexOf(url.hostname) !== -1;
      var p;
      avisar(reg);
      pendentes++;
      if (modo === "offline") {
        p = esperar(180 + Math.round(Math.random() * 120), op.signal).then(function () { throw new TypeError("Failed to fetch"); });
      } else if (real) {
        p = original(entrada, op);
      } else {
        p = esperar(latencia(), op.signal).then(function () {
          var corpo = op.body === undefined || op.body === null ? "" : String(op.body);
          var tipo = "";
          try { tipo = new W.Headers(op.headers || {}).get("content-type") || ""; } catch (e) { tipo = ""; }
          if (!tipo && corpo) tipo = "text/plain;charset=UTF-8";
          var r = rotear(metodo, url, corpo, tipo);
          if (!r) throw new TypeError("Failed to fetch");
          if (r.semCors) { reg.cors = r.status; throw new TypeError("Failed to fetch"); }
          return responder(r, url.href);
        });
      }
      return p.then(function (resp) {
        pendentes--; reg.status = resp.status; reg.ms = Date.now() - t0; avisar(reg);
        return resp;
      }, function (e) {
        pendentes--; reg.ms = Date.now() - t0;
        reg.status = reg.cors ? reg.cors + " · CORS" :
          e && (e.name === "AbortError" || e.name === "TimeoutError") ? "cancelado" : "falhou";
        avisar(reg);
        throw e;
      });
    }

    return { fetch: buscar, pendentes: function () { return pendentes; } };
  }

  var SERVIDOR_SRC = servidor.toString();

  /* ======================================================
     4. MOTOR DE EXECUÇÃO

     Cada execução cria um quadro (iframe srcdoc) com:
       a preparação (console e erros voltam para a página),
       o servidor simulado no lugar de window.fetch e
       o código do painel dentro de uma função async, para
       aceitar await direto como no console do navegador.
     ====================================================== */

  /* Esta função é convertida em texto e roda DENTRO do quadro. */
  function prepararQuadro(ID, TELA) {
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
      if (typeof Response !== "undefined" && v instanceof Response) return "Response { status: " + v.status + ", ok: " + v.ok + ", url: '" + v.url + "' }";
      if (typeof Headers !== "undefined" && v instanceof Headers) return "Headers {}";
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
        setTimeout(function () { if (!fimEnviado) { fimEnviado = true; enviar({ nivel: "fim" }); } }, 90);
      })();
    };
    if (TELA) {
      var medir = function () { enviar({ nivel: "altura", altura: Math.ceil(document.body.getBoundingClientRect().height) + 2 }); };
      window.addEventListener("load", medir);
      new ResizeObserver(medir).observe(document.body);
    }
  }

  var PREPARO = "(" + prepararQuadro.toString() + ")";

  var ESTILO_TELA =
    "*{box-sizing:border-box}body{margin:0;padding:18px 20px;font:17px/1.45 Arial,Helvetica,sans-serif;color:#000;background:#fff}" +
    "body>*:last-child{margin-bottom:0}" +
    "form,.grade{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px 12px;margin:0}" +
    "label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:15px;grid-column:span 2}" +
    "label.c1{grid-column:span 1}label.c3{grid-column:span 3}label.c4{grid-column:span 4}label.c6{grid-column:span 6}" +
    "input{font:17px ui-monospace,Consolas,monospace;padding:7px 9px;border:1px solid #98A2A9;border-radius:8px;min-width:0;width:100%;background:#fff}" +
    "input[readonly]{background:#F6F8F7}" +
    "input.preenchido{outline:2px dashed #00E88F;outline-offset:1px;background:rgba(0,232,143,.08)}" +
    "button{font:700 15px ui-monospace,Consolas,monospace;padding:8px 14px;border-radius:8px;border:2px solid #0A2A1E;background:#00E88F;cursor:pointer;align-self:end}" +
    "button:disabled{opacity:.5;cursor:wait}" +
    ".msg{grid-column:1/-1;margin:4px 0 0;min-height:1.45em}" +
    ".ok{color:#0E7A4B;font-weight:700}.erro{color:#8C2F1F;font-weight:700}.espera{color:#5B6660;font-style:italic}" +
    ".cartoes{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:0 0 12px}" +
    ".cartao{border:1px solid #DFE4E1;border-radius:12px;padding:12px 16px}" +
    ".cartao small{display:block;font:12px ui-monospace,Consolas,monospace;letter-spacing:.8px;text-transform:uppercase;color:#5B6660}" +
    ".cartao b{display:block;font:700 32px 'Arial Narrow',Arial,sans-serif;margin:4px 0 2px}" +
    ".cartao span{font-size:15px;color:#5B6660}" +
    ".sobe{color:#0E7A4B!important}.desce{color:#8C2F1F!important}" +
    "table{border-collapse:collapse;width:100%;font-size:16px}td,th{padding:6px 10px;border-bottom:1px solid #DFE4E1;text-align:left}th{font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:#5B6660}.num{text-align:right;white-space:nowrap}" +
    ".pedido{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.pedido div{border:1px solid #DFE4E1;border-radius:10px;padding:10px 14px}" +
    ".pedido small{display:block;font:12px ui-monospace,Consolas,monospace;text-transform:uppercase;color:#5B6660}.pedido b{font-size:20px}" +
    "ul{margin:6px 0 0;padding-left:20px}";

  var MODO = "simulado";
  try { MODO = localStorage.getItem("aula-ajax-intl-modo") === "internet" ? "internet" : "simulado"; } catch (e) { MODO = "simulado"; }

  var execucoes = {};
  var contador = 0;

  /* codigo: texto a rodar. op: { linha(nivel, texto), rede(req), fim(), tela, html, modo, latencia } */
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
    var cfg = { modo: op.modo || MODO, latencia: op.latencia || 0, base: "https://aula.local/" };
    var preparo = "<script>" + PREPARO + "(" + JSON.stringify(id) + "," + (op.tela ? "true" : "false") + ");" +
      "window.__srv=(" + SERVIDOR_SRC + ")(window," + JSON.stringify(cfg).replace(/\}$/, ",avisar:window.__avisar}") + ");" +
      "window.fetch=window.__srv.fetch;<\/script>";
    var codigoSeguro = codigo.replace(/<\/script/gi, "<\\/script");
    var corpo = "<script>window.__comecou=true;(async () => {\n" + codigoSeguro +
      "\n})().catch(function (e) { setTimeout(function () { throw e; }); }).finally(function () { window.__fim(); });\n<\/script>" +
      "<script>setTimeout(function(){ if (!window.__comecou) window.__fim(); }, 0);<\/script>";
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
       <button data-chamada="buscarCep('01001000');"></button>   (opcional)
       data-rede="offline" na chamada: roda sem Internet
       data-latencia="5000" na chamada: servidor lento
       <div class="console" data-console data-tempo></div>
       <div data-painel-rede></div>                                  (opcional)
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
    return [st, /^4/.test(st) ? "4" : "x"];
  }

  function criarRede(el) {
    if (!el) return null;
    el.classList.add("rede");
    el.innerHTML = '<div class="rede-topo"><span>rede · requisições deste exemplo</span><span>' +
      (el.getAttribute("data-rotulo") || "método · status · endereço · tempo") + "</span></div>";
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

  var reexecutaveis = [];

  document.querySelectorAll("[data-exec]").forEach(function (el) {
    var idCodigo = el.getAttribute("data-codigo");
    var pre = idCodigo ? document.getElementById(idCodigo) : el.querySelector("pre.codigo");
    var preHtml = el.getAttribute("data-html") ? document.getElementById(el.getAttribute("data-html")) : null;
    var tela = el.querySelector("[data-tela]");
    var cons = el.querySelector("[data-console]") ? criarConsole(el.querySelector("[data-console]")) : null;
    var rede = criarRede(el.querySelector("[data-painel-rede]"));
    var botoes = Array.prototype.slice.call(el.querySelectorAll("[data-chamada]"));
    var atual = null;

    function rodar(botao) {
      if (atual) atual.parar();
      var chamada = botao ? botao.getAttribute("data-chamada") : "";
      var modo = botao && botao.getAttribute("data-rede") === "offline" ? "offline" : null;
      var latencia = botao && botao.getAttribute("data-latencia") ? Number(botao.getAttribute("data-latencia")) : 0;
      if (latencia && !modo) modo = "simulado";
      if (cons) {
        cons.limpar();
        if (chamada && !el.hasAttribute("data-sem-eco")) {
          cons.eco(chamada + (modo === "offline" ? "   (sem internet)" : latencia ? "   (servidor lento, simulado)" : ""));
        }
      }
      if (rede) rede.limpar();
      var codigo = fonteDe(pre) + (chamada ? "\n" + chamada : "");
      atual = executar(codigo, {
        linha: cons ? cons.linha : null, fim: cons ? cons.fim : null,
        rede: rede ? rede.req : null,
        /* <script src> do HTML exibido não roda no quadro: o código vem do painel */
        tela: tela, html: preHtml ? fonteDe(preHtml).replace(/<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi, "") : "",
        modo: modo, latencia: latencia
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

    var inicial = function () {
      var ativo = botoes.filter(function (b) { return b.classList.contains("ativa"); })[0];
      if (!ativo && botoes.length) { ativo = botoes[0]; ativo.classList.add("ativa"); }
      rodar(ativo || null);
    };
    reexecutaveis.push(inicial);
    inicial();
  });

  /* ---------- interruptor do servidor ---------- */

  var CFG_PAGINA = { modo: MODO };
  var SRV = servidor(window, CFG_PAGINA);
  var botaoModo = document.querySelector("[data-modo-rede]");

  function mostrarModo() {
    if (!botaoModo) return;
    botaoModo.setAttribute("data-modo", MODO);
    botaoModo.querySelector("[data-modo-texto]").textContent = MODO === "internet" ? "APIs reais (Internet)" : "servidor simulado";
    botaoModo.title = MODO === "internet"
      ? "As requisições vão para a ViaCEP, o JSONPlaceholder e a AwesomeAPI de verdade. Clique para voltar ao servidor simulado."
      : "As respostas vêm de um servidor simulado nesta página, iguais às das APIs reais. Clique para usar a Internet.";
  }
  mostrarModo();
  if (botaoModo) {
    botaoModo.addEventListener("click", function () {
      MODO = MODO === "internet" ? "simulado" : "internet";
      CFG_PAGINA.modo = MODO;
      try { localStorage.setItem("aula-ajax-intl-modo", MODO); } catch (e) { /* sem armazenamento */ }
      mostrarModo();
      reexecutaveis.forEach(function (f) { f(); });
    });
  }

  /* ======================================================
     6. DEMONSTRAÇÕES DA PARTE 1
     ====================================================== */

  var brlPagina = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var bytesFmt = new Intl.NumberFormat("pt-BR");
  function bytes(t) { return new Blob([t]).size; }
  function esperarMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- 01 · recarregar tudo x só os dados ---------- */
  (function () {
    var box = document.querySelector("[data-recarregar]");
    if (!box) return;
    var classico = box.querySelector("[data-classico]");
    var ajax = box.querySelector("[data-ajax]");
    var parser = new DOMParser();
    var totais = { classico: [0, 0], ajax: [0, 0] };

    function contar(lado, n) {
      totais[lado][0]++; totais[lado][1] += n;
      box.querySelector('[data-cont="' + lado + '"]').innerHTML =
        "<span>requisições: <b>" + totais[lado][0] + "</b></span><span>recebido: <b>" + bytesFmt.format(totais[lado][1]) + " bytes</b></span>" +
        "<span>última: <b>" + bytesFmt.format(n) + " bytes</b></span>";
    }

    function montarClassico(htmlTexto) {
      var doc = parser.parseFromString(htmlTexto, "text/html");
      var corpo = classico.querySelector(".janela-corpo");
      corpo.innerHTML = "";
      ["header", "main"].forEach(function (sel) {
        var n = doc.querySelector(sel);
        if (n) corpo.appendChild(document.importNode(n, true));
      });
      ligarClassico();
    }

    function ligarClassico() {
      var form = classico.querySelector("form");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var cep = form.querySelector("input").value.replace(/\D/g, "");
        var corpo = classico.querySelector(".janela-corpo");
        var url = "/produto/mochila?cep=" + cep;
        classico.querySelector(".janela-url").textContent = "loja.exemplo" + url;
        corpo.classList.add("piscando");
        SRV.fetch(url).then(function (r) { return r.text(); }).then(function (t) {
          contar("classico", bytes(t));
          return esperarMs(120).then(function () { montarClassico(t); corpo.classList.remove("piscando"); });
        });
      });
    }

    function ligarAjax() {
      var form = ajax.querySelector("form");
      var saidaEl = ajax.querySelector(".loja-saida");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var cep = form.querySelector("input").value.replace(/\D/g, "");
        saidaEl.textContent = "calculando…";
        SRV.fetch("/api/frete?cep=" + cep).then(function (r) {
          return r.text().then(function (t) { contar("ajax", bytes(t)); return { ok: r.ok, dados: JSON.parse(t) }; });
        }).then(function (x) {
          saidaEl.textContent = x.ok
            ? "Frete para " + cep.slice(0, 5) + "-" + cep.slice(5) + ": " + brlPagina.format(x.dados.valor) + " · chega em " + x.dados.prazoDias + " dias úteis"
            : "CEP inválido.";
          saidaEl.classList.remove("mudou"); void saidaEl.offsetWidth; saidaEl.classList.add("mudou");
        });
      });
    }

    /* as duas janelas começam com a mesma página, vinda do servidor */
    SRV.fetch("/produto/mochila?cep=").then(function (r) { return r.text(); }).then(function (t) {
      montarClassico(t);
      var doc = parser.parseFromString(t, "text/html");
      var corpo = ajax.querySelector(".janela-corpo");
      ["header", "main"].forEach(function (sel) { corpo.appendChild(document.importNode(doc.querySelector(sel), true)); });
      ligarAjax();
      box.querySelectorAll("form input").forEach(function (i) { i.value = "01001-000"; });
      box.querySelectorAll("textarea").forEach(function (t) { t.value = "Deixar na portaria, por favor."; });
    });
  })();

  /* ---------- 03 · o caminho de uma requisição ---------- */
  (function () {
    var box = document.querySelector("[data-caminho]");
    if (!box) return;
    var etapas = Array.prototype.slice.call(box.querySelectorAll(".etapa"));
    var campo = box.querySelector("#caminho-cep");
    var saidaJson = box.querySelector("[data-json]");
    var msg = box.querySelector("[data-msg]");
    var campos = { logradouro: box.querySelector("#caminho-rua"), bairro: box.querySelector("#caminho-bairro"),
      localidade: box.querySelector("#caminho-cidade"), uf: box.querySelector("#caminho-uf") };
    var vez = 0;

    function marcar(n, falhou) {
      etapas.forEach(function (e, i) {
        e.classList.toggle("feita", i < n - 1);
        e.classList.toggle("ativa", i === n - 1 && !falhou);
        e.classList.toggle("falhou", i === n - 1 && !!falhou);
      });
    }
    function limparCampos() {
      Object.keys(campos).forEach(function (k) { campos[k].value = ""; campos[k].classList.remove("preenchido"); });
    }

    function buscar() {
      var minha = ++vez;
      var cep = campo.value.replace(/\D/g, "");
      limparCampos();
      saidaJson.textContent = "";
      msg.className = "form-msg espera";
      msg.textContent = "1 · o campo perdeu o foco: o evento blur disparou";
      marcar(1);
      esperarMs(650).then(function () {
        if (minha !== vez) return;
        var url = "https://viacep.com.br/ws/" + cep + "/json/";
        marcar(2);
        msg.textContent = "2 · fetch pediu GET " + url + " (a página continua funcionando)";
        return SRV.fetch(url).then(function (r) {
          return r.text().then(function (t) { return { r: r, t: t }; });
        }).then(function (x) {
          if (minha !== vez) return;
          marcar(3);
          saidaJson.textContent = "status " + x.r.status + "\n" + x.t;
          msg.textContent = "3 · o servidor respondeu com status " + x.r.status;
          return esperarMs(900).then(function () {
            if (minha !== vez) return;
            if (!x.r.ok) { marcar(4, true); msg.className = "form-msg erro"; msg.textContent = "4 · CEP mal formado: digite 8 números."; return; }
            var dados = JSON.parse(x.t);
            if (dados.erro) { marcar(4, true); msg.className = "form-msg erro"; msg.textContent = "4 · CEP não encontrado."; return; }
            marcar(4);
            Object.keys(campos).forEach(function (k) { campos[k].value = dados[k]; campos[k].classList.add("preenchido"); });
            msg.className = "form-msg ok";
            msg.textContent = "4 · só estes quatro campos mudaram. A página não recarregou.";
          });
        }, function (e) {
          if (minha !== vez) return;
          marcar(2, true);
          msg.className = "form-msg erro";
          msg.textContent = "2 · o fetch rejeitou (" + e.message + "): CEP mal formado ou sem conexão";
        });
      });
    }

    campo.addEventListener("blur", buscar);
    campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); campo.blur(); } });
    box.querySelectorAll("[data-cep]").forEach(function (b) {
      b.addEventListener("click", function () { campo.value = b.getAttribute("data-cep"); buscar(); });
    });
    reexecutaveis.push(function () { marcar(0); limparCampos(); saidaJson.textContent = ""; msg.textContent = ""; });
    /* roda uma vez sozinho quando a seção aparece na tela */
    var jaRodou = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !jaRodou) { jaRodou = true; buscar(); }
    }, { threshold: 0.4 }).observe(box);
  })();

  /* ---------- 04 · AJAX no dia a dia ---------- */
  (function () {
    /* sugestões de busca */
    var sug = document.querySelector("[data-sugestoes]");
    if (sug) {
      var entrada = sug.querySelector("input");
      var lista = sug.querySelector("ul");
      var cont = sug.querySelector("[data-contador]");
      var nReq = 0, espera = null, ultima = 0;
      var mostrar = function (itens, termo) {
        if (!termo) { lista.innerHTML = '<li class="vazio">digite para ver sugestões</li>'; return; }
        if (!itens.length) { lista.innerHTML = '<li class="vazio">nenhum produto começa com “' + esc(termo) + "”</li>"; return; }
        lista.innerHTML = itens.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
      };
      entrada.addEventListener("input", function () {
        clearTimeout(espera);
        var termo = entrada.value.trim();
        espera = setTimeout(function () {
          if (!termo) { mostrar([], ""); return; }
          var minha = ++ultima;
          nReq++;
          cont.textContent = nReq + " requisição(ões) até agora · espera 250 ms depois da última tecla";
          SRV.fetch("/api/produtos?busca=" + encodeURIComponent(termo)).then(function (r) { return r.json(); }).then(function (itens) {
            if (minha === ultima) mostrar(itens, termo);
          });
        }, 250);
      });
      mostrar([], "");
    }

    /* curtir */
    var cur = document.querySelector("[data-curtir]");
    if (cur) {
      var botao = cur.querySelector("button");
      var total = cur.querySelector("[data-total]");
      SRV.fetch("/api/curtidas").then(function (r) { return r.json(); }).then(function (d) { total.textContent = d.total; });
      botao.addEventListener("click", function () {
        botao.disabled = true;
        SRV.fetch("/api/curtidas", { method: "POST" }).then(function (r) { return r.json(); }).then(function (d) {
          total.textContent = d.total;
          botao.classList.toggle("on", d.curtiu);
          botao.textContent = d.curtiu ? "curtido" : "curtir";
          botao.disabled = false;
        });
      });
    }

    /* chat: pergunta ao servidor a cada 2,5 s, só enquanto aparece na tela */
    var chat = document.querySelector("[data-chat]");
    if (chat) {
      var caixa = chat.querySelector(".chat");
      var contChat = chat.querySelector("[data-contador]");
      var ultimoId = 0, consultas = 0, visivel = false, timer = null;
      var consultar = function () {
        consultas++;
        SRV.fetch("/api/mensagens?depois=" + ultimoId).then(function (r) { return r.json(); }).then(function (novas) {
          novas.forEach(function (m) {
            var d = document.createElement("div");
            d.className = "msg" + (ultimoId ? " nova" : "");
            d.innerHTML = "<b>" + esc(m.autor) + "</b>" + esc(m.texto);
            caixa.appendChild(d);
            ultimoId = m.id;
          });
          if (caixa.children.length > 12) caixa.removeChild(caixa.firstChild);
          caixa.scrollTop = caixa.scrollHeight;
          contChat.textContent = consultas + " consulta(s) ao servidor · " + (novas.length ? novas.length + " mensagem(ns) nova(s) na última" : "nada novo na última");
        });
      };
      var agendar = function () { clearTimeout(timer); if (visivel) timer = setTimeout(function () { consultar(); agendar(); }, 2500); };
      new IntersectionObserver(function (es) {
        visivel = es[0].isIntersecting;
        if (visivel && !consultas) consultar();
        agendar();
      }).observe(chat);
    }

    /* CEP em uma linha */
    var mini = document.querySelector("[data-mini-cep]");
    if (mini) {
      var inp = mini.querySelector("input");
      var out = mini.querySelector("[data-saida-cep]");
      var buscarMini = function () {
        var cep = inp.value.replace(/\D/g, "");
        out.textContent = "buscando…";
        SRV.fetch("https://viacep.com.br/ws/" + cep + "/json/").then(function (r) {
          if (!r.ok) throw new Error("CEP mal formado");
          return r.json();
        }).then(function (d) {
          out.textContent = d.erro ? "CEP não encontrado" : d.logradouro + " · " + d.bairro + " · " + d.localidade + "/" + d.uf;
        }, function (e) { out.textContent = e.message; });
      };
      inp.addEventListener("blur", buscarMini);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } });
      buscarMini();
      reexecutaveis.push(buscarMini);
    }
  })();

  /* ======================================================
     7. LABORATÓRIOS DA PARTE 2 (Intl de verdade, nesta página)
     ====================================================== */

  function q(s) { return JSON.stringify(s); }

  /* monta o objeto de opções como o aluno escreveria */
  function opcoesTexto(op, recuo) {
    var chaves = Object.keys(op);
    if (!chaves.length) return "";
    recuo = recuo || "  ";
    return ", {\n" + chaves.map(function (k) {
      return recuo + k + ": " + (typeof op[k] === "string" ? q(op[k]) : String(op[k]));
    }).join(",\n") + "\n}";
  }

  function ligarLab(lab, construtor) {
    var campos = Array.prototype.slice.call(lab.querySelectorAll("[data-campo]"));
    var palco = lab.querySelector("[data-palco]");
    var saida = lab.querySelector("[data-saida]");
    function atualizar() {
      var v = {};
      campos.forEach(function (c) {
        v[c.getAttribute("data-campo")] = c.type === "checkbox" ? c.checked : c.value;
        var eco = lab.querySelector('[data-eco="' + c.getAttribute("data-campo") + '"]');
        if (eco) eco.textContent = c.value;
      });
      var r = construtor(v, lab);
      palco.innerHTML = r.html;
      if (saida) escreverCodigo(saida, r.codigo);
    }
    campos.forEach(function (c) {
      c.addEventListener("input", atualizar);
      c.addEventListener("change", atualizar);
    });
    atualizar();
  }

  function numeroDe(t) {
    var n = Number(String(t).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  var LABS = {
    /* seção 15: o mesmo número, a mesma data e a mesma moeda em vários locales */
    locales: function (v) {
      var n = numeroDe(v.numero);
      var data = new Date("2026-11-04T14:30:00Z");
      var lista = ["pt-BR", "pt-PT", "en-US", "en-GB", "es-AR", "de-DE", "fr-FR", "ja-JP", "ar-EG", "hi-IN"];
      var meu = navigator.language;
      var linhas = lista.map(function (loc) {
        var nf = new Intl.NumberFormat(loc).format(n);
        var moeda = new Intl.NumberFormat(loc, { style: "currency", currency: v.moeda }).format(n);
        var curta = new Intl.DateTimeFormat(loc, { timeZone: "America/Sao_Paulo" }).format(data);
        var longa = new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(data);
        return "<tr" + (loc === meu ? ' class="destaque"' : "") + "><td><code>" + loc + "</code>" + (loc === meu ? " (o seu)" : "") +
          "</td><td>" + esc(nf) + "</td><td>" + esc(moeda) + "</td><td>" + esc(curta) + "</td><td>" + esc(longa) + "</td></tr>";
      });
      return {
        html: '<div class="rolagem-x"><table class="tabela tabela--locales"><thead><tr><th>locale</th><th>número</th><th>moeda: ' + esc(v.moeda) +
          "</th><th>data padrão</th><th>dateStyle: long</th></tr></thead><tbody>" + linhas.join("") + "</tbody></table></div>",
        codigo: "const valor = " + n + ";\nconst quando = new Date(\"2026-11-04T14:30:00Z\");\n\n" +
          "for (const locale of [\"pt-BR\", \"en-US\", \"de-DE\" /* ... */]) {\n" +
          "  new Intl.NumberFormat(locale).format(valor);\n" +
          "  new Intl.NumberFormat(locale, { style: \"currency\", currency: " + q(v.moeda) + " }).format(valor);\n" +
          "  new Intl.DateTimeFormat(locale, { timeZone: \"America/Sao_Paulo\" }).format(quando);\n" +
          "  new Intl.DateTimeFormat(locale, { dateStyle: \"long\", timeZone: \"America/Sao_Paulo\" }).format(quando);\n}"
      };
    },

    /* seção 19: todas as opções de NumberFormat num lugar só */
    numero: function (v, lab) {
      var op = {};
      if (v.style !== "decimal") op.style = v.style;
      if (v.style === "currency") { op.currency = v.currency; if (v.currencyDisplay !== "symbol") op.currencyDisplay = v.currencyDisplay; }
      if (v.style === "unit") { op.unit = v.unit; if (v.unitDisplay !== "short") op.unitDisplay = v.unitDisplay; }
      if (v.notation !== "standard") op.notation = v.notation;
      if (v.notation === "compact" && v.compactDisplay !== "short") op.compactDisplay = v.compactDisplay;
      if (v.minimo !== "") op.minimumFractionDigits = Number(v.minimo);
      if (v.maximo !== "") op.maximumFractionDigits = Number(v.maximo);
      if (!v.useGrouping) op.useGrouping = false;
      if (v.signDisplay !== "auto") op.signDisplay = v.signDisplay;
      lab.querySelector("[data-so=currency]").hidden = v.style !== "currency";
      lab.querySelector("[data-so=unit]").hidden = v.style !== "unit";
      lab.querySelector("[data-so=compact]").hidden = v.notation !== "compact";
      var n = numeroDe(v.valor), html, comentario;
      try {
        var nf = new Intl.NumberFormat(v.locale, op);
        var texto = nf.format(n);
        html = '<div class="resultado-grande">' + esc(texto) + '</div><div class="partes">' +
          nf.formatToParts(n).map(function (p) { return "<span>" + esc(p.type) + "<b>" + (p.value.trim() ? esc(p.value) : "␣") + "</b></span>"; }).join("") + "</div>";
        comentario = "// " + q(texto);
      } catch (e) {
        html = '<div class="resultado-erro">' + esc(e.name + ": " + e.message) + "</div>";
        comentario = "// " + e.name + ": a chamada lança erro";
      }
      return { html: html, codigo: "new Intl.NumberFormat(" + q(v.locale) + opcoesTexto(op) + ").format(" + n + ");\n" + comentario };
    },

    /* seção 20: estilos prontos ou campo a campo, com fuso */
    data: function (v) {
      var op = {};
      ["dateStyle", "timeStyle", "weekday", "day", "month", "year", "hour", "minute"].forEach(function (k) { if (v[k]) op[k] = v[k]; });
      if (v.timeZone) op.timeZone = v.timeZone;
      var instante = v.instante === "agora" ? new Date() : new Date(v.instante);
      var dataTxt = v.instante === "agora" ? "new Date()" : "new Date(" + q(v.instante) + ")";
      var html, comentario;
      try {
        var texto = new Intl.DateTimeFormat(v.locale, op).format(instante);
        html = '<div class="resultado-grande" style="font-size:52px">' + esc(texto) + "</div>";
        comentario = "// " + q(texto);
      } catch (e) {
        html = '<div class="resultado-erro">' + esc(e.name + ": " + e.message) + "</div>";
        comentario = "// " + e.name + ": a chamada lança erro";
      }
      return { html: html, codigo: "const quando = " + dataTxt + ";\nnew Intl.DateTimeFormat(" + q(v.locale) + opcoesTexto(op) + ").format(quando);\n" + comentario };
    },

    /* seção 25: centavos estilizados com formatToParts */
    partes: function (v) {
      var nf = new Intl.NumberFormat(v.locale, { style: "currency", currency: v.moeda });
      var partes = nf.formatToParts(numeroDe(v.valor));
      return {
        html: '<div class="preco-partes">' + partes.map(function (p) {
          var cls = p.type === "currency" ? "p-moeda" : p.type === "fraction" ? "p-fracao" : p.type === "decimal" ? "p-decimal" : "";
          return cls ? '<span class="' + cls + '">' + esc(p.value) + "</span>" : esc(p.value);
        }).join("") + '</div><div class="partes">' +
          partes.map(function (p) { return "<span>" + esc(p.type) + "<b>" + (p.value.trim() ? esc(p.value) : "␣") + "</b></span>"; }).join("") + "</div>",
        codigo: "const nf = new Intl.NumberFormat(" + q(v.locale) + ", { style: \"currency\", currency: " + q(v.moeda) + " });\n" +
          "const html = nf.formatToParts(" + numeroDe(v.valor) + ").map(parte => {\n" +
          "  if (parte.type === \"currency\") return `<span class=\"moeda\">${parte.value}</span>`;\n" +
          "  if (parte.type === \"fraction\") return `<span class=\"centavos\">${parte.value}</span>`;\n" +
          "  return parte.value;\n}).join(\"\");"
      };
    }
  };

  document.querySelectorAll("[data-lab]").forEach(function (lab) {
    var c = LABS[lab.getAttribute("data-lab")];
    if (c) ligarLab(lab, c);
  });

  /* seção 22: régua de tempo relativo */
  (function () {
    var box = document.querySelector("[data-regua]");
    if (!box) return;
    var faixa = box.querySelector("input");
    var rotulo = box.querySelector("[data-dias]");
    var saida = box.querySelector(".regua-linhas");
    var UNIDADES = [["year", 365], ["month", 30], ["week", 7], ["day", 1]];
    function escolher(dias) {
      for (var i = 0; i < UNIDADES.length; i++) {
        if (Math.abs(dias) >= UNIDADES[i][1]) return [Math.round(dias / UNIDADES[i][1]), UNIDADES[i][0]];
      }
      return [dias, "day"];
    }
    var formatos = [
      ["pt-BR · numeric: \"auto\"", new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }), true],
      ["pt-BR · numeric: \"always\"", new Intl.RelativeTimeFormat("pt-BR"), true],
      ["pt-BR · sempre em dias", new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }), false],
      ["en-US · numeric: \"auto\"", new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }), true],
      ["es-ES · numeric: \"auto\"", new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" }), true]
    ];
    function atualizar() {
      var dias = Number(faixa.value);
      var u = escolher(dias);
      rotulo.textContent = (dias > 0 ? "+" : "") + dias + " dia(s) → escolherUnidade devolve [" + u[0] + ", \"" + u[1] + "\"]";
      saida.innerHTML = formatos.map(function (f) {
        var t = f[2] ? f[1].format(u[0], u[1]) : f[1].format(dias, "day");
        return "<div><small>" + esc(f[0]) + "</small><b>" + esc(t) + "</b></div>";
      }).join("");
    }
    faixa.addEventListener("input", atualizar);
    atualizar();
  })();

  /* ======================================================
     8. LABORATÓRIO LIVRE
     ====================================================== */

  var EXEMPLOS = {
    cep: "// buscar um CEP e tratar os três jeitos de dar errado\nasync function buscarCep(cep) {\n  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);\n  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}: CEP mal formado`);\n  const dados = await resposta.json();\n  if (dados.erro) throw new Error(\"CEP não encontrado\");\n  return dados;\n}\n\nfor (const cep of [\"01001000\", \"85851010\", \"99999999\", \"123\"]) {\n  try {\n    const d = await buscarCep(cep);\n    console.log(cep, \"→\", d.logradouro, \"-\", d.localidade + \"/\" + d.uf);\n  } catch (erro) {\n    console.warn(cep, \"→\", erro.message);\n  }\n}",
    paralelo: "// várias requisições ao mesmo tempo com Promise.all\nconst ceps = [\"01001000\", \"20040002\", \"70150900\", \"30130010\"];\nconst inicio = performance.now();\nconst respostas = await Promise.all(\n  ceps.map(cep => fetch(`https://viacep.com.br/ws/${cep}/json/`))\n);\nconst enderecos = await Promise.all(respostas.map(r => r.json()));\nfor (const e of enderecos) console.log(e.cep, e.localidade + \"/\" + e.uf);\nconsole.log(\"tempo total:\", Math.round(performance.now() - inicio), \"ms (na rede, as quatro saíram juntas)\");",
    post: "// criar, atualizar e apagar no JSONPlaceholder\nconst base = \"https://jsonplaceholder.typicode.com/posts\";\nconst json = { \"Content-Type\": \"application/json\" };\n\nlet r = await fetch(base, { method: \"POST\", headers: json, body: JSON.stringify({ title: \"Olá, API\", userId: 1 }) });\nconsole.log(\"POST\", r.status, await r.json());\n\nr = await fetch(base + \"/1\", { method: \"PATCH\", headers: json, body: JSON.stringify({ title: \"novo título\" }) });\nconsole.log(\"PATCH\", r.status, (await r.json()).title);\n\nr = await fetch(base + \"/1\", { method: \"DELETE\" });\nconsole.log(\"DELETE\", r.status);",
    cotacao: "// AJAX + Intl: a cotação vem como texto, vire número antes de formatar\nconst r = await fetch(\"https://economia.awesomeapi.com.br/json/last/USD-BRL\");\nconst { USDBRL } = await r.json();\nconsole.log(typeof USDBRL.bid, USDBRL.bid);\n\nconst cotacao = Number(USDBRL.bid);\nconst brl4 = new Intl.NumberFormat(\"pt-BR\", {\n  style: \"currency\", currency: \"BRL\", minimumFractionDigits: 4\n});\nconsole.log(\"1 dólar =\", brl4.format(cotacao));\n\nconst brl = new Intl.NumberFormat(\"pt-BR\", { style: \"currency\", currency: \"BRL\" });\nconsole.log(\"US$ 49,90 =\", brl.format(49.9 * cotacao));",
    moedas: "// o mesmo valor em várias moedas e idiomas\nconst valor = 1234.5;\nconst casos = [[\"pt-BR\", \"BRL\"], [\"pt-BR\", \"USD\"], [\"en-US\", \"USD\"], [\"de-DE\", \"EUR\"], [\"ja-JP\", \"JPY\"]];\nfor (const [locale, moeda] of casos) {\n  const nf = new Intl.NumberFormat(locale, { style: \"currency\", currency: moeda });\n  console.log(locale.padEnd(6), moeda, nf.format(valor));\n}",
    datas: "// um instante, vários fusos\nconst quando = new Date(\"2026-11-04T14:30:00Z\");\nfor (const timeZone of [\"America/Sao_Paulo\", \"America/Manaus\", \"Europe/Lisbon\", \"Asia/Tokyo\", \"UTC\"]) {\n  const df = new Intl.DateTimeFormat(\"pt-BR\", { dateStyle: \"short\", timeStyle: \"short\", timeZone });\n  console.log(timeZone.padEnd(18), df.format(quando));\n}",
    relativo: "// tempo relativo: a conta é sua\nconst rtf = new Intl.RelativeTimeFormat(\"pt-BR\", { numeric: \"auto\" });\nconst DIA = 24 * 60 * 60 * 1000;\n\nfunction quando(iso) {\n  const dias = Math.round((new Date(iso) - Date.now()) / DIA);\n  if (Math.abs(dias) >= 30) return rtf.format(Math.round(dias / 30), \"month\");\n  if (Math.abs(dias) >= 7) return rtf.format(Math.round(dias / 7), \"week\");\n  return rtf.format(dias, \"day\");\n}\n\nconst agora = Date.now();\nfor (const d of [0, -1, -3, -10, -45, 2]) {\n  console.log(d, \"→\", quando(new Date(agora + d * DIA).toISOString()));\n}",
    ordenar: "// ordenar com acento, números e sem diferenciar maiúsculas\nconst nomes = [\"Zoe\", \"álvaro\", \"Ana\", \"Érica\", \"bruno\", \"Íris\"];\nconsole.log([...nomes].sort());\nconsole.log([...nomes].sort(new Intl.Collator(\"pt-BR\").compare));\n\nconst itens = [\"item 10\", \"item 2\", \"item 1\"];\nconsole.log(itens.sort(new Intl.Collator(\"pt-BR\", { numeric: true }).compare));\n\nconst busca = new Intl.Collator(\"pt-BR\", { sensitivity: \"base\" });\nconsole.log(busca.compare(\"jose\", \"José\") === 0);"
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
    editor.value = EXEMPLOS.cep;
    rodarPg();
    reexecutaveis.push(rodarPg);
  }

  /* ======================================================
     9. RESULTADO ESPERADO DA ATIVIDADE

     Implementação de referência: a página mostra o
     comportamento pedido, não o código da solução.
     ====================================================== */

  (function () {
    var box = document.querySelector("[data-esperado]");
    if (!box) return;
    var DIA = 24 * 60 * 60 * 1000;
    var agora = Date.now();
    function iso(diasAtras, hora) {
      var d = new Date(agora - diasAtras * DIA);
      d.setUTCHours(hora, 15, 0, 0);
      return d.toISOString();
    }
    var TRANSACOES = [
      { cliente: "Zoe Martins", descricao: "Mochila escolar", valor: 189.9, moeda: "BRL", criadoEm: iso(0, 13) },
      { cliente: "Álvaro Mendes", descricao: "Curso online de JavaScript", valor: 49.9, moeda: "USD", criadoEm: iso(1, 18) },
      { cliente: "ana Lima", descricao: "Caderno universitário", valor: 32.5, moeda: "BRL", criadoEm: iso(3, 15) },
      { cliente: "Bruno Costa", descricao: "Teclado mecânico", valor: 349, moeda: "BRL", criadoEm: iso(4, 20) },
      { cliente: "Érica Nunes", descricao: "Fone de ouvido", valor: 129.99, moeda: "BRL", criadoEm: iso(6, 12) },
      { cliente: "Íris Campos", descricao: "Monitor de 24 polegadas", valor: 899, moeda: "BRL", criadoEm: iso(9, 14) },
      { cliente: "Caio Ramos", descricao: "Estorno de frete", valor: -18.9, moeda: "BRL", criadoEm: iso(12, 16) },
      { cliente: "Úrsula Dias", descricao: "Garrafa térmica", valor: 79.9, moeda: "BRL", criadoEm: iso(18, 11) },
      { cliente: "Davi Rocha", descricao: "Mouse sem fio", valor: 99.9, moeda: "BRL", criadoEm: iso(33, 19) },
      { cliente: "Olívia Prado", descricao: "Livro de JavaScript", valor: 120, moeda: "BRL", criadoEm: iso(47, 17) }
    ];
    var FUSO = "America/Sao_Paulo";
    var cache = {};
    function fmt(locale) {
      if (!cache[locale]) {
        cache[locale] = {
          moeda: {},
          data: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: FUSO }),
          rel: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
          col: new Intl.Collator(locale, { sensitivity: "base" }),
          compacto: new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", notation: "compact" }),
          cot: new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", minimumFractionDigits: 4 }),
          inteiro: new Intl.NumberFormat(locale)
        };
      }
      return cache[locale];
    }
    function moeda(locale, cod) {
      var f = fmt(locale);
      if (!f.moeda[cod]) f.moeda[cod] = new Intl.NumberFormat(locale, { style: "currency", currency: cod });
      return f.moeda[cod];
    }
    function quando(locale, isoTexto) {
      var dias = Math.round((new Date(isoTexto).setUTCHours(0, 0, 0, 0) - new Date(agora).setUTCHours(0, 0, 0, 0)) / DIA);
      var rel = fmt(locale).rel;
      if (Math.abs(dias) >= 30) return rel.format(Math.round(dias / 30), "month");
      if (Math.abs(dias) >= 7) return rel.format(Math.round(dias / 7), "week");
      return rel.format(dias, "day");
    }

    var seletorLocale = box.querySelector("[data-locale]");
    var tbody = box.querySelector("tbody");
    var resumo = box.querySelector("[data-resumo]");
    var cotacao = null, cotacaoQuando = null, cotacaoErro = "";

    function desenhar() {
      var locale = seletorLocale.value;
      var f = fmt(locale);
      var lista = TRANSACOES.slice().sort(function (a, b) { return f.col.compare(a.cliente, b.cliente); });
      var total = 0, convertidas = 0;
      tbody.innerHTML = lista.map(function (t) {
        var emReais = t.moeda === "BRL" ? t.valor : cotacao ? t.valor * cotacao : null;
        if (emReais !== null) { total += emReais; convertidas++; }
        return "<tr><td>" + esc(t.cliente) + "</td><td>" + esc(t.descricao) + "</td><td>" + esc(f.data.format(new Date(t.criadoEm))) +
          "</td><td>" + esc(quando(locale, t.criadoEm)) + '</td><td class="num' + (t.valor < 0 ? " neg" : "") + '">' + esc(moeda(locale, t.moeda).format(t.valor)) +
          '</td><td class="num' + (t.valor < 0 ? " neg" : "") + '">' + (emReais === null ? "…" : esc(moeda(locale, "BRL").format(emReais))) + "</td></tr>";
      }).join("");
      resumo.innerHTML =
        "<div><small>total em reais</small><b>" + esc(f.compacto.format(total)) + "</b></div>" +
        "<div><small>transações</small><b>" + esc(f.inteiro.format(convertidas)) + "</b></div>" +
        "<div><small>1 dólar hoje</small><b>" + (cotacao ? esc(f.cot.format(cotacao)) : cotacaoErro ? "—" : "…") + "</b></div>" +
        "<div><small>cotação atualizada</small><b>" + (cotacaoQuando ? esc(relMin(locale, cotacaoQuando)) : esc(cotacaoErro || "…")) + "</b></div>";
    }
    function relMin(locale, data) {
      var min = Math.round((data.getTime() - Date.now()) / 60000);
      if (Math.abs(min) >= 60) return fmt(locale).rel.format(Math.round(min / 60), "hour");
      return fmt(locale).rel.format(min, "minute");
    }
    function carregarCotacao() {
      cotacao = null; cotacaoQuando = null; cotacaoErro = ""; desenhar();
      SRV.fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL").then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function (d) {
        cotacao = Number(d.USDBRL.bid);
        cotacaoQuando = new Date(Number(d.USDBRL.timestamp) * 1000);
        desenhar();
      }, function () { cotacaoErro = "indisponível"; desenhar(); });
    }
    seletorLocale.addEventListener("change", desenhar);
    box.querySelector("[data-recotar]").addEventListener("click", carregarCotacao);
    carregarCotacao();
    reexecutaveis.push(carregarCotacao);

    /* formulário de entrega com histórico */
    var form = box.querySelector("[data-form-entrega]");
    var cep = form.querySelector("[name=cep]");
    var msg = form.querySelector(".form-msg");
    var hist = box.querySelector("[data-historico]");
    var campos = ["logradouro", "bairro", "localidade", "uf"].map(function (n) { return form.querySelector("[name=" + n + "]"); });
    var CHAVE = "aula-ajax-intl-historico";
    var historico = [];
    try { historico = JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch (e) { historico = []; }
    var buscando = false;

    function mostrarHistorico() {
      hist.innerHTML = "<span>últimos CEPs:</span>" + (historico.length
        ? historico.map(function (c) { return '<button type="button" data-h="' + c + '">' + c.slice(0, 5) + "-" + c.slice(5) + "</button>"; }).join("")
        : "<span>(nenhum ainda)</span>");
      hist.querySelectorAll("[data-h]").forEach(function (b) {
        b.addEventListener("click", function () { cep.value = b.getAttribute("data-h"); buscarEntrega(); });
      });
    }
    function buscarEntrega() {
      var numeros = cep.value.replace(/\D/g, "");
      if (numeros.length !== 8) { msg.className = "form-msg erro"; msg.textContent = "O CEP precisa ter 8 números. Nenhuma requisição foi feita."; return; }
      if (buscando) return;
      buscando = true;
      campos.forEach(function (c) { c.value = ""; c.classList.remove("preenchido"); });
      msg.className = "form-msg espera"; msg.textContent = "buscando endereço…";
      SRV.fetch("https://viacep.com.br/ws/" + numeros + "/json/").then(function (r) {
        if (!r.ok) throw new Error("O servidor recusou o CEP (HTTP " + r.status + ").");
        return r.json();
      }).then(function (d) {
        if (d.erro) { msg.className = "form-msg erro"; msg.textContent = "CEP não encontrado."; return; }
        campos.forEach(function (c) { c.value = d[c.name]; c.classList.add("preenchido"); });
        msg.className = "form-msg ok"; msg.textContent = "Endereço preenchido.";
        historico = [numeros].concat(historico.filter(function (c) { return c !== numeros; })).slice(0, 5);
        try { localStorage.setItem(CHAVE, JSON.stringify(historico)); } catch (e) { /* sem armazenamento */ }
        mostrarHistorico();
      }, function (e) {
        msg.className = "form-msg erro";
        msg.textContent = e.message === "Failed to fetch" ? "Sem conexão. Tente de novo." : e.message;
      }).then(function () { buscando = false; });
    }
    cep.addEventListener("blur", buscarEntrega);
    cep.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); cep.blur(); } });
    mostrarHistorico();
  })();
})();
