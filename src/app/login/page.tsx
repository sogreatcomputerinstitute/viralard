import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/AuthCard";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <AuthCard />
    </main>
  );
}