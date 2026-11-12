import Link from "next/link";
import type { Metadata } from "next";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { StatusEmpty } from "@/components/status-empty";
import { getAuthorizedSession } from "@/lib/auth";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Estoque e produtos" };
type Props = { searchParams: Promise<{ busca?: string | string[]; salvo?: string | string[] }> };
const searchSchema = z.string().trim().max(80);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function ProductsPage({ searchParams }: Props) {
    const query = await searchParams;
    const parsed = searchSchema.safeParse(typeof query.busca === "string" ? query.busca : "");
    const search = parsed.success ? parsed.data : "";
    const { id } = await getAuthorizedSession();
    let products: Awaited<ReturnType<typeof listProducts>> = [];
    let failed = false;
    try { products = await listProducts(id, search); }
    catch { failed = true; }

    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>OPERAÇÕES</span><span className="breadcrumb-line" /> ESTOQUE</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Estoque<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Produtos, preços e saldos da sua empresa em um só lugar.</p>
                </div>
                <Link href="/estoque/novo" className="button button-primary">
                    <Icon name="package" size={18} /> Novo produto
                </Link>
            </div>
            {query.salvo === "1" && <p className="form-notice customer-success" role="status">Produto salvo com sucesso.</p>}
            <section className="data-section" aria-labelledby="produtos-lista">
                <div className="data-toolbar">
                    <div className="data-toolbar-title">
                        <div className="data-toolbar-heading">
                            <h2 id="produtos-lista">Produtos cadastrados</h2>
                            {!failed && <span className="count-pill">{products.length}{products.length === 50 ? "+" : ""}</span>}
                        </div>
                        <p>Dados armazenados no Neon, separados por empresa.</p>
                    </div>
                    <form className="data-search" role="search" method="GET">
                        <label htmlFor="buscar-produtos" className="visually-hidden">Pesquisar produtos</label>
                        <Icon name="search" size={18} />
                        <input id="buscar-produtos" name="busca" type="search" maxLength={80}
                            placeholder="Nome ou referência..." defaultValue={search} />
                        <button type="submit" aria-label="Pesquisar produtos"><Icon name="arrow-right" size={17} /></button>
                    </form>
                </div>
                {failed ? (
                    <StatusEmpty variant="error" title="Estoque indisponível"
                        description="O banco ainda não foi preparado ou está temporariamente indisponível." />
                ) : products.length === 0 ? (
                    <StatusEmpty title={search ? "Nenhum produto encontrado" : "Seu catálogo começa aqui"}
                        description={search ? "Tente outro nome ou referência." : "Use Novo produto para cadastrar o primeiro item."} />
                ) : (
                    <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabela de produtos">
                        <table className="data-table">
                            <thead><tr>
                                <th scope="col">Produto</th><th scope="col">Referência</th>
                                <th scope="col">Preço</th><th scope="col">Quantidade</th>
                                <th scope="col" className="table-end">Ações</th>
                            </tr></thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="table-primary">{product.name}</td>
                                        <td>{product.sku || "—"}</td>
                                        <td>{brl.format(product.priceCents / 100)}</td>
                                        <td>{product.quantity.toLocaleString("pt-BR")}</td>
                                        <td className="table-end">
                                            <Link className="customer-edit-link" href={`/estoque/${product.id}/editar`}>
                                                Editar <Icon name="chevron-right" size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="table-footer">
                    <span>Exibindo até 50 produtos</span>
                    <span>Valores em reais (BRL)</span>
                </div>
            </section>
        </div>
    );
}
