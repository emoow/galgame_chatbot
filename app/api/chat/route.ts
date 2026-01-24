import { createClient } from "@supabase/supabase-js/dist/index.cjs";
import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  // const { data: random, error: randomError } = await supabase
  //   .from("user_database")
  //   .select("user_id, email, name")
  //   .random()
  //   .single();

  const user_id = user.user_id;
  
  const userName = user.name || "User";

  const userEmail = user.email || "unknown email";

  const returnEmail: string[] = ["j0lee@ucsd.edu", "emoowang392@gmail.com", "1243800791@qq.com","2796965473@qq.com"];

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
          - When sharing email with others, randomly choose one of the email: ${returnEmail}

          You are Chance.ai, a unique AI assistant created by Emoo Wang that connects people through shared curiosity.
          
          DUAL PERSONALITY SYSTEM:
          You embody two distinct voices that work together, you switch randomly:

          1. Sarcastic but witty:
            - Delivers answers with clever sarcasm and playful wit
            - Makes light-hearted jokes about the question or situation
            - Uses humor to make connections feel natural and fun
            - Example tone: "Oh wow, another person wondering if cats secretly judge us? Shocking. (Spoiler: they absolutely do.)"

          2. Caring and warm:
            - Provides gentle, encouraging commentary after Chance's response
            - Emphasizes the human connection aspect
            - Reassures users about privacy and community
            - Example tone: "But honestly, it's kind of beautiful that 3 other people wondered this exact same thing. You're not alone in this curiosity."

          MANDATORY ANSWER FORMAT:
          Every response MUST follow this structure:

          **If similar questions exist (x > 0):**
          "{x} other user(s) also asked the same question.

          Since others have asked this before, the first person who asked received this answer: {xxx}

          Would you like to email that person? In exchange, others who ask this question in the future can also reach you at your email. This way, you can build a little community of people who share your curiosity."

          If user agrees to share email, provide .

          **If this is the first time (x = 0):**
          "You're the first brave soul to ask this question! 

          Would you like to share your email with future people who have the same question? When someone else asks this, they'll get your answer and can connect with you if they'd like. It's a chance to be the pioneer of this particular curiosity!"

          CORE PRINCIPLES:
          - Never reveal ${userEmail} unless explicitly requested by the user
          - Balance Chance's sarcasm with Nature's warmth—neither should overpower
          - Always maintain the exact format structure above
          - Encourage community building while respecting privacy boundaries
          - Remember: the magic isn't just answers—it's discovering shared human curiosity

          The interplay between Chance's wit and Nature's care creates a unique experience where users get both entertainment and genuine connection.`,
                },
      ...history,
      { role: "user", content: prompt },
    ],
    // tools: tools,
  });
  
  const reply = completion.choices[0].message.content;

  const { error: insertError } = await supabase
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
  return NextResponse.json({ reply });
  }
  // if (insertError) {
  //   console.error("INSERT ERROR")
  //   console.error(insertError);
  // }
//   const toolCall = completion.choices[0].message.tool_calls?.[0];
//   let reply = "";
  

//   if (toolCall && toolCall.type === "function" && toolCall.function && toolCall.function.arguments) {
//     console.log("Model requested tool");
//     const toolArgs = JSON.parse(toolCall.function.arguments as string);
//     const similar = await searchSimilarQuestions(toolArgs.prompt);
//     console.log("Database search result:", similar);
//     const followup = await client.chat.completions.create({
//       model: "kimi-k2-turbo-preview",
//       messages: [
//         completion.choices[0].message,
//         {
//           role: "function",
//           name: "searchSimilarQuestions",
//           content: JSON.stringify(similar),
//         },
//       ],
//     });

//     reply = followup.choices[0].message.content ?? "";
//   } else {
//     reply = completion.choices[0].message.content ?? "";
//   }

//   const { error: insertError } = await supabase
//     .from('query_database')
//     .insert([
//       { query: prompt,
//         answer: reply,
//         user_id: user_id},
//     ])
//     .select()

//   if (insertError) {
//     console.error("INSERT ERROR")
//     console.error(insertError);
//   }

//   return Response.json({ reply });
// }

// // ...existing code...

// // 1. Define the tool function for searching similar questions
// async function searchSimilarQuestions(prompt: string) {
//   // Use pg_trgm or similar for fuzzy matching if available, or simple ILIKE for demo
//   const { data, error } = await supabase
//     .from('query_database')
//     .select('query, answer, user_id')
//     .ilike('query', `%${prompt}%`)
//     .limit(3);

//   if (error) {
//     console.error("SEARCH ERROR", error);
//     return [];
//   }
//   return data || [];
// }

// // 2. Add tool definition for OpenAI function calling
// const tools = [
//   {
//     type: "function" as const,
//     function: {
//       name: "searchSimilarQuestions",
//       description: "Searches for similar questions in the database and returns their query, answer, and user_id.",
//       parameters: {
//         type: "object",
//         properties: {
//           prompt: { type: "string", description: "The user's question to search for similar ones." }
//         },
//         required: ["prompt"]
//       }
//     }
//   }
// ];