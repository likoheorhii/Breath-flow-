const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

app.get('/health', (_,res)=>res.json({ok:true}));

let dreams = [];
app.post('/dreams', (req,res)=>{ const d={id:Date.now().toString(), ...req.body}; dreams.push(d); res.json(d); });
app.get('/dreams', (_,res)=>res.json(dreams));

app.post('/insights', (req,res)=>{
  const { text, mood='спокойно' } = req.body || {};
  if(!text) return res.status(400).json({error:'text required'});
  // simple heuristic
  const lower = text.toLowerCase();
  const dict = { 'коридор':'Порог','двер':'Порог','мост':'Переход','вода':'Бессознательное','озер':'Бессознательное','собак':'Проводник','кот':'Анима/Анимус','огонь':'Трансформация','лес':'Тень','пещер':'Тень','остров':'Самость','дом':'Я','поезд':'Путь','машин':'Контроль' };
  const symbols = Object.keys(dict).filter(k=>lower.includes(k)).map(k=>({span:k,label:dict[k]}));
  const archs = ['Невинный','Исследователь','Мудрец','Герой','Бунтарь','Маг','Обыватель','Любовник','Шут','Опекун','Творец','Правитель'];
  const weights = archs.map(()=>0);
  const amap = { 'Порог':['Исследователь','Герой'],'Бессознательное':['Маг','Мудрец'],'Проводник':['Мудрец','Опекун'],'Тень':['Бунтарь','Герой'],'Самость':['Правитель','Маг'],'Я':['Обыватель','Опекун'],'Путь':['Исследователь','Герой'],'Трансформация':['Творец','Маг'],'Контроль':['Правитель','Обыватель'] };
  symbols.forEach(s=> (amap[s.label]||[]).forEach(a=>{const i=archs.indexOf(a); if(i>=0) weights[i]++;}));
  const top = weights.map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,3).filter(x=>x.w>0).map(x=>archs[x.i]);
  res.json({summary:'Гипотеза по сну', archetypes: top, symbols});
});

const port = process.env.PORT || 4000;
app.listen(port, ()=>console.log('API on '+port));