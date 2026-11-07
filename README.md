# Vitrine Ray de Luz Ateliê

Página com todos os produtos ativos na Hotmart, atualizada sozinha a cada 6 horas.

**Endereço:** https://raydeluzmoldes.github.io/moldes/

## Como funciona

O workflow `.github/workflows/atualizar.yml` busca os produtos na API da Hotmart
(nome, preço e link de compra), pega a imagem de cada um na página de checkout e
publica a página no GitHub Pages.

- **Produto novo na Hotmart:** aparece sozinho na próxima atualização.
- **Atualizar na hora:** aba *Actions* → *Atualizar vitrine* → *Run workflow*.

## Personalizar

`vitrine.json`

| Campo | O que faz |
|---|---|
| `nome` | Nome no topo da página |
| `subtitulo` | Frase abaixo do nome |
| `cor` | Cor dos botões (ex.: `#c2462f`) |
| `ocultar` | IDs de produtos que não devem aparecer (ex.: `[8912324]`) |

`produtos-extras.json` (opcional): sobrescreve dados de um produto pelo ID.

```json
{
  "8912324": {
    "descricao": "Frase curta que aparece no card",
    "nome": "Nome diferente do da Hotmart",
    "imagem": "https://link-de-outra-imagem.png",
    "link": "https://link-da-pagina-de-vendas"
  }
}
```

Os IDs aparecem no log do workflow e em `produtos.json` no site publicado.

## Credenciais

Ficam em *Settings → Secrets and variables → Actions*:
`HOTMART_CLIENT_ID` e `HOTMART_CLIENT_SECRET` (criadas em Hotmart → Ferramentas → Credenciais Hotmart).
