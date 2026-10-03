import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, MEMBERS } from './config.js';

const app = document.getElementById('app');
const sidePanel = document.getElementById('sidePanel');
const backdrop = document.getElementById('backdrop');
const menuBtn = document.getElementById('menuBtn');
const closeMenu = document.getElementById('closeMenu');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const signedAs = document.getElementById('signedAs');
const authDialog = document.getElementById('authDialog');
const authForm = document.getElementById('authForm');
const authClose = document.getElementById('authClose');
const authNote = document.getElementById('authNote');
const secretCode = document.getElementById('secretCode');
const toast = document.getElementById('toast');

const configured = SUPABASE_URL.includes('YOUR-PROJECT') === false && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  route: 'home',
  session: null,
  currentUser: null,
  data: {
    wishes: [], places: [], reviews: [], moments: [], friends: [], dates: [], quotes: [], gratitude: []
  }
};

const tableMap = {
  wishes: 'wishes',
  places: 'places',
  reviews: 'reviews',
  moments: 'moments',
  friends: 'friends_meetings',
  dates: 'date_ideas',
  quotes: 'quotes',
  gratitude: 'gratitude'
};

const routeMeta = {
  home: ['НАША ГЛАВНАЯ', 'Место, где живут наши планы, приколы и маленькие истории.'],
  wishes: ['ХОТЕЛКИ', 'То, что однажды точно хочется сделать вместе.'],
  places: ['КУДА СХОДИТЬ', 'Планы на места, дату и время — без поиска по переписке.'],
  reviews: ['РЕСТОРАНЫ И КАФЕ', 'Собираем честный семейный рейтинг от 1 до 10.'],
  moments: ['СМЕШНЫЕ МОМЕНТЫ', 'Фразы, истории и ситуации, которые нельзя забывать.'],
  friends: ['ВСТРЕЧИ С ДРУЗЬЯМИ', 'Когда встретили друзей из другого города.'],
  dates: ['ИДЕИ ДЛЯ СВИДАНИЙ', 'Идеи, которые можно превращать в реальные планы.'],
  quotes: ['НАШИ ФРАЗЫ', 'Локальные мемы, цитаты и слова, которые понятны только нам.'],
  gratitude: ['МАЛЕНЬКИЕ РАДОСТИ', 'Небольшие вещи, которые хочется запомнить.']
};

function fmtDate(value, withTime = true) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}

function fmtShort(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[c]));
}

function toastMsg(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastMsg._timer);
  toastMsg._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openMenu() {
  sidePanel.classList.add('open');
  backdrop.classList.add('show');
  sidePanel.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
}
function closeMenuFn() {
  sidePanel.classList.remove('open');
  backdrop.classList.remove('show');
  sidePanel.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
}

function requireLogin() {
  if (state.session) return true;
  authNote.textContent = 'Сначала войди по своему секретному коду.';
  if (!authDialog.open) authDialog.showModal();
  setTimeout(() => secretCode.focus(), 0);
  return false;
}

function setUser(user) {
  state.currentUser = user;
  signedAs.textContent = user ? `Вошёл: ${user.display}` : 'Гость';
  logoutBtn.classList.toggle('hidden', !user);
  document.querySelector('.login-dot')?.classList.toggle('logged', !!user);
}

function updateNav() {
  document.querySelectorAll('[data-route]').forEach(el => {
    if (el.classList.contains('nav-item')) el.classList.toggle('active', el.dataset.route === state.route);
  });
}

async function loadData() {
  if (!supabase) return;
  const tables = Object.entries(tableMap);
  for (const [key, table] of tables) {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (!error) state.data[key] = data || [];
  }
}

function authorName(id) {
  const found = state.data.wishes.concat(state.data.moments, state.data.quotes).find(x => x.author_id === id && x.author_name);
  if (found?.author_name) return found.author_name;
  return id ? 'Участник' : '—';
}

function authorPill(item) {
  return item.author_name ? `<span class="pill author-pill">${escapeHtml(item.author_name)}</span>` : '';
}

function formBlock(title, body) {
  return `<section class="card form-card"><div class="section-head" style="margin:0 0 12px"><div><span class="eyebrow">ДОБАВИТЬ</span><h2 style="margin:4px 0 0;font-family:'Playfair Display',serif;font-size:25px">${escapeHtml(title)}</h2></div></div>${body}</section>`;
}

