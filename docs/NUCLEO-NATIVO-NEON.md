# Migração Zord Web: Vercel + Neon

Esta implementação introduz um núcleo **Next.js 16 + PostgreSQL (Neon)** independente de servidor Python para login, sessões, empresas, avatares e clientes. O repositório histórico da base ERP permanece separado para preservar licenças e permitir migrações futuras; os módulos que ainda não foram portados não simulam registros.

## Preparação

- Vercel: projeto `zord` com raiz `apps/web`, Node.js 24 e funções na região `gru1`.
- Neon: banco `zord` no projeto `plain-cell-06096828`.
- Migração inicial: `apps/web/migrations/001_zord_core.sql`. O banco deve estar vazio. Revise e aplique a migração em Neon por processo de mudança aprovado.
- Na Vercel, salve `DATABASE_URL` como segredo de ambiente de servidor, usando conexão **pooled** (`-pooler`), TLS obrigatório e sem prefixo `NEXT_PUBLIC_`.
- Salve `ZORD_SETUP_TOKEN` como chave aleatória segura de pelo menos 32 caracteres, exclusiva para a primeira instalação. Revogue-a após criar o primeiro administrador.
- Não existe integração direta do banco via navegador. Os acessos ao Neon são exclusivos das rotas e componentes de servidor.
- `ZORD_ERP_URL` e `ZORD_ERP_DB` não são usados pelo novo núcleo. Os modelos remanescentes de CRM, vendas, compras, estoque, financeiro e PDV ainda exigem implementação própria em Next.js.

## Primeiro acesso

1. Execute o esquema SQL depois de aprová-lo.
2. Publique a versão web com `DATABASE_URL` e `ZORD_SETUP_TOKEN`.
3. Abra `/instalacao` e informe empresa, nome, e-mail e senha forte do administrador, junto da chave de instalação.
4. A instalação cria a organização, o administrador e uma sessão, em transação atômica com bloqueio; a rota recusa novas instalações após existir um usuário.
5. Remova `ZORD_SETUP_TOKEN` das variáveis de ambiente e faça novo deploy.
6. Entre em `/login`; confirme `/painel`, `/clientes` e `/perfil`.

## Segurança

- Senhas: scrypt, salt aleatório por usuário e comparação em tempo constante.
- Sessões: token aleatório de 256 bits; hash SHA-256 no banco, vencimento de 7 dias, cookie HttpOnly/SameSite=Lax/Secure em produção.
- Tentativas de login: bloqueio por e-mail após 5 falhas em 15 minutos, persistido em PostgreSQL.
- Clientes e perfis: todos os acessos limitados pelo `organization_id` da sessão, sem confiar em IDs fornecidos pelo cliente.
- Upload de avatar: PNG, JPG ou WebP com validação de bytes e limite de 1 MB.
- As queries utilizam parâmetros do driver, nunca SQL concatenado com entrada do usuário.

## Verificação

Na raiz `apps/web`:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

O build somente valida código e rotas. É necessário homologar no ambiente Neon real o cadastro inicial, autenticação, suspensão de usuário, isolamentos por empresa e operação de clientes antes de abrir a aplicação ao público.
