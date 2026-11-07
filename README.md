# Vitrine Ray de Luz Ateliê

Página com todos os produtos ativos na Hotmart, atualizada sozinha a cada 6 horas.

**Endereço:** https://raydeluzmoldes.github.io/moldes/

## Como funciona

O workflow `.github/workflows/atualizar.yml` busca os produtos na API da Hotmart
(nome, preço, garantia e link de compra), pega a imagem e a descrição de cada um
na página de checkout e publica no GitHub Pages:

- `index.html`: vitrine com todos os produtos;
- `produto/<nome-do-produto>/`: página de detalhes de cada produto, com descrição completa.

- **Produto novo na Hotmart:** aparece sozinho na próxima atualização.
- **Mudou a descrição na Hotmart:** a página acompanha na próxima atualização.
- **Atualizar na hora:** aba *Actions* → *Atualizar vitrine* → *Run workflow*.

## Personalizar

`vitrine.json`

| Campo | O que faz |
|---|---|
| `nome` | Nome no topo da página |
| `subtitulo` | Frase abaixo do nome |
| `ocultar` | IDs de produtos que não devem aparecer (ex.: `[8912324]`) |

`produtos-extras.json` (opcional): sobrescreve dados de um produto pelo ID.

```json
{
  "8912324": {
    "descricao": "Texto que substitui a descrição da Hotmart (linhas em branco viram parágrafos)",
    "nome": "Nome diferente do da Hotmart",
    "imagem": "https://link-de-outra-imagem.png",
    "link": "https://link-da-pagina-de-vendas",
    "slug": "endereco-da-pagina-do-produto"
  }
}
```

Os IDs aparecem no log do workflow e em `produtos.json` no site publicado.

## Visual

- `assets/logo.jpg`: logo do topo da vitrine; `assets/icone.png`: ícone da aba e do topo das páginas de produto;
  `assets/logo-compartilhar.jpg`: imagem que aparece ao compartilhar a vitrine.
- `assets/estilo.css`: cores e layout (roxo `#3e1557` e dourado `#efc95e` do logo).

## Credenciais

Ficam em *Settings → Secrets and variables → Actions*:
`HOTMART_CLIENT_ID` e `HOTMART_CLIENT_SECRET` (criadas em Hotmart → Ferramentas → Credenciais Hotmart).
