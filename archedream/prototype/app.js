const ARCHETYPES = [
  'Невинный','Исследователь','Мудрец','Герой','Бунтарь','Маг',
  'Обыватель','Любовник','Шут','Опекун','Творец','Правитель'
];

const COLORS = ['#6E5AF0','#5F7BF3','#35C2C1','#8EF2E4','#C0B6FF','#9E91FF','#77D9D7','#EFB9F2','#F7D6A1','#F4A1B2','#B7FF8E','#A7D2FF'];

const state = {vector: new Array(12).fill(0.05)};

function $(q){return document.querySelector(q)}
function $all(q){return [...document.querySelectorAll(q)]}

function switchTab(id){
  $all('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  $all('.tabpane').forEach(p=>p.classList.toggle('active', p.id===id));
}

function drawWheel(){
  const size=300, r=size/2; const cx=r, cy=r; const n=12;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<defs><radialGradient id="g" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(110,90,240,.25)"/><stop offset="100%" stop-color="rgba(10,15,44,1)"/></radialGradient></defs>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${r-2}" fill="url(#g)" stroke="rgba(255,255,255,.08)"/>`;
  ARCHETYPES.forEach((name,i)=>{
    const a0 = (Math.PI*2/n)*i - Math.PI/2;
    const a1 = a0 + (Math.PI*2/n);
    const rr = r * (0.55 + 0.35*state.vector[i]);
    const x0 = cx + Math.cos(a0)*rr, y0 = cy + Math.sin(a0)*rr;
    const x1 = cx + Math.cos(a1)*rr, y1 = cy + Math.sin(a1)*rr;
    const largeArc = 0;
    const d = `M ${cx} ${cy} L ${x0} ${y0} A ${rr} ${rr} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    svg += `<path d="${d}" fill="${COLORS[i%COLORS.length]}" fill-opacity="0.55" stroke="rgba(255,255,255,.06)" data-i="${i}"/>`;
  });
  svg += `<circle cx="${cx}" cy="${cy}" r="56" fill="rgba(10,15,44,.9)" stroke="rgba(255,255,255,.06)"/>`;
  svg += `</svg>`;
  $('#wheel').innerHTML = svg;
  const legend = ARCHETYPES.map((n,i)=>`<div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLORS[i%COLORS.length]};margin-right:6px"></span>${n}</div>`).join('');
  $('#legend').innerHTML = legend;
}

function heuristicSymbols(text){
  const lower = text.toLowerCase();
  const symbols=[];
  const dict = {
    'коридор':'Порог', 'двер':'Порог', 'мост':'Переход', 'вода':'Бессознательное', 'озер':'Бессознательное',
    'собак':'Проводник', 'кот':'Анима/Анимус', 'огонь':'Трансформация', 'лес':'Тень', 'пещер':'Тень',
    'остров':'Самость', 'дом':'Я', 'поезд':'Путь', 'машин':'Контроль'
  };
  Object.keys(dict).forEach(k=>{ if(lower.includes(k)) symbols.push({span:k,label:dict[k]}); });
  return symbols;
}

function symbolsToArchetypes(symbols, mood){
  const weights = new Array(12).fill(0);
  const map = {
    'Порог': ['Исследователь','Герой'],
    'Бессознательное': ['Маг','Мудрец'],
    'Проводник': ['Мудрец','Опекун'],
    'Тень': ['Бунтарь','Герой'],
    'Самость': ['Правитель','Маг'],
    'Я': ['Обыватель','Опекун'],
    'Путь': ['Исследователь','Герой'],
    'Трансформация': ['Творец','Маг'],
    'Контроль': ['Правитель','Обыватель']
  };
  symbols.forEach(s=>{
    (map[s.label]||[]).forEach(a=>{ const idx=ARCHETYPES.indexOf(a); if(idx>=0) weights[idx]+=1; });
  });
  // mood influence
  if(mood==='тревога'){ weights[ARCHETYPES.indexOf('Опекун')]+=0.5; weights[ARCHETYPES.indexOf('Мудрец')]+=0.25; }
  if(mood==='радость'){ weights[ARCHETYPES.indexOf('Шут')]+=0.5; weights[ARCHETYPES.indexOf('Любовник')]+=0.25; }
  const max = Math.max(...weights, 1);
  state.vector = weights.map(w=>Math.min(1, 0.2 + w/(max*1.2)));
  return weights;
}

function generateInsight(text, mood, depth){
  const symbols = heuristicSymbols(text);
  const weights = symbolsToArchetypes(symbols, mood);
  drawWheel();
  const topIdx = [...weights].map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,3).map(x=>x.i).filter(i=>weights[i]>0);
  const topArch = topIdx.map(i=>ARCHETYPES[i]);
  const evidence = symbols.map(s=>`${s.span} → ${s.label}`).join(', ');
  const sections = [];
  sections.push(`<p><strong>Архетипы:</strong> ${topArch.join(', ') || '—'}</p>`);
  sections.push(`<p><strong>Почему так думаем:</strong> ${evidence || 'образов мало, делаем мягкую гипотезу'}</p>`);
  if(depth==='deep'){
    sections.push(`<p><strong>Личный миф:</strong> Сон как глава о переходе и ресурсе проводника внутри.</p>`);
  }
  const questions = [
    'Где сейчас я у порога — и что помогает шагнуть?',
    'Какой образ хочет для меня добра, если я прислушаюсь?',
    'Какое маленькое действие поддержит меня сегодня?'
  ];
  sections.push(`<ul>${questions.map(q=>`<li>${q}</li>`).join('')}</ul>`);
  const practice = depth==='deep' ? {
    title:'Свет в коридоре', steps:[
      'Нарисуйте место из сна и отметьте источник света.',
      'Найдите реальный «свет»: звонок другу, короткая прогулка, пауза на дыхание.',
      'Сделайте один шаг в течение 10 минут.'
    ]
  } : {
    title:'10 вдохов в доверии', steps:[
      'Сядьте удобно, 10 циклов дыхания 4–6.',
      'На выдохе тихо произносите: «Я рядом с собой».',
      'Запишите одно слово‑опору.'
    ]
  };
  const insightHtml = `
    <div class="block">${sections.join('')}</div>
    <div class="block"><strong>Практика:</strong> ${practice.title}
      <ol>${practice.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
    </div>`;
  $('#insightContent').innerHTML = insightHtml;
  // fill practices board
  $('#practices').innerHTML = [practice].map(p=>`<div class="card"><h4>${p.title}</h4><ol>${p.steps.map(s=>`<li>${s}</li>`).join('')}</ol><button class="primary" onclick="alert('Отмечено')">Сделано</button></div>`).join('');

  // weekly badge
  const badge = topArch[0] || '—';
  $('#weeklyBadge').textContent = badge;
  switchTab('insight');
}

function init(){
  // tabs
  $all('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  $all('[data-tab-jump]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tabJump)));
  // analyze
  $('#analyze').addEventListener('click',()=>{
    const text = $('#dreamText').value.trim();
    if(!text){ alert('Опишите сон'); return; }
    const mood = $('#mood').value; const depth=$('#depth').value;
    generateInsight(text, mood, depth);
  });
  // incubation modal
  $('#incubate').addEventListener('click',()=> $('#incubationModal').classList.remove('hidden'));
  $('#closeIncubation').addEventListener('click',()=> $('#incubationModal').classList.add('hidden'));
  // sanctuary
  $('#sanctuaryToggle').addEventListener('change',(e)=>{
    document.body.classList.toggle('sanctuary', e.target.checked);
  });
  drawWheel();
}

init();