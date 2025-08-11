figma.closePlugin = () => {};

function createFrame(name, x, y){
  const frame = figma.createFrame();
  frame.resizeWithoutConstraints(390, 844);
  frame.name = name;
  frame.x = x; frame.y = y;
  frame.fills = [{type:'SOLID', color:{r:0.04,g:0.06,b:0.17}}];
  return frame;
}

function addSvg(frame, svgText){
  const node = figma.createNodeFromSvg(svgText);
  node.x = 0; node.y = 0;
  frame.appendChild(node);
}

async function run(){
  // Inline SVGs (generated from repo)
  const svgs = {
    Home:`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0A0F2C"/><rect x="16" y="16" width="358" height="40" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="28" y="42" fill="#E9E7F6" font-family="Inter" font-size="14">ArcheDream — Святилище</text><rect x="16" y="72" width="358" height="40" rx="20" fill="#12173C" stroke="#2A2F55"/><text x="28" y="98" fill="#A9A6C7" font-family="Inter" font-size="12">Домой  ·  Запись  ·  Инсайт  ·  Интеграция</text><rect x="16" y="128" width="358" height="120" rx="16" fill="#12173C" stroke="#2A2F55"/><text x="28" y="156" fill="#E9E7F6" font-family="Playfair Display" font-size="18">Сон — не загадка, а карта</text><rect x="28" y="172" width="120" height="28" rx="12" fill="#6E5AF0"/><rect x="156" y="172" width="140" height="28" rx="12" fill="none" stroke="#2A2F55"/><text x="48" y="190" fill="#fff" font-family="Inter" font-size="12">Записать</text><text x="176" y="190" fill="#E9E7F6" font-family="Inter" font-size="12">Посмотреть мандалу</text><text x="16" y="272" fill="#E9E7F6" font-family="Inter" font-size="14">Звучащий архетип недели</text><rect x="16" y="288" width="120" height="24" rx="12" fill="#16353A" stroke="#35C2C1"/><text x="24" y="304" fill="#D2F8F4" font-family="Inter" font-size="12">Badge</text><rect x="45" y="330" width="300" height="300" rx="150" fill="#12173C" stroke="#2A2F55"/><text x="140" y="486" fill="#A9A6C7" font-family="Inter" font-size="12">Мандала (12 сегм.)</text></svg>`,
    Record:`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0A0F2C"/><text x="16" y="36" fill="#E9E7F6" font-family="Inter" font-size="16">Записать сон</text><rect x="16" y="56" width="358" height="36" rx="10" fill="#12173C" stroke="#2A2F55"/><text x="24" y="80" fill="#A9A6C7" font-family="Inter" font-size="12">Режим глубины</text><rect x="16" y="108" width="358" height="36" rx="10" fill="#12173C" stroke="#2A2F55"/><text x="24" y="132" fill="#A9A6C7" font-family="Inter" font-size="12">Настроение</text><rect x="16" y="168" width="358" height="260" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="188" fill="#A9A6C7" font-family="Inter" font-size="12">Поле описания сна…</text><rect x="16" y="438" width="160" height="36" rx="12" fill="#6E5AF0"/><text x="36" y="462" fill="#fff" font-family="Inter" font-size="12">Получить инсайт</text><rect x="186" y="438" width="188" height="36" rx="12" fill="none" stroke="#2A2F55"/><text x="206" y="462" fill="#E9E7F6" font-family="Inter" font-size="12">Ритуал инкубации</text></svg>`,
    Insight:`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0A0F2C"/><text x="16" y="36" fill="#E9E7F6" font-family="Inter" font-size="16">Инсайт</text><rect x="16" y="56" width="100" height="100" rx="50" fill="#12173C" stroke="#2A2F55"/><text x="130" y="84" fill="#E9E7F6" font-family="Inter" font-size="12">Архетипы: A, B, C</text><rect x="16" y="170" width="358" height="60" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="200" fill="#A9A6C7" font-family="Inter" font-size="12">Почему: chips</text><rect x="16" y="240" width="358" height="110" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="268" fill="#A9A6C7" font-family="Inter" font-size="12">Вопросы к себе…</text><rect x="16" y="360" width="358" height="160" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="388" fill="#A9A6C7" font-family="Inter" font-size="12">Практика (5–10 мин)…</text></svg>`,
    Integrate:`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0A0F2C"/><text x="16" y="36" fill="#E9E7F6" font-family="Inter" font-size="16">Кабинет интеграции</text><rect x="16" y="56" width="358" height="100" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="86" fill="#A9A6C7" font-family="Inter" font-size="12">Практика • 10 мин • шаги…  [Отметить]</text><rect x="16" y="166" width="358" height="100" rx="12" fill="#12173C" stroke="#2A2F55"/></svg>`,
    Wheel:`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#0A0F2C"/><text x="16" y="36" fill="#E9E7F6" font-family="Inter" font-size="16">Колесо архетипов</text><rect x="45" y="64" width="300" height="300" rx="150" fill="#12173C" stroke="#2A2F55"/><rect x="16" y="380" width="358" height="160" rx="12" fill="#12173C" stroke="#2A2F55"/><text x="24" y="406" fill="#A9A6C7" font-family="Inter" font-size="12">Карточка архетипа: название, динамика, практика</text></svg>`
  };

  let i = 0; const frames = {};
  for(const [name, svg] of Object.entries(svgs)){
    const f = createFrame(name, (i%3)*420, Math.floor(i/3)*880);
    addSvg(f, svg);
    frames[name] = f; i++;
  }

  // Sanctuary overlay frame
  const overlay = figma.createFrame();
  overlay.resizeWithoutConstraints(390, 844);
  overlay.name = 'Sanctuary Overlay';
  overlay.fills = [{type:'SOLID', color:{r:0,g:0,b:0}, opacity:0.12}];

  // Archetype bottom sheet
  const sheet = figma.createFrame();
  sheet.resizeWithoutConstraints(390, 300);
  sheet.name = 'Archetype Sheet';
  sheet.fills = [{type:'SOLID', color:{r:0.05,g:0.07,b:0.22}}];
  sheet.strokes = [{type:'SOLID', color:{r:0.16,g:0.18,b:0.33}}];
  sheet.strokeWeight = 1; sheet.cornerRadius = 16;

  // Simple prototype links
  frames['Home'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Record'].id}}];
  frames['Record'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Insight'].id}}];
  frames['Insight'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Integrate'].id}}];
  // Wheel modal from Insight
  frames['Insight'].reactions.push({trigger:{type:'ON_CLICK'}, action:{type:'OPEN_OVERLAY', overlayRelativePosition:{x:0,y:544}, overlayPositionType:'RELATIVE_TO_TOP_LEFT', overlayBackground:{type:'SOLID', color:{r:0,g:0,b:0}, opacity:0.4}, destinationId: sheet.id, overlayDismiss:true}});
  // Sanctuary overlay from Home
  frames['Home'].reactions.push({trigger:{type:'ON_CLICK'}, action:{type:'OPEN_OVERLAY', overlayBackground:{type:'SOLID', color:{r:0,g:0,b:0}, opacity:0}, destinationId: overlay.id, overlayDismiss:true}});

  frames['Home'].expand();
  figma.notify('ArcheDream high‑fi frames and overlays created');
  figma.closePlugin();
}

run();