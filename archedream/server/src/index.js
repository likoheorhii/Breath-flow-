require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const app = express();
const { TelegramBot } = require('./telegram');

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use(limiter);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-reasoner';
const DEEPSEEK_ASR_MODEL = process.env.DEEPSEEK_ASR_MODEL || 'whisper-1';
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_POLLING = String(process.env.TELEGRAM_POLLING||'').toLowerCase()==='true';

// Optional bearer token guard
app.use((req,res,next)=>{
  if(!API_AUTH_TOKEN) return next();
  const h = req.headers['authorization'] || '';
  if(h === `Bearer ${API_AUTH_TOKEN}`) return next();
  return res.status(401).json({ error: 'unauthorized' });
});

app.get('/health', (_,res)=>res.json({ok:true, llm: !!DEEPSEEK_API_KEY}));

let dreams = [];
app.post('/dreams', (req,res)=>{ const d={id:Date.now().toString(), ...req.body}; dreams.push(d); res.json(d); });
app.get('/dreams', (_,res)=>res.json(dreams));

function heuristic(text){
  const lower = (text||'').toLowerCase();
  const dict = { 'коридор':'Порог','двер':'Порог','мост':'Переход','вода':'Бессознательное','озер':'Бессознательное','собак':'Проводник','кот':'Анима/Анимус','огонь':'Трансформация','лес':'Тень','пещер':'Тень','остров':'Самость','дом':'Я','поезд':'Путь','машин':'Контроль' };
  const symbols = Object.keys(dict).filter(k=>lower.includes(k)).map(k=>({span:k,label:dict[k]}));
  const archs = ['Невинный','Исследователь','Мудрец','Герой','Бунтарь','Маг','Обыватель','Любовник','Шут','Опекун','Творец','Правитель'];
  const weights = archs.map(()=>0);
  const amap = { 'Порог':['Исследователь','Герой'],'Бессознательное':['Маг','Мудрец'],'Проводник':['Мудрец','Опекун'],'Тень':['Бунтарь','Герой'],'Самость':['Правитель','Маг'],'Я':['Обыватель','Опекун'],'Путь':['Исследователь','Герой'],'Трансформация':['Творец','Маг'],'Контроль':['Правитель','Обыватель'] };
  symbols.forEach(s=> (amap[s.label]||[]).forEach(a=>{const i=archs.indexOf(a); if(i>=0) weights[i]++;}));
  const top = weights.map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,3).filter(x=>x.w>0).map(x=>archs[x.i]);
  return {summary:'Гипотеза по сну', archetypes: top, symbols};
}

async function deepseekInsight({text, mood='спокойно', depth='standard', associations=[]}){
  const system = 'Роль: юнгианский аналитик, бережный, не-директивный. Дай краткий бережный разбор без медицины. Форматируй как JSON.';
  const user = { dream_text: text, mood, associations, depth, instructions: 'Верни JSON с полями: summary, archetypes[ {name, evidence[]} ], symbols[ {span,label} ], questions[3-5], practice{title,steps[],duration_min}, safety_notes[]. Максимум 3 архетипа.' };
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages: [ { role:'system', content: system }, { role:'user', content: JSON.stringify(user) } ], temperature: 0.3, response_format: { type: 'json_object' } })
  });
  if(!resp.ok){ const t = await resp.text(); throw new Error(`DeepSeek error ${resp.status}: ${t}`); }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  let parsed; try { parsed = JSON.parse(content); } catch { parsed = { summary: content }; }
  return parsed;
}

async function insightTextResponse(text){
  try{
    if(DEEPSEEK_API_KEY){
      const out = await deepseekInsight({ text, mood:'спокойно', depth:'standard', associations:[] });
      const arch = (out.archetypes||[]).map(a=>a.name||a).join(', ');
      const q = Array.isArray(out.questions)? out.questions.map(x=>`• ${x}`).join('\n'):'';
      const pr = out.practice? `Практика: ${out.practice.title||''}\n${(out.practice.steps||[]).map((s,i)=>`${i+1}) ${s}`).join('\n')}`:'';
      return `Архетипы: ${arch||'—'}\nКратко: ${out.summary||'—'}\n${q}\n${pr}`.trim();
    }
    const h = heuristic(text);
    return `Архетипы (эвристика): ${(h.archetypes||[]).join(', ')||'—'}\nПочему: ${(h.symbols||[]).map(s=>`${s.span}→${s.label}`).join(', ')}`;
  }catch(e){ return 'Не удалось получить инсайт сейчас.'; }
}

async function startTelegram(){
  if(!TELEGRAM_BOT_TOKEN || !TELEGRAM_POLLING) return;
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('Telegram bot polling started');
  while(true){
    try{
      const updates = await bot.getUpdates();
      for(const u of updates){
        bot.offset = u.update_id;
        const msg = u.message; if(!msg || !msg.text) continue;
        const chatId = msg.chat.id; const text = msg.text.trim();
        if(text.startsWith('/start')){ await bot.sendMessage(chatId, 'Пришлите текст сна, я отвечу коротким инсайтом.'); continue; }
        const reply = await insightTextResponse(text);
        await bot.sendMessage(chatId, reply);
      }
    }catch{ /* silent retry */ }
  }
}

startTelegram();

app.post('/insights', async (req,res)=>{
  const { text, mood='спокойно', depth='standard', associations=[] } = req.body || {};
  if(!text) return res.status(400).json({error:'text required'});
  try{
    if(DEEPSEEK_API_KEY){ const out = await deepseekInsight({text, mood, depth, associations}); return res.json(out); }
    return res.json(heuristic(text));
  }catch(err){ console.error(err); return res.json(heuristic(text)); }
});

app.post('/transcribe', upload.single('audio'), async (req,res)=>{
  try{
    if(!DEEPSEEK_API_KEY){ return res.status(400).json({error:'DEEPSEEK_API_KEY required for transcription'}); }
    if(!req.file){ return res.status(400).json({error:'audio file is required (field: audio)'}); }
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer]), req.file.originalname || 'audio.m4a');
    form.append('model', DEEPSEEK_ASR_MODEL);
    const resp = await fetch('https://api.deepseek.com/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }, body: form });
    if(!resp.ok){ const t = await resp.text(); throw new Error(`DeepSeek ASR error ${resp.status}: ${t}`); }
    const data = await resp.json();
    return res.json({ text: data.text || data.transcription || '' });
  }catch(e){ console.error(e); return res.status(500).json({error:'transcription_failed', detail: String(e)}); }
});

const port = process.env.PORT || 4000;
app.listen(port, ()=>console.log('API on '+port));