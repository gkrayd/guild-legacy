
(() => {
  'use strict';

  const DATA = window.GUILD_DATA;
  const SAVE_KEY = 'guildLegacy_v1_save';
  const LEGACY_SAVE_KEY = 'guildLegacy_v02_save';

  let currentScreen = 'guild';
  let currentDetailId = null;
  let expeditionView = null;
  let nextId = 1;

  const $ = id => document.getElementById(id);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const oneIn = n => Math.random() < 1/n;
  const threshold = level => 80 + level * 40;
  const pairKey = (a,b) => [a,b].sort((x,y)=>x-y).join('-');
  const member = id => state.roster.find(x => x.id === id);
  const activeMembers = () => state.roster.filter(h => h.alive !== false && !h.retired);
  const CLASS_ART={
    Guerrero:'assets/icons/class-warrior.svg',
    Maga:'assets/icons/class-mage.svg',
    Sacerdotisa:'assets/icons/class-priestess.svg',
    Picaro:'assets/icons/class-rogue.svg',
    Arquera:'assets/icons/class-archer.svg',
    Paladin:'assets/icons/class-paladin.svg'
  };
  const classIconAsset=cls=>CLASS_ART[cls]||'assets/art/grifo-silver.svg';
  const classIconHtml=(cls,label='')=>`<img class="class-art-icon" src="${classIconAsset(cls)}" alt="${label||cls}" loading="lazy">`;
  const portraitClass=cls=>({
    Guerrero:'guerrero',Maga:'maga',Sacerdotisa:'sacerdotisa',
    Picaro:'picaro',Arquera:'arquera',Paladin:'paladin'
  })[cls]||'guerrero';
  function portraitHtml(hero,extraClass=''){
    const ageClass=hero.age>=50?'portrait-veteran':hero.age<=22?'portrait-young':'portrait-adult';
    const legacy=(hero.generation||1)>1?'<span class="portrait-badge legacy">LEGADO</span>':'';
    const injured=hero.injury?'<span class="portrait-badge injured">HERIDO</span>':'';
    const scars=hero.scars?.length?'<span class="portrait-scar-mark">✦</span>':'';
    return `<span class="portrait-shell portrait-${portraitClass(hero.cls)} ${ageClass} ${extraClass}" role="img" aria-label="${hero.name}, ${hero.cls}">
      <span class="portrait-art-layer" aria-hidden="true"></span>
      ${legacy}${injured}${scars}
    </span>`;
  }

  function freshState(){
    return {
      version:1,
      gold:1000,
      day:1,
      year:1,
      rep:0,
      missionsDone:0,
      roster:[],
      selected:[],
      applicants:[],
      relations:{},
      chronicle:['Día 1 · Año 1 · Se funda el Gremio del Grifo de Plata.'],
      facilities:{infirmary:0,tavern:0,training:0,library:0},
      planning:{pace:'balanced',priority:'objective',supply:'none'},
      children:[],
      lastGuildEvent:'El gremio abre sus puertas por primera vez.',
      regionNotices:['frontier'],
      factionRep:{greenward:0,crownless:0,astral:0,highclans:0},
      completedMissionChains:[],
      completedMissionIds:[],
      missionHistory:{},
      guildIdentityScores:{protector:0,explorer:0,mercenary:0,scholar:0,fellowship:0,renowned:0},
      guildTitle:'Gremio en formación',
      veteranAssignments:{},
      lineageRegistry:{},
      stats:{
        missions:0,wins:0,losses:0,goldEarned:0,goldSpent:0,
        injuries:0,deaths:0,recruits:0,facilitySpent:0,supplySpent:0,guildEvents:0
      }
    };
  }

  function randomTraits(){
    const traits=Object.keys(DATA.traits);
    const first=rand(traits);
    let second=rand(traits);
    while(second===first) second=rand(traits);
    return [first,second];
  }

  function randomMotivation(){
    return rand(DATA.motivations).id;
  }

  function normalizeHero(raw, applicant=false){
    const h={...raw};
    h.id=Number(h.id)||nextId++;
    h.name=h.name||rand(DATA.names);
    h.cls=DATA.classes[h.cls]?h.cls:rand(Object.keys(DATA.classes));
    h.traits=Array.isArray(h.traits)&&h.traits.length?h.traits.slice(0,2):randomTraits();
    h.age=Number.isFinite(h.age)?h.age:18+Math.floor(Math.random()*18);
    h.origin=h.origin||rand(DATA.origins);
    h.motivation=h.motivation||randomMotivation();
    h.generation=h.generation||1;
    h.parentIds=Array.isArray(h.parentIds)?h.parentIds:[];
    h.legacy=!!h.legacy;

    if(applicant){
      h.cost=Number.isFinite(h.cost)?h.cost:(h.legacy?60:120+Math.floor(Math.random()*81));
      return h;
    }

    h.level=h.level||1;
    h.xp=h.xp||0;
    h.expeditions=h.expeditions||0;
    h.alive=h.alive!==false;
    h.retired=!!h.retired;
    h.specialization=h.specialization||null;
    h.memory=Array.isArray(h.memory)?h.memory:[];
    h.spouseId=h.spouseId||null;
    h.children=Array.isArray(h.children)?h.children:[];
    h.motivationProgress=h.motivationProgress||0;
    h.storyProgress=Number.isFinite(h.storyProgress)?h.storyProgress:0;
    h.storyMilestones=Array.isArray(h.storyMilestones)?h.storyMilestones:[];
    h.scars=Array.isArray(h.scars)?h.scars:[];
    h.lastStoryBeat=h.lastStoryBeat||'';
    h.pendingScar=h.pendingScar||null;
    h.wins=h.wins||0;
    h.missionTypes=h.missionTypes||{};
    h.veteranRole=h.veteranRole||null;
    h.mentorId=h.mentorId||null;
    h.lineageName=h.lineageName||null;
    h.familyExpectation=h.familyExpectation||null;

    if(typeof h.injury==='number' && h.injury>0){
      const template=DATA.injuries[Math.min(DATA.injuries.length-1,Math.max(0,h.injury*2-1))];
      h.injury={...template,daysLeft:template.days};
    }else if(h.injury && typeof h.injury==='object'){
      h.injury={...h.injury};
      h.injury.daysLeft=Math.max(1,h.injury.daysLeft||h.injury.days||5);
    }else{
      h.injury=null;
    }
    return h;
  }

  function migrateLegacy(raw){
    const base=freshState();
    if(!raw) return base;
    base.gold=raw.gold??base.gold;
    base.day=raw.day??base.day;
    base.year=raw.year??base.year;
    base.rep=raw.rep??0;
    base.missionsDone=raw.missionsDone??0;
    base.relations=raw.relations||{};
    base.chronicle=Array.isArray(raw.chronicle)?raw.chronicle:base.chronicle;
    base.roster=(raw.roster||[]).map(h=>normalizeHero(h,false));
    base.applicants=(raw.applicants||[]).map(h=>normalizeHero(h,true));
    base.selected=(raw.selected||[]).filter(id=>base.roster.some(h=>h.id===id));
    base.lastGuildEvent='La historia del gremio continúa desde una versión anterior.';
    return base;
  }

  function loadState(){
    try{
      const v1=localStorage.getItem(SAVE_KEY);
      if(v1) return JSON.parse(v1);
      const old=localStorage.getItem(LEGACY_SAVE_KEY);
      if(old) return migrateLegacy(JSON.parse(old));
    }catch(err){}
    return freshState();
  }

  let state=loadState();

  function normalizeState(){
    state={...freshState(),...state};
    state.facilities={...freshState().facilities,...(state.facilities||{})};
    state.planning={...freshState().planning,...(state.planning||{})};
    state.relations=state.relations||{};
    Object.values(state.relations).forEach(r=>{
      if(r.status==='Romance naciente'||r.status==='Pareja') r.romance=true;
      if(r.status==='Matrimonio') r.married=true;
      r.romance=!!r.romance;
      r.married=!!r.married;
    });
    state.children=Array.isArray(state.children)?state.children:[];
    state.chronicle=Array.isArray(state.chronicle)?state.chronicle:[];
    state.regionNotices=Array.isArray(state.regionNotices)?state.regionNotices:['frontier'];
    state.factionRep={...freshState().factionRep,...(state.factionRep||{})};
    state.completedMissionChains=Array.isArray(state.completedMissionChains)?state.completedMissionChains:[];
    state.completedMissionIds=Array.isArray(state.completedMissionIds)?state.completedMissionIds:[];
    state.missionHistory=state.missionHistory||{};
    state.guildIdentityScores={...freshState().guildIdentityScores,...(state.guildIdentityScores||{})};
    state.guildTitle=state.guildTitle||'Gremio en formación';
    state.veteranAssignments=state.veteranAssignments||{};
    state.lineageRegistry=state.lineageRegistry||{};
    state.stats={...freshState().stats,...(state.stats||{})};
    state.roster=(state.roster||[]).map(h=>normalizeHero(h,false));
    state.applicants=(state.applicants||[]).map(h=>normalizeHero(h,true));
    state.selected=(state.selected||[]).filter(id=>state.roster.some(h=>h.id===id && h.alive!==false && !h.retired));
    nextId=Math.max(1,...state.roster.map(x=>x.id+1),...state.applicants.map(x=>x.id+1));
  }
  normalizeState();

  function saveState(show=true){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(state));
      if(show) notice('Partida guardada.');
    }catch(err){
      if(show) notice('No fue posible guardar en este navegador.');
    }
  }

  function notice(text){
    const el=$('notice');
    if(el) el.textContent=text;
  }

  function addChronicle(text){
    state.chronicle.unshift(`Día ${state.day} · Año ${state.year} · ${text}`);
    state.chronicle=state.chronicle.slice(0,120);
  }

  function addMemory(hero,text){
    if(!hero) return;
    hero.memory=hero.memory||[];
    hero.memory.unshift(`Año ${state.year}: ${text}`);
    hero.memory=hero.memory.slice(0,20);
  }

  function motivationData(hero){
    return DATA.motivations.find(m=>m.id===hero.motivation)||DATA.motivations[0];
  }

  function specializationData(hero){
    if(!hero.specialization) return null;
    return (DATA.specializations[hero.cls]||[]).find(s=>s.id===hero.specialization)||null;
  }

  function heroTitles(hero){
    const titles=[];
    if((hero.generation||1)>1) titles.push('Heredero del Grifo');
    if(hero.expeditions>=5) titles.push('Expedicionario');
    if(hero.expeditions>=12) titles.push('Veterano del Grifo');
    if(hero.wins>=10) titles.push('Compañero confiable');
    if(hero.level>=6) titles.push(`Maestro ${specializationData(hero)?.name||hero.cls}`);
    if((hero.missionTypes?.exploration||0)>=3) titles.push('Ojo del Camino');
    if((hero.missionTypes?.arcane||0)>=3) titles.push('Conocedor de lo Arcano');
    if((hero.missionTypes?.undead||0)>=3) titles.push('Guardián de las Criptas');
    if((hero.missionTypes?.combat||0)>=5) titles.push('Curtido en batalla');
    if((hero.children||[]).length) titles.push('Fundador de linaje');
    const arc=characterArcStatus(hero);
    if(arc?.latest?.title) titles.push(arc.latest.title);
    if(hero.scars?.length) titles.push('Marcado por la aventura');
    if(hero.retired) titles.push('Veterano retirado');
    return [...new Set(titles)].slice(0,6);
  }

  function characterArcStatus(hero){
    const beats=DATA.characterArcs?.[hero.motivation]||[];
    const unlocked=beats.filter(b=>(hero.storyProgress||0)>=b.need);
    const latest=unlocked.length?unlocked[unlocked.length-1]:null;
    const next=beats.find(b=>(hero.storyProgress||0)<b.need)||null;
    return {beats,latest,next,progress:hero.storyProgress||0,complete:!!beats.length&&!next};
  }

  function specializationPartyModifiers(party,mission){
    const out={success:0,injury:0,treasure:0,notes:[]};
    party.forEach(hero=>{
      const spec=specializationData(hero);
      const e=spec?.effect||{};
      if(e.success) out.success+=e.success;
      if(e.partyInjury) out.injury+=e.partyInjury;
      if(e.treasure) out.treasure+=e.treasure;
      if(e.hardSuccess && mission.difficulty>=4) out.success+=e.hardSuccess;
      if(e.arcaneSuccess && ['arcane','legendary'].includes(mission.type)) out.success+=e.arcaneSuccess;
      if(e.explorationSuccess && ['exploration','escort'].includes(mission.type)) out.success+=e.explorationSuccess;
      if(spec && Object.keys(e).length) out.notes.push(`${hero.name}: ${spec.name}`);
    });
    out.success=Math.min(out.success,0.14);
    out.injury=Math.max(out.injury,-0.18);
    out.treasure=Math.min(out.treasure,0.18);
    return out;
  }

  function relation(a,b){
    const key=pairKey(a,b);
    if(!state.relations[key]){
      state.relations[key]={bond:0,tension:0,attraction:0,status:'Conocidos',romance:false,married:false};
    }
    return state.relations[key];
  }

  function relationStatus(r){
    if(r.married) return 'Matrimonio';
    if(r.romance) return 'Pareja';
    if(r.tension>=45) return 'Rivales';
    if(r.attraction>=55 && r.bond>=45) return 'Atracción mutua';
    if(r.bond>=70) return 'Amigos íntimos';
    if(r.bond>=40) return 'Amigos';
    if(r.bond>=15) return 'Compañeros';
    return 'Conocidos';
  }

  function changeRelation(a,b,bond=0,tension=0,attraction=0){
    if(a===b) return null;
    const r=relation(a,b);
    r.bond=clamp((r.bond||0)+bond,-50,100);
    r.tension=clamp((r.tension||0)+tension,0,100);
    r.attraction=clamp((r.attraction||0)+attraction,0,100);
    r.status=relationStatus(r);
    return r;
  }

  function traitScore(hero,type){
    return (hero.traits||[]).reduce((sum,t)=>sum+(DATA.traits[t]?.[type]||0),0);
  }

  function heroPower(hero){
    const base=DATA.classes[hero.cls]?.power||12;
    const spec=specializationData(hero);
    const injuryPenalty=hero.injury?.power||0;
    return base + hero.level*3 + (spec?.power||0) + injuryPenalty + traitScore(hero,'risk');
  }

  function canDeploy(hero){
    return hero && hero.alive!==false && !hero.retired && (!hero.injury || hero.injury.severity<3);
  }

  function makeApplicant(extra={}){
    const cls=extra.cls&&DATA.classes[extra.cls]?extra.cls:rand(Object.keys(DATA.classes));
    return normalizeHero({
      id:nextId++,
      name:extra.name||rand(DATA.names),
      cls,
      traits:extra.traits||randomTraits(),
      age:extra.age??18+Math.floor(Math.random()*18),
      origin:extra.origin||rand(DATA.origins),
      motivation:extra.motivation||randomMotivation(),
      cost:extra.cost,
      legacy:!!extra.legacy,
      generation:extra.generation||1,
      parentIds:extra.parentIds||[],
      lineageName:extra.lineageName||null,
      familyExpectation:extra.familyExpectation||null
    },true);
  }

  function refillApplicants(){
    while(state.applicants.length<6) state.applicants.push(makeApplicant());
  }

  function recruit(id){
    const a=state.applicants.find(x=>x.id===id);
    if(!a) return;
    if(activeMembers().length>=(DATA.balance?.rosterCap||14)){
      notice(`El roster activo admite un máximo de ${DATA.balance?.rosterCap||14} aventureros.`);
      return;
    }
    if(state.gold<a.cost){
      notice('No tienes suficiente oro.');
      return;
    }
    state.gold-=a.cost;
    state.stats.goldSpent+=a.cost;
    state.stats.recruits++;
    const h=normalizeHero({...a,level:1,xp:0,expeditions:0,alive:true,retired:false,memory:[]},false);
    if(a.legacy){
      addMemory(h,'entró al gremio siguiendo el legado de su familia.');
    }
    state.roster.push(h);
    state.applicants=state.applicants.filter(x=>x.id!==id);
    refillApplicants();
    addChronicle(`${h.name}, ${h.cls}, se une al gremio${h.legacy?' como descendiente de una familia del gremio':''}.`);
    saveState(false);
    renderAll();
    notice(`${h.name} se ha unido al gremio.`);
  }

  function toggleParty(id,on){
    const h=member(id);
    if(!h) return false;
    if(on){
      if(!canDeploy(h)){
        notice(h.injury?.severity>=3?`${h.name} necesita recuperarse antes de salir.`:`${h.name} no está disponible.`);
        renderRoster();
        return false;
      }
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
    renderHeader();
    renderRoster();
    renderPartySummary();
    renderMissionParty();
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
    if(classes.includes('Picaro')){bonus+=4;notes.push('Trampas y rutas');}
    if(classes.includes('Arquera')){bonus+=3;notes.push('Rastreo');}
    if(classes.includes('Maga')){bonus+=4;notes.push('Soporte arcano');}
    const lib=state.facilities.library||0;
    if(lib && party.some(h=>h.cls==='Maga'||h.cls==='Sacerdotisa')){
      bonus+=lib*2;
      notes.push(`Biblioteca Nv.${lib}`);
    }
    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const r=relation(party[i].id,party[j].id);
        bonus+=(r.bond-r.tension)*0.04;
        if(r.married||r.romance) bonus+=2;
      }
    }
    return {bonus,notes};
  }

  function partyChemistry(party){
    if(party.length<2) return {label:'Sin datos',score:0,detail:'Necesitas al menos dos miembros.'};
    let total=0,pairs=0,romance=0,rivalry=0;
    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const r=relation(party[i].id,party[j].id);
        total+=r.bond-r.tension;
        pairs++;
        if(r.romance||r.married) romance++;
        if(r.tension>=45) rivalry++;
      }
    }
    const score=Math.round(total/Math.max(1,pairs));
    let label='Neutral';
    if(score>=55) label='Confianza excepcional';
    else if(score>=30) label='Buena química';
    else if(score>=10) label='Compañerismo';
    else if(score<=-20) label='Tensión fuerte';
    else if(score<0) label='Tensión leve';
    return {label,score,detail:`${romance?romance+' vínculo cercano · ':''}${rivalry?rivalry+' rivalidad · ':''}Cohesión ${score>=0?'+':''}${score}`};
  }

  function createInjury(hero,difficulty,failed=false){
    const current=hero.injury;
    let severity=1;
    const roll=Math.random();
    if(difficulty>=4 && roll<0.22) severity=3;
    else if(difficulty>=3 && roll<0.5) severity=2;
    else if(failed && roll<0.58) severity=2;
    const pool=DATA.injuries.filter(i=>i.severity===severity);
    const template={...rand(pool.length?pool:DATA.injuries)};
    const infirmary=state.facilities.infirmary||0;
    template.daysLeft=Math.max(2,template.days-infirmary*2);
    if(!current || template.severity>=current.severity){
      hero.injury=template;
    }else{
      hero.injury.daysLeft+=Math.max(1,Math.floor(template.daysLeft/2));
    }
    if(hero.injury.severity>=2 && Math.random()<0.26){
      hero.pendingScar={
        source:hero.injury.name,
        title:hero.injury.id==='burn'?'Marca de fuego':hero.injury.id==='fracture'?'Vieja fractura':'Cicatriz de expedición'
      };
    }
    state.stats.injuries++;
    addMemory(hero,`sufrió ${hero.injury.name.toLowerCase()} durante una expedición.`);
    return hero.injury;
  }

  function recoverDays(days){
    activeMembers().forEach(h=>{
      if(!h.injury) return;
      h.injury.daysLeft-=days;
      if(h.injury.daysLeft<=0){
        const name=h.injury.name;
        h.injury=null;
        addMemory(h,`se recuperó de ${name.toLowerCase()}.`);
        addChronicle(`${h.name} se recupera de ${name.toLowerCase()} y vuelve a estar disponible.`);
        if(h.pendingScar){
          const scar={...h.pendingScar,year:state.year};
          h.scars=h.scars||[];
          h.scars.push(scar);
          addMemory(h,`conservó una ${scar.title.toLowerCase()} como recuerdo de aquella herida.`);
          addChronicle(`${h.name} vuelve a la actividad con una nueva cicatriz que ya forma parte de su historia.`);
          h.pendingScar=null;
        }
      }
    });
  }

  function triggerGuildLifeEvent(force=false){
    if(activeMembers().length<2) return null;
    if(!force && Math.random()>0.38) return null;
    const e=rand(DATA.guildLifeEvents);
    const heroes=activeMembers();
    let text=e.text;
    state.stats.guildEvents++;

    if(e.gold){
      state.gold=Math.max(0,state.gold+e.gold);
      if(e.gold>0) state.stats.goldEarned+=e.gold;
      else state.stats.goldSpent+=Math.abs(e.gold);
      text+=` ${e.gold>0?'+':''}${e.gold} oro.`;
    }
    if(e.rep){
      state.rep=Math.max(0,state.rep+e.rep);
      text+=` Reputación ${e.rep>0?'+':''}${e.rep}.`;
    }
    if(e.xp){
      const h=rand(heroes);
      h.xp+=e.xp;
      text+=` ${h.name} gana ${e.xp} XP.`;
      levelHeroIfNeeded(h);
    }
    if(e.bond && heroes.length>=2){
      const a=rand(heroes);
      let b=rand(heroes.filter(x=>x.id!==a.id));
      changeRelation(a.id,b.id,e.bond,0,Math.random()<0.12?1:0);
      text+=` ${a.name} y ${b.name} estrechan su vínculo.`;
    }
    state.lastGuildEvent=`${e.title}: ${text}`;
    addChronicle(`${e.title}. ${text}`);
    return e;
  }

  function triggerContextualGuildMoment(preferredParty=[],meta={}){
    const heroes=activeMembers();
    if(heroes.length<2) return null;

    const party=(preferredParty||[]).filter(h=>h&&h.alive!==false&&!h.retired);
    const injured=(meta.injured||party.filter(h=>h.injury)).filter(Boolean);
    const leveled=(meta.leveled||[]).filter(Boolean);

    if(injured.length){
      const patient=rand(injured);
      const visitors=heroes.filter(h=>h.id!==patient.id).sort((a,b)=>relation(b.id,patient.id).bond-relation(a.id,patient.id).bond);
      const visitor=visitors[0];
      if(visitor){
        changeRelation(patient.id,visitor.id,3,0,0);
        const text=`${visitor.name} pasó parte de la tarde acompañando a ${patient.name} durante su recuperación de ${patient.injury?.name?.toLowerCase()||'una herida'}.`;
        state.lastGuildEvent=`Una visita durante la recuperación: ${text}`;
        addChronicle(text);
        addMemory(patient,`${visitor.name} le visitó durante su recuperación.`);
        addMemory(visitor,`acompañó a ${patient.name} mientras se recuperaba.`);
        return {kind:'injury',title:'Una visita durante la recuperación',text};
      }
    }

    if(leveled.length){
      const hero=rand(leveled);
      const friend=heroes.filter(h=>h.id!==hero.id).sort((a,b)=>relation(b.id,hero.id).bond-relation(a.id,hero.id).bond)[0];
      if(friend) changeRelation(hero.id,friend.id,2,0,0);
      const text=friend
        ?`${friend.name} organizó un pequeño brindis cuando ${hero.name} alcanzó el nivel ${hero.level}.`
        :`El gremio celebró que ${hero.name} alcanzara el nivel ${hero.level}.`;
      state.lastGuildEvent=`Brindis por un nuevo nivel: ${text}`;
      addChronicle(text);
      addMemory(hero,'el gremio celebró uno de sus ascensos.');
      return {kind:'level',title:'Brindis por un nuevo nivel',text};
    }

    const romance=Object.entries(state.relations).map(([key,r])=>{
      const [a,b]=key.split('-').map(Number);
      return {a:member(a),b:member(b),r};
    }).filter(x=>x.a&&x.b&&(x.r.romance||x.r.married));
    if(romance.length && Math.random()<0.34){
      const pair=rand(romance);
      changeRelation(pair.a.id,pair.b.id,2,0,1);
      const text=`${pair.a.name} y ${pair.b.name} salieron a caminar después de cenar y regresaron bastante más tarde que el resto.`;
      state.lastGuildEvent=`Un paseo después de cenar: ${text}`;
      addChronicle(text);
      return {kind:'romance',title:'Un paseo después de cenar',text};
    }

    const bonds=Object.entries(state.relations).map(([key,r])=>{
      const [a,b]=key.split('-').map(Number);
      return {a:member(a),b:member(b),r};
    }).filter(x=>x.a&&x.b&&x.r.bond>=35&&x.r.tension<35);
    if(bonds.length){
      const pair=rand(bonds);
      changeRelation(pair.a.id,pair.b.id,2,0,0);
      const text=`${pair.a.name} y ${pair.b.name} aprovecharon una tarde tranquila para entrenar juntos sin necesidad de una misión de por medio.`;
      state.lastGuildEvent=`Entrenamiento entre compañeros: ${text}`;
      addChronicle(text);
      return {kind:'bond',title:'Entrenamiento entre compañeros',text};
    }

    const tensions=Object.entries(state.relations).map(([key,r])=>{
      const [a,b]=key.split('-').map(Number);
      return {a:member(a),b:member(b),r};
    }).filter(x=>x.a&&x.b&&x.r.tension>=35);
    if(tensions.length){
      const pair=rand(tensions);
      pair.r.tension=Math.max(0,pair.r.tension-3);
      pair.r.status=relationStatus(pair.r);
      const text=`${pair.a.name} y ${pair.b.name} tuvieron una discusión incómoda en la sala común, pero al menos dijeron algunas cosas que llevaban tiempo guardándose.`;
      state.lastGuildEvent=`Una discusión que todos escucharon: ${text}`;
      addChronicle(text);
      return {kind:'tension',title:'Una discusión que todos escucharon',text};
    }

    const retired=state.roster.filter(h=>h.retired&&h.alive!==false);
    if(retired.length){
      const veteran=rand(retired);
      const listener=rand(heroes);
      const text=`${veteran.name} pasó la noche contando a ${listener.name} cómo eran las expediciones cuando aún salía con una party.`;
      state.lastGuildEvent=`Una historia de veteranos: ${text}`;
      addChronicle(text);
      addMemory(listener,`escuchó una vieja historia de ${veteran.name}.`);
      return {kind:'veteran',title:'Una historia de veteranos',text};
    }
    return null;
  }

  function processYearChange(){
    state.roster.forEach(h=>{
      if(h.alive!==false) h.age=(h.age||18)+1;
    });

    state.children.forEach(child=>{
      child.age=(child.age||0)+1;
      if(child.age>=16 && !child.introduced){
        child.introduced=true;
        const follows=child.familyExpectation!=='propio';
        const inheritedClass=follows
          ?rand(child.classAffinity||Object.keys(DATA.classes))
          :rand(Object.keys(DATA.classes).filter(c=>!(child.classAffinity||[]).includes(c)).length
            ?Object.keys(DATA.classes).filter(c=>!(child.classAffinity||[]).includes(c))
            :Object.keys(DATA.classes));
        state.applicants.push(makeApplicant({
          name:child.name,
          cls:inheritedClass,
          traits:child.traits,
          age:16,
          origin:child.lineageName||'Familia del Gremio del Grifo',
          motivation:child.motivation,
          cost:50,
          legacy:true,
          generation:child.generation,
          parentIds:child.parentIds,
          lineageName:child.lineageName,
          familyExpectation:child.familyExpectation
        }));
        addChronicle(
          follows
            ?`${child.name}, descendiente de ${child.lineageName||'una familia del gremio'}, decide seguir el camino familiar como aspirante.`
            :`${child.name}, descendiente de ${child.lineageName||'una familia del gremio'}, se presenta como aspirante pero elige un camino distinto al de su familia.`
        );
      }
    });

    state.roster.filter(h=>h.alive!==false&&!h.retired&&h.age>=(DATA.balance?.retirementAge||58)).forEach(h=>retireHero(h,false));

    const mentors=state.roster.filter(h=>h.retired&&h.alive!==false&&h.veteranRole==='mentor');
    const pupils=activeMembers().filter(h=>h.age<=25||(h.generation||1)>1);
    if(mentors.length&&pupils.length){
      const mentor=rand(mentors), pupil=rand(pupils);
      pupil.xp+=30;
      pupil.mentorId=mentor.id;
      addMemory(pupil,`recibió entrenamiento personal de ${mentor.name}.`);
      addChronicle(`${mentor.name}, ya retirado, comienza a orientar a ${pupil.name} como mentor.`);
      levelHeroIfNeeded(pupil);
    }

    processRelationships(true);
    processFamilyGrowth();
    checkRegionUnlocks();
  }

  function advanceDays(days,{guildEvent=false,recover=true}={}){
    if(recover) recoverDays(days);
    let remaining=days;
    while(remaining>0){
      const toYear=91-state.day;
      if(remaining>=toYear){
        state.day=1;
        remaining-=toYear;
        state.year++;
        processYearChange();
      }else{
        state.day+=remaining;
        remaining=0;
      }
    }
    if(guildEvent) triggerGuildLifeEvent(true);
    checkRegionUnlocks();
    saveState(false);
  }

  function advanceWeek(){
    advanceDays(7,{guildEvent:false});
    if(!triggerContextualGuildMoment()) triggerGuildLifeEvent(true);
    renderAll();
    notice('Pasó una semana en el gremio.');
  }

  function advanceYear(){
    advanceDays(90,{guildEvent:false});
    if(!triggerContextualGuildMoment()) triggerGuildLifeEvent(true);
    renderAll();
    notice('Ha pasado un año de vida en el gremio.');
  }

  function levelHeroIfNeeded(hero){
    let leveled=false;
    while(hero.xp>=threshold(hero.level)){
      hero.xp-=threshold(hero.level);
      hero.level++;
      leveled=true;
      addMemory(hero,`alcanzó el nivel ${hero.level}.`);
      addChronicle(`${hero.name} alcanza el nivel ${hero.level}.`);
    }
    return leveled;
  }

  function chooseSpecialization(hero,specId){
    if(!hero || hero.level<4 || hero.specialization) return;
    const spec=(DATA.specializations[hero.cls]||[]).find(s=>s.id===specId);
    if(!spec) return;
    hero.specialization=spec.id;
    addMemory(hero,`se especializó como ${spec.name}.`);
    addChronicle(`${hero.name} adopta la especialización ${spec.name}.`);
    saveState(false);
    renderAll();
    notice(`${hero.name} ahora es ${spec.name}.`);
  }

  function suggestedVeteranRole(hero){
    if(hero.cls==='Maga'||hero.motivation==='knowledge') return 'archivist';
    if(hero.cls==='Guerrero'||hero.cls==='Paladin'||hero.motivation==='mastery') return 'instructor';
    if(hero.motivation==='wealth'||hero.motivation==='family') return 'steward';
    return 'mentor';
  }

  function veteranBonuses(){
    const retired=state.roster.filter(h=>h.retired&&h.alive!==false&&h.veteranRole);
    const counts={mentor:0,steward:0,instructor:0,archivist:0};
    retired.forEach(h=>{if(counts[h.veteranRole]!==undefined) counts[h.veteranRole]++;});
    return {
      counts,
      xp:Math.min(.20,counts.mentor*.05),
      supplyDiscount:Math.min(.20,counts.steward*.05),
      success:Math.min(.06,counts.instructor*.015),
      knowledge:Math.min(.06,counts.archivist*.015)
    };
  }

  function retireHero(hero,voluntary=true){
    if(!hero || hero.retired || hero.alive===false) return;
    if(voluntary && !(hero.age>=45 || (hero.level>=6 && hero.expeditions>=10))){
      notice('Todavía no está listo para retirarse.');
      return;
    }
    hero.retired=true;
    hero.veteranRole=hero.veteranRole||suggestedVeteranRole(hero);
    state.veteranAssignments[hero.id]=hero.veteranRole;
    state.selected=state.selected.filter(id=>id!==hero.id);
    const role=DATA.veteranRoles[hero.veteranRole];
    addMemory(hero,`dejó las expediciones y pasó a servir al gremio como ${role?.name||'veterano'}.`);
    addChronicle(`${hero.name} se retira de la vida de aventurero y asume la función de ${role?.name||'veterano'}.`);
    if(voluntary){
      saveState(false);
      renderAll();
      navigate('legacy');
    }
  }

  function processRelationships(yearly=false){
    const entries=Object.entries(state.relations);
    entries.forEach(([key,r])=>{
      const [aId,bId]=key.split('-').map(Number);
      const a=member(aId),b=member(bId);
      if(!a||!b||a.alive===false||b.alive===false) return;

      if(!r.romance && !r.married && r.attraction>=55 && r.bond>=45 && Math.random()<(yearly?0.5:0.18)){
        r.romance=true;
        r.status='Pareja';
        a.spouseId=b.id;
        b.spouseId=a.id;
        addChronicle(`${a.name} y ${b.name} deciden comenzar una relación.`);
        addMemory(a,`comenzó una relación con ${b.name}.`);
        addMemory(b,`comenzó una relación con ${a.name}.`);
      }else if(r.romance && !r.married && r.bond>=70 && r.attraction>=60 && Math.random()<(yearly?0.45:0.12)){
        r.married=true;
        r.status='Matrimonio';
        a.spouseId=b.id;
        b.spouseId=a.id;
        addChronicle(`${a.name} y ${b.name} celebran su unión junto al gremio.`);
        addMemory(a,`formó una familia con ${b.name}.`);
        addMemory(b,`formó una familia con ${a.name}.`);
      }
    });
  }

  function familyLineage(a,b){
    const key=[a.id,b.id].sort((x,y)=>x-y).join('-');
    if(state.lineageRegistry[key]) return state.lineageRegistry[key];
    const dominant=(a.storyProgress||0)>=(b.storyProgress||0)?a:b;
    const archetype=dominant.motivation==='protect'?'protectors':
      dominant.motivation==='knowledge'?'seekers':'veterans';
    const template=DATA.lineageLegacies.find(x=>x.id===archetype)||DATA.lineageLegacies[0];
    const title=`Casa de ${a.name} y ${b.name}`;
    const lineage={key,title,legacyId:template.id,desc:template.desc,founders:[a.id,b.id],generation:1};
    state.lineageRegistry[key]=lineage;
    return lineage;
  }

  function createChild(a,b){
    const inherited=[];
    inherited.push(rand(a.traits||randomTraits()));
    const second=rand(b.traits||randomTraits());
    if(!inherited.includes(second)) inherited.push(second);
    else{
      const pool=Object.keys(DATA.traits).filter(t=>!inherited.includes(t));
      inherited.push(rand(pool));
    }
    const lineage=familyLineage(a,b);
    const child={
      id:`child-${Date.now()}-${Math.floor(Math.random()*9999)}`,
      name:rand(DATA.names),
      age:0,
      parentIds:[a.id,b.id],
      traits:inherited,
      motivation:Math.random()<0.5?a.motivation:b.motivation,
      classAffinity:[...new Set([a.cls,b.cls,...((DATA.lineageLegacies.find(x=>x.id===lineage.legacyId)||{}).classes||[])])],
      generation:Math.max(a.generation||1,b.generation||1)+1,
      introduced:false,
      lineageName:lineage.title,
      lineageKey:lineage.key,
      familyExpectation:Math.random()<0.72?'seguir':'propio',
      inheritedTitle:heroTitles(a)[0]||heroTitles(b)[0]||null
    };
    state.children.push(child);
    a.children=a.children||[];
    b.children=b.children||[];
    a.children.push(child.id);
    b.children.push(child.id);
    a.lineageName=lineage.title;
    b.lineageName=lineage.title;
    addChronicle(`${a.name} y ${b.name} reciben a ${child.name} en ${lineage.title}.`);
    addMemory(a,`${child.name} pasó a formar parte de ${lineage.title}.`);
    addMemory(b,`${child.name} pasó a formar parte de ${lineage.title}.`);
    return child;
  }

  function processFamilyGrowth(){
    const handled=new Set();
    Object.entries(state.relations).forEach(([key,r])=>{
      if(!r.married) return;
      const [aId,bId]=key.split('-').map(Number);
      if(handled.has(key)) return;
      handled.add(key);
      const a=member(aId),b=member(bId);
      if(!a||!b||a.alive===false||b.alive===false) return;
      if(a.age<20||b.age<20||a.age>45||b.age>45) return;
      const existing=state.children.filter(c=>c.parentIds.includes(a.id)&&c.parentIds.includes(b.id));
      if(existing.length>=3) return;
      if(Math.random()<(DATA.balance?.familyGrowthChance||0.30)) createChild(a,b);
    });
  }

  function checkRegionUnlocks(){
    DATA.regions.forEach(region=>{
      if(state.rep>=region.rep && !state.regionNotices.includes(region.id)){
        state.regionNotices.push(region.id);
        addChronicle(`La reputación del gremio abre contratos en ${region.name}.`);
      }
    });
  }

  function missionChainFor(missionId){
    return (DATA.missionChains||[]).find(c=>c.missions.includes(missionId))||null;
  }

  function missionChainUnlocked(missionId){
    const chain=missionChainFor(missionId);
    if(!chain) return true;
    const idx=chain.missions.indexOf(missionId);
    if(idx<=0) return true;
    return chain.missions.slice(0,idx).every(id=>state.completedMissionIds.includes(id));
  }

  function unlockedMissions(){
    return DATA.missions.filter(m=>{
      const region=DATA.regions.find(r=>r.id===m.region);
      const regionOpen=!region || state.regionNotices.includes(region.id);
      return regionOpen && missionChainUnlocked(m.id);
    });
  }

  function applyWorldMemory(mission,success){
    state.missionHistory[mission.id]=(state.missionHistory[mission.id]||0)+1;
    if(success && !state.completedMissionIds.includes(mission.id)){
      state.completedMissionIds.push(mission.id);
    }

    const faction=(DATA.factions||[]).find(f=>f.region===mission.region);
    if(faction){
      const delta=success?2+mission.difficulty:1;
      state.factionRep[faction.id]=(state.factionRep[faction.id]||0)+delta;
      addChronicle(`${faction.name} registra la participación del gremio en ${mission.name}. Confianza +${delta}.`);
    }

    const chain=missionChainFor(mission.id);
    if(chain && success){
      const complete=chain.missions.every(id=>state.completedMissionIds.includes(id));
      if(complete && !state.completedMissionChains.includes(chain.id)){
        state.completedMissionChains.push(chain.id);
        state.rep+=4;
        addChronicle(`Cadena completada: ${chain.name}. El gremio recibe el título regional “${chain.rewardTitle}”.`);
      }else{
        const nextId=chain.missions.find(id=>!state.completedMissionIds.includes(id));
        const nextMission=DATA.missions.find(m=>m.id===nextId);
        if(nextMission) addChronicle(`La historia de “${chain.name}” continúa: se abre el siguiente capítulo, ${nextMission.name}.`);
      }
    }
  }

  function upgradeFacility(key){
    const info=DATA.facilities[key];
    if(!info) return;
    const level=state.facilities[key]||0;
    if(level>=3){notice('Esta instalación ya está al máximo.');return;}
    const cost=info.costs[level];
    if(state.gold<cost){notice(`Necesitas ${cost} oro.`);return;}
    state.gold-=cost;
    state.stats.goldSpent+=cost;
    state.stats.facilitySpent+=cost;
    state.facilities[key]=level+1;
    addChronicle(`${info.name} mejora a nivel ${level+1}.`);
    saveState(false);
    renderAll();
    notice(`${info.name} mejorada.`);
  }

  function planningModifiers(){
    const pace=DATA.planning.pace[state.planning.pace];
    const priority=DATA.planning.priority[state.planning.priority];
    const supply=DATA.planning.supplies[state.planning.supply];
    return {
      pace,priority,supply,
      chance:(pace.chance||0)+(priority.chance||0)+(supply.chance||0),
      injury:(pace.injury||0)+(priority.injury||0)+(supply.injury||0),
      reward:1+(pace.reward||0)+(priority.reward||0),
      treasure:priority.treasure||0,
      cost:Math.max(0,Math.round((supply.cost||0)*(1-veteranBonuses().supplyDiscount))),
      days:pace.days||0
    };
  }

  function stageFlavor(type){
    const pool=DATA.expeditionEvents[type]||[];
    return pool.length?rand(pool):null;
  }

  function applyFlavor(stage,type,lines){
    const e=stageFlavor(type);
    if(!e) return;
    stage.icon=e.icon;
    stage.title=e.title;
    stage.text=e.text;
    lines.push(`<p><b>${e.title}</b> · ${e.text}</p>`);
  }

  function addStageEffect(stage,text,kind=''){
    stage.effects.push({text,kind});
  }

  function applyClassMoment(party,stage,lines){
    const eligible=party.filter(h=>DATA.classMoments[h.cls]?.length);
    if(!eligible.length||Math.random()>0.78) return;
    const hero=rand(eligible);
    const text=`${hero.name} ${rand(DATA.classMoments[hero.cls])}.`;
    stage.icon=DATA.classes[hero.cls].icon;
    stage.title=`${hero.name} toma la iniciativa`;
    stage.text=text;
    addStageEffect(stage,`${hero.cls} · ${specializationData(hero)?.name||DATA.classes[hero.cls].role}`,'good');
    lines.push(`<p class="event"><b>Momento de clase:</b> ${text}</p>`);
  }

  function applyTraitMoment(party,stage,lines,extras){
    const actor=rand(party);
    const others=party.filter(h=>h.id!==actor.id);
    const target=others.length?rand(others):null;
    if(!actor||!target) return;
    const traits=actor.traits||[];

    if(traits.includes('Curioso')&&Math.random()<0.55){
      const bonus=12+Math.floor(Math.random()*24);
      extras.bonusGold+=bonus;
      stage.text=`${actor.name} revisa un rincón que el resto habría pasado por alto y encuentra un escondite.`;
      addStageEffect(stage,`Hallazgo +${bonus} oro`,'good');
      lines.push(`<p class="event"><b>Curiosidad:</b> ${stage.text}</p>`);
    }else if(traits.includes('Bromista')&&Math.random()<0.55){
      changeRelation(actor.id,target.id,4,0,Math.random()<0.15?1:0);
      stage.text=`${actor.name} consigue relajar a ${target.name} con una historia exagerada.`;
      addStageEffect(stage,`${actor.name} ↔ ${target.name} · Bond +4`,'bond');
      lines.push(`<p class="event"><b>Buen ánimo:</b> ${stage.text}</p>`);
    }else if((traits.includes('Leal')||traits.includes('Compasivo'))&&Math.random()<0.5){
      changeRelation(actor.id,target.id,4,0,Math.random()<0.12?1:0);
      stage.text=`${actor.name} se asegura de que ${target.name} esté bien antes de descansar.`;
      addStageEffect(stage,`${actor.name} ↔ ${target.name} · Bond +4`,'bond');
      lines.push(`<p class="event"><b>Compañerismo:</b> ${stage.text}</p>`);
    }else if(traits.includes('Codicioso')&&Math.random()<0.45){
      const bonus=15+Math.floor(Math.random()*26);
      extras.bonusGold+=bonus;
      changeRelation(actor.id,target.id,-2,4,0);
      stage.text=`${actor.name} encuentra unas monedas y tarda demasiado en decidir si debía compartirlas.`;
      addStageEffect(stage,`+${bonus} oro`,'good');
      addStageEffect(stage,`${actor.name} ↔ ${target.name} · Tensión +4`,'bad');
      lines.push(`<p class="event"><b>Tentación:</b> ${stage.text}</p>`);
    }
  }

  function personalityEvent(party,lines,stage){
    const actor=rand(party);
    const targets=party.filter(x=>x.id!==actor.id);
    if(!targets.length) return;
    const target=rand(targets);
    let bond=0,tension=0,attraction=0,text='';
    const t=actor.traits||[];

    if(t.includes('Protector')||t.includes('Leal')||t.includes('Compasivo')){
      text=`${actor.name} dedica parte del descanso a ayudar a ${target.name}.`;
      bond=7; attraction=oneIn(4)?3:0;
    }else if(t.includes('Impulsivo')){
      text=`${actor.name} insiste en que habrían podido avanzar más rápido. ${target.name} no está de acuerdo.`;
      bond=1;tension=6;
    }else if(t.includes('Bromista')){
      text=`${actor.name} hace reír a ${target.name} después de un día difícil.`;
      bond=6;attraction=oneIn(5)?3:0;
    }else if(t.includes('Ambicioso')){
      text=`${actor.name} habla de la gloria que traerá la misión; ${target.name} le recuerda que fue un esfuerzo de todos.`;
      tension=4;
    }else{
      text=`${actor.name} y ${target.name} comparten una guardia tranquila y hablan de su vida antes del gremio.`;
      bond=5;attraction=oneIn(6)?3:0;
    }

    const before=relation(actor.id,target.id).status;
    const r=changeRelation(actor.id,target.id,bond,tension,attraction);
    stage.text=text;
    if(bond) addStageEffect(stage,`${actor.name} ↔ ${target.name} · Bond ${bond>0?'+':''}${bond}`,'bond');
    if(tension) addStageEffect(stage,`${actor.name} ↔ ${target.name} · Tensión +${tension}`,'bad');
    if(attraction) addStageEffect(stage,`${actor.name} ↔ ${target.name} · Afinidad +${attraction}`,'bond');
    lines.push(`<p class="event"><b>Campamento:</b> ${text}</p>`);
    if(before!==r.status) addStageEffect(stage,`Relación: ${r.status}`,'good');
  }

  function chooseRescuer(party,target){
    const options=party.filter(x=>x.id!==target.id);
    return options.sort((a,b)=>{
      const ra=relation(a.id,target.id),rb=relation(b.id,target.id);
      return (rb.bond+traitScore(b,'social')*6)-(ra.bond+traitScore(a,'social')*6);
    })[0]||rand(options);
  }

  function combatEvent(party,mission,success,lines,stage,injuryMod){
    const pool=DATA.encounterPools[mission.type]||DATA.encounterPools.combat;
    const foe=rand(pool);
    stage.title=`Encuentro: ${foe}`;
    stage.text=`La party se topa con ${foe}. Cada miembro reacciona según su experiencia.`;

    const endangered=rand(party);
    const rescuer=chooseRescuer(party,endangered);
    if(rescuer){
      const rel=relation(rescuer.id,endangered.id);
      if(traitScore(rescuer,'social')+rel.bond/15>=3 || ['Paladin','Guerrero'].includes(rescuer.cls)){
        changeRelation(rescuer.id,endangered.id,6,0,oneIn(7)?2:0);
        addStageEffect(stage,`${rescuer.name} protege a ${endangered.name}`,'bond');
        lines.push(`<p>${DATA.classes[rescuer.cls].icon} ${rescuer.name} interviene cuando ${endangered.name} queda en peligro.</p>`);
      }
    }

    const dangerBase=(success?0.07:0.18)+mission.difficulty*0.025+injuryMod;
    party.forEach(h=>{
      if(Math.random()<Math.max(0.02,dangerBase+traitScore(h,'risk')*0.01)){
        const injury=createInjury(h,mission.difficulty,!success);
        addStageEffect(stage,`${h.name}: ${injury.name}`,'bad');
      }
    });

    addStageEffect(stage,success?'Objetivo asegurado':'Retirada organizada',success?'good':'bad');
  }

  function applyMotivationProgress(hero,mission,success){
    if(!success) return null;
    const id=hero.motivation;
    let match=false;
    if(id==='protect' && ['Paladin','Guerrero','Sacerdotisa'].includes(hero.cls)) match=true;
    if(id==='glory' && mission.difficulty>=3) match=true;
    if(id==='knowledge' && ['exploration','arcane','undead','legendary'].includes(mission.type)) match=true;
    if(id==='family' && mission.reward>=400) match=true;
    if(id==='wealth' && state.planning.priority==='treasure') match=true;
    if(id==='mastery') match=true;
    if(!match) return null;

    hero.storyProgress=(hero.storyProgress||0)+1;
    hero.motivationProgress=hero.storyProgress;

    const arc=DATA.characterArcs?.[id]||[];
    const milestone=arc.find(b=>hero.storyProgress>=b.need && !(hero.storyMilestones||[]).includes(b.id));
    if(!milestone) return {progressed:true,milestone:null};

    hero.storyMilestones=hero.storyMilestones||[];
    hero.storyMilestones.push(milestone.id);
    hero.lastStoryBeat=milestone.title;
    hero.xp+=20;
    addMemory(hero,`alcanzó el hito personal “${milestone.title}”: ${milestone.text}`);
    addChronicle(`${hero.name} vive un momento importante de su historia personal: ${milestone.title}.`);
    return {progressed:true,milestone};
  }

  function buildExpeditionChain(party,mission,plan){
    const travelPool=DATA.expeditionChains?.travel||[];
    const explorationPool=DATA.expeditionChains?.exploration||[];
    let travel=rand(travelPool);
    let exploration=rand(explorationPool);

    const hasScout=party.some(h=>h.cls==='Picaro'||h.cls==='Arquera'||['scout','ranger'].includes(h.specialization));
    const hasArcane=party.some(h=>h.cls==='Maga'||h.cls==='Sacerdotisa');
    const prudent=party.filter(h=>(h.traits||[]).includes('Prudente')).length;
    const impulsive=party.filter(h=>(h.traits||[]).includes('Impulsivo')).length;

    if((state.planning.supply==='maps'||hasScout) && Math.random()<0.6){
      exploration=explorationPool.find(e=>e.id==='shortcut')||exploration;
    }
    if(['arcane','undead','legendary'].includes(mission.type) && hasArcane && Math.random()<0.55){
      exploration=explorationPool.find(e=>e.id==='warning')||exploration;
    }
    if(state.planning.pace==='fast' && Math.random()<0.4){
      travel=travelPool.find(e=>e.id==='bad_weather')||travel;
    }
    if(state.planning.pace==='cautious' && Math.random()<0.5){
      travel=travelPool.find(e=>e.id==='quiet_road')||travel;
    }

    let chance=(travel?.chance||0)+(exploration?.chance||0);
    let injury=(travel?.injury||0)+(exploration?.injury||0);
    let treasure=(travel?.treasure||0)+(exploration?.treasure||0);

    if(hasScout){chance+=0.015;injury-=0.01;}
    if(hasArcane && ['arcane','undead','legendary'].includes(mission.type)) chance+=0.015;
    injury-=Math.min(0.03,prudent*0.01);
    injury+=Math.min(0.03,impulsive*0.01);

    const thread=`${travel?.title||'El viaje'} → ${exploration?.title||'La exploración'}`;
    return {
      travel,exploration,
      chance:clamp(chance,-0.08,0.12),
      injury:clamp(injury,-0.10,0.10),
      treasure:clamp(treasure,0,0.16),
      thread,
      hasScout,hasArcane
    };
  }

  function setExpeditionControls(running){
    $('dispatchBtn').disabled=running;
    $('missionSelect').disabled=running;
    $('paceSelect').disabled=running;
    $('prioritySelect').disabled=running;
    $('supplySelect').disabled=running;
    $('screen-mission').classList.toggle('expedition-running',running);
    document.querySelectorAll('.main-nav .nav-btn').forEach(btn=>btn.disabled=running);
  }

  function stageVisualClass(index){
    return ['stage-travel','stage-exploration','stage-encounter','stage-camp','stage-return'][index]||'stage-travel';
  }

  function featuredHeroForStage(stage,party,index){
    const named=party.find(h=>stage.text?.includes(h.name)||stage.title?.includes(h.name));
    return named||party[index%Math.max(1,party.length)]||party[0];
  }

  function partyTokens(party,featuredId=null,stageIndex=0){
    return party.map((h,i)=>{
      const cls=DATA.classes[h.cls];
      const spec=specializationData(h);
      const hasStoryBeat=stageIndex>=3 && !!expeditionView?.storyBeats?.some(x=>x.hero.id===h.id);
      const prepared=stageIndex===2 && (
        expeditionView?.chain?.exploration?.id==='shortcut' ||
        expeditionView?.chain?.exploration?.id==='warning'
      );
      const stateIcon=h.injury?'✚':hasStoryBeat?'✦':prepared?'◆':featuredId===h.id?'✦':'•';
      const classes=['story-hero-card'];
      if(h.injury) classes.push('injured');
      if(featuredId===h.id) classes.push('featured');
      if(prepared) classes.push('story-prepared');
      if(hasStoryBeat) classes.push('story-awakened');
      return `<div class="${classes.join(' ')}">
        <span class="story-hero-state">${stateIcon}</span>
        <div class="story-hero-portrait">${portraitHtml(h,'portrait-story')}</div>
        <div class="story-hero-info">
          <b>${h.name}</b>
          <small>${spec?.name||h.cls} · Nv.${h.level}${h.injury?' · '+h.injury.name:''}</small>
        </div>
      </div>`;
    }).join('');
  }

  function storyQuoteFor(stage,hero,index){
    const name=hero?.name||'La party';
    if(index===3 && hero && expeditionView?.storyBeats?.some(x=>x.hero.id===hero.id)){
      const beat=expeditionView.storyBeats.find(x=>x.hero.id===hero.id);
      return `“Creo que esta expedición cambió algo para mí.” — ${name} · ${beat?.milestone?.title||'Hito personal'}`;
    }
    const quotes=[
      `“Un buen viaje empieza antes de abandonar el camino conocido.” — ${name}`,
      `“Miremos dos veces. Los lugares viejos siempre guardan algo.” — ${name}`,
      `“Mantengan la formación. Salimos de aquí juntos.” — ${name}`,
      `“Mañana seguimos. Esta noche todavía somos compañeros alrededor del fuego.” — ${name}`,
      `“Que el gremio recuerde lo que encontramos aquí.” — ${name}`
    ];
    return quotes[index]||quotes[0];
  }

  function renderStoryConsequences(items){
    const box=$('recentConsequences');
    if(!items?.length){
      box.innerHTML='<div class="consequence-placeholder">Sin consecuencias visibles en esta etapa.</div>';
      return;
    }
    box.innerHTML=items.slice(0,3).map((e,i)=>{
      const icon=e.kind==='bad'?'!':e.kind==='bond'?'♥':e.kind==='good'?'✦':'◆';
      return `<div class="consequence-card ${e.kind||''}" style="animation-delay:${i*0.05}s">
        <strong>${icon}</strong>
        <span>${e.text}</span>
      </div>`;
    }).join('');
  }

  function renderStoryLog(){
    if(!expeditionView) return;
    const viewed=expeditionView.viewedStages||[];
    $('storyLog').innerHTML=viewed.length?viewed.map(i=>{
      const stage=expeditionView.stages[i];
      const kind=stage.effects.some(e=>e.kind==='bad')?'bad':stage.effects.some(e=>e.kind==='good')?'good':'';
      const label=stage.label.replace(/^ETAPA\s*\d+\s*·\s*/,'');
      return `<div class="story-log-row ${i===expeditionView.index?'current':''} ${kind}">[${label}] ${stage.title}</div>`;
    }).join(''):'<div class="story-log-row muted">La historia comenzará al enviar la party.</div>';
  }

  function renderStageEventList(stage,index){
    const effectRows=stage.effects.slice(0,2).map(e=>`<div class="stage-event">${e.kind==='bond'?'♥':e.kind==='bad'?'!':'◇'} ${e.text}</div>`).join('');
    $('stageEventList').innerHTML=`
      <div class="stage-event active">✦ ${stage.title}</div>
      ${effectRows}
      ${index<4?'<div class="stage-event muted">? La siguiente etapa permanece por descubrir...</div>':''}`;
  }

  function animateEventCard(){
    const card=document.querySelector('.event-card');
    if(!card) return;
    card.style.animation='none';
    void card.offsetWidth;
    card.style.animation='eventReveal .34s ease';
  }

  function renderExpeditionStage(){
    if(!expeditionView) return;
    const index=expeditionView.index;
    const stage=expeditionView.stages[index];
    const featured=featuredHeroForStage(stage,expeditionView.party,index);

    expeditionView.viewedStages=expeditionView.viewedStages||[];
    if(!expeditionView.viewedStages.includes(index)) expeditionView.viewedStages.push(index);

    $('expeditionTheater').classList.add('running');
    $('expeditionTheater').classList.remove('complete');
    $('expeditionTitle').textContent=expeditionView.mission.name;
    $('storyObjective').textContent=expeditionView.mission.desc;
    $('expeditionPartyVisual').innerHTML=partyTokens(expeditionView.party,featured?.id,index);

    const scene=$('storyScene');
    scene.classList.remove(
      'stage-travel','stage-exploration','stage-encounter','stage-camp','stage-return',
      'story-good','story-danger','story-bond',
      'theme-combat','theme-exploration','theme-escort','theme-undead','theme-arcane','theme-legendary'
    );
    scene.classList.add(stageVisualClass(index));
    scene.classList.add(`theme-${expeditionView.mission.type}`);
    scene.dataset.region=expeditionView.mission.region||'frontier';
    scene.classList.remove('stage-transition');
    void scene.offsetWidth;
    scene.classList.add('stage-transition');
    if(stage.effects.some(e=>e.kind==='bad')) scene.classList.add('story-danger');
    else if(stage.effects.some(e=>e.kind==='bond')) scene.classList.add('story-bond');
    else if(stage.effects.some(e=>e.kind==='good')) scene.classList.add('story-good');

    document.querySelectorAll('.exp-step').forEach((el,i)=>{
      el.classList.toggle('done',i<index);
      el.classList.toggle('active',i===index);
    });

    $('expeditionStageIcon').textContent=stage.icon;
    $('expeditionStageLabel').textContent=stage.label;
    $('expeditionStageTitle').textContent=stage.title;
    $('expeditionStageText').textContent=stage.text;

    $('storyEventIcon').textContent=stage.icon;
    $('storyEventTitle').textContent=stage.title;
    $('storyEventText').textContent=stage.text;
    $('storyQuote').textContent=storyQuoteFor(stage,featured,index);
    $('expeditionStageEffects').innerHTML=stage.effects.map(e=>`<span class="effect-chip ${e.kind||''}">${e.text}</span>`).join('');

    renderStageEventList(stage,index);
    renderStoryConsequences(stage.effects);
    renderStoryLog();
    animateEventCard();

    $('expeditionSummary').classList.add('is-hidden');
    $('expeditionContinueBtn').classList.remove('is-hidden');
    $('toggleReportBtn').classList.add('is-hidden');
    $('report').classList.add('is-hidden');
    $('reportActions').classList.add('is-hidden');
    $('expeditionContinueBtn').textContent=index===4?'Ver resumen →':'Continuar →';
  }

  function finishExpeditionPresentation(){
    if(!expeditionView) return;
    document.querySelectorAll('.exp-step').forEach(el=>{
      el.classList.remove('active');
      el.classList.add('done');
    });

    const scene=$('storyScene');
    scene.classList.remove('stage-travel','stage-exploration','stage-encounter','stage-camp');
    scene.classList.add('stage-return');

    $('expeditionTheater').classList.remove('running');
    $('expeditionTheater').classList.add('complete');
    $('expeditionStageIcon').textContent=expeditionView.success?'🏆':'🏠';
    $('expeditionStageLabel').textContent='EXPEDICIÓN COMPLETA';
    $('expeditionStageTitle').textContent=expeditionView.success?'La party regresa victoriosa':'La party consigue regresar';
    $('expeditionStageText').textContent=expeditionView.success
      ?'El contrato terminó. Las consecuencias ya forman parte de la historia del gremio.'
      :'El objetivo quedó pendiente, pero la historia de esta party continúa.';

    $('storyEventIcon').textContent=expeditionView.success?'🏆':'🏠';
    $('storyEventTitle').textContent=expeditionView.success?'Victoria':'Regreso al gremio';
    $('storyEventText').textContent=expeditionView.success
      ?'El Grifo de Plata recibe a la party con el contrato cumplido.'
      :'El gremio recibe al grupo y comienza a preparar la siguiente oportunidad.';
    $('storyQuote').textContent=expeditionView.success
      ?'“Hoy volvemos con una historia que vale la pena contar.”'
      :'“Volver juntos también forma parte de ser aventurero.”';
    $('expeditionStageEffects').innerHTML='';

    $('expeditionSummary').innerHTML=expeditionView.summary.map(item=>`
      <div class="summary-card ${item.kind||''}">
        <strong>${item.title}</strong>${item.text}
      </div>`).join('');
    $('expeditionSummary').classList.remove('is-hidden');

    renderStoryConsequences(expeditionView.summary.slice(0,3).map(x=>({text:`${x.title}: ${x.text}`,kind:x.kind})));
    $('stageEventList').innerHTML='<div class="stage-event active">✓ La expedición ha terminado.</div><div class="stage-event">La crónica del gremio fue actualizada.</div>';
    renderStoryLog();
    animateEventCard();

    $('expeditionContinueBtn').classList.add('is-hidden');
    $('toggleReportBtn').classList.remove('is-hidden');
    $('reportActions').classList.remove('is-hidden');
    setExpeditionControls(false);
  }

  function advanceExpedition(){
    if(!expeditionView) return;
    if(expeditionView.index<4){
      expeditionView.index++;
      renderExpeditionStage();
    }else finishExpeditionPresentation();
  }

  function dispatch(){
    const party=state.selected.map(member).filter(canDeploy);
    if(party.length<2){notice('Necesitas al menos 2 aventureros disponibles.');return;}

    const mission=DATA.missions.find(m=>m.id===$('missionSelect').value);
    if(!mission){notice('Selecciona un contrato disponible.');return;}

    const plan=planningModifiers();
    if(state.gold<plan.cost){notice(`Necesitas ${plan.cost} oro para esos suministros.`);return;}
    state.gold-=plan.cost;
    state.stats.goldSpent+=plan.cost;
    state.stats.supplySpent+=plan.cost;

    const syn=partySynergy(party);
    const chemistry=partyChemistry(party);
    const roleMods=specializationPartyModifiers(party,mission);
    const chain=buildExpeditionChain(party,mission,plan);
    const veteran=veteranBonuses();
    const libBonus=(state.facilities.library||0)*0.015+veteran.knowledge;
    const rawPower=party.reduce((sum,h)=>sum+heroPower(h),0)+syn.bonus;
    const target=mission.difficulty*25+party.length*8;
    const chance=clamp(
      0.46+(rawPower-target)/100+plan.chance+libBonus+roleMods.success+chain.chance+veteran.success,
      0.12,0.95
    );
    const success=Math.random()<chance;
    const days=Math.max(1,mission.days+plan.days);
    const extras={bonusGold:0};
    const lines=[];
    const heroResults=[];
    const leveledHeroes=[];
    const storyBeats=[];
    const beforeInjury=new Map(party.map(h=>[h.id,h.injury?.id||null]));

    const stages=[
      {
        icon:'🗺️',label:'ETAPA 1 · VIAJE',
        title:chain.travel?.title||`Rumbo a ${mission.name}`,
        text:chain.travel?.text||`La party inicia un viaje de ${days} días.`,
        effects:[]
      },
      {
        icon:'🔎',label:'ETAPA 2 · EXPLORACIÓN',
        title:chain.exploration?.title||'El grupo estudia la zona',
        text:chain.exploration?.text||'La party estudia el terreno antes de seguir.',
        effects:[]
      },
      {
        icon:'⚔️',label:'ETAPA 3 · ENCUENTRO',
        title:'El momento decisivo',
        text:`Lo aprendido durante “${chain.exploration?.title||'la exploración'}” condiciona cómo llega la party al peligro.`,
        effects:[]
      },
      {
        icon:'🔥',label:'ETAPA 4 · CAMPAMENTO',
        title:success?'Una noche después de la victoria':'Una noche para recomponerse',
        text:success
          ?`Alrededor del fuego, el grupo recuerda cómo ${chain.travel?.title?.toLowerCase()||'el viaje'} terminó llevándolos hasta este resultado.`
          :`La party repasa dónde cambió el rumbo de la expedición y qué puede aprender de ello.`,
        effects:[]
      },
      {
        icon:'🏰',label:'ETAPA 5 · REGRESO',
        title:'De vuelta al gremio',
        text:'El Grifo de Plata espera noticias.',
        effects:[]
      }
    ];

    lines.push(`<p><b>${mission.name}</b> · ${party.map(h=>h.name).join(', ')}</p>`);
    lines.push(`<p class="muted">Plan: ${plan.pace.name} · ${plan.priority.name} · ${plan.supply.name}</p>`);
    lines.push(`<p><b>Hilo de expedición:</b> ${chain.thread}</p>`);
    lines.push(`<p>Éxito estimado: <b>${Math.round(chance*100)}%</b></p>`);

    addStageEffect(stages[0],chain.travel?.tag||'Viaje','');
    addStageEffect(stages[0],`${plan.pace.name} · ${plan.priority.name}`,'');
    if(chain.travel?.chance>0) addStageEffect(stages[0],'El viaje mejora las opciones del grupo','good');
    if(chain.travel?.injury>0) addStageEffect(stages[0],'El camino desgasta a la party','bad');
    if(plan.cost) addStageEffect(stages[0],`Suministros: -${plan.cost} oro`,'');
    syn.notes.forEach(n=>addStageEffect(stages[0],n,'good'));
    roleMods.notes.forEach(n=>addStageEffect(stages[0],n,'good'));
    addStageEffect(stages[0],`Química: ${chemistry.label}`,chemistry.score>=10?'bond':'');
    lines.push(`<p><b>${stages[0].title}:</b> ${stages[0].text}</p>`);

    addStageEffect(stages[1],chain.exploration?.tag||'Exploración','');
    if(chain.exploration?.chance>0) addStageEffect(stages[1],'Ventaja para el encuentro','good');
    if(chain.exploration?.treasure>0) addStageEffect(stages[1],'Posible hallazgo adicional','good');
    if(chain.exploration?.injury>0) addStageEffect(stages[1],'Mala posición para el peligro','bad');
    lines.push(`<p><b>${stages[1].title}:</b> ${stages[1].text}</p>`);
    applyClassMoment(party,stages[1],lines);
    applyTraitMoment(party,stages[1],lines,extras);

    combatEvent(
      party,mission,success,lines,stages[2],
      (plan.injury+roleMods.injury+chain.injury)*(DATA.balance?.injuryRiskScale||1)
    );
    addStageEffect(
      stages[2],
      `Consecuencia: ${chain.exploration?.title||'la exploración previa'}`,
      chain.chance>=0?'good':'bad'
    );

    personalityEvent(party,lines,stages[3]);
    addStageEffect(stages[3],`Historia conectada: ${chain.thread}`,'');
    if(party.length>=3&&oneIn(3)) applyTraitMoment(party,stages[3],lines,extras);

    let baseGain=Math.round(
      mission.reward*(success?(0.85+Math.random()*0.35):(0.1+Math.random()*0.15))*plan.reward*(DATA.balance?.expeditionRewardScale||1)
    );
    if(
      (state.planning.priority==='treasure'||roleMods.treasure>0||chain.treasure>0) &&
      Math.random()<0.30+plan.treasure+roleMods.treasure+chain.treasure
    ){
      const treasure=25+Math.floor(Math.random()*(35+mission.difficulty*20));
      extras.bonusGold+=treasure;
      addStageEffect(stages[1],`Hallazgo ligado a la ruta: +${treasure} oro`,'good');
    }

    const gain=baseGain+extras.bonusGold;
    state.gold+=gain;
    state.stats.goldEarned+=gain;
    state.stats.missions++;
    if(success) state.stats.wins++;
    else state.stats.losses++;

    const oldRep=state.rep;
    if(success) state.rep+=4+mission.difficulty*2;
    else state.rep=Math.max(0,state.rep-1);

    party.forEach(h=>{
      h.expeditions++;
      h.missionTypes[mission.type]=(h.missionTypes[mission.type]||0)+1;
      if(success) h.wins++;

      const training=state.facilities.training||0;
      const xp=Math.round((success?38+mission.difficulty*23:18+mission.difficulty*10)*(1+training*0.1+veteran.xp));
      h.xp+=xp;

      const story=applyMotivationProgress(h,mission,success);
      const leveled=levelHeroIfNeeded(h);
      if(leveled) leveledHeroes.push(h);

      addStageEffect(stages[3],`${h.name} +${xp} XP`,leveled?'good':'');
      if(h.injury) addStageEffect(stages[3],`${h.name}: ${h.injury.name} · ${h.injury.daysLeft}d`,'bad');

      if(story?.milestone){
        storyBeats.push({hero:h,milestone:story.milestone});
        addStageEffect(stages[3],`${h.name}: ${story.milestone.title}`,'good');
      }else if(story?.progressed){
        const arc=characterArcStatus(h);
        if(arc.next) addStageEffect(stages[3],`${h.name}: historia personal ${arc.progress}/${arc.next.need}`,'');
      }

      heroResults.push({
        title:`${DATA.classes[h.cls].icon} ${h.name}`,
        text:`+${xp} XP · Nv.${h.level}${h.injury?' · '+h.injury.name:' · Sano'}`,
        kind:h.injury?'':'good'
      });
    });

    if(storyBeats.length){
      const lead=storyBeats[0];
      stages[3].icon='✦';
      stages[3].title=`${lead.hero.name}: ${lead.milestone.title}`;
      stages[3].text=`${lead.milestone.text} Para ${lead.hero.name}, esta expedición ya no es solo otro contrato.`;
    }

    const tavern=state.facilities.tavern||0;
    for(let i=0;i<party.length;i++){
      for(let j=i+1;j<party.length;j++){
        const social=(traitScore(party[i],'social')+traitScore(party[j],'social'))/2;
        const bond=Math.round((Math.max(0,1+Math.round(social/2))+Math.min(1,tavern))*(DATA.balance?.relationshipBondScale||1));
        const current=relation(party[i].id,party[j].id);
        const attraction=current.bond>=22 && Math.random()<(0.16+tavern*0.04)
          ?2+Math.min(2,tavern)
          :(oneIn(22)?1:0);
        changeRelation(party[i].id,party[j].id,bond,success?0:1,attraction);
      }
    }

    let lost=null;
    if(!success&&mission.difficulty>=4){
      const danger=party.filter(h=>h.injury?.severity===3);
      if(danger.length&&Math.random()<(DATA.balance?.deathBase||0.02)+mission.difficulty*(DATA.balance?.deathPerDifficulty||0.003)){
        lost=rand(danger);
        lost.alive=false;
        state.stats.deaths++;
        state.selected=state.selected.filter(id=>id!==lost.id);
        addChronicle(`${lost.name} murió durante ${mission.name}.`);
        addMemory(lost,`su última expedición fue ${mission.name}.`);
        addStageEffect(stages[4],`${lost.name} no regresó`,'bad');
      }
    }

    const newlyInjured=party.filter(h=>h.injury && beforeInjury.get(h.id)!==h.injury.id);

    state.missionsDone++;
    applyWorldMemory(mission,success);
    updateGuildIdentity(mission,success,party);
    advanceDays(days,{recover:false});
    processRelationships(false);
    if(oldRep!==state.rep) checkRegionUnlocks();

    const guildMoment=triggerContextualGuildMoment(party,{injured:newlyInjured,leveled:leveledHeroes});
    if(!guildMoment && Math.random()<0.28) triggerGuildLifeEvent(false);

    const returnText=success
      ?rand([
        `La party regresa con el contrato cumplido y ${gain} monedas. En la sala común ya comentan “${chain.thread}”.`,
        `El grupo cruza las puertas del gremio cansado, satisfecho y con ${gain} monedas. La ruta que tomaron ya forma parte del relato.`,
        `Las noticias de la victoria llegan junto a los aventureros. El gremio recibe ${gain} monedas y una nueva historia.`
      ])
      :rand([
        `El grupo regresa antes de lo esperado. El objetivo quedó pendiente, pero todos recuerdan dónde cambió el rumbo: ${chain.thread}.`,
        `La expedición termina en retirada. Lo ocurrido durante el viaje y la exploración será parte de la próxima preparación.`,
        `El regreso es más silencioso. La misión falló, aunque el grupo vuelve con ${gain} monedas y experiencia real.`
      ]);

    stages[4].text=returnText;
    addStageEffect(stages[4],`+${gain} oro`,'good');
    addStageEffect(stages[4],`Reputación ${state.rep}`,success?'good':'');
    addStageEffect(stages[4],`Hilo recordado: ${chain.thread}`,'');
    if(extras.bonusGold) addStageEffect(stages[4],`Hallazgos +${extras.bonusGold}`,'good');
    storyBeats.forEach(x=>addStageEffect(stages[4],`${x.hero.name}: ${x.milestone.title}`,'good'));
    if(guildMoment) addStageEffect(stages[4],`En el gremio: ${guildMoment.title}`,'bond');

    addChronicle(
      `${party.map(h=>h.name).join(', ')} ${success?'completaron':'regresaron de'} ${mission.name}. ${chain.thread}.`
    );
    lines.push(`<p class="${success?'good':'bad'}"><b>${success?'✓ Victoria':'↩ Retirada'} · +${gain} oro</b></p>`);

    const summary=[
      {title:success?'✓ Victoria':'↩ Retirada',text:`${mission.name} · ${days} días`,kind:success?'good':'bad'},
      {title:'Hilo de la historia',text:chain.thread,kind:''},
      {title:'Tesorería',text:`+${gain} oro · Total ${state.gold}`,kind:'good'},
      {title:'Plan',text:`${plan.pace.name} · ${plan.priority.name} · ${plan.supply.name}`,kind:''},
      ...heroResults
    ];
    storyBeats.forEach(x=>summary.push({
      title:`✦ ${x.hero.name}`,
      text:x.milestone.title,
      kind:'good'
    }));
    if(lost) summary.push({title:`☠ ${lost.name}`,text:'No regresó de la expedición.',kind:'bad'});

    $('report').innerHTML=lines.join('');
    $('resultTag').textContent=success?'Victoria':'Retirada';

    expeditionView={
      mission,party,stages,summary,success,index:0,viewedStages:[],
      chain,
      storyBeats
    };
    saveState(false);
    renderAll();
    navigate('mission');
    setExpeditionControls(true);
    renderExpeditionStage();
    notice('La expedición ha comenzado.');
  }

  function navigate(screen){
    if(screen==='detail'&&!currentDetailId) screen='adventurers';
    currentScreen=screen;
    document.querySelectorAll('[data-screen-panel]').forEach(panel=>{
      panel.classList.toggle('active',panel.dataset.screenPanel===screen);
    });
    document.querySelectorAll('button[data-screen]').forEach(btn=>{
      const active=btn.dataset.screen===screen||(screen==='detail'&&btn.dataset.screen==='adventurers');
      btn.classList.toggle('active',active);
    });
    if(screen==='detail') renderDetail();
    if(screen==='party') renderPartySummary();
    if(screen==='mission') renderMission();
    if(screen==='legacy') renderLegacy();
  }

  function renderDiagnostics(){
    const stats=state.stats;
    const missions=Math.max(0,stats.missions||0);
    const wins=stats.wins||0;
    const winRate=missions?Math.round(wins/missions*100):0;
    const injuryRate=missions?((stats.injuries||0)/missions):0;
    const net=(stats.goldEarned||0)-(stats.goldSpent||0);
    const active=activeMembers();
    const avgLevel=active.length?(active.reduce((sum,h)=>sum+h.level,0)/active.length):0;
    const meaningful=Object.values(state.relations).filter(r=>
      r.bond>=15||r.tension>=20||r.attraction>=20||r.romance||r.married
    ).length;
    const elapsed=(state.year-1)*90+(state.day-1);

    $('winRateStat').textContent=missions?`${wins}/${missions} · ${winRate}%`:'Sin datos';
    $('goldFlowStat').textContent=missions?`${net>=0?'+':''}${net} oro`:`${state.gold} actual`;
    $('injuryRateStat').textContent=missions?`${(injuryRate).toFixed(1)} / misión`:'Sin datos';
    $('relationshipStat').textContent=`${meaningful} vínculos`;
    $('avgLevelStat').textContent=active.length?avgLevel.toFixed(1):'—';
    $('campaignAgeStat').textContent=`${elapsed} días`;

    const notes=[];
    if(missions<4){
      notes.push('Juega al menos 4 expediciones para que las señales de balance sean útiles.');
    }else{
      if(winRate>82) notes.push('Las victorias están siendo muy frecuentes; prueba contratos más difíciles o planes menos conservadores.');
      else if(winRate<42) notes.push('La tasa de éxito es baja; revisa composición, suministros y dificultad.');
      else notes.push('La tasa de victorias está dentro de un rango saludable.');

      if(injuryRate>1.0) notes.push('Se están acumulando muchas heridas por misión.');
      else if(injuryRate<0.15) notes.push('Las heridas aparecen muy poco; el riesgo puede sentirse débil.');
      else notes.push('La frecuencia de heridas parece razonable.');

      const netPerMission=net/missions;
      if(netPerMission>350) notes.push('La economía está creciendo muy rápido.');
      else if(netPerMission<-80) notes.push('La campaña está perdiendo oro de forma sostenida.');
      else notes.push('El flujo de oro no muestra una desviación fuerte.');

      if(missions>=10 && meaningful<2) notes.push('Las relaciones están evolucionando lentamente para la cantidad de expediciones jugadas.');
    }
    $('balanceNotes').textContent=notes.join(' ');
  }

  function updateGuildIdentity(mission=null,success=null,party=[]){
    const scores=state.guildIdentityScores;
    if(mission){
      if(state.planning.priority==='safety') scores.protector+=2;
      if(state.planning.priority==='treasure') scores.mercenary+=2;
      if(state.planning.supply==='maps'||mission.type==='exploration') scores.explorer+=2;
      if(['arcane','undead','legendary'].includes(mission.type)) scores.scholar+=1;
      if(success){
        scores.renowned+=1+Math.max(0,mission.difficulty-2);
        if(party.length && party.every(h=>!h.injury)) scores.protector+=1;
      }
      if((state.completedMissionChains||[]).length) scores.renowned+=0.5;
    }

    const meaningful=Object.values(state.relations||{}).filter(r=>r.bond>=40||r.romance||r.married).length;
    scores.fellowship=Math.max(scores.fellowship||0,Math.floor(meaningful/2)+(state.children?.length||0));
    scores.scholar=Math.max(scores.scholar||0,(state.facilities.library||0)*2);
    scores.explorer=Math.max(scores.explorer||0,(state.missionHistory?.forest||0)+(state.missionHistory?.watchtower||0));
    scores.renowned=Math.max(scores.renowned||0,Math.floor(state.rep/5));

    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    const [key,value]=ranked[0]||['renowned',0];
    const identity=DATA.guildIdentities?.[key];
    state.guildTitle=value>=3&&identity?identity.name:'Gremio en formación';
    return identity&&value>=3?identity:null;
  }

  function renderHeader(){
    const guildIdentity=updateGuildIdentity();
    $('goldStat').textContent=state.gold;
    $('dayStat').textContent=state.day;
    $('yearStat').textContent=state.year;
    $('repStat').textContent=state.rep;
    $('missionsStat').textContent=state.missionsDone;
    $('partyNavCount').textContent=`${state.selected.length}/4`;

    const active=activeMembers();
    $('guildMembers').textContent=active.length;
    $('guildInjured').textContent=active.filter(h=>h.injury).length;
    $('guildAvailable').textContent=active.filter(canDeploy).length;
    $('latestEvent').textContent=state.chronicle[0]||'Sin acontecimientos.';

    $('overviewTotal').textContent=active.length;
    $('overviewHealthy').textContent=active.filter(h=>!h.injury).length;
    $('overviewInjured').textContent=active.filter(h=>h.injury).length;
    $('overviewParty').textContent=state.selected.length;
    $('rosterCount').textContent=`${active.length} miembro${active.length===1?'':'s'}`;
    $('chronicleCount').textContent=`${state.chronicle.length} eventos`;
    if($('guildIdentityTitle')) $('guildIdentityTitle').textContent=guildIdentity?`${guildIdentity.icon} ${guildIdentity.name}`:'Gremio en formación';
    if($('guildIdentityDesc')) $('guildIdentityDesc').textContent=guildIdentity?.desc||'Las decisiones del gremio irán definiendo cómo lo ve el mundo.';
  }

  function renderApplicants(){
    const box=$('applicants');
    box.innerHTML='';
    state.applicants.slice(0,6).forEach(a=>{
      const c=DATA.classes[a.cls];
      const mot=DATA.motivations.find(m=>m.id===a.motivation);
      const el=document.createElement('div');
      el.className='applicant-card';
      el.innerHTML=`
        <div class="hero-name hero-name-art">${classIconHtml(a.cls,a.cls)} <span>${a.name}${a.legacy?' <span class="heir-badge">· Legado</span>':''}</span></div>
        <div class="small">${a.cls} · ${c.role}</div>
        <div class="tiny">${a.traits.join(' · ')}</div>
        <div class="tiny">${a.origin} · ${mot?.name||''}</div>
        <div class="tiny">Edad ${a.age} · Gen. ${a.generation||1}</div>
        <button type="button">${a.cost} oro · Reclutar</button>`;
      el.querySelector('button').addEventListener('click',()=>recruit(a.id));
      box.appendChild(el);
    });
  }

  function renderFacilities(){
    $('facilities').innerHTML=Object.entries(DATA.facilities).map(([key,f])=>{
      const level=state.facilities[key]||0;
      const max=level>=3;
      const cost=max?'MAX':`${f.costs[level]} oro`;
      return `<div class="facility-card facility-card-art" data-level="${level}">
        <span class="facility-art facility-${key}" aria-hidden="true"></span>
        <span><b>${f.name}</b> <span class="level">Nv.${level}</span><br><span class="tiny">${f.desc}</span></span>
        <button type="button" data-facility="${key}" ${max?'disabled':''}>${cost}</button>
      </div>`;
    }).join('');
    document.querySelectorAll('[data-facility]').forEach(btn=>{
      btn.addEventListener('click',()=>upgradeFacility(btn.dataset.facility));
    });
    $('guildLifeEvent').textContent=state.lastGuildEvent||'El gremio está tranquilo hoy.';
  }

  function renderAdventurers(){
    const box=$('adventurerList');
    const active=activeMembers();
    if(!active.length){
      box.innerHTML='<div class="applicant-card">Todavía no has reclutado a nadie.</div>';
      return;
    }
    box.innerHTML='';
    active.forEach(h=>{
      const spec=specializationData(h);
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='adventurer-row';
      btn.innerHTML=`
        <span class="class-icon">${classIconHtml(h.cls,h.cls)}</span>
        <span><span class="hero-name">${h.name} · Nv.${h.level}</span><br>
        <span class="tiny">${spec?.name||h.cls} · ${h.age} años · Gen.${h.generation||1}${h.injury?' · '+h.injury.name+' '+h.injury.daysLeft+'d':''}</span>
        ${heroTitles(h).length?`<br><span class="tiny heir-badge">✦ ${heroTitles(h)[0]}</span>`:''}</span>
        <span class="chevron">›</span>`;
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
    if(!h||h.alive===false){currentDetailId=null;navigate('adventurers');return;}
    const cls=DATA.classes[h.cls];
    const spec=specializationData(h);
    const mot=motivationData(h);

    $('detailPortrait').innerHTML=portraitHtml(h,'portrait-detail');
    $('detailName').textContent=h.name;
    $('detailMeta').textContent=`${spec?.name||h.cls} · Nv.${h.level} · ${h.age} años · Gen.${h.generation||1}`;
    $('detailStatusBadge').textContent=h.retired?'Veterano retirado':h.injury?`${h.injury.name} · ${h.injury.daysLeft} días`:'Activo y sano';

    const titles=heroTitles(h);
    const arc=characterArcStatus(h);
    const arcProgress=arc.complete
      ?'Arco completado'
      :arc.next
        ?`${arc.progress}/${arc.next.need} hacia “${arc.next.title}”`
        :'Historia en desarrollo';
    const scars=(h.scars||[]).map(s=>`<span class="story-scar">✦ ${s.title}</span>`).join('');

    $('detailIdentity').innerHTML=`
      <span class="detail-pill"><b>Origen</b><br>${h.origin}</span>
      <span class="detail-pill"><b>Motivación</b><br>${mot.name}<br><span class="tiny">${mot.desc}</span></span>
      <span class="detail-pill"><b>Rasgos</b><br>${h.traits.join(' · ')}</span>
      <span class="detail-pill character-story-pill"><b>Historia personal</b><br>
        <span class="story-arc-title">${arc.latest?.title||'El comienzo de una historia'}</span><br>
        <span class="tiny">${arc.latest?.text||mot.desc}</span><br>
        <span class="story-progress">${arcProgress}</span>
      </span>
      <span class="detail-pill"><b>Títulos e hitos</b><br>
        <span class="title-list">${titles.length?titles.map(t=>`<span class="title-badge">${t}</span>`).join(''):'<span class="tiny">Todavía no ha ganado ningún título.</span>'}</span>
      </span>
      ${scars?`<span class="detail-pill"><b>Cicatrices y marcas</b><br><span class="story-scar-list">${scars}</span></span>`:''}`;

    $('detailState').innerHTML=`
      <span class="detail-pill"><b>XP</b> ${h.xp}/${threshold(h.level)}</span>
      <span class="detail-pill"><b>Expediciones</b> ${h.expeditions}</span>
      <span class="detail-pill ${h.injury?'injury-pill':''}"><b>Salud</b><br>${h.injury?`${h.injury.name} · ${h.injury.daysLeft} días<br><span class="tiny">${h.injury.desc}</span>`:'Sano'}</span>
      <span class="detail-pill"><b>Objetivo personal</b><br>${mot.name}<br><span class="tiny">${arcProgress}</span></span>`;

    if(spec){
      $('detailSpecialization').innerHTML=`<span class="detail-pill"><b>${spec.name}</b><br>${spec.ability}<br><span class="tiny">${spec.desc}</span></span>`;
    }else if(h.level>=4&&!h.retired){
      $('detailSpecialization').innerHTML=`<div class="spec-choice">${(DATA.specializations[h.cls]||[]).map(s=>`
        <button type="button" data-spec="${s.id}"><b>${s.name}</b><br><span class="tiny">${s.desc}</span></button>`).join('')}</div>`;
      document.querySelectorAll('[data-spec]').forEach(btn=>btn.addEventListener('click',()=>chooseSpecialization(h,btn.dataset.spec)));
    }else{
      $('detailSpecialization').innerHTML='<span class="detail-pill">Las especializaciones se desbloquean en nivel 4.</span>';
    }

    const rels=[];
    Object.entries(state.relations).forEach(([key,r])=>{
      const ids=key.split('-').map(Number);
      if(!ids.includes(h.id)) return;
      const other=member(ids[0]===h.id?ids[1]:ids[0]);
      if(other) rels.push({other,r});
    });
    rels.sort((a,b)=>Math.max(b.r.bond,b.r.attraction)-Math.max(a.r.bond,a.r.attraction));
    let relHtml=rels.length?rels.slice(0,5).map(x=>`
      <span class="detail-pill"><b>${x.other.name}</b> · ${relationStatus(x.r)}<br>
      <span class="tiny">Bond ${x.r.bond} · Tensión ${x.r.tension}${x.r.attraction?' · Atracción '+x.r.attraction:''}</span></span>`).join(''):'<span class="detail-pill">Sin vínculos significativos todavía.</span>';
    const kids=state.children.filter(c=>c.parentIds.includes(h.id));
    if(kids.length) relHtml+=kids.map(c=>`<span class="detail-pill"><b>${c.name}</b> · descendiente · ${c.age} años · Gen.${c.generation}</span>`).join('');
    $('detailRelations').innerHTML=relHtml;

    const storyHistory=[];
    if(h.lastStoryBeat) storyHistory.push(`<span class="detail-pill story-highlight"><b>Último hito personal</b><br>${h.lastStoryBeat}</span>`);
    (h.memory?.length?h.memory:['Su historia en el gremio apenas comienza.']).forEach(x=>storyHistory.push(`<span class="detail-pill">${x}</span>`));
    $('detailHistory').innerHTML=storyHistory.join('');

    const add=$('detailAddPartyBtn');
    if(h.retired){
      add.classList.add('is-hidden');
    }else{
      add.classList.remove('is-hidden');
      const selected=state.selected.includes(h.id);
      add.disabled=!selected&&!canDeploy(h) || (!selected&&state.selected.length>=4);
      add.textContent=selected?'Quitar de Party':!canDeploy(h)?'Necesita recuperarse':'Añadir a Party';
    }

    const retire=$('retireBtn');
    const eligible=!h.retired&&(h.age>=45||(h.level>=6&&h.expeditions>=10));
    retire.classList.toggle('is-hidden',!eligible);
  }

  function renderRoster(){
    const box=$('roster');
    const active=activeMembers();
    if(!active.length){
      box.innerHTML='<div class="party-row"><div class="small" style="padding:12px">No hay aventureros activos.</div></div>';
      $('partyInfo').textContent='0 / 4';
      return;
    }
    box.innerHTML='';
    active.forEach(h=>{
      const el=document.createElement('div');
      el.className='party-row';
      const checked=state.selected.includes(h.id);
      const deploy=canDeploy(h);
      el.innerHTML=`<label>
        <input type="checkbox" ${checked?'checked':''} ${!deploy&&!checked?'disabled':''}>
        <span><span class="hero-name hero-name-art">${classIconHtml(h.cls,h.cls)} <span>${h.name} · Nv.${h.level}</span></span><br>
        <span class="tiny">${specializationData(h)?.name||h.cls} · ${h.traits.join(' + ')}${h.injury?' · '+h.injury.name+' '+h.injury.daysLeft+'d':''}</span></span>
      </label>`;
      const input=el.querySelector('input');
      input.addEventListener('change',e=>toggleParty(h.id,e.target.checked));
      box.appendChild(el);
    });
    $('partyInfo').textContent=`${state.selected.length} / 4`;
  }

  function renderPartySummary(){
    const party=state.selected.map(member).filter(Boolean);
    const slots=[];
    for(let i=0;i<4;i++){
      const h=party[i];
      slots.push(h
        ?`<div class="party-slot party-slot-art"><b>${i+1}.</b> ${classIconHtml(h.cls,h.cls)} <span>${h.name} · ${specializationData(h)?.name||h.cls}</span></div>`
        :`<div class="party-slot empty"><b>${i+1}.</b> — vacío —</div>`);
    }
    $('partySlots').innerHTML=slots.join('');
    const syn=partySynergy(party);
    $('partySynergy').innerHTML=`<strong>Sinergias</strong><br>${syn.notes.length?syn.notes.join(' · '):'Sin bonificaciones especiales'}`;
    const chem=partyChemistry(party);
    $('partyChemistry').innerHTML=`<strong>${chem.label}</strong><br>${chem.detail}`;
  }

  function fillPlanningSelect(selectId,obj,current){
    const sel=$(selectId);
    if(!sel.options.length){
      Object.entries(obj).forEach(([key,v])=>{
        const o=document.createElement('option');
        o.value=key;o.textContent=v.name;sel.appendChild(o);
      });
    }
    sel.value=current;
  }

  function renderMission(){
    fillPlanningSelect('paceSelect',DATA.planning.pace,state.planning.pace);
    fillPlanningSelect('prioritySelect',DATA.planning.priority,state.planning.priority);
    fillPlanningSelect('supplySelect',DATA.planning.supplies,state.planning.supply);

    const select=$('missionSelect');
    const current=select.value;
    const missions=unlockedMissions();
    select.innerHTML='';
    missions.forEach(m=>{
      const reg=DATA.regions.find(r=>r.id===m.region);
      const o=document.createElement('option');
      o.value=m.id;
      const chain=missionChainFor(m.id);
      const idx=chain?chain.missions.indexOf(m.id)+1:0;
      o.textContent=`${'★'.repeat(m.difficulty)} · ${m.name} · ${reg?.name||''}${chain?` · ${chain.name} ${idx}/${chain.missions.length}`:''}`;
      select.appendChild(o);
    });
    if(current&&missions.some(m=>m.id===current)) select.value=current;
    const m=missions.find(x=>x.id===select.value)||missions[0];
    if(!m){
      $('missionDetails').textContent='No hay contratos disponibles.';
      return;
    }
    const region=DATA.regions.find(r=>r.id===m.region);
    $('screen-mission').dataset.region=m.region||'frontier';
    $('missionDetails').innerHTML=`<b>${m.name}</b> <span class="mission-region">${region?.name||''}</span><br>
      <span class="small">${m.desc}</span><br><br>
      Dificultad: ${'★'.repeat(m.difficulty)}${'☆'.repeat(Math.max(0,5-m.difficulty))} · Duración base: ${m.days} días · Recompensa: ${m.reward} oro`;

    renderPlanSummary();
    renderMissionParty();
  }

  function renderPlanSummary(){
    state.planning.pace=$('paceSelect').value||state.planning.pace;
    state.planning.priority=$('prioritySelect').value||state.planning.priority;
    state.planning.supply=$('supplySelect').value||state.planning.supply;
    const p=planningModifiers();
    const pct=Math.round(p.chance*100);
    const risk=Math.round(p.injury*100);

    const party=state.selected.map(member).filter(canDeploy);
    const mission=DATA.missions.find(m=>m.id===$('missionSelect').value);
    let estimate='';
    if(party.length>=2&&mission){
      const syn=partySynergy(party);
      const roleMods=specializationPartyModifiers(party,mission);
      const libBonus=(state.facilities.library||0)*0.015;
      const rawPower=party.reduce((sum,h)=>sum+heroPower(h),0)+syn.bonus;
      const target=mission.difficulty*25+party.length*8;
      const chance=clamp(0.46+(rawPower-target)/100+p.chance+libBonus+roleMods.success,0.12,0.95);
      const finalRisk=p.injury+roleMods.injury;
      estimate=`<br><b>Estimación con esta party:</b> ${Math.round(chance*100)}% de éxito · riesgo ${Math.round(finalRisk*100)>=0?'+':''}${Math.round(finalRisk*100)}%`;
      if(roleMods.notes.length) estimate+=`<br><span class="tiny">Especializaciones activas: ${roleMods.notes.join(' · ')}</span>`;
    }else{
      estimate='<br><span class="tiny">Forma una party de al menos 2 miembros para ver una estimación completa.</span>';
    }

    $('planSummary').innerHTML=`<b>Plan del maestro del gremio</b><br>
      Éxito ${pct>=0?'+':''}${pct}% · Riesgo de herida ${risk>=0?'+':''}${risk}% · Recompensa ×${p.reward.toFixed(2)} · Coste ${p.cost} oro
      ${estimate}<br>
      <span class="tiny">${p.pace.desc} ${p.priority.desc} ${p.supply.desc}</span>`;
    saveState(false);
  }

  function renderMissionParty(){
    const party=state.selected.map(member).filter(Boolean);
    $('missionParty').textContent=party.length?party.map(h=>h.name).join(' · '):'Sin formar';
  }

  function renderRelations(){
    const rows=[];
    Object.entries(state.relations).forEach(([key,r])=>{
      const [a,b]=key.split('-').map(Number);
      const A=member(a),B=member(b);
      if(!A||!B) return;
      if(r.bond<5&&r.tension<5&&r.attraction<5&&!r.romance&&!r.married) return;
      rows.push({A,B,r});
    });
    rows.sort((x,y)=>{
      const xa=(x.r.married?200:x.r.romance?150:0)+Math.max(x.r.bond,x.r.tension,x.r.attraction);
      const ya=(y.r.married?200:y.r.romance?150:0)+Math.max(y.r.bond,y.r.tension,y.r.attraction);
      return ya-xa;
    });
    $('relations').innerHTML=rows.length?rows.slice(0,14).map(x=>{
      const status=relationStatus(x.r);
      const cls=x.r.married||x.r.romance?'relationship-romance':x.r.tension>=45?'relationship-tense':'relationship-good';
      return `<div class="relation-row ${cls}">
        <div><div class="hero-name">${x.A.name} ↔ ${x.B.name}</div><div class="tiny">${status}</div></div>
        <div class="relation-values">Bond ${x.r.bond}<br>Tensión ${x.r.tension}${x.r.attraction?`<br>Atracción ${x.r.attraction}`:''}</div>
      </div>`;
    }).join(''):'<div class="chronicle-row">Aún no existen relaciones significativas.</div>';
  }

  function renderChronicle(){
    $('chronicle').innerHTML=state.chronicle.slice(0,30).map(x=>`<div class="chronicle-row">${x}</div>`).join('');
  }

  function renderLegacy(){
    const retired=state.roster.filter(h=>h.retired&&h.alive!==false);
    const couples=[];
    const seen=new Set();
    Object.entries(state.relations).forEach(([key,r])=>{
      if(!(r.romance||r.married)||seen.has(key)) return;
      seen.add(key);
      const [a,b]=key.split('-').map(Number);
      const A=member(a),B=member(b);
      if(A&&B) couples.push({A,B,r,key});
    });

    $('retiredCount').textContent=retired.length;
    $('coupleCount').textContent=couples.length;
    $('childCount').textContent=state.children.length;
    const gens=[1,...state.roster.map(h=>h.generation||1),...state.children.map(c=>c.generation||1)];
    $('generationStat').textContent=Math.max(...gens);

    $('families').innerHTML=couples.length?couples.map(({A,B,r,key})=>{
      const kids=state.children.filter(c=>c.parentIds.includes(A.id)&&c.parentIds.includes(B.id));
      const lineage=state.lineageRegistry?.[[A.id,B.id].sort((x,y)=>x-y).join('-')];
      const familyName=lineage?.title||A.lineageName||B.lineageName||`Familia de ${A.name} y ${B.name}`;
      return `<div class="legacy-card family-tree lineage-card">
        <div class="lineage-header">
          <span class="lineage-seal">◇</span>
          <span><strong>${familyName}</strong><br><span class="tiny">${lineage?.desc||'Una nueva familia está escribiendo su historia dentro del gremio.'}</span></span>
        </div>
        <span>${r.married?'Matrimonio':'Pareja'} · Bond ${r.bond} · Fundadores: ${A.name} + ${B.name}</span>
        ${kids.length?kids.map(c=>{
          const siblings=kids.filter(x=>x.id!==c.id).map(x=>x.name);
          const expectation=c.familyExpectation==='propio'?'Busca un camino propio':'Siente el peso del legado familiar';
          return `<div class="family-child">
            <b>${c.name}</b> · ${c.age} años · Gen.${c.generation}${c.introduced?' · aspirante disponible':''}<br>
            <span class="tiny">${c.traits.join(' · ')} · ${expectation}</span>
            ${siblings.length?`<br><span class="tiny">Hermanos: ${siblings.join(', ')}</span>`:''}
          </div>`;
        }).join(''):'<span class="tiny">Todavía no tienen descendientes registrados.</span>'}
      </div>`;
    }).join(''):'<div class="legacy-card">Todavía no hay parejas establecidas.</div>';

    $('retiredList').innerHTML=retired.length?retired.map(h=>{
      const role=h.veteranRole&&DATA.veteranRoles[h.veteranRole];
      return `<div class="legacy-card veteran-card">
        <strong>${DATA.classes[h.cls].icon} ${h.name}</strong>
        ${specializationData(h)?.name||h.cls} · Nv.${h.level} · ${h.age} años · ${h.expeditions} expediciones<br>
        <span class="tiny">Generación ${h.generation||1}${h.lineageName?' · '+h.lineageName:''}</span><br>
        <span class="veteran-role">${role?role.icon+' '+role.name:'Veterano sin función asignada'}</span>
        <div class="veteran-role-picker">
          ${Object.entries(DATA.veteranRoles).map(([key,info])=>`<button type="button" data-veteran-id="${h.id}" data-veteran-role="${key}" class="${h.veteranRole===key?'active':''}">${info.name}</button>`).join('')}
        </div>
      </div>`;
    }).join(''):'<div class="legacy-card">Aún no hay veteranos retirados.</div>';

    document.querySelectorAll('[data-veteran-role]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const hero=member(Number(btn.dataset.veteranId));
        const roleKey=btn.dataset.veteranRole;
        if(!hero||!hero.retired||!DATA.veteranRoles[roleKey]) return;
        hero.veteranRole=roleKey;
        state.veteranAssignments[hero.id]=roleKey;
        addChronicle(`${hero.name} comienza a servir al gremio como ${DATA.veteranRoles[roleKey].name}.`);
        saveState(false);
        renderLegacy();
        renderMission();
      });
    });
  }


  function renderAll(){
    renderHeader();
    renderApplicants();
    renderFacilities();
    renderDiagnostics();
    renderAdventurers();
    renderRoster();
    renderPartySummary();
    renderMission();
    renderRelations();
    renderChronicle();
    renderLegacy();
    if(currentScreen==='detail'&&currentDetailId) renderDetail();
  }

  document.querySelectorAll('button[data-screen]').forEach(btn=>{
    btn.addEventListener('click',()=>navigate(btn.dataset.screen));
  });

  document.addEventListener('click',e=>{
    const go=e.target.closest('[data-go]');
    if(go) navigate(go.dataset.go);
  });

  $('missionSelect').addEventListener('change',renderMission);
  ['paceSelect','prioritySelect','supplySelect'].forEach(id=>$(id).addEventListener('change',renderPlanSummary));
  $('dispatchBtn').addEventListener('click',dispatch);
  $('expeditionContinueBtn').addEventListener('click',advanceExpedition);
  $('toggleReportBtn').addEventListener('click',()=>{
    const report=$('report');
    const hidden=report.classList.contains('is-hidden');
    report.classList.toggle('is-hidden',!hidden);
    $('toggleReportBtn').textContent=hidden?'Ocultar relato completo':'Ver relato completo';
  });

  $('saveBtn').addEventListener('click',()=>saveState(true));
  $('advanceWeekBtn').addEventListener('click',advanceWeek);
  $('advanceYearBtn').addEventListener('click',advanceYear);

  $('refreshApplicantsBtn').addEventListener('click',()=>{
    if(state.gold<20){notice('No tienes 20 oro.');return;}
    state.gold-=20;
    state.stats.goldSpent+=20;
    advanceDays(1);
    state.applicants=[];
    refillApplicants();
    addChronicle('Llegan nuevos aspirantes al tablón de reclutamiento.');
    saveState(false);
    renderAll();
    notice('Han llegado nuevos aspirantes.');
  });

  $('clearPartyBtn').addEventListener('click',()=>{
    state.selected=[];
    saveState(false);
    renderAll();
    notice('La Party ha sido vaciada.');
  });

  $('detailAddPartyBtn').addEventListener('click',()=>{
    const h=member(currentDetailId);
    if(h) toggleParty(h.id,!state.selected.includes(h.id));
  });

  $('retireBtn').addEventListener('click',()=>{
    const h=member(currentDetailId);
    if(h) retireHero(h,true);
  });

  $('resetBtn').addEventListener('click',()=>{
    if(!window.confirm('¿Reiniciar toda la partida V2.5 y borrar el guardado local?')) return;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    state=freshState();
    nextId=1;
    currentDetailId=null;
    expeditionView=null;
    refillApplicants();
    saveState(false);
    renderAll();
    navigate('guild');
    notice('Partida reiniciada.');
  });

  refillApplicants();
  checkRegionUnlocks();
  renderAll();
  navigate('guild');
  saveState(false);
})();