function sectionHead(route) {
  const [eyebrow, title] = routeMeta[route];
  return `<div class="section-head"><div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(title)}</h1></div><div class="muted" style="font-size:12px">${state.currentUser ? 'режим редактирования' : 'режим просмотра'}</div></div>`;
}

function renderHome() {
  const wishes = state.data.wishes.filter(x => !x.done);
  const upcomingPlaces = state.data.places.filter(x => x.event_at && new Date(x.event_at) >= new Date()).sort((a,b) => new Date(a.event_at)-new Date(b.event_at));
  const upcoming = upcomingPlaces[0];
  const reviews = [...state.data.reviews].sort((a,b) => b.rating - a.rating).slice(0, 3);
  const moments = state.data.moments.slice(0, 3);
  const quote = state.data.quotes[0];

  return `
    <section class="hero">
      <span class="eyebrow">НАША МАЛЕНЬКАЯ ВСЕЛЕННАЯ</span>
      <h1>Привет, двое ♡</h1>
      <p>Здесь можно хранить всё, что обычно теряется в переписке: планы, хотелки, любимые места, локальные шутки и даты, которые хочется помнить.</p>
    </section>

    <div class="grid dashboard-grid">
      <section class="card next-card">
        <div class="label-row"><span class="eyebrow">БЛИЖАЙШИЙ ПЛАН</span><span class="pill">⌖</span></div>
        ${upcoming ? `<h3>${escapeHtml(upcoming.title)}</h3><div class="big-date">${fmtDate(upcoming.event_at)}</div><div class="countdown" data-countdown="${escapeHtml(upcoming.event_at)}"></div>` : `<h3>Пока пусто</h3><div class="big-date">Добавьте место, куда хотите сходить вместе.</div>`}
      </section>
      <div class="grid">
        <section class="card"><div class="mini-stat"><div class="mini-icon icon-rose">♡</div><div><strong>${wishes.length}</strong><span>незакрытых хотелок</span></div></div></section>
        <section class="card"><div class="mini-stat"><div class="mini-icon icon-peach">★</div><div><strong>${state.data.reviews.length}</strong><span>оценённых мест</span></div></div></section>
        <section class="card"><div class="mini-stat"><div class="mini-icon icon-sage">☻</div><div><strong>${state.data.moments.length}</strong><span>смешных моментов</span></div></div></section>
      </div>
    </div>

    <div class="small-divider"></div>

    <div class="grid dashboard-grid">
      <section class="card soft">
        <span class="eyebrow">ТОП МЕСТ</span>
        <h3 style="font-family:'Playfair Display',serif;font-size:28px;margin:8px 0 14px">Куда вернуться</h3>
        <div class="list">
          ${reviews.length ? reviews.map(r => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(r.place_name)}</h3><div class="rating">${'★'.repeat(Math.max(0, Math.min(10, r.rating)))}</div><p>${escapeHtml(r.comment || 'Без комментария')}</p></div><div class="pill">${r.rating}/10</div></div>`).join('') : '<div class="empty">Пока нет отзывов.</div>'}
        </div>
      </section>

      <section class="card quote-card">
        <span class="eyebrow">НАША ФРАЗА</span>
        ${quote ? `<div class="quote-text">“${escapeHtml(quote.text)}”</div><div class="muted">${authorPill(quote)}</div>` : `<div class="quote-text">“Добавьте сюда фразу, которую понимаете только вы двое.”</div>`}
      </section>
    </div>

    <div class="small-divider"></div>

    <section class="card">
      <div class="section-head" style="margin-bottom:12px"><div><span class="eyebrow">ПОСЛЕДНЕЕ</span><h2 style="margin:5px 0 0;font-family:'Playfair Display',serif;font-size:28px">Что нового</h2></div></div>
      <div class="list">
        ${moments.length ? moments.map(m => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.text)}</p><div class="meta"><span>${fmtShort(m.happened_at)}</span>${authorPill(m)}</div></div></div>`).join('') : '<div class="empty">Здесь будут последние смешные истории.</div>'}
      </div>
    </section>
  `;
}

