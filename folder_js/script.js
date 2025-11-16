// ---------- CONFIG OPENROUTER ----------
const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct";
// contoh model lain: "anthropic/claude-3.5-sonnet", "openai/gpt-4.1"
const LOGO_BLACK = 'folder asset/ubotlogo.white.png';
  const LOGO_WHITE = 'folder asset/ubotlogo.white.png';
  const UNKLAB_LOGO = 'folder asset/IMG_0518.PNG';
  const HF_MODEL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
  const HF_TOKEN = "PASTE_YOUR_HF_TOKEN_HERE"; // placeholder
  // ---- LOAD UNKLAB JSON DATA ----
let UNKLAB_DATA = {};

fetch("unklab_data.json")
  .then(res => res.json())
  .then(data => {
    UNKLAB_DATA = data;
    console.log("UNKLAB data loaded:", UNKLAB_DATA);
  })
  .catch(err => console.error("Gagal memuat unklab_data.json:", err));


  // ---- Elements ----
  const landing = document.getElementById('landing');
  const loginView = document.getElementById('loginView');
  const appRoot = document.getElementById('appRoot');
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('#navMain .nav-link');
  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  const heroLogo = document.getElementById('heroUbotLogo');
  const sidebarLogo = document.getElementById('sidebarLogo');
  const loginUnklabLogo = document.getElementById('loginUnklabLogo');

  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sideUser = document.getElementById('sideUser');
  const sideUserBottom = document.getElementById('sideUserBottom');
  const sideEmail = document.getElementById('sideEmail');

  // Chat & history elements
  const chatMessagesEl = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatBoxInput');
  const btnSend = document.getElementById('btnSend');
  const historyListEl = document.getElementById('historyList');
  const historySearch = document.getElementById('histSearch');

  // profile upload
  const uploadAvatarInput = document.getElementById('uploadAvatar');
  const profileAvatarImg = document.getElementById('profileAvatar');

  // ---- UI helpers ----
  function showLanding(){ landing.classList.remove('hidden'); loginView.classList.add('hidden'); appRoot.classList.add('hidden'); hidePages(); }
  function showLogin(){ landing.classList.add('hidden'); loginView.classList.remove('hidden'); appRoot.classList.add('hidden'); hidePages(); }
  function showApp(){ landing.classList.add('hidden'); loginView.classList.add('hidden'); appRoot.classList.remove('hidden'); }
  function hidePages(){ pages.forEach(p=>p.classList.add('hidden')); }

  function updateLogosForTheme(){
    const isDark = document.body.classList.contains('dark-mode');
    sidebarLogo.src = (isDark ? LOGO_WHITE : LOGO_BLACK);
    heroLogo.src = (isDark ? LOGO_WHITE : LOGO_BLACK);
    try { loginUnklabLogo.src = UNKLAB_LOGO; } catch(e){ }
  }

  // ---- Avatar upload and save ----
  function loadSavedAvatar(){
    const avatarData = localStorage.getItem('ubot_user_avatar');
    if (avatarData) {
      profileAvatarImg.src = avatarData;
      sidebarAvatar.src = avatarData;
    } else {
      const fallback = 'https://ui-avatars.com/api/?name=Guest&background=6f42c1&color=fff';
      profileAvatarImg.src = fallback;
      sidebarAvatar.src = fallback;
    }
  }

  uploadAvatarInput.addEventListener('change', function(){
    const file = this.files && this.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Pilih file gambar.'); return; }
    const reader = new FileReader();
    reader.onload = function(e){
      const dataUrl = e.target.result;
      profileAvatarImg.src = dataUrl;
      sidebarAvatar.src = dataUrl;
      localStorage.setItem('ubot_user_avatar', dataUrl);
      const user = JSON.parse(localStorage.getItem('ubot_user')||'null');
      if (user) { user.avatar = dataUrl; localStorage.setItem('ubot_user', JSON.stringify(user)); }
    };
    reader.readAsDataURL(file);
  });

  // ---- Login ----
  document.getElementById('btnGotoLogin').addEventListener('click', showLogin);
  document.getElementById('btnDemo').addEventListener('click', ()=> {
    const demo = { email:'demo@student.unklab.ac.id', name:'Demo User', nim:'0000', major:'TI', year: (new Date()).getFullYear(), reg: 'demo' };
    localStorage.setItem('ubot_user', JSON.stringify(demo));
    initApp(); showApp(); navigateTo('home');
  });

  
  document.getElementById('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    if (!email.includes('@') || !email.endsWith('@student.unklab.ac.id')) {
      alert('Please use your UNKLAB student email (@student.unklab.ac.id)');
      return;
    }
    const regNo = email.split('@')[0];
    const user = {
      email,
      name: document.getElementById('loginName').value.trim() || regNo,
      nim: document.getElementById('loginNim').value.trim(),
      major: document.getElementById('loginMajor').value.trim(),
      year: (new Date()).getFullYear(),
      reg: regNo
    };
    localStorage.setItem('ubot_user', JSON.stringify(user));
    initApp(); showApp(); navigateTo('home');
  });

  // ---- Init App ----
  function initApp(){
    const user = JSON.parse(localStorage.getItem('ubot_user') || 'null');
    if (!user) { showLanding(); return; }
    sideUser.textContent = user.name || user.email;
    sideUserBottom.textContent = user.name || user.email;
    sideEmail.textContent = user.email || '';
    document.getElementById('displayName').textContent = user.name || user.email.split('@')[0];
    document.getElementById('pName').textContent = user.name;
    document.getElementById('pEmail').textContent = user.email;
    document.getElementById('pNim').textContent = user.nim || '-';
    document.getElementById('pMajor').textContent = user.major || '-';
    document.getElementById('pYear').textContent = user.year || '-';
    document.getElementById('pReg').textContent = user.reg || '-';

    loadSavedAvatar();
    if (!sidebarAvatar.src || sidebarAvatar.src.includes('Guest')) {
      const userObj = JSON.parse(localStorage.getItem('ubot_user')||'null');
      if (userObj && userObj.avatar) { sidebarAvatar.src = userObj.avatar; profileAvatarImg.src = userObj.avatar; }
    }

    if (localStorage.getItem('ubot_theme') === 'dark') document.body.classList.add('dark-mode');
    document.getElementById('switchDark').checked = document.body.classList.contains('dark-mode');
    updateLogosForTheme();

    initUsageDataIfNeeded();
    initChart();
    refreshHomeStats();
    renderHistoryList();
  }

  // ---- Navigation ----
  navLinks.forEach(a=>{
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const page = a.dataset.page;
      navigateTo(page);
    });
  });

  function navigateTo(page){
    showApp();
    hidePages();
    document.querySelectorAll('#navMain .nav-link').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`#navMain .nav-link[data-page="${page}"]`);
    if (nav) nav.classList.add('active');
    const el = document.getElementById('page-' + page);
    if (el) { el.classList.remove('hidden'); if (page==='home') refreshHome(); if (page==='chat') renderChat(); }
    else document.getElementById('page-404').classList.remove('hidden');
    history.replaceState(null,'', '#' + page);
  }

  document.getElementById('btnBackHome').addEventListener('click', ()=> navigateTo('home'));

  // ---- Logout ----
  function askConfirm(text, okCallback){
    document.getElementById('confirmText').textContent = text;
    document.getElementById('confirmOk').onclick = ()=> { confirmModal.hide(); okCallback(); };
    confirmModal.show();
  }
  document.getElementById('btnLogout').addEventListener('click', ()=> askConfirm('Logout now?', doLogout));
  document.getElementById('btnLogout2').addEventListener('click', ()=> askConfirm('Logout now?', doLogout));
  function doLogout(){ localStorage.removeItem('ubot_user'); showLogin(); }

  // ---- Dark mode toggle ----
  document.getElementById('switchDark').addEventListener('change', (e)=> {
    if (e.target.checked) { document.body.classList.add('dark-mode'); localStorage.setItem('ubot_theme','dark'); }
    else { document.body.classList.remove('dark-mode'); localStorage.setItem('ubot_theme','light'); }
    updateLogosForTheme();
  });

  // ---- Usage per day (weekly reset) ----
  function getWeekKey(date = new Date()){
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1)/7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  function initUsageDataIfNeeded(){
    const key = 'ubot_usage';
    const weekKey = getWeekKey();
    const savedWeek = localStorage.getItem('ubot_usage_week');
    if (!savedWeek || savedWeek !== weekKey) {
      const empty = [0,0,0,0,0,0,0];
      localStorage.setItem(key, JSON.stringify(empty));
      localStorage.setItem('ubot_usage_week', weekKey);
    }
  }

  function addUsageForToday(count=1){
    const key = 'ubot_usage';
    const arr = JSON.parse(localStorage.getItem(key) || '[0,0,0,0,0,0,0]');
    const today = new Date();
    const dayIndex = (today.getDay() + 6) % 7; // Mon=0 ... Sun=6
    arr[dayIndex] = (arr[dayIndex] || 0) + count;
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function getUsageArray(){
    initUsageDataIfNeeded();
    return JSON.parse(localStorage.getItem('ubot_usage') || '[0,0,0,0,0,0,0]');
  }

  // ---- View Data Modal ----
  function showViewDataModal(){
    const usage = getUsageArray();
    const labels = getLast7DayLabels();
    const total = usage.reduce((a,b)=>a+b,0);
    const avg = total / 7;
    const max = Math.max(...usage);
    const maxDay = labels[usage.indexOf(max)];

    let content = `<h6>Data Penggunaan Minggu Ini</h6>
    <p><strong>Total Pengguna:</strong> ${total}</p>
    <p><strong>Rata-rata per Hari:</strong> ${avg.toFixed(1)}</p>
    <p><strong>Hari Terbanyak:</strong> ${maxDay} (${max})</p>
    <table class="table table-sm">
      <thead><tr><th>Hari</th><th>Pengguna</th></tr></thead>
      <tbody>`;
    labels.forEach((day, i) => {
      content += `<tr><td>${day}</td><td>${usage[i]}</td></tr>`;
    });
    content += `</tbody></table>`;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Data Penggunaan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${content}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
  }

  // ---- Chart ----
  let usageChart = null;
  function initChart(){
    const ctx = document.getElementById('chartUsage').getContext('2d');
    if (usageChart) usageChart.destroy();
    const usage = getUsageArray();
    const labels = getLast7DayLabels();
    usageChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label:'Users', data: usage, backgroundColor: labels.map(()=> 'rgba(111,66,193,0.85)'), borderRadius:6 }] },
      options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize: 5 } } }, maintainAspectRatio:false }
    });
  }

  function getLast7DayLabels(){ return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; }

  function refreshHome(){
    initChart();
    refreshHomeStats();
  }

  function refreshHomeStats(){
    const all = loadAllHistory();
    const todayCount = all.flatMap(c=>c.messages).filter(m=>m.role==='user' && isToday(new Date(m.ts))).length;
    document.getElementById('statToday').textContent = todayCount;
    if (usageChart) {
      usageChart.data.datasets[0].data = getUsageArray();
      usageChart.update();
    }
  }

  // ---- Home quick prompts ----
  document.querySelectorAll('.quick').forEach(b=> b.addEventListener('click', (e)=> document.getElementById('homeAsk').value = e.target.textContent));
  document.getElementById('homeAskBtn').addEventListener('click', async ()=> {
    const q = document.getElementById('homeAsk').value.trim(); if (!q) return;
    navigateTo('chat'); await sendMessageFlow(q);
  });

  document.querySelectorAll('.ask-section').forEach(b=> b.addEventListener('click', async (e)=> { const q = e.target.dataset.q; navigateTo('chat'); await sendMessageFlow(q); }));

  // ---- View Data Button ----
  document.getElementById('btnToggleInfoPanel').addEventListener('click', showViewDataModal);

  // ---- Chat & history ----
  function histKey(){ const u = JSON.parse(localStorage.getItem('ubot_user')||'null'); return u ? 'ubot_hist_'+u.email : null; }
  function loadAllHistory(){ const k = histKey(); if (!k) return []; return JSON.parse(localStorage.getItem(k) || '[]'); }
  function saveAllHistory(data){ const k = histKey(); if (!k) return; localStorage.setItem(k, JSON.stringify(data)); }

  let currentConvId = Date.now();
  let currentMessages = [];

  function renderChat(){
    const all = loadAllHistory();
    if (all.length) { const last = all[all.length-1]; currentConvId = last.id; currentMessages = last.messages.slice(); } else { currentConvId = Date.now(); currentMessages = []; }
    renderMessages();
    renderHistoryList();
  }

  function renderMessages(){
    chatMessagesEl.innerHTML = '';
    currentMessages.forEach(m=>{
      const d = document.createElement('div'); d.className = 'msg ' + (m.role==='user' ? 'user' : 'bot');
      const copyBtn = `<button class="copy-btn" onclick="copyMessage('${escapeHtml(m.text).replace(/'/g, "\\'")}')" title="Salin pesan"><i class="bi bi-copy"></i></button>`;
      d.innerHTML = `<div>${escapeHtml(m.text)}${copyBtn}</div><div style="font-size:0.72rem;opacity:0.7;margin-top:6px">${new Date(m.ts).toLocaleString()}</div>`;
      chatMessagesEl.appendChild(d);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Pesan disalin ke clipboard!');
    }).catch(err => {
      console.error('Gagal menyalin: ', err);
    });
  }

  function showCopyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Salin Obrolan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <button class="btn btn-primary w-100 mb-2" onclick="copyFullChat()">Salin Seluruh Obrolan</button>
            <button class="btn btn-secondary w-100" onclick="downloadChat()">Download sebagai .txt</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
  }

  function copyFullChat() {
    const text = currentMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Seluruh obrolan disalin ke clipboard!');
    }).catch(err => {
      console.error('Gagal menyalin: ', err);
    });
  }

  function downloadChat() {
    const text = currentMessages.map(m => `${m.role.toUpperCase()}: ${m.text} (${new Date(m.ts).toLocaleString()})`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ubot_chat.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  document.getElementById('btnSend').addEventListener('click', ()=> sendMessageFlow(document.getElementById('chatBoxInput').value.trim()));
  document.getElementById('chatBoxInput').addEventListener('keydown', (e)=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessageFlow(document.getElementById('chatBoxInput').value.trim()); } });

  async function sendMessageFlow(text){
    if (!text) return;
    const user = JSON.parse(localStorage.getItem('ubot_user')||'null'); if (!user) { alert('Please login first'); return; }

    currentMessages.push({ role:'user', text, ts: Date.now() });
    renderMessages();
    document.getElementById('chatBoxInput').value = '';

    addUsageForToday(1);
    if (usageChart) { usageChart.data.datasets[0].data = getUsageArray(); usageChart.update(); }

    const typing = document.createElement('div'); typing.className='msg bot'; typing.textContent='Ubot sedang mengetik...'; chatMessagesEl.appendChild(typing); chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    // Try real AI (Hugging Face) with fallback
    let reply = '';
    try { reply = await queryAI(text); } catch(e){ console.warn('AI fallback', e); reply = fallbackReply(text); }

    typing.remove();
    currentMessages.push({ role:'bot', text: reply, ts: Date.now() });
    renderMessages();

    persistConversation();
    renderHistoryList();
    refreshHomeStats();
  }

  function persistConversation(){
    const all = loadAllHistory();
    const idx = all.findIndex(c=>c.id === currentConvId);
    const conv = { id: currentConvId, createdAt: Date.now(), messages: currentMessages };
    if (idx >= 0) all[idx] = conv; else all.push(conv);
    saveAllHistory(all);
  }

  document.getElementById('btnNewChat').addEventListener('click', ()=> {
    if (!confirm('Start new conversation?')) return;
    currentConvId = Date.now(); currentMessages = []; renderMessages();
  });

  document.getElementById('btnExport').addEventListener('click', showCopyModal);

  function renderHistoryList(filter=''){
    const all = loadAllHistory().slice().reverse();
    historyListEl.innerHTML = '';
    all.forEach(conv=>{
      const preview = conv.messages.find(m=>m.role==='user')?.text?.slice(0,80) || '(no text)';
      if (filter && !preview.toLowerCase().includes(filter.toLowerCase())) return;
      const node = document.createElement('div'); node.className='p-2 mb-2 card-glass'; node.style.cursor='pointer';
      node.innerHTML = `<div style="font-weight:600">${new Date(conv.createdAt).toLocaleString()}</div><div style="opacity:0.8">${escapeHtml(preview)}</div>`;
      node.addEventListener('click', ()=> { currentConvId = conv.id; currentMessages = conv.messages.slice(); renderMessages(); navigateTo('chat'); });
      historyListEl.appendChild(node);
    });
  }
  historySearch.addEventListener('input',(e)=>renderHistoryList(e.target.value));

  document.getElementById('btnResetHistory').addEventListener('click', ()=> askConfirm('Reset all chat history?', ()=>{ const k = histKey(); if (k) localStorage.removeItem(k); currentMessages=[]; renderMessages(); renderHistoryList(); refreshHomeStats(); }));

  function histKey(){ const u = JSON.parse(localStorage.getItem('ubot_user')||'null'); return u ? 'ubot_hist_'+u.email : null; }

  // ---- AI query placeholder (Hugging Face) ----
