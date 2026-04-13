"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useTextMetrics } from "@/hooks/usePretext";

const DEFAULT_WELCOME = `Welcome to Chance.ai! ✨

How it works:
• Ask me anything—I'll answer your question
• I'll show you what other users with similar questions discovered
• Optionally share your email to connect with someone who had the same curiosity

Ready? What's your question?`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  chat_id: string | null;
  isTemp: boolean;
  messages: Message[];
}

// Message bubble component with Pretext-optimized sizing
function MessageBubble({
  msg,
  maxWidth,
}: {
  msg: Message;
  maxWidth: number;
}) {
  const isUser = msg.role === "user";
  const font = isUser ? "500 15px Inter, system-ui, sans-serif" : "400 15px Inter, system-ui, sans-serif";
  const lineHeight = 22;
  const bubbleMaxWidth = Math.min(maxWidth * 0.75, 520);
  
  const { height, lineCount } = useTextMetrics(
    msg.content,
    font,
    bubbleMaxWidth,
    lineHeight,
    { whiteSpace: "pre-wrap" }
  );

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}
      style={{ minHeight: Math.max(height + 24, 44) }}
    >
      <div
        className={`relative max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-[#A8DF8E] to-[#8FD475] text-white rounded-br-md"
            : "bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-md border border-[#FFE0E0]"
        }`}
        style={{
          maxWidth: bubbleMaxWidth,
          boxShadow: isUser
            ? "0 2px 8px rgba(168, 223, 142, 0.3)"
            : "0 2px 8px rgba(255, 170, 184, 0.15)",
        }}
      >
        <div className="whitespace-pre-wrap leading-[22px] text-[15px]">
          {msg.content}
        </div>
        {/* Subtle timestamp placeholder */}
        <div
          className={`text-[10px] mt-1 opacity-0 group-hover:opacity-50 transition-opacity ${
            isUser ? "text-white/70 text-right" : "text-gray-400"
          }`}
        >
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// Chat list item with preview
function ChatListItem({
  chat,
  index,
  total,
  isActive,
  onClick,
}: {
  chat: Chat;
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const preview = chat.messages[0]?.content.slice(0, 40) || "New chat";
  const displayNum = total - index;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl mb-2 transition-all duration-200 group ${
        isActive
          ? "bg-[#FFE0E0] shadow-sm"
          : "hover:bg-white/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            chat.isTemp ? "bg-amber-400" : "bg-[#A8DF8E]"
          }`}
        />
        <span className="font-medium text-sm text-gray-700">Chat {displayNum}</span>
        {chat.isTemp && (
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">
            New
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1 truncate pl-4">
        {preview.replace(/\n/g, " ")}
        {chat.messages[0]?.content.length > 40 ? "..." : ""}
      </p>
    </button>
  );
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatIdx, setCurrentChatIdx] = useState(0);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentMessages = chats[currentChatIdx]?.messages ?? [];

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  // Load chat history
  useEffect(() => {
    if (!session?.user?.email) return;

    (async () => {
      try {
        const res = await fetch("/api/chat-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user?.email }),
        });

        const data = await res.json();

        const historyChats = (data.chats ?? []).map(
          (chat: {
            chat_id: string;
            messages: {
              role: "user" | "assistant";
              content: string;
              created_at: string;
            }[];
          }) => {
            const sortedMessages = [...chat.messages].sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            const messages = sortedMessages.map(({ role, content }) => ({
              role,
              content,
            }));

            return {
              chat_id: chat.chat_id,
              isTemp: false,
              messages:
                messages.length > 0
                  ? messages
                  : [{ role: "assistant" as const, content: DEFAULT_WELCOME }],
            };
          }
        );

        const tempChat: Chat = {
          chat_id: null,
          isTemp: true,
          messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
        };

        setChats([tempChat, ...historyChats.reverse()]);
        setCurrentChatIdx(0);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    })();
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0FFDF] to-[#E8F5D6] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-600">Please log in to use the chat.</p>
        </div>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const email = session.user?.email ?? "";
    let chat = chats[currentChatIdx];

    // Create new chat if temp
    if (chat.isTemp) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/create-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) throw new Error("Failed to create chat");

        const data = await res.json();
        if (!data.chat_id) throw new Error("No chat_id returned");

        chat = { ...chat, chat_id: data.chat_id, isTemp: false };
        setChats((prev) => {
          const updated = [...prev];
          updated[currentChatIdx] = chat;
          return updated;
        });
      } catch (err) {
        console.error("Error creating chat:", err);
        setIsLoading(false);
        return;
      }
    }

    // Optimistic update
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...chat.messages, userMessage];
    updateCurrentChatMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat.chat_id,
          prompt: userMessage.content,
          email,
          history: newMessages,
        }),
      });

      const data = await res.json();
      updateCurrentChatMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      updateCurrentChatMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  function updateCurrentChatMessages(newMessages: Message[]) {
    setChats((prev) => {
      const updated = [...prev];
      updated[currentChatIdx] = { ...updated[currentChatIdx], messages: newMessages };
      return updated;
    });
  }

  const createNewChat = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/create-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user?.email ?? "" }),
      });

      const data = await res.json();
      if (!data.chat_id) throw new Error("Failed to create chat");

      const newChat: Chat = {
        chat_id: data.chat_id,
        isTemp: false,
        messages: [{ role: "assistant", content: DEFAULT_WELCOME }],
      };

      setChats((prev) => [newChat, ...prev]);
      setCurrentChatIdx(0);
      setInput("");
    } catch (err) {
      console.error("Error creating chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = (idx: number) => {
    setCurrentChatIdx(idx);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate available width for message bubbles
  const chatContainerWidth = chatContainerRef.current?.clientWidth ?? 800;

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-[#F0FFDF] via-[#F5FFE8] to-[#E8F5D6] p-4 gap-4">
      {/* Sidebar */}
      <aside className="w-64 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg p-4 flex flex-col border border-white/50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A8DF8E] to-[#8FD475] flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-semibold text-gray-800">Chance.ai</span>
        </div>

        <button
          onClick={createNewChat}
          disabled={isLoading}
          className="mb-4 px-4 py-3 bg-gradient-to-r from-[#A8DF8E] to-[#8FD475] text-white rounded-xl font-medium shadow-md shadow-[#A8DF8E]/30 hover:shadow-lg hover:shadow-[#A8DF8E]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
            Recent Chats
          </p>
          {chats.map((chat, idx) => (
            <ChatListItem
              key={chat.chat_id ?? `temp-${idx}`}
              chat={chat}
              index={idx}
              total={chats.length}
              isActive={idx === currentChatIdx}
              onClick={() => selectChat(idx)}
            />
          ))}
        </div>

        {/* Floating mascot */}
        <div className="relative h-48 mt-4 flex items-end justify-center pointer-events-none">
          <Image
            src="/chancy.png"
            alt="Chancy"
            width={180}
            height={280}
            className="object-contain animate-float drop-shadow-xl"
            priority
          />
        </div>
      </aside>

      {/* Chat Area */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/50 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {currentMessages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                msg={msg}
                maxWidth={chatContainerWidth - 48}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-md border border-[#FFE0E0] shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#FFAAB8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#FFAAB8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#FFAAB8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-4 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-3">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-50/80 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A8DF8E] focus:ring-2 focus:ring-[#A8DF8E]/20 transition-all resize-none min-h-[48px] max-h-[120px] text-gray-700 placeholder:text-gray-400"
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 bg-gradient-to-r from-[#A8DF8E] to-[#8FD475] text-white rounded-xl font-medium shadow-md shadow-[#A8DF8E]/30 hover:shadow-lg hover:shadow-[#A8DF8E]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 px-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </section>
    </main>
  );
}
