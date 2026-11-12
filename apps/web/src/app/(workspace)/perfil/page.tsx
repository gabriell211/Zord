import type { Metadata } from "next";
import { AvatarEditor } from "@/components/avatar-editor";
import { getAuthorizedSession } from "@/lib/auth";
import { fetchOwnProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
    const { id, user } = await getAuthorizedSession();
    let profile;
    try {
        profile = await fetchOwnProfile(id, user.uid);
    } catch {
        profile = {
            id: user.uid,
            name: user.name || user.username || "Usuário",
            email: "",
        };
    }

    return (
        <div className="module-page page-enter">
            <div className="page-breadcrumb"><span>CONTA</span><span className="breadcrumb-line" /> PERFIL</div>
            <div className="page-title-row module-title-row">
                <div>
                    <h1 className="page-title">Meu perfil<span className="title-period">.</span></h1>
                    <p className="page-subtitle">Sua identidade no Zord, com privacidade e controle.</p>
                </div>
            </div>
            <section className="profile-panel" aria-labelledby="profile-settings-title">
                <div className="profile-panel-intro">
                    <span className="panel-kicker">CONTA PESSOAL</span>
                    <h2 id="profile-settings-title">Personalização</h2>
                    <p>Cada usuário possui um avatar próprio, armazenado em sua conta.</p>
                </div>
                <AvatarEditor name={profile.name} />
                <div className="profile-details-table">
                    <div><span>Nome de exibição</span><strong>{profile.name}</strong></div>
                    <div><span>E-mail da conta</span><strong>{profile.email || "Não informado"}</strong></div>
                    <div><span>Idioma</span><strong>Português (Brasil)</strong></div>
                    <div><span>Moeda</span><strong>Real brasileiro (BRL)</strong></div>
                </div>
            </section>
        </div>
    );
}
