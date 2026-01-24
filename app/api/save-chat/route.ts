import { createClient } from 'util/supabase/server.ts'
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: "https://api.moonshot/v1",
});

export async function POST(request: Request) {
  // 前端传 user_id 和 prompt，如果是新对话 chat_id 可以不传
  const { user_id, prompt, chat_id } = await request.json();

  if (!user_id || !prompt) {
    return new Response(JSON.stringify({ error: "invalid data" }), { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let currentChatId = chat_id;

  // === 1. 新对话：生成 chat_id ===
  if (!currentChatId) {
    const { data, error } = await supabase
      .from("chat_database")
      .insert([{ user_id }])
      .select("chat_id")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    currentChatId = data.chat_id;
  }

  // === 2. 获取历史消息 ===
  const { data: historyData, error: historyError } = await supabase
    .from("query_database")
    .select("query, answer")
    .eq("chat_id", currentChatId)
    .order("created_at", { ascending: true });

  if (historyError) {
    return new Response(JSON.stringify({ error: historyError.message }), { status: 500 });
  }

  // === 3. 拼接聊天消息 ===
  const systemMessage = {
    role: "system",
    content:
      "You are Chance.ai, a friendly and helpful virtual assistant. Your personality is cheerful, supportive, and empathetic.",
  };

  const messages = [
    systemMessage,
    ...historyData.flatMap((item) => [
      { role: "user", content: item.query },
      ...(item.answer ? [{ role: "assistant", content: item.answer }] : []),
    ]),
    { role: "user", content: prompt },
  ];

  // === 4. 调用 OpenAI ===
  const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages,
  });

  const reply = completion.choices[0].message.content;

  // === 5. 保存到 query_database ===
  const { error: insertError } = await supabase.from("query_database").insert([
    {
      user_id,
      chat_id: currentChatId,
      query: prompt,
      answer: reply,
    },
  ]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  // === 6. 返回结果 ===
  return new Response(
    JSON.stringify({
      chat_id: currentChatId,
      reply,
    }),
    { status: 200 }
  );
}
