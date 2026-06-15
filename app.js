// DOCK STORAGE & SEEDER (Terstandardisasi Lengkap dengan Dukungan Foto)
let databaseTamu = JSON.parse(localStorage.getItem('pro_vms_db')) || [
  { 
    id: 1686800000001, 
    nama: "Aris Setiawan", 
    nik: "3402011211940003", 
    telepon: "081987654321", 
    instansi: "Glow Tech Industries", 
    keperluan: "Rapat / Meeting", 
    waktu: "2026-06-15T10:00", 
    foto: "",
    statusKeluar: "Sudah Keluar", 
    waktuKeluar: "11:30 WIB", 
    durasiKunjungan: "1 jam 30 menit" 
  },
  { 
    id: 1686800000002, 
    nama: "Clarissa Utama", 
    nik: "3402054308960001", 
    telepon: "085211223344", 
    instansi: "Bank Mandiri Corp", 
    keperluan: "Kunjungan Resmi", 
    waktu: "2026-06-15T13:15", 
    foto: "",
    statusKeluar: "Di Dalam Gedung", 
    waktuKeluar: "-", 
    durasiKunjungan: "-" 
  }
];

if(!localStorage.getItem('pro_vms_db')) localStorage.setItem('pro_vms_db', JSON.stringify(databaseTamu));

let logCurrentPage = 1;
const logRowsPerPage = 6;
let isServerOnline = true; // PARAMETER HARDWARE CONTROL
let cameraStream = null;  // Penampung Aliran Kamera

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('dateNow').innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  initDashboard();
});

// HARDWARE SWITCH CORE LOGIC
function toggleServerHardware() {
  const label = document.getElementById('serverStatusLabel');
  const btn = document.getElementById('btnToggleServer');
  const contentArea = document.getElementById('mainContentArea');
  const offlineBlocker = document.getElementById('serverOfflineBlocker');
  const sidebarNav = document.getElementById('sidebarNav');
  const footerStatus = document.getElementById('footerStatus');

  if (isServerOnline) {
    isServerOnline = false;
    label.innerText = "OFFLINE";
    label.style.color = "var(--danger-neon)";
    btn.innerHTML = `<i class="fas fa-play"></i> Jalankan Server`;
    btn.style.background = "var(--success-neon)";
    contentArea.style.display = "none";
    offlineBlocker.style.display = "block";
    sidebarNav.style.pointerEvents = "none";
    sidebarNav.style.opacity = "0.2";
    footerStatus.innerText = "🔴 Server Offline";
    footerStatus.style.color = "var(--danger-neon)";
    pushToast("Peringatan: Server database dihentikan.");
    matikanKamera();
  } else {
    isServerOnline = true;
    label.innerText = "ONLINE";
    label.style.color = "var(--success-neon)";
    btn.innerHTML = `<i class="fas fa-power-off"></i> Matikan Server`;
    btn.style.background = "var(--danger-neon)";
    contentArea.style.display = "block";
    offlineBlocker.style.display = "none";
    sidebarNav.style.pointerEvents = "auto";
    sidebarNav.style.opacity = "1";
    footerStatus.innerText = "🟢 Active Session";
    footerStatus.style.color = "var(--success-neon)";
    pushToast("Sukses: Sistem database kembali online.");
    initDashboard();
  }
}

// ROUTING SCREEN CORE ENGINE
function nav(targetView, element) {
  if(!isServerOnline) return; 
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(`p-${targetView}`).classList.add('active');
  if(element) element.classList.add('active');

  const headerMatrix = { 'dashboard': 'Analytics Console', 'tambah': 'Check-In Workspace', 'daftar': 'Log Database Center', 'laporan': 'Document Archiver' };
  document.getElementById('pageTitle').innerText = headerMatrix[targetView];
  document.getElementById('pageBreadcrumb').innerText = `Workspace Log › ${headerMatrix[targetView]}`;

  if(targetView !== 'tambah') matikanKamera();
  if(targetView === 'dashboard') initDashboard();
  if(targetView === 'daftar') { logCurrentPage = 1; renderTable(); }
}

