import React, { useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors, spacing } from './theme/tokens';
import { fetchInsight, Mood, DepthMode } from './lib/api';
import AudioRecorder from './components/AudioRecorder';
import { addDream } from './lib/storage';

function Tab({label, active, onPress}:{label:string;active:boolean;onPress:()=>void}){
  return (
    <TouchableOpacity onPress={onPress} style={{paddingVertical:8,paddingHorizontal:12,borderRadius:16,marginRight:8,borderWidth:1,borderColor:active?colors.iris:'rgba(255,255,255,0.15)',backgroundColor:active?colors.iris:'transparent'}}>
      <Text style={{color: active?'#fff':colors.text}}>{label}</Text>
    </TouchableOpacity>
  );
}

function Home({go}:{go:(s:string)=>void}){
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:28,marginBottom:spacing.md}}>Сон — не загадка, а карта</Text>
      <View style={{flexDirection:'row',gap:spacing.sm}}>
        <TouchableOpacity onPress={()=>go('record')} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,marginRight:8}}><Text style={{color:'#fff'}}>Записать сон</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>go('insight')} style={{borderColor:'rgba(255,255,255,0.15)',borderWidth:1,padding:10,borderRadius:12}}><Text style={{color:colors.text}}>Посмотреть мандалу</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Record({go,setDraft,setMood,setDepth}:{go:(s:string)=>void;setDraft:(t:string)=>void;setMood:(m:Mood)=>void;setDepth:(d:DepthMode)=>void}){
  const [text,setText] = useState('Иду по тёмному коридору, собака ведёт меня к двери.');
  const [moodLocal,setMoodLocal]=useState<Mood>('тревога');
  const [depthLocal,setDepthLocal]=useState<DepthMode>('standard');
  const [audioUri,setAudioUri]=useState<string|undefined>();
  const save = async ()=>{
    await addDream({ text, mood: moodLocal, audioUri });
  };
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:20,marginBottom:spacing.md}}>Записать сон</Text>
      <Text style={{color:colors.muted, marginBottom:4}}>Аудио‑дневник</Text>
      <AudioRecorder onFinish={(uri)=>setAudioUri(uri)} />
      <Text style={{color:colors.muted, marginBottom:4}}>Глубина</Text>
      <View style={{flexDirection:'row',marginBottom:spacing.md}}>
        {(['light','standard','deep'] as DepthMode[]).map(d=> (
          <TouchableOpacity key={d} onPress={()=>setDepthLocal(d)} style={{marginRight:8, paddingHorizontal:10,paddingVertical:6,borderRadius:12,borderWidth:1,borderColor: depthLocal===d?colors.iris:'rgba(255,255,255,0.15)', backgroundColor: depthLocal===d?colors.iris:'transparent'}}>
            <Text style={{color: depthLocal===d?'#fff':colors.text}}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{color:colors.muted, marginBottom:4}}>Настроение</Text>
      <View style={{flexDirection:'row',marginBottom:spacing.md}}>
        {(['спокойно','интерес','тревога','радость','грусть'] as Mood[]).map(m=> (
          <TouchableOpacity key={m} onPress={()=>setMoodLocal(m)} style={{marginRight:8, paddingHorizontal:10,paddingVertical:6,borderRadius:12,borderWidth:1,borderColor: moodLocal===m?colors.iris:'rgba(255,255,255,0.15)', backgroundColor: moodLocal===m?colors.iris:'transparent'}}>
            <Text style={{color: moodLocal===m?'#fff':colors.text}}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{color:colors.muted, marginBottom:4}}>Сон</Text>
      <TextInput value={text} onChangeText={setText} placeholder='Опишите сон…' placeholderTextColor={colors.muted} multiline style={{minHeight:160,color:colors.text,backgroundColor:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.12)',borderWidth:1,padding:12,borderRadius:12}}/>
      <View style={{flexDirection:'row',marginTop:spacing.md,flexWrap:'wrap'}}>
        <TouchableOpacity onPress={()=>{setDraft(text);setMood(moodLocal);setDepth(depthLocal);go('insight');}} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,marginRight:8,marginBottom:8}}><Text style={{color:'#fff'}}>Получить инсайт</Text></TouchableOpacity>
        <TouchableOpacity onPress={save} style={{borderColor:'rgba(255,255,255,0.15)',borderWidth:1,padding:10,borderRadius:12,marginRight:8,marginBottom:8}}><Text style={{color:colors.text}}>Сохранить в дневник</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function heuristic(text:string){
  const t=text.toLowerCase();
  const symbols: {span:string,label:string}[]=[];
  const dict: Record<string,string> = { 'коридор':'Порог','двер':'Порог','мост':'Переход','вода':'Бессознательное','озер':'Бессознательное','собак':'Проводник','кот':'Анима/Анимус','огонь':'Трансформация','лес':'Тень','пещер':'Тень','остров':'Самость','дом':'Я','поезд':'Путь','машин':'Контроль' };
  Object.keys(dict).forEach(k=>{ if(t.includes(k)) symbols.push({span:k,label:dict[k]}); });
  const archs = ['Невинный','Исследователь','Мудрец','Герой','Бунтарь','Маг','Обыватель','Любовник','Шут','Опекун','Творец','Правитель'];
  const weights = archs.map(()=>0);
  const amap: Record<string,string[]> = { 'Порог':['Исследователь','Герой'],'Бессознательное':['Маг','Мудрец'],'Проводник':['Мудрец','Опекун'],'Тень':['Бунтарь','Герой'],'Самость':['Правитель','Маг'],'Я':['Обыватель','Опекун'],'Путь':['Исследователь','Герой'],'Трансформация':['Творец','Маг'],'Контроль':['Правитель','Обыватель'] };
  symbols.forEach(s=> (amap[s.label]||[]).forEach(a=>{const i=archs.indexOf(a); if(i>=0) weights[i]++;}));
  const top = weights.map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,3).filter(x=>x.w>0).map(x=>archs[x.i]);
  return {symbols, top};
}

function Insight({draft,go,mood,depth}:{draft:string;go:(s:string)=>void;mood:Mood;depth:DepthMode}){
  const [loading,setLoading]=useState(false);
  const [server,setServer]=useState<any>(null);
  const {symbols, top} = heuristic(draft||'');
  const run = async ()=>{
    try{ setLoading(true); const data = await fetchInsight({ text: draft, mood, depth }); setServer(data);}catch(e){ setServer(null);} finally{ setLoading(false); }
  };
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:20,marginBottom:spacing.sm}}>Инсайт</Text>
      <TouchableOpacity onPress={run} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,alignSelf:'flex-start',marginBottom:spacing.md}}>
        <Text style={{color:'#fff'}}>{loading?'Загрузка…':'Получить с сервера'}</Text>
      </TouchableOpacity>
      {server ? (
        <View>
          <Text style={{color:colors.text,marginBottom:spacing.sm}}>Архетипы: {(server.archetypes||[]).map((a:any)=>a.name||a).join(', ')}</Text>
          <Text style={{color:colors.text,marginBottom:spacing.sm}}>Кратко: {server.summary||'—'}</Text>
        </View>
      ) : (
        <View>
          <Text style={{color:colors.text,marginBottom:spacing.sm}}>Архетипы: {top.join(', ')||'—'}</Text>
          <Text style={{color:colors.muted,marginBottom:spacing.sm}}>Почему: {symbols.map(s=>`${s.span}→${s.label}`).join(', ')||'мало образов'}</Text>
        </View>
      )}
      <TouchableOpacity onPress={()=>go('integrate')} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,marginRight:8,alignSelf:'flex-start'}}><Text style={{color:'#fff'}}>Практика 10 мин</Text></TouchableOpacity>
    </ScrollView>
  );
}

