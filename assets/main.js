async function loadJSON(path) {
  const response = await fetch(path);
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
  if (v.includes('arxiv')) return 'arXiv';
  return '';
}

function renderNews(news) {
  const wrap = document.getElementById('newsList');
  const toggle = document.getElementById('newsToggle');
  const sorted = [...news].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const visibleCount = 6;

  wrap.innerHTML = sorted.map((item, index) => `
    <div class="news-row ${index >= visibleCount ? 'is-extra' : ''}" ${index >= visibleCount ? 'hidden' : ''}>
      <div class="news-date">${escapeHTML(item.date || '')}</div>
      <div class="news-text">${escapeHTML(item.title || '')}</div>
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

function renderPublications(publications) {
  const wrap = document.getElementById('pubList');
  const sorted = [...publications].sort((a, b) => {
    const left = `${b.year || ''}${b.month || ''}`;
    const right = `${a.year || ''}${a.month || ''}`;
    return left.localeCompare(right);
  });

  wrap.innerHTML = sorted.map((pub) => {
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
