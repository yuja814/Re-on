import { apiRequest } from './api-client';
export type MemorySummary = { id: number; title: string; description: string; momentCount: number; startDate: string; endDate: string; isNew: boolean };
export type MemoryDetail = Omit<MemorySummary, 'isNew'> & {
  contexts: { type: 'TIME' | 'PLACE'; label: string; value?: string }[];
  moments: { id: number; recordedAt: string; title: string; artist: string | null; memo: string | null }[];
};
export const fetchMemories = () => apiRequest<{content: MemorySummary[]}>('/memories');
export const fetchMemory = (id: string) => apiRequest<MemoryDetail>(`/memories/${encodeURIComponent(id)}`);
export const markMemoryRead = (id: string) => apiRequest<{id: number; isNew: boolean}>(`/memories/${encodeURIComponent(id)}/read`,{method:'PATCH'});