// LOGIKA AUTH GATE
function doLogin() {
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;
  if(user === 'admin' && pass === 'admin123') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    pushToast('Akses server diberikan. Selamat Bekerja!');
    initDashboard();
  } else {
    const err = document.getElementById('errMsg'); err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3500);
  }
}

function doLogout() {
  matikanKamera();
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function pushToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div'); toast.className = 'toast-msg';
  toast.innerHTML = `<i class="fas fa-circle-info" style="color:var(--primary-neon); margin-right:8px;"></i> ${message}`;
  container.appendChild(toast); setTimeout(() => toast.remove(), 4000);
}

// MANAGEMENT WEBCAM & FILEREADER CORE LOGIC
async function aktifkanKamera() {
  const video = document.getElementById('webcam');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 220, height: 165 } });
    video.srcObject = cameraStream;
    pushToast("Kamera operasional lobi berhasil diaktifkan.");
  } catch (err) {
    console.error(err);
    pushToast("Gagal: Izin kamera ditolak atau perangkat tidak terdeteksi.");
  }
}

function ambilFoto() {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('photoCanvas');
  const context = canvas.getContext('2d');
  const hiddenInput = document.getElementById('f-string-foto');

  if (!cameraStream) {
    pushToast("Peringatan: Silakan klik 'Buka Kamera' terlebih dahulu.");
    return;
  }

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  context.setTransform(1, 0, 0, 1, 0, 0);

  canvas.style.display = 'block';
  hiddenInput.value = canvas.toDataURL('image/jpeg');
  pushToast("Snapshot wajah visitor berhasil dikunci.");
  matikanKamera();
}

function matikanKamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}

function konversiBerkasKeBase64(input) {
  const file = input.files[0];
  const hiddenInput = document.getElementById('f-string-foto');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      hiddenInput.value = e.target.result;
      const canvas = document.getElementById('photoCanvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = function() {
        canvas.style.display = 'block';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      img.src = e.target.result;
      pushToast("Berkas dokumen foto berhasil dimuat.");
    }
    reader.readAsDataURL(file);
  }
}

// PERSISTENCE OPERASIONAL: TAMBAH & EDIT 
function simpanTamu() {
  const id = document.getElementById('editId').value;
  const nama = document.getElementById('f-nama').value;
  const telepon = document.getElementById('f-telepon').value;
  const instansi = document.getElementById('f-instansi').value;
  const keperluan = document.getElementById('f-keperluan').value;
  const waktu = document.getElementById('f-waktu').value || new Date().toISOString().slice(0,16);

  if(!nama || !telepon || !instansi || !keperluan) { pushToast('Gagal: Seluruh data bertanda (*) mutlak diisi.'); return; }

  const dataLama = id ? databaseTamu.find(x => x.id === parseInt(id)) : null;

  const payload = { 
    id: id ? parseInt(id) : Date.now(), 
    nama, 
    telepon, 
    instansi, 
    keperluan, 
    waktu, 
    nik: document.getElementById('f-nik').value,
    foto: document.getElementById('f-string-foto').value || (dataLama ? dataLama.foto : ""),
    statusKeluar: dataLama ? dataLama.statusKeluar : "Di Dalam Gedung",
    waktuKeluar: dataLama ? dataLama.waktuKeluar : "-",
    durasiKunjungan: dataLama ? dataLama.durasiKunjungan : "-"
  };

  if(id) {
    databaseTamu[databaseTamu.findIndex(x => x.id === parseInt(id))] = payload;
    pushToast('Modifikasi profil visitor berhasil disinkronkan.');
  } else {
    databaseTamu.unshift(payload);
    pushToast('Log check-in visitor baru sukses diamankan.');
  }

  localStorage.setItem('pro_vms_db', JSON.stringify(databaseTamu));
  resetForm();
  nav('daftar', document.querySelectorAll('.nav-item')[2]);
}

