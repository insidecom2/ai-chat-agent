import { useQuery } from '@tanstack/react-query';

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await fetch('/api/ollama/tags');
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.models;
    },
    retry: 1,
  });
}
