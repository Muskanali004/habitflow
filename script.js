if(!localStorage.getItem('hf_user')) location.href='login.html';

const iconMap = {
  'drawing': {emoji: '🎨', svg: 'assets/icons/drawing.svg'},
  'reading': {emoji: '📚', svg: 'assets/icons/reading.svg'},
  'exercise': {emoji: '🏋️', svg: 'assets/icons/exercise.svg'},
  'default': {emoji: '✨', svg: 'assets/icons/default.svg'}
};

let habits = JSON.parse(localStorage.getItem('habits_v2')|| '[]');
const user = localStorage.getItem('hf_user') || 'You';

document.querySelector('.brand .tag').textContent = user + ' · Minimal · Modern';

function save(){
  localStorage.setItem('habits_v2', JSON.stringify(habits));
}

function el(q){return document.querySelector(q)}
function render(){
  const grid = el('#habitGrid');
  grid.innerHTML = '';
  habits.forEach((h, idx) => {
    const percent = Math.min(100, Math.round((h.completed / h.goalDays)*100));
    const iconKey = (h.name||'').toLowerCase().split(' ')[0];
    const map = iconMap[iconKey] || iconMap['default'];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="habit">
        <div class="icon-wrap" data-idx="${idx}">
          <img src="${map.svg}" alt="${h.name}" onerror="this.style.display='none'"/>
          <div class="icon-emoji" style="display:none;">${map.emoji}</div>
          <div class="ring" aria-hidden="true" style="background: conic-gradient(var(--accent2) ${percent}%, #eee ${percent}% 100%);">
            <div class="ring-inner">${percent}%</div>
          </div>
        </div>
        <div class="content">
          <div class="h-title">${h.name}</div>
          <div class="controls">
            <button class="small-btn purple" data-action="done" data-idx="${idx}">Mark Done</button>
            <button class="small-btn" data-action="missed" data-idx="${idx}">Mark Missed</button>
            <button class="small-btn ghost" data-action="edit" data-idx="${idx}">Edit</button>
            <button class="small-btn" data-action="reset" data-idx="${idx}">Reset</button>
            <button class="small-btn" data-action="details" data-idx="${idx}">Details</button>
          </div>
          <div class="progress-row">
            <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
            <div class="stats">🔥 Streak: ${h.streak} · ✨ XP: ${h.xp}</div>
          </div>
          <div class="week-dots" style="margin-top:8px">
            ${renderWeekDots(h)}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  attachHandlers();
}

function renderWeekDots(h){
  const days = h.week || [0,0,0,0,0,0,0];
  return days.map(d => `<span class="dot" style="background:${d? 'var(--accent1)':'#eee'}"></span>`).join('');
}

function attachHandlers(){
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.onclick = (e)=>{
      const idx = +btn.getAttribute('data-idx');
      const action = btn.getAttribute('data-action');
      if(action==='done') markDone(idx);
      if(action==='missed') markMissed(idx);
      if(action==='edit') editHabit(idx);
      if(action==='reset') resetHabit(idx);
      if(action==='details') showDetails(idx);
    };
  });
  // icon fallback show emoji if SVG fails
  document.querySelectorAll('.icon-wrap img').forEach(img=>{
    img.onerror = function(){ this.style.display='none'; this.parentElement.querySelector('.icon-emoji').style.display='block'; }
  });
}

function renderWeekIndex(){
  // placeholder for future
}

function addHabit(name, type){
  const hn = name || el('#habitInput').value.trim();
  if(!hn) return;
  const t = type || el('#iconType').value;
  const key = hn.toLowerCase().split(' ')[0];
  const map = iconMap[key] || iconMap['default'];
  const entry = {
    name: hn,
    created: new Date().toISOString(),
    completed: 0,
    goalDays: 7,
    streak: 0,
    xp: 0,
    lastDone: null,
    week: [0,0,0,0,0,0,0]
  };
  habits.unshift(entry);
  save(); render();
  el('#habitInput').value = '';
}

function markDone(i){
  const h = habits[i];
  const today = new Date().toDateString();
  if(h.lastDone === today){ alert('Already completed today!'); return; }
  h.completed++;
  h.streak++;
  h.xp += 10;
  h.lastDone = today;
  // set week dot for today (0=Sun ... 6=Sat)
  const d = new Date().getDay();
  h.week[d] = 1;
  save(); render();
}

function markMissed(i){
  const h = habits[i];
  h.streak = Math.max(0, h.streak-1);
  h.xp = Math.max(0, h.xp-5);
  save(); render();
}

function editHabit(i){
  const name = prompt('Edit habit name:', habits[i].name);
  if(name!==null && name.trim()){ habits[i].name = name.trim(); save(); render(); }
}

function resetHabit(i){
  if(!confirm('Reset streak and progress for this habit?')) return;
  habits[i].streak = 0; habits[i].completed = 0; habits[i].xp = 0; habits[i].week = [0,0,0,0,0,0,0];
  save(); render();
}

function showDetails(i){
  const modal = el('#modal');
  const body = el('#modalBody');
  const h = habits[i];
  body.innerHTML = `<p><strong>${h.name}</strong></p>
    <p>Created: ${new Date(h.created).toLocaleDateString()}</p>
    <p>Streak: ${h.streak} days</p>
    <p>XP: ${h.xp}</p>
    <p>Completed times: ${h.completed}</p>
    <p style="margin-top:12px"><em>Weekly activity:</em></p>
    <div style="display:flex;gap:8px">${h.week.map((d,idx)=> '<div style="width:28px;height:28px;border-radius:6px;background:'+(d? 'var(--accent1)':'#f1f4f8')+';display:flex;align-items:center;justify-content:center;font-size:12px">'+(d? '✓':'')+'</div>').join('')}</div>`;
  modal.classList.remove('hidden');
}

el('#closeModal')?.addEventListener('click', ()=> el('#modal').classList.add('hidden'));
el('#addHabitBtn').addEventListener('click', ()=> addHabit());
el('#addBtn').addEventListener('click', ()=> {
  const name = prompt('Quick add habit name:');
  if(name) addHabit(name);
});
el('#logoutBtn').addEventListener('click', ()=> { localStorage.removeItem('hf_user'); location.href='login.html'; });

document.querySelectorAll('.chip').forEach(c=>{
  c.onclick = ()=> addHabit(c.getAttribute('data-name'));
});

// init sample data if empty
if(habits.length === 0){
  addHabit('Drawing');
  addHabit('Reading');
  addHabit('Exercise');
  save();
}

render();
