# Zord

**Zord** é uma plataforma de gestão empresarial para o Brasil.

## Padrões do produto

- Idioma inicial: **Português do Brasil (`pt_BR`)**.
- Moeda inicial: **Real brasileiro (`BRL` / R$)**.
- País: **Brasil (`BR`)**.
- Fuso horário inicial do administrador: **America/Sao_Paulo**.
- Marca apresentada aos usuários: **Zord**.
- Módulos principais: vendas, CRM, PDV, estoque, compras, financeiro e gestão empresarial, conforme os módulos instalados.

## Instalação

O código-base do ERP Community 20.0 **já foi importado** para este repositório a partir de um commit fixo. Instale PostgreSQL e os requisitos Python da versão-base e execute:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
bash scripts/inicializar-brasil.sh
python3 odoo-bin -c config/zord.conf -d zord
```

A criação do banco usa a localização brasileira e o módulo `zord_brand`. **Faça backup antes de aplicar alterações a bancos existentes.** Recomendamos configurar as credenciais de PostgreSQL fora do repositório e restringir acesso ao gerenciador de bancos.

## Implantação na nuvem

A aplicação principal é **100% web** com **Vercel (Next.js 16, Node.js 24)** e **PostgreSQL no Neon**. Login, empresas, clientes, produtos/estoque e avatares usam o núcleo nativo em `apps/web`, sem necessidade de executar Python. O esquema SQL deve ser migrado antes do primeiro acesso. Veja [Zord Web](apps/web/README.md).

A base ERP histórica em Python permanece no repositório como **legado e referência de migração**, sem integrar automaticamente os módulos de CRM, vendas, fiscal e PDV à aplicação nativa. Consulte [Implantação Zord — Vercel + Neon](docs/IMPLANTACAO-VERCEL-NEON.md) apenas para o cenário legado.

## Tributação brasileira

Configurar BRL e pt_BR **não** significa homologar NF-e, NFC-e, NFS-e, TEF, SPED ou obrigações tributárias. Esses módulos e integrações exigem avaliação e testes próprios.

## Licenças e direitos

**Zord** é a identidade comercial e o código original criado para este produto possui titularidade de seus respectivos autores. A base ERP utilizada provém de **Odoo Community** e preserva sua licença **LGPL-3.0**, direitos autorais e avisos originais. Módulos de terceiros podem possuir licenças adicionais. Consulte `LICENSE`, `COPYRIGHT` e `docs/LICENCAS.md`. Nenhuma licença original é substituída por uma licença proprietária global do Zord.
