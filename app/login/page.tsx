'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { handleSignIn, handleSignOut} from '../../lib/auth';

export async function saveUser(user: unknown) {

  const res = await fetch('/api/save-user', {
    method: 'POST',
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Save user failed: ${res.status}`);
  }

  return await res.json();
}

export default function LoginPage() {
  const { data: session } = useSession();

    useEffect(() => {
    if (session?.user?.email) {
        // 登录后，把用户信息写入 user_database
        console.log('User session:', session);
        (async () => {
        try {
            const result = await saveUser(session.user);
            console.log('saveUser result:', result);
        } catch (error) {
            console.error('Error saving user:', error);
        }
        })();
    }
    }, [session]);

  return (

    <main
    className="flex items-center justify-center min-h-screen"
    // style={{ backgroundColor: "#FFF2EB" }}
    style={{
    backgroundImage: "url('/background.jpeg')",
}}
    >
    {/* <div className="absolute inset-0 bg-white/40" /> */}
    <div
    className="text-center w-[360px] h-[180px] p-8 rounded-3xl shadow-lg border-2"
    style={{
        backgroundColor: "#FFD8DF",
        borderColor: "#FEEAC9",
    }}
    >
    {session ? (
        <>
        <h2
            className="text-2xl mb-6"
            style={{ color: "#78C841" }}
        >
            Hello, {session.user?.name} 🌱
        </h2>

        <button
            onClick={handleSignOut}
            className="px-8 py-4 rounded-full text-white border-2 transition-all duration-300"
            style={{
            backgroundColor: "#FFAAB8",
            borderColor: "#FEEAC9",
            }}
        >
            Sign Out
        </button>
        </>
    ) : (
        <>
        <h2
            className="text-2xl mb-6"
            style={{ color: "#FD7979" }}
        >
            Welcome to Chance.ai 🌸
        </h2>

        <button
            onClick={handleSignIn}
            className="px-8 py-4 rounded-full text-white border-2 transition-all duration-300"
            style={{
            backgroundColor: "#A8DF8E",
            borderColor: "#FEEAC9",
            }}
        >
            Sign in
        </button>
        </>
    )}
    </div>

    </main>

  );
}