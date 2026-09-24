export default function Home() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                position: "relative",
                zIndex: 2,
            }}
        >
            <div className="retro-card" style={{ maxWidth: "480px", textAlign: "center" }}>
                <span className="retro-badge">[ONLINE]</span>
                <h1 className="pixel-heading" style={{ fontSize: "1.75rem", margin: "1.5rem 0 1rem" }}>
                    Hello World
                </h1>
                <p style={{ color: "var(--text-dim)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    A simple Next.js app connected to a live Supabase database.
                </p>
                <a href="/projects" className="retro-button">
                    View Projects <span className="arrow">&gt;</span>
                </a>
            </div>
        </main>
    );
}