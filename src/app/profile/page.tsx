import { redirect } from "next/navigation";
import { updateProfile } from "@/app/actions";
import AvatarUploader from "@/components/AvatarUploader";
import NameFields from "@/components/NameFields";
import NavBar from "@/components/NavBar";
import { getUserAndProfile, hasName } from "@/lib/supabase-server";

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
    const { supabase, user, profile } = await getUserAndProfile();
    if (!user) redirect("/login");
    if (!hasName(profile)) redirect("/welcome");

    const { saved, error } = await searchParams;

    const avatarUrl = profile?.avatar_path
        ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
        : null;

    return (
        <>
            <NavBar />
            <main style={{ maxWidth: "560px", margin: "0 auto", padding: "3rem 2rem", position: "relative", zIndex: 2 }}>
                <h1 className="pixel-heading" style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
                    Profile
                </h1>
                <div className="retro-card">
                    <AvatarUploader userId={user.id} avatarUrl={avatarUrl} />
                    <form action={updateProfile}>
                        <NameFields firstName={profile?.first_name} lastName={profile?.last_name} />
                        <label className="retro-label" htmlFor="email">
                            Email
                        </label>
                        <input className="retro-input" id="email" value={user.email ?? ""} readOnly disabled />
                        {saved && <p className="form-success">Saved.</p>}
                        {error && <p className="form-error">Enter both a first and last name.</p>}
                        <button type="submit" className="retro-button" style={{ marginTop: "1.5rem" }}>
                            Save <span className="arrow">&gt;</span>
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}
