import Link from "next/link";
import EmojiRain from "@/components/EmojiRain";
import { getUserAndProfile } from "@/lib/supabase-server";

export default async function Home() {
    const { user, profile } = await getUserAndProfile();

    return (
        <>
            <EmojiRain />
            <main className="page-center">
                <div className="retro-card home">
                    <span className="retro-badge">{user ? "[SIGNED IN]" : "[AI MEME FEED]"}</span>
                    <h1 className="pixel-heading home-title">Laugh or Laugh</h1>
                    <p className="home-tagline">
                        {user && profile?.first_name ? `Welcome back, ${profile.first_name}. ` : ""}
                        Upload a photo, let AI write the captions, and vote on which memes are actually funny.
                    </p>

                    {!user && (
                        <ol className="home-steps">
                            <li>
                                <span aria-hidden="true">📸</span>
                                Upload a photo
                            </li>
                            <li>
                                <span aria-hidden="true">🤖</span>
                                AI writes three captions
                            </li>
                            <li>
                                <span aria-hidden="true">👍</span>
                                Vote the best ones up
                            </li>
                        </ol>
                    )}

                    {user ? (
                        <div className="home-actions">
                            <Link href="/rate" className="retro-button">
                                Rate memes <span className="arrow">&gt;</span>
                            </Link>
                            <Link href="/generate" className="retro-button">
                                Make a meme <span className="arrow">&gt;</span>
                            </Link>
                            <Link href="/profile" className="link-button">
                                Profile
                            </Link>
                            <form action="/auth/signout" method="post">
                                <button type="submit" className="link-button">
                                    Sign out
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="home-actions">
                            <Link href="/login" className="retro-button">
                                Sign in to start <span className="arrow">&gt;</span>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
