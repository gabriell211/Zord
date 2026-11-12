import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
    title: "Entrar",
};

export default function LoginPage() {
    return (
        <main className="auth-layout">
            <section className="auth-showcase" aria-label="Apresentação do Zord">
                <div className="auth-brand">
                    <span className="auth-brand-symbol" aria-hidden="true">Z</span>
                    <strong>zord<span>.</span></strong>
                </div>

                <div className="auth-showcase-content">
                    <div className="auth-label">
                        <span className="auth-label-line" />
                        UM NOVO JEITO DE GERENCIAR
                    </div>
                    <h1>
                        Menos ruído.
                        <br />
                        Mais <em>clareza.</em>
                    </h1>
                    <p>Vendas, clientes, estoque e financeiro conectados em um único lugar, do jeito que o seu negócio precisa.</p>
                    <div className="auth-showcase-divider" />
                    <div className="auth-feature">
                        <span className="auth-feature-icon"><Icon name="shield" size={22} /></span>
                        <div>
                            <strong>Seu negócio, em boas mãos.</strong>
                            <span>Acesso protegido e dados centralizados.</span>
                        </div>
                    </div>
                </div>

                <div className="auth-showcase-footer">
                    <span>© {new Date().getFullYear()} Zord</span>
                    <span>Feito para quem faz acontecer.</span>
                </div>
                <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
                <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
            </section>

            <section className="auth-form-area" aria-label="Acesso ao sistema">
                <div className="auth-mobile-brand">
                    <span className="auth-brand-symbol" aria-hidden="true">Z</span>
                    <strong>zord<span>.</span></strong>
                </div>
                <div className="auth-form-container">
                    <span className="form-kicker">BEM-VINDO DE VOLTA</span>
                    <h2>Acesse sua conta</h2>
                    <p className="form-description">Entre com suas credenciais para continuar de onde parou.</p>
                    <LoginForm />
                    <div className="auth-assistance">
                        <Icon name="shield" size={16} />
                        Sua conexão é protegida.
                    </div>
                </div>
                <div className="auth-locale">
                    <Icon name="globe" size={16} />
                    Português (Brasil) · BRL
                </div>
            </section>
        </main>
    );
}
