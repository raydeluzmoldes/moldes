// Monta o HTML da vitrine. Tudo num arquivo só: sem dependências.

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function formatarPreco(valor, moeda) {
  if (valor == null) return '';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda || 'BRL' }).format(valor);
  } catch {
    return `${moeda} ${valor}`;
  }
}

function card(p) {
  const preco = formatarPreco(p.preco, p.moeda);
  const imagem = p.imagem
    ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy" decoding="async">`
    : `<span class="sem-imagem" aria-hidden="true">${esc([...p.nome.trim()][0] ?? '•')}</span>`;
  return `
      <li class="card" data-busca="${esc(semAcento(`${p.nome} ${p.descricao}`))}">
        <a class="capa" href="${esc(p.link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${imagem}</a>
        <div class="info">
          <h2><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.nome)}</a></h2>
          ${p.descricao ? `<p class="desc">${esc(p.descricao)}</p>` : ''}
          <div class="rodape-card">
            ${preco ? `<span class="preco">${esc(preco)}${p.assinatura ? '<small> /assinatura</small>' : ''}</span>` : ''}
            <a class="botao" href="${esc(p.link)}" target="_blank" rel="noopener">Comprar</a>
          </div>
        </div>
      </li>`;
}

export function renderPagina({ config, produtos, urlSite, agora }) {
  const nome = config.nome || 'Meus produtos';
  const subtitulo = config.subtitulo || '';
  const cor = /^#[0-9a-f]{3,8}$/i.test(config.cor ?? '') ? config.cor : '#c2462f';
  const titulo = config.titulo_aba || `${nome} · Produtos`;
  const descricao = subtitulo || `Todos os produtos de ${nome}.`;
  const imagemCompartilhar = config.imagem_compartilhar || produtos.find((p) => p.imagem)?.imagem || '';
  const inicial = [...nome.trim()][0]?.toUpperCase() ?? '•';
  const atualizado = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(agora);
  const mostrarBusca = produtos.length >= 7;
  const qtd = produtos.length === 1 ? '1 produto' : `${produtos.length} produtos`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
${urlSite ? `<meta property="og:url" content="${esc(urlSite)}">\n<link rel="canonical" href="${esc(urlSite)}">` : ''}
${imagemCompartilhar ? `<meta property="og:image" content="${esc(imagemCompartilhar)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="${esc(cor)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='${cor}'/><text x='32' y='43' font-size='32' text-anchor='middle' fill='white' font-family='Georgia,serif'>${esc(inicial)}</text></svg>`)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fraunces:opsz,wght@9..144,600&display=swap" rel="stylesheet">
<style>
  :root {
    --destaque: ${cor};
    --fundo: #fbf6f0;
    --superficie: #ffffff;
    --texto: #2b211c;
    --suave: #76665c;
    --linha: #ecdfd3;
    --placeholder: #f3e7dc;
    --sombra: 0 1px 2px rgba(60, 30, 10, .05), 0 10px 30px -12px rgba(60, 30, 10, .18);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --fundo: #191411;
      --superficie: #241d18;
      --texto: #f4ece5;
      --suave: #b6a598;
      --linha: #382d26;
      --placeholder: #2f2620;
      --sombra: none;
    }
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    background: var(--fundo);
    color: var(--texto);
    font: 16px/1.5 "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .envoltorio { max-width: 1080px; margin: 0 auto; padding: 0 16px; }

  .topo { text-align: center; padding: 56px 0 36px; }
  .avatar {
    width: 76px; height: 76px; margin: 0 auto 18px; border-radius: 50%;
    display: grid; place-items: center;
    background: var(--destaque); color: #fff;
    font: 600 34px/1 "Fraunces", Georgia, serif;
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--destaque) 15%, transparent);
  }
  h1 {
    margin: 0 0 8px;
    font: 600 clamp(30px, 6vw, 44px)/1.1 "Fraunces", Georgia, serif;
    letter-spacing: -.015em;
    text-wrap: balance;
  }
  .subtitulo { margin: 0 auto 6px; max-width: 34em; color: var(--suave); text-wrap: pretty; }
  .contagem { margin: 0 0 22px; color: var(--suave); font-size: 14px; }
  .compartilhar {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 999px; cursor: pointer;
    font: 500 15px "DM Sans", system-ui, sans-serif;
    color: var(--texto); background: var(--superficie);
    border: 1px solid var(--linha);
    transition: border-color .15s, transform .15s;
  }
  .compartilhar:hover { border-color: var(--destaque); }
  .compartilhar:active { transform: scale(.97); }
  .compartilhar svg { width: 18px; height: 18px; }

  .busca { max-width: 420px; margin: 0 auto 28px; }
  .busca input {
    width: 100%; padding: 12px 18px; border-radius: 999px;
    border: 1px solid var(--linha); background: var(--superficie); color: var(--texto);
    font: 16px "DM Sans", system-ui, sans-serif;
  }
  .busca input:focus { outline: 2px solid var(--destaque); outline-offset: 1px; }

  .grade {
    list-style: none; margin: 0; padding: 0;
    display: grid; gap: 22px;
    grid-template-columns: repeat(auto-fit, minmax(230px, 290px));
    justify-content: center;
  }
  .card {
    display: flex; flex-direction: column; overflow: hidden;
    background: var(--superficie); border: 1px solid var(--linha); border-radius: 18px;
    box-shadow: var(--sombra);
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .card:hover { transform: translateY(-3px); }
  .capa { display: block; aspect-ratio: 1; background: var(--placeholder); overflow: hidden; }
  .capa img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease; }
  .card:hover .capa img { transform: scale(1.03); }
  .sem-imagem {
    width: 100%; height: 100%; display: grid; place-items: center;
    font: 600 56px "Fraunces", Georgia, serif; color: var(--destaque);
  }
  .info { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 16px 18px 18px; }
  .info h2 { margin: 0; font-size: 16.5px; font-weight: 500; line-height: 1.35; text-wrap: pretty; }
  .info h2 a { color: inherit; text-decoration: none; }
  .desc { margin: 0; font-size: 14px; color: var(--suave); }
  .rodape-card {
    margin-top: auto; padding-top: 10px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .preco { font-weight: 700; font-size: 19px; white-space: nowrap; }
  .preco small { font-weight: 400; font-size: 13px; color: var(--suave); }
  .botao {
    padding: 10px 20px; border-radius: 999px;
    background: var(--destaque); color: #fff;
    font-weight: 700; font-size: 15px; text-decoration: none; text-align: center;
    transition: filter .15s, transform .15s;
  }
  .botao:hover { filter: brightness(1.08); }
  .botao:active { transform: scale(.97); }
  .botao:focus-visible, .compartilhar:focus-visible, .info h2 a:focus-visible {
    outline: 2px solid var(--destaque); outline-offset: 3px;
  }
  .vazio { text-align: center; color: var(--suave); padding: 32px 0; }

  .rodape { text-align: center; color: var(--suave); font-size: 13px; padding: 48px 0 40px; }
  .rodape p { margin: 4px 0; }
  .cadeado { display: inline-flex; align-items: center; gap: 6px; }
  .cadeado svg { width: 14px; height: 14px; }

  @media (max-width: 600px) {
    .topo { padding: 40px 0 28px; }
    .grade { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .card { border-radius: 14px; }
    .info { padding: 12px; gap: 6px; }
    .info h2 { font-size: 14.5px; }
    .rodape-card { flex-direction: column; align-items: stretch; gap: 8px; }
    .preco { font-size: 17px; }
    .botao { padding: 9px 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; }
  }
</style>
</head>
<body>
  <header class="topo envoltorio">
    <div class="avatar" aria-hidden="true">${esc(inicial)}</div>
    <h1>${esc(nome)}</h1>
    ${subtitulo ? `<p class="subtitulo">${esc(subtitulo)}</p>` : ''}
    <p class="contagem">${esc(qtd)}</p>
    <button class="compartilhar" id="compartilhar" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
      <span>Compartilhar</span>
    </button>
  </header>

  <main class="envoltorio">
    ${mostrarBusca ? `<div class="busca"><input id="busca" type="search" placeholder="Buscar produto…" aria-label="Buscar produto"></div>` : ''}
    <ul class="grade" id="grade">${produtos.map(card).join('')}
    </ul>
    <p class="vazio" id="vazio" ${produtos.length ? 'hidden' : ''}>${produtos.length ? 'Nenhum produto encontrado.' : 'Novidades em breve.'}</p>
  </main>

  <footer class="rodape envoltorio">
    <p class="cadeado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Pagamento seguro processado pela Hotmart</p>
    <p>Atualizado em ${esc(atualizado)}</p>
  </footer>

<script>
  (function () {
    var botao = document.getElementById('compartilhar');
    var rotulo = botao.querySelector('span');
    botao.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      var copiado = function () {
        rotulo.textContent = 'Link copiado!';
        setTimeout(function () { rotulo.textContent = 'Compartilhar'; }, 2000);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(copiado, function () { prompt('Copie o link:', url); });
      } else {
        prompt('Copie o link:', url);
      }
    });

    var busca = document.getElementById('busca');
    if (!busca) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    var vazio = document.getElementById('vazio');
    var normalizar = function (s) { return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim(); };
    busca.addEventListener('input', function () {
      var termo = normalizar(busca.value);
      var visiveis = 0;
      cards.forEach(function (c) {
        var mostra = !termo || c.getAttribute('data-busca').indexOf(termo) !== -1;
        c.hidden = !mostra;
        if (mostra) visiveis++;
      });
      vazio.hidden = visiveis > 0;
    });
  })();
</script>
</body>
</html>
`;
}
