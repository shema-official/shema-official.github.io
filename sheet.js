// 연습표: 멤버 색상·캐릭터와 표 그리기. 관리자·멤버 화면이 같이 쓴다. common.js 다음에 불러온다.

const posOf = m => { const mine = (m?.positions || '').split(','); return D.positions.map(p => p.name).filter(n => mine.includes(n)); };

// 멤버 색상 36가지: 진한 색 18 + 파스텔 18. 지정하지 않았으면 이름으로 하나 고른다.
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c',
  '#fca5a5', '#fdba74', '#fcd34d', '#fde047', '#bef264', '#86efac', '#6ee7b7', '#5eead4', '#67e8f9',
  '#7dd3fc', '#93c5fd', '#a5b4fc', '#c4b5fd', '#d8b4fe', '#f0abfc', '#f9a8d4', '#fda4af', '#d6d3d1'];
const colorOf = m => m?.color || COLORS[[...(m?.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 18];

// 사람 캐릭터: 여성 16개(f:번호) + 남성 16개(m:번호). 머리 모양 8가지 × 피부·머리색 2가지씩.
// 멤버의 emoji 칸에 'f:3', 'm:10' 처럼 저장한다.
const LOOKS = [['#f9d7bd', '#2b211a'], ['#efc19f', '#6b3f22'], ['#d39a72', '#1c1714'], ['#f9d7bd', '#d9a441'],
  ['#a86f4c', '#120f0d'], ['#f3caa8', '#a4462b']];
const FRINGE = h => `<path d="M12 17.5c0-5.8 3.6-9.5 8-9.5s8 3.5 8 9.5c-3-1.8-5.4-4.2-6.4-6-1.6 2.6-5 4.8-9.6 6z" fill="${h}"/>`;
const CROP = h => `<path d="M12 18c0-6.5 3.6-10 8-10s8 3.5 8 10c-1.8-3.4-4.6-4.6-8-4.6s-6.2 1.2-8 4.6z" fill="${h}"/>`;
const circles = (h, pts, r) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${h}"/>`).join('');
// 각 스타일: [뒷머리(얼굴 뒤), 앞머리(얼굴 위)]
const FEMALE = [
  [h => `<path d="M11 18c0-7.5 4-11 9-11s9 3.5 9 11v13h-5v-12h-8v12h-5z" fill="${h}"/>`, FRINGE],            // 긴 생머리
  [h => `<path d="M10.5 20c0-8 4.2-12 9.5-12s9.5 4 9.5 12v5h-19z" fill="${h}"/>`,
    h => `<path d="M12 18c0-6 3.6-10 8-10s8 3.5 8 9.5c-4-1-8-3.5-9-6-1 2-3.5 5-7 6.5z" fill="${h}"/>`],       // 단발
  [h => `<path d="M26.5 11c4.5.5 6 7 3.5 13-1-3-2.4-5-4.5-6z" fill="${h}"/>`, FRINGE],                         // 포니테일
  [h => `<circle cx="20" cy="7" r="4" fill="${h}"/>`, FRINGE],                                                     // 올림머리
  [h => circles(h, [[10.5, 21], [29.5, 21]], 3.4) + circles(h, [[10, 26], [30, 26]], 2.6), FRINGE],               // 양갈래
  [h => `<path d="M11 18c0-7.5 4-11 9-11s9 3.5 9 11v4h-18z" fill="${h}"/>` + circles(h, [[11, 21], [10.5, 25.5], [11.5, 29.5], [29, 21], [29.5, 25.5], [28.5, 29.5]], 2.8), FRINGE], // 웨이브
  [() => '', h => `<path d="M12 17c0-6 3.6-9.5 8-9.5s8 3 8 8.5c-3-1.5-7-1.5-10-4-1.5 2-3.5 4-6 5z" fill="${h}"/>`], // 숏컷
  [h => `<path d="M11.5 18c0-7 3.8-10.5 8.5-10.5s8.5 3.5 8.5 10.5z" fill="${h}"/>` + circles(h, [[12, 22], [11.6, 25.4], [11.2, 28.8], [28, 22], [28.4, 25.4], [28.8, 28.8]], 1.9), FRINGE], // 땋은 머리
];
const MALE = [
  [() => '', CROP],                                                                                                 // 짧은 머리
  [() => '', h => `<path d="M12 18c0-6.5 3.6-10 8-10s8 3.5 8 10c-1-3-3-4.5-5-5-2 .5-7 .5-11 5z" fill="${h}"/>`], // 가르마
  [() => '', h => `<path d="M12 17l1.5-6.5 3 3 3.5-5.5 3.5 5.5 3-3 1.5 6.5c-2.2-2-5-3-8-3s-5.8 1-8 3z" fill="${h}"/>`], // 삐죽 머리
  [() => '', h => circles(h, [[12.5, 16], [14.5, 11.5], [20, 9.5], [25.5, 11.5], [27.5, 16]], 3.6)],              // 곱슬
  [() => '', h => `<path d="M12.2 16.5c.6-5 3.8-8.3 7.8-8.3s7.2 3.3 7.8 8.3c-2.2-1.6-5-2.3-7.8-2.3s-5.6.7-7.8 2.3z" fill="${h}" fill-opacity=".8"/>`], // 버즈컷
  [() => '', h => `<path d="M12 17c0-5 2.5-8 5-9 3-2.5 9-2 10.5 1.5 1 2 .5 5 .5 7.5-2-2.5-5-3.5-8-3.5s-6 1-8 3.5z" fill="${h}"/>`], // 올린 머리
  [h => `<path d="M11 19c0-7 4-11 9-11s9 4 9 11v4h-18z" fill="${h}"/>`, CROP],                                   // 장발
  [() => '', () => `<path d="M11.5 16c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5z" fill="#334155"/><path d="M20 14.6h11c0 1.4-.8 2.2-2 2.2h-9z" fill="#1e293b"/>`], // 모자
];
const BEARD = h => `<path d="M13.5 21c1 4 3.5 5.6 6.5 5.6s5.5-1.6 6.5-5.6c-1.5 1.4-3.5 2-6.5 2s-5-.6-6.5-2z" fill="${h}"/>`;
const GLASSES = '<g stroke="#2b2118" stroke-width=".9" fill="none"><circle cx="17" cy="18.5" r="2.4"/><circle cx="23" cy="18.5" r="2.4"/><path d="M19.4 18.5h1.2"/></g>';
const drawChar = (styles, female) => styles.flatMap(([back, front], s) => [0, 1].map(v => {
  const [skin, hair] = LOOKS[(s * 2 + v + (female ? 0 : 3)) % LOOKS.length];
  const glasses = (s + v) % 4 === 3, beard = !female && v === 1 && s % 3 === 0;
  return `<svg viewBox="0 0 40 40" class="w-full h-full" aria-hidden="true">${back(hair)}`
    + `<path d="M7 40c0-7.5 5.8-12.5 13-12.5S33 32.5 33 40z" fill="${female ? '#fff7fb' : '#f8fafc'}" fill-opacity=".92"/>`
    + `<rect x="17.5" y="23" width="5" height="6" rx="2" fill="${skin}"/><circle cx="20" cy="18" r="8" fill="${skin}"/>`
    + front(hair)
    + `<circle cx="17" cy="18.5" r="1.1" fill="#2b2118"/><circle cx="23" cy="18.5" r="1.1" fill="#2b2118"/>`
    + (female ? '<path d="M15.6 17.2l-.9-.7M24.4 17.2l.9-.7" stroke="#2b2118" stroke-width=".7" stroke-linecap="round"/>' : '')
    + `<circle cx="15.3" cy="21" r="1.3" fill="#f472b6" fill-opacity="${female ? '.5' : '.25'}"/><circle cx="24.7" cy="21" r="1.3" fill="#f472b6" fill-opacity="${female ? '.5' : '.25'}"/>`
    + (beard ? BEARD(hair) : '')
    + `<path d="M17.6 21.6q2.4 2 4.8 0" stroke="${female ? '#be185d' : '#2b2118'}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
    + (glasses ? GLASSES : '')
    + (female && s === 6 ? '<circle cx="12.2" cy="20.5" r=".9" fill="#fbbf24"/><circle cx="27.8" cy="20.5" r=".9" fill="#fbbf24"/>' : '')
    + `</svg>`;
}));
const CHARS = { f: drawChar(FEMALE, true), m: drawChar(MALE, false) };
// emoji 칸: 'f:번호'·'m:번호'면 캐릭터 그림, 예전 이모지 글자면 그 글자, 없으면 이름 첫 글자
const face = m => {
  const [, k, n] = /^([fm]):(\d+)$/.exec(m.emoji || '') || [];
  const text = /^c:/.test(m.emoji || '') ? '' : m.emoji; // c: 는 예전 캐릭터 번호
  return CHARS[k]?.[n] || `<span>${esc(text || m.name.charAt(0)) || '?'}</span>`;
};
const avatar = m => `<span class="avatar w-9 h-9 shrink-0 rounded-xl overflow-hidden font-bold text-sm flex items-center justify-center" style="background:${colorOf(m)}">${face(m)}</span>`;
// 표에 들어가는 이름 배지
const tag = name => {
  const m = D.members.find(x => x.name === name) || { name }, c = colorOf(m);
  return `<span class="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full font-semibold text-slate-800 whitespace-nowrap" style="background:${c}33">`
    + `<span class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-xs" style="background:${c}">${face(m)}</span>${esc(name)}</span>`;
};

function sheet(open, evById) {
  const head = `<div class="flex items-end justify-between border-b-2 border-slate-900 pb-5">
    <div><div class="inline-block px-2.5 py-1 rounded-md bg-brand-600 text-white text-xs font-bold mb-2">PRAISE TEAM SCHEDULE</div>
      <h2 class="text-2xl font-extrabold tracking-tight">${M().slice(0, 4)}년 ${+M().slice(5)}월 찬양팀 연습 참여표</h2></div>
    <span class="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">연습 ${open.length}회</span></div>`;
  return head + section('brand', '날짜별 · 포지션별 참석자', table1(open)) + section('rose', '불참자와 주일 예배 참석 여부', absent(evById));
}
const section = (c, t, body) => `<div><div class="flex items-center gap-2 mb-3"><span class="w-2 h-5 rounded-sm bg-${c === 'brand' ? 'brand-600' : 'rose-500'}"></span><h3 class="font-bold">${t}</h3></div>${body}</div>`;

function table1(open) {
  if (!open.length) return '<p class="text-sm text-slate-500">연습 일정이 없습니다.</p>';
  if (!D.positions.length) return '<p class="text-sm text-slate-500">포지션을 먼저 등록하세요.</p>';
  const byName = Object.fromEntries(D.members.map(m => [m.name, posOf(m)]));
  // 응답에 고른 역할이 있으면 그 역할로, 없으면(예전 응답) 멤버의 모든 포지션으로 센다.
  const cols = open.map(ev => D.responses.filter(r => r.eventId === ev.id && r.attend === 'Y'));
  const roles = r => r.roles ? r.roles.split(',') : byName[r.name] || [];
  return `<div class="overflow-hidden rounded-2xl border border-slate-200"><table class="w-full text-left border-collapse text-sm">
    <thead><tr class="bg-slate-900 text-white text-xs"><th class="px-3 py-3">포지션</th>${open.map(ev =>
      `<th class="px-3 py-3 text-center">${fmt(ev.date)}<div class="font-normal text-slate-300 mt-0.5">${esc(ev.label)}</div></th>`).join('')}</tr></thead>
    <tbody class="divide-y divide-slate-200">${D.positions.map((p, i) => `<tr><th class="px-3 py-2.5 font-bold whitespace-nowrap">${esc(p.name)}</th>${cols.map(ns => {
      const who = ns.filter(r => roles(r).includes(p.name)).map(r => r.name);
      return who.length ? `<td class="px-3 py-2.5 text-center"><div class="flex flex-col items-center gap-1">${who.map(tag).join('')}</div></td>`
        : '<td class="px-3 py-2.5 text-center bg-rose-50/60"><span class="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">공석</span></td>';
    }).join('')}</tr>`).join('')}
    <tr class="bg-brand-50 font-bold text-brand-700"><th class="px-3 py-2.5">참석 인원</th>${cols.map(ns => `<td class="px-3 py-2.5 text-center">${ns.length}명</td>`).join('')}</tr></tbody></table></div>`;
}

function absent() {
  const byName = Object.fromEntries(D.members.map(m => [m.name, m]));
  const days = D.events.filter(e => e.off !== 'TRUE').map(ev => [ev, D.responses.filter(r => r.eventId === ev.id && r.attend === 'N')]).filter(([, rs]) => rs.length);
  if (!days.length) return '<p class="text-sm text-slate-500">불참자가 없습니다.</p>';
  return `<div class="flex justify-end gap-3 text-xs mb-2"><span class="flex items-center gap-1 text-slate-600"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>주일 예배 가능</span>
    <span class="flex items-center gap-1 text-slate-600"><span class="w-2 h-2 rounded-full bg-rose-500"></span>주일 예배 불가</span></div>
    <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">${days.map(([ev, rs]) => `<div class="rounded-2xl border border-slate-200 overflow-hidden">
      <div class="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 whitespace-nowrap"><b class="text-sm">${fmt(ev.date)}</b> <span class="text-xs text-slate-500">${esc(ev.label)}</span></div>
      <div class="p-3.5 space-y-3">${rs.map(r => `<div class="min-w-0">
        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full shrink-0 ${r.sundayOk === 'Y' ? 'bg-emerald-500' : 'bg-rose-500'}"></span><span class="text-sm">${tag(r.name)}</span></div>
        <div class="pl-3.5 mt-1 text-xs leading-relaxed"><span class="text-slate-400">${esc(posOf(byName[r.name]).join(' · '))}</span>
          ${r.reason ? `<p class="text-slate-600 break-words">${esc(r.reason)}</p>` : ''}</div></div>`).join('')}</div></div>`).join('')}</div>`;
}
