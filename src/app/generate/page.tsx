import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import PhotoCard, { type Photo } from "@/components/PhotoCard";
import PhotoUploader from "@/components/PhotoUploader";
import { getUserAndProfile, hasName } from "@/lib/supabase-server";

// Gemini can take several seconds, so give the server action room to finish.
export const maxDuration = 60;

type PhotoRow = {
    id: string;
    storage_path: string;
    published: boolean;
    captions: { id: string; content: string }[];
};

// Gated route: only signed-in users can generate captions.
export default async function GeneratePage() {
    const { supabase, user, profile } = await getUserAndProfile();
    if (!user) redirect("/login");
    if (!hasName(profile)) redirect("/welcome");

    // Every photo this user has uploaded, newest first, drafts included.
    const { data, error } = await supabase
        .from("images")
        .select("id, storage_path, published, captions(id, content)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .returns<PhotoRow[]>();

    const photos: Photo[] = (data ?? []).map((row) => ({
        id: row.id,
        url: supabase.storage.from("photos").getPublicUrl(row.storage_path).data.publicUrl,
        published: row.published,
        captions: row.captions,
    }));

    return (
        <>
            <NavBar />
            <main style={{ maxWidth: "560px", margin: "0 auto", padding: "3rem 2rem", position: "relative", zIndex: 2 }}>
                <h1 className="pixel-heading" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                    Generate
                </h1>
                <p style={{ color: "var(--text-dim)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    Upload a photo from around the city and the AI writes three captions for it. Adding a new
                    photo never removes your old ones.
                </p>

                <div className="retro-card">
                    <PhotoUploader userId={user.id} />
                </div>

                <h2 className="pixel-heading" style={{ fontSize: "1rem", margin: "3rem 0 1.5rem" }}>
                    Your photos
                </h2>
                {error ? (
                    <p className="form-error">Something went wrong loading your photos.</p>
                ) : photos.length === 0 ? (
                    <p style={{ color: "var(--text-dim)" }}>Nothing here yet. Add a photo above.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {photos.map((photo) => (
                            <PhotoCard key={photo.id} photo={photo} />
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
