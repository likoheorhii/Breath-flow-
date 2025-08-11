# Извлечение символов и аффектов (LLM‑NER)

Задача: извлечь сущности из текста сна.

Сущности
- figure(person|animal|mythic), place, object, action, affect(type,intensity0–10), motif, time.

Правила
- Используй текстовые спаны; не обобщай; допускай несколько меток на спан.
- Выход только JSON, схема:
{
  "symbols": [ {"span":"…","label":"figure|place|object|action|motif|time"} ],
  "affects": [ {"type":"…","intensity":7,"evidence":"…"} ]
}