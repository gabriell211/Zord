# Zord Web

Aplicação nativa **100% web** do Zord, com **Next.js 16, React 19, TypeScript, Zod e PostgreSQL no Neon**, preparada para Vercel. A marca, a interface e os valores usam **pt-BR / BRL**.

## Desenvolvimento

- Node.js 24
- PostgreSQL 17 no Neon
- Variáveis de servidor `DATABASE_URL` (SSL) e `ZORD_SETUP_TOKEN` (segredo aleatório com 32 caracteres ou mais)

```bash
cd apps/web
cp .env.example .env.local
npm ci
npm run dev
```

Aplique ao Neon, nesta ordem, os arquivos SQL de `migrations/` **após validar em uma branch temporária**. Nunca exponha o banco ao navegador nem adicione `NEXT_PUBLIC_` aos segredos. A configuração inicial acontece em `/instalacao`; exige o segredo e só pode criar o primeiro administrador uma vez.

## Módulos nativos

- Acesso por senha com scrypt, sessão HTTP-only/secure em produção e limite de tentativas
- Empresas e isolamento por `organization_id` em todas as operações de cadastro
- Clientes: listar, pesquisar, cadastrar e editar
- Produtos/estoque: listar, pesquisar, cadastrar e editar, com valor em **centavos inteiros** e SKU único por empresa\n- Vendas (após migração `003_zord_sales.sql`): propostas em rascunho, itens, valor em BRL, confirmação transacional e baixa atômica de estoque por empresa
- Avatar individual com validação de imagem
- Dashboard: contagem de clientes e produtos

As demais páginas de CRM, vendas, compras, PDV e financeiro são **estruturas de navegação**; não há implementação nativa ou homologação fiscal concluída. O ERP legado em Python presente na raiz do repositório **não é exigido** para as funcionalidades nativas descritas aqui.

## Qualidade

```bash
npm run check
```

A CI exige instalação sem warnings, ESLint, tipagem estrita, testes e build. Testes específicos verificam validações, preços brasileiros, conflitos de SKU e isolamento de produtos por empresa.

## Deploy

Configure o projeto Vercel com diretório raiz `apps/web`, Node 24 e as variáveis de servidor. Execute migrações aprovadas no Neon **antes** de utilizar as rotas. Não coloque credenciais reais em commits.

O código-fonte importado na raiz mantém as obrigações de suas licenças originais, inclusive LGPL-3.0; consulte `LICENSE` e `docs/LICENCAS.md`.
