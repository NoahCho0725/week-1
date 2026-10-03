import Link from "next/link";
import { getUserAndProfile } from "@/lib/supabase-server";

export default async function Home() {
    const { user, profile } = await getUserAndProfile();

    return (
        <main className="page-center">
            <div className="retro-card" style={{ maxWidth: "480px", textAlign: "center" }}>
                <span className="retro-badge">{user ? "[SIGNED IN]" : "[ONLINE]"}</span>
                <h1 className="pixel-heading" style={{ fontSize: "1.75rem", margin: "1.5rem 0 1rem" }}>
                    Hello World
                </h1>
                <p style={{ color: "var(--text-dim)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    {user
                        ? `Welcome back${profile?.first_name ? `, ${profile.first_name}` : ""}.`
                        : "A simple Next.js app connected to a live Supabase database. Sign in to view projects."}
                </p>
                {user ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                        <Link href="/projects" className="retro-button">
                            View Projects <span className="arrow">&gt;</span>
                        </Link>
                        <Link href="/profile" className="retro-button">
                            Profile <span className="arrow">&gt;</span>
                        </Link>
                        <form action="/auth/signout" method="post">
                            <button type="submit" className="link-button">
                                Sign out
                            </button>
                        </form>
                    </div>
                ) : (
                    <Link href="/login" className="retro-button">
                        Sign in <span className="arrow">&gt;</span>
                    </Link>
                )}
            </div>
        </main>
    );
}
