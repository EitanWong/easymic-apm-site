/* A designed explanation of direction, not a simulated or measured beam response. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const rad = degree => degree * Math.PI / 180;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const registry = new Set();
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionPreference.matches;
  let lastFrame = 0;
  let clock = 0;
  const frameListeners = new Set();

  class SoundField {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = { look: 45, target: 45, interference: 125, labels: true, sourceDots: true, wide: false, hero: false, ...options };
      this.bearing = this.options.look;
      this.visible = true;
      this.width = 0;
      this.height = 0;
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas);
      this.intersection = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; }, { rootMargin: '100px' });
      this.intersection.observe(canvas);
      registry.add(this);
      this.resize();
    }
    resize() {
      const box = this.canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.width = box.width;
      this.height = box.height;
      this.canvas.width = Math.round(box.width * dpr);
      this.canvas.height = Math.round(box.height * dpr);
      this.dpr = dpr;
      this.motion = this.motion || { aec: this.options.aec === false ? 0 : 1, ans: this.options.ans === false ? 0 : 1, agc: this.options.agc === false ? 0 : 1 };
      this.draw(clock, 0);
    }
    set(options) { Object.assign(this.options, options); if (paused || !this.visible) this.draw(clock, 0); }
    point(degree, radius = .83) {
      const layout = this.layout();
      return { x: layout.ox + Math.cos(rad(degree)) * layout.radius * radius, y: layout.oy - Math.sin(rad(degree)) * layout.radius * radius };
    }
    layout() {
      const w = this.width, h = this.height;
      const hero = this.options.hero;
      const ox = w * .5;
      const oy = hero ? h * .745 : h * .80;
      const radius = Math.min(w * .43, h * (hero ? .55 : .75));
      return { w, h, ox, oy, radius };
    }
    angleFromPoint(clientX, clientY) {
      const box = this.canvas.getBoundingClientRect(), { ox, oy } = this.layout();
      return clamp(Math.atan2(oy - (clientY - box.top), clientX - box.left - ox) * 180 / Math.PI, 12, 168);
    }
    draw(t, dt) {
      if (!this.width || !this.height) return;
      const c = this.ctx, { w, h, ox, oy, radius } = this.layout();
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const o = this.options;
      this.bearing += (o.look - this.bearing) * (dt ? 1 - Math.exp(-dt * 9) : 1);
      const look = this.bearing;
      c.save();
      c.strokeStyle = '#687b861c'; c.lineWidth = .7;
      for (let i = 1; i <= 4; i++) {
        c.beginPath(); c.arc(ox, oy, radius * i / 4, Math.PI, TAU); c.stroke();
      }
      for (let deg = 0; deg <= 180; deg += 15) {
        const q = this.point(deg, 1);
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(q.x, q.y); c.stroke();
      }
      c.strokeStyle = '#72909f17'; c.beginPath(); c.moveTo(ox - radius - 16, oy); c.lineTo(ox + radius + 16, oy); c.stroke();
      if (o.labels) {
        c.font = `${Math.max(8, w * .012)}px -apple-system, sans-serif`; c.fillStyle = '#6a7d865e'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const deg of [0, 45, 90, 135, 180]) {
          const q = this.point(deg, 1.07);
          c.fillText(`${deg}°`, q.x, q.y - (deg === 0 || deg === 180 ? 9 : 0));
        }
      }
      if (!o.wide) {
        const spread = 13;
        const endR = radius * 1.03;
        const a = rad(-look - spread), b = rad(-look + spread);
        const glow = c.createRadialGradient(ox, oy, 8, ox, oy, endR);
        glow.addColorStop(0, '#72e3d951'); glow.addColorStop(.38, '#73e6dc27'); glow.addColorStop(1, '#72e3d908');
        c.fillStyle = glow; c.beginPath(); c.moveTo(ox, oy); c.arc(ox, oy, endR, a, b); c.closePath(); c.fill();
        c.lineWidth = .8;
        for (const offset of [-spread, spread]) {
          const q = this.point(look + offset, 1.03);
          const g = c.createLinearGradient(ox, oy, q.x, q.y); g.addColorStop(0, '#9aeae883'); g.addColorStop(1, '#7ae7e015');
          c.strokeStyle = g; c.beginPath(); c.moveTo(ox, oy); c.lineTo(q.x, q.y); c.stroke();
        }
        const centerQ = this.point(look, 1.03);
        c.strokeStyle = '#92ede865'; c.setLineDash([2, 6]); c.beginPath(); c.moveTo(ox, oy); c.lineTo(centerQ.x, centerQ.y); c.stroke(); c.setLineDash([]);
        for (let i = 0; i < 6; i++) {
          const progress = ((t * .13 + i / 6) % 1);
          const r = endR * (1 - progress);
          if (r < 20) continue;
          c.strokeStyle = `rgba(140,231,221,${Math.sin(progress * Math.PI) * .32})`;
          c.lineWidth = .75; c.beginPath(); c.arc(ox, oy, r, a + .025, b - .025); c.stroke();
        }
      }
      for (const [index, degree] of [o.target, o.interference].entries()) {
        const q = this.point(degree), isTarget = index === 0;
        for (let i = 0; i < 3; i++) {
          const p = ((t * .15 + i / 3 + index * .14) % 1);
          c.strokeStyle = isTarget ? `rgba(111,208,205,${(1-p)*.10})` : `rgba(211,168,112,${(1-p)*.075})`;
          c.lineWidth = .7; c.beginPath(); c.arc(q.x,q.y, 16 + p * radius * .33, 0,TAU); c.stroke();
        }
        if (o.sourceDots) {
          const orbSize = Math.max(11, Math.min(19, w * .033));
          const g = c.createRadialGradient(q.x-4,q.y-5,1,q.x,q.y,orbSize);
          g.addColorStop(0, isTarget?'#48635fff':'#5a4934ff'); g.addColorStop(1,isTarget?'#1a3031ff':'#2c241eff');
          c.fillStyle=g;c.strokeStyle=isTarget?'#7dceba77':'#c09c6566';c.lineWidth=.8;c.beginPath();c.arc(q.x,q.y,orbSize,0,TAU);c.fill();c.stroke();
          c.strokeStyle=isTarget?'#a3e9df':'#e2c497';c.lineWidth=1.2;
          for(let k=0;k<4;k++){const x=q.x-6+k*4;const v=3+Math.abs(Math.sin(t*2.7+k*1.2))*5;c.beginPath();c.moveTo(x,q.y-v);c.lineTo(x,q.y+v);c.stroke();}
          if(o.labels && !o.hero){c.fillStyle=isTarget?'#a0c8c4':'#ad9780';c.font=`${Math.max(9,w*.015)}px -apple-system,sans-serif`;c.textAlign='center';c.fillText(isTarget?'目标声源':'其他声源',q.x,q.y+orbSize+20);}
        }
      }
      this.device(c, ox, oy, w, radius);
      if (!o.hero && o.labels) {
        c.font = `${Math.max(8,w*.010)}px -apple-system,sans-serif`; c.fillStyle='#516675';c.textAlign='center';
        c.fillText('同步物理麦克风阵列',ox,oy+Math.min(39,w*.06)+20);
      }
      c.restore();
    }
    device(c,x,y,w,radius) {
      const width = Math.min(w*.31,radius*.90), height=width*.21, left=x-width/2, top=y-height*.36;
      c.save();
      const halo=c.createRadialGradient(x,y,5,x,y,width*.6);halo.addColorStop(0,'#76b5b612');halo.addColorStop(1,'#76b5b600');c.fillStyle=halo;c.fillRect(x-width,y-width*.45,width*2,width);
      c.shadowColor='#0008';c.shadowBlur=25;c.shadowOffsetY=15;
      const chassis=c.createLinearGradient(left,top,left,top+height);chassis.addColorStop(0,'#87949d');chassis.addColorStop(.035,'#5a6670');chassis.addColorStop(.20,'#3b444d');chassis.addColorStop(.60,'#222a32');chassis.addColorStop(.97,'#414e59');chassis.addColorStop(1,'#7a8792');
      c.fillStyle=chassis;c.beginPath();c.roundRect(left,top,width,height,height*.37);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
      c.strokeStyle='#a2b5c53b';c.lineWidth=.6;c.stroke();
      const trim=c.createLinearGradient(left,0,left+width,0);trim.addColorStop(0,'#c6d8e600');trim.addColorStop(.4,'#b9d0e938');trim.addColorStop(1,'#c6d8e600');c.strokeStyle=trim;c.beginPath();c.moveTo(left+height*.35,top+2);c.lineTo(left+width-height*.35,top+2);c.stroke();
      for(const xx of [x-width*.36,x+width*.36]){
        c.fillStyle='#182027';c.beginPath();c.arc(xx,top+height*.5,height*.14,0,TAU);c.fill();c.strokeStyle='#8395a25b';c.lineWidth=.65;c.stroke();
        c.fillStyle='#697b8766';c.beginPath();c.arc(xx,top+height*.5,height*.035,0,TAU);c.fill();
      }
      const lens=c.createRadialGradient(x-height*.1,top+height*.42,2,x,top+height*.5,height*.35);lens.addColorStop(0,'#30546a');lens.addColorStop(.4,'#111d26');lens.addColorStop(.72,'#080f16');lens.addColorStop(.78,'#42515e');lens.addColorStop(.86,'#1b232b');lens.addColorStop(1,'#5a6873');
      c.fillStyle=lens;c.beginPath();c.arc(x,top+height*.5,height*.35,0,TAU);c.fill();
      c.fillStyle='#8dbcc667';c.beginPath();c.ellipse(x-height*.09,top+height*.41,height*.08,height*.035,-.5,0,TAU);c.fill();
      c.restore();
    }
  }
  /* Conceptual product animation. The marks do not represent measured audio. */
  class AcousticScene extends SoundField {
    draw(t, dt = 0) {
      if (!this.width || !this.height) return;
      const c = this.ctx, w = this.width, h = this.height, o = this.options;
      const scale = Math.min(w / 660, h / 375);
      for (const key of ['aec', 'ans', 'agc']) {
        const target = o[key] === false ? 0 : 1;
        this.motion[key] += (target - this.motion[key]) * (dt ? 1 - Math.exp(-dt * 6) : 1);
      }
      const aec = o.aec !== false, ans = o.ans !== false, agc = o.agc !== false;
      const residualEcho = 1 - this.motion.aec, residualNoise = 1 - this.motion.ans;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      c.save(); c.translate((w - 660 * scale) / 2, (h - 340 * scale) / 2); c.scale(scale, scale);
      const text = (value, x, y, size, color, align = 'left', weight = 400) => {
        c.fillStyle = color; c.textAlign = align; c.font = `${weight} ${size}px -apple-system, "PingFang SC", sans-serif`; c.fillText(value, x, y);
      };
      const line = (path, color, width = 1) => { c.strokeStyle = color; c.lineWidth = width; c.stroke(path); };
      const glow = c.createRadialGradient(330, 173, 20, 330, 173, 180);
      glow.addColorStop(0, '#92d4cc0b'); glow.addColorStop(1, '#73bcb700');
      c.fillStyle = glow; c.fillRect(130, -10, 410, 365);
      // Faint level guides give the visual the calm rhythm of a product instrument.
      c.strokeStyle = '#819eaf0a'; c.lineWidth = .7;
      for (let y = 61; y <= 293; y += 58) { c.beginPath(); c.moveTo(25, y); c.lineTo(635, y); c.stroke(); }
      const starts = [93, 173, 253];
      const colors = ['#c7a577', '#aaa786', '#8fd9ce'];
      const names = ['回声', '背景噪声', '语音输入'];
      for (let k = 0; k < 3; k++) {
        const y = starts[k], active = k === 0 ? aec : k === 1 ? ans : true;
        text(names[k], 45, y - 25, 11, k === 2 ? '#86abae' : '#857f70');
        const path = new Path2D(); path.moveTo(42, y);
        for (let x = 42; x <= 160; x += 2) {
          const amp = k === 0 ? 10 : k === 1 ? 6 : 14;
          const env = Math.sin((x - 42) / 118 * Math.PI);
          const wave = Math.sin((x - 42) * (k === 1 ? .85 : .16) - t * (k === 1 ? 1.2 : 2)) * amp * env;
          path.lineTo(x, y + wave);
        }
        path.bezierCurveTo(180, y, 208, 173 + (k - 1) * 35, 250, 173 + (k - 1) * 35);
        line(path, k === 2 ? '#82bcb294' : '#b9a78252', 1);
        for (let i = 0; i < 3; i++) {
          const p = (t * .16 + i / 3 + k * .12) % 1;
          const x = 65 + p * 184, yy = y + (173 + (k - 1) * 35 - y) * Math.pow(p, 2);
          c.globalAlpha = Math.sin(p * Math.PI) * (k === 2 ? .85 : active ? .36 : .85);
          c.fillStyle = colors[k]; c.beginPath(); c.arc(x, yy, k === 2 ? 2 : 1.5, 0, TAU); c.fill();
        }
        c.globalAlpha = 1;
      }
      // Machined enclosure, with a glass face and a restrained metallic edge.
      c.save(); c.shadowColor = '#0007'; c.shadowBlur = 28; c.shadowOffsetY = 21;
      const shell = c.createLinearGradient(250, 75, 408, 274);
      shell.addColorStop(0, '#8d9da6'); shell.addColorStop(.02, '#53616a'); shell.addColorStop(.20, '#37474e'); shell.addColorStop(.75, '#1d2b32'); shell.addColorStop(.98, '#465b65'); shell.addColorStop(1, '#8a9ea7');
      c.fillStyle = shell; c.beginPath(); c.roundRect(250, 77, 158, 196, 29); c.fill(); c.restore();
      const face = c.createLinearGradient(255, 80, 398, 265);
      face.addColorStop(0, '#43585e'); face.addColorStop(.35, '#293d42'); face.addColorStop(1, '#192a32');
      c.fillStyle = face; c.beginPath(); c.roundRect(254, 81, 150, 188, 26); c.fill();
      c.strokeStyle = '#b2d2d523'; c.lineWidth = .7; c.stroke();
      const shine = c.createLinearGradient(256, 0, 402, 0);
      shine.addColorStop(0, '#d9e9ef00'); shine.addColorStop(.35, '#d7eae96b'); shine.addColorStop(1, '#c5e7df00');
      c.strokeStyle = shine; c.beginPath(); c.moveTo(277, 82); c.lineTo(380, 82); c.stroke();
      text('EASYMIC', 329, 116, 9, '#809d9f', 'center', 500);
      text('APM', 329, 169, 39, '#d9e7e7', 'center', 500);
      for (let i = 0; i < 17; i++) {
        const bar = 4 + Math.sin(i * .74) ** 2 * 13;
        c.fillStyle = `rgba(137,197,189,${.2 + Math.sin(i / 17 * Math.PI) * .45})`;
        c.beginPath(); c.roundRect(281 + i * 5.6, 192 - bar / 2, 2, bar, 1); c.fill();
      }
      for (const [i, [key, on]] of [['AEC', aec], ['ANS', ans], ['AGC', agc]].entries()) {
        const x = 270 + i * 40;
        c.fillStyle = on ? '#82b5ac10' : '#0f1a2044'; c.beginPath(); c.roundRect(x, 222, 37, 20, 5); c.fill();
        c.strokeStyle = on ? '#b3d6c925' : '#b3d6c912'; c.lineWidth = .6; c.stroke();
        text(key, x + 18.5, 235, 8, on ? '#a3c8bf' : '#536c78', 'center');
      }
      text('前端声学处理', 329, 307, 10, '#506f7d', 'center');
      const route = new Path2D(); route.moveTo(408, 174); route.lineTo(447, 174); line(route, '#98dbce77');
      const routing = c.createLinearGradient(408, 0, 448, 0);
      routing.addColorStop(0, '#77d7c600'); routing.addColorStop(.5, '#c9f0dc'); routing.addColorStop(1, '#77d7c600');
      c.fillStyle = routing; c.globalAlpha = .5 + Math.sin(t * 2) * .2; c.fillRect(410, 173, 37, 2); c.globalAlpha = 1;
      // The residual marks deliberately remain stylized, without numerical claims.
      if (residualNoise > .005) {
        for (let i = 0; i < 70; i++) {
          const x = 448 + ((i * 31 + t * 8) % 156), y = 173 + Math.sin(i * 2.33 + t * .8) * (27 + (i % 5) * 5);
          c.fillStyle = `rgba(188,168,126,${(.10 + (i % 4) * .035) * residualNoise})`; c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill();
        }
      }
      if (residualEcho > .005) {
        c.strokeStyle = `rgba(197,166,121,${.44 * residualEcho})`; c.lineWidth = 1;
        c.beginPath();
        for (let x = 448; x <= 608; x++) {
          const y = 173 + Math.sin((x - 448) * .135 - t * 1.8) * 29 * Math.sin((x - 448) / 160 * Math.PI);
          if (x === 448) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      const variableGain = .32 + (Math.sin(t * .9) + 1) * .75;
      const gain = .94 * this.motion.agc + variableGain * (1 - this.motion.agc);
      const outputGlow = c.createRadialGradient(526, 174, 5, 526, 174, 100);
      outputGlow.addColorStop(0, '#a2dfce0c'); outputGlow.addColorStop(1, '#82bcba00');
      c.fillStyle = outputGlow; c.fillRect(438, 79, 176, 190);
      for (let i = 0; i < 31; i++) {
        const x = 452 + i * 5, env = Math.sin(i / 30 * Math.PI);
        const v = (6 + Math.sin(i * .73 - t * 2.2) ** 2 * 27) * env * gain;
        const g = c.createLinearGradient(0, 174 - v, 0, 174 + v);
        g.addColorStop(0, '#6eadac80'); g.addColorStop(.5, '#b2eadc'); g.addColorStop(1, '#6eadac80');
        c.fillStyle = g; c.beginPath(); c.roundRect(x, 174 - Math.max(v, 1), 2.4, Math.max(v * 2, 2), 1.2); c.fill();
      }
      const outLabel = aec && ans && agc ? '更清晰 · 更稳定' : !aec ? '回声残留可见' : !ans ? '背景噪声可见' : '音量变化可见';
      text('语音输出', 529, 115, 11, '#92b9b5', 'center');
      text(outLabel, 529, 235, 10, '#628a91', 'center');
      c.restore();
    }
  }

  function frame(timestamp) {
    const dt = lastFrame ? Math.min(.06, (timestamp - lastFrame) / 1000) : .016;
    lastFrame = timestamp;
    if (!paused && !document.hidden) {
      clock += dt;
      frameListeners.forEach(listener => listener(clock, dt));
      for (const scene of registry) if (scene.visible && scene.width) scene.draw(clock, dt);
    }
    requestAnimationFrame(frame);
  }
  window.SoundField = SoundField;
  window.AcousticScene = AcousticScene;
  window.EasyMicAnimation = {
    get paused() { return paused; },
    get time() { return clock; },
    onFrame(listener) { frameListeners.add(listener); return () => frameListeners.delete(listener); },
    setPaused(value) {
      paused = Boolean(value);
      document.body.classList.toggle('animations-paused', paused);
      for (const svg of document.querySelectorAll('svg')) {
        if (paused && svg.pauseAnimations) svg.pauseAnimations();
        else if (!paused && svg.unpauseAnimations) svg.unpauseAnimations();
      }
      if (paused) for (const scene of registry) if (scene.width) scene.draw(clock, 0);
      window.dispatchEvent(new CustomEvent('easymic-animation-change', { detail: { paused } }));
    }
  };
  motionPreference.addEventListener('change', event => window.EasyMicAnimation.setPaused(event.matches));
  document.body.classList.toggle('animations-paused', paused);
  requestAnimationFrame(frame);
})();
