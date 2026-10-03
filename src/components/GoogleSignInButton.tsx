"use client";

import { createClient } from "@/lib/supabase";

export default function GoogleSignInButton() {
    async function signIn() {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    }

    return (
        <button type="button" className="retro-button" onClick={signIn}>
            Sign in with Google <span className="arrow">&gt;</span>
        </button>
    );
}