function Integrate(){
  const [done,setDone]=useState(false);
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:20,marginBottom:spacing.sm}}>Кабинет интеграции</Text>
      <TouchableOpacity onPress={()=>setDone(!done)} style={{backgroundColor: done?colors.iris:'rgba(110,90,240,0.06)', padding:12, borderRadius:16}}>
        <Text style={{color: colors.text}}>{done?'Готово ✓':'Свет в коридоре — 10 мин'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function App(){
  const [tab,setTab] = useState<'home'|'record'|'insight'|'integrate'>('home');
  const [draft,setDraft] = useState('');
  const [mood,setMood] = useState<Mood>('тревога');
  const [depth,setDepth] = useState<DepthMode>('standard');
  const go = (t:string)=>setTab(t as any);
  return (
    <View style={{flex:1,backgroundColor:colors.indigo}}>
      <View style={{flexDirection:'row',padding:spacing.md}}>
        <Tab label='Домой' active={tab==='home'} onPress={()=>setTab('home')}/>
        <Tab label='Запись' active={tab==='record'} onPress={()=>setTab('record')}/>
        <Tab label='Инсайт' active={tab==='insight'} onPress={()=>setTab('insight')}/>
        <Tab label='Интеграция' active={tab==='integrate'} onPress={()=>setTab('integrate')}/>
      </View>
      {tab==='home' && <Home go={go}/>} 
      {tab==='record' && <Record go={go} setDraft={setDraft} setMood={setMood} setDepth={setDepth}/>} 
      {tab==='insight' && <Insight draft={draft} go={go} mood={mood} depth={depth}/>} 
      {tab==='integrate' && <Integrate/>}
    </View>
  );
}