export default function WorkspaceLoading() {
    return (
        <div className="page-enter" aria-label="Carregando informações" role="status">
            <div className="skeleton skeleton-line" style={{ width: 160 }} />
            <div className="skeleton skeleton-heading" />
            <div className="skeleton-grid">
                {[1, 2, 3, 4].map((item) => (
                    <div className="skeleton skeleton-card" key={item} />
                ))}
            </div>
            <div className="skeleton skeleton-table" />
        </div>
    );
}
