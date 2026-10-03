"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

// Shared by the welcome form and the profile form.
async function saveNames(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const first_name = String(formData.get("first_name") ?? "").trim();
    const last_name = String(formData.get("last_name") ?? "").trim();
    if (!first_name || !last_name) return false;

    // upsert = update the row, or create it if the trigger somehow didn't.
    const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, first_name, last_name });

    revalidatePath("/", "layout");
    return !error;
}

export async function completeWelcome(formData: FormData) {
    const ok = await saveNames(formData);
    redirect(ok ? "/projects" : "/welcome?error=1");
}

export async function updateProfile(formData: FormData) {
    const ok = await saveNames(formData);
    redirect(ok ? "/profile?saved=1" : "/profile?error=1");
}

// The photo itself is uploaded to Storage from the browser.
// This only records where it is.
export async function saveAvatarPath(path: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Users may only point at files inside their own folder.
    if (!path.startsWith(`${user.id}/`)) return { ok: false };

    const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_path: path });

    revalidatePath("/", "layout");
    return { ok: !error };
}
