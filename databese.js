/**
 * VMS Pro - Database Management Layer
 * Menggunakan LocalStorage untuk penyimpanan data persisten secara lokal.
 */

const STORAGE_KEY = 'pro_vms_db';

/**
 * 1. MENGAMBIL SEMUA DATA TAMU
 * @returns {Array} List data semua tamu
 */
function dapatkanSemuaTamu() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * 2. MENYIMPAN ATAU MEMPERBARUI DATA TAMU (CHECK-IN / EDIT)
 * @param {Object} dataTamu - Objek data tamu baru atau yang diedit
 * @returns {Object} Hasil data yang disimpan
 */
function simpanTamuKeDatabase(dataTamu) {
    const db = dapatkanSemuaTamu();
    
    // Cek apakah data sudah ada (Proses Edit)
    const indexLama = db.findIndex(x => x.id === dataTamu.id);

    if (indexLama !== -1) {
        // Jika EDIT, pertahankan status keberadaan yang lama jika tidak diubah di form
        db[indexLama] = {
            ...db[indexLama],
            ...dataTamu
        };
    } else {
        // Jika CHECK-IN BARU, set status default ke "Di Dalam Gedung"
        const tamuBaru = {
            id: dataTamu.id || Date.now(),
            nama: dataTamu.nama,
            nik: dataTamu.nik || '-',
            telepon: dataTamu.telepon,
            instansi: dataTamu.instansi,
            keperluan: dataTamu.keperluan,
            waktu: dataTamu.waktu, // Format: YYYY-MM-DDTHH:MM
            statusKeluar: "Di Dalam Gedung",
            waktuKeluar: "-",
            durasiKunjungan: "-"
        };
        db.unshift(tamuBaru); // Tambahkan ke baris paling atas
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return dataTamu;
}

/**
 * 3. PROSES CHECK-OUT TAMU (MANUAL)
 * @param {number} id - ID unik dari tamu yang akan keluar
 * @returns {Object|boolean} Objek tamu yang diperbarui atau false jika gagal
 */
function prosesCheckOutDatabase(id) {
    const db = dapatkanSemuaTamu();
    const index = db.findIndex(x => x.id === id);

    if (index !== -1) {
        const tamu = db[index];
        const sekarang = new Date();
        
        // 1. Catat Waktu Keluar (Format Jam:Menit WIB)
        const jamMenit = sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        tamu.waktuKeluar = jamMenit + " WIB";
        tamu.statusKeluar = "Sudah Keluar";

        // 2. Hitung Durasi Kunjungan Selama di Dalam Gedung
        const waktuMasuk = new Date(tamu.waktu);
        const selisihMilidetik = sekarang - waktuMasuk;

        if (selisihMilidetik > 0) {
            const totalMenit = Math.floor(selisihMilidetik / (1000 * 60));
            const jam = Math.floor(totalMenit / 60);
            const menit = totalMenit % 60;

            tamu.durasiKunjungan = jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`;
        } else {
            tamu.durasiKunjungan = "< 1 menit";
        }

        // 3. Simpan Kembali Perubahan ke LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        return tamu;
    }
    return false;
}

/**
 * 4. MENGAPUS DATA TAMU DARI LOG
 * @param {number} id - ID unik tamu yang akan dihapus
 * @returns {boolean} Status keberhasilan
 */
function hapusTamuDariDatabase(id) {
    let db = dapatkanSemuaTamu();
    const index = db.findIndex(x => x.id === id);

    if (index !== -1) {
        db.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        return true;
    }
    return false;
}

/**
 * 5. CARI TAMU BERDASARKAN KEYWORD (Pencarian Global)
 * @param {string} keyword - Kata kunci pencarian (Nama / Instansi)
 * @returns {Array} List data tamu yang cocok
 */
function cariTamuDiDatabase(keyword) {
    const db = dapatkanSemuaTamu();
    if (!keyword) return db;

    const lowerCaseKeyword = keyword.toLowerCase();
    return db.filter(tamu => 
        tamu.nama.toLowerCase().includes(lowerCaseKeyword) || 
        tamu.instansi.toLowerCase().includes(lowerCaseKeyword) ||
        tamu.keperluan.toLowerCase().includes(lowerCaseKeyword)
    );
}