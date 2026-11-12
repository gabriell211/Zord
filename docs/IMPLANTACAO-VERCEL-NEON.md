# Implantação do Zord: Vercel + Neon

## Infraestrutura provisionada em 12/11/2026

| Componente | Configuração |
| --- | --- |
| Repositório | `gabriell211/Zord` |
| Interface | Vercel, projeto `zord`, Next.js, raiz `apps/web`, Node.js 24 |
| Região das funções web | São Paulo (`gru1`) |
| PostgreSQL | Neon, projeto `plain-cell-06096828`, PostgreSQL 17 |
| Banco e proprietário | `zord` / `zord_owner` |
| Branch do banco | `main` (`br-muddy-paper-bddt46xg`) |
| Região do banco | `aws-us-east-2` |
| Domínio web | `https://zord-orcin.vercel.app` |

**Estado:** web implantada; banco criado e acessível, mas ainda sem o esquema ERP. O login e os módulos de negócios exigem instalar o serviço ERP em uma hospedagem Python persistente e configurar a conexão HTTPS. Uma página web publicada não equivale a um ERP funcional.

## Fluxo de dados

```text
Navegador
  -> Zord Web (Vercel / Next.js)
  -> Zord ERP (processo Python persistente, HTTPS)
  -> Neon PostgreSQL (conexão direta criptografada)
```

A Vercel **não** executa o núcleo ERP Python nem as tarefas persistentes de negócio do repositório. A Neon fornece PostgreSQL, não um servidor de aplicações. Execute o ERP em um serviço próprio com armazenamento persistente para anexos, sessões e demais arquivos, além de capacidade para tarefas agendadas.

## Preparação do ERP para o Neon

No painel **Connect** do projeto Neon Zord, selecione o banco `zord`, o papel `zord_owner` e **desative Connection pooling**. Esse ERP precisa de uma conexão PostgreSQL direta: as conexões via PgBouncer em modo transacional não preservam todo o estado de sessão, `LISTEN/NOTIFY` e alguns recursos de manutenção.

Configure as credenciais **somente** no gerenciador de segredos da hospedagem Python, nunca no código-fonte, em logs ou no navegador. Exemplo de arquivo de configuração gerado **em tempo de execução**:

```ini
[options]
addons_path = addons,odoo/addons,custom_addons
http_port = 8069
db_host = <host-direto-do-neon>
db_port = 5432
db_user = zord_owner
db_sslmode = require
db_name = zord
dbfilter = ^zord$
list_db = False
load_language = pt_BR
```

Forneça a senha PostgreSQL pelo secret `PGPASSWORD`, sem gravá-la no repositório. Recomendam-se segredo de administração independente, TLS no proxy HTTPS e backups verificados. Para tarefas financeiras e fiscais, não considere o ambiente homologado sem testes e integrações próprias.

O banco `zord` **já foi criado no Neon**; antes da primeira inicialização, verifique que não possui tabelas. Com o host, usuário e senha configurados e o ambiente Python pronto, inicialize o esquema e os módulos brasileiros na instância persistente:

```bash
python3 odoo-bin -c /caminho/seguro/zord.conf -d zord \
  --init=base,web,l10n_br,zord_brand \
  --load-language=pt_BR --without-demo=all --stop-after-init
```

Depois execute o serviço ERP com `python3 odoo-bin -c /caminho/seguro/zord.conf -d zord`. Não execute a inicialização em um banco já povoado sem backup e revisão da migração.

## Variáveis Vercel

Configure em **Vercel > zord > Settings > Environment Variables**, para produção e preview:

| Variável | Valor |
| --- | --- |
| `ZORD_ERP_DB` | `zord` (já configurada) |
| `ZORD_ERP_URL` | URL **HTTPS** do serviço ERP hospedado, pendente |

A aplicação web já valida `ZORD_ERP_URL` no servidor, mantém a sessão com cookie `HttpOnly` e acessa o ERP por RPC de servidor, não diretamente pelo navegador. **Não coloque** `DATABASE_URL`, `PGPASSWORD` ou outras credenciais do Neon na Vercel enquanto não houver código servidor que precise delas; nesse desenho, somente o serviço ERP acessa o PostgreSQL.

## Homologação de produção

1. Verificar o banco e o TLS via conexão direta e confirmar o esquema inicializado.
2. Confirmar que o ERP Python permanece disponível, tem armazenamento persistente e HTTPS.
3. Ajustar `ZORD_ERP_URL` na Vercel e publicar novo deployment.
4. Testar login real, expiração de sessão, isolamento de avatares e controles de acesso.
5. Testar cadastro e edição de clientes, consultas aos módulos, perda de rede e retomada do banco.
6. Conferir logs, backups, permissões de usuários, recuperação e tempos de resposta.
7. Executar `npm run lint && npm run typecheck && npm run test && npm run build` em `apps/web`.

**Atenção:** o banco Neon criado ainda não possui tabelas ERP. A web apresenta login, mas a autenticação continuará indisponível até a implantação do processo Python.
