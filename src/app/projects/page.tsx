import { supabase } from "@/lib/supabase";

export default async function ProjectsPage() {
    const { data, error } = await supabase.from("projects").select("*");

    if (error) {
        return <p style={{ padding: "2rem", color: "var(--text)" }}>Something went wrong loading projects.</p>;
    }

    if (!data || data.length === 0) {
        return <p style={{ padding: "2rem", color: "var(--text)" }}>No projects yet.</p>;
    }

    return (
        <main style={{ maxWidth: "700px", margin: "0 auto", padding: "3rem 2rem", position: "relative", zIndex: 2 }}>
            <h1 className="pixel-heading" style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
                Projects
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.map((project) => (
                    <div key={project.id} className="retro-card" style={{ padding: "1.5rem" }}>
                        <span className="retro-badge">[ACTIVE]</span>
                        <h2 style={{ fontSize: "1.1rem", margin: "0.75rem 0 0.5rem", color: "var(--text)" }}>
                            {project.name}
                        </h2>
                        <p style={{ color: "var(--text-dim)", margin: 0 }}>{project.description}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}