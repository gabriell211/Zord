# Zord Web

A interface principal do **Zord** é uma aplicação 100% acessível pelo navegador, com **Next.js 16, React 19, TypeScript 7 e Zod 4**.

## Requisitos

- Node.js 24 LTS
- Serviço ERP Zord com banco PostgreSQL inicializado
- Endpoint privado HTTPS para o ERP (HTTP somente em localhost)

## Desenvolvimento

```bash
cd apps/web
cp .env.example .env.local
npm ci
npm run dev
```

Abra `http://localhost:3000`. Se ainda não houver lockfile no checkout, gere-o com `npm install` antes de usar `npm ci`.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `ZORD_ERP_URL` | URL privada do serviço ERP, obrigatoriamente HTTPS em produção |
| `ZORD_ERP_DB` | Nome do banco ERP, por padrão `zord` |

Nunca exponha credenciais do PostgreSQL, cookies de sessão ou o serviço ERP diretamente para o navegador. O cliente web utiliza rotas servidoras, com cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

## Validação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

A integração utiliza RPC autenticado do ERP e respeita as regras de acesso de cada usuário. A interface inicial cobre login, dashboard e consultas de módulos; transações completas de PDV, emissão fiscal e homologação não foram implementadas nesta camada.

## Deploy

Execute o Next.js em um servidor Node.js com HTTPS ou configure na Vercel o diretório raiz `apps/web`, com as variáveis necessárias. **A Vercel não hospeda o processo Python/PostgreSQL do ERP**: ele deve estar em infraestrutura própria ou serviço compatível, com HTTPS e isolamento de rede.
