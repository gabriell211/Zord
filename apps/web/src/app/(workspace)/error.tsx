"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="error-screen">
            <span className="error-screen-icon"><Icon name="shield" size={28} /></span>
            <span className="eyebrow">CONEXÃO INTERROMPIDA</span>
            <h1>Não foi possível carregar esta área.</h1>
            <p>O serviço de gestão pode estar temporariamente indisponível. Seus dados permanecem preservados.</p>
            <div className="error-screen-buttons">
                <button className="button button-primary" type="button" onClick={reset}>
                    <Icon name="refresh" size={18} /> Tentar novamente
                </button>
                <Link className="button button-secondary" href="/login">Voltar ao login</Link>
            </div>
        </main>
    );
}
