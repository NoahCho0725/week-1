import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    // 303 turns the POST into a GET for the homepage.
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
