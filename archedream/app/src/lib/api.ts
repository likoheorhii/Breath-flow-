export type DepthMode = 'light' | 'standard' | 'deep';
export type Mood = 'спокойно' | 'интерес' | 'тревога' | 'радость' | 'грусть';

const API_BASE = 'http://localhost:4000';

export async function fetchInsight(args: { text: string; mood: Mood; depth: DepthMode; associations?: string[] }){
  const res = await fetch(`${API_BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data;
}