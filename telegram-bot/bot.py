import os, json, time, threading, logging
from typing import Any, Dict
import httpx
from flask import Flask
import telebot
from telebot import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("archedream.telebot")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-reasoner").strip()
DEEPSEEK_ASR_MODEL = os.getenv("DEEPSEEK_ASR_MODEL", "whisper-1").strip()
API_BASE = "https://api.deepseek.com/v1"
REPL_URL = os.getenv("REPL_URL", "").strip()
PORT = int(os.getenv("PORT", "8080"))

if not BOT_TOKEN:
    logger.warning("BOT_TOKEN is not set")
if not DEEPSEEK_API_KEY:
    logger.warning("DEEPSEEK_API_KEY is not set; insights/transcription disabled")

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")

# Keep-alive tiny web server (Flask)
app = Flask(__name__)
@app.get("/")
@app.get("/health")
def health():
    return "ok"

def run_keepalive():
    app.run(host="0.0.0.0", port=PORT)

def self_ping():
    if not REPL_URL:
        return
    while True:
        try:
            with httpx.Client(timeout=5) as c:
                c.get(REPL_URL.rstrip("/") + "/health")
        except Exception:
            pass
        time.sleep(240)

# --- Bot profile setup ---
def setup_bot_profile():
    if not BOT_TOKEN:
        return
    base = f"https://api.telegram.org/bot{BOT_TOKEN}"
    try:
        with httpx.Client(timeout=10) as c:
            c.post(f"{base}/setMyName", data={"name": "ArcheDream"})
            c.post(f"{base}/setMyShortDescription", data={"short_description": "Бережный юнгианский разбор снов"})
            c.post(f"{base}/setMyDescription", data={"description": "Пришлите текст или голосовое — отвечу архетипами, вопросами и практикой."})
            c.post(f"{base}/setMyCommands", json={"commands":[
                {"command":"start","description":"Начать и увидеть меню"},
                {"command":"help","description":"Как получить разбор"},
                {"command":"practice","description":"Практика дня (10 минут)"}
            ]})
    except Exception:
        logger.warning("Could not set bot profile", exc_info=True)

SYSTEM_PROMPT = (
    "Ты — опытный юнгианский аналитик (2025), бережный и не‑директивный. "
    "Говоришь по‑русски, короткими абзацами. Избегаешь медицинских диагнозов и категоричности. "
    "Опираешься на архетипы Юнга (Тень, Анима/Анимус, Самость), приоритет — личный контекст.\n\n"
    "Верни СТРОГО валидный JSON со структурой: "
    "{summary, myth_arc, archetypes:[{name,evidence:[]}], symbols:[{span,label}], questions:[3..5], practice:{title,steps:[],duration_min}, safety_notes:[]}\n"
    "Максимум 3 архетипа. Практика 5–10 минут. Тон — бережный."
)

HELP_TEXT = (
    "Пришлите текст или голосовое сообщение сна — я верну архетипы, вопросы и мягкую практику.\n"
    "Команды: /start, /help, /practice"
)
PRACTICE_OF_DAY = (
    "Практика дня: 10 вдохов доверия. На выдохе — фраза: ‘Я рядом с собой’."
)

def format_insight_html(out: Dict[str, Any]) -> str:
    arch = ", ".join([(a.get("name") if isinstance(a, dict) else str(a)) for a in out.get("archetypes", [])])
    questions = "<br/>".join([f"• {q}" for q in out.get("questions", [])])
    practice_block = ""
    p = out.get("practice")
    if isinstance(p, dict):
        steps = p.get("steps") or []
        steps_html = "<br/>".join([f"{i+1}) {s}" for i, s in enumerate(steps)])
        practice_block = f"<b>Практика:</b> {p.get('title','')}<br/>{steps_html}"
    myth = out.get("myth_arc")
    myth_html = f"<b>Мифо‑арка:</b> {myth}<br/>" if myth else ""
    safety = out.get("safety_notes") or []
    safety_html = f"<br/><i>{' '.join(safety)}</i>" if safety else ""
    disc = "<br/><i>Не медицинский совет. Берегите себя.</i>"
    return (
        f"<b>Архетипы:</b> {arch or '—'}<br/>"
        f"<b>Кратко:</b> {out.get('summary','—')}<br/>"
        f"{myth_html}{questions}<br/>{practice_block}{safety_html}{disc}"
    )

def tele_keyboard():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.row(types.KeyboardButton("Записать сон"), types.KeyboardButton("Получить инсайт"))
    kb.row(types.KeyboardButton("Практика дня"))
    return kb

# DeepSeek calls

def heuristic_insight() -> Dict[str, Any]:
    return {
        "summary": "Краткий эвристический разбор (без LLM)",
        "myth_arc": None,
        "archetypes": [],
        "symbols": [],
        "questions": [
            "Что было ядром переживания во сне?",
            "Как этот образ связан с вашей реальной ситуацией?",
            "Какая часть вас ‘говорит’ через этот сон?",
        ],
        "practice": {"title": "Три дыхания внимания", "steps": ["Вдох — замечаю тело", "Выдох — мягко к переживанию", "Повторить 3 раза"], "duration_min": 5},
        "safety_notes": ["Инсайт не является мед. советом"],
    }

