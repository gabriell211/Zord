import postgres from "postgres";

export class DatabaseUnavailableError extends Error {
    constructor() {
        super("O banco de dados do Zord está indisponível.");
        this.name = "DatabaseUnavailableError";
    }
}

let connection: ReturnType<typeof postgres> | undefined;

export function database(): ReturnType<typeof postgres> {
    const url = process.env.DATABASE_URL;
    if (!url) throw new DatabaseUnavailableError();
    if (connection) return connection;

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new DatabaseUnavailableError();
    }
    if (!["postgresql:", "postgres:"].includes(parsed.protocol) ||
        !parsed.hostname || !parsed.username || !parsed.password ||
        !parsed.pathname || parsed.pathname === "/") {
        throw new DatabaseUnavailableError();
    }

    connection = postgres(url, {
        ssl: "require",
        max: 2,
        prepare: false,
        idle_timeout: 10,
        connect_timeout: 10,
        connection: { application_name: "zord-web" },
    });
    return connection;
}
