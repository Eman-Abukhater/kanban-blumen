// src/pages/index.tsx
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import { verifyTokenFast } from "@/services/auth";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export default function Home() {
  const router = useRouter();

  // ✅ prevents double effect run in dev (Strict Mode)
  const ranRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (ranRef.current) return;
    ranRef.current = true;

    const stored = window.sessionStorage.getItem("userData");
    const token = localStorage.getItem("token");

    // ✅ If no auth at all → go to auth immediately
    if (!stored || !token) {
      router.replace("/auth/1/1");
      return;
    }

    // ✅ UX-first: go to projects immediately (no waiting)
    router.replace("/projects");

    // ✅ Verify in the background (don’t block UI)
    (async () => {
      try {
        // only wait a tiny bit; if backend is slow/cold, don't keep loader
        const verification: any = await withTimeout(verifyTokenFast(token), 350);

        if (!verification?.success) {
          window.sessionStorage.removeItem("userData");
          localStorage.removeItem("token");
          router.replace("/auth/1/1");
        }
      } catch {
        // timeout / network / backend cold start:
        // don't block the user here. If token is invalid, API 401 will handle it later.
      }
    })();
  }, [router.isReady, router]);

  return <LoadingPage2 />;
}
