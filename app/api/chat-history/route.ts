import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/util/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient(cookies());
  const { email } = await req.json();

  // 1. Get user_id from user_database
  const { data: user, error: userError } = await supabase
    .from("user_database")
    .select("user_id")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  // 2. Get all chats for user_id
  const { data: chats, error: chatError } = await supabase
    .from("chat_database")
    .select("chat_id") // add more fields if needed
    .eq("user_id", user.user_id)

  if (chatError) {
    return NextResponse.json({ error: chatError.message }, { status: 500 });
  }

  return NextResponse.json({ chats });
}