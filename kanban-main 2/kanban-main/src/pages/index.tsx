import { useEffect } from "react";
import { useRouter } from "next/router";
import { useContext } from "react";
import KanbanContext from "../context/kanbanContext";
import LoadingPage2 from "@/components/layout/LoadingPage2";
import { verifyTokenFast } from "@/services/auth";

export default function Home() {
  const r = useRouter();
  const { userInfo } = useContext(KanbanContext);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is already authenticated
      const stored = window.sessionStorage.getItem("userData");
      const token = localStorage.getItem("token");

      if (stored && token) {
        // Quick token verification without DB lookup
        const verification = await verifyTokenFast(token);

        if (verification.success) {
          // Token is valid, go directly to projects
          r.replace("/projects");
          return;
        }

        // Token is invalid, clear storage and re-authenticate
        window.sessionStorage.removeItem("userData");
        localStorage.removeItem("token");
      }

      // Not authenticated, go to auth page
      // You can change these default values (fkpoid: 1, userid: 1) as needed
      r.replace("/auth/1/1");
    };

    checkAuth();
  }, [r]);

  return <LoadingPage2 />;
}
