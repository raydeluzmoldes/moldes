// Monta o HTML da vitrine (index) e das páginas de produto.

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function formatarPreco(valor, moeda) {
  if (valor == null) return '';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda || 'BRL' }).format(valor);
  } catch {
    return `${moeda} ${valor}`;
  }
}

function resumir(texto, limite = 150) {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= limite) return t;
  return `${t.slice(0, limite).replace(/\s+\S*$/, '')}…`;
}

function paragrafos(texto) {
  return String(texto ?? '')
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('\n          ');
}

const ICONES = {
  compartilhar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  voltar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M15 18l-6-6 6-6"/></svg>',
};

function cabeca({ titulo, descricao, url, imagem, raiz, versao }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
${url ? `<meta property="og:url" content="${esc(url)}">\n<link rel="canonical" href="${esc(url)}">` : ''}
${imagem ? `<meta property="og:image" content="${esc(imagem)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#3e1557">
<link rel="icon" type="image/png" href="${raiz}assets/icone.png">
<link rel="apple-touch-icon" href="${raiz}assets/icone.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${raiz}assets/estilo.css?v=${versao}">`;
}

function rodape({ agora }) {
  const atualizado = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
  }).format(agora);
  return `<footer class="rodape">
    <p class="seguro">${ICONES.cadeado} Pagamento seguro processado pela Hotmart</p>
    <p>Atualizado em ${esc(atualizado)}</p>
  </footer>`;
}

// <img> com versões leves (srcset) quando existem; senão, a imagem original.
function imagemHtml(p, raiz, { sizes, alt = '', prioridade = false }) {
  if (!p.imagem) {
    return `<span class="sem-imagem" aria-hidden="true">${esc([...p.nome.trim()][0] ?? '•')}</span>`;
  }
  const carga = prioridade ? 'fetchpriority="high"' : 'loading="lazy"';
  if (!p.imagens) {
    return `<img src="${esc(p.imagem)}" alt="${esc(alt)}" ${carga} decoding="async">`;
  }
  const srcset = Object.entries(p.imagens).map(([w, arq]) => `${raiz}${arq} ${w}w`).join(', ');
  const maior = Object.values(p.imagens).at(-1);
  return `<img src="${raiz}${maior}" srcset="${srcset}" sizes="${sizes}" width="800" height="800" alt="${esc(alt)}" ${carga} decoding="async">`;
}

function card(p, raiz) {
  const preco = formatarPreco(p.preco, p.moeda);
  const href = `${raiz}produto/${p.slug}/`;
  const imagem = imagemHtml(p, raiz, { sizes: '(max-width: 600px) 50vw, 290px' });
  return `
      <li class="card" data-busca="${esc(semAcento(`${p.nome} ${p.descricao}`))}">
        <a class="capa" href="${href}" tabindex="-1" aria-hidden="true">${imagem}</a>
        <div class="info">
          <h2><a href="${href}">${esc(p.nome)}</a></h2>
          ${p.descricao ? `<p class="resumo">${esc(resumir(p.descricao))}</p>` : ''}
          <div class="rodape-card">
            ${preco ? `<span class="preco">${esc(preco)}${p.assinatura ? '<small> /assinatura</small>' : ''}</span>` : ''}
            <a class="botao" href="${href}">Ver produto</a>
          </div>
        </div>
      </li>`;
}

export function renderIndex({ config, produtos, urlSite, agora }) {
  const nome = config.nome || 'Meus produtos';
  const subtitulo = config.subtitulo || '';
  const titulo = config.titulo_aba || (subtitulo ? `${nome} · ${subtitulo}` : nome);
  const qtd = produtos.length === 1 ? '1 produto' : `${produtos.length} produtos`;
  const versao = agora.getTime();

  return `<!doctype html>
<html lang="pt-BR">
<head>
${cabeca({
    titulo,
    descricao: subtitulo || `Todos os produtos de ${nome}.`,
    url: urlSite,
    imagem: `${urlSite}assets/logo-compartilhar.jpg`,
    raiz: '',
    versao,
  })}
</head>
<body>
  <header class="hero">
    <div class="envoltorio">
      <h1 class="logo"><img src="assets/logo.jpg" alt="${esc(nome)}" width="560" height="560"></h1>
      ${subtitulo ? `<p class="subtitulo">${esc(subtitulo)}</p>` : ''}
      <p class="contagem">${esc(qtd)}</p>
      <button class="compartilhar" type="button" data-compartilhar>${ICONES.compartilhar}<span>Compartilhar</span></button>
    </div>
  </header>

  <main class="vitrine envoltorio">
    ${produtos.length >= 7 ? '<div class="busca"><input id="busca" type="search" placeholder="Buscar produto…" aria-label="Buscar produto"></div>' : ''}
    <ul class="grade" id="grade">${produtos.map((p) => card(p, '')).join('')}
    </ul>
    <p class="vazio" id="vazio" ${produtos.length ? 'hidden' : ''}>${produtos.length ? 'Nenhum produto encontrado.' : 'Novidades em breve.'}</p>
  </main>

  ${rodape({ agora })}
  <script src="assets/vitrine.js?v=${versao}" defer></script>
</body>
</html>
`;
}