function renderWishes() {
  const body = `<div class="form-grid"><div><label class="field-label">Что хочется сделать?</label><input id="wishText" class="field-input" placeholder="Например: съездить на море на выходные" /></div><div class="form-actions"><button class="primary-btn" data-action="add-wish">Добавить хотелку</button></div></div>`;
  return `${sectionHead('wishes')}${state.currentUser ? formBlock('Новая хотелка', body) : ''}<div class="list">${state.data.wishes.length ? state.data.wishes.map(item => `<div class="item-card ${item.done ? 'done' : ''}"><div class="item-main"><h3>${escapeHtml(item.text)}</h3><div class="meta"><span class="pill">${item.done ? 'выполнено' : 'в планах'}</span>${authorPill(item)}<span>${fmtShort(item.created_at)}</span></div></div><div class="item-actions">${state.currentUser ? `<button class="small-btn" data-action="toggle-wish" data-id="${item.id}">${item.done ? 'Вернуть' : 'Готово'}</button><button class="small-btn danger" data-action="delete" data-table="wishes" data-id="${item.id}">×</button>` : ''}</div></div>`).join('') : '<div class="empty">Пока ни одной хотелки.</div>'}</div>`;
}

function renderPlaces() {
  const body = `<div class="form-grid"><div><label class="field-label">Название места</label><input id="placeTitle" class="field-input" placeholder="Например: маленькая кофейня в центре" /></div><div class="form-grid two"><div><label class="field-label">Дата и время</label><input id="placeAt" class="field-input" type="datetime-local" /></div><div><label class="field-label">Заметка</label><input id="placeNote" class="field-input" placeholder="Что хотим там сделать" /></div></div><div class="form-actions"><button class="primary-btn" data-action="add-place">Добавить план</button></div></div>`;
  return `${sectionHead('places')}${state.currentUser ? formBlock('Новое место', body) : ''}<div class="list">${state.data.places.length ? state.data.places.map(item => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note || 'Без заметки')}</p><div class="meta"><span class="pill">${fmtDate(item.event_at)}</span>${authorPill(item)}</div></div>${state.currentUser ? `<button class="small-btn danger" data-action="delete" data-table="places" data-id="${item.id}">×</button>` : ''}</div>`).join('') : '<div class="empty">Пока нет запланированных мест.</div>'}</div>`;
}

function renderReviews() {
  const body = `<div class="form-grid"><div><label class="field-label">Ресторан или кафе</label><input id="reviewPlace" class="field-input" placeholder="Например: название места" /></div><div class="form-grid two"><div><label class="field-label">Оценка 1–10</label><input id="reviewRating" class="field-input" type="number" min="1" max="10" value="10" /></div><div><label class="field-label">Комментарий</label><input id="reviewComment" class="field-input" placeholder="Что понравилось / не понравилось" /></div></div><div class="form-actions"><button class="primary-btn" data-action="add-review">Добавить отзыв</button></div></div>`;
  const sorted = [...state.data.reviews].sort((a,b) => b.rating-a.rating);
  return `${sectionHead('reviews')}${state.currentUser ? formBlock('Новый отзыв', body) : ''}<div class="list">${sorted.length ? sorted.map(item => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(item.place_name)}</h3><div class="rating">${'★'.repeat(item.rating)}${'☆'.repeat(10-item.rating)}</div><p>${escapeHtml(item.comment || 'Без комментария')}</p><div class="meta">${authorPill(item)}<span>${fmtShort(item.created_at)}</span></div></div><div class="pill">${item.rating}/10</div></div>`).join('') : '<div class="empty">Пока никто не оценил ни одного места.</div>'}</div>`;
}

