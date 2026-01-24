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
  const { error: chatBasicError } = await supabase
    .from("chat_database")
    .select("chat_id") // add more fields if needed
    .eq("user_id", user.user_id)

  if (chatBasicError) {
    return NextResponse.json({ error: chatBasicError.message }, { status: 500 });
  }
  const user_id = user.user_id;

  const { data: chats, error: chatError } = await supabase
    .from("chat_database")
    .select("chat_id, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  if (chatError) {
    return NextResponse.json({ error: chatError.message }, { status: 500 });
  }

  /** 3️⃣ 查所有 query（一次性，别 for-loop 查） */
  const chatIds = chats.map(c => c.chat_id);

  const { data: queries, error: queryError } = await supabase
    .from("query_database")
    .select("chat_id, query, answer, created_at")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: true });

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  /** 4️⃣ 组装成前端要的结构 */
  const chatMap = new Map<string, unknown[]>();

  for (const q of queries) {
    if (!chatMap.has(q.chat_id)) {
      chatMap.set(q.chat_id, []);
    }

    chatMap.get(q.chat_id)!.push(
      {
        role: "user",
        content: q.query,
        created_at: q.created_at,
      },
      {
        role: "assistant",
        content: q.answer,
        created_at: q.created_at,
      }
    );
  }

  const result = chats.map(chat => ({
    chat_id: chat.chat_id,
    messages: chatMap.get(chat.chat_id) || [],
  }));

  return NextResponse.json({ chats: result });
}