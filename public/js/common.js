// js/common.js
// ============================================================
//  공통 UI 유틸리티
// ============================================================

/* ── 토스트 ── */
function showToast(msg, type = '', duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type}`;
  setTimeout(() => el.classList.add('hidden'), duration);
}

/* ── 팝업 (확인/취소) ── */
function showPopup(msg) {
  return new Promise(resolve => {
    const ov  = document.getElementById('popup-overlay');
    const txt = document.getElementById('popup-msg');
    txt.textContent = msg;
    ov.classList.remove('hidden');
    document.getElementById('popup-confirm').onclick = () => {
      ov.classList.add('hidden'); resolve(true);
    };
    document.getElementById('popup-cancel').onclick = () => {
      ov.classList.add('hidden'); resolve(false);
    };
  });
}

/* ── 모달 ── */
const TERMS_HTML = `
<h1>이용약관</h1>
<h2>제1조 (목적)</h2>
<p>이 약관은 본 서비스가 제공하는 무료 교육용 웹 애플리케이션 서비스(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
<h2>제2조 (정의)</h2>
<ul>
<li>'서비스'란 본 플랫폼에서 제공하는 교육용 웹 애플리케이션을 말합니다.</li>
<li>'이용자'란 본 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
<li>'회원'이란 본 서비스에 회원등록을 한 자로서, 서비스를 이용할 수 있는 자를 말합니다.</li>
</ul>
<h2>제3조 (약관의 명시와 개정)</h2>
<p>① 본 서비스는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
<p>② 본 서비스는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
<p>③ 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 내에 그 적용일자 7일 이전부터 공지합니다.</p>
<h2>제4조 (서비스의 제공)</h2>
<ul>
<li>본 서비스는 교육 목적의 무료 웹 애플리케이션을 제공합니다.</li>
<li>서비스의 이용은 무료이며, 별도의 유료 결제가 필요하지 않습니다.</li>
<li>본 서비스는 교육 활동 지원을 목적으로 하며, 상업적 목적으로 운영되지 않습니다.</li>
</ul>
<h2>제5조 (서비스의 중단)</h2>
<p>① 본 서비스는 시스템 점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
<p>② 본 서비스는 무료로 제공되는 교육용 서비스이므로, 서비스 중단으로 인한 별도의 보상은 제공되지 않습니다.</p>
<h2>제6조 (회원가입)</h2>
<p>① 본 서비스는 별도의 회원가입을 받지 않습니다.</p>
<p>② 만 14세 미만의 아동은 본 서비스를 이용할 수 없습니다.</p>
<h2>제8조 (이용자의 의무)</h2>
<p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
<ul>
<li>허위 내용의 등록</li>
<li>타인의 정보 도용</li>
<li>서비스에 게시된 정보의 무단 변경</li>
<li>서비스의 운영을 방해하는 행위</li>
<li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
<li>공서양속에 반하는 정보를 게시하는 행위</li>
</ul>
<h2>제9조 (저작권)</h2>
<p>① 본 서비스가 작성한 저작물에 대한 저작권은 서비스 제공자에게 귀속합니다.</p>
<p>② 이용자는 서비스를 이용하여 얻은 정보를 서비스 제공자의 사전 승낙 없이 복제, 송신, 출판, 배포하여서는 안 됩니다.</p>
<h2>제10조 (면책조항)</h2>
<p>① 본 서비스는 무료로 제공되는 교육용 서비스로서, 서비스 이용 중 발생하는 기술적 문제나 오류에 대해 제한적 책임을 집니다.</p>
<h2>제11조 (분쟁해결)</h2>
<p>본 서비스와 이용자 간에 발생한 분쟁에 관하여는 대한민국 법을 적용하며, 소송이 제기되는 경우 서비스 제공자의 소재지를 관할하는 법원을 관할법원으로 합니다.</p>
<p><strong>부칙:</strong> 이 약관은 2026년 7월 1일부터 시행됩니다.</p>
`;

const PRIVACY_HTML = `
<h1>개인정보처리방침</h1>
<p>Quiz Battle(이하 본 서비스)은 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>
<h2>제1조 (개인정보의 처리 목적)</h2>
<p>본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
<ul><li>문제 풀이 입장 시 별명: 문제 풀이 구성원 식별, 교사 피드백 제공</li></ul>
<h2>제2조 (개인정보의 처리 및 보유기간)</h2>
<p>① 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
<ul>
<li>보유 기간: 문제 풀이 진행 기간(문제 풀이 종료 후 저장하지 않음)</li>
<li>파기 시점: 문제 풀이 종료 후 파기(저장하지 않음)</li>
</ul>
<h2>제3조 (처리하는 개인정보 항목)</h2>
<p>본 서비스는 학습 지원을 위해 필요한 최소한의 개인정보만을 수집합니다.</p>
<ul>
<li>수집 항목: 별명</li>
<li>수집하지 않는 항목: 개인 식별을 위한 별명 이외의 모든 항목</li>
</ul>
<h2>제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)</h2>
<p>① 본 서비스는 만 14세 미만 아동의 사용을 제한합니다.</p>
<h2>제5조 (개인정보 보호책임자)</h2>
<ul>
<li>성명: 김문창 (개발자)</li>
<li>소속: 고척고등학교</li>
<li>직위: 교사</li>
<li>연락처: 02-448-5766 (학교 교무실)</li>
</ul>
<h2>제6조 (개인정보 처리방침 변경)</h2>
<p>이 개인정보 처리방침은 2026년 7월 1일부터 적용됩니다.</p>
`;

function openModal(htmlContent) {
  document.getElementById('modal-content').innerHTML = htmlContent;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ── Footer 초기화 ── */
function initFooter() {
  document.getElementById('main-footer').classList.remove('hidden');
  document.getElementById('footer-terms-btn').onclick   = () => openModal(TERMS_HTML);
  document.getElementById('footer-privacy-btn').onclick = () => openModal(PRIVACY_HTML);
  document.getElementById('modal-close-btn').onclick    = closeModal;
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
}

/* ── 시간 포맷 ── */
function fmtTime(sec) {
  const m = String(Math.floor(Math.abs(sec) / 60)).padStart(2, '0');
  const s = String(Math.abs(sec) % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function fmtTs(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

/* ── KaTeX 렌더링 ── */
function renderKatex(el) {
  if (window.__katexReady && typeof renderMathInElement === 'function') {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

/* ── 등수 계산 ── */
function calcRankings(players) {
  return Object.entries(players)
    .map(([key, p]) => {
      const answers   = p.answers || {};
      const correct   = Object.values(answers).filter(a => a.correct).length;
      const total     = Object.values(answers).length;
      const rate      = total > 0 ? correct / total : 0;
      const avgTime   = total > 0
        ? Object.values(answers).reduce((s, a) => s + (a.elapsed || 0), 0) / total
        : Infinity;
      return { key, nickname: p.nickname, correct, rate, avgTime, done: p.done || false };
    })
    .sort((a, b) =>
      b.correct - a.correct ||
      b.rate    - a.rate    ||
      a.avgTime - b.avgTime
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/* ── SVG 대기 일러스트 ── */
const WAIT_SVG = `<svg class="wait-illustration" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="80" r="36" fill="currentColor" opacity=".15"/>
  <circle cx="100" cy="80" r="26" fill="currentColor" opacity=".3"/>
  <path d="M100 54 V80 L118 92" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>
  <ellipse cx="100" cy="155" rx="50" ry="10" fill="currentColor" opacity=".08"/>
  <rect x="72" y="116" width="56" height="40" rx="10" fill="currentColor" opacity=".18"/>
  <circle cx="86" cy="136" r="5" fill="currentColor" opacity=".5"/>
  <circle cx="100" cy="136" r="5" fill="currentColor" opacity=".5"/>
  <circle cx="114" cy="136" r="5" fill="currentColor" opacity=".5"/>
</svg>`;

const DONE_SVG = `<svg class="wait-illustration" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="90" r="48" fill="currentColor" opacity=".12"/>
  <path d="M76 90 L92 108 L126 72" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <ellipse cx="100" cy="160" rx="55" ry="10" fill="currentColor" opacity=".08"/>
</svg>`;
