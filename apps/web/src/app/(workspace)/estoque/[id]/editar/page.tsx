import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorizedSession } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";
import { getProduct, ProductNotFoundError } from "@/lib/products";

export const metadata: Metadata = { title: "Editar produto" };
type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
    const raw = (await params).id;
    if (!/^[1-9]\d{0,9}$/.test(raw)) notFound();
    const id = Number(raw);
    if (!Number.isSafeInteger(id)) notFound();
    const { id: sessionId } = await getAuthorizedSession();
    let product;
    try { product = await getProduct(sessionId, id); }
    catch (error) {
        if (error instanceof ProductNotFoundError) notFound();
        throw error;
    }
    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>OPERAÇÕES</span><span className="breadcrumb-line" /> ESTOQUE / EDITAR</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Editar produto<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Atualize os preços e saldos com segurança.</p>
                </div>
            </div>
            <ProductForm initial={product} />
        </div>
    );
}
