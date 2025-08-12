const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-reasoner';

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
  const user = {
    dream_text: text,
    mood,
    associations,
    depth,
    instructions: 'Верни JSON с полями: summary, archetypes[ {name, evidence[]} ], symbols[ {span,label} ], questions[3-5], practice{title,steps[],duration_min}, safety_notes[]. Максимум 3 архетипа.'
  };
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [ { role:'system', content: system }, { role:'user', content: JSON.stringify(user) } ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  if(!resp.ok){
    const t = await resp.text();
    throw new Error(`DeepSeek error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  // OpenAI-compatible shape
  const content = data.choices?.[0]?.message?.content || '{}';
  let parsed;
  try { parsed = JSON.parse(content); } catch { parsed = { summary: content }; }
  return parsed;
}

app.post('/insights', async (req,res)=>{
  const { text, mood='спокойно', depth='standard', associations=[] } = req.body || {};
  if(!text) return res.status(400).json({error:'text required'});
  try{
    if(DEEPSEEK_API_KEY){
      const out = await deepseekInsight({text, mood, depth, associations});
      return res.json(out);
    }
    return res.json(heuristic(text));
  }catch(err){
    console.error(err);
    // graceful fallback
    return res.json(heuristic(text));
  }
});

const port = process.env.PORT || 4000;
app.listen(port, ()=>console.log('API on '+port));