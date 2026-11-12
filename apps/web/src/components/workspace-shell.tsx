"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { LogoutButton } from "@/components/logout-button";
import { modules } from "@/lib/modules";

const moduleIcons: Record<string, IconName> = {
    clientes: "users",
    crm: "target",
    vendas: "receipt",
    compras: "shopping",
    estoque: "package",
    financeiro: "wallet",
    pdv: "credit-card",
};

const groups = ["Comercial", "Operações", "Financeiro"] as const;

export function WorkspaceShell({
    children,
    username,
}: {
    children: React.ReactNode;
    username: string;
}) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="app-shell">
            <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>

            <button
                className="mobile-menu-button"
                type="button"
                aria-controls="zord-sidebar"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"}
                onClick={() => setMenuOpen((current) => !current)}
            >
                <Icon name={menuOpen ? "close" : "menu"} size={22} />
            </button>

            {menuOpen && (
                <button
                    type="button"
                    className="sidebar-backdrop"
                    aria-label="Fechar navegação lateral"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <aside id="zord-sidebar" className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-top">
                    <Brand />
                    <div className="workspace-select">
                        <div className="workspace-avatar" aria-hidden="true">Z</div>
                        <div>
                            <strong>Área de trabalho</strong>
                            <span>Ambiente empresarial</span>
                        </div>
                        <Icon name="chevron-right" size={15} />
                    </div>
                </div>

                <nav className="side-nav" aria-label="Navegação principal">
                    <div className="nav-section">
                        <p className="nav-eyebrow">VISÃO GERAL</p>
                        <Link
                            href="/painel"
                            className={`nav-link ${pathname === "/painel" ? "nav-active" : ""}`}
                            aria-current={pathname === "/painel" ? "page" : undefined}
                            onClick={() => setMenuOpen(false)}
                        >
                            <Icon name="overview" size={19} />
                            <span>Painel de controle</span>
                        </Link>
                    </div>
                    {groups.map((group) => (
                        <div key={group} className="nav-section">
                            <p className="nav-eyebrow">{group.toUpperCase()}</p>
                            {modules.filter((module) => module.group === group).map((module) => (
                                <Link
                                    key={module.slug}
                                    href={`/${module.slug}`}
                                    className={`nav-link ${pathname === `/${module.slug}` ? "nav-active" : ""}`}
                                    aria-current={pathname === `/${module.slug}` ? "page" : undefined}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Icon name={moduleIcons[module.slug] ?? "overview"} size={19} />
                                    <span>{module.title}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-status">
                        <span className="status-indicator" />
                        <span>Brasil · Português (BR)</span>
                    </div>
                    <div className="profile-row">
                        <div className="profile-avatar" aria-hidden="true">
                            {username.trim().slice(0, 1).toLocaleUpperCase("pt-BR") || "U"}
                        </div>
                        <div className="profile-details">
                            <strong>{username}</strong>
                            <span>Conta conectada</span>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            <div className="workspace-content">
                <header className="topbar">
                    <div className="topbar-location">
                        <span className="topbar-brand">Zord</span>
                        <Icon name="chevron-right" size={15} />
                        <span>{pathname === "/painel" ? "Visão geral" : modules.find((module) => pathname === `/${module.slug}`)?.title ?? "Gestão"}</span>
                    </div>
                    <div className="topbar-actions">
                        <form role="search" action="/clientes" method="GET" className="global-search">
                            <Icon name="search" size={18} />
                            <input
                                type="search"
                                name="busca"
                                aria-label="Buscar clientes"
                                placeholder="Buscar clientes..."
                                maxLength={80}
                            />
                            <kbd>↵</kbd>
                        </form>
                        <span className="topbar-locale"><Icon name="globe" size={16} /> PT-BR</span>
                    </div>
                </header>
                <main id="conteudo" className="main-content">
                    {children}
                </main>
                <footer className="workspace-footer">
                    <span>© {new Date().getFullYear()} Zord</span>
                    <span>Gestão com clareza.</span>
                </footer>
            </div>
        </div>
    );
}
