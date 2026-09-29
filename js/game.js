(() => {
  'use strict';
  const DATA = window.GUILD_DATA;
  const SAVE_KEY = 'guildLegacy_v02_save';
  let nextId = 1;

  const freshState = () => ({
    gold:1000, day:1, year:1, rep:0, missionsDone:0,
    roster:[], selected:[], applicants:[], relations:{},
    chronicle:['Día 1 · Se funda el Gremio del Grifo de Plata.']
  });

  let state = loadState() || freshState();
  nextId = Math.max(1, ...state.roster.map(x=>x.id+1), ...state.applicants.map(x=>x.id+1));

  const $ = id => document.getElementById(id);
  const rand = arr => arr[Math.floor(Math.random()*arr.length)];
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const oneIn = n => Math.random() < 1/n;
  const threshold = level => 80 + level*40;
  const member = id => state.roster.find(x=>x.id===id);
  const pairKey = (a,b) => [a,b].sort((x,y)=>x-y).join('-');

  function saveState(showNotice=true){
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if(showNotice) notice('Partida guardada en este navegador.');
    }catch(err){
      if(showNotice) notice('No fue posible guardar automáticamente en este navegador.');
    }
  }

  function loadState(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      return raw?JSON.parse(raw):null;
    }catch(err){return null;}
  }

  function relation(a,b){
    const k=pairKey(a,b);
    if(!state.relations[k]) state.relations[k]={bond:0,tension:0,attraction:0,status:'Conocidos'};
    return state.relations[k];
  }

  function relationStatus(r){
    if(r.tension>=45) return 'Rivales';
    if(r.attraction>=55 && r.bond>=45) return 'Atracción mutua';
    if(r.bond>=70) return 'Amigos íntimos';
    if(r.bond>=40) return 'Amigos';
    if(r.bond>=15) return 'Compañeros';
    return 'Conocidos';
  }

  function changeRelation(a,b,bond=0,tension=0,attraction=0){
    const r=relation(a,b);
    r.bond=clamp(r.bond+bond,-50,100);
    r.tension=clamp(r.tension+tension,0,100);
    r.attraction=clamp(r.attraction+attraction,0,100);
    r.status=relationStatus(r);
    return r;
  }

  function traitScore(hero,type){
    return hero.traits.reduce((sum,t)=>sum+(DATA.traits[t][type]||0),0);
  }

  function makeApplicant(){
    const classes=Object.keys(DATA.classes);
    const traits=Object.keys(DATA.traits);
    const cls=rand(classes);
    const t1=rand(traits);
    let t2=rand(traits);
    while(t2===t1) t2=rand(traits);
    return {id:nextId++,name:rand(DATA.names),cls,traits:[t1,t2],age:18+Math.floor(Math.random()*18),cost:120+Math.floor(Math.random()*81)};
  }

  function refillApplicants(){
    while(state.applicants.length<6) state.applicants.push(makeApplicant());
  }

  function notice(text){ $('notice').textContent=text; }

  function recruit(id){
    const a=state.applicants.find(x=>x.id===id);
    if(!a) return;
    if(state.roster.filter(x=>x.alive!==false).length>=10){notice('El gremio admite un máximo de 10 miembros en esta versión.');return;}
    if(state.gold<a.cost){notice('No tienes suficiente oro.');return;}
    state.gold-=a.cost;
    state.roster.push({...a,level:1,xp:0,injury:0,expeditions:0,alive:true});
    state.applicants=state.applicants.filter(x=>x.id!==id);
    refillApplicants();
    state.chronicle.unshift(`Día ${state.day} · ${a.name}, ${a.cls}, se une al gremio.`);
    saveState(false); renderAll(); notice(`${a.name} se ha unido al gremio.`);
  }

  function toggleParty(id,on){
    if(on){
      if(state.selected.length>=4){notice('La party admite un máximo de 4 aventureros.');renderRoster();return;}
      if(!state.selected.includes(id)) state.selected.push(id);
    }else state.selected=state.selected.filter(x=>x!==id);
    saveState(false); renderRoster();
  }

  function partySynergy(party){
    let bonus=0; const notes=[]; const classes=party.map(x=>x.cls);
    if((classes.includes('Guerrero')||classes.includes('Paladin'))&&classes.includes('Sacerdotisa')){bonus+=9;notes.push('protección + curación');}
    if(classes.includes('Picaro')){bonus+=4;notes.push('detección de trampas');}
    if(classes.includes('Arquera')){bonus+=3;notes.push('exploración');}
    if(classes.includes('Maga')){bonus+=4;notes.push('daño mágico');}
    for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){
      const r=relation(party[i].id,party[j].id);
      bonus+=(r.bond-r.tension)*0.04;
    }
    return {bonus,notes};
  }

  function chooseRescuer(party,target){
    const options=party.filter(x=>x.id!==target.id);
    return options.sort((a,b)=>{
      const ra=relation(a.id,target.id), rb=relation(b.id,target.id);
      return (rb.bond+traitScore(b,'social')*6)-(ra.bond+traitScore(a,'social')*6);
    })[0]||rand(options);
  }

  function personalityEvent(party,lines){
    const actor=rand(party);
    const target=rand(party.filter(x=>x.id!==actor.id));
    if(!target) return;
    let bond=0,tension=0,attraction=0,text='';
    const t=actor.traits;

    if(t.includes('Protector')||t.includes('Leal')||t.includes('Compasivo')){
      text=`${actor.name} vio a ${target.name} en peligro y abandonó su posición para protegerle.`; bond=7; attraction=oneIn(4)?3:0;
    }else if(t.includes('Impulsivo')){
      text=`${actor.name} cargó sin esperar al resto. ${target.name} tuvo que intervenir para evitar un desastre.`; bond=1; tension=7;
    }else if(t.includes('Codicioso')){
      text=`${actor.name} encontró una bolsa de monedas y trató de ocultarla. ${target.name} se dio cuenta.`; bond=-3; tension=9;
    }else if(t.includes('Bromista')){
      text=`Durante el campamento, ${actor.name} logró hacer reír a ${target.name} después de un día difícil.`; bond=6; attraction=oneIn(5)?4:0;
    }else if(t.includes('Curioso')){
      text=`${actor.name} insistió en investigar un pasaje oculto. ${target.name} decidió acompañarle.`; bond=4; tension=oneIn(5)?3:0;
    }else if(t.includes('Ambicioso')){
      text=`${actor.name} intentó quedarse con el mérito de una victoria que ${target.name} consideraba compartida.`; tension=6;
    }else{
      text=`${actor.name} y ${target.name} compartieron una larga guardia nocturna y hablaron sobre sus vidas antes del gremio.`; bond=5; attraction=oneIn(6)?4:0;
    }

    const before=relation(actor.id,target.id).status;
    const r=changeRelation(actor.id,target.id,bond,tension,attraction);
    lines.push(`<p class="event"><b>Evento:</b> ${text}</p>`);
    if(before!==r.status) lines.push(`<p>Relación: ${actor.name} ↔ ${target.name} ahora son <b>${r.status}</b>.</p>`);
  }

  function combatEvent(party,success,lines){
    const endangered=rand(party);
    const rescuer=chooseRescuer(party,endangered);
    if(!rescuer) return;
    const drive=traitScore(rescuer,'social')+relation(rescuer.id,endangered.id).bond/15;
    if(drive>=3 || rescuer.cls==='Paladin' || rescuer.cls==='Guerrero'){
      lines.push(`<p>${DATA.classes[rescuer.cls].icon} ${rescuer.name} utilizó <b>${DATA.classes[rescuer.cls].ability}</b> cuando ${endangered.name} quedó en peligro.</p>`);
      changeRelation(rescuer.id,endangered.id,6,0,oneIn(6)?3:0);
      if(!success && Math.random()<0.45) rescuer.injury=clamp(rescuer.injury+1,0,3);
    }else{
      lines.push(`<p>${endangered.name} quedó aislado durante el combate y el grupo tardó en reaccionar.</p>`);
      endangered.injury=clamp(endangered.injury+1,0,3);
    }
  }

  function dispatch(){
    const party=state.selected.map(member).filter(x=>x&&x.alive!==false);
    if(party.length<2){notice('Necesitas al menos 2 aventureros.');return;}
    const mission=DATA.missions.find(x=>x.id===$('missionSelect').value)||DATA.missions[0];
    const syn=partySynergy(party);
    const rawPower=party.reduce((s,h)=>s+DATA.classes[h.cls].power+h.level*3-h.injury*5+traitScore(h,'risk'),0)+syn.bonus;
    const target=mission.difficulty*25+party.length*8;
    const chance=clamp(0.46+(rawPower-target)/100,0.15,0.93);
    const success=Math.random()<chance;
    const lines=[];

    lines.push(`<p><b>${mission.name}</b></p>`);
    lines.push(`<p class="muted">${party.map(x=>x.name).join(', ')} parten durante ${mission.days} días.</p>`);
    lines.push(`<p>Probabilidad estimada de éxito: <b>${Math.round(chance*100)}%</b>${syn.notes.length?' · Ventajas: '+syn.notes.join(', '):''}</p>`);

    personalityEvent(party,lines);
    if(party.length>=3 && oneIn(2)) personalityEvent(party,lines);
    combatEvent(party,success,lines);

    let gain;
    if(success){
      gain=Math.round(mission.reward*(0.85+Math.random()*0.35)); state.gold+=gain; state.rep+=4+mission.difficulty*2;
      lines.push(`<p class="good"><b>✓ La misión tiene éxito · +${gain} oro</b></p>`);
    }else{
      gain=Math.round(mission.reward*(0.10+Math.random()*0.15)); state.gold+=gain; state.rep=Math.max(0,state.rep-1);
      lines.push(`<p class="bad"><b>✕ La party abandona la misión · recupera ${gain} oro</b></p>`);
    }

    party.forEach(h=>{
      h.expeditions++;
      const xp=success?38+mission.difficulty*23:18+mission.difficulty*10;
      h.xp+=xp;
      let leveled=false;
      while(h.xp>=threshold(h.level)){h.xp-=threshold(h.level);h.level++;leveled=true;}
      const injuryChance=(success?0.08:0.24)+mission.difficulty*0.025+traitScore(h,'risk')*0.012;
      if(Math.random()<injuryChance) h.injury=clamp(h.injury+1,0,3);
      else if(h.injury>0 && success && Math.random()<0.35) h.injury--;
      lines.push(`<p>${DATA.classes[h.cls].icon} <b>${h.name}</b> +${xp} XP${leveled?` · <b>SUBE A NV.${h.level}</b>`:''}${h.injury?' · Herida '+h.injury:''}</p>`);
    });

    for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){
      const social=(traitScore(party[i],'social')+traitScore(party[j],'social'))/2;
      changeRelation(party[i].id,party[j].id,Math.max(0,2+Math.round(social)),success?0:1,oneIn(14)?2:0);
    }

    if(!success && mission.difficulty>=3){
      const danger=party.filter(x=>x.injury>=3);
      if(danger.length && Math.random()<0.08+mission.difficulty*0.01){
        const lost=rand(danger); lost.alive=false; state.selected=state.selected.filter(id=>id!==lost.id);
        lines.push(`<p class="bad"><b>☠ ${lost.name} no regresó de la expedición.</b></p>`);
        state.chronicle.unshift(`Día ${state.day} · ${lost.name} murió durante ${mission.name}.`);
      }
    }

    state.day+=mission.days;
    while(state.day>90){state.day-=90;state.year++;}
    state.missionsDone++;
    state.chronicle.unshift(`Día ${state.day} · ${party.map(x=>x.name).join(', ')} ${success?'completaron':'regresaron de'} ${mission.name}.`);

    Object.entries(state.relations).forEach(([k,r])=>{
      const [a,b]=k.split('-').map(Number); const A=member(a),B=member(b);
      if(!A||!B||A.alive===false||B.alive===false) return;
      if(r.status==='Atracción mutua' && r.attraction>=65 && oneIn(3)){
        r.status='Romance naciente';
        lines.push(`<p class="event"><b>Desarrollo personal:</b> ${A.name} y ${B.name} parecen haber empezado a verse como algo más que compañeros.</p>`);
        state.chronicle.unshift(`Día ${state.day} · Entre ${A.name} y ${B.name} comienza un romance.`);
      }
    });

    $('report').innerHTML=lines.join('');
    $('resultTag').textContent=success?'Victoria':'Retirada';
    saveState(false); renderAll(); notice(success?'La expedición terminó con éxito.':'La party regresó con dificultades.');
  }

  function renderHeader(){
    $('goldStat').textContent=state.gold+' oro';
    $('dayStat').textContent=`Día ${state.day} · Año ${state.year}`;
    $('repStat').textContent=String(state.rep);
    $('missionsStat').textContent=String(state.missionsDone);
  }

  function renderApplicants(){
    $('applicants').innerHTML='';
    state.applicants.forEach(a=>{
      const c=DATA.classes[a.cls];
      const el=document.createElement('div');
      el.className='card';
      el.innerHTML=`<div class="card-head"><div><div class="hero-name">${c.icon} ${a.name}</div><div class="small">${a.cls} · ${c.role}</div><div class="tiny">${a.traits.join(' · ')}</div><div class="tiny">Edad ${a.age}</div></div><button>${a.cost} oro</button></div>`;
      el.querySelector('button').addEventListener('click',()=>recruit(a.id));
      $('applicants').appendChild(el);
    });
  }

  function renderRoster(){
    const box=$('roster'); box.innerHTML='';
    const alive=state.roster.filter(x=>x.alive!==false);
    if(!alive.length){box.innerHTML='<div class="card muted">Todavía no has reclutado a nadie.</div>';}
    alive.forEach(h=>{
      const c=DATA.classes[h.cls];
      const el=document.createElement('div');
      el.className='roster-row';
      const checked=state.selected.includes(h.id)?'checked':'';
      el.innerHTML=`<label><input type="checkbox" ${checked}><span><span class="hero-name">${c.icon} ${h.name} · Nv.${h.level}</span><br><span class="tiny">${h.cls} · ${h.traits.join(' + ')}</span><br><span class="tiny">XP ${h.xp}/${threshold(h.level)} · Expediciones ${h.expeditions}${h.injury?' · Herida '+h.injury:''}</span></span></label>`;
      el.querySelector('input').addEventListener('change',e=>toggleParty(h.id,e.target.checked));
      box.appendChild(el);
    });
    const party=state.selected.map(member).filter(Boolean);
    $('partyInfo').textContent=`Party actual: ${party.length} / 4${party.length?' · '+party.map(x=>x.name).join(', '):''}`;
  }

  function renderMission(){
    const select=$('missionSelect');
    if(!select.options.length){
      DATA.missions.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`${'★'.repeat(m.difficulty)} · ${m.name}`;select.appendChild(o);});
    }
    const m=DATA.missions.find(x=>x.id===select.value)||DATA.missions[0];
    $('missionDetails').innerHTML=`<b>${m.name}</b><br><span class="small">${m.desc}</span><br><br>Duración: ${m.days} días · Recompensa base: ${m.reward} oro`;
  }

  function renderRelations(){
    const rows=[];
    Object.entries(state.relations).forEach(([k,r])=>{
      const [a,b]=k.split('-').map(Number); const A=member(a),B=member(b);
      if(!A||!B) return;
      if(r.bond<5&&r.tension<5&&r.attraction<5) return;
      rows.push({A,B,r});
    });
    rows.sort((x,y)=>Math.max(y.r.bond,y.r.tension,y.r.attraction)-Math.max(x.r.bond,x.r.tension,x.r.attraction));
    $('relations').innerHTML=rows.length?rows.slice(0,12).map(x=>`<div class="relation-row"><div><div class="hero-name">${x.A.name} ↔ ${x.B.name}</div><div class="tiny">${x.r.status}</div></div><div class="relation-values">Bond ${x.r.bond}<br>Tensión ${x.r.tension}${x.r.attraction?`<br>Atracción ${x.r.attraction}`:''}</div></div>`).join(''):'<div class="card muted">Aún no existen relaciones significativas.</div>';
  }

  function renderChronicle(){
    $('chronicle').innerHTML=state.chronicle.slice(0,10).map(x=>`<div class="chronicle-row">${x}</div>`).join('');
  }

  function renderAll(){renderHeader();renderApplicants();renderRoster();renderMission();renderRelations();renderChronicle();}

  $('missionSelect').addEventListener('change',renderMission);
  $('dispatchBtn').addEventListener('click',dispatch);
  $('saveBtn').addEventListener('click',()=>saveState(true));
  $('refreshApplicantsBtn').addEventListener('click',()=>{
    if(state.gold<20){notice('No tienes 20 oro.');return;}
    state.gold-=20;state.day++;state.applicants=[];refillApplicants();
    state.chronicle.unshift(`Día ${state.day} · Llegan nuevos aspirantes.`);
    saveState(false);renderAll();notice('Han llegado nuevos aventureros.');
  });
  $('resetBtn').addEventListener('click',()=>{
    const ok=window.confirm('¿Reiniciar toda la partida y borrar el guardado local?');
    if(!ok) return;
    localStorage.removeItem(SAVE_KEY);state=freshState();nextId=1;refillApplicants();renderAll();notice('Partida reiniciada.');
  });

  refillApplicants();
  renderAll();
  saveState(false);
})();
