import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/setup-form";
import { setupComplete } from "@/lib/identity";

export const metadata: Metadata = { title: "Instalação inicial" };
export const dynamic = "force-dynamic";

export default async function InstallationPage() {
    let available = true;
    let installed = false;
    try {
        installed = await setupComplete();
    } catch {
        available = false;
    }
    if (installed) redirect("/login");

    return (
        <main className="auth-layout">
            <section className="auth-showcase" aria-label="Zord">
                <div className="auth-brand">
                    <span className="auth-brand-symbol" aria-hidden="true">Z</span>
                    <strong>zord<span>.</span></strong>
                </div>
                <div className="auth-showcase-content">
                    <div className="auth-label">PREPARE SEU NEGÓCIO</div>
                    <h1>Seu espaço.<br /><em>Seu Zord.</em></h1>
                    <p>Configure a primeira empresa e o administrador com armazenamento seguro no Neon.</p>
                </div>
            </section>
            <section className="auth-form-area" aria-label="Configuração inicial">
                <div className="auth-form-container">
                    <span className="form-kicker">CONFIGURAÇÃO INICIAL</span>
                    <h2>Primeiro acesso</h2>
                    <p className="form-description">O cadastro inicial é permitido uma única vez e exige a chave de instalação.</p>
                    {available ? (
                        <SetupForm />
                    ) : (
                        <p className="form-error" role="alert">
                            O banco ainda não foi inicializado. Consulte a configuração do projeto no Neon.
                        </p>
                    )}
                    <p className="form-support">
                        Já configurou? <Link href="/login">Entrar na minha conta</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
