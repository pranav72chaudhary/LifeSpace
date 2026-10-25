/* LifeSpace — client-side productivity workspace */
(() => {
  'use strict';

  const STORAGE_KEY = 'lifespace.workspace.v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const escapeHTML = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sampleData = () => ({
    theme: 'dark',
    tasks: [
      {id:uid(),title:'Review this week’s priorities',due:todayKey(),priority:'high',done:false,created:Date.now()},
      {id:uid(),title:'Spend 30 minutes learning',due:todayKey(),priority:'medium',done:false,created:Date.now()},
      {id:uid(),title:'Tidy up your workspace',due:todayKey(),priority:'low',done:true,created:Date.now()}
    ],
    habits: [
      {id:uid(),title:'Read for 15 minutes',icon:'⌁',description:'A little learning every day',checks:{}},
      {id:uid(),title:'Move your body',icon:'↗',description:'Make space for movement',checks:{}},
      {id:uid(),title:'Plan tomorrow',icon:'◷',description:'End the day with clarity',checks:{}}
    ],
    goals: [
      {id:uid(),title:'Build a strong routine',description:'Create repeatable habits that support your priorities.',progress:35,color:'#08d68b',target:'Ongoing'},
      {id:uid(),title:'Grow my skills',description:'Make steady progress through focused practice.',progress:55,color:'#909a98',target:'This season'},
      {id:uid(),title:'Protect focused time',description:'Give important work more attention.',progress:20,color:'#e6b52b',target:'This month'}
    ],
    notes: [{id:uid(),title:'A reminder to myself',body:'Start small. Stay consistent. Review what matters.',updated:Date.now()}],
    quickNote: ''
  });

  let state = loadState();
  let taskFilter = 'all';
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let activeView = 'overview';

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return sampleData();
      const parsed = JSON.parse(saved);
      const base = sampleData();
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : base.tasks,
        habits: Array.isArray(parsed.habits) ? parsed.habits : base.habits,
        goals: Array.isArray(parsed.goals) ? parsed.goals : base.goals,
        notes: Array.isArray(parsed.notes) ? parsed.notes : base.notes,
        quickNote: typeof parsed.quickNote === 'string' ? parsed.quickNote : ''
      };
    } catch (error) {
      console.warn('LifeSpace could not read saved workspace data.', error);
      return sampleData();
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { toast('Could not save changes in this browser.'); console.error(error); }
  }
  function toast(message) {
    const region = $('#toast-region');
    const item = document.createElement('div');
    item.className = 'toast'; item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 2800);
  }
  function emptyState(title, copy) {
    return `<div class="empty-state"><strong>${escapeHTML(title)}</strong>${escapeHTML(copy)}</div>`;
  }
  function showView(name) {
    if (!$(`#view-${name}`)) return;
    activeView = name;
    $$('.view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
    $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
    $('#current-section').textContent = name === 'overview' ? 'Overview' : name.charAt(0).toUpperCase() + name.slice(1);
    $('#sidebar').classList.remove('open');
    window.scrollTo({top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    if (name === 'calendar') renderCalendar();
  }
  function updateHeader() {
    const now = new Date();
    const hour = now.getHours();
    $('#greeting').textContent = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
    $('#date-label').textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase() + ' · YOUR SPACE';
    $('#hero-date').textContent = now.toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();
    $('#clock').textContent = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }
  function taskRow(task, editable = false) {
    const priority = ['high','medium','low'].includes(task.priority) ? task.priority : 'low';
    const dueText = task.due === todayKey() ? 'Today' : task.due ? new Date(`${task.due}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'No date';
    return `<div class="task-row" data-task-id="${escapeHTML(task.id)}">
      <button class="check-button ${task.done?'checked':''}" data-action="toggle-task" aria-label="${task.done?'Mark incomplete':'Mark complete'}" aria-pressed="${task.done}">${task.done?'✓':''}</button>
      <div class="task-info"><strong class="${task.done?'done-text':''}">${escapeHTML(task.title)}</strong><div class="task-meta"><i class="priority priority-${priority}"></i><span>${priority.charAt(0).toUpperCase()+priority.slice(1)} priority</span><span>·</span><span>${escapeHTML(dueText)}</span></div></div>
      ${editable?'<button class="task-edit" data-action="edit-task" aria-label="Edit task">Edit</button>':''}
      <button class="task-delete" data-action="delete-task" aria-label="Delete task">×</button>
    </div>`;
  }
  function habitRow(habit) {
    const checked = Boolean(habit.checks && habit.checks[todayKey()]);
    return `<div class="habit-row" data-habit-id="${escapeHTML(habit.id)}"><div class="habit-symbol">${escapeHTML(habit.icon||'◷')}</div><div class="habit-info"><strong>${escapeHTML(habit.title)}</strong><span>${escapeHTML(habit.description||'Daily practice')}</span></div><button class="habit-check ${checked?'checked':''}" data-action="toggle-habit" aria-label="${checked?'Uncheck':'Complete'} ${escapeHTML(habit.title)}" aria-pressed="${checked}">✓</button></div>`;
  }
  function goalRow(goal) {
    const progress = Math.max(0,Math.min(100,Number(goal.progress)||0));
    return `<div class="goal-row"><div class="goal-row-head"><span class="goal-color" style="background:${escapeHTML(goal.color||'var(--green)')}"></span><strong>${escapeHTML(goal.title)}</strong><span>${progress}%</span></div><div class="goal-track"><span style="width:${progress}%;background:${escapeHTML(goal.color||'var(--green)')}"></span></div><div class="goal-row-foot"><span>${escapeHTML(goal.target||'In progress')}</span><span>${progress===100?'Completed':'In progress'}</span></div></div>`;
  }
  function renderOverview() {
    const today = todayKey();
    const todayTasks = state.tasks.filter(task => !task.due || task.due === today);
    const done = todayTasks.filter(task => task.done).length;
    const total = todayTasks.length;
    const rate = total ? Math.round(done/total*100) : 0;
    const checked = state.habits.filter(habit => habit.checks && habit.checks[today]).length;
    const habitTotal = state.habits.length;
    const goalAverage = state.goals.length ? Math.round(state.goals.reduce((sum,goal)=>sum+(Number(goal.progress)||0),0)/state.goals.length) : 0;
    $('#metric-completed').textContent = done;
    $('#task-rate').textContent = `${rate}% of tasks`;
    $('#task-progress').style.width = `${rate}%`;
    $('#metric-task-total').textContent = `${total} total`;
    $('#metric-habits').textContent = habitTotal;
    $('#habit-checkins').textContent = `${checked} / ${habitTotal}`;
    $('#habit-mini-dots').innerHTML = state.habits.slice(0,8).map(h=>`<span class="${h.checks&&h.checks[today]?'checked':''}"></span>`).join('');
    $('#metric-goals').textContent = state.goals.filter(g=>Number(g.progress)<100).length;
    $('#goal-average').textContent = `${goalAverage}%`;
    $('#goal-progress').style.width = `${goalAverage}%`;
    $('#overview-task-list').innerHTML = todayTasks.length ? todayTasks.slice(0,4).map(task=>taskRow(task)).join('') : emptyState('A clear slate','Add a task when you’re ready.');
    $('#overview-habit-list').innerHTML = state.habits.length ? state.habits.slice(0,4).map(habitRow).join('') : emptyState('Start with one habit','Choose a small action to repeat.');
    $('#overview-goal-list').innerHTML = state.goals.length ? state.goals.slice(0,3).map(goalRow).join('') : emptyState('Set a direction','Add a goal to keep your bigger picture close.');
    const pct = habitTotal ? Math.round(checked/habitTotal*100) : 0;
    $('#habit-ring').style.background = `conic-gradient(var(--green) ${pct*3.6}deg,#303839 ${pct*3.6}deg)`;
    $('#habit-ring-value').textContent = `${pct}%`;
    $('#habit-summary-title').textContent = pct===100&&habitTotal ? 'All checked off' : checked ? 'Good momentum' : 'Start your streak';
    $('#habit-summary-copy').textContent = habitTotal ? `${checked} of ${habitTotal} habits completed today.` : 'Add one small habit to begin.';
    $('#quick-note').value = state.quickNote || '';
    $('#nav-task-count').textContent = state.tasks.filter(t=>!t.done).length;
  }
  function renderTasks() {
    const tasks = state.tasks.filter(task => taskFilter==='all' || (taskFilter==='open'&&!task.done) || (taskFilter==='done'&&task.done));
    $('#full-task-list').innerHTML = tasks.length ? tasks.map(task=>taskRow(task,true)).join('') : emptyState(taskFilter==='done'?'Nothing completed yet':'No tasks here',taskFilter==='open'?'You’re clear for now. Add a task when something needs your attention.':'Try another filter or add a task.');
    $('#tasks-count-label').textContent = `${state.tasks.length} ${state.tasks.length===1?'task':'tasks'}`;
    $$('#task-filters .filter-tab').forEach(button=>button.classList.toggle('active',button.dataset.filter===taskFilter));
  }
  function renderHabits() {
    const total=state.habits.length, checked=state.habits.filter(h=>h.checks&&h.checks[todayKey()]).length, pct=total?Math.round(checked/total*100):0;
    $('#habit-page-checkins').textContent=`${checked}/${total}`;
    $('#habit-page-total').textContent=total;
    $('#habit-page-progress').style.width=`${pct}%`;
    $('#full-habit-list').innerHTML=state.habits.length?state.habits.map(h=>`<article class="habit-card" data-habit-id="${escapeHTML(h.id)}"><div class="habit-card-top"><div class="habit-card-icon">${escapeHTML(h.icon||'◷')}</div><button class="icon-text-button" data-action="delete-habit" aria-label="Delete habit">×</button></div><h3>${escapeHTML(h.title)}</h3><p>${escapeHTML(h.description||'A small action, repeated often.')}</p><div class="habit-card-bottom"><span>${h.checks&&h.checks[todayKey()]?'Completed today':'Daily habit'}</span><button class="${h.checks&&h.checks[todayKey()]?'checked':''}" data-action="toggle-habit">${h.checks&&h.checks[todayKey()]?'✓ Done':'Check in'}</button></div></article>`).join(''):emptyState('No habits yet','Add a habit you can realistically repeat.');
  }
  function renderGoals() {
    $('#full-goal-list').innerHTML=state.goals.length?state.goals.map(g=>`<article class="goal-card" style="--goal-color:${escapeHTML(g.color||'var(--green)')}" data-goal-id="${escapeHTML(g.id)}"><div class="goal-card-top"><span class="goal-color" style="width:10px;height:10px;background:${escapeHTML(g.color||'var(--green)')}"></span><button class="icon-text-button" data-action="delete-goal" aria-label="Delete goal">×</button></div><h3>${escapeHTML(g.title)}</h3><p class="goal-description">${escapeHTML(g.description||'Keep taking small steps.')}</p><div class="goal-large-progress"><span>Progress</span><strong>${Math.max(0,Math.min(100,Number(g.progress)||0))}%</strong></div><input type="range" min="0" max="100" step="5" value="${Math.max(0,Math.min(100,Number(g.progress)||0))}" data-action="goal-progress" aria-label="Progress for ${escapeHTML(g.title)}"><div class="goal-card-foot"><span>${escapeHTML(g.target||'In progress')}</span><span>${Number(g.progress)>=100?'Complete':'In progress'}</span></div></article>`).join(''):emptyState('No goals yet','Set a goal to give your effort a direction.');
  }
  function renderCalendar() {
    const year=calendarMonth.getFullYear(), month=calendarMonth.getMonth();
    $('#calendar-title').textContent=calendarMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const firstDay=new Date(year,month,1).getDay(), days=new Date(year,month+1,0).getDate(), prevDays=new Date(year,month,0).getDate();
    const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html=names.map(n=>`<div class="calendar-day-name">${n}</div>`).join('');
    const cells=Math.ceil((firstDay+days)/7)*7;
    for(let i=0;i<cells;i++){
      let dateNum, dateObj, outside=false;
      if(i<firstDay){dateNum=prevDays-firstDay+i+1;dateObj=new Date(year,month-1,dateNum);outside=true}
      else if(i>=firstDay+days){dateNum=i-(firstDay+days)+1;dateObj=new Date(year,month+1,dateNum);outside=true}
      else{dateNum=i-firstDay+1;dateObj=new Date(year,month,dateNum)}
      const key=todayKey(dateObj), isToday=key===todayKey(), hasTask=state.tasks.some(t=>t.due===key);
      html+=`<button class="calendar-day ${outside?'outside':''} ${isToday?'today':''} ${hasTask?'has-task':''}" data-date="${key}" aria-label="${dateObj.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}${hasTask?', has tasks':''}"><span>${dateNum}</span></button>`;
    }
    $('#calendar-grid').innerHTML=html;
  }
  function renderNotes() {
    $('#notes-grid').innerHTML=state.notes.length?state.notes.slice().sort((a,b)=>(b.updated||0)-(a.updated||0)).map(note=>`<article class="note-card" data-note-id="${escapeHTML(note.id)}"><div class="note-card-top"><span class="metric-icon green">▤</span><div class="note-card-actions"><button data-action="edit-note">Edit</button><button data-action="delete-note" aria-label="Delete note">×</button></div></div><h3>${escapeHTML(note.title||'Untitled note')}</h3><p>${escapeHTML(note.body||'')}</p><small>Updated ${new Date(note.updated||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small></article>`).join(''):emptyState('Your notes start here','Save ideas, reminders, and thoughts in one place.');
  }
  function renderInsights() {
    const total=state.tasks.length, done=state.tasks.filter(t=>t.done).length, open=total-done, rate=total?Math.round(done/total*100):0;
    const habitTotal=state.habits.length, checked=state.habits.filter(h=>h.checks&&h.checks[todayKey()]).length, hRate=habitTotal?Math.round(checked/habitTotal*100):0;
    $('#insight-completed').textContent=done; $('#insight-rate').textContent=`${rate}%`; $('#insight-progress').style.width=`${rate}%`;
    $('#insight-habit-rate').textContent=`${hRate}%`; $('#task-donut').style.background=`conic-gradient(var(--green) ${rate*3.6}deg,#1c2424 ${rate*3.6}deg)`;
    $('#donut-total').textContent=total; $('#legend-done').textContent=done; $('#legend-open').textContent=open;
  }
  function renderAll() {
    document.body.classList.toggle('light-theme',state.theme==='light');
    $('#theme-toggle').textContent=state.theme==='light'?'☼':'◐';
    renderOverview();renderTasks();renderHabits();renderGoals();renderNotes();renderInsights();renderCalendar();
  }
  function openDialog(type, item = null) {
    const dialog=$('#item-dialog'), fields=$('#dialog-fields');
    const configs={
      task:{title:item?'Edit task':'Add a task',eyebrow:'TASK MANAGEMENT',fields:`<div class="form-field"><label for="item-title">Task name</label><input id="item-title" name="title" required maxlength="120" placeholder="What needs doing?" value="${escapeHTML(item?.title||'')}"></div><div class="form-field"><label for="item-due">Due date</label><input id="item-due" name="due" type="date" value="${escapeHTML(item?.due||todayKey())}"></div><div class="form-field"><label for="item-priority">Priority</label><select id="item-priority" name="priority"><option value="low" ${item?.priority==='low'?'selected':''}>Low</option><option value="medium" ${!item||item.priority==='medium'?'selected':''}>Medium</option><option value="high" ${item?.priority==='high'?'selected':''}>High</option></select></div>`},
      habit:{title:'Add a habit',eyebrow:'DAILY PRACTICE',fields:`<div class="form-field"><label for="item-title">Habit name</label><input id="item-title" name="title" required maxlength="80" placeholder="e.g. Read for 15 minutes"></div><div class="form-field"><label for="item-description">Short description</label><input id="item-description" name="description" maxlength="140" placeholder="What does this support?"></div><div class="form-field"><label for="item-icon">Simple symbol</label><select id="item-icon" name="icon"><option>◷</option><option>⌁</option><option>↗</option><option>✳</option><option>◎</option><option>▤</option></select></div>`},
      goal:{title:'Create a goal',eyebrow:'LONG-TERM DIRECTION',fields:`<div class="form-field"><label for="item-title">Goal name</label><input id="item-title" name="title" required maxlength="100" placeholder="What do you want to work toward?"></div><div class="form-field"><label for="item-description">Description</label><textarea id="item-description" name="description" maxlength="400" placeholder="Why does this matter?"></textarea></div><div class="form-field"><label for="item-target">Timeframe</label><input id="item-target" name="target" maxlength="60" placeholder="e.g. This month"></div>`},
      note:{title:item?'Edit note':'New note',eyebrow:'CAPTURE A THOUGHT',fields:`<div class="form-field"><label for="item-title">Title</label><input id="item-title" name="title" maxlength="100" placeholder="Give this note a title" value="${escapeHTML(item?.title||'')}"></div><div class="form-field"><label for="item-body">Note</label><textarea id="item-body" name="body" maxlength="5000" placeholder="Write it down…">${escapeHTML(item?.body||'')}</textarea></div>`}
    };
    const config=configs[type]; if(!config)return;
    $('#dialog-title').textContent=config.title;$('#dialog-eyebrow').textContent=config.eyebrow;fields.innerHTML=config.fields;
    $('#item-form').dataset.type=type;$('#item-form').dataset.editId=item?.id||'';
    if(!dialog.open)dialog.showModal();
    $('#item-title')?.focus();
  }
  function closeDialog(){const d=$('#item-dialog');if(d.open)d.close();}
  function handleFormSubmit(event) {
    event.preventDefault();
    const form=event.currentTarget, type=form.dataset.type, editId=form.dataset.editId;
    const data=Object.fromEntries(new FormData(form).entries());
    if(type==='task'){
      const title=data.title.trim();if(!title)return;
      if(editId){const item=state.tasks.find(t=>t.id===editId);if(item)Object.assign(item,{title,due:data.due,priority:data.priority})}
      else state.tasks.unshift({id:uid(),title,due:data.due,priority:data.priority,done:false,created:Date.now()});
      toast(editId?'Task updated':'Task added');
    } else if(type==='habit'){
      const title=data.title.trim();if(!title)return;
      state.habits.push({id:uid(),title,description:data.description.trim(),icon:data.icon||'◷',checks:{}});
      toast('Habit added');
    } else if(type==='goal'){
      const title=data.title.trim();if(!title)return;
      state.goals.push({id:uid(),title,description:data.description.trim(),target:data.target.trim()||'In progress',progress:0,color:['#08d68b','#909a98','#e6b52b','#00b978'][state.goals.length%4]});
      toast('Goal added');
    } else if(type==='note'){
      const title=data.title.trim()||'Untitled note', body=data.body.trim();
      if(editId){const note=state.notes.find(n=>n.id===editId);if(note)Object.assign(note,{title,body,updated:Date.now()})}
      else state.notes.unshift({id:uid(),title,body,updated:Date.now()});
      toast('Note saved');
    }
    persist();renderAll();closeDialog();
  }
  function toggleTheme() {state.theme=state.theme==='dark'?'light':'dark';persist();renderAll();toast(`${state.theme==='light'?'Light':'Dark'} appearance enabled`)}
  function exportData() {
    const blob=new Blob([JSON.stringify({app:'LifeSpace',version:1,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`lifespace-backup-${todayKey()}.json`;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);toast('Workspace export prepared');
  }
  function resetData() {
    if(!window.confirm('Reset LifeSpace to its original sample data? Your current local workspace will be replaced.'))return;
    state=sampleData();persist();renderAll();toast('Sample workspace restored');
  }
  function handleTaskAction(button) {
    const row=button.closest('[data-task-id]');if(!row)return;
    const task=state.tasks.find(t=>t.id===row.dataset.taskId);if(!task)return;
    if(button.dataset.action==='toggle-task'){task.done=!task.done;persist();renderAll()}
    if(button.dataset.action==='delete-task'){state.tasks=state.tasks.filter(t=>t.id!==task.id);persist();renderAll();toast('Task deleted')}
    if(button.dataset.action==='edit-task')openDialog('task',task);
  }
  function handleHabitAction(button) {
    const card=button.closest('[data-habit-id]');if(!card)return;
    const habit=state.habits.find(h=>h.id===card.dataset.habitId);if(!habit)return;
    if(button.dataset.action==='toggle-habit'){habit.checks=habit.checks||{};if(habit.checks[todayKey()])delete habit.checks[todayKey()];else habit.checks[todayKey()]=true;persist();renderAll();toast(habit.checks[todayKey()]?'Habit checked off':'Habit check-in removed')}
    if(button.dataset.action==='delete-habit'&&window.confirm(`Delete habit “${habit.title}”?`)){state.habits=state.habits.filter(h=>h.id!==habit.id);persist();renderAll();toast('Habit deleted')}
  }
  function handleGoalAction(input) {
    const card=input.closest('[data-goal-id]');if(!card)return;
    const goal=state.goals.find(g=>g.id===card.dataset.goalId);if(!goal)return;
    if(input.dataset.action==='goal-progress'){goal.progress=Number(input.value);persist();renderGoals();renderOverview();renderInsights()}
  }
  function handleNoteAction(button) {
    const card=button.closest('[data-note-id]');if(!card)return;
    const note=state.notes.find(n=>n.id===card.dataset.noteId);if(!note)return;
    if(button.dataset.action==='edit-note')openDialog('note',note);
    if(button.dataset.action==='delete-note'&&window.confirm('Delete this note?')){state.notes=state.notes.filter(n=>n.id!==note.id);persist();renderNotes();toast('Note deleted')}
  }
  function bindEvents() {
    document.addEventListener('click',event=>{
      const nav=event.target.closest('[data-view]');if(nav){showView(nav.dataset.view);return}
      const go=event.target.closest('[data-go]');if(go){showView(go.dataset.go);return}
      const action=event.target.closest('[data-action]');
      if(action){
        const type=action.dataset.action;
        if(type.endsWith('task')){handleTaskAction(action);return}
        if(type.endsWith('habit')){handleHabitAction(action);return}
        if(type==='delete-goal'){const card=action.closest('[data-goal-id]');const goal=state.goals.find(g=>g.id===card?.dataset.goalId);if(goal&&window.confirm(`Delete goal “${goal.title}”?`)){state.goals=state.goals.filter(g=>g.id!==goal.id);persist();renderAll();toast('Goal deleted')}return}
        if(type==='edit-note'||type==='delete-note'){handleNoteAction(action);return}
      }
      if(event.target.closest('#quick-add,#08d68b-task-inline,#tasks-add')){openDialog('task');return}
      if(event.target.closest('#habit-add')){openDialog('habit');return}
      if(event.target.closest('#goal-add')){openDialog('goal');return}
      if(event.target.closest('#note-add')){openDialog('note');return}
      if(event.target.closest('#theme-toggle,#settings-theme')){toggleTheme();return}
      if(event.target.closest('#export-data')){exportData();return}
      if(event.target.closest('#reset-data')){resetData();return}
      if(event.target.closest('#mobile-menu')){$('#sidebar').classList.toggle('open');return}
      if(event.target.closest('#month-prev')){calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderCalendar();return}
      if(event.target.closest('#month-next')){calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar();return}
      const day=event.target.closest('.calendar-day[data-date]');if(day){const date=day.dataset.date;const tasks=state.tasks.filter(t=>t.due===date);showView('tasks');taskFilter='all';renderTasks();if(!tasks.length)toast(`No tasks scheduled for ${date}`);else toast(`${tasks.length} task${tasks.length===1?'':'s'} scheduled for ${date}`)}
    });
    $('#task-filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;taskFilter=button.dataset.filter;renderTasks()});
    $('#item-form').addEventListener('submit',handleFormSubmit);
    $('#save-note').addEventListener('click',()=>{state.quickNote=$('#quick-note').value;persist();$('#note-status').textContent='Saved just now';toast('Quick note saved')});
    $('#quick-note').addEventListener('input',()=>{$('#note-status').textContent='Unsaved changes';});
    $('#full-goal-list').addEventListener('change',event=>{if(event.target.matches('[data-action="goal-progress"]'))handleGoalAction(event.target)});
    $('#full-goal-list').addEventListener('input',event=>{if(event.target.matches('[data-action="goal-progress"]')){const card=event.target.closest('[data-goal-id]');const goal=state.goals.find(g=>g.id===card?.dataset.goalId);if(goal){goal.progress=Number(event.target.value);const value=card.querySelector('.goal-large-progress strong');if(value)value.textContent=`${goal.progress}%`;}}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')$('#sidebar').classList.remove('open');if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openDialog('task')}});
  }
  updateHeader();bindEvents();renderAll();window.setInterval(updateHeader,30000);
})();