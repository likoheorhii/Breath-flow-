figma.closePlugin = () => {};

async function createFrame(name, x, y, svgBytes){
  const frame = figma.createFrame();
  frame.resizeWithoutConstraints(390, 844);
  frame.name = name;
  frame.x = x; frame.y = y;
  frame.fills = [{type:'SOLID', color:{r:0.04,g:0.06,b:0.17}}];
  if(svgBytes){
    const node = figma.createNodeFromSvg(String.fromCharCode.apply(null, svgBytes));
    node.x = 0; node.y = 0;
    frame.appendChild(node);
  }
  return frame;
}

async function loadSvg(path){
  try{ const res = await fetch(path); const text = await res.text(); return new TextEncoder().encode(text); }catch(e){ return null; }
}

async function run(){
  const base = 'ux/export/svg/';
  const files = {
    Home: base+'home.svg', Record: base+'record.svg', Insight: base+'insight.svg', Wheel: base+'wheel.svg', Integrate: base+'integrate.svg', Onboarding: base+'onboarding.svg', Circles: base+'circles.svg', Profile: base+'profile.svg', Subscription: base+'subscription.svg'
  };
  let i=0; const frames = {};
  for(const [name, path] of Object.entries(files)){
    const svg = await loadSvg(path);
    frames[name] = await createFrame(name, (i%3)*420, Math.floor(i/3)*880, svg);
    i++;
  }
  // prototype links (simple)
  frames['Home'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Record'].id}}];
  frames['Record'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Insight'].id}}];
  frames['Insight'].reactions = [{trigger:{type:'ON_CLICK'}, action:{type:'LINK', destinationId: frames['Integrate'].id}}];
  frames['Home'].expand();
  figma.notify('ArcheDream wireframes inserted. Link Home→Record→Insight→Integrate');
  figma.closePlugin();
}

run();