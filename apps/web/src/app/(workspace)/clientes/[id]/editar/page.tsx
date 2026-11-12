import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { getAuthorizedSession } from "@/lib/auth";
import { getCustomer, CustomerNotFoundError } from "@/lib/customers";

export const metadata: Metadata = { title: "Editar cliente" };
type Props = { params: Promise<{ id: string }> };

export default async function EditCustomerPage({ params }: Props) {
    const value = (await params).id;
    if (!/^[1-9]\d{0,9}$/.test(value)) notFound();
    const id = Number(value);
    if (!Number.isSafeInteger(id)) notFound();

    const { id: sessionId } = await getAuthorizedSession();
    let customer;
    try {
        customer = await getCustomer(sessionId, id);
    } catch (error) {
        if (error instanceof CustomerNotFoundError) notFound();
        throw error;
    }
    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> CLIENTES / EDITAR</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Editar cliente<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Atualize os dados cadastrais com segurança.</p>
                </div>
            </div>
            <CustomerForm initial={customer} />
        </div>
    );
}
