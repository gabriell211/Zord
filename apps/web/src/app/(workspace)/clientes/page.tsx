import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { StatusEmpty } from "@/components/status-empty";
import { getAuthorizedSession } from "@/lib/auth";
import { listCustomers } from "@/lib/customers";
import { z } from "zod";

export const metadata: Metadata = { title: "Clientes" };

type PageProps = {
    searchParams: Promise<{ busca?: string | string[]; salvo?: string | string[] }>;
};
const searchSchema = z.string().trim().max(80);

export default async function CustomersPage({ searchParams }: PageProps) {
    const query = await searchParams;
    const parsed = searchSchema.safeParse(typeof query.busca === "string" ? query.busca : "");
    const search = parsed.success ? parsed.data : "";
    const { id } = await getAuthorizedSession();
    let customers: Awaited<ReturnType<typeof listCustomers>> = [];
    let failed = false;
    try {
        customers = await listCustomers(id, search);
    } catch {
        failed = true;
    }

    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>COMERCIAL</span><span className="breadcrumb-line" /> CLIENTES</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Clientes<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Seu relacionamento comercial organizado em um só lugar.</p>
                </div>
                <Link href="/clientes/novo" className="button button-primary">
                    <Icon name="users" size={18} /> Novo cliente
                </Link>
            </div>

            {query.salvo === "1" && <p className="form-notice customer-success" role="status">Cadastro salvo com sucesso.</p>}

            <section className="data-section" aria-labelledby="clientes-lista">
                <div className="data-toolbar">
                    <div className="data-toolbar-title">
                        <div className="data-toolbar-heading">
                            <h2 id="clientes-lista">Cadastros</h2>
                            {!failed && <span className="count-pill">{customers.length}{customers.length === 50 ? "+" : ""}</span>}
                        </div>
                        <p>Os dados são consultados diretamente do sistema empresarial.</p>
                    </div>
                    <form className="data-search" role="search" method="GET">
                        <label className="visually-hidden" htmlFor="buscar-clientes">Pesquisar clientes</label>
                        <Icon name="search" size={18} />
                        <input
                            id="buscar-clientes"
                            name="busca"
                            type="search"
                            placeholder="Nome ou e-mail..."
                            maxLength={80}
                            defaultValue={search}
                        />
                        <button type="submit" aria-label="Pesquisar clientes">
                            <Icon name="arrow-right" size={17} />
                        </button>
                    </form>
                </div>
                {failed ? (
                    <StatusEmpty
                        variant="error"
                        title="Clientes indisponíveis"
                        description="Não foi possível acessar os cadastros. Verifique sua conexão e suas permissões no ERP."
                    />
                ) : customers.length === 0 ? (
                    <StatusEmpty
                        title={search ? "Nenhum cliente encontrado" : "Comece pelo seu primeiro cliente"}
                        description={search ? "Tente pesquisar outro nome ou e-mail." : "Use o botão Novo cliente para cadastrar seu primeiro contato comercial."}
                    />
                ) : (
                    <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabela de clientes">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Cliente</th>
                                    <th scope="col">E-mail</th>
                                    <th scope="col">Telefone</th>
                                    <th scope="col" className="table-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="table-primary">{customer.name}</td>
                                        <td>{customer.email || "—"}</td>
                                        <td>{customer.phone || "—"}</td>
                                        <td className="table-end">
                                            <Link className="customer-edit-link" href={`/clientes/${customer.id}/editar`}>
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
                    <span>Exibindo até 50 clientes</span>
                    <span>Dados protegidos por permissões do ERP</span>
                </div>
            </section>
        </div>
    );
}
