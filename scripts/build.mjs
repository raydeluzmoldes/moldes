// Busca os produtos ativos na Hotmart e gera a vitrine em ./site
// Uso: HOTMART_CLIENT_ID=... HOTMART_CLIENT_SECRET=... node scripts/build.mjs

import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { renderIndex, renderProduto } from './pagina.mjs';

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

// A API não devolve imagem nem descrição. A página de checkout traz as duas:
// a imagem no og:image e os dados do produto no JSON __NUXT_DATA__.
async function dadosDoCheckout(link, ucode) {
  let html;
  try {
    const r = await fetch(link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; vitrine-produtos)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return {};
    html = await r.text();
  } catch {
    return {};
  }

  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null;
  const resultado = { imagem: og, descricao: '' };

  const bloco = html.match(/<script[^>]*id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!bloco) return resultado;
  let dados;
  try {
    dados = JSON.parse(bloco[1]);
  } catch {
    return resultado;
  }
  // No formato do Nuxt, os valores de cada objeto são índices dentro do próprio array.
  const valor = (i) => (typeof i === 'number' ? dados[i] : i);
  const texto = (i) => (typeof valor(i) === 'string' ? valor(i).trim() : '');
  for (const o of dados) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) continue;
    if (!('description' in o && 'ucode' in o && 'coverPhoto' in o)) continue;
    if (texto(o.ucode) !== ucode) continue;
    resultado.descricao = texto(o.description);
    resultado.imagem = texto(o.coverPhoto) || og;
    break;
  }
  return resultado;
}

// As imagens da Hotmart chegam a 1 MB; geramos versões leves em WebP para o celular.
const LARGURAS = [400, 800];
async function otimizarImagem(url, slug) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const original = Buffer.from(await r.arrayBuffer());
    const arquivos = {};
    for (const largura of LARGURAS) {
      const caminho = `img/${slug}-${largura}.webp`;
      await sharp(original)
        .resize({ width: largura, height: largura, fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(`site/${caminho}`);
      arquivos[largura] = caminho;
    }
    return arquivos;
  } catch (e) {
    console.warn(`⚠ Imagem de "${slug}" não otimizada (${e.message}); usando a original.`);
    return null;
  }
}

function criarSlug(texto) {
  const palavras = String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  let slug = '';
  for (const p of palavras) {
    if (slug && slug.length + p.length + 1 > 60) break;
    slug = slug ? `${slug}-${p}` : p;
  }
  return slug || 'produto';
}

async function lerJson(arquivo, padrao) {
  if (!existsSync(arquivo)) return padrao;
  return JSON.parse(await readFile(arquivo, 'utf8'));
}

function descobrirUrlSite(config) {
  if (config.url) return config.url.endsWith('/') ? config.url : `${config.url}/`;
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
  const doCheckout = await dadosDoCheckout(checkout, p.ucode);
  const nome = extra.nome || p.name;
  vitrine.push({
    id: p.id,
    slug: extra.slug || criarSlug(nome),
    nome,
    descricao: extra.descricao || doCheckout.descricao || '',
    preco: oferta.price?.value ?? null,
    moeda: oferta.price?.currency_code || 'BRL',
    assinatura: Boolean(p.is_subscription),
    garantia: p.warranty_period ?? null,
    link: extra.link || checkout,
    imagem: extra.imagem || doCheckout.imagem || null,
    criado: p.created_at,
  });
}

vitrine.sort((a, b) => (b.criado ?? 0) - (a.criado ?? 0));

// Slugs repetidos ganham o ID no final para não sobrescrever páginas.
const usados = new Set();
for (const p of vitrine) {
  if (usados.has(p.slug)) p.slug = `${p.slug}-${p.id}`;
  usados.add(p.slug);
}

const urlSite = descobrirUrlSite(config);
const agora = new Date();

await rm('site', { recursive: true, force: true });
await mkdir('site', { recursive: true });
await cp('assets', 'site/assets', { recursive: true });
await mkdir('site/img', { recursive: true });
for (const p of vitrine) {
  p.imagens = p.imagem ? await otimizarImagem(p.imagem, p.slug) : null;
}
await writeFile('site/index.html', renderIndex({ config, produtos: vitrine, urlSite, agora }));
for (const p of vitrine) {
  const outros = vitrine.filter((o) => o.id !== p.id).slice(0, 4);
  await mkdir(`site/produto/${p.slug}`, { recursive: true });
  await writeFile(`site/produto/${p.slug}/index.html`, renderProduto({ config, produto: p, outros, urlSite, agora }));
}
await writeFile('site/produtos.json', JSON.stringify(vitrine, null, 2));

console.log(`✔ Vitrine gerada com ${vitrine.length} produto(s):`);
for (const p of vitrine) {
  const faltando = [!p.imagem && 'sem imagem', !p.descricao && 'sem descrição'].filter(Boolean).join(', ');
  console.log(`  • [${p.id}] ${p.nome} — ${p.preco} ${p.moeda} → produto/${p.slug}/${faltando ? ` (${faltando})` : ''}`);
}
