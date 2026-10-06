(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const features = { aec: true, ans: true, agc: true };
  new AcousticScene($('hero-canvas'), { hero: true, ...features });
  const experience = new AcousticScene($('experience-canvas'), { ...features });
  const featureCopy = {
    aec: {
      label: 'AEC',
      onTitle: '你说的话，<br>少一点回声打扰。',
      offTitle: '播放的声音，<br>可能再次被收录。',
      on: '减少应用播放声音被再次采集。适合扬声器外放、免提通话等边听边说的场景。',
      off: '关闭后，扬声器播放的声音可能进入麦克风，形成对方听到的回声。动画中的金色线条表示这类残留。'
    },
    ans: {
      label: 'ANS',
      onTitle: '背景退后些。<br>人声突出些。',
      offTitle: '环境里的杂音，<br>也可能跟着进入。',
      on: '减轻风扇、空调和周围环境的背景噪声，让应用里的语音更容易听清。',
      off: '关闭后，背景噪声会随着语音一起被采集。动画中的散点表示环境杂音。'
    },
    agc: {
      label: 'AGC',
      onTitle: '你说话有远近。<br>音量更稳定。',
      offTitle: '声音会随着远近，<br>忽大、忽小。',
      on: '自动调整采集增益，缓解说话音量与距离变化，让聆听更轻松。',
      off: '关闭后，说话音量和距离的变化会更直接地影响输出。动画中的幅度起伏表示这种变化。'
    }
  };
  function showFeature(key) {
    const enabled = features[key], copy = featureCopy[key];
    document.querySelectorAll('[data-toggle]').forEach(button => button.classList.toggle('selected', button.dataset.toggle === key));
    $('insight-label').textContent = `${copy.label} · ${enabled ? '已开启' : '已关闭'}`;
    $('insight-title').innerHTML = enabled ? copy.onTitle : copy.offTitle;
    $('insight-copy').textContent = enabled ? copy.on : copy.off;
  }
  function updateFeatures(key) {
    experience.set(features);
    document.querySelectorAll('[data-toggle]').forEach(button => {
      const on = features[button.dataset.toggle];
      button.setAttribute('aria-checked', String(on)); button.classList.toggle('active', on);
    });
    document.querySelectorAll('[data-unity]').forEach(indicator => {
      const on = features[indicator.dataset.unity];
      indicator.classList.toggle('on', on);
      indicator.setAttribute('aria-label', `${indicator.dataset.unity.toUpperCase()} ${on ? '已开启' : '已关闭'}`);
    });
    const count = Object.values(features).filter(Boolean).length;
    $('active-summary').textContent = count === 3 ? '三种能力已开启' : count === 0 ? '三种能力已关闭' : `${count} 种能力已开启`;
    showFeature(key);
  }
  document.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.toggle; features[key] = !features[key]; updateFeatures(key);
  }));
  document.querySelectorAll('[data-select-feature]').forEach(link => link.addEventListener('click', () => showFeature(link.dataset.selectFeature)));

  const scenarios = {
    call: { kicker: 'VOICE & COMMUNICATION', title: '免提开口，<br>交流更自然。', description: '视频会议、语音聊天或远程协作。减少外放回声和环境噪声，让每一次对话更容易听清。', tags: ['视频会议', '语音聊天', '远程协作'], app: 'Voice conversation', one: '你的声音', two: '对方的聆听', connection: '清晰交流', status: '回声更少 · 背景更安静 · 音量更稳定' },
    game: { kicker: 'GAMES & INTERACTIVE EXPERIENCES', title: '一起玩。<br>也一起听得清。', description: '多人游戏、虚拟空间和互动体验。把前端声学处理接入语音采集，让玩家的沟通更清楚、更连贯。', tags: ['多人游戏', '虚拟空间', '互动应用'], app: 'Team voice', one: '你的话音', two: '队友的聆听', connection: '协作沟通', status: '语音交流 · 团队协作 · 沉浸互动' },
    input: { kicker: 'RECORDING & VOICE INPUT', title: '采集好声音。<br>交给下一步。', description: '录音、语音指令和语音识别的输入端。减轻背景噪声，稳定音量，为后续的存储、传输或语音服务提供更清晰的采集输入。', tags: ['录音采集', '语音指令', '识别输入'], app: 'Voice capture', one: '麦克风采集', two: '应用输入', connection: '声音前端', status: '减少噪声 · 稳定音量 · 改善采集输入' }
  };
  function setScenario(key) {
    const copy = scenarios[key];
    document.querySelectorAll('[data-scenario]').forEach(button => {
      const selected = button.dataset.scenario === key;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    $('scenario-panel').setAttribute('aria-labelledby', `tab-${key}`);
    $('scenario-kicker').textContent = copy.kicker;
    $('scenario-title').innerHTML = copy.title;
    $('scenario-description').textContent = copy.description;
    $('scenario-tags').replaceChildren(...copy.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
    $('scenario-app-title').textContent = copy.app;
    $('scene-person-one').textContent = copy.one; $('scene-person-two').textContent = copy.two;
    $('connection-label').textContent = copy.connection; $('scenario-status').textContent = copy.status;
    document.querySelector('.scenario-visual').dataset.scene = key;
  }
  const tabs = [...document.querySelectorAll('[data-scenario]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setScenario(tab.dataset.scenario));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); setScenario(tabs[next].dataset.scenario); tabs[next].focus();
    });
  });

  let directionMode = 'fixed', angle = 45;
  const targetAngle = 70;
  const direction = new SoundField($('direction-canvas'), { look: angle, target: targetAngle, interference: 140, labels: true });
  function updateDirection(value) {
    direction.set(directionMode === 'adaptive' ? { look: value, target: value } : { look: value, target: targetAngle });
    $('direction-slider').value = String(value);
    $('direction-value').textContent = `${Math.round(value)}°`;
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    directionMode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item => {
      const selected = item.dataset.mode === directionMode;
      item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected));
    });
    $('direction-slider').disabled = directionMode === 'adaptive';
    $('direction-label').textContent = directionMode === 'fixed' ? '关注方向' : '跟踪方向';
    if (directionMode === 'fixed') updateDirection(angle);
    else updateDirection(85 + Math.sin(EasyMicAnimation.time * .4) * 35);
  }));
  $('direction-slider').addEventListener('input', event => { angle = Number(event.target.value); updateDirection(angle); });
  EasyMicAnimation.onFrame(time => {
    if (directionMode === 'adaptive' && direction.visible) updateDirection(85 + Math.sin(time * .4) * 35);
  });
  function updatePauseButton() {
    $('animation-pause').textContent = EasyMicAnimation.paused ? '继续动画' : '暂停动画';
    $('animation-pause').setAttribute('aria-pressed', String(EasyMicAnimation.paused));
  }
  $('animation-pause').addEventListener('click', () => {
    EasyMicAnimation.setPaused(!EasyMicAnimation.paused);
  });
  window.addEventListener('easymic-animation-change', updatePauseButton);
  updatePauseButton();
})();
