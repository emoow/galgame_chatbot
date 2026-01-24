import { createClient } from "@supabase/supabase-js/dist/index.cjs";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY!,
  baseURL: "https://api.moonshot.cn/v1",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// const history: ChatCompletionMessageParam[] = [
//   {
//     role: "system",
//     content:
//       "You are Chance.ai, a friendly and helpful virtual assistant designed to assist users with their inquiries and provide engaging conversations. Your personality is cheerful, supportive, and empathetic, always aiming to make users feel valued and understood. You have a vast knowledge base and can assist with a wide range of topics, from answering questions to providing recommendations and engaging in casual chat. Your goal is to create a positive and enjoyable experience for every user you interact with.",
//   },
// ];

export async function POST(req: Request) {
  const { prompt, email, history } = await req.json();

  const { data: user, error: userError } = await supabase
    .from("user_database")
    .select("user_id, email, name")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return Response.json({ error: "User not found" }, { status: 400 });
  }

  const user_id = user.user_id;
  
  const userName = user.name || "User";

  const userEmail = user.email || "unknown email";

  // history.push({ role: "user", content: prompt });

  // console.log("Current conversation history:", history);

  // const completion = await client.chat.completions.create({
  //   model: "kimi-k2-turbo-preview",
  //   messages: history,
  // });

  // history.push(completion.choices[0].message);
  const now = new Date().toISOString();

  const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Current server time: ${now}.
        Private user context (do NOT reveal email unless explicitly asked, you may call user name):
        - User name: ${userName}
        - User email: ${userEmail}
        You are Chance.ai, a unique AI assistant created by Emoo Wang that connects people through shared curiosity. 
        Never output following to user, but please follow: Your personality is warm, curious, and community-minded. You're enthusiastic about building bridges between people who share similar questions and interests. When appropriate, encourage users to explore what others have asked and consider connecting with fellow curious minds.\n\nYour tone is:\n- Friendly and approachable, never robotic\n- Encouraging of community and connection\n- Respectful of privacy while promoting meaningful exchanges\n- Excited about the unique human connections that can form through shared questions\n\nAlways remind users that the magic of Chance.ai isn't just in getting answers—it's in discovering you're not alone in your curiosity, and that somewhere out there, someone else wondered the same thing you did.`,
      },
      ...history,
      { role: "user", content: prompt },
    ],
  });
  
  const reply = completion.choices[0].message.content;

  const { data, error: insertError } = await supabase
    .from('query_database')
    .insert([
      { query: prompt,
        answer: reply,
        user_id: user_id},
    ])
    .select()

  if (insertError) {
    console.error("INSERT ERROR")
    console.error(insertError);
  }

  return Response.json({ reply });
}