// CORE INTERFACES: LOGIKA PROSES MANUAL CHECK-OUT
function prosesCheckOut(id) {
  const idx = databaseTamu.findIndex(x => x.id === id);
  if(idx !== -1) {
    const visitor = databaseTamu[idx];
    const waktuSekarang = new Date();
    
    const jamMenit = waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    visitor.waktuKeluar = jamMenit + " WIB";
    visitor.statusKeluar = "Sudah Keluar";

    const checkInTime = new Date(visitor.waktu);
    const selisihWaktu = waktuSekarang - checkInTime;

    if(selisihWaktu > 0) {
      const totalMenit = Math.floor(selisihWaktu / (1000 * 60));
      const hitungJam = Math.floor(totalMenit / 60);
      const sisaMenit = totalMenit % 60;
      
      visitor.durasiKunjungan = hitungJam > 0 ? `${hitungJam} jam ${sisaMenit} menit` : `${sisaMenit} menit`;
    } else {
      visitor.durasiKunjungan = "< 1 menit";
    }

    localStorage.setItem('pro_vms_db', JSON.stringify(databaseTamu));
    pushToast(`Visitor ${visitor.nama} berhasil check-out.`);
    renderTable();
  }
}

function hapusTamu(id) {
  if(confirm('Apakah Anda yakin ingin memusnahkan riwayat kunjungan tamu ini?')) {
    databaseTamu = databaseTamu.filter(x => x.id !== id);
    localStorage.setItem('pro_vms_db', JSON.stringify(databaseTamu));
    pushToast('Arsip data kunjungan berhasil dihapus.');
    renderTable();
  }
}

function editTamu(id) {
  const target = databaseTamu.find(x => x.id === id); if(!target) return;
  document.getElementById('editId').value = target.id;
  document.getElementById('f-nama').value = target.nama;
  document.getElementById('f-nik').value = target.nik;
  document.getElementById('f-telepon').value = target.telepon;
  document.getElementById('f-instansi').value = target.instansi;
  document.getElementById('f-keperluan').value = target.keperluan;
  document.getElementById('f-waktu').value = target.waktu;
  document.getElementById('f-string-foto').value = target.foto || "";
  
  if(target.foto) {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() { canvas.style.display = 'block'; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
    img.src = target.foto;
  }
  
  document.getElementById('formTitle').innerText = "Update Log Desk Check-In";
  nav('tambah', document.querySelectorAll('.nav-item')[1]);
}

function resetForm() {
  document.getElementById('editId').value = ""; document.getElementById('formTitle').innerText = "Formulir Digital Check-In";
  document.querySelectorAll('#p-tambah input, #p-tambah select').forEach(el => el.value = "");
  document.getElementById('photoCanvas').style.display = 'none';
  matikanKamera();
}

// LOG TABLE COMPONENT (PAGINATION PROCESSOR)
function renderTable() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const tbody = document.getElementById('tableBody'); tbody.innerHTML = "";
  
  let filtered = databaseTamu.filter(x => x.nama.toLowerCase().includes(query) || x.instansi.toLowerCase().includes(query));
  document.getElementById('totalBadge').innerText = databaseTamu.length;

  if(filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:40px;">Kueri pencarian tidak menemukan hasil.</td></tr>`;
    return;
  }

  const totalPages = Math.ceil(filtered.length / logRowsPerPage);
  const start = (logCurrentPage - 1) * logRowsPerPage;
  
  filtered.slice(start, start + logRowsPerPage).forEach((x, i) => {
    const statusGedung = x.statusKeluar === "Di Dalam Gedung";
    
    const badgeStatusTerbaru = statusGedung
      ? `<span class="badge-status" style="color:#00f2fe; border-color:#00f2fe; font-size:10px; padding:2px 6px;">INSIDE</span>`
      : `<span class="badge-status" style="color:var(--text-muted); border-color:rgba(255,255,255,0.1); font-size:10px; padding:2px 6px;">OUT</span>`;

    const aksiCheckOutButton = statusGedung
      ? `<button class="btn btn-emerald btn-action-sm" onclick="prosesCheckOut(${x.id})" style="background:#10b981; color:#000;" title="Check-Out Tamu Sekarang"><i class="fas fa-door-open"></i> Keluar</button>`
      : `<button class="btn btn-blur btn-action-sm" disabled style="opacity:0.3; cursor:not-allowed;"><i class="fas fa-check-double"></i> Selesai</button>`;

    tbody.innerHTML += `
      <tr>
        <td>${start + i + 1}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <b>${x.nama}</b> ${badgeStatusTerbaru}
          </div>
          <small style="color:var(--text-muted); font-size:11px;">
            ${statusGedung ? 'Masuk: ' + x.waktu.slice(11,16) + ' WIB' : 'Durasi: ' + x.durasiKunjungan}
          </small>
        </td>
        <td>${x.instansi}</td>
        <td><span class="badge-status">${x.keperluan}</span></td>
        <td>${x.telepon}</td>
        <td>
          <div style="display:flex; gap:6px;">
            ${aksiCheckOutButton}
            <button class="btn btn-blur btn-action-sm" onclick="lihatDetail(${x.id})"><i class="fas fa-eye"></i></button>
            <button class="btn btn-glow btn-action-sm" onclick="editTamu(${x.id})"><i class="fas fa-pen-to-square"></i></button>
            <button class="btn btn-blur btn-action-sm" style="color:var(--danger-neon)" onclick="hapusTamu(${x.id})"><i class="fas fa-trash-can"></i></button>
          </div>
        </td>
      </tr>`;
  });

  document.getElementById('pageInfo').innerText = `Record ${start + 1}-${Math.min(start + logRowsPerPage, filtered.length)} dari total ${filtered.length} baris`;
  let btns = ""; for(let p=1; p<=totalPages; p++) btns += `<button class="btn ${p === logCurrentPage ? 'btn-glow':'btn-blur'}" onclick="jumpPage(${p})">${p}</button>`;
  document.getElementById('pageBtns').innerHTML = btns;
}

