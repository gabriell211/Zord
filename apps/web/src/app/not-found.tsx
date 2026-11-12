import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
    return (
        <main className="error-screen">
            <span className="error-screen-icon"><Icon name="search" size={27} /></span>
            <span className="eyebrow">PÁGINA NÃO ENCONTRADA</span>
            <h1>Não encontramos essa página.</h1>
            <p>Verifique o endereço ou volte para o painel principal do Zord.</p>
            <Link className="button button-primary" href="/painel">
                Voltar ao painel <Icon name="arrow-right" size={18} />
            </Link>
        </main>
    );
}
