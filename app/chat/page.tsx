"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  if (!session) return <p>Please log in to use the chat.</p>;

  const sendMessage = async () => {
    if (!input) return;
    const userId = session.user?.email; // or other unique ID
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input, userId }),
    });
    console.log("Response status:", res.status);
    const data = await res.json();
    setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: data.reply }]);
  };

  return (
    <main className="flex min-h-screen bg-[#F0FFDF] p-4">
    {/* 左边 panel */}
    <aside className="w-1/5 bg-[#FFF1F1] rounded-3xl shadow-lg p-4 flex flex-col relative">
      <button
        className="mb-4 px-4 py-2 bg-[#A8DF8E] text-white rounded-xl"
        // onClick={createNewChat}
      >
        New Chat
      </button>

      <div className="flex-1 mt-16 overflow-y-auto">
        {/* 聊天列表 */}
      </div>
    </aside>

    {/* 右边对话区 */}
    <section className="w-4/5 flex flex-col ml-4">
      {/* 聊天记录 */}
      <div
        className="flex-1 p-4 rounded-3xl shadow-lg border-2 overflow-y-auto"
        style={{ backgroundColor: "#FFD8DF", borderColor: "#FEEAC9" }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
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

      {/* 输入框 */}
      <div className="mt-4 flex">
      <input
        className="flex-1 p-2 rounded-l-xl border-2 border-[#FEEAC9] focus:outline-none focus:border-[#A8DF8E] transition-colors"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        className="px-4 bg-[#A8DF8E] rounded-r-xl text-white border-2 border-[#FFAAB8] hover:bg-[#8ECC75] transition-colors"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
    <Image
      src="/chancy.png"
      alt="Chancy"
      width={300}
      height={476}
      className="absolute bottom-0 left-4 transform scale-120 z-50 animate-float"
    />
    </section>
  </main>
  );
}
