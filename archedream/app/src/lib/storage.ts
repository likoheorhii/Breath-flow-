import AsyncStorage from '@react-native-async-storage/async-storage';

export type DreamEntry = { id: string; createdAt: number; text: string; mood?: string; audioUri?: string };
const KEY = 'dreams_v1';

export async function addDream(entry: Omit<DreamEntry,'id'|'createdAt'>){
  const all = await getDreams();
  const e: DreamEntry = { id: Date.now().toString(), createdAt: Date.now(), ...entry } as any;
  await AsyncStorage.setItem(KEY, JSON.stringify([e, ...all]));
  return e;
}

export async function getDreams(): Promise<DreamEntry[]>{
  const raw = await AsyncStorage.getItem(KEY);
  if(!raw) return [];
  try{ return JSON.parse(raw) as DreamEntry[] } catch{ return [] }
}