function renderMoments() {
  const body = `<div class="form-grid"><div><label class="field-label">Что произошло?</label><input id="momentTitle" class="field-input" placeholder="Например: тот самый поход за мороженым" /></div><div><label class="field-label">История</label><textarea id="momentText" class="field-textarea" placeholder="Запишите, что было смешного..."></textarea></div><div class="form-grid two"><div><label class="field-label">Дата и время</label><input id="momentAt" class="field-input" type="datetime-local" /></div><div class="form-actions"><button class="primary-btn" data-action="add-moment">Сохранить момент</button></div></div></div>`;
  return `${sectionHead('moments')}${state.currentUser ? formBlock('Новый момент', body) : ''}<div class="list">${state.data.moments.length ? state.data.moments.map(item => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><div class="meta"><span class="pill">${fmtShort(item.happened_at)}</span>${authorPill(item)}</div></div>${state.currentUser ? `<button class="small-btn danger" data-action="delete" data-table="moments" data-id="${item.id}">×</button>` : ''}</div>`).join('') : '<div class="empty">Пока нет смешных моментов. Это подозрительно.</div>'}</div>`;
}

function renderFriends() {
  const body = `<div class="form-grid"><div><label class="field-label">С кем встретились?</label><input id="friendName" class="field-input" placeholder="Например: Саша и Катя" /></div><div class="form-grid two"><div><label class="field-label">Дата и время</label><input id="friendAt" class="field-input" type="datetime-local" /></div><div><label class="field-label">Заметка</label><input id="friendNote" class="field-input" placeholder="Где были / что делали" /></div></div><div class="form-actions"><button class="primary-btn" data-action="add-friend">Сохранить встречу</button></div></div>`;
  return `${sectionHead('friends')}${state.currentUser ? formBlock('Новая встреча', body) : ''}<div class="list">${state.data.friends.length ? state.data.friends.map(item => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(item.friends_name)}</h3><p>${escapeHtml(item.note || '')}</p><div class="meta"><span class="pill">${fmtDate(item.happened_at)}</span>${authorPill(item)}</div></div>${state.currentUser ? `<button class="small-btn danger" data-action="delete" data-table="friends" data-id="${item.id}">×</button>` : ''}</div>`).join('') : '<div class="empty">Пока нет записей о встречах.</div>'}</div>`;
}

function renderDates() {
  const body = `<div class="form-grid"><div><label class="field-label">Идея для свидания</label><input id="dateTitle" class="field-input" placeholder="Например: пикник на закате" /></div><div><label class="field-label">Описание</label><textarea id="dateText" class="field-textarea" placeholder="Почему хотим это сделать..."></textarea></div><div class="form-actions"><button class="primary-btn" data-action="add-date">Добавить идею</button></div></div>`;
  return `${sectionHead('dates')}${state.currentUser ? formBlock('Новая идея', body) : ''}<div class="list">${state.data.dates.length ? state.data.dates.map(item => `<div class="item-card"><div class="item-main"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text || '')}</p><div class="meta">${authorPill(item)}<span>${fmtShort(item.created_at)}</span></div></div>${state.currentUser ? `<button class="small-btn danger" data-action="delete" data-table="dates" data-id="${item.id}">×</button>` : ''}</div>`).join('') : '<div class="empty">Сюда можно скидывать любые идеи для свиданий.</div>'}</div>`;
}

function renderQuotes() {
  const body = `<div class="form-grid"><div><label class="field-label">Фраза / локальный мем</label><input id="quoteText" class="field-input" placeholder="Фраза, которую нельзя потерять" /></div><div class="form-actions"><button class="primary-btn" data-action="add-quote">Сохранить фразу</button></div></div>`;
  return `${sectionHead('quotes')}${state.currentUser ? formBlock('Новая фраза', body) : ''}<div class="grid">${state.data.quotes.length ? state.data.quotes.map(item => `<div class="card quote-card"><div class="quote-text">“${escapeHtml(item.text)}”</div><div class="meta">${authorPill(item)}<span>${fmtShort(item.created_at)}</span></div>${state.currentUser ? `<div class="form-actions"><button class="small-btn danger" data-action="delete" data-table="quotes" data-id="${item.id}">Удалить</button></div>` : ''}</div>`).join('') : '<div class="empty">Пока нет фраз. Жизнь, судя по всему, слишком серьёзная.</div>'}</div>`;
}

function renderGratitude() {
  const body = `<div class="form-grid"><div><label class="field-label">Маленькая радость</label><input id="gratitudeText" class="field-input" placeholder="Что сегодня порадовало" /></div><div class="form-actions"><button class="primary-btn" data-action="add-gratitude">Записать</button></div></div>`;
  return `${sectionHead('gratitude')}${state.currentUser ? formBlock('Небольшая запись', body) : ''}<div class="list">${state.data.gratitude.length ? state.data.gratitude.map(item => `<div class="item-card"><div class="item-main"><h3>✦ ${escapeHtml(item.text)}</h3><div class="meta">${authorPill(item)}<span>${fmtShort(item.created_at)}</span></div></div>${state.currentUser ? `<button class="small-btn danger" data-action="delete" data-table="gratitude" data-id="${item.id}">×</button>` : ''}</div>`).join('') : '<div class="empty">Можно записать любую мелочь, которая сделала день лучше.</div>'}</div>`;
}

