// index.html / admin.html 공용
const API = 'https://script.google.com/macros/s/AKfycbyB53K2SiWCA53EdWJIm5FUjlks5D67J042nxLNXrjh5u-rueEXtqOoEKqEfDrNO9jb/exec'; // Apps Script 웹 앱 URL (.../exec)

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = d => { const t = new Date(d + 'T00:00'); return `${t.getMonth() + 1}/${t.getDate()}(${'일월화수목금토'[t.getDay()]})`; };
const evName = ev => `${fmt(ev.date)} ${ev.label}${ev.time ? ' ' + ev.time : ''}`;
const ansText = r => r.attend === 'Y' ? '참석' : `불참(${r.reason || '-'}, 주일 ${r.sundayOk === 'Y' ? '가능' : '불가'})`;

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

// 저장 중에는 화면 전체를 덮는 로딩 표시를 띄우고 중복 클릭을 막는다.
async function run(btn, fn, label = '저장 중…') {
  const ov = document.createElement('div');
  ov.className = 'loading';
  ov.innerHTML = `<div><span class="spin"></span>${esc(label)}</div>`;
  document.body.append(ov);
  btn.disabled = true;
  try { await fn(); } catch (e) { alert(e.message); } finally { btn.disabled = false; ov.remove(); }
}
