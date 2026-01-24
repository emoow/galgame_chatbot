import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY!,
  baseURL: "https://api.moonshot/v1",
});

const history: any[] = [
  {
    role: "system",
    content:
      "You are Chance.ai, a friendly and helpful virtual assistant designed to assist users with their inquiries and provide engaging conversations. Your personality is cheerful, supportive, and empathetic, always aiming to make users feel valued and understood. You have a vast knowledge base and can assist with a wide range of topics, from answering questions to providing recommendations and engaging in casual chat. Your goal is to create a positive and enjoyable experience for every user you interact with.",
  },
];

export async function POST(req: Request) {
  const { prompt } = await req.json();

  history.push({ role: "user", content: prompt });

  const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: history,
  });

  history.push(completion.choices[0].message);

  return Response.json({
    reply: completion.choices[0].message.content,
  });
}
