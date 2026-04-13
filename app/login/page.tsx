'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { handleSignIn, handleSignOut} from '../../lib/auth';
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();

  const handleSignInClick = async () => {
    await handleSignIn();
  };

  const handleSignOutClick = async () => {
    await handleSignOut();
  };

  useEffect(() => {
    if (session?.user?.email) {
      (async () => {
        try {
          const result = await saveUser(session.user);
          console.log('saveUser result:', result);
        } catch (error) {
          console.error('Error saving user:', error);
        }
      })();
      setTimeout(() => {
        router.push("/chat");
      }, 2000);
    }
  }, [session, router]);

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-[#F0FFDF] via-[#F5FFE8] to-[#E8F5D6] items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#A8DF8E]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#FFAAB8]/20 rounded-full blur-3xl" />
      
      {/* Floating mascot */}
      <div className="absolute bottom-10 right-10 opacity-30 pointer-events-none">
        <Image
          src="/chancy.png"
          alt=""
          width={200}
          height={300}
          className="object-contain animate-float"
        />
      </div>

      {/* Main card */}
      <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A8DF8E] to-[#8FD475] flex items-center justify-center shadow-lg shadow-[#A8DF8E]/30">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
        </div>

        {session ? (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome back, {session.user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-gray-500 mb-8">Redirecting to your chats...</p>
            
            {/* Loading indicator */}
            <div className="flex justify-center gap-1.5 mb-8">
              <span className="w-2 h-2 bg-[#A8DF8E] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-[#A8DF8E] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-[#A8DF8E] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>

            <button
              onClick={handleSignOutClick}
              className="w-full px-6 py-3 rounded-xl text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome to Chance.ai
            </h2>
            <p className="text-gray-500 mb-8">
              Sign in to start chatting with AI
            </p>

            <button
              onClick={handleSignInClick}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#A8DF8E] to-[#8FD475] text-white rounded-xl font-semibold shadow-lg shadow-[#A8DF8E]/30 hover:shadow-xl hover:shadow-[#A8DF8E]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="text-xs text-gray-400 mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </>
        )}
      </div>
    </main>
  );
}
