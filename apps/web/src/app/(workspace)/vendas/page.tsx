import Link from "next/link";
import type { Metadata } from "next";
import { z } from "zod";
import { Icon } from "@/components/icons";
import { StatusEmpty } from "@/components/status-empty";
import { getAuthorizedSession } from "@/lib/auth";
import { listSales } from "@/lib/sales";
import { saleNumber } from "@/lib/sales-validation";

export const metadata: Metadata = { title: "Vendas" };
type Props = { searchParams: Promise<{ busca?: string | string[]; salvo?: string | string[] }> };
const searchSchema = z.string().trim().max(80);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" });

export default async function SalesPage({ searchParams }: Props) {
    const query = await searchParams;
    const parsed = searchSchema.safeParse(typeof query.busca === "string" ? query.busca : "");
    const search = parsed.success ? parsed.data : "";
    const { id } = await getAuthorizedSession();
    let sales: Awaited<ReturnType<typeof listSales>> = [];
    let failed = false;
    try { sales = await listSales(id, search); }
    catch { failed = true; }

    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> VENDAS</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Vendas<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Propostas e pedidos com estoque sincronizado por empresa.</p>
                </div>
                <Link className="button button-primary" href="/vendas/novo">
                    <Icon name="receipt" size={18} /> Novo pedido
                </Link>
            </div>
            {query.salvo === "1" && <p className="form-notice customer-success" role="status">Pedido salvo. Confirme para dar baixa no estoque.</p>}
            <section className="data-section" aria-labelledby="pedidos-lista">
                <div className="data-toolbar">
                    <div className="data-toolbar-title">
                        <div className="data-toolbar-heading">
                            <h2 id="pedidos-lista">Pedidos comerciais</h2>
                            {!failed && <span className="count-pill">{sales.length}{sales.length === 50 ? "+" : ""}</span>}
                        </div>
                        <p>Pedidos não emitem notas fiscais, boletos ou cobranças automaticamente.</p>
                    </div>
                    <form className="data-search" role="search" method="GET">
                        <label className="visually-hidden" htmlFor="buscar-vendas">Pesquisar pedidos</label>
                        <Icon name="search" size={18} />
                        <input id="buscar-vendas" name="busca" type="search"
                            placeholder="Cliente ou número..." maxLength={80} defaultValue={search} />
                        <button type="submit" aria-label="Pesquisar pedidos"><Icon name="arrow-right" size={17} /></button>
                    </form>
                </div>
                {failed ? (
                    <StatusEmpty variant="error" title="Pedidos indisponíveis"
                        description="O módulo de vendas ainda não foi migrado ou está temporariamente indisponível." />
                ) : sales.length === 0 ? (
                    <StatusEmpty title={search ? "Nenhum pedido encontrado" : "Comece seu primeiro pedido"}
                        description={search ? "Experimente outro cliente ou número." : "Cadastre um cliente e produtos e crie a primeira proposta."} />
                ) : (
                    <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabela de pedidos">
                        <table className="data-table">
                            <thead><tr>
                                <th scope="col">Pedido</th><th scope="col">Cliente</th>
                                <th scope="col">Valor</th><th scope="col">Criado em</th>
                                <th scope="col">Situação</th><th scope="col" className="table-end">Ações</th>
                            </tr></thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td className="table-primary">{saleNumber(sale.id)}</td>
                                        <td>{sale.customerName}</td>
                                        <td>{brl.format(sale.totalCents / 100)}</td>
                                        <td>{day.format(new Date(sale.createdAt))}</td>
                                        <td>{sale.status === "confirmed" ? "Confirmado" : "Rascunho"}</td>
                                        <td className="table-end">
                                            <Link className="customer-edit-link" href={`/vendas/${sale.id}`}>
                                                Visualizar <Icon name="chevron-right" size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="table-footer">
                    <span>Exibindo até 50 pedidos</span>
                    <span>Valores em reais (BRL)</span>
                </div>
            </section>
        </div>
    );
}
