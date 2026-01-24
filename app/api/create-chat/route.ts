import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/util/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient(cookies());
  const { email } = await req.json();

  const { data: user, error: userError } = await supabase
    .from("user_database")
    .select("user_id")
    .eq("email", email)
    .single();
  
  console.log("Email received:", email);
  console.log("User query result:", user, userError);


  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }
  
  const user_id = user.user_id;
  

  // 2️⃣ 插入 chat_database
  const { data, error } = await supabase
    .from("chat_database")
    .insert({user_id})
    .select("chat_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3️⃣ 返回 chat_id
  return NextResponse.json({
    chat_id: data.chat_id,
  });
}
