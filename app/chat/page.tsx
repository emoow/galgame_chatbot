"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

const DEFAULT_WELCOME = `Welcome to Chance.ai! ✨

How it works:
- Ask me anything—I'll answer your question
- I'll show you what other users with similar questions discovered
- Optionally share your email to connect with someone who had the same curiosity

Ready? What's your question?`;

export default function ChatPage() {
  const { data: session } = useSession();
  // const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  // const [input, setInput] = useState("");

  // const [chats, setChats] = useState([
  //   // eslint-disable-next-line react-hooks/purity
  //   { id: Date.now(), messages: [{ role: "assistant", content: DEFAULT_WELCOME }] }
  // ]);
  const [chats, setChats] = useState<{
    chat_id: string | null;
    isTemp: boolean;
    messages: { role: string; content: string }[];
  }[]>([]);

  const [currentChatIdx, setCurrentChatIdx] = useState(0);
  const [input, setInput] = useState("");

  // if (!session) return <p>Please log in to use the chat.</p>;

  // const sendMessage = async () => {
  //   if (!input) return;
  //   const userId = session.user?.email; // or other unique ID
  //   setMessages([...messages, { role: "user", content: input }]);
  //   setInput("");

  //   const res = await fetch("/api/chat", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //     prompt: input,
  //     email: session.user?.email ?? "",
  //     history: messages, // 前端维护
  //   }),
  //   });
  //   console.log("Response status:", res.status);
  //   const data = await res.json();
  //   setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: data.reply }]);
  // };

  const currentMessages = chats[currentChatIdx]?.messages ?? [];

  useEffect(() => {
    if (!session?.user?.email) return;
      (async () => {
        const res = await fetch("/api/chat-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user?.email }),
        });

        const data = await res.json();

        const historyChats = (data.chats ?? []).map(
          (chat: { chat_id: string }) => ({
            chat_id: chat.chat_id,
            isTemp: false,
            messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
          })
        );
        const tempChat = {
          chat_id: null,
          isTemp: true,
          messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
        };

        setChats([tempChat, ...historyChats]);
        setCurrentChatIdx(0);
      })();
    }, [session]);

  if (!session) return <p>Please log in to use the chat.</p>;

  const sendMessage = async () => {
    if (!input) return;
    const email = session.user?.email ?? "";
    // const history = currentMessages;
    // const chat_id = chats[currentChatIdx].chat_id;
    let chat = chats[currentChatIdx];
    if (chat.isTemp) {
      try {
        const res = await fetch("/api/create-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to create chat:", text);
          alert("Failed to create chat");
          return;
        }

        const data = await res.json();
        if (!data.chat_id) {
          alert("Failed to create chat: no chat_id returned");
          return;
        }

        console.log("Created new chat with ID:", data.chat_id);

        // 更新当前 chat：chat_id 和 isTemp
        chat = { ...chat, chat_id: data.chat_id, isTemp: false };
        setChats((prev) => {
          const updated = [...prev];
          updated[currentChatIdx] = chat;
          return updated;
        });
      } catch (err) {
        console.error("Unexpected error creating chat:", err);
        alert("Failed to create chat: unexpected error");
        return;
      }
    }

    console.log("Sending message:", input, "Chat ID:", chat.chat_id);

    // Optimistically update UI
    const newMessages = [...chat.messages, { role: "user", content: input }];
    updateCurrentChatMessages(newMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat.chat_id,
        prompt: input,
        email: email,
        history: newMessages
      }),
    });
    const data = await res.json();
    updateCurrentChatMessages([
      ...newMessages,
      { role: "assistant", content: data.reply }
    ]);
  };

  function updateCurrentChatMessages(newMessages: { role: string; content: string }[]) {
    setChats((prev) => {
      const updated = [...prev];
      updated[currentChatIdx] = { ...updated[currentChatIdx], messages: newMessages };
      return updated;
    });
  }

  // const createNewChat = () => {
  //   const newChat = {
  //     chat_id:"temp",
  //     messages: [{ role: "assistant", content: DEFAULT_WELCOME }]
  //   };
  //   setChats((prev) => [newChat, ...prev]);
  //   setCurrentChatIdx(0);
  //   setInput("");
  // };

  const createNewChat = async () => {
    const res = await fetch("/api/create-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user?.email ?? "" }), // send email
    });
    const data = await res.json();
      if (!data.chat_id) {
        alert("Failed to create chat");
        return;
      }
    console.log("Created new chat with ID:", data.chat_id);
    const newChat = {
      chat_id: data.chat_id,
      isTemp: false,
      messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatIdx(0);
    setInput("");
  };


  const selectChat = (idx: number) => {
    setCurrentChatIdx(idx);
    setInput("");
  };

  return (
    <main className="flex min-h-screen bg-[#F0FFDF] p-4">
    {/* 左边 panel */}
    <aside className="w-1/5 bg-[#FFF1F1] rounded-3xl shadow-lg p-4 flex flex-col relative">
      <button
        className="mb-4 px-4 py-2 bg-[#A8DF8E] text-white rounded-xl"
        onClick={createNewChat}
      >
        New Chat
      </button>

      <div className="flex-1 mt-4 overflow-y-auto">
          {chats.map((chat, idx) => (
            <div
              key={chat.chat_id ?? `temp-${idx}`}
              className={`mb-2 p-2 rounded-xl cursor-pointer hover:bg-[#FFE0E0] ${idx === currentChatIdx ? "bg-[#FFE0E0]" : ""}`}
              onClick={() => selectChat(idx)}
            >
              Chat {chats.length - idx}
            </div>
          ))}
        </div>
      <Image
            src="/chancy.png"
            alt="Chancy"
            width={300}
            height={476}
            className="relative bottom-10 left-8 transform scale-180 z-50 animate-float"
          />
      </aside>

    {/* 右边对话区 */}
    <section className="w-4/5 flex flex-col ml-4">
      {/* 聊天记录 */}
      <div
        className="flex-1 p-4 rounded-3xl shadow-lg border-2 overflow-y-auto"
        style={{ backgroundColor: "#FFD8DF", borderColor: "#FEEAC9" }}
      >
        {currentMessages.map((msg, idx) => (
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
    </section>
  </main>
  );
}
