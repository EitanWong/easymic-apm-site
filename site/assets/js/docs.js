(() => {
  'use strict';
  const search = document.getElementById('docs-search');
  const cards = [...document.querySelectorAll('.docs-card')];
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase();
    let found = 0;
    for (const card of cards) {
      const match = !query || card.dataset.search.includes(query);
      card.hidden = !match; found += Number(match);
    }
    document.getElementById('search-status').textContent = !query ? '' : found ? `找到 ${found} 篇相关指南` : '暂未找到相关指南。可以换个关键词，或联系作者。';
  });
  const toggle = document.querySelector('.docs-toggle');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    document.querySelector('.docs-sidebar').classList.toggle('open', open);
  });
})();
