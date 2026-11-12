export type Column = { key: string; label: string; kind?: "money" | "date" | "relation" };
export type ModuleDefinition = {
    slug: string;
    title: string;
    summary: string;
    model: string;
    columns: readonly Column[];
    group: "Comercial" | "Operações" | "Financeiro";
};

export const modules: readonly ModuleDefinition[] = [
    {
        slug: "clientes", title: "Clientes", summary: "Cadastro e relacionamento",
        model: "res.partner", group: "Comercial",
        columns: [
            { key: "display_name", label: "Cliente" },
            { key: "email", label: "E-mail" },
            { key: "phone", label: "Telefone" },
        ],
    },
    {
        slug: "crm", title: "CRM", summary: "Oportunidades e negociações",
        model: "crm.lead", group: "Comercial",
        columns: [
            { key: "name", label: "Oportunidade" },
            { key: "partner_id", label: "Cliente", kind: "relation" },
            { key: "expected_revenue", label: "Receita prevista", kind: "money" },
        ],
    },
    {
        slug: "vendas", title: "Vendas", summary: "Propostas e pedidos",
        model: "sale.order", group: "Comercial",
        columns: [
            { key: "name", label: "Pedido" },
            { key: "partner_id", label: "Cliente", kind: "relation" },
            { key: "amount_total", label: "Valor", kind: "money" },
            { key: "date_order", label: "Data", kind: "date" },
        ],
    },
    {
        slug: "compras", title: "Compras", summary: "Fornecedores e pedidos",
        model: "purchase.order", group: "Operações",
        columns: [
            { key: "name", label: "Pedido" },
            { key: "partner_id", label: "Fornecedor", kind: "relation" },
            { key: "amount_total", label: "Valor", kind: "money" },
        ],
    },
    {
        slug: "estoque", title: "Estoque", summary: "Produtos e inventário",
        model: "product.template", group: "Operações",
        columns: [
            { key: "name", label: "Produto" },
            { key: "default_code", label: "Referência" },
            { key: "list_price", label: "Preço", kind: "money" },
        ],
    },
    {
        slug: "financeiro", title: "Financeiro", summary: "Faturas e lançamentos",
        model: "account.move", group: "Financeiro",
        columns: [
            { key: "name", label: "Documento" },
            { key: "partner_id", label: "Parceiro", kind: "relation" },
            { key: "amount_total", label: "Total", kind: "money" },
            { key: "invoice_date", label: "Emissão", kind: "date" },
        ],
    },
    {
        slug: "pdv", title: "PDV", summary: "Vendas no ponto de venda",
        model: "pos.order", group: "Comercial",
        columns: [
            { key: "name", label: "Venda" },
            { key: "amount_total", label: "Valor", kind: "money" },
            { key: "date_order", label: "Data", kind: "date" },
        ],
    },
] as const;

export function getModule(slug: string): ModuleDefinition | undefined {
    return modules.find((item) => item.slug === slug);
}
