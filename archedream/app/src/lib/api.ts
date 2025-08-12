export type DepthMode = 'light' | 'standard' | 'deep';
export type Mood = 'спокойно' | 'интерес' | 'тревога' | 'радость' | 'грусть';
import { CONFIG } from '../config';

const API_BASE = CONFIG.API_BASE;
const authHeader = CONFIG.API_TOKEN ? { 'Authorization': `Bearer ${CONFIG.API_TOKEN}` } : {};

export async function fetchInsight(args: { text: string; mood: Mood; depth: DepthMode; associations?: string[] }){
  const res = await fetch(`${API_BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data;
}

export async function transcribeAudio(input: { uri: string; name?: string; mime?: string }){
  const form = new FormData();
  const name = input.name || 'audio.m4a';
  const type = input.mime || 'audio/m4a';
  // React Native vs Web
  // @ts-ignore
  form.append('audio', (typeof window === 'undefined' || !(window as any).Blob)
    ? ({ uri: input.uri, name, type } as any)
    : await (async () => { const blob = await fetch(input.uri).then(r=>r.blob()); return new File([blob], name, { type }); })()
  );
  const res = await fetch(`${API_BASE}/transcribe`, { method: 'POST', headers: { ...authHeader } as any, body: form as any });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}