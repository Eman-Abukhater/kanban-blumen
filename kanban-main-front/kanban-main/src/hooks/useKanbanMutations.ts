// src/hooks/useKanbanMutations.ts
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

export function useInvalidateKanban() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const fkboardid = id ? parseInt(id, 10) : null;

  return async () => {
    // invalidate the exact board
    if (fkboardid) {
      await queryClient.invalidateQueries({ queryKey: ["kanbanlist", fkboardid] });
    }
    // and also the generic key (safe)
    await queryClient.invalidateQueries({ queryKey: ["kanbanlist"] });
  };
}
