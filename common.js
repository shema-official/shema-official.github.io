// index.html / admin.html 공용. Tailwind Play CDN 다음에 불러온다.
const API = 'https://script.google.com/macros/s/AKfycbyB53K2SiWCA53EdWJIm5FUjlks5D67J042nxLNXrjh5u-rueEXtqOoEKqEfDrNO9jb/exec'; // Apps Script 웹 앱 URL (.../exec)

tailwind.config = {
  theme: { extend: {
    fontFamily: { sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'] },
    colors: { brand: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' } },
  } },
};

// 두 화면이 같이 쓰는 컴포넌트 클래스
document.head.insertAdjacentHTML('beforeend', `<style type="text/tailwindcss">
  body { @apply bg-slate-50 text-slate-900 antialiased min-h-screen; }
  .card { @apply bg-white rounded-2xl border border-slate-200/80 shadow-sm; }
  .btn { @apply inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:pointer-events-none; }
  .btn-primary { @apply bg-brand-600 border-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20; }
  .btn-dark { @apply bg-slate-900 border-slate-900 text-white hover:bg-slate-800; }
  .inp { @apply w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all; }
  .eyebrow { @apply text-xs font-bold uppercase tracking-wider; }
  .glass { background: rgba(255,255,255,.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  .fade-in { animation: fadeIn .3s cubic-bezier(.16,1,.3,1) both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } }
  .pop { animation: pop .45s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes pop { from { opacity: 0; transform: scale(.6); } }
  .sw { position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
  .sw input { position: absolute; opacity: 0; pointer-events: none; }
  .sw i { width: 36px; height: 20px; border-radius: 99px; background: #e2e8f0; position: relative; transition: .2s; flex: none; }
  .sw i::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px #0003; transition: .2s; }
  .sw input:checked + i { background: #334155; }
  .sw input:checked + i::after { transform: translateX(16px); }
  @media (prefers-reduced-motion: reduce) { *, *::after { animation: none !important; transition: none !important; } }
</style>`);

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = d => { const t = new Date(d + 'T00:00'); return `${t.getMonth() + 1}/${t.getDate()} (${'일월화수목금토'[t.getDay()]})`; };
const evName = ev => `${fmt(ev.date)} ${ev.label}${ev.time ? ' ' + ev.time : ''}`;
const ansText = r => r.attend === 'Y' ? `참석${r.roles ? `(${r.roles.split(',').join('·')})` : ''}` : `불참(${r.reason || '-'}, 주일 ${r.sundayOk === 'Y' ? '가능' : '불가'})`;
const icons = () => window.lucide?.createIcons();
const SKELETON = '<div class="card h-24 mb-4 animate-pulse bg-slate-100 border-none"></div>'.repeat(3);

function nextMonth() {
  const n = new Date();
  n.setDate(1);
  n.setMonth(n.getMonth() + 1);
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

async function call(res) {
  const j = await (await res).json();
  if (j.error) throw new Error(j.error);
  return j;
}
const get = month => call(fetch(`${API}?month=${month}`));
// text/plain 본문이라 CORS preflight 없이 Apps Script로 보낼 수 있다.
const post = body => call(fetch(API, { method: 'POST', body: JSON.stringify(body) }));

const TOAST = { ok: 'bg-emerald-600', err: 'bg-rose-600', info: 'bg-slate-900' };
function toast(msg, kind = 'info') {
  let box = $('#toasts');
  if (!box) document.body.insertAdjacentHTML('beforeend', '<div id="toasts" class="fixed bottom-24 sm:bottom-5 inset-x-4 sm:inset-x-auto sm:right-5 z-[60] flex flex-col items-center sm:items-end gap-2 pointer-events-none"></div>'), box = $('#toasts');
  const t = document.createElement('div');
  t.className = `fade-in ${TOAST[kind]} text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-sm`;
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.remove(), 3200);
}

// 저장 중에는 화면 전체를 덮는 로딩 표시를 띄우고 중복 클릭을 막는다.
async function run(btn, fn, label = '저장 중…') {
  const ov = document.createElement('div');
  ov.className = 'fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center fade-in';
  ov.innerHTML = `<div class="bg-white rounded-2xl shadow-xl px-6 py-5 flex items-center gap-3 font-bold text-sm">
    <span class="w-5 h-5 rounded-full border-[3px] border-brand-100 border-t-brand-600 animate-spin"></span>${esc(label)}</div>`;
  document.body.append(ov);
  if (btn) btn.disabled = true;
  try { await fn(); } catch (e) { toast(e.message, 'err'); } finally { if (btn) btn.disabled = false; ov.remove(); icons(); }
}

// 공통 헤더. right 에는 화면별 오른쪽 요소를 넣는다.
function header(sub) {
  document.body.insertAdjacentHTML('afterbegin', `<header class="sticky top-0 z-40 glass border-b border-slate-200/80">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20"><i data-lucide="music-4" class="w-5 h-5"></i></div>
        <div class="min-w-0"><h1 class="font-bold text-base sm:text-lg tracking-tight truncate">찬양팀 연습 참여 조사</h1>
          <p class="text-xs text-slate-500 hidden sm:block">${sub}</p></div>
      </div>
      <input type="month" id="month" aria-label="조사 월" class="w-36 sm:w-auto shrink-0 bg-white border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500">
    </div></header>`);
}
