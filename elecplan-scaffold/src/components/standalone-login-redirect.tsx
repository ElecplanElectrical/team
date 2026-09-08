"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function StandaloneLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (standalone) {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
