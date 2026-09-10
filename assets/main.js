async function loadJSON(path) {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${path}${separator}v=20260911c`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatAuthors(authors) {
  const list = Array.isArray(authors) ? authors : String(authors || '').split(',').map(x => x.trim());
  return list.map((author) => {
    const safe = escapeHTML(author);
    return /(^|\s)Shuo Wang(\*|$)/.test(author) ? `<strong>${safe}</strong>` : safe;
  }).join(', ');
}

function shortVenue(venue = '') {
  const v = venue.toLowerCase();
  if (v.includes('neurips')) return 'NeurIPS';
  if (v.includes('icml')) return 'ICML';
  if (v.includes('icra')) return 'ICRA';
  if (v.includes('aaai')) return 'AAAI';
  if (v.includes('iclr')) return 'ICLR';
  if (v.includes('corl')) return 'CoRL';
  if (v.includes('arxiv')) return 'arXiv';
  return '';
}

function renderNewsTitle(item) {
  const title = String(item.title || '');
  const highlight = String(item.highlight || '');
  if (!highlight || !title.includes(highlight)) return escapeHTML(title);

  const index = title.indexOf(highlight);
  const before = title.slice(0, index);
  const after = title.slice(index + highlight.length);
  const accentClass = item.accent === 'red' ? 'news-accent-red' : 'news-accent-blue';
  return `${escapeHTML(before)}<span class="${accentClass}">${escapeHTML(highlight)}</span>${escapeHTML(after)}`;
}

function renderNews(news) {
  const wrap = document.getElementById('newsList');
  const toggle = document.getElementById('newsToggle');
  const sorted = [...news].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const visibleCount = 6;

  wrap.innerHTML = sorted.map((item, index) => `
    <div class="news-row ${index >= visibleCount ? 'is-extra' : ''}" ${index >= visibleCount ? 'hidden' : ''}>
      <div class="news-date">${escapeHTML(item.date || '')}</div>
      <div class="news-text"><span class="news-emoji" aria-hidden="true">${escapeHTML(item.emoji || '✨')}</span>${renderNewsTitle(item)}</div>
    </div>
  `).join('');

  if (sorted.length > visibleCount) {
    toggle.hidden = false;
    let expanded = false;
    toggle.addEventListener('click', () => {
      expanded = !expanded;
      wrap.querySelectorAll('.is-extra').forEach((row) => { row.hidden = !expanded; });
      toggle.textContent = expanded ? 'Show less' : 'Show all';
    });
  }
}

function renderPublication(pub) {
  const links = [
    ['Paper', pub.pdf],
    ['Code', pub.code],
    ['Project', pub.project],
    ['Slides', pub.slides],
    ['BibTeX', pub.bibtex],
    ['X', pub['X project']]
  ].filter(([, href]) => href);

  const venue = escapeHTML(pub.venue || '');
  const badge = shortVenue(pub.venue || '');

  return `
    <article class="publication">
      <div class="pub-year">${escapeHTML(pub.year || '')}</div>
      <div>
        <h3 class="pub-title">${escapeHTML(pub.title || 'Untitled')}</h3>
        <div class="pub-authors">${formatAuthors(pub.authors)}</div>
        <div class="pub-venue">${badge ? `<span class="venue-badge">${badge}</span>` : ''}${venue}</div>
        ${pub.note ? `<div class="pub-note">${escapeHTML(pub.note)}</div>` : ''}
        ${links.length ? `<div class="pub-links">${links.map(([label, href]) => `<a href="${escapeHTML(href)}" target="_blank" rel="noreferrer">${label}</a>`).join('')}</div>` : ''}
      </div>
    </article>
  `;
}

function sortPublications(publications) {
  return [...publications].sort((a, b) => {
    const left = `${b.year || ''}${b.month || ''}`;
    const right = `${a.year || ''}${a.month || ''}`;
    return left.localeCompare(right);
  });
}

function renderPublications(publications) {
  const wrap = document.getElementById('pubList');
  const groups = [
    {
      key: 'robotics',
      title: 'Robotics',
      label: 'Major',
      description: 'Embodied AI · Robot Learning · Vision-Language-Action Models'
    },
    {
      key: 'other',
      title: 'Other Research',
      label: '',
      description: 'Graph Learning · Representation Learning · Foundation Models · Optimization'
    }
  ];

  wrap.innerHTML = groups.map((group) => {
    const papers = sortPublications(publications.filter((pub) => (pub.category || 'other') === group.key));
    if (!papers.length) return '';

    return `
      <section class="publication-group" aria-labelledby="pub-group-${group.key}">
        <div class="pub-group-head">
          <div>
            <h3 id="pub-group-${group.key}" class="pub-group-title">
              ${escapeHTML(group.title)}
              ${group.label ? `<span class="major-label">${escapeHTML(group.label)}</span>` : ''}
            </h3>
            <p class="pub-group-description">${escapeHTML(group.description)}</p>
          </div>
          <span class="pub-count">${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}</span>
        </div>
        <div class="publication-list">
          ${papers.map(renderPublication).join('')}
        </div>
      </section>
    `;
  }).join('');
}

async function main() {
  document.getElementById('year').textContent = new Date().getFullYear();
  const [news, publications] = await Promise.all([
    loadJSON('data/news.json'),
    loadJSON('data/publications.json')
  ]);
  renderNews(news);
  renderPublications(publications);
}

main().catch((error) => {
  console.error(error);
  const firstSection = document.querySelector('.section');
  if (firstSection) {
    const box = document.createElement('div');
    box.className = 'error-box';
    box.textContent = 'Some homepage data could not be loaded. Please check data/news.json and data/publications.json.';
    firstSection.prepend(box);
  }
});
