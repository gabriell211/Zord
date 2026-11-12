import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { getAuthorizedSession } from "@/lib/auth";
import { countRecords } from "@/lib/erp";

export const metadata: Metadata = { title: "Visão geral" };

const metricDefinitions: { name: string; model: string; slug: string; icon: IconName; detail: string }[] = [
    { name: "Clientes", model: "res.partner", slug: "clientes", icon: "users", detail: "Contatos registrados" },
    { name: "Oportunidades", model: "crm.lead", slug: "crm", icon: "target", detail: "Negócios no CRM" },
    { name: "Pedidos de venda", model: "sale.order", slug: "vendas", icon: "receipt", detail: "Pedidos registrados" },
    { name: "Produtos", model: "product.template", slug: "estoque", icon: "package", detail: "Itens cadastrados" },
];

const quickLinks: { slug: string; name: string; icon: IconName; description: string }[] = [
    { slug: "vendas", name: "Vendas", icon: "receipt", description: "Pedidos e propostas" },
    { slug: "clientes", name: "Clientes", icon: "users", description: "Relações comerciais" },
    { slug: "estoque", name: "Estoque", icon: "package", description: "Produtos e inventário" },
    { slug: "financeiro", name: "Financeiro", icon: "wallet", description: "Controle e faturamento" },
];

export default async function DashboardPage() {
    const { id, user } = await getAuthorizedSession();
    const metrics = await Promise.allSettled(
        metricDefinitions.map((metric) => countRecords(id, metric.model))
    );
    const time = new Date();
    const hour = Number(new Intl.DateTimeFormat("en-GB", {
        hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo",
    }).format(time));
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const name = (user.name || user.username || "").trim().split(/\s+/)[0] || "bem-vindo";
    const date = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full", timeZone: "America/Sao_Paulo",
    }).format(time);

    return (
        <div className="dashboard page-enter">
            <div className="page-breadcrumb"><span>PAINEL</span><span className="breadcrumb-line" /> VISÃO GERAL</div>
            <div className="page-title-row">
                <div>
                    <h1 className="page-title">{greeting}, {name}<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Uma visão clara do seu negócio, em um só lugar.</p>
                </div>
                <div className="date-pill">{date}</div>
            </div>

            <section className="metrics-section" aria-label="Indicadores do negócio">
                <div className="section-caption-row">
                    <div>
                        <h2 className="section-heading">Seus números</h2>
                        <p className="section-description">Informações consultadas diretamente do seu ERP.</p>
                    </div>
                    <span className="section-label">VISÃO ATUAL</span>
                </div>
                <div className="metrics-grid">
                    {metricDefinitions.map((metric, index) => {
                        const value = metrics[index];
                        const amount = value?.status === "fulfilled" ? value.value.toLocaleString("pt-BR") : "—";
                        return (
                            <Link key={metric.slug} href={`/${metric.slug}`} className="metric-card">
                                <div className="metric-top">
                                    <span className="metric-icon"><Icon name={metric.icon} size={21} /></span>
                                    <Icon name="arrow-up-right" size={18} className="metric-arrow" />
                                </div>
                                <div>
                                    <strong className="metric-number">{amount}</strong>
                                    <h3 className="metric-name">{metric.name}</h3>
                                    <span className="metric-description">{value?.status === "fulfilled" ? metric.detail : "Módulo indisponível"}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <div className="dashboard-bottom-grid">
                <section className="overview-panel" aria-label="Acesso rápido">
                    <div className="panel-heading-row">
                        <div>
                            <span className="panel-kicker">ACESSO RÁPIDO</span>
                            <h2>Onde deseja começar?</h2>
                        </div>
                        <span className="subtle-icon"><Icon name="overview" size={20} /></span>
                    </div>
                    <div className="quick-links">
                        {quickLinks.map((link) => (
                            <Link className="quick-link" key={link.slug} href={`/${link.slug}`}>
                                <span className="quick-icon"><Icon name={link.icon} size={20} /></span>
                                <span className="quick-copy">
                                    <strong>{link.name}</strong>
                                    <small>{link.description}</small>
                                </span>
                                <Icon name="chevron-right" size={17} />
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="insight-panel" aria-labelledby="insight-title">
                    <div className="insight-pattern" aria-hidden="true" />
                    <span className="insight-pill"><Icon name="check" size={14} /> SEU AMBIENTE</span>
                    <div className="insight-content">
                        <h2 id="insight-title">Tudo no lugar.<br />Tudo conectado.</h2>
                        <p>Os principais setores da sua empresa, organizados para você trabalhar com mais tranquilidade.</p>
                        <Link href="/clientes" className="insight-link">
                            Explorar módulos <Icon name="arrow-right" size={18} />
                        </Link>
                    </div>
                    <div className="insight-bottom">
                        <span className="insight-dot" />
                        <span>BRASIL · BRL · PT-BR</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
