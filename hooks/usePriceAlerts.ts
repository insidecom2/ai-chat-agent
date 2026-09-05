import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ApiError,
  deletePriceAlertGroup,
  getPriceAlertGroup,
  listPriceAlertGroups,
  savePriceAlertGroup,
} from '@/lib/api/price-alerts'
import type { PriceAlertPutPayload } from '@/types/price-alerts'

export const priceAlertKeys = {
  all: ['price-alerts'] as const,
  list: () => [...priceAlertKeys.all, 'list'] as const,
  detail: (date: string, symbol: string) => [...priceAlertKeys.all, 'detail', date, symbol] as const,
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 1
}

export function usePriceAlertGroups() {
  return useQuery({
    queryKey: priceAlertKeys.list(),
    queryFn: async () => {
      const data = await listPriceAlertGroups()
      return data.groups
    },
    retry: shouldRetry,
  })
}

export function usePriceAlertGroup(date: string, symbol: string, enabled: boolean) {
  return useQuery({
    queryKey: priceAlertKeys.detail(date, symbol),
    queryFn: () => getPriceAlertGroup(date, symbol),
    enabled,
    retry: shouldRetry,
  })
}

export function useSavePriceAlertGroup(originalDate: string, originalSymbol: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PriceAlertPutPayload) => savePriceAlertGroup(originalDate, originalSymbol, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: priceAlertKeys.detail(originalDate, originalSymbol) })
      queryClient.invalidateQueries({ queryKey: priceAlertKeys.list() })
    },
  })
}

export function useDeletePriceAlertGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, symbol }: { date: string; symbol: string }) => deletePriceAlertGroup(date, symbol),
    onSuccess: (_data, { date, symbol }) => {
      queryClient.removeQueries({ queryKey: priceAlertKeys.detail(date, symbol) })
      queryClient.invalidateQueries({ queryKey: priceAlertKeys.list() })
    },
  })
}