function jumpPage(p) { logCurrentPage = p; renderTable(); }

// POPUP DIALOG DETAIL MODAL WITH FACE PREVIEW
function lihatDetail(id) {
  const t = databaseTamu.find(x => x.id === id); if(!t) return;
  
  const gambarVisitor = t.foto 
    ? `<img src="${t.foto}" style="width:100%; max-width:180px; height:135px; border-radius:8px; border:2px solid rgba(255,255,255,0.1); margin-bottom:15px; object-fit:cover;">`
    : `<div style="width:100px; height:100px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; border-radius:50%; margin-bottom:15px;"><i class="fas fa-user-shield" style="font-size:35px; color:var(--text-muted)"></i></div>`;

  document.getElementById('modalContent').innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
      ${gambarVisitor}
    </div>
    <div style="display:flex; flex-direction:column; gap:12px; margin-top:5px;">
      <p><b>Nama Visitor:</b><br>${t.nama}</p>
      <p><b>KTP / NIK:</b><br>${t.nik || 'Tidak Dilampirkan'}</p>
      <p><b>Saluran Kontak:</b><br>${t.telepon}</p>
      <p><b>Instansi Afiliasi:</b><br>${t.instansi}</p>
      <p><b>Jenis Keperluan:</b><br>${t.keperluan}</p>
      <hr style="border-color:rgba(255,255,255,0.08);">
      <p><b>Waktu Registrasi Masuk:</b><br>${t.waktu.replace('T',' Jam ')} WIB</p>
      <p><b>Status Operasional:</b><br>${t.statusKeluar || 'Di Dalam Gedung'}</p>
      <p><b>Jam Check-Out Lapangan:</b><br>${t.waktuKeluar || '-'}</p>
      <p><b>Akumulasi Durasi Kunjungan:</b><br>${t.durasiKunjungan || '-'}</p>
    </div>`;
  document.getElementById('detailModal').classList.add('open');
}
function closeModal() { document.getElementById('detailModal').classList.remove('open'); }

// DYNAMIC CORE CHARTS & DASHBOARD ENGINE
function initDashboard() {
  const len = databaseTamu.length;
  document.getElementById('s-total').innerText = len;
  document.getElementById('s-inst').innerText = [...new Set(databaseTamu.map(x => x.instansi.toLowerCase()))].length;
  document.getElementById('s-today').innerText = databaseTamu.filter(x => x.waktu.startsWith(new Date().toISOString().slice(0, 10))).length;

  // GRAFIK BATANG MATRIX
  const bc = document.getElementById('chartBars'); bc.innerHTML = "";
  const lc = document.getElementById('chartLabels'); lc.innerHTML = "";
  let mockTrafik = [4, 2, 7, 5, 9, 3, len || 2];
  let maxVal = Math.max(...mockTrafik, 1);
  mockTrafik.forEach((v, i) => {
    bc.innerHTML += `<div class="bar-wrap"><div class="bar" style="height:${(v/maxVal)*100}%" title="${v} Tamu"></div></div>`;
    lc.innerHTML += `<div style="flex:1; text-align:center; font-size:11px; color:var(--text-muted)">H-${6-i}</div>`;
  });

  // GRAFIK LINGKARAN DONUT SVG MATRIX
  const dw = document.getElementById('donutWrap');
  let seg = {}; databaseTamu.forEach(x => seg[x.keperluan] = (seg[x.keperluan] || 0) + 1);
  let svg = `<svg class="donut" width="110" height="110" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="4.5"></circle>`;
  let leg = `<div style="display:flex; flex-direction:column; gap:6px;">`;
  const palette = ['#00F2FE', '#9F7AEA', '#ED64A6', '#10B981', '#F59E0B']; let acc = 0;
  
  Object.keys(seg).forEach((k, idx) => {
    const percent = (seg[k]/len)*100; const color = palette[idx % palette.length];
    svg += `<circle cx="21" cy="21" r="15.9" fill="transparent" stroke="${color}" stroke-width="4.6" stroke-dasharray="${percent} ${100-percent}" stroke-dashoffset="${100-acc}"></circle>`;
    leg += `<div style="font-size:12px; font-weight:500;"><span style="color:${color}">■</span> ${k} (${seg[k]})</div>`; acc += percent;
  });
  dw.innerHTML = svg + `</svg>` + leg + `</div>`;

  // INTEGRASI DATA TERBARU DASHBOARD
  const rb = document.getElementById('recentBody'); rb.innerHTML = "";
  databaseTamu.slice(0, 3).forEach(x => {
    rb.innerHTML += `<tr><td><b>${x.nama}</b></td><td>${x.instansi}</td><td><span class="badge-status">${x.keperluan}</span></td><td>${x.waktu.slice(11,16)} WIB</td></tr>`;
  });
}

// REPORT & EXPORT ARCHIVER LOGIC
let filteredReportData = [];
function filterLaporan() {
  const d = document.getElementById('lap-dari').value; const s = document.getElementById('lap-sampai').value;
  filteredReportData = databaseTamu.filter(x => (!d || x.waktu.slice(0,10) >= d) && (!s || x.waktu.slice(0,10) <= s));
  
  const lb = document.getElementById('laporanBody'); lb.innerHTML = "<thead><tr><th>No</th><th>Nama</th><th>Instansi asal</th><th>Keperluan</th></tr></thead>";
  if(filteredReportData.length === 0) { lb.innerHTML += `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted)">Data nihil</td></tr>`; return; }
  filteredReportData.forEach((x, i) => { lb.innerHTML += `<tr><td>${i+1}</td><td><b>${x.nama}</b></td><td>${x.instansi}</td><td>${x.keperluan}</td></tr>`; });
}

function cetakLaporan() {
  if(filteredReportData.length === 0) { alert('Harap isi filter dan saring data terlebih dahulu.'); return; }
  const pt = document.getElementById('printTable');
  pt.innerHTML = `<thead><tr><th>No</th><th>Nama Lengkap</th><th>Asal Instansi</th><th>Keperluan Kunjungan</th><th>Waktu Check-In</th></tr></thead><tbody>`;
  filteredReportData.forEach((x, i) => { pt.innerHTML += `<tr><td>${i+1}</td><td>${x.nama}</td><td>${x.instansi}</td><td>${x.keperluan}</td><td>${x.waktu.replace('T',' ')}</td></tr>`; });
  pt.innerHTML += `</tbody>`; window.print();
}