function render() {
  updateNav();
  if (state.route === 'home') app.innerHTML = renderHome();
  if (state.route === 'wishes') app.innerHTML = renderWishes();
  if (state.route === 'places') app.innerHTML = renderPlaces();
  if (state.route === 'reviews') app.innerHTML = renderReviews();
  if (state.route === 'moments') app.innerHTML = renderMoments();
  if (state.route === 'friends') app.innerHTML = renderFriends();
  if (state.route === 'dates') app.innerHTML = renderDates();
  if (state.route === 'quotes') app.innerHTML = renderQuotes();
  if (state.route === 'gratitude') app.innerHTML = renderGratitude();
  startCountdowns();
}

function startCountdowns() {
  document.querySelectorAll('[data-countdown]').forEach(el => {
    const tick = () => {
      const target = new Date(el.dataset.countdown).getTime();
      const diff = target - Date.now();
      if (diff <= 0) { el.textContent = 'Уже сейчас ✨'; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      el.textContent = `Через ${d ? `${d} д ` : ''}${h} ч ${m} мин`;
    };
    tick();
    setInterval(tick, 60000);
  });
}

async function insert(tableKey, row) {
  if (!requireLogin()) return;
  const table = tableMap[tableKey];
  const payload = { ...row, author_id: state.currentUser.id, author_name: state.currentUser.display };
  const { error } = await supabase.from(table).insert(payload);
  if (error) { toastMsg(error.message); return; }
  await loadData(); render(); toastMsg('Готово ♡');
}

async function remove(tableKey, id) {
  if (!requireLogin()) return;
  const { error } = await supabase.from(tableMap[tableKey]).delete().eq('id', id);
  if (error) { toastMsg(error.message); return; }
  await loadData(); render(); toastMsg('Удалено');
}

async function toggleWish(id, done) {
  if (!requireLogin()) return;
  const { error } = await supabase.from('wishes').update({ done: !done }).eq('id', id);
  if (error) { toastMsg(error.message); return; }
  await loadData(); render(); toastMsg(done ? 'Вернули в планы' : 'Отмечено выполненным ✨');
}

async function tryLogin(code) {
  if (!supabase) {
    authNote.textContent = 'Сначала заполни config.js: Supabase URL и anon key.';
    return;
  }
  authNote.textContent = 'Проверяю код…';
  const candidates = [
    { ...MEMBERS.me, display: MEMBERS.me.name },
    { ...MEMBERS.her, display: MEMBERS.her.name }
  ];

  for (const candidate of candidates) {
    if (!candidate.email || candidate.email.includes('YOUR_EMAIL')) continue;
    const { data, error } = await supabase.auth.signInWithPassword({ email: candidate.email, password: code });
    if (!error && data.session && data.user) {
      state.session = data.session;
      state.currentUser = { id: data.user.id, display: candidate.display };
      localStorage.setItem('love_session', JSON.stringify(data.session));
      setUser(state.currentUser);
      authNote.textContent = '';
      authDialog.close();
      secretCode.value = '';
      await loadData();
      render();
      toastMsg(`Привет, ${candidate.display} ♡`);
      return;
    }
  }
  authNote.textContent = 'Неверный секретный код.';
}

async function restoreSession() {
  if (!supabase) return;
  const stored = localStorage.getItem('love_session');
  if (stored) {
    try {
      const session = JSON.parse(stored);
      const { data, error } = await supabase.auth.setSession(session);
      if (!error && data.session) {
        const email = data.session.user.email;
        let display = 'Участник';
        if (email === MEMBERS.me.email) display = MEMBERS.me.name;
        if (email === MEMBERS.her.email) display = MEMBERS.her.name;
        state.session = data.session;
        state.currentUser = { id: data.session.user.id, display };
        setUser(state.currentUser);
      }
    } catch (_) {}
  }
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      localStorage.removeItem('love_session');
      state.session = null;
      setUser(null);
      return;
    }
    localStorage.setItem('love_session', JSON.stringify(session));
    state.session = session;
  });
  return () => listener.subscription.unsubscribe();
}

