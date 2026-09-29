(() => {
  'use strict';

  const DATA = window.GUILD_DATA;
  const SAVE_KEY = 'guildLegacy_v02_save';
  let nextId = 1;
  let currentScreen = 'guild';
  let currentDetailId = null;
  let expeditionView = null;

  const freshState = () => ({
    gold:1000, day:1, year:1, rep:0, missionsDone:0,
    roster:[], selected:[], applicants:[], relations:{},
    chronicle:['Día 1 · Se funda el Gremio del Grifo de Plata.']
  });

  let state = loadState() || freshState();
  state.roster = Array.isArray(state.roster) ? state.roster : [];
  state.selected = Array.isArray(state.selected) ? state.selected : [];
  state.applicants = Array.isArray(state.applicants) ? state.applicants : [];
  state.relations = state.relations || {};
  state.chronicle = Array.isArray(state.chronicle) ? state.chronicle : [];
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

  function notice(text){
    const el=$('notice');
    if(el) el.textContent=text;
  }

  function navigate(screen){
    if(screen==='detail' && !currentDetailId){
      screen='adventurers';
    }
    currentScreen=screen;
    document.querySelectorAll('[data-screen-panel]').forEach(panel=>{
      panel.classList.toggle('active',panel.dataset.screenPanel===screen);
    });
    document.querySelectorAll('button[data-screen]').forEach(btn=>{
      const active=btn.dataset.screen===screen || (screen==='detail' && btn.dataset.screen==='adventurers');
      btn.classList.toggle('active',active);
    });
    if(screen==='detail') renderDetail();
    if(screen==='party') renderPartySummary();
    if(screen==='mission') renderMission();
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
    return hero.traits.reduce((sum,t)=>sum+(DATA.traits[t]?.[type]||0),0);
  }

  function makeApplicant(){
    const classes=Object.keys(DATA.classes);
    const traits=Object.keys(DATA.traits);
    const cls=rand(classes);
    const t1=rand(traits);
    let t2=rand(traits);
    while(t2===t1) t2=rand(traits);
    return {
      id:nextId++,
      name:rand(DATA.names),
      cls,
      traits:[t1,t2],
      age:18+Math.floor(Math.random()*18),
      cost:120+Math.floor(Math.random()*81)
    };
  }

  function refillApplicants(){
    while(state.applicants.length<6) state.applicants.push(makeApplicant());
  }

  function recruit(id){
    const a=state.applicants.find(x=>x.id===id);
    if(!a) return;
    if(state.roster.filter(x=>x.alive!==false).length>=10){
      notice('El gremio admite un máximo de 10 miembros en esta versión.');
      return;
    }
    if(state.gold<a.cost){
      notice('No tienes suficiente oro.');
      return;
    }
    state.gold-=a.cost;
    state.roster.push({...a,level:1,xp:0,injury:0,expeditions:0,alive:true});
    state.applicants=state.applicants.filter(x=>x.id!==id);
    refillApplicants();
    state.chronicle.unshift(`Día ${state.day} · ${a.name}, ${a.cls}, se une al gremio.`);
    saveState(false);
    renderAll();
    notice(`${a.name} se ha unido al gremio.`);
  }

  function toggleParty(id,on){
    if(on){
      if(state.selected.length>=4){
        notice('La party admite un máximo de 4 aventureros.');
        renderRoster();
        return false;
      }
      if(!state.selected.includes(id)) state.selected.push(id);
    }else{
      state.selected=state.selected.filter(x=>x!==id);
    }
    saveState(false);
    renderRoster();
    renderPartySummary();
    renderMissionParty();
    renderHeader();
    if(currentScreen==='detail') renderDetail();
    return true;
  }

  function partySynergy(party){
    let bonus=0;
    const notes=[];
    const classes=party.map(x=>x.cls);

    if((classes.includes('Guerrero')||classes.includes('Paladin'))&&classes.includes('Sacerdotisa')){
      bonus+=9; notes.push('Protección + curación');
    }
    if(classes.includes('Picaro')){bonus+=4;notes.push('Detección de trampas');}
    if(classes.includes('Arquera')){bonus+=3;notes.push('Exploración');}
    if(classes.includes('Maga')){bonus+=4;notes.push('Daño mágico');}

    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const r=relation(party[i].id,party[j].id);
        bonus+=(r.bond-r.tension)*0.04;
      }
    }
    return {bonus,notes};
  }

  function chooseRescuer(party,target){
    const options=party.filter(x=>x.id!==target.id);
    return options.sort((a,b)=>{
      const ra=relation(a.id,target.id);
      const rb=relation(b.id,target.id);
      return (rb.bond+traitScore(b,'social')*6)-(ra.bond+traitScore(a,'social')*6);
    })[0]||rand(options);
  }

  function addStageEffect(stage,text,kind=''){
    if(!stage) return;
    stage.effects.push({text,kind});
  }

  function personalityEvent(party,lines,stage){
    const actor=rand(party);
    const target=rand(party.filter(x=>x.id!==actor.id));
    if(!target) return;

    let bond=0,tension=0,attraction=0,text='';
    const t=actor.traits;

    if(t.includes('Protector')||t.includes('Leal')||t.includes('Compasivo')){
      text=\`\${actor.name} vio a \${target.name} en peligro y abandonó su posición para protegerle.\`;
      bond=7; attraction=oneIn(4)?3:0;
    }else if(t.includes('Impulsivo')){
      text=\`\${actor.name} cargó sin esperar al resto. \${target.name} tuvo que intervenir para evitar un desastre.\`;
      bond=1; tension=7;
    }else if(t.includes('Codicioso')){
      text=\`\${actor.name} encontró una bolsa de monedas y trató de ocultarla. \${target.name} se dio cuenta.\`;
      bond=-3; tension=9;
    }else if(t.includes('Bromista')){
      text=\`Durante el campamento, \${actor.name} logró hacer reír a \${target.name} después de un día difícil.\`;
      bond=6; attraction=oneIn(5)?4:0;
    }else if(t.includes('Curioso')){
      text=\`\${actor.name} insistió en investigar un pasaje oculto. \${target.name} decidió acompañarle.\`;
      bond=4; tension=oneIn(5)?3:0;
    }else if(t.includes('Ambicioso')){
      text=\`\${actor.name} intentó quedarse con el mérito de una victoria que \${target.name} consideraba compartida.\`;
      tension=6;
    }else{
      text=\`\${actor.name} y \${target.name} compartieron una larga guardia y hablaron sobre sus vidas antes del gremio.\`;
      bond=5; attraction=oneIn(6)?4:0;
    }

    const before=relation(actor.id,target.id).status;
    const r=changeRelation(actor.id,target.id,bond,tension,attraction);
    lines.push(\`<p class="event"><b>Evento:</b> \${text}</p>\`);

    if(stage && !stage.text) stage.text=text;
    if(bond) addStageEffect(stage,\`\${actor.name} ↔ \${target.name} · Bond \${bond>0?'+':''}\${bond}\`,'bond');
    if(tension) addStageEffect(stage,\`\${actor.name} ↔ \${target.name} · Tensión +\${tension}\`,'bad');
    if(attraction) addStageEffect(stage,\`\${actor.name} ↔ \${target.name} · Afinidad +\${attraction}\`,'bond');

    if(before!==r.status){
      lines.push(\`<p>Relación: \${actor.name} ↔ \${target.name} ahora son <b>\${r.status}</b>.</p>\`);
      addStageEffect(stage,\`Nueva relación: \${r.status}\`,'good');
    }
  }

  function combatEvent(party,success,lines,stage){
    const endangered=rand(party);
    const rescuer=chooseRescuer(party,endangered);
    if(!rescuer) return;

    const drive=traitScore(rescuer,'social')+relation(rescuer.id,endangered.id).bond/15;
    if(drive>=3 || rescuer.cls==='Paladin' || rescuer.cls==='Guerrero'){
      const text=\`\${rescuer.name} utilizó \${DATA.classes[rescuer.cls].ability} cuando \${endangered.name} quedó en peligro.\`;
      lines.push(\`<p>\${DATA.classes[rescuer.cls].icon} \${rescuer.name} utilizó <b>\${DATA.classes[rescuer.cls].ability}</b> cuando \${endangered.name} quedó en peligro.</p>\`);
      changeRelation(rescuer.id,endangered.id,6,0,oneIn(6)?3:0);
      if(stage) stage.text=text;
      addStageEffect(stage,\`\${rescuer.name} ↔ \${endangered.name} · Bond +6\`,'bond');
      if(!success && Math.random()<0.45){
        rescuer.injury=clamp(rescuer.injury+1,0,3);
        addStageEffect(stage,\`\${rescuer.name} resulta herido\`,'bad');
      }
    }else{
      const text=\`\${endangered.name} quedó aislado durante el combate y el grupo tardó en reaccionar.\`;
      lines.push(\`<p>\${text}</p>\`);
      endangered.injury=clamp(endangered.injury+1,0,3);
      if(stage) stage.text=text;
      addStageEffect(stage,\`\${endangered.name} resulta herido\`,'bad');
    }
  }

  function setExpeditionControls(running){
    $('dispatchBtn').disabled=running;
    $('missionSelect').disabled=running;
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn=>btn.disabled=running);
  }

  function partyTokens(party){
    return party.map(h=>\`<div class="party-token"><span class="token-icon">\${DATA.classes[h.cls].icon}</span>\${h.name}</div>\`).join('');
  }

  function renderExpeditionStage(){
    if(!expeditionView) return;
    const stage=expeditionView.stages[expeditionView.index];

    $('expeditionTheater').classList.add('running');
    $('expeditionTheater').classList.remove('complete');
    $('expeditionTitle').textContent=expeditionView.mission.name;
    $('expeditionPartyVisual').innerHTML=partyTokens(expeditionView.party);

    document.querySelectorAll('.exp-step').forEach((el,i)=>{
      el.classList.toggle('done',i<expeditionView.index);
      el.classList.toggle('active',i===expeditionView.index);
    });

    $('expeditionStageIcon').textContent=stage.icon;
    $('expeditionStageLabel').textContent=stage.label;
    $('expeditionStageTitle').textContent=stage.title;
    $('expeditionStageText').textContent=stage.text;
    $('expeditionStageEffects').innerHTML=stage.effects.map(e=>\`<span class="effect-chip \${e.kind||''}">\${e.text}</span>\`).join('');

    $('expeditionSummary').classList.add('is-hidden');
    $('expeditionContinueBtn').classList.remove('is-hidden');
    $('toggleReportBtn').classList.add('is-hidden');
    $('report').classList.add('is-hidden');
    $('reportActions').classList.add('is-hidden');
    $('expeditionContinueBtn').textContent=expeditionView.index===expeditionView.stages.length-1?'Ver resumen →':'Continuar →';
  }

  function finishExpeditionPresentation(){
    if(!expeditionView) return;

    document.querySelectorAll('.exp-step').forEach(el=>{
      el.classList.remove('active');
      el.classList.add('done');
    });

    $('expeditionTheater').classList.remove('running');
    $('expeditionTheater').classList.add('complete');
    $('expeditionStageIcon').textContent=expeditionView.success?'🏆':'🏠';
    $('expeditionStageLabel').textContent='EXPEDICIÓN COMPLETA';
    $('expeditionStageTitle').textContent=expeditionView.success?'La party regresa victoriosa':'La party consigue regresar';
    $('expeditionStageText').textContent=expeditionView.success
      ? 'La misión ha terminado. Revisa cómo cambió cada aventurero.'
      : 'No lograron el objetivo, pero la historia del grupo continúa.';
    $('expeditionStageEffects').innerHTML='';

    $('expeditionSummary').innerHTML=expeditionView.summary.map(item=>\`
      <div class="summary-card \${item.kind||''}">
        <strong>\${item.title}</strong>
        \${item.text}
      </div>
    \`).join('');
    $('expeditionSummary').classList.remove('is-hidden');

    $('expeditionContinueBtn').classList.add('is-hidden');
    $('toggleReportBtn').classList.remove('is-hidden');
    $('reportActions').classList.remove('is-hidden');
    setExpeditionControls(false);
  }

  function advanceExpedition(){
    if(!expeditionView) return;
    if(expeditionView.index<expeditionView.stages.length-1){
      expeditionView.index++;
      renderExpeditionStage();
    }else{
      finishExpeditionPresentation();
    }
  }

  function dispatch(){
    const party=state.selected.map(member).filter(x=>x&&x.alive!==false);
    if(party.length<2){
      notice('Necesitas al menos 2 aventureros.');
      return;
    }

    const mission=DATA.missions.find(x=>x.id===$('missionSelect').value)||DATA.missions[0];
    const syn=partySynergy(party);
    const rawPower=party.reduce((sum,h)=>sum+DATA.classes[h.cls].power+h.level*3-h.injury*5+traitScore(h,'risk'),0)+syn.bonus;
    const target=mission.difficulty*25+party.length*8;
    const chance=clamp(0.46+(rawPower-target)/100,0.15,0.93);
    const success=Math.random()<chance;
    const lines=[];
    const heroResults=[];

    const stages=[
      {
        icon:'🗺️',label:'ETAPA 1 · VIAJE',title:\`Rumbo a \${mission.name}\`,
        text:\`\${party.map(x=>x.name).join(', ')} dejan atrás el gremio y comienzan un viaje de \${mission.days} días.\`,
        effects:[{text:\`Éxito estimado: \${Math.round(chance*100)}%\`,kind:''}]
      },
      {
        icon:'🔎',label:'ETAPA 2 · EXPLORACIÓN',title:'El grupo se interna en la zona',
        text:'El camino obliga a la party a tomar decisiones y depender unos de otros.',
        effects:[]
      },
      {
        icon:'⚔️',label:'ETAPA 3 · ENCUENTRO',title:'Algo bloquea el camino',
        text:'La party debe resolver el momento más peligroso de la expedición.',
        effects:[]
      },
      {
        icon:'🔥',label:'ETAPA 4 · CAMPAMENTO',title:'Tiempo para contar las heridas',
        text:'Después del peligro, el grupo descansa y evalúa lo aprendido.',
        effects:[]
      },
      {
        icon:'🏰',label:'ETAPA 5 · REGRESO',title:'De vuelta al Grifo de Plata',
        text:'El gremio espera noticias de la expedición.',
        effects:[]
      }
    ];

    if(syn.notes.length){
      syn.notes.forEach(note=>addStageEffect(stages[0],note,'good'));
    }

    lines.push(\`<p><b>\${mission.name}</b></p>\`);
    lines.push(\`<p class="muted">\${party.map(x=>x.name).join(', ')} parten durante \${mission.days} días.</p>\`);
    lines.push(\`<p>Probabilidad estimada de éxito: <b>\${Math.round(chance*100)}%</b>\${syn.notes.length?' · Ventajas: '+syn.notes.join(', '):''}</p>\`);

    personalityEvent(party,lines,stages[1]);
    if(party.length>=3 && oneIn(2)) personalityEvent(party,lines,stages[1]);

    combatEvent(party,success,lines,stages[2]);
    if(success){
      stages[2].title='La party supera el encuentro';
      addStageEffect(stages[2],'Objetivo asegurado','good');
    }else{
      stages[2].title='La situación obliga a retirarse';
      addStageEffect(stages[2],'Retirada organizada','bad');
    }

    let gain;
    if(success){
      gain=Math.round(mission.reward*(0.85+Math.random()*0.35));
      state.gold+=gain;
      state.rep+=4+mission.difficulty*2;
      lines.push(\`<p class="good"><b>✓ La misión tiene éxito · +\${gain} oro</b></p>\`);
    }else{
      gain=Math.round(mission.reward*(0.10+Math.random()*0.15));
      state.gold+=gain;
      state.rep=Math.max(0,state.rep-1);
      lines.push(\`<p class="bad"><b>✕ La party abandona la misión · recupera \${gain} oro</b></p>\`);
    }

    party.forEach(h=>{
      const beforeLevel=h.level;
      const beforeInjury=h.injury;
      h.expeditions++;
      const xp=success?38+mission.difficulty*23:18+mission.difficulty*10;
      h.xp+=xp;
      while(h.xp>=threshold(h.level)){
        h.xp-=threshold(h.level);
        h.level++;
      }

      const injuryChance=(success?0.08:0.24)+mission.difficulty*0.025+traitScore(h,'risk')*0.012;
      if(Math.random()<injuryChance) h.injury=clamp(h.injury+1,0,3);
      else if(h.injury>0 && success && Math.random()<0.35) h.injury--;

      const leveled=h.level>beforeLevel;
      const injuryDelta=h.injury-beforeInjury;

      lines.push(\`<p>\${DATA.classes[h.cls].icon} <b>\${h.name}</b> +\${xp} XP\${leveled?\` · <b>SUBE A NV.\${h.level}</b>\`:''}\${h.injury?' · Herida '+h.injury:''}</p>\`);

      addStageEffect(stages[3],\`\${h.name} · +\${xp} XP\`,leveled?'good':'');
      if(leveled) addStageEffect(stages[3],\`\${h.name} alcanza Nv.\${h.level}\`,'good');
      if(injuryDelta>0) addStageEffect(stages[3],\`\${h.name} · Herida \${h.injury}\`,'bad');
      if(injuryDelta<0) addStageEffect(stages[3],\`\${h.name} se recupera parcialmente\`,'good');

      heroResults.push({
        title:\`\${DATA.classes[h.cls].icon} \${h.name}\`,
        text:\`+\${xp} XP · Nv.\${h.level}\${h.injury?' · Herida '+h.injury:' · Sano'}\`,
        kind:h.injury?'':'good'
      });
    });

    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const social=(traitScore(party[i],'social')+traitScore(party[j],'social'))/2;
        const passiveBond=Math.max(0,2+Math.round(social));
        changeRelation(party[i].id,party[j].id,passiveBond,success?0:1,oneIn(14)?2:0);
      }
    }

    let lost=null;
    if(!success && mission.difficulty>=3){
      const danger=party.filter(x=>x.injury>=3);
      if(danger.length && Math.random()<0.08+mission.difficulty*0.01){
        lost=rand(danger);
        lost.alive=false;
        state.selected=state.selected.filter(id=>id!==lost.id);
        lines.push(\`<p class="bad"><b>☠ \${lost.name} no regresó de la expedición.</b></p>\`);
        state.chronicle.unshift(\`Día \${state.day} · \${lost.name} murió durante \${mission.name}.\`);
        addStageEffect(stages[4],\`\${lost.name} no regresó\`,'bad');
      }
    }

    state.day+=mission.days;
    while(state.day>90){
      state.day-=90;
      state.year++;
    }
    state.missionsDone++;
    state.chronicle.unshift(\`Día \${state.day} · \${party.map(x=>x.name).join(', ')} \${success?'completaron':'regresaron de'} \${mission.name}.\`);

    Object.entries(state.relations).forEach(([k,r])=>{
      const [a,b]=k.split('-').map(Number);
      const A=member(a),B=member(b);
      if(!A||!B||A.alive===false||B.alive===false) return;
      if(r.status==='Atracción mutua' && r.attraction>=65 && oneIn(3)){
        r.status='Romance naciente';
        lines.push(\`<p class="event"><b>Desarrollo personal:</b> \${A.name} y \${B.name} parecen haber empezado a verse como algo más que compañeros.</p>\`);
        state.chronicle.unshift(\`Día \${state.day} · Entre \${A.name} y \${B.name} comienza un romance.\`);
        addStageEffect(stages[4],\`\${A.name} y \${B.name}: romance naciente\`,'bond');
      }
    });

    stages[4].text=success
      ? \`La party vuelve con noticias de victoria y \${gain} monedas de oro para el gremio.\`
      : \`La party vuelve antes de lo previsto. Recuperaron \${gain} monedas de oro y tendrán tiempo para recuperarse.\`;
    addStageEffect(stages[4],\`+\${gain} oro\`,'good');
    addStageEffect(stages[4],\`Reputación: \${state.rep}\`,success?'good':'');

    const summary=[
      {
        title:success?'✓ Victoria':'↩ Retirada',
        text:\`\${mission.name} · \${mission.days} días\`,
        kind:success?'good':'bad'
      },
      {
        title:'Tesorería',
        text:\`+\${gain} oro · Total \${state.gold}\`,
        kind:'good'
      },
      ...heroResults
    ];
    if(lost){
      summary.push({title:\`☠ \${lost.name}\`,text:'No regresó de la expedición.',kind:'bad'});
    }

    $('report').innerHTML=lines.join('');
    $('resultTag').textContent=success?'Victoria':'Retirada';

    expeditionView={
      mission,
      party:party.filter(x=>x.alive!==false),
      stages,
      summary,
      success,
      index:0
    };

    saveState(false);
    renderAll();
    navigate('mission');
    setExpeditionControls(true);
    renderExpeditionStage();
    notice('La expedición ha comenzado. Avanza etapa por etapa.');
  }

  function renderHeader(){
    $('goldStat').textContent=String(state.gold);
    $('dayStat').textContent=String(state.day);
    $('yearStat').textContent=String(state.year);
    $('repStat').textContent=String(state.rep);
    $('missionsStat').textContent=String(state.missionsDone);
    $('partyNavCount').textContent=`${state.selected.length}/4`;

    const alive=state.roster.filter(x=>x.alive!==false);
    const injured=alive.filter(x=>x.injury>0);
    $('guildMembers').textContent=String(alive.length);
    $('guildAvailable').textContent=String(alive.filter(x=>x.injury<3).length);
    $('guildInjured').textContent=String(injured.length);
    $('latestEvent').textContent=state.chronicle[0]||'Sin acontecimientos todavía.';

    $('overviewTotal').textContent=String(alive.length);
    $('overviewHealthy').textContent=String(alive.filter(x=>x.injury===0).length);
    $('overviewInjured').textContent=String(injured.length);
    $('overviewParty').textContent=String(state.selected.length);
    $('rosterCount').textContent=`${alive.length} miembro${alive.length===1?'':'s'}`;
    $('chronicleCount').textContent=`${state.chronicle.length} evento${state.chronicle.length===1?'':'s'}`;
  }

  function renderApplicants(){
    const box=$('applicants');
    box.innerHTML='';
    state.applicants.forEach(a=>{
      const c=DATA.classes[a.cls];
      const el=document.createElement('div');
      el.className='applicant-card';
      el.innerHTML=`
        <div class="hero-name">${c.icon} ${a.name}</div>
        <div class="small">${a.cls} · ${c.role}</div>
        <div class="tiny">${a.traits.join(' · ')}</div>
        <div class="tiny">Edad ${a.age}</div>
        <button type="button">${a.cost} oro · Reclutar</button>
      `;
      el.querySelector('button').addEventListener('click',()=>recruit(a.id));
      box.appendChild(el);
    });
  }

  function renderAdventurers(){
    const box=$('adventurerList');
    box.innerHTML='';
    const alive=state.roster.filter(x=>x.alive!==false);

    if(!alive.length){
      box.innerHTML='<div class="applicant-card"><div class="small">Todavía no has reclutado a nadie.</div></div>';
      return;
    }

    alive.forEach(h=>{
      const c=DATA.classes[h.cls];
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='adventurer-row';
      btn.innerHTML=`
        <span class="class-icon">${c.icon}</span>
        <span>
          <span class="hero-name">${h.name} · Nv.${h.level}</span><br>
          <span class="tiny">${h.cls} · ${h.traits.join(' + ')}${h.injury?' · Herida '+h.injury:''}</span>
        </span>
        <span class="chevron">›</span>
      `;
      btn.addEventListener('click',()=>{
        currentDetailId=h.id;
        renderDetail();
        navigate('detail');
      });
      box.appendChild(btn);
    });
  }

  function renderDetail(){
    const h=member(currentDetailId);
    if(!h || h.alive===false){
      currentDetailId=null;
      navigate('adventurers');
      return;
    }

    const c=DATA.classes[h.cls];
    $('detailPortrait').textContent=c.icon;
    $('detailName').textContent=h.name;
    $('detailMeta').textContent=`${h.cls} · Nv.${h.level} · ${h.age} años`;

    $('detailTraits').innerHTML=h.traits.map(t=>{
      const info=DATA.traits[t];
      return `<span class="detail-pill"><b>${t}</b><br><span class="tiny">${info?.desc||''}</span></span>`;
    }).join('');

    $('detailState').innerHTML=`
      <span class="detail-pill"><b>XP</b> ${h.xp}/${threshold(h.level)}</span>
      <span class="detail-pill"><b>Expediciones</b> ${h.expeditions}</span>
      <span class="detail-pill"><b>Salud</b> ${h.injury?'Herida '+h.injury:'Sano'}</span>
      <span class="detail-pill"><b>Habilidad</b> ${c.ability}</span>
    `;

    const rels=[];
    Object.entries(state.relations).forEach(([k,r])=>{
      const ids=k.split('-').map(Number);
      if(!ids.includes(h.id)) return;
      const otherId=ids[0]===h.id?ids[1]:ids[0];
      const other=member(otherId);
      if(!other) return;
      rels.push({other,r});
    });
    rels.sort((a,b)=>Math.max(b.r.bond,b.r.tension,b.r.attraction)-Math.max(a.r.bond,a.r.tension,a.r.attraction));

    $('detailRelations').innerHTML=rels.length
      ? rels.slice(0,5).map(x=>`<span class="detail-pill"><b>${x.other.name}</b> · ${x.r.status}<br><span class="tiny">Bond ${x.r.bond} · Tensión ${x.r.tension}${x.r.attraction?' · Atracción '+x.r.attraction:''}</span></span>`).join('')
      : '<span class="detail-pill">Aún no tiene vínculos significativos.</span>';

    const history=state.chronicle.filter(x=>x.includes(h.name)).slice(0,5);
    $('detailHistory').innerHTML=history.length
      ? history.map(x=>`<span class="detail-pill">${x}</span>`).join('')
      : '<span class="detail-pill">Su historia en el gremio apenas comienza.</span>';

    const addBtn=$('detailAddPartyBtn');
    const selected=state.selected.includes(h.id);
    const full=state.selected.length>=4 && !selected;
    addBtn.disabled=full;
    addBtn.textContent=selected?'Quitar de Party':full?'Party completa':'Añadir a Party';
  }

  function renderRoster(){
    const box=$('roster');
    box.innerHTML='';
    const alive=state.roster.filter(x=>x.alive!==false);

    if(!alive.length){
      box.innerHTML='<div class="party-row"><div class="small" style="padding:12px">Todavía no has reclutado a nadie.</div></div>';
      $('partyInfo').textContent='0 / 4';
      return;
    }

    alive.forEach(h=>{
      const c=DATA.classes[h.cls];
      const el=document.createElement('div');
      el.className='party-row';
      const checked=state.selected.includes(h.id)?'checked':'';
      el.innerHTML=`
        <label>
          <input type="checkbox" ${checked}>
          <span>
            <span class="hero-name">${c.icon} ${h.name} · Nv.${h.level}</span><br>
            <span class="tiny">${h.cls} · ${h.traits.join(' + ')}${h.injury?' · Herida '+h.injury:''}</span>
          </span>
        </label>
      `;
      el.querySelector('input').addEventListener('change',e=>toggleParty(h.id,e.target.checked));
      box.appendChild(el);
    });

    $('partyInfo').textContent=`${state.selected.length} / 4`;
  }

  function renderPartySummary(){
    const party=state.selected.map(member).filter(x=>x&&x.alive!==false);
    const slots=[];
    for(let i=0;i<4;i++){
      const h=party[i];
      if(h){
        slots.push(`<div class="party-slot"><b>${i+1}.</b> ${DATA.classes[h.cls].icon} ${h.name} · ${h.cls}</div>`);
      }else{
        slots.push(`<div class="party-slot empty"><b>${i+1}.</b> — vacío —</div>`);
      }
    }
    $('partySlots').innerHTML=slots.join('');

    if(!party.length){
      $('partySynergy').innerHTML='<strong>Sinergias</strong><br>Forma una party para evaluar su composición.';
      return;
    }

    const syn=partySynergy(party);
    let bondTotal=0, pairs=0;
    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const r=relation(party[i].id,party[j].id);
        bondTotal+=r.bond-r.tension;
        pairs++;
      }
    }
    const cohesion=pairs?Math.round(bondTotal/pairs):0;
    $('partySynergy').innerHTML=`
      <strong>Sinergias</strong><br>
      ${syn.notes.length?syn.notes.join(' · '):'Sin bonificaciones de clase'}<br>
      <span class="tiny">Cohesión del grupo: ${cohesion>=0?'+':''}${cohesion}</span>
    `;
  }

  function renderMission(){
    const select=$('missionSelect');
    const previous=select.value;

    if(!select.options.length){
      DATA.missions.forEach(m=>{
        const o=document.createElement('option');
        o.value=m.id;
        o.textContent=`${'★'.repeat(m.difficulty)} · ${m.name}`;
        select.appendChild(o);
      });
    }
    if(previous) select.value=previous;

    const m=DATA.missions.find(x=>x.id===select.value)||DATA.missions[0];
    $('missionDetails').innerHTML=`
      <b>${m.name}</b><br>
      <span class="small">${m.desc}</span><br><br>
      Dificultad: ${'★'.repeat(m.difficulty)}${'☆'.repeat(Math.max(0,4-m.difficulty))}<br>
      Duración: ${m.days} días<br>
      Recompensa base: ${m.reward} oro
    `;
    renderMissionParty();
  }

  function renderMissionParty(){
    const el=$('missionParty');
    if(!el) return;
    const party=state.selected.map(member).filter(x=>x&&x.alive!==false);
    el.textContent=party.length?party.map(x=>x.name).join(' · '):'Sin formar';
  }

  function renderRelations(){
    const rows=[];
    Object.entries(state.relations).forEach(([k,r])=>{
      const [a,b]=k.split('-').map(Number);
      const A=member(a),B=member(b);
      if(!A||!B) return;
      if(r.bond<5&&r.tension<5&&r.attraction<5) return;
      rows.push({A,B,r});
    });

    rows.sort((x,y)=>Math.max(y.r.bond,y.r.tension,y.r.attraction)-Math.max(x.r.bond,x.r.tension,x.r.attraction));
    $('relations').innerHTML=rows.length
      ? rows.slice(0,12).map(x=>`
        <div class="relation-row">
          <div>
            <div class="hero-name">${x.A.name} ↔ ${x.B.name}</div>
            <div class="tiny">${x.r.status}</div>
          </div>
          <div class="relation-values">
            Bond ${x.r.bond}<br>
            Tensión ${x.r.tension}
            ${x.r.attraction?`<br>Atracción ${x.r.attraction}`:''}
          </div>
        </div>
      `).join('')
      : '<div class="chronicle-row">Aún no existen relaciones significativas.</div>';
  }

  function renderChronicle(){
    $('chronicle').innerHTML=state.chronicle.slice(0,14).map(x=>`<div class="chronicle-row">${x}</div>`).join('');
  }

  function renderAll(){
    renderHeader();
    renderApplicants();
    renderAdventurers();
    renderRoster();
    renderPartySummary();
    renderMission();
    renderRelations();
    renderChronicle();
    if(currentScreen==='detail' && currentDetailId) renderDetail();
  }

  document.querySelectorAll('button[data-screen]').forEach(btn=>{
    btn.addEventListener('click',()=>navigate(btn.dataset.screen));
  });

  document.addEventListener('click',event=>{
    const btn=event.target.closest('[data-go]');
    if(!btn) return;
    navigate(btn.dataset.go);
  });

  $('missionSelect').addEventListener('change',renderMission);
  $('dispatchBtn').addEventListener('click',dispatch);
  $('saveBtn').addEventListener('click',()=>saveState(true));

  $('refreshApplicantsBtn').addEventListener('click',()=>{
    if(state.gold<20){
      notice('No tienes 20 oro.');
      return;
    }
    state.gold-=20;
    state.day++;
    state.applicants=[];
    refillApplicants();
    state.chronicle.unshift(`Día ${state.day} · Llegan nuevos aspirantes.`);
    saveState(false);
    renderAll();
    notice('Han llegado nuevos aventureros.');
  });

  $('clearPartyBtn').addEventListener('click',()=>{
    state.selected=[];
    saveState(false);
    renderRoster();
    renderPartySummary();
    renderMissionParty();
    renderHeader();
    notice('La Party ha sido vaciada.');
  });

  $('detailAddPartyBtn').addEventListener('click',()=>{
    const h=member(currentDetailId);
    if(!h) return;
    const selected=state.selected.includes(h.id);
    toggleParty(h.id,!selected);
  });

  $('resetBtn').addEventListener('click',()=>{
    const ok=window.confirm('¿Reiniciar toda la partida y borrar el guardado local?');
    if(!ok) return;
    localStorage.removeItem(SAVE_KEY);
    state=freshState();
    nextId=1;
    currentDetailId=null;
    refillApplicants();
    renderAll();
    navigate('guild');
    saveState(false);
    notice('Partida reiniciada.');
  });

  refillApplicants();
  renderAll();
  navigate('guild');
  saveState(false);
})();
