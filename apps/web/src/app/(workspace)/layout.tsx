import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getAuthorizedSession } from "@/lib/auth";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
    const { user } = await getAuthorizedSession();
    const name = user.name || user.username || "Usuário";

    return <WorkspaceShell username={name}>{children}</WorkspaceShell>;
}
