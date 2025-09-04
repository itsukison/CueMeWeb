"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LandingPage from "@/components/landing-page";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Small delay to ensure landing page content is rendered for SEO
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      }
    };

    checkAuth();
  }, [router]);

  // Always render the landing page content first for SEO
  // The redirect only happens after a brief delay for authenticated users
  return <LandingPage />;
}
