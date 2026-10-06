"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { captionImage, PROMPT } from "@/lib/gemini";
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

// --- Assignment 4: AI captions ---

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type GenerateResult = { ok: true; imageId: string } | { ok: false; error: string };

// The browser has already uploaded the photo to the "photos" bucket.
// This asks Gemini for captions, then saves the photo and its captions as rows.
// The photo starts as a draft (published = false): only its owner can see it until they save it.
export async function generateCaptions(path: string): Promise<GenerateResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to generate captions." };

    // Users may only caption photos inside their own folder.
    if (typeof path !== "string" || !path.startsWith(`${user.id}/`) || path.includes("..")) {
        return { ok: false, error: "That photo isn't yours." };
    }

    // If anything below fails, remove the uploaded file so it isn't left behind.
    async function discard(error: string): Promise<GenerateResult> {
        await supabase.storage.from("photos").remove([path]);
        return { ok: false, error };
    }

    // Fetch the photo back from Storage so it can be sent to Gemini.
    const { publicUrl } = supabase.storage.from("photos").getPublicUrl(path).data;
    const photo = await fetch(publicUrl);
    if (!photo.ok) return { ok: false, error: "Couldn't read the uploaded photo." };

    const mimeType = (photo.headers.get("content-type") ?? "").split(";")[0];
    const bytes = Buffer.from(await photo.arrayBuffer());
    if (!PHOTO_TYPES.includes(mimeType) || bytes.length > MAX_PHOTO_BYTES) {
        return discard("Use a JPEG, PNG or WebP photo under 5 MB.");
    }

    let captions: string[];
    let model: string;
    try {
        ({ captions, model } = await captionImage(bytes.toString("base64"), mimeType));
    } catch (error) {
        console.error("generateCaptions:", error);
        return discard("The AI is busy right now, so nothing was saved. Try again in a minute.");
    }

    // profile_id is filled in by the database (default auth.uid()), and RLS checks it.
    const { data: image, error: imageError } = await supabase
        .from("images")
        .insert({ storage_path: path })
        .select("id")
        .single<{ id: string }>();
    if (imageError || !image) return discard("Couldn't save the photo.");

    // One row per caption, each recording the prompt and model that produced it.
    const { error: captionError } = await supabase
        .from("captions")
        .insert(captions.map((content) => ({ image_id: image.id, content, prompt: PROMPT, model })));
    if (captionError) return { ok: false, error: "Couldn't save the captions." };

    revalidatePath("/generate");
    return { ok: true, imageId: image.id };
}

// --- Assignment 4: voting ---

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Records the signed-in user's vote on a caption: 1 is an upvote, -1 a downvote.
export async function castVote(captionId: string, vote: 1 | -1) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    // Arguments come from the browser, so check them before using them.
    if (typeof captionId !== "string" || !UUID.test(captionId)) return { ok: false };
    if (vote !== 1 && vote !== -1) return { ok: false };

    // upsert = insert a new vote row, or change this user's existing vote on this caption.
    const { error } = await supabase
        .from("caption_votes")
        .upsert(
            { caption_id: captionId, profile_id: user.id, vote },
            { onConflict: "caption_id,profile_id" }
        );

    revalidatePath("/rate");
    return { ok: !error };
}

// --- Assignment 4: managing your own photos ---

async function signedIn() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
}

// "Save": moves a draft photo and its remaining captions into the Rate feed.
export async function publishImage(imageId: string) {
    const { supabase, user } = await signedIn();
    if (!user) return { ok: false };
    if (typeof imageId !== "string" || !UUID.test(imageId)) return { ok: false };

    // RLS only lets this match a row the user owns. Asking for the row back
    // tells us whether anything was actually changed.
    const { data } = await supabase
        .from("images")
        .update({ published: true })
        .eq("id", imageId)
        .select("id")
        .maybeSingle<{ id: string }>();
    if (!data) return { ok: false };

    revalidatePath("/generate");
    revalidatePath("/rate");
    return { ok: true };
}

// Deletes one caption (and any votes on it).
export async function deleteCaption(captionId: string) {
    const { supabase, user } = await signedIn();
    if (!user) return { ok: false };
    if (typeof captionId !== "string" || !UUID.test(captionId)) return { ok: false };

    const { data } = await supabase
        .from("captions")
        .delete()
        .eq("id", captionId)
        .select("id")
        .maybeSingle<{ id: string }>();
    if (!data) return { ok: false };

    revalidatePath("/generate");
    revalidatePath("/rate");
    return { ok: true };
}

// Deletes a photo. The database removes its captions and their votes with it
// (the tables are linked with "on delete cascade").
export async function deleteImage(imageId: string) {
    const { supabase, user } = await signedIn();
    if (!user) return { ok: false };
    if (typeof imageId !== "string" || !UUID.test(imageId)) return { ok: false };

    const { data: deleted } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId)
        .select("storage_path")
        .maybeSingle<{ storage_path: string }>();
    if (!deleted) return { ok: false };

    // Then remove the file itself from Storage.
    await supabase.storage.from("photos").remove([deleted.storage_path]);

    revalidatePath("/generate");
    revalidatePath("/rate");
    return { ok: true };
}