// ---- AI query using OpenRouter ----
// ---- AI query using Backend Render ----
async function queryAI(text) {
  text = String(text || '').trim();
  if (!text) return "Maaf, tidak ada pertanyaan.";

  try {
    const response = await fetch("https://backend-vav9.onrender.com/api/chat", {

      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        data: UNKLAB_DATA
      })
    });

    const data = await response.json();
    if (data && data.reply) return data.reply;

  } catch (err) {
    console.error("Backend Error:", err);
  }

  return fallbackReply(text);
}


  // ---- Fallback replies ----
  function fallbackReply(q){
    q = (q||'').toLowerCase();
    if (q.includes('chapel')||q.includes('jam')) return 'Chapel: Selasa & Kamis - 08:00 (Auditorium).';
    if (q.includes('krs')) return 'Pengisian KRS: buka SIS -> pilih mata kuliah -> simpan.';
    if (q.includes('lokasi')||q.includes('gedung')) return 'Gedung IT: di sebelah utara lapangan utama, lantai 1.';
    if (q.includes('bayar')||q.includes('spp')) return 'Bayar SPP lewat bank mitra atau aplikasi kampus; simpan bukti.';
    return 'Maaf, Ubot belum bisa menjawab itu secara offline. Integrasikan AI untuk jawaban lebih lengkap.';
  }

  // ---- Utilities ----
  function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function isToday(d){ const t=new Date(); return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear(); }



  // ---- Start-up ----
  window.addEventListener('DOMContentLoaded', ()=>{
    loadSavedAvatar();
    showLanding();
  });

  // allow deep link via hash
  window.addEventListener('hashchange', ()=> {
    const hash = location.hash.replace('#',''); if (hash) navigateTo(hash);
  });

  // responsive chart update
  window.addEventListener('resize', ()=> { if (usageChart) usageChart.resize(); });
