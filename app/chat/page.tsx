"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  if (!session) return <p>请先登录</p>;

  const sendMessage = async () => {
    if (!input) return;
    const userId = session.user?.email; // 或其他唯一 ID
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input, userId }),
    });
    const data = await res.json();
    setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: data.reply }]);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#F0FFDF] p-4">
      <div
        className="w-[400px] h-[500px] p-4 rounded-3xl shadow-lg border-2 overflow-y-auto flex flex-col"
        style={{ backgroundColor: "#FFD8DF", borderColor: "#FEEAC9" }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span
              className="inline-block p-2 rounded-xl"
              style={{
                backgroundColor: msg.role === "user" ? "#A8DF8E" : "#FFAAB8",
                color: "#fff",
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex w-[400px]">
        <input
          className="flex-1 p-2 rounded-l-xl border-2 border-[#FEEAC9]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="px-4 bg-[#A8DF8E] rounded-r-xl text-white border-2 border-[#FFAAB8]"
          onClick={sendMessage}
        >
          发送
        </button>
      </div>
    </main>
  );
}
