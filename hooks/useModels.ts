import { useQuery } from '@tanstack/react-query';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export function useModels() {
  return useQuery<OllamaModel[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await fetch('/api/ollama/tags');
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.models as OllamaModel[];
    },
    retry: 1,
  });
}