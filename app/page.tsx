'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        // 登录后写入数据库
        await saveUser(session.user);
      }
      setLoading(false);
    };

    fetchUser();

    // 监听登录状态变化
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) router.push("/login");
      else {
        setUser(session.user);
        await saveUser(session.user);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading)
    return (
      <div>
        Patience is nothing but I have no time to page a dinosaur game, sorry...
      </div>
    );

  return (
    <div>
      <h1>Welcome to Find Your Same Weird Question Friend Website</h1>
      <p>Hi, {user?.email}</p>
    </div>
  );
}

// 写入 Supabase users 表
async function saveUser(user: User) {
  if (!user) return;

  const { error } = await supabase.from("users").upsert({
    id: user.id,      // 用 Supabase auth id 作为主键
    email: user.email,
    name: user.user_metadata?.full_name || null,
    avatar: user.user_metadata?.avatar_url || null,
  });

  if (error) console.error("Error saving user:", error);
  else console.log("User saved successfully:", user.email);
}

async function askKimi(prompt: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  return data.reply;
}
