import React, { useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors, spacing, radii } from './theme/tokens';

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

function Record({go,setDraft}:{go:(s:string)=>void;setDraft:(t:string)=>void}){
  const [text,setText] = useState('Иду по тёмному коридору, собака ведёт меня к двери.');
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:20,marginBottom:spacing.md}}>Записать сон</Text>
      <Text style={{color:colors.muted, marginBottom:4}}>Сон</Text>
      <TextInput value={text} onChangeText={setText} placeholder='Опишите сон…' placeholderTextColor={colors.muted} multiline style={{minHeight:160,color:colors.text,backgroundColor:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.12)',borderWidth:1,padding:12,borderRadius:12}}/>
      <View style={{flexDirection:'row',marginTop:spacing.md}}>
        <TouchableOpacity onPress={()=>{setDraft(text);go('insight');}} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,marginRight:8}}><Text style={{color:'#fff'}}>Получить инсайт</Text></TouchableOpacity>
        <TouchableOpacity style={{borderColor:'rgba(255,255,255,0.15)',borderWidth:1,padding:10,borderRadius:12}}><Text style={{color:colors.text}}>Ритуал инкубации</Text></TouchableOpacity>
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

function Insight({draft,go}:{draft:string;go:(s:string)=>void}){
  const {symbols, top} = heuristic(draft||'');
  return (
    <ScrollView style={{flex:1,backgroundColor:colors.indigo,padding:spacing.lg}}>
      <Text style={{color:colors.text,fontSize:20,marginBottom:spacing.sm}}>Инсайт</Text>
      <Text style={{color:colors.text,marginBottom:spacing.sm}}>Архетипы: {top.join(', ')||'—'}</Text>
      <Text style={{color:colors.muted,marginBottom:spacing.sm}}>Почему: {symbols.map(s=>`${s.span}→${s.label}`).join(', ')||'мало образов'}</Text>
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
      {tab==='record' && <Record go={go} setDraft={setDraft}/>} 
      {tab==='insight' && <Insight draft={draft} go={go}/>} 
      {tab==='integrate' && <Integrate/>}
    </View>
  );
}