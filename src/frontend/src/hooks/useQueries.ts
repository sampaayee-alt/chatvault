import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatSession, ChatSessionInput } from "../backend";
import { useActor } from "./useActor";

export function useListChatSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatSession[]>({
    queryKey: ["chatSessions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listChatSessions();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalExports() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalExports"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getTotalExports();
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveChatSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ChatSessionInput) => {
      if (!actor) throw new Error("No actor available");
      return actor.saveChatSession(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      queryClient.invalidateQueries({ queryKey: ["totalExports"] });
    },
  });
}

export function useFetchUrlContent() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error("No actor available");
      const result = await actor.fetchUrlContent(url);
      if (result.startsWith("Error:")) throw new Error(result.slice(7).trim());
      return result;
    },
  });
}
