// Minimal data-driven homepage (no build tools)
async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === 'class') e.className = v;
    else if(k.startsWith('data-')) e.setAttribute(k, v);
    else if(k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for(const c of children){
    if(typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if(c) e.appendChild(c);
  }
  return e;
}

function badgeLink(text, href){
  if(!href) return null;
  const a = el('a', {href, target:'_blank', rel:'noreferrer'}, [text]);
  return el('span', {class:'badge'}, [a]);
}

function renderNews(news){
  const wrap = document.getElementById('newsList');
  wrap.innerHTML = '';
  news
    .sort((a,b)=> (b.date || '').localeCompare(a.date || ''))
    .forEach(n=>{
      const item = el('div', {class:'item'}, [
        el('div', {class:'top'}, [
          el('div', {class:'title'}, [n.title]),
          el('div', {class:'label'}, [n.date || ''])
        ]),
        n.note ? el('div', {class:'authors'}, [n.note]) : null
      ]);
      wrap.appendChild(item);
    });
}

function formatAuthors(authors){
  if(!authors) return '';
  // allow authors as a string or array
  if(Array.isArray(authors)) return authors.join(', ');
  return authors;
}

function renderPublications(pubs, query='', kind='all'){
  const wrap = document.getElementById('pubList');
  wrap.innerHTML = '';
  const q = query.trim().toLowerCase();

  pubs
    .filter(p => (kind==='all' || (p.type||'').toLowerCase()===kind))
    .filter(p => {
      if(!q) return true;
      const blob = `${p.title||''} ${formatAuthors(p.authors)} ${p.venue||''} ${p.year||''}`.toLowerCase();
      return blob.includes(q);
    })
    .sort((a,b)=> (String(b.year||'')+String(b.month||'')).localeCompare(String(a.year||'')+String(a.month||'')))
    .forEach(p=>{
      const badges = el('div', {class:'badges'}, [
        badgeLink('PDF', p.pdf),
        badgeLink('Code', p.code),
        badgeLink('Project', p.project),
        badgeLink('BibTeX', p.bibtex),
        badgeLink('Slides', p.slides),
      ].filter(Boolean));

      const item = el('div', {class:'item'}, [
        el('div', {class:'top'}, [
          el('div', {class:'title'}, [p.title || 'Untitled']),
          el('div', {class:'label'}, [`${p.venue || ''}${p.year ? ' · '+p.year : ''}`])
        ]),
        el('div', {class:'authors'}, [formatAuthors(p.authors)]),
        p.note ? el('div', {class:'venue'}, [p.note]) : null,
        badges.childNodes.length ? badges : null
      ].filter(Boolean));

      wrap.appendChild(item);
    });
}

function renderProjects(projects, query=''){
  const wrap = document.getElementById('projGrid');
  wrap.innerHTML = '';
  const q = query.trim().toLowerCase();

  projects
    .filter(p => {
      if(!q) return true;
      const blob = `${p.title||''} ${p.desc||''} ${(p.tags||[]).join(' ')}`.toLowerCase();
      return blob.includes(q);
    })
    .forEach(p=>{
      const tags = el('div', {class:'tags'}, (p.tags||[]).map(t => el('span', {class:'tag'}, [t])));
      const title = p.url ? el('a', {href:p.url, target:'_blank', rel:'noreferrer'}, [p.title]) : document.createTextNode(p.title);
      const card = el('div', {class:'proj'}, [
        el('h3', {}, [title]),
        p.desc ? el('p', {}, [p.desc]) : null,
        (p.tags && p.tags.length) ? tags : null
      ].filter(Boolean));
      wrap.appendChild(card);
    });
}

function wireToggle(){
  document.querySelectorAll('[data-action="toggle-all"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if(!target) return;
      target.classList.toggle('collapsed');
      if(target.classList.contains('collapsed')){
        target.style.display = 'none';
      }else{
        target.style.display = '';
      }
    });
  });
}

async function main(){
  // footer dates
  const now = new Date();
  document.getElementById('year').textContent = String(now.getFullYear());
  document.getElementById('lastUpdated').textContent = `Last updated: ${now.toISOString().slice(0,10)}`;

  wireToggle();

  const [news, pubs, projects] = await Promise.all([
    loadJSON('data/news.json'),
    loadJSON('data/publications.json'),
    loadJSON('data/projects.json'),
  ]);

  renderNews(news);
  renderPublications(pubs);
  renderProjects(projects);

  const pubSearch = document.getElementById('pubSearch');
  const pubFilter = document.getElementById('pubFilter');
  pubSearch.addEventListener('input', ()=> renderPublications(pubs, pubSearch.value, pubFilter.value));
  pubFilter.addEventListener('change', ()=> renderPublications(pubs, pubSearch.value, pubFilter.value));

  const projSearch = document.getElementById('projSearch');
  projSearch.addEventListener('input', ()=> renderProjects(projects, projSearch.value));
}

main().catch(err=>{
  console.error(err);
  const main = document.getElementById('main');
  // main.prepend(el('div', {class:'section'}, [
  //   el('h2', {}, ['加载数据失败']),
  //   el('p', {}, ['请检查 data/*.json 是否存在，以及 GitHub Pages 是否正确部署。'])
  // ]));
});
