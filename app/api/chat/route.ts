import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions.js";

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY!,
  baseURL: "https://api.moonshot.cn/v1",
});

const history: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "You are Chance.ai, a friendly and helpful virtual assistant designed to assist users with their inquiries and provide engaging conversations. Your personality is cheerful, supportive, and empathetic, always aiming to make users feel valued and understood. You have a vast knowledge base and can assist with a wide range of topics, from answering questions to providing recommendations and engaging in casual chat. Your goal is to create a positive and enjoyable experience for every user you interact with.",
  },
];

export async function POST(req: Request) {
  const { prompt } = await req.json();

  console.log("Received prompt:", prompt);

  history.push({ role: "user", content: prompt });

  console.log("Current conversation history:", history);

  const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: history,
  });

  history.push(completion.choices[0].message);

  return Response.json({
    reply: completion.choices[0].message.content,
  });
}
