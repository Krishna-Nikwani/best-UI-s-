// Clock
function updateClock(){const n=new Date();const s=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;document.getElementById('clock').textContent=s}setInterval(updateClock,1e3);updateClock();

// Theme toggle
const themeBtn=document.getElementById('themeBtn');
const toggleThemeFromMenu=document.getElementById('toggleThemeFromMenu');
function toggleTheme(){ document.documentElement.classList.toggle('dark'); }
if(themeBtn) themeBtn.addEventListener('click',toggleTheme);
if(toggleThemeFromMenu) toggleThemeFromMenu.addEventListener('click',toggleTheme);

// Menu panel with visual feedback
const menuBtn=document.getElementById('menuBtn');
const menuPanel=document.getElementById('menuPanel');
if(menuBtn && menuPanel){
  menuBtn.addEventListener('click',()=>{
    menuPanel.classList.toggle('hidden');
    console.log('📋 Menu toggled:', menuPanel.classList.contains('hidden') ? 'closed' : 'opened');
    // Visual feedback
    menuBtn.style.transform = 'scale(0.9)';
    setTimeout(() => menuBtn.style.transform = 'scale(1)', 100);
  });
  document.addEventListener('click',(e)=>{ if(!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) menuPanel.classList.add('hidden'); });
  
  // Menu item click feedback
  const menuItems = menuPanel.querySelectorAll('button');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      console.log('✅ Menu item clicked:', item.textContent.trim());
      // Visual feedback
      const originalBg = item.style.background;
      item.style.background = 'rgba(103,232,249,0.3)';
      setTimeout(() => item.style.background = originalBg, 300);
    });
  });
}

// Command box (text) with visual feedback
const textBtn=document.getElementById('textBtn');
const commandBox=document.getElementById('commandBox');
const textInput=document.getElementById('textInput');
const sendBtn=document.getElementById('sendBtn');
const historyBtn=document.getElementById('historyBtn');
const historyPanel=document.getElementById('historyPanel');
const historyList=document.getElementById('historyList');

const chatHistory = [];

function addToHistory(text) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  chatHistory.unshift({ time, text });
  renderHistory();
}

function renderHistory() {
  if(!historyList) return;
  if(chatHistory.length === 0) {
    historyList.innerHTML = '<div class="text-[10px] text-cyan-200/40 font-mono italic text-center py-4">No recent activity logged...</div>';
    return;
  }
  historyList.innerHTML = chatHistory.map(item => `
    <div class="history-item">
      <span class="time">${item.time}</span>
      <span class="text">${item.text}</span>
    </div>
  `).join('');
}

function openCommand(){ 
  commandBox.classList.add('show'); 
  console.log('⌨️ Text input opened');
  setTimeout(()=>textInput&&textInput.focus(),80); 
}
function closeCommand(){ 
  commandBox.classList.remove('show'); 
  console.log('⌨️ Text input closed');
}

if(textBtn) textBtn.addEventListener('click',()=>{ 
  // Visual feedback
  textBtn.style.transform = 'scale(0.9)';
  setTimeout(() => textBtn.style.transform = 'scale(1)', 100);
  commandBox.classList.contains('show')? closeCommand(): openCommand(); 
  if(historyPanel.classList.contains('show')) historyPanel.classList.remove('show');
});

if(historyBtn) historyBtn.addEventListener('click', () => {
  historyBtn.style.transform = 'scale(0.9)';
  setTimeout(() => historyBtn.style.transform = 'scale(1)', 100);
  historyPanel.classList.toggle('show');
  if(commandBox.classList.contains('show')) closeCommand();
  if(menuPanel.classList.contains('show')) menuPanel.classList.add('hidden');
});

function handleSend(){ 
  const v=(textInput?.value||'').trim(); 
  if(!v) {
    console.log('⚠️ Empty command');
    textInput.placeholder = '⚠ Please enter a command';
    textInput.style.borderColor = 'rgba(239,68,68,0.5)';
    setTimeout(() => {
      textInput.placeholder = 'Type your command…';
      textInput.style.borderColor = '';
    }, 1500);
    return;
  }
  console.log('✅ Command sent:',v);
  addToHistory(v);
  // Visual feedback on send button
  sendBtn.style.transform = 'scale(0.85)';
  sendBtn.style.boxShadow = '0 0 40px rgba(103,232,249,0.9)';
  setTimeout(() => {
    sendBtn.style.transform = 'scale(1)';
    sendBtn.style.boxShadow = '';
  }, 150);
  
  // Success message
  const originalPlaceholder = textInput.placeholder;
  textInput.value=''; 
  textInput.placeholder = '✓ Command sent!';
  setTimeout(() => textInput.placeholder = originalPlaceholder, 2000);
  closeCommand(); 
}
if(sendBtn) sendBtn.addEventListener('click',handleSend);
if(textInput) textInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') handleSend(); });

