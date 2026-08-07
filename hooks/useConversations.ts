import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteConversation, listConversations } from '@/lib/api/conversations'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await listConversations()
      return data.conversations
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
