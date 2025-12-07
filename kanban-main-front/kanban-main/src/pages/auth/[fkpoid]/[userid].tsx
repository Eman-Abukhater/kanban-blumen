import { login, verifyTokenFast } from "@/services/auth";
import { authTheUserId } from "@/services/kanbanApi";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import KanbanContext from "../../../context/kanbanContext";
import LoadingPage2 from "@/components/layout/LoadingPage2";

export default function Auth() {
  const { handleSetUserInfo } = useContext(KanbanContext);
  const router = useRouter();

  const { fkpoid } = router.query as { fkpoid: string | null };

  const fkpoidAsNumber =
    fkpoid !== null && !isNaN(parseInt(fkpoid as string, 10))
      ? parseInt(fkpoid as string, 10)
      : null;

  useEffect(() => {
    const run = async () => {
      if (fkpoidAsNumber == null) return;

      // Check if we already have a valid token
      const existingToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      let userId: number | null = null;

      if (existingToken) {
        // Try to use existing token first (fast path)
        const verification = await verifyTokenFast(existingToken);

        if (verification.success && verification.data?.userId) {
          console.log("Using existing valid token");
          userId = verification.data.userId;
        }
      }

      // If no valid token, do full login (slow path with bcrypt)
      if (!userId) {
        console.log("No valid token, performing login");
        const loginRes = await login("admin@kanban.com", "admin123");
        userId = loginRes?.data?.user?.id ?? loginRes?.data?.data?.user?.id;

        if (!userId) {
          console.error("No user id from login");
          router.push("/unauthorized");
          return;
        }
      }

      // 2) Use the id from login (NOT the id from the URL) for project access
      const res = await authTheUserId(fkpoidAsNumber, Number(userId));

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || res?.status !== 200 || !res?.data) {
        router.push("/unauthorized");
        return;
      }

      // 3) Store user info and redirect to projects page
      handleSetUserInfo(res.data);
      window.sessionStorage.setItem("userData", JSON.stringify(res.data));
      // Redirect to projects page instead of directly to boardList
      router.push(`/projects`);
    };

    run();
  }, [fkpoidAsNumber]);

  return <LoadingPage2 />;
}