// Voice recognition with animated dots
const voiceBtn=document.getElementById('voiceBtn');
const voiceIndicator=document.getElementById('voiceIndicator');
const micIcon=document.getElementById('micIcon');
const voiceDots=document.getElementById('voiceDots');
let recognizing=false; let recognition; let audioContext; let analyser; let microphone; let animationFrame;

if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; recognition=new SR();
  recognition.lang='en-US'; recognition.continuous=true; recognition.interimResults=true;
  
  recognition.onstart=()=>{ 
    recognizing=true; 
    voiceIndicator?.classList.remove('hidden');
  };
  
  recognition.onend=()=>{ 
    // Don't automatically stop - will be handled by button click
    if(!recognizing) return;
    // Auto-restart if not manually stopped
    try { recognition.start(); } catch(e) {}
  };
  
  recognition.onresult=(e)=>{ 
    const t=Array.from(e.results).map(r=>r[0].transcript).join(' '); 
    if(e.results[e.results.length-1].isFinal){
      openCommand(); 
      if(textInput) textInput.value=t;
      addToHistory("Voice: " + t);
    }
  };
}

// Audio analysis for voice sync
let mediaStream = null;

async function startAudioAnalysis(){
  try {
    if(!mediaStream) mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    if(!audioContext || audioContext.state === 'closed'){
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(mediaStream);
      analyser.fftSize = 64; // Smaller for more snappy response
      microphone.connect(analyser);
    }
    
    if(audioContext.state === 'suspended') await audioContext.resume();
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const dots = voiceDots.querySelectorAll('.voice-dot');
    
    function updateDots(){
      if(!recognizing) {
        dots.forEach(dot => { dot.style.transform = ''; dot.classList.remove('active'); });
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      dots.forEach((dot, i) => {
        const binIndex = i * 2; 
        const value = dataArray[binIndex];
        const activeLevel = (value * 0.6) + (average * 0.4);
        
        // Liquid pulse: 0 to 1 wave that cycles rhythmically while talking
        const time = Date.now() / 120; // Speed of the pulse
        const pulse = (Math.sin(time - i * 0.6) + 1) / 2; 
        
        // Stretch amount driven by voice volume but constrained by the pulse wave
        const scale = 1 + (activeLevel / 18) * pulse;
        
        if(activeLevel > 3){
          dot.classList.add('active');
          // Stretch symmetrically from center with a smooth pulsing effect
          dot.style.transform = `scaleY(${scale})`;
          dot.style.opacity = 0.4 + (activeLevel / 150) * pulse;
        } else {
          dot.classList.remove('active');
          dot.style.transform = 'scaleY(1)';
          dot.style.opacity = '0.4';
        }
      });
      
      animationFrame = requestAnimationFrame(updateDots);
    }
    updateDots();
  } catch(err){
    console.error('Microphone access denied:', err);
  }
}

function stopAudioAnalysis(){
  if(animationFrame) cancelAnimationFrame(animationFrame);
  if(mediaStream){
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if(audioContext && audioContext.state !== 'closed'){
    audioContext.suspend();
  }
}

if(voiceBtn) voiceBtn.addEventListener('click', async ()=>{ 
  if(!recognition){ 
    alert('Speech Recognition not supported in this browser.'); 
    return; 
  } 
  
  // Visual button press feedback
  voiceBtn.style.transform = 'scale(0.9)';
  setTimeout(() => voiceBtn.style.transform = 'scale(1)', 100);
  
    if(recognizing){
      // Stop listening - switch back to mic icon
      console.log('🎤 Voice recognition stopped');
      recognizing = false;
      recognition.abort(); // Forcefully stop and release microphone
      voiceIndicator?.classList.add('hidden');
      micIcon.classList.remove('hidden');
      voiceDots.classList.add('hidden');
      voiceBtn.classList.remove('listening');
      stopAudioAnalysis();
    }
   else {
    // Start listening - switch to dots
    console.log('🎤 Voice recognition started');
    micIcon.classList.add('hidden');
    voiceDots.classList.remove('hidden');
    voiceIndicator?.classList.remove('hidden');
    voiceBtn.classList.add('listening');
    
    // Start audio analysis first (single permission request)
    recognizing = true;
    await startAudioAnalysis();
    
    // Then start speech recognition (uses same mic permission)
    recognition.start();
  }
});

// Memory Usage Monitor (Ultra-Responsive)
(function initMemoryUsage(){
  const bar = document.getElementById('memoryBar');
  const valText = document.getElementById('memoryValue');
  const label = document.querySelector('.fixed.left-8 span:first-child');
  if(!bar || !valText) return;

  const totalRAM = navigator.deviceMemory || 16; 
  if(label) label.textContent = `Memory (${totalRAM}GB)`;

  let lastUsage = 24.5;
  
  function updateMemory(){
    let targetUsage;
    
    if(window.performance && window.performance.memory){
      const mem = window.performance.memory;
      // Calculate real heap percentage
      targetUsage = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
      // Add a tiny bit of "noise" to represent background system activity
      targetUsage += (Math.random() * 2.5); 
    } else {
      // Advanced system-pulse simulation
      const time = Date.now() / 1000;
      const base = 26;
      const pulse = Math.sin(time * 0.8) * 4; 
      const noise = Math.random() * 2;
      targetUsage = base + pulse + noise;
    }

    // Smooth interpolation (easing)
    lastUsage = lastUsage + (targetUsage - lastUsage) * 0.15;
    
    // Apply to UI
    const displayVal = lastUsage.toFixed(1);
    bar.style.height = displayVal + '%';
    valText.textContent = displayVal + '%';
    
    // Aesthetic color shifting
    if(lastUsage > 75){
      bar.classList.add('bg-rose-400');
      bar.classList.remove('from-cyan-400', 'to-cyan-200');
    } else {
      bar.classList.remove('bg-rose-400');
      bar.classList.add('from-cyan-400', 'to-cyan-200');
    }
  }

  // Poll every 150ms for hyper-responsive feedback
  setInterval(updateMemory, 150);
  updateMemory();
})();

// Canvas particles background
(function initParticles(){
  const canvas=document.getElementById('bgParticles'); if(!canvas) return; const ctx=canvas.getContext('2d');
  let w,h, dpr=window.devicePixelRatio||1; const COUNT=120; const parts=[];
  function resize(){ w=canvas.width=innerWidth*dpr; h=canvas.height=innerHeight*dpr; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; }
  window.addEventListener('resize', resize); resize();
  for(let i=0;i<COUNT;i++){ parts.push({ x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-0.5)*0.08*dpr, vy:(-0.15-Math.random()*0.25)*dpr, r: (0.5+Math.random()*1.2)*dpr, a: 0.25+Math.random()*0.35 }); }
  function step(){ ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation='lighter';
    for(const p of parts){ ctx.beginPath(); ctx.fillStyle=`rgba(103,232,249,${p.a})`; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      p.x+=p.vx; p.y+=p.vy; if(p.y< -10*dpr){ p.y=h+10*dpr; p.x=Math.random()*w; }
    }
    requestAnimationFrame(step);
  }
  step();
})();

// Magnetic hover and ripple on round buttons
(function initButtons(){
  const btns=[...document.querySelectorAll('.btn-round, #menuBtn, #textBtn, #voiceBtn, #sendBtn, #themeBtn')];
  btns.forEach(btn=>{
    btn.addEventListener('mousemove', (e)=>{
      const rect=btn.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; const mx=(x-rect.width/2)/rect.width; const my=(y-rect.height/2)/rect.height; btn.style.transform=`translate(${mx*3}px, ${my*3}px)`; });
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform='translate(0,0)'; });
    btn.addEventListener('click', (e)=>{
      const ripple=document.createElement('span'); ripple.style.position='absolute'; ripple.style.inset='0'; ripple.style.borderRadius='9999px'; ripple.style.boxShadow='0 0 0 0 rgba(103,232,249,0.35)'; ripple.style.pointerEvents='none'; ripple.style.transition='box-shadow 600ms ease'; btn.appendChild(ripple); requestAnimationFrame(()=>{ ripple.style.boxShadow='0 0 0 22px rgba(103,232,249,0)'; }); setTimeout(()=>ripple.remove(),650);
    });
  });
})();

