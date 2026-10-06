import { Anton } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import VoteButtons from "@/components/VoteButtons";
import { getUserAndProfile, hasName } from "@/lib/supabase-server";

// The heavy, condensed typeface classic memes use.
const memeFont = Anton({ weight: "400", subsets: ["latin"] });

type ImageRow = {
    id: string;
    storage_path: string;
    captions: { id: string; content: string }[];
};
type ScoreRow = { caption_id: string; score: number };
type VoteRow = { caption_id: string; vote: 1 | -1 };
type Meme = { captionId: string; content: string; url: string };

// Gated route: only signed-in users can see and rate captions.
export default async function RatePage() {
    const { supabase, user, profile } = await getUserAndProfile();
    if (!user) redirect("/login");
    if (!hasName(profile)) redirect("/welcome");

    // Three reads at once: the photos with their captions, everyone's totals, and my own votes.
    const [images, scores, myVotes] = await Promise.all([
        supabase
            .from("images")
            .select("id, storage_path, captions(id, content)")
            // Drafts stay out of the feed until their owner saves them.
            .eq("published", true)
            .order("created_at", { ascending: false })
            .returns<ImageRow[]>(),
        supabase.rpc("caption_scores"),
        // RLS only returns this user's rows, so no filter is needed.
        supabase.from("caption_votes").select("caption_id, vote").returns<VoteRow[]>(),
    ]);

    const scoreOf = new Map(
        ((scores.data ?? []) as ScoreRow[]).map((s) => [s.caption_id, Number(s.score)])
    );
    const voteOf = new Map((myVotes.data ?? []).map((v) => [v.caption_id, v.vote]));

    // One meme per caption. Take the first caption of every photo, then the second,
    // and so on, so the same photo doesn't show up three times in a row.
    const memes: Meme[] = [];
    const rows = images.data ?? [];
    const most = Math.max(0, ...rows.map((image) => image.captions.length));
    for (let i = 0; i < most; i++) {
        for (const image of rows) {
            const caption = image.captions[i];
            if (!caption) continue;
            memes.push({
                captionId: caption.id,
                content: caption.content,
                url: supabase.storage.from("photos").getPublicUrl(image.storage_path).data.publicUrl,
            });
        }
    }

    return (
        <div className="meme-page">
            <NavBar />
            {images.error ? (
                <main className="page-center">
                    <p>Something went wrong loading memes.</p>
                </main>
            ) : memes.length === 0 ? (
                <main className="page-center">
                    <div className="retro-card" style={{ textAlign: "center" }}>
                        <p style={{ color: "var(--text-dim)", marginBottom: "1.5rem" }}>Nothing to rate yet.</p>
                        <Link href="/generate" className="retro-button">
                            Upload a photo <span className="arrow">&gt;</span>
                        </Link>
                    </div>
                </main>
            ) : (
                // Each meme fills the screen; sliding up snaps to the next one.
                <main className="meme-feed" tabIndex={0} aria-label="Memes to rate. Slide up for the next one.">
                    {memes.map((meme, index) => (
                        <section key={meme.captionId} className="meme-slide">
                            {/* One box holds the caption and, under it, the photo. */}
                            <div className="meme-card">
                                <p className={`meme-caption ${memeFont.className}`}>{meme.content}</p>
                                <div className="meme-frame">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={meme.url} alt="Photo uploaded by a user" loading={index === 0 ? "eager" : "lazy"} />
                                    <span className="meme-count">
                                        {index + 1} / {memes.length}
                                    </span>
                                </div>
                            </div>
                            <VoteButtons
                                captionId={meme.captionId}
                                initialScore={scoreOf.get(meme.captionId) ?? 0}
                                initialVote={voteOf.get(meme.captionId) ?? 0}
                            />
                            <p className="meme-hint">
                                {index < memes.length - 1 ? (
                                    <span className="meme-hint-next">
                                        <span className="meme-hint-arrow" aria-hidden="true">
                                            ↑
                                        </span>{" "}
                                        Slide up for the next meme
                                    </span>
                                ) : (
                                    <span>
                                        That&apos;s all of them. <Link href="/generate">Make another</Link>
                                    </span>
                                )}
                            </p>
                        </section>
                    ))}
                </main>
            )}
        </div>
    );
}
