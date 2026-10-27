/* MindHarbor: GitHub Pages-friendly, client-side guided wellbeing experience.
   This demo deliberately contains no API keys, remote AI calls, analytics or backend. */
(function() {
  'use strict';
  const L = window.MindHarborLogic;
  const $ = id => document.getElementById(id);
  const find = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const KEYS = {save:'mindharbor:save-enabled:v1',report:'mindharbor:report:v1',theme:'mindharbor:theme:v1'};
  const state = { view:'home',stage:'idle',answers:[],report:null,safetyConcern:false,saveEnabled:false,breathing:false,breathElapsed:0,breathInterval:null,groundStep:0,lastFocus:null };

  function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function safeSet(key,val) { try { localStorage.setItem(key,val); return true; } catch { return false; } }
  function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }
  function icon(name) { const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); const use = document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','#i-'+name); svg.appendChild(use); return svg; }
  function elem(tag,cls,txt) { const e=document.createElement(tag); if(cls)e.className=cls; if(txt!==undefined)e.textContent=txt; return e; }
  function formatDate(iso) { const d=new Date(iso); return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'}):'Date unavailable'; }
  function timeLabel() { return new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
  function storageStatus() { $('storageStatus').textContent = state.saveEnabled ? 'Reports saved on this device' : 'Private by default · not saved'; $('saveToggle').checked=state.saveEnabled; }
  function showView(name) {
    if (!['home','chat','report','toolkit','privacy'].includes(name)) return;
    state.view=name;
    all('.view').forEach(section => { const active=section.id==='view-'+name; section.hidden=!active; section.classList.toggle('active',active); });
    all('.nav-btn').forEach(btn => { const active=btn.dataset.view===name; btn.classList.toggle('active',active); if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current'); });
    const titles={home:'Overview',chat:'Talk to Mindy',report:'My wellbeing report',toolkit:'Care toolkit',privacy:'Privacy & data'};
    $('breadcrumbPage').textContent=titles[name];
    closeMenu();
    if (name==='report') renderReport();
    if (name==='chat') setTimeout(()=>{ $('chatLog').scrollTop=$('chatLog').scrollHeight; },0);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function openMenu() { $('sidebar').classList.add('mobile-open'); $('mobileBackdrop').hidden=false; $('mobileMenu').setAttribute('aria-expanded','true'); }
  function closeMenu() { $('sidebar').classList.remove('mobile-open'); $('mobileBackdrop').hidden=true; $('mobileMenu').setAttribute('aria-expanded','false'); }

  function addMessage(by,text) {
    const msg=elem('div','chat-message '+(by==='user'?'user':'bot'));
    msg.appendChild(elem('span','message-avatar',by==='user'?'You':'✳'));
    const content=elem('div','message-content');
    content.appendChild(elem('div','message-bubble',text));
    content.appendChild(elem('span','message-time',timeLabel()));
    msg.appendChild(content);
    $('chatLog').appendChild(msg);
    $('chatLog').scrollTop=$('chatLog').scrollHeight;
  }
  function addBot(text) {addMessage('bot',text);}
  function addUser(text) {addMessage('user',text);}
  function addOptions(buttons) {
    const parent=$('chatOptions');parent.replaceChildren();
    buttons.forEach(({label,handle})=>{const b=elem('button','option-btn',label);b.type='button';b.addEventListener('click',handle);parent.appendChild(b);});
  }
  function setProgress(){
    const total=L.questions.length;const n=Math.min(state.answers.length,total);
    const progress=state.report?100:Math.round(n/total*100);
    $('progressFill').style.width=progress+'%';$('progressPercent').textContent=progress+'%';
    $('progressTitle').textContent=state.report?'Check-in completed':state.stage==='assessment'?'Your check-in is underway':state.stage==='age'?'A quick note before we begin':'Ready when you are';
    $('progressDetail').textContent=state.report?'Your report is ready. You can start a fresh check-in at any time.':state.stage==='assessment'?`${n} of ${total} responses completed. Take your time.`:'20 symptom questions plus one daily-life impact question.';
    $('asideBegin').textContent=state.report?'Open my report':state.stage==='assessment'?'Continue my check-in':'Start guided check-in';
    $('asideBegin').appendChild(icon('arrow'));
  }
  function initialMessage(){
    if ($('chatLog').children.length)return;
    addBot('Hi there, I’m Mindy. ✳  I’m a guided wellbeing companion, not a therapist or a generative AI clinician. I can listen with simple, rule-based responses and walk you through an optional self-check.\n\nWhat has your day been like?');
    addOptions([
      {label:'Begin a wellbeing check-in',handle:beginCheckin},
      {label:'I’d like to talk first',handle:()=>{addUser('I’d like to talk first');addBot('Of course. What has been on your mind? Take your time — you can write in the box below.');addOptions([{label:'Start check-in instead',handle:beginCheckin}]);$('chatInput').focus();}},
      {label:'Try a calming exercise',handle:()=>showView('toolkit')}
    ]);
  }
  function beginCheckin(){
    showView('chat');
    if(state.stage==='assessment'){queueQuestion(false);return;}
    state.answers=[];state.report=null;state.stage='age';
    $('chatLog').replaceChildren();
    addBot('Before we begin: this check-in is intended for adults aged 18 and over. It is not a diagnosis, treatment, or emergency service. Your responses stay in this browser unless you choose to export them or explicitly enable local saving.\n\nAre you 18 or older and happy to continue?');
    addOptions([
      {label:'Yes, I am 18 or older',handle:()=>{addUser('Yes, I am 18 or older');state.stage='assessment';addBot('Thank you. Think about your experiences over the past TWO WEEKS. For each question, select how often it happened. The first nine questions use the PHQ-9 depression symptom screener.');queueQuestion();}},
      {label:'No, I am under 18',handle:()=>{addUser('No, I am under 18');state.stage='idle';addBot('This particular self-check is intended for adults. If you are under 18 and struggling, consider talking with a trusted adult, a doctor, a school counsellor, or an age-appropriate mental health service. If you are unsafe, seek immediate help.');addOptions([{label:'View support contacts',handle:openSupport}]);setProgress();}},
      {label:'Not right now',handle:()=>{addUser('Not right now');state.stage='idle';addBot('That’s completely okay. You can talk here or explore the Care toolkit at your own pace.');addOptions([{label:'Explore care toolkit',handle:()=>showView('toolkit')}]);setProgress();}}
    ]);
    setProgress();
  }
  function queueQuestion(addHeader=true){
    if(state.stage!=='assessment')return;
    const i=state.answers.length;
    if(i>=L.questions.length){completeAssessment();return;}
    const q=L.questions[i];
    if(addHeader){
      if(i===9)addBot('Thank you for sharing. We’ll now check in about anxiety-related symptoms, using the seven GAD-7 questions. Please keep the past TWO WEEKS in mind.');
      if(i===16)addBot('Next are four original, exploratory questions about everyday stress. Unlike the PHQ-9 and GAD-7, this stress check is NOT clinically validated.');
      if(i===20)addBot('Just one last question about how much these experiences have affected your daily life.');
      addBot(`${i+1} of ${L.questions.length} · ${q.group==='impact'?'Daily-life impact':q.group.charAt(0).toUpperCase()+q.group.slice(1)}\n\n${q.text}${q.group==='impact'?'':'?'}`);
    }
    const labels=q.group==='impact'?L.impactOptions:L.options;
    addOptions(labels.map((label,v)=>({label,handle:()=>answerQuestion(v)})));
    setProgress();
  }
  function answerQuestion(v){
    if(state.stage!=='assessment'|| !Number.isInteger(v)||v<0||v>3)return;
    const i=state.answers.length;
    addUser(L.questions[i].group==='impact'?L.impactOptions[v]:L.options[v]);
    state.answers.push(v);$('chatOptions').replaceChildren();
    if(i===8 && v>0){
      addBot('Thank you for telling me. Because you indicated some thoughts about death or self-harm, I recommend contacting a qualified mental health professional promptly, regardless of other scores. If you might act on these thoughts or cannot stay safe, call emergency services or go to the nearest emergency department now. You can open “Get support” at any time.');
    }
    queueQuestion();
  }
  function completeAssessment(){
    try {state.report=L.scoreAssessment(state.answers,{safetyConcern:state.safetyConcern});}
    catch {addBot('I couldn’t calculate this check-in. Please start again.');state.stage='idle';return;}
    state.stage='complete';setProgress();
    addBot('Thank you for completing the check-in. Your report is ready with transparent symptom-check scores and suggested next steps. Remember, these scores are not a diagnosis or a percentage chance of having a condition.');
    addOptions([{label:'Open my report',handle:()=>showView('report')},{label:'Explore care toolkit',handle:()=>showView('toolkit')}]);
    if(state.saveEnabled)persistReport();
    showView('report');
  }
  function handleMessage(ev){
    ev.preventDefault();const input=$('chatInput');const text=input.value.trim();if(!text)return;input.value='';
    addUser(text);
    if(L.detectSafetyConcern(text)){
      state.safetyConcern=true;
      if(state.report && state.answers.length===L.questions.length){
        state.report=L.scoreAssessment(state.answers,{safetyConcern:true,completedAt:state.report.completedAt});
        if(state.saveEnabled)persistReport();
      }
      addBot('I’m concerned you may be talking about self-harm or suicide. A chat app cannot assess your safety. If you may act on these thoughts or feel unable to stay safe, please call emergency services now (112 in India), go to your nearest emergency department, and tell a trusted person who can stay with you. For mental health support in India, call Tele-MANAS on 14416.');
      if(state.stage==='assessment'){
        addBot('You can pause these questions to seek support. Your safety matters more than completing an assessment.');
        addOptions([{label:'Open support contacts',handle:openSupport},{label:'Continue questions',handle:()=>queueQuestion(false)}]);
      }else{addOptions([{label:'Open support contacts',handle:openSupport},{label:'Try grounding instead',handle:()=>showView('toolkit')}]);}
      setProgress();return;
    }
    if(state.stage==='age'){
      addBot('To start the questionnaire, please select an age confirmation option above. You can also choose “Not right now.”');return;
    }
    if(state.stage==='assessment'){
      addBot('I appreciate you sharing that. For the structured check-in, please select one of the response choices for the current question. You can also choose to stop at any time.');
      queueQuestion(false);return;
    }
    addBot(L.supportiveReply(text));
    addOptions([{label:'Start a structured check-in',handle:beginCheckin},{label:'Try a calming exercise',handle:()=>showView('toolkit')}]);
  }

  function percentBadgeClass(obj){ return obj.label==='Severe'||obj.label==='Moderately severe'||obj.label==='Higher range*'?'high':obj.label==='Moderate'||obj.label==='Middle range*'?'moderate':''; }
  function renderScoreCard(key,label,emoji,score,method) {
    const card=elem('article','score-card '+key);
    const top=elem('div','score-card-top');top.appendChild(elem('h3','',label));top.appendChild(elem('span','score-icon',emoji));card.appendChild(top);
    const nums=elem('div','score-values');nums.appendChild(elem('span','score-number',String(score.percent)));nums.appendChild(elem('span','score-pct','%'));card.appendChild(nums);
    card.appendChild(elem('span','severity-pill '+percentBadgeClass(score),score.label));
    const track=elem('div','meter');const fill=elem('div','meter-fill');fill.style.width=score.percent+'%';track.appendChild(fill);card.appendChild(track);
    card.appendChild(elem('p','score-foot',`${score.raw} / ${score.max} points · ${method}`));
    return card;
  }
  function recommendations(report){
    const list=[];const add=(emoji,title,text)=>list.push({emoji,title,text});
    if(report.guidance.level==='urgent'){
      add('🤝','Connect with a real person','Please tell someone you trust how you are feeling and seek professional or crisis support promptly.');
      add('📞','Make a support call','If you are in danger, use emergency services; in India, you can call 112. For mental health support call 14416.');
      add('🌿','Keep things simple','While waiting for help, move toward supportive company if possible and focus on immediate safety.');
      return list;
    }
    if(report.anxiety.raw>=10||report.stress.raw>=8)add('🌬️','Try gentle paced breathing','Practice a few comfortable, unforced breaths. Use the breathing exercise in your Care toolkit if it suits you.');
    if(report.depression.raw>=5)add('☀️','Make room for one small activity','A short walk, a simple meal, or reaching out to a trusted person can be a manageable place to begin.');
    add('🛏️','Keep a kind sleep routine','Where possible, aim for regular sleep and wake times and reduce stimulation before bedtime.');
    add('💬','Stay connected','Consider checking in with someone you trust. If symptoms persist or affect daily life, seek professional guidance.');
    add('🌿','Notice the present','Try a 5–4–3–2–1 grounding exercise or a few minutes of fresh air if accessible and comfortable.');
    return list.slice(0,3);
  }
  function renderReport(){
    const report=state.report;
    $('reportEmpty').hidden=!!report;
    $('reportContent').hidden=!report;
    $('printReport').disabled=!report;$('exportJSON').disabled=!report;
    if(!report)return;
    $('reportDate').textContent='Completed · '+formatDate(report.completedAt);
    const grid=$('scoresGrid');grid.replaceChildren(
      renderScoreCard('depression','Depressive symptoms','◒',report.depression,'PHQ-9'),
      renderScoreCard('anxiety','Anxiety symptoms','☼',report.anxiety,'GAD-7'),
      renderScoreCard('stress','Stress symptoms','〰',report.stress,'Exploratory*')
    );
    $('evaluationHeading').textContent=report.guidance.heading;
    $('evaluationSubheading').textContent=report.guidance.subtitle;
    $('evaluationReason').textContent=report.guidance.reason;
    $('evaluationIcon').textContent=report.guidance.level==='urgent'?'!':report.guidance.level==='routine'?'✳':'♡';
    $('consultTitle').textContent=report.guidance.consultTitle;
    $('consultBody').textContent=report.guidance.consultBody;
    const call=$('consultAction');call.replaceChildren();
    const intro=elem('span','','Need to talk? ');call.appendChild(intro);
    const link=elem('a','','Tele-MANAS 14416');link.href='tel:14416';call.appendChild(link);
    call.appendChild(document.createTextNode(' · In an emergency in India, call '));
    const emergency=elem('a','','112');emergency.href='tel:112';call.appendChild(emergency);
    const rec=$('recommendationList');rec.replaceChildren();
    recommendations(report).forEach(item=>{const el=elem('div','recommendation');el.appendChild(elem('span','',item.emoji));el.appendChild(elem('strong','',item.title));el.appendChild(elem('p','',item.text));rec.appendChild(el);});
    const impactWords=['not difficult','somewhat difficult','very difficult','extremely difficult'];
    $('reportImpact').textContent='Daily-life impact: '+(impactWords[report.impact]||'not recorded')+'. PHQ-9 item 9: '+(report.safetyItem?'a non-zero response (please discuss promptly with a professional)':'no such thoughts reported on this questionnaire')+'. '+(report.chatSafetyConcern?'A keyword-based chat heuristic also flagged a POSSIBLE safety concern; it can be inaccurate. ':'')+'A negative response does not establish safety.';
  }
  function exportReport(){
    if(!state.report)return;
    const payload={notice:'Confidential personal information. Self-report questionnaire scores, not a medical diagnosis or disease probabilities.',...state.report};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='mindharbor-report-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  function persistReport(){
    if(!state.report||!state.saveEnabled)return;
    if(!safeSet(KEYS.report,JSON.stringify({answers:state.answers,safetyConcern:state.safetyConcern,completedAt:state.report.completedAt}))){
      $('privacyMessage').textContent='Browser storage is unavailable. Your report has not been saved.';
    }
  }
  function readSavedReport(){
    if(!state.saveEnabled)return;
    try{
      const saved=JSON.parse(safeGet(KEYS.report)||'null');
      if(!saved||!Array.isArray(saved.answers))return;
      const r=L.scoreAssessment(saved.answers,{safetyConcern:!!saved.safetyConcern,completedAt:saved.completedAt});
      state.answers=saved.answers.slice();state.report=r;state.safetyConcern=!!saved.safetyConcern;state.stage='complete';
    }catch{safeRemove(KEYS.report);}
  }
  function setSaveEnabled(value){
    if(value){
      if(!safeSet(KEYS.save,'yes')){$('privacyMessage').textContent='Local browser storage is unavailable; saving cannot be enabled.';storageStatus();return;}
      state.saveEnabled=true;persistReport();$('privacyMessage').textContent='On-device report saving enabled. Stored data is not encrypted.';
    }else{
      state.saveEnabled=false;safeRemove(KEYS.save);safeRemove(KEYS.report);
      $('privacyMessage').textContent='On-device saving is off and the previously saved report has been cleared. Your current session remains available until you close or refresh this page.';
    }
    storageStatus();
  }
  function resetSession(){
    state.answers=[];state.report=null;state.safetyConcern=false;state.stage='idle';
    if(state.saveEnabled)safeRemove(KEYS.report);
    $('chatLog').replaceChildren();$('chatOptions').replaceChildren();initialMessage();setProgress();renderReport();
  }
  function clearAllData(){
    safeRemove(KEYS.save);safeRemove(KEYS.report);safeRemove(KEYS.theme);
    state.saveEnabled=false;resetSession();
    document.body.classList.remove('dark');$('themeToggle').replaceChildren(icon('moon'));
    storageStatus();$('privacyMessage').textContent='Your report, chat session, and MindHarbor browser preferences have been cleared.';
  }
  function toggleTheme(){const dark=document.body.classList.toggle('dark');$('themeToggle').replaceChildren(icon(dark?'sun':'moon'));safeSet(KEYS.theme,dark?'dark':'light');}

  const phases=[{name:'Breathe in',seconds:4,css:'breath-in'},{name:'Hold softly',seconds:4,css:'breath-hold'},{name:'Breathe out',seconds:6,css:'breath-out'}];
  function updateBreath(){
    const time=state.breathElapsed%14;
    let elapsed=time,phase=phases[0];
    for(const p of phases){if(elapsed<p.seconds){phase=p;break;}elapsed-=p.seconds;}
    $('breathOrb').classList.remove('breath-in','breath-hold','breath-out');$('breathOrb').classList.add(phase.css);
    $('breathText').textContent=phase.name;
    $('breathSeconds').textContent=(phase.seconds-elapsed)+' seconds · relax your shoulders';
  }
  function stopBreath(){if(state.breathInterval!==null){clearInterval(state.breathInterval);state.breathInterval=null;}state.breathing=false;$('breathToggle').replaceChildren(icon('play'),document.createTextNode(' Resume breathing'));}
  function toggleBreath(){
    if(state.breathing){stopBreath();return;}
    state.breathing=true;updateBreath();$('breathToggle').replaceChildren(icon('pause'),document.createTextNode(' Pause breathing'));
    state.breathInterval=setInterval(()=>{state.breathElapsed++;updateBreath();},1000);
  }
  function resetBreath(){stopBreath();state.breathElapsed=0;$('breathOrb').classList.remove('breath-in','breath-hold','breath-out');$('breathText').textContent='Ready';$('breathSeconds').textContent='Start when comfortable';$('breathToggle').replaceChildren(icon('play'),document.createTextNode(' Start breathing'));}
  const grounding=[
    {n:'5',sense:'THINGS YOU CAN SEE',prompt:'Look around and name five things you can see.'},
    {n:'4',sense:'THINGS YOU CAN FEEL',prompt:'Notice four things you can feel or touch.'},
    {n:'3',sense:'THINGS YOU CAN HEAR',prompt:'Listen for three distinct sounds around you.'},
    {n:'2',sense:'THINGS YOU CAN SMELL',prompt:'Notice two scents, or recall scents that you find comforting.'},
    {n:'1',sense:'THING YOU CAN TASTE',prompt:'Notice one taste, or take a comfortable sip of water.'},
    {n:'✓',sense:'WELL DONE',prompt:'Take a moment to notice what feels different. There is no need to force calm.'}
  ];
  function updateGrounding(){
    const g=grounding[state.groundStep];$('groundingNumber').textContent=g.n;$('groundingSense').textContent=g.sense;$('groundingPrompt').textContent=g.prompt;
    $('groundingNext').disabled=state.groundStep>=5;
    $('groundingNext').replaceChildren(document.createTextNode(state.groundStep>=5?'Completed':'Next sense '));if(state.groundStep<5)$('groundingNext').appendChild(icon('arrow'));
    const dots=$('groundingDots');dots.replaceChildren();for(let i=0;i<5;i++)dots.appendChild(elem('i',i===Math.min(state.groundStep,4)?'active':''));
  }
  function openSupport(){state.lastFocus=document.activeElement;$('supportModal').hidden=false;$('supportClose').focus();}
  function closeSupport(){$('supportModal').hidden=true;if(state.lastFocus&&state.lastFocus.isConnected)state.lastFocus.focus();}
  function init(){
    $('todayText').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    $('yearText').textContent=String(new Date().getFullYear());
    state.saveEnabled=safeGet(KEYS.save)==='yes';
    if(safeGet(KEYS.theme)==='dark'){document.body.classList.add('dark');$('themeToggle').replaceChildren(icon('sun'));}
    storageStatus();readSavedReport();initialMessage();setProgress();renderReport();updateGrounding();
    all('[data-view]').forEach(el=>el.addEventListener('click',()=>showView(el.dataset.view)));
    $('startCheckin').addEventListener('click',beginCheckin);$('emptyStart').addEventListener('click',beginCheckin);
    $('asideBegin').addEventListener('click',()=>state.report?showView('report'):state.stage==='assessment'?showView('chat'):beginCheckin());
    $('restartChat').addEventListener('click',()=>{resetSession();beginCheckin();});
    $('chatForm').addEventListener('submit',handleMessage);
    $('printReport').addEventListener('click',()=>{if(state.report)window.print();});
    $('exportJSON').addEventListener('click',exportReport);$('downloadData').addEventListener('click',exportReport);
    $('saveToggle').addEventListener('change',ev=>setSaveEnabled(ev.target.checked));
    $('deleteData').addEventListener('click',()=>{if(window.confirm('Clear your current session and any locally stored MindHarbor report and settings?'))clearAllData();});
    $('themeToggle').addEventListener('click',toggleTheme);
    $('mobileMenu').addEventListener('click',()=> $('sidebar').classList.contains('mobile-open')?closeMenu():openMenu());
    $('mobileBackdrop').addEventListener('click',closeMenu);
    $('helpButton').addEventListener('click',openSupport);
    $('supportClose').addEventListener('click',closeSupport);
    $('supportModal').addEventListener('click',ev=>{if(ev.target===$('supportModal'))closeSupport();});
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(!$('supportModal').hidden)closeSupport();else closeMenu();}});
    $('breathToggle').addEventListener('click',toggleBreath);$('breathReset').addEventListener('click',resetBreath);
    $('groundingNext').addEventListener('click',()=>{state.groundStep=Math.min(5,state.groundStep+1);updateGrounding();});
    $('groundingReset').addEventListener('click',()=>{state.groundStep=0;updateGrounding();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