// Smoke generation in the core
function initSmoke(){
  const container=document.querySelector('.core-smoke'); if(!container) return;
  const COUNT=28; // number of particles in a wave
  const LOOP_MS=2400;
  function spawnWave(){
    for(let i=0;i<COUNT;i++){
      const d=document.createElement('div'); d.className='smoke';
      const spread=(Math.random()*60-30); // -30px..30px
      const delay=(Math.random()*1.2).toFixed(2)+'s';
      const dur=(5+Math.random()*3).toFixed(2)+'s';
      const size=(10+Math.random()*22).toFixed(0)+'px';
      const scale=(0.8+Math.random()*0.8).toFixed(2);
      d.style.setProperty('--x', spread+'px');
      d.style.setProperty('--delay', delay);
      d.style.setProperty('--dur', dur);
      d.style.setProperty('--size', size);
      d.style.setProperty('--scale', scale);
      container.appendChild(d);
      // cleanup after animation completes
      const ttl=(parseFloat(dur)+parseFloat(delay))*1000+200; setTimeout(()=>d.remove(), ttl);
    }
  }
  // initial burst and interval
  spawnWave(); setInterval(spawnWave, LOOP_MS);
}
window.addEventListener('DOMContentLoaded', initSmoke);

// Suggestions and keyboard shortcuts
(function initSuggestions(){
  const box=document.getElementById('commandBox'); const list=document.getElementById('suggestions'); const input=document.getElementById('textInput'); const textBtn=document.getElementById('textBtn');
  if(!box||!list||!input) return;
  const baseCls='command-suggestions ';
  function applyTheme(){ const dark=document.documentElement.classList.contains('dark'); list.className=baseCls+(dark?'dark':''); list.classList.add('shadow-lg'); }
  applyTheme();
  const commands=[
    {icon:'terminal', label:'Run Diagnostics', hint:'Enter'},
    {icon:'bolt', label:'Initialize Systems', hint:'Ctrl+Enter'},
    {icon:'search', label:'Scan Environment', hint:'S'},
    {icon:'cloud', label:'Sync Data', hint:'D'},
    {icon:'shield_lock', label:'Enable Shield Protocol', hint:'P'},
    {icon:'assistant', label:'Open Assistant', hint:'A'}
  ];
  let filtered=commands.slice(); let active=0;
  function render(){
    if(!filtered.length){ list.classList.add('hidden'); return; }
    list.innerHTML=`<div class="command-suggestions ${document.documentElement.classList.contains('dark')?'dark':''}">`
      + filtered.map((c,i)=>`<div class="item ${i===active?'active':''}"><span class="material-symbols-outlined icon">${c.icon}</span><span>${c.label}</span><span class="hint">${c.hint||''}</span></div>`).join('')
      + `</div>`;
    list.classList.remove('hidden');
  }
  function filter(){ const q=input.value.toLowerCase(); filtered=commands.filter(c=>c.label.toLowerCase().includes(q)); active=0; render(); }
  input.addEventListener('input', filter);
  input.addEventListener('focus', filter);
  list.addEventListener('mousedown', (e)=>{ const item=e.target.closest('.item'); if(!item) return; const i=[...list.querySelectorAll('.item')].indexOf(item); if(i>-1){ input.value=filtered[i].label; list.classList.add('hidden'); }});
  input.addEventListener('keydown', (e)=>{
    if(list.classList.contains('hidden')) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); active=(active+1)%filtered.length; render(); }
    if(e.key==='ArrowUp'){ e.preventDefault(); active=(active-1+filtered.length)%filtered.length; render(); }
    if(e.key==='Enter'){ if(filtered[active]){ input.value=filtered[active].label; list.classList.add('hidden'); } }
    if(e.key==='Escape'){ list.classList.add('hidden'); }
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(e.key==='/' || (e.ctrlKey && (e.key==='k' || e.key==='K'))){ e.preventDefault(); box.classList.add('show'); input.focus(); textBtn?.setAttribute('aria-expanded','true'); }
    if(e.key==='Escape'){ box.classList.remove('show'); textBtn?.setAttribute('aria-expanded','false'); list.classList.add('hidden'); }
  });

  // Reflect theme change for suggestions box
  const mo=new MutationObserver(applyTheme); mo.observe(document.documentElement,{attributes:true, attributeFilter:['class']});
})();

// Voice UI pulse and aria
(function enhanceVoice(){
  const vb=document.getElementById('voiceBtn'); const vi=document.getElementById('voiceIndicator'); if(!vb) return;
  vb.addEventListener('click', ()=>{ const listening=!vb.classList.contains('listening'); vb.classList.toggle('listening', listening); vb.setAttribute('aria-pressed', String(listening)); if(vi) vi.classList.toggle('listening-pill', listening); });
})();

