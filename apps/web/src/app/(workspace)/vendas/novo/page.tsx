import type { Metadata } from "next";
import Link from "next/link";
import { getAuthorizedSession } from "@/lib/auth";
import { listCustomers } from "@/lib/customers";
import { listProducts } from "@/lib/products";
import { SalesForm } from "@/components/sales-form";
import { StatusEmpty } from "@/components/status-empty";

export const metadata: Metadata = { title: "Novo pedido" };

export default async function NewSalePage() {
    const { id } = await getAuthorizedSession();
    let customers: Awaited<ReturnType<typeof listCustomers>> = [];
    let products: Awaited<ReturnType<typeof listProducts>> = [];
    let unavailable = false;
    try {
        [customers, products] = await Promise.all([listCustomers(id), listProducts(id)]);
    } catch { unavailable = true; }

    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> VENDAS / NOVO</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Novo pedido<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Monte uma proposta em BRL. O estoque só é reduzido após confirmação.</p>
                </div>
            </div>
            {unavailable ? (
                <StatusEmpty variant="error" title="Vendas indisponíveis"
                    description="Não foi possível consultar clientes e produtos." />
            ) : customers.length === 0 || products.length === 0 ? (
                <div className="customer-form">
                    <StatusEmpty title="Cadastre seus dados primeiro"
                        description="É necessário ter pelo menos um cliente e um produto para criar um pedido." />
                    <div className="customer-form-footer">
                        <Link className="button button-secondary" href="/clientes/novo">Cadastrar cliente</Link>
                        <Link className="button button-primary" href="/estoque/novo">Cadastrar produto</Link>
                    </div>
                </div>
            ) : <SalesForm customers={customers} products={products} />}
        </div>
    );
}
