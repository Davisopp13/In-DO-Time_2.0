"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function signIn(email: string, password: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signIn error:", error);
      throw new Error(error.message);
    }

    redirect("/");
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign in action error:", error);
    throw error;
  }
}

export async function signUp(email: string, password: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signUp error:", error);
      throw new Error(error.message);
    }

    redirect("/");
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign up action error:", error);
    throw error;
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
