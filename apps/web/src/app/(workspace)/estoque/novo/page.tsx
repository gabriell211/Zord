import type { Metadata } from "next";
import { getAuthorizedSession } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
    await getAuthorizedSession();
    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>OPERAÇÕES</span><span className="breadcrumb-line" /> ESTOQUE / NOVO</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Novo produto<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Cadastre os itens do seu catálogo em reais.</p>
                </div>
            </div>
            <ProductForm />
        </div>
    );
}
