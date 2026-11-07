// Busca os produtos ativos na Hotmart e gera a vitrine em ./site
// Uso: HOTMART_CLIENT_ID=... HOTMART_CLIENT_SECRET=... node scripts/build.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { renderPagina } from './pagina.mjs';

const ID = process.env.HOTMART_CLIENT_ID;
const SECRET = process.env.HOTMART_CLIENT_SECRET;
if (!ID || !SECRET) {
  console.error('Defina as variáveis HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET.');
  process.exit(1);
}

const API = 'https://developers.hotmart.com/products/api/v1';
const TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';

async function pedir(url, opcoes = {}, tentativas = 3) {
  for (let i = 1; ; i++) {
    const r = await fetch(url, { ...opcoes, signal: AbortSignal.timeout(30000) });
    if (r.ok) return r;
    const repetir = r.status === 429 || r.status >= 500;
    if (!repetir || i >= tentativas) {
      // Nunca mostra a query string: a URL do token carrega o client_secret.
      const corpo = (await r.text()).slice(0, 300);
      throw new Error(`${opcoes.method ?? 'GET'} ${url.split('?')[0]} → HTTP ${r.status}: ${corpo}`);
    }
    await new Promise((ok) => setTimeout(ok, 2000 * i));
  }
}

async function obterToken() {
  const basic = Buffer.from(`${ID}:${SECRET}`).toString('base64');
  const url = `${TOKEN_URL}?grant_type=client_credentials`
    + `&client_id=${encodeURIComponent(ID)}&client_secret=${encodeURIComponent(SECRET)}`;
  const r = await pedir(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
  });
  return (await r.json()).access_token;
}

async function listarTudo(caminho, token) {
  const itens = [];
  let proxima;
  do {
    const url = new URL(API + caminho);
    url.searchParams.set('max_results', '50');
    if (proxima) url.searchParams.set('page_token', proxima);
    const r = await pedir(url.href, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const dados = await r.json();
    itens.push(...(dados.items ?? []));
    proxima = dados.page_info?.next_page_token;
  } while (proxima);
  return itens;
}

// A API não devolve a imagem do produto; a página de checkout traz ela no og:image.
async function imagemDoCheckout(link) {
  try {
    const r = await fetch(link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; vitrine-produtos)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function lerJson(arquivo, padrao) {
  if (!existsSync(arquivo)) return padrao;
  return JSON.parse(await readFile(arquivo, 'utf8'));
}

function descobrirUrlSite(config) {
  if (config.url) return config.url;
  const repoCompleto = process.env.GITHUB_REPOSITORY;
  if (!repoCompleto) return '';
  const [dono, repo] = repoCompleto.toLowerCase().split('/');
  return repo === `${dono}.github.io` ? `https://${repo}/` : `https://${dono}.github.io/${repo}/`;
}

const config = await lerJson('vitrine.json', {});
const extras = await lerJson('produtos-extras.json', {});
const ocultos = new Set((config.ocultar ?? []).map(String));

const token = await obterToken();
const produtos = (await listarTudo('/products', token))
  .filter((p) => p.status === 'ACTIVE' && !ocultos.has(String(p.id)));

const vitrine = [];
for (const p of produtos) {
  const ofertas = await listarTudo(`/products/${p.ucode}/offers`, token);
  const oferta = ofertas.find((o) => o.is_main_offer) ?? ofertas[0];
  if (!oferta) {
    console.warn(`⚠ Sem oferta, ignorado: ${p.name}`);
    continue;
  }
  const checkout = oferta.direct_offer_link_for_creator || `https://pay.hotmart.com?off=${oferta.code}`;
  const extra = extras[String(p.id)] ?? {};
  vitrine.push({
    id: p.id,
    nome: extra.nome || p.name,
    descricao: extra.descricao || '',
    preco: oferta.price?.value ?? null,
    moeda: oferta.price?.currency_code || 'BRL',
    assinatura: Boolean(p.is_subscription),
    link: extra.link || checkout,
    imagem: extra.imagem || (await imagemDoCheckout(checkout)),
    criado: p.created_at,
  });
}

vitrine.sort((a, b) => (b.criado ?? 0) - (a.criado ?? 0));

await mkdir('site', { recursive: true });
await writeFile('site/index.html', renderPagina({
  config,
  produtos: vitrine,
  urlSite: descobrirUrlSite(config),
  agora: new Date(),
}));
await writeFile('site/produtos.json', JSON.stringify(vitrine, null, 2));

console.log(`✔ Vitrine gerada com ${vitrine.length} produto(s):`);
for (const p of vitrine) {
  console.log(`  • [${p.id}] ${p.nome} — ${p.preco} ${p.moeda}${p.imagem ? '' : ' (sem imagem)'}`);
}
