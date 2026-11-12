import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { StatusEmpty } from "@/components/status-empty";
import { getAuthorizedSession } from "@/lib/auth";
import { getModule, type Column } from "@/lib/modules";
import { listRecords } from "@/lib/erp";
import { z } from "zod";

type PageProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ busca?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const definition = getModule(slug);
    return { title: definition?.title ?? "Não encontrado" };
}

const searchSchema = z.string().trim().max(80);

function displayCell(record: Record<string, unknown>, column: Column): string {
    const value = record[column.key];
    if (value === null || value === undefined || value === false || value === "") return "—";
    if (column.kind === "relation") {
        return Array.isArray(value) && typeof value[1] === "string" ? value[1] : "—";
    }
    if (column.kind === "money") {
        if (typeof value !== "number" || !Number.isFinite(value)) return "—";
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    }
    if (column.kind === "date") {
        if (typeof value !== "string") return "—";
        const asDate = new Date(value.replace(" ", "T") + (value.includes(" ") ? "Z" : ""));
        return Number.isNaN(asDate.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short", timeZone: "America/Sao_Paulo",
        }).format(asDate);
    }
    return typeof value === "string" || typeof value === "number" ? String(value) : "—";
}

export default async function ModulePage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const definition = getModule(slug);
    if (!definition) notFound();

    const rawSearch = (await searchParams).busca;
    const parsed = searchSchema.safeParse(typeof rawSearch === "string" ? rawSearch : "");
    const search = parsed.success ? parsed.data : "";
    const { id } = await getAuthorizedSession();

    let rows: Record<string, unknown>[] = [];
    let failed = false;
    try {
        rows = await listRecords(id, definition.model, definition.columns.map((column) => column.key), search);
    } catch {
        failed = true;
    }

    return (
        <div className="definition-page page-enter">
            <div className="page-breadcrumb"><span>MÓDULOS</span><span className="breadcrumb-line" /> {definition.title.toUpperCase()}</div>
            <div className="page-title-row definition-title-row">
                <div>
                    <h1 className="page-title">{definition.title}<span className="title-period">.</span></h1>
                    <p className="page-subtitle">{definition.summary}. Informações atualizadas do seu ERP.</p>
                </div>
                <Link className="button button-secondary button-back" href="/painel">
                    <Icon name="overview" size={18} /> Visão geral
                </Link>
            </div>

            <section className="data-section" aria-labelledby="records-title">
                <div className="data-toolbar">
                    <div className="data-toolbar-title">
                        <div className="data-toolbar-heading">
                            <h2 id="records-title">Registros</h2>
                            {!failed && <span className="count-pill">{rows.length}{rows.length === 30 ? "+" : ""}</span>}
                        </div>
                        <p>Consulte e encontre informações com facilidade.</p>
                    </div>
                    <form className="data-search" role="search" method="GET">
                        <label className="visually-hidden" htmlFor="busca-modulo">Pesquisar registros</label>
                        <Icon name="search" size={18} />
                        <input
                            id="busca-modulo"
                            name="busca"
                            type="search"
                            placeholder="Pesquisar registros..."
                            maxLength={80}
                            defaultValue={search}
                        />
                        <button type="submit" aria-label="Buscar"><Icon name="arrow-right" size={17} /></button>
                    </form>
                </div>

                {failed ? (
                    <StatusEmpty
                        variant="error"
                        title="Módulo indisponível"
                        description="Não foi possível consultar este módulo. Verifique se está instalado e se sua conta possui permissão de acesso."
                    />
                ) : rows.length === 0 ? (
                    <StatusEmpty
                        title={search ? "Nenhum resultado encontrado" : "Nenhum registro por aqui"}
                        description={search ? "Tente uma busca diferente ou remova o filtro." : "Os registros aparecerão aqui quando forem cadastrados no sistema."}
                    />
                ) : (
                    <div className="table-scroll" tabIndex={0} role="region" aria-label={`Tabela de ${definition.title}`}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {definition.columns.map((column) => (
                                        <th scope="col" key={column.key}>{column.label}</th>
                                    ))}
                                    <th scope="col" className="table-end">#</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={typeof row.id === "number" ? row.id : index}>
                                        {definition.columns.map((column, columnIndex) => (
                                            <td key={column.key} className={columnIndex === 0 ? "table-primary" : ""}>
                                                {displayCell(row, column)}
                                            </td>
                                        ))}
                                        <td className="table-end"> </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="table-footer">
                    <span>Exibindo até 30 registros</span>
                    <span>Valores monetários em reais (BRL)</span>
                </div>
            </section>
        </div>
    );
}
