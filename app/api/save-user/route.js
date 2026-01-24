import { createClient } from 'util/supabase/server.ts'
import { cookies } from 'next/headers'
console.log('saveUser called, typeof window:', typeof window);
export async function POST(request) {

  console.log("debug: received request to save user");
  const user = await request.json();
  console.log("debug: user data:", user);

  if (!user?.email || !user?.name) {
    console.log("invalid user data:", user);
    return new Response(JSON.stringify({ error: "invalid user data" }), { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  console.log("Upserting user:", user);

  console.log("emoo help:", user);
  const { data, error } = await supabase
    .from("user_database")
    .upsert(
      {
        name: user.name,
        email: user.email,
        image: user.image,
      },
      { onConflict: ["email"] }
    );

  if (error) {
    console.log("Error upserting user:", error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
  console.log("Upserted user data:", data);
  return new Response(JSON.stringify({ data }), { status: 200 });
}