def deepseek_insight(text: str, mood: str = "спокойно", depth: str = "deep") -> Dict[str, Any]:
    if not DEEPSEEK_API_KEY:
        return heuristic_insight()
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps({"dream_text": text, "mood": mood, "depth": depth, "associations": []}, ensure_ascii=False)},
        ],
        "temperature": 0.3,
        # Some DeepSeek deployments may not support response_format; rely on prompting instead
        # "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    try:
        with httpx.Client(timeout=60) as client:
            r = client.post(f"{API_BASE}/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to salvage JSON substring if any
                try:
                    start = content.find("{")
                    end = content.rfind("}")
                    if start != -1 and end != -1 and end > start:
                        return json.loads(content[start:end+1])
                except Exception:
                    pass
                return {"summary": content}
    except httpx.HTTPStatusError as e:
        logger.error("DeepSeek HTTP error %s: %s", e.response.status_code if e.response else "?", e.response.text if e.response else "")
        return heuristic_insight()
    except Exception as e:
        logger.exception("DeepSeek request failed")
        return heuristic_insight()

def deepseek_transcribe(voice_bytes: bytes, filename: str = "voice.ogg") -> str:
    if not DEEPSEEK_API_KEY:
        return ""
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}"}
    files = {
        "file": (filename, voice_bytes, "application/octet-stream"),
        "model": (None, DEEPSEEK_ASR_MODEL),
    }
    try:
        with httpx.Client(timeout=120) as client:
            r = client.post(f"{API_BASE}/audio/transcriptions", headers=headers, files=files)
            r.raise_for_status()
            data = r.json()
            return data.get("text") or data.get("transcription") or ""
    except Exception:
        logger.exception("ASR failed")
        return ""

# Handlers
@bot.message_handler(commands=["start"]) 
def start_cmd(m: telebot.types.Message):
    bot.send_message(m.chat.id, "Привет! Пришлите текст или голосовое сна — отвечу бережным юнгианским инсайтом.", reply_markup=tele_keyboard())

@bot.message_handler(commands=["help"]) 
def help_cmd(m: telebot.types.Message):
    bot.send_message(m.chat.id, HELP_TEXT)

@bot.message_handler(commands=["practice"]) 
def practice_cmd(m: telebot.types.Message):
    bot.send_message(m.chat.id, PRACTICE_OF_DAY)

@bot.message_handler(commands=["diag"]) 
def diag_cmd(m: telebot.types.Message):
    has_key = bool(DEEPSEEK_API_KEY)
    try:
        test = deepseek_insight("Проверка связи")
        ok = "summary" in test
    except Exception:
        ok = False
    bot.send_message(m.chat.id, f"diag: key={'yes' if has_key else 'no'}, model={DEEPSEEK_MODEL}, ok={'yes' if ok else 'no'}")

@bot.message_handler(content_types=["voice", "audio"]) 
def handle_voice(m: telebot.types.Message):
    try:
        file_id = (m.voice or m.audio).file_id
        file_info = bot.get_file(file_id)
        file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_info.file_path}"
        with httpx.Client(timeout=120) as c:
            voice_bytes = c.get(file_url).content
        text = deepseek_transcribe(voice_bytes, filename=(file_info.file_path or "voice.ogg").split("/")[-1])
        if text:
            bot.send_message(m.chat.id, f"<b>Расшифровка:</b> {text}")
        out = deepseek_insight(text or "")
        bot.send_message(m.chat.id, format_insight_html(out))
    except Exception as e:
        logger.exception("voice error")
        bot.send_message(m.chat.id, "Не удалось обработать голосовое. Попробуйте текстом.")

@bot.message_handler(content_types=["text"]) 
def handle_text(m: telebot.types.Message):
    text = (m.text or "").strip()
    if text in ("Записать сон", "Получить инсайт"):
        bot.send_message(m.chat.id, "Опишите сон и отправьте. Для голосовой — удержите микрофон.")
        return
    if text == "Практика дня":
        practice_cmd(m)
        return
    try:
        out = deepseek_insight(text)
        bot.send_message(m.chat.id, format_insight_html(out))
    except Exception:
        logger.exception("insight error")
        bot.send_message(m.chat.id, "Не удалось получить инсайт сейчас. Попробуйте позже.")

if __name__ == "__main__":
    # Start keep-alive server and self-ping in background
    threading.Thread(target=run_keepalive, daemon=True).start()
    if REPL_URL:
        threading.Thread(target=self_ping, daemon=True).start()
    logger.info("Starting long polling…")
    # Ensure webhook is cleared and set profile
    try:
        with httpx.Client(timeout=10) as c:
            c.get(f"https://api.telegram.org/bot{BOT_TOKEN}/deleteWebhook", params={"drop_pending_updates": True})
    except Exception:
        pass
    setup_bot_profile()
    bot.infinity_polling(skip_pending=True, interval=1, timeout=20)