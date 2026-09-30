const $ = (s)=>document.querySelector(s);
let story, party, selectedChoice = Number(localStorage.getItem('guildLegacyChoice')) || null;

async function load(){
  [story,party]=await Promise.all([
    fetch('data/story.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/party.json',{cache:'no-store'}).then(r=>r.json())
  ]);
  render();
}
function render(){
  $('#chapterTitle').textContent=story.chapter;
  $('#sceneCounter').textContent=`Escena ${String(story.scene).padStart(2,'0')}`;
  $('#sceneTag').textContent=story.tag;
  $('#sceneTitle').textContent=story.title;
  $('#sceneImage').src=story.image;
  $('#storyText').innerHTML=story.paragraphs.map((p,i)=>`<p class="${i===story.paragraphs.length-1?'ominous':''}">${escapeHtml(p)}</p>`).join('');
  $('#partyList').innerHTML=party.map(m=>`<div class="member"><div class="member-color" style="color:${m.color};background:${m.color}"></div><div><div class="member-name">${escapeHtml(m.name)}</div><div class="member-role">${escapeHtml(m.class)} · ${m.age}</div><div class="member-state">${escapeHtml(m.state)}</div></div></div>`).join('');
  $('#choices').innerHTML=story.choices.map(c=>`<button class="choice ${selectedChoice===c.id?'selected':''}" data-id="${c.id}" type="button"><div class="choice-num">${c.id}</div><div><div class="choice-title">${c.icon} ${escapeHtml(c.title)}</div><div class="choice-desc">${escapeHtml(c.description)}</div></div></button>`).join('');
  document.querySelectorAll('.choice').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.id))));
  updateChoiceResult();
}
function choose(id){selectedChoice=id;localStorage.setItem('guildLegacyChoice',id);render();}
function updateChoiceResult(){
  const box=$('#choiceResult');
  if(!selectedChoice){box.hidden=true;return;}
  const c=story.choices.find(x=>x.id===selectedChoice); box.hidden=false;
  box.innerHTML=`DECISIÓN PREPARADA: <strong>${selectedChoice} · ${escapeHtml(c.title)}</strong><br>Vuelve al chat y escribe: <strong>“elijo ${selectedChoice}”</strong>. La siguiente actualización reemplazará esta escena con las consecuencias, una nueva imagen y cuatro nuevas decisiones.`;
}
function showParty(){
  $('#modalTitle').textContent='Los Cuatro del Umbral';
  $('#modalBody').innerHTML=party.map(m=>`<section class="detail-card"><h3>${escapeHtml(m.name)} · ${escapeHtml(m.class)}</h3><p><strong>Edad:</strong> ${m.age} · <strong>Rol:</strong> ${escapeHtml(m.role)}</p><p>${escapeHtml(m.look)}</p><p><strong>Equipo:</strong> ${escapeHtml(m.gear)}</p></section>`).join('');
  $('#modal').showModal();
}
function showHistory(){
  $('#modalTitle').textContent='Historia de la aventura';
  $('#modalBody').innerHTML=story.history.map(h=>`<div class="history-item"><strong>Escena ${String(h.scene).padStart(2,'0')} · ${escapeHtml(h.title)}</strong><div>${h.choice?`Decisión: ${escapeHtml(h.choice)}`:'Escena actual'}</div></div>`).join('');
  $('#modal').showModal();
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
$('#partyDetailsBtn').addEventListener('click',showParty); $('#historyBtn').addEventListener('click',showHistory); $('#modalClose').addEventListener('click',()=>$('#modal').close());
$('#resetChoiceBtn').addEventListener('click',()=>{selectedChoice=null;localStorage.removeItem('guildLegacyChoice');render();});
load().catch(err=>{console.error(err);$('#storyText').textContent='No se pudo cargar el estado de la aventura.';});