export function renderProduto({ config, produto: p, outros, urlSite, agora }) {
  const nome = config.nome || 'Meus produtos';
  const raiz = '../../';
  const versao = agora.getTime();
  const preco = formatarPreco(p.preco, p.moeda);
  const urlProduto = urlSite ? `${urlSite}produto/${p.slug}/` : '';
  const sufixoPreco = p.assinatura ? '<small> /assinatura</small>' : '';

  const garantias = [
    `<li>${ICONES.email}<span>Produto digital: o acesso chega no seu e-mail após a confirmação do pagamento.</span></li>`,
    p.garantia ? `<li>${ICONES.escudo}<span>Garantia de ${esc(p.garantia)} dias: se não gostar, você pede o reembolso.</span></li>` : '',
    `<li>${ICONES.cadeado}<span>Pagamento seguro processado pela Hotmart.</span></li>`,
  ].filter(Boolean).join('\n          ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nome,
    ...(p.imagem ? { image: p.imagem } : {}),
    ...(p.descricao ? { description: p.descricao } : {}),
    brand: { '@type': 'Brand', name: nome },
    ...(p.preco != null ? {
      offers: {
        '@type': 'Offer', price: p.preco, priceCurrency: p.moeda,
        availability: 'https://schema.org/InStock', url: p.link,
      },
    } : {}),
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
${cabeca({
    titulo: `${p.nome} · ${nome}`,
    descricao: p.descricao ? resumir(p.descricao, 200) : `${p.nome} — ${preco}`,
    url: urlProduto,
    imagem: p.imagem || `${urlSite}assets/logo-compartilhar.jpg`,
    raiz,
    versao,
  })}
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body class="pagina-produto">
  <header class="barra">
    <div class="envoltorio barra-conteudo">
      <a class="marca" href="${raiz}"><img src="${raiz}assets/icone.png" alt="" width="40" height="40"><span>${esc(nome)}</span></a>
      <a class="voltar" href="${raiz}">${ICONES.voltar} <span class="voltar-longo">Todos os produtos</span><span class="voltar-curto">Voltar</span></a>
    </div>
  </header>

  <main class="produto envoltorio">
    <div class="produto-grade">
      <div class="produto-imagem">
        ${imagemHtml(p, raiz, { sizes: '(max-width: 760px) 100vw, 520px', alt: p.nome, prioridade: true })}
      </div>
      <div class="produto-info">
        <h1>${esc(p.nome)}</h1>
        ${preco ? `<p class="preco-grande">${esc(preco)}${sufixoPreco}</p>` : ''}
        <a class="botao botao-grande" id="cta" href="${esc(p.link)}" target="_blank" rel="noopener">Comprar agora</a>
        <ul class="garantias">
          ${garantias}
        </ul>
        ${p.descricao ? `<section class="descricao">
          <h2>Descrição</h2>
          ${paragrafos(p.descricao)}
        </section>` : ''}
        <div class="produto-acoes">
          <button class="compartilhar" type="button" data-compartilhar>${ICONES.compartilhar}<span>Compartilhar este produto</span></button>
        </div>
      </div>
    </div>

    ${outros.length ? `<section class="outros">
      <h2 class="titulo-secao">Você também pode gostar</h2>
      <ul class="grade">${outros.map((o) => card(o, raiz)).join('')}
      </ul>
    </section>` : ''}
  </main>

  <div class="barra-compra" id="barra-compra">
    ${preco ? `<span class="preco">${esc(preco)}${sufixoPreco}</span>` : '<span></span>'}
    <a class="botao" href="${esc(p.link)}" target="_blank" rel="noopener">Comprar</a>
  </div>

  ${rodape({ agora })}
  <script src="${raiz}assets/vitrine.js?v=${versao}" defer></script>
</body>
</html>
`;
}
