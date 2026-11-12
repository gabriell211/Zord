import type { Metadata } from "next";
import { CustomerForm } from "@/components/customer-form";
import { getAuthorizedSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewCustomerPage() {
    await getAuthorizedSession();
    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> CLIENTES / NOVO</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Novo cliente<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Um cadastro simples, consistente e integrado.</p>
                </div>
            </div>
            <CustomerForm />
        </div>
    );
}
