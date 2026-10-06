import Link from "next/link";

// Shown on signed-in pages.
export default function NavBar() {
    return (
        <nav className="retro-nav">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/rate">Rate</Link>
            <Link href="/generate">Generate</Link>
            <Link href="/profile">Profile</Link>
            <form action="/auth/signout" method="post" style={{ marginLeft: "auto" }}>
                <button type="submit">Sign out</button>
            </form>
        </nav>
    );
}
