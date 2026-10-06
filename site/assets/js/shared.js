(() => {
  'use strict';
  const header = document.querySelector('.nav');
  const menu = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    header?.classList.remove('menu-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', '打开导航');
    const nav = document.getElementById('site-navigation');
    if (nav) nav.inert = matchMedia('(max-width: 620px)').matches;
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    document.getElementById('site-navigation').inert = !open && matchMedia('(max-width: 620px)').matches;
  });
  header?.querySelectorAll('nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && header?.classList.contains('menu-open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (header && !header.contains(event.target)) closeMenu(); });
  const mobileQuery = matchMedia('(max-width: 620px)');
  mobileQuery.addEventListener('change', closeMenu); closeMenu();

  let toastTimer;
  const toast = message => {
    const element = document.getElementById('toast');
    if (!element) return;
    element.textContent = message; element.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 3200);
  };
  async function copy(value) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      toast('已复制'); return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value; textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.append(textarea); textarea.select();
      let success = false; try { success = document.execCommand('copy'); } catch {}
      textarea.remove(); toast(success ? '已复制' : `请手动复制：${value}`); return success;
    }
  }
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copy(button.dataset.copy)));
  document.querySelectorAll('.article-body pre').forEach(pre => {
    const code = pre.querySelector('code'); if (!code) return;
    const button = document.createElement('button'); button.className = 'copy-code'; button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码'); button.addEventListener('click', async () => {
      if (await copy(code.textContent)) { button.textContent = '已复制'; setTimeout(() => button.textContent = '复制', 2000); }
    }); pre.append(button);
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } });
    }, { threshold: .06, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.section-heading,.capability-card,.product-card,.price-card,.contact-card,.doc-preview,.directional-copy,.unity-copy').forEach((element, index) => {
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add('reveal'); element.style.setProperty('--reveal-delay', `${Math.min(index % 3 * 50, 100)}ms`); observer.observe(element);
    });
    reduced.addEventListener('change', event => { if (event.matches) { observer.disconnect(); document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed')); } });
  }
  let progressScheduled = false;
  const updateProgress = () => {
    const element = document.querySelector('.scroll-progress');
    if (element) element.style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
    progressScheduled = false;
  };
  window.addEventListener('scroll', () => { if (!progressScheduled) { progressScheduled = true; requestAnimationFrame(updateProgress); } }, {passive:true});
  window.addEventListener('resize', updateProgress); updateProgress();
})();
