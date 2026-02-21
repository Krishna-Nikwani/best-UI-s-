// Space UI Scripts
(function starfields(){
  const back=document.getElementById('starfield-back'); const front=document.getElementById('starfield-front'); if(!back||!front) return;
  const ctxB=back.getContext('2d'); const ctxF=front.getContext('2d'); let w,h,dpr=window.devicePixelRatio||1;
  const FAR=900, NEAR=450; const far=[], near=[]; const DEPTH=3; let t=0, vel=0.002; const velEl=document.getElementById('vel');
  function resize(){ w=back.width=front.width=innerWidth*dpr; h=back.height=front.height=innerHeight*dpr; back.style.width=front.style.width=innerWidth+'px'; back.style.height=front.style.height=innerHeight+'px'; }
  window.addEventListener('resize',resize); resize();
  function mkStar(){ return { x:Math.random()*w, y:Math.random()*h, z:Math.random()*DEPTH+0.2, a:0.4+Math.random()*0.6, r:(0.5+Math.random()*1.5)*dpr, glow:(2+Math.random()*6)*dpr }; }
  for(let i=0;i<FAR;i++) far.push(mkStar());
  for(let i=0;i<NEAR;i++) near.push(mkStar());
  function stepLayer(ctx, arr, speedMul, color){ ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation='lighter';
    for(const s of arr){ const tw=0.6+Math.sin((t+s.x*0.0008+s.y*0.0006)*6.283)*0.4; const alpha=s.a*tw; // brighter twinkle baseline
      // bloom glow
      ctx.beginPath(); ctx.fillStyle=`rgba(129,230,255,${0.07*tw})`; ctx.arc(s.x, s.y, s.glow*1.1, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(255,255,255,${Math.min(1,0.85*alpha)})`; ctx.fillRect(s.x, s.y, s.r+0.2, s.r+0.2);
      s.y-= (0.035 + (1-s.z/DEPTH)*0.16)*speedMul*dpr; s.x+= Math.sin((t+s.y*0.002))*0.035*dpr*speedMul;
      if(s.y < -10){ s.y = h + 10; s.x=Math.random()*w; }
    }
  }
  function draw(){ t+=vel; if(velEl) velEl.textContent=vel.toFixed(3); stepLayer(ctxB, far, 0.7, '#9bdfff'); stepLayer(ctxF, near, 1.3, '#ffffff'); requestAnimationFrame(draw); }
  draw();
})();

// Shooting stars (angled with glow)
(function shooting(){
  const layer=document.getElementById('shooting-stars'); if(!layer) return;
  function spawn(){
    const el=document.createElement('div'); el.className='shooting';
    const y=Math.random()*window.innerHeight*0.7+40; const x=-80; const len=160+Math.random()*240; const angle=-20+Math.random()*-25;
    el.style.top=y+'px'; el.style.left=x+'px'; el.style.width=len+'px'; el.style.opacity='0.95'; el.style.transform=`rotate(${angle}deg)`;
    el.style.boxShadow='0 0 24px rgba(255,255,255,0.7), 0 0 48px rgba(129,230,255,0.35)';
    layer.appendChild(el);
    const dur=1400+Math.random()*1600; const endX=window.innerWidth+260; const endY=y-(100+Math.random()*180);
    const start=performance.now();
    function step(now){ const p=Math.min(1, (now-start)/dur); const cx=x + (endX-x)*p; const cy=y + (endY-y)*p; el.style.transform=`translate(${cx}px, ${cy}px) rotate(${angle}deg)`; el.style.opacity=String(1-p); if(p<1) requestAnimationFrame(step); else el.remove(); }
    requestAnimationFrame(step);
  }
  setInterval(()=>{ if(Math.random()<0.55) spawn(); }, 1600);
})();

// Procedural Galaxy (value noise) onto canvas
(function galaxy(){
  const c=document.getElementById('galaxy'); if(!c) return; const ctx=c.getContext('2d');
  let w,h,dpr=window.devicePixelRatio||1; function resize(){ w=c.width=innerWidth*dpr; h=c.height=innerHeight*dpr; c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px'; draw(); }
  window.addEventListener('resize', resize); resize();
  function noise(x,y,seed){ const n=Math.sin((x*12.9898 + y*78.233 + seed*43758.5453)) * 43758.5453; return n-Math.floor(n); }
  function smoothNoise(x,y,seed){ const iX=Math.floor(x), iY=Math.floor(y); const fX=x-iX, fY=y-iY; function n(ix,iy){ return noise(ix,iy,seed);} const a=n(iX,iY), b=n(iX+1,iY), c2=n(iX,iY+1), d=n(iX+1,iY+1); const u=fX*fX*(3-2*fX), v=fY*fY*(3-2*fY); return a*(1-u)*(1-v)+b*u*(1-v)+c2*(1-u)*v+d*u*v; }
  function draw(){ ctx.clearRect(0,0,w,h); const seed=Math.random()*1000; const scale=0.0025*dpr; const bandAngle= -20*Math.PI/180; const cx=w*0.5, cy=h*0.55; const cos=Math.cos(bandAngle), sin=Math.sin(bandAngle);
    const img=ctx.createImageData(w,h); const data=img.data; let idx=0;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const rx=(x-cx)*cos - (y-cy)*sin; const ry=(x-cx)*sin + (y-cy)*cos; // rotate space to align band
        const dist=Math.abs(ry)/(h*0.12); // distance from galactic plane
        const n=(smoothNoise(x*scale*1.2, y*scale*1.2, seed)*0.6 + smoothNoise(x*scale*2.0, y*scale*2.0, seed+10)*0.4);
        let intensity = Math.max(0, 1.0 - dist*2.2) * n; intensity = Math.pow(intensity, 1.6);
        const r = Math.min(255, intensity*240 + intensity*60);
        const g = Math.min(255, intensity*230 + intensity*80);
        const b = Math.min(255, intensity*255 + intensity*120);
        data[idx++] = r; data[idx++] = g; data[idx++] = b; data[idx++] = Math.min(180, 255*intensity*0.7);
      }
    }
    ctx.putImageData(img,0,0);
    // soft blur pass
    ctx.globalAlpha=0.5; ctx.filter='blur(2px)'; ctx.drawImage(c,0,0); ctx.filter='none'; ctx.globalAlpha=1;
  }
})();

// Parallax tilt for planets and title based on pointer
(function tilt(){
  const root=document.body; const title=document.querySelector('.title'); const group=[...document.querySelectorAll('.planet'), title];
  if(!title) return;
  window.addEventListener('pointermove', (e)=>{
    const cx=innerWidth/2, cy=innerHeight/3; const dx=(e.clientX-cx)/cx; const dy=(e.clientY-cy)/cy;
    if(title){ title.style.transform=`translate3d(${dx*8}px, ${-6+dy*-6}px, 0)`; }
    group.forEach(el=>{ if(!el) return; const depth=parseFloat(el.dataset.depth||'0.2'); el.style.transform=`translate3d(${dx*depth*20}px, ${dy*depth*12}px,0)`; el.classList.add('tilt'); });
  });
  // device tilt
  window.addEventListener('deviceorientation', (e)=>{
    const dx=(e.gamma||0)/45, dy=(e.beta||0)/45; if(title){ title.style.transform=`translate3d(${dx*8}px, ${-6+dy*-6}px, 0)`; }
    group.forEach(el=>{ if(!el) return; const depth=parseFloat(el.dataset.depth||'0.2'); el.style.transform=`translate3d(${dx*depth*20}px, ${dy*depth*12}px,0)`; });
  }, {passive:true});
})();
