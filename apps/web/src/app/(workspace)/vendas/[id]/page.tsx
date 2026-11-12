import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorizedSession } from "@/lib/auth";
import { getSale, SaleNotFoundError } from "@/lib/sales";
import { saleNumber } from "@/lib/sales-validation";
import { ConfirmSaleButton } from "@/components/confirm-sale-button";

export const metadata: Metadata = { title: "Detalhes do pedido" };
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
type Props = { params: Promise<{ id: string }> };

export default async function SaleDetailPage({ params }: Props) {
    const raw = (await params).id;
    if (!/^[1-9]\d{0,9}$/.test(raw)) notFound();
    const id = Number(raw);
    if (!Number.isSafeInteger(id)) notFound();
    const session = await getAuthorizedSession();
    let detail: Awaited<ReturnType<typeof getSale>>;
    try { detail = await getSale(session.id, id); }
    catch (error) {
        if (error instanceof SaleNotFoundError) notFound();
        throw error;
    }
    const { sale, items } = detail;
    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> VENDAS / PEDIDO</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">{saleNumber(sale.id)}<span className="title-period">.</span></h1>
                    <p className="page-subtitle">{sale.customerName} · {sale.status === "confirmed" ? "Confirmado" : "Rascunho"}</p>
                </div>
                <Link className="button button-secondary" href="/vendas">Voltar para pedidos</Link>
            </div>
            <section className="data-section" aria-labelledby="itens-pedido">
                <div className="data-toolbar">
                    <div className="data-toolbar-title">
                        <div className="data-toolbar-heading"><h2 id="itens-pedido">Itens do pedido</h2><span className="count-pill">{items.length}</span></div>
                        <p>Os preços são preservados conforme a criação do pedido.</p>
                    </div>
                </div>
                <div className="table-scroll" tabIndex={0} role="region" aria-label="Itens do pedido">
                    <table className="data-table">
                        <thead><tr><th scope="col">Produto</th><th scope="col">SKU</th><th scope="col">Quantidade</th><th scope="col">Unitário</th><th scope="col">Subtotal</th></tr></thead>
                        <tbody>
                            {items.map((item) => <tr key={item.productId}>
                                <td className="table-primary">{item.productName}</td><td>{item.sku || "—"}</td>
                                <td>{item.quantity.toLocaleString("pt-BR")}</td>
                                <td>{brl.format(item.unitPriceCents / 100)}</td>
                                <td>{brl.format(item.lineTotalCents / 100)}</td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <strong>Total: {brl.format(sale.totalCents / 100)}</strong>
                    <span>{sale.status === "confirmed" ? "Estoque baixado" : "Estoque ainda não movimentado"}</span>
                </div>
            </section>
            {sale.status === "draft" && <div className="customer-form-footer">
                <ConfirmSaleButton saleId={sale.id} />
            </div>}
            <p className="form-description">Pedido comercial interno, sem emissão fiscal ou integração de pagamento.</p>
        </div>
    );
}