async function boot() {
  if (!configured) {
    app.innerHTML = `<section class="hero"><span class="eyebrow">НАСТРОЙКА</span><h1>Почти готово ♡</h1><p>Открой <b>config.js</b> и впиши Supabase URL, anon key и два email аккаунтов. Сам дизайн уже работает.</p><div class="card" style="margin-top:20px"><h3 style="margin-top:0">Что нужно сделать</h3><p class="muted">1) создать Supabase проект → 2) выполнить <b>supabase/schema.sql</b> → 3) создать два email/password аккаунта, где пароли — ваши секретные коды → 4) заполнить config.js → 5) выложить папку на GitHub Pages.</p></div></section>`;
    setUser(null);
    return;
  }
  await restoreSession();
  await loadData();
  render();
}

menuBtn.addEventListener('click', openMenu);
closeMenu.addEventListener('click', closeMenuFn);
backdrop.addEventListener('click', closeMenuFn);
loginBtn.addEventListener('click', () => {
  if (state.session) toastMsg(`Ты вошёл как ${state.currentUser.display}`);
  else { authNote.textContent = ''; authDialog.showModal(); setTimeout(() => secretCode.focus(), 0); }
});
authClose.addEventListener('click', () => authDialog.close());
logoutBtn.addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem('love_session');
  state.session = null;
  setUser(null);
  closeMenuFn();
  render();
  toastMsg('Вышли из аккаунта');
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await tryLogin(secretCode.value.trim());
});

document.addEventListener('click', async (e) => {
  const route = e.target.closest('[data-route]');
  if (route) {
    state.route = route.dataset.route;
    closeMenuFn();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const action = e.target.closest('[data-action]');
  if (!action) return;
  const a = action.dataset.action;
  if (a === 'add-wish') {
    const text = document.getElementById('wishText')?.value.trim();
    if (!text) return toastMsg('Напиши, что хочется сделать.');
    await insert('wishes', { text, done: false });
  }
  if (a === 'toggle-wish') {
    const item = state.data.wishes.find(x => String(x.id) === String(action.dataset.id));
    if (item) await toggleWish(item.id, item.done);
  }
  if (a === 'add-place') {
    const title = document.getElementById('placeTitle')?.value.trim();
    const event_at = document.getElementById('placeAt')?.value;
    const note = document.getElementById('placeNote')?.value.trim();
    if (!title || !event_at) return toastMsg('Нужны название, дата и время.');
    await insert('places', { title, event_at: new Date(event_at).toISOString(), note });
  }
  if (a === 'add-review') {
    const place_name = document.getElementById('reviewPlace')?.value.trim();
    const rating = Number(document.getElementById('reviewRating')?.value);
    const comment = document.getElementById('reviewComment')?.value.trim();
    if (!place_name || rating < 1 || rating > 10) return toastMsg('Укажи место и оценку от 1 до 10.');
    await insert('reviews', { place_name, rating, comment });
  }
  if (a === 'add-moment') {
    const title = document.getElementById('momentTitle')?.value.trim();
    const text = document.getElementById('momentText')?.value.trim();
    const happened_at = document.getElementById('momentAt')?.value;
    if (!title || !text || !happened_at) return toastMsg('Заполни название, историю и дату.');
    await insert('moments', { title, text, happened_at: new Date(happened_at).toISOString() });
  }
  if (a === 'add-friend') {
    const friends_name = document.getElementById('friendName')?.value.trim();
    const happened_at = document.getElementById('friendAt')?.value;
    const note = document.getElementById('friendNote')?.value.trim();
    if (!friends_name || !happened_at) return toastMsg('Нужны имена, дата и время.');
    await insert('friends', { friends_name, happened_at: new Date(happened_at).toISOString(), note });
  }
  if (a === 'add-date') {
    const title = document.getElementById('dateTitle')?.value.trim();
    const text = document.getElementById('dateText')?.value.trim();
    if (!title) return toastMsg('Придумай название идеи.');
    await insert('dates', { title, text });
  }
  if (a === 'add-quote') {
    const text = document.getElementById('quoteText')?.value.trim();
    if (!text) return toastMsg('Нужна сама фраза.');
    await insert('quotes', { text });
  }
  if (a === 'add-gratitude') {
    const text = document.getElementById('gratitudeText')?.value.trim();
    if (!text) return toastMsg('Напиши маленькую радость.');
    await insert('gratitude', { text });
  }
  if (a === 'delete') await remove(action.dataset.table, action.dataset.id);
});

boot();
