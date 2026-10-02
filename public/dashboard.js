const API_URL = '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

let globalBarang = [];
let inventoryBarangOptions = null;
let selectedMasterUserId = null;
let masterUserInitialValues = null;
let activeMasterCreateEntity = null;
const selectedMasterData = { barang: null, supplier: null, pelanggan: null };
const masterDataConfigs = {
    barang: {
        title: 'Barang',
        key: 'kode_barang',
        api: 'barang',
        fields: [
            { name: 'kode_barang', label: 'Kode Barang', required: true, maxLength: 50 },
            { name: 'nama_barang', label: 'Nama Barang', required: true, maxLength: 100 },
            { name: 'satuan', label: 'Satuan', required: true, maxLength: 20 },
            { name: 'satuan_harga', label: 'Harga Satuan', type: 'number', required: true, min: '0', step: '0.01' }
        ]
    },
    supplier: {
        title: 'Supplier',
        key: 'kode_supplier',
        api: 'supplier',
        fields: [
            { name: 'kode_supplier', label: 'Kode Supplier', required: true, maxLength: 50 },
            { name: 'nama_supplier', label: 'Nama Supplier', required: true, maxLength: 100 },
            { name: 'no_telp', label: 'No. Telepon', type: 'tel', maxLength: 20 },
            { name: 'alamat', label: 'Alamat', type: 'textarea', wide: true }
        ]
    },
    pelanggan: {
        title: 'Pelanggan',
        key: 'kode_pelanggan',
        api: 'pelanggan',
        fields: [
            { name: 'kode_pelanggan', label: 'Kode Pelanggan', required: true, maxLength: 50 },
            { name: 'nama_pelanggan', label: 'Nama Pelanggan', required: true, maxLength: 100 },
            { name: 'alamat', label: 'Alamat', type: 'textarea', wide: true }
        ]
    }
};

['masterUserUsername', 'masterUserPhone', 'masterUserPassword'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateMasterUserSaveButton);
});
document.getElementById('masterUserRole').addEventListener('change', updateMasterUserSaveButton);

document.addEventListener('keydown', event => {
    const createModal = document.getElementById('masterUserCreate');
    if (event.key === 'Escape' && !createModal.classList.contains('hidden')) {
        closeCreateMasterUser();
    }
    const masterModal = document.getElementById('masterDataCreate');
    if (event.key === 'Escape' && !masterModal.classList.contains('hidden')) {
        closeMasterCreate();
    }
    const stockInModal = document.getElementById('stockInDetailModal');
    if (event.key === 'Escape' && !stockInModal.classList.contains('hidden')) {
        closeStockInDetail();
    }
    const stockInCreateModal = document.getElementById('stockInCreateModal');
    if (event.key === 'Escape' && !stockInCreateModal.classList.contains('hidden')) {
        closeStockInCreate();
    }
    const salesDetailModal = document.getElementById('salesDetailModal');
    if (event.key === 'Escape' && !salesDetailModal.classList.contains('hidden')) {
        closeSalesDetail();
    }
    const salesCreateModal = document.getElementById('salesCreateModal');
    if (event.key === 'Escape' && !salesCreateModal.classList.contains('hidden')) {
        closeSalesCreate();
    }
});

function initializeDashboard() {
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    document.getElementById('userName').textContent = `Hi, ${user.nama || user.username || 'User'}`;
    document.getElementById('userRole').textContent = user.role || 'User';
    if (String(user.role || '').toLowerCase() !== 'admin') {
        document.getElementById('masterContainer').classList.add('hidden');
        document.getElementById('btnAddMasterUser').classList.add('hidden');
    }

    initDropdownLogic();

    // Mendeteksi tab yang dipilih dari URL query parameter ?tab=
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('tab');
    if (currentTab) {
        switchTab(currentTab);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard, { once: true });
} else {
    initializeDashboard();
}
// Event listener Logout
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

// Menangani aksi klik & toggle dropdown secara presisi
function initDropdownLogic() {
    const masterBtn = document.getElementById('tab-master');
    const dropdownMenu = document.getElementById('masterDropdownMenu');

    if (masterBtn && dropdownMenu) {
        masterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Tutup dropdown menu saat salah satu link diklik
        dropdownMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        });
    }

    window.addEventListener('click', (e) => {
        const container = document.getElementById('masterContainer');
        if (container && !container.contains(e.target)) {
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        }
    });
}

// Pindah sub-modul master ke tab baru
function selectSubMaster(subName) {
    window.open(`dashboard.html?tab=master-${subName}`, '_blank');
}

// Aktifkan modul dan atur tampilan tab
function switchTab(modulName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active-tab');
        el.classList.add('inactive-tab');
    });

    let targetId = modulName;
    if (['user', 'barang', 'supplier', 'pelanggan'].includes(modulName)) {
        targetId = `master-${modulName}`;
    }
    if (targetId.startsWith('master-') && String(user.role || '').toLowerCase() !== 'admin') {
        targetId = 'pos';
        modulName = 'pos';
    }

    const targetSection = document.getElementById(`modul-${targetId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update title tab browser agar mudah dikenali saat multitasking
    const tabTitles = {
        'pos': 'Penjualan - nandoApp',
        'stokin': 'Stok In - nandoApp',
        'inventory': 'Inventory - nandoApp',
        'master-user': 'Master User - nandoApp',
        'master-barang': 'Master Barang - nandoApp',
        'master-supplier': 'Master Supplier - nandoApp',
        'master-pelanggan': 'Master Pelanggan - nandoApp'
    };
    if (tabTitles[targetId]) {
        document.title = tabTitles[targetId];
    }

    // Berikan highlight pada menu dropdown master jika sub-modul master aktif
    document.querySelectorAll('#masterDropdownMenu a').forEach(a => {
        if (a.getAttribute('href') && a.getAttribute('href').includes(targetId)) {
            a.classList.add('bg-indigo-50', 'text-indigo-600', 'font-semibold');
        } else {
            a.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-semibold');
        }
    });

    if (targetId.startsWith('master-')) {
        const tabMaster = document.getElementById('tab-master');
        if (tabMaster) {
            tabMaster.classList.remove('inactive-tab');
            tabMaster.classList.add('active-tab');
        }

        if (targetId === 'master-user') fetchMasterUser();
        if (targetId === 'master-barang') fetchMasterBarang();
        if (targetId === 'master-supplier') fetchMasterSupplier();
        if (targetId === 'master-pelanggan') fetchMasterPelanggan();
    } else {
        const activeBtn = document.getElementById(`tab-${modulName}`);
        if (activeBtn) {
            activeBtn.classList.remove('inactive-tab');
            activeBtn.classList.add('active-tab');
        }

        if (targetId === 'pos') fetchSales();
        if (targetId === 'stokin') fetchStockIn();
        if (targetId === 'inventory') fetchInventory();
    }
}

// API Fetch Handlers
async function fetchMasterUser() {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil daftar user.');
        if (!Array.isArray(result.data)) throw new Error('Format data user tidak valid.');

        const tbody = document.getElementById('tblMasterUser');
        tbody.replaceChildren();
        if (!result.data.length) {
            clearMasterUserDetail();
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="p-4 text-center text-gray-400">Belum ada user.</td>';
            tbody.appendChild(row);
            return;
        }

        result.data.forEach(masterUser => {
            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-indigo-50';
            row.addEventListener('click', () => loadMasterUserDetail(masterUser.id));
            [masterUser.id, masterUser.username, masterUser.nama || '-', masterUser.role || '-'].forEach(value => {
                const cell = document.createElement('td');
                cell.className = 'p-3';
                cell.textContent = value;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        if (selectedMasterUserId && !result.data.some(item => String(item.id) === String(selectedMasterUserId))) {
            clearMasterUserDetail();
        }
        showMasterUserMessage('');
    } catch (err) {
        console.error('Gagal load users:', err);
        showMasterUserMessage(err.message);
    }
}

async function loadMasterUserDetail(id) {
    try {
        closeCreateMasterUser();
        const res = await fetch(`${API_URL}/users/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil detail user.');

        const masterUser = result.data;
        selectedMasterUserId = masterUser.id;
        document.getElementById('masterUserUsername').value = masterUser.username || '';
        document.getElementById('masterUserPhone').value = masterUser.no_telp || '';
        document.getElementById('masterUserRole').value = masterUser.role || 'staff';
        document.getElementById('masterUserRole').disabled = String(user.role || '').toLowerCase() !== 'admin';
        document.getElementById('masterUserPassword').value = '';
        masterUserInitialValues = {
            username: masterUser.username || '',
            no_telp: masterUser.no_telp || '',
            role: masterUser.role || 'staff'
        };
        document.getElementById('masterUserDetail').classList.remove('hidden');
        updateMasterUserSaveButton();
        showMasterUserMessage('');
    } catch (err) {
        console.error('Gagal load detail user:', err);
        showMasterUserMessage(err.message);
    }
}

function openCreateMasterUser() {
    clearMasterUserDetail();
    document.getElementById('masterUserCreate').classList.remove('hidden');
    document.getElementById('formCreateMasterUser').reset();
    document.getElementById('newMasterUserRole').value = 'staff';
    document.body.classList.add('overflow-hidden');
    document.getElementById('newMasterUserName').focus();
    showMasterUserMessage('');
}

function closeCreateMasterUser() {
    document.getElementById('masterUserCreate').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    document.getElementById('formCreateMasterUser').reset();
    document.getElementById('btnAddMasterUser').focus();
}

async function createMasterUser(event) {
    event.preventDefault();
    const button = document.getElementById('btnCreateMasterUser');
    button.disabled = true;

    try {
        const payload = {
            nama: document.getElementById('newMasterUserName').value.trim(),
            username: document.getElementById('newMasterUserUsername').value.trim(),
            role: document.getElementById('newMasterUserRole').value,
            no_telp: document.getElementById('newMasterUserPhone').value.trim() || null,
            password: document.getElementById('newMasterUserPassword').value
        };
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menambahkan user.');

        closeCreateMasterUser();
        document.getElementById('formCreateMasterUser').reset();
        await fetchMasterUser();
        showMasterUserMessage('User baru berhasil ditambahkan.', true);
    } catch (err) {
        console.error('Gagal menambahkan user:', err);
        showMasterUserMessage(err.message);
    } finally {
        button.disabled = false;
    }
}

function updateMasterUserSaveButton() {
    if (!masterUserInitialValues) return;
    const username = document.getElementById('masterUserUsername').value.trim();
    const no_telp = document.getElementById('masterUserPhone').value.trim();
    const password = document.getElementById('masterUserPassword').value;
    const role = document.getElementById('masterUserRole').value;
    const hasChanges = username !== masterUserInitialValues.username ||
        no_telp !== masterUserInitialValues.no_telp || password.length > 0 ||
        (String(user.role || '').toLowerCase() === 'admin' && role !== masterUserInitialValues.role);
    document.getElementById('btnSaveMasterUser').classList.toggle('hidden', !hasChanges);
}

async function saveMasterUser() {
    const button = document.getElementById('btnSaveMasterUser');
    button.disabled = true;
    try {
        const password = document.getElementById('masterUserPassword').value;
        const payload = {
            username: document.getElementById('masterUserUsername').value.trim(),
            no_telp: document.getElementById('masterUserPhone').value.trim() || null
        };
        if (password) payload.password = password;
        if (String(user.role || '').toLowerCase() === 'admin') {
            payload.role = document.getElementById('masterUserRole').value;
        }

        const res = await fetch(`${API_URL}/users/${encodeURIComponent(selectedMasterUserId)}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan perubahan user.');

        await fetchMasterUser();
        await loadMasterUserDetail(selectedMasterUserId);
        showMasterUserMessage('Perubahan user berhasil disimpan.', true);
    } catch (err) {
        console.error('Gagal menyimpan user:', err);
        showMasterUserMessage(err.message);
    } finally {
        button.disabled = false;
    }
}

async function deleteMasterUser() {
    if (!selectedMasterUserId || !window.confirm('Hapus user ini secara permanen?')) return;

    try {
        const res = await fetch(`${API_URL}/users/${encodeURIComponent(selectedMasterUserId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menghapus user.');

        clearMasterUserDetail();
        await fetchMasterUser();
        showMasterUserMessage('User berhasil dihapus.', true);
    } catch (err) {
        console.error('Gagal menghapus user:', err);
        showMasterUserMessage(err.message);
    }
}

function clearMasterUserDetail() {
    selectedMasterUserId = null;
    masterUserInitialValues = null;
    document.getElementById('masterUserDetail').classList.add('hidden');
    document.getElementById('masterUserPassword').value = '';
    document.getElementById('btnSaveMasterUser').classList.add('hidden');
}

function showMasterUserMessage(message, success = false) {
    const element = document.getElementById('masterUserMessage');
    element.textContent = message;
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-green-700', success);
    element.classList.toggle('text-red-600', Boolean(message) && !success);
}

async function fetchMasterBarangLegacy() {
    try {
        const res = await fetch(`${API_URL}/barang`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        globalBarang = result.data || result || [];
        
        renderPosTable(globalBarang);
        renderMasterTable(globalBarang);

        // Isi opsi barang di form Stok In jika elemen ada
        const selectBarang = document.getElementById('stokInBarangId');
        if (selectBarang) {
            selectBarang.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
                globalBarang.map(b => `<option value="${b.id}">${b.nama_barang || b.nama} (${b.kode_barang || b.id})</option>`).join('');
        }
    } catch (err) {
        console.error("Gagal load barang:", err);
    }
}

function renderPosTableLegacy(items) {
    const tbody = document.getElementById('tblPosBarang');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">Belum ada barang</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(b => `
        <tr class="hover:bg-gray-50">
            <td class="p-3 font-mono text-xs">${b.kode_barang || b.id}</td>
            <td class="p-3 font-medium">${b.nama_barang || b.nama}</td>
            <td class="p-3">Rp ${(b.harga_jual || b.harga || 0).toLocaleString('id-ID')}</td>
            <td class="p-3"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">${b.stok ?? 0}</span></td>
            <td class="p-3 text-center">
                <button type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1 rounded font-medium">+ Tambah</button>
            </td>
        </tr>
    `).join('');
}

function renderMasterTableLegacy(items) {
    const tbody = document.getElementById('tblMasterBarang');
    tbody.innerHTML = items.map(b => `
        <tr class="hover:bg-gray-50">
            <td class="p-3">${b.id}</td>
            <td class="p-3 font-mono text-xs">${b.kode_barang || '-'}</td>
            <td class="p-3 font-medium">${b.nama_barang || b.nama}</td>
            <td class="p-3">Rp ${(b.harga_beli || 0).toLocaleString('id-ID')}</td>
            <td class="p-3 font-semibold text-indigo-600">Rp ${(b.harga_jual || b.harga || 0).toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

async function fetchMasterSupplierLegacy() {}
async function fetchMasterPelangganLegacy() {}

async function fetchMasterBarang() {
    await fetchMasterData('barang');
}

async function fetchMasterSupplier() {
    await fetchMasterData('supplier');
}

async function fetchMasterPelanggan() {
    await fetchMasterData('pelanggan');
}

async function fetchMasterData(entity) {
    const config = masterDataConfigs[entity];
    const prefix = `master${config.title}`;
    try {
        const res = await fetch(`${API_URL}/${config.api}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Gagal mengambil data ${config.title.toLowerCase()}.`);
        if (!Array.isArray(result.data)) throw new Error(`Format data ${config.title.toLowerCase()} tidak valid.`);

        const records = result.data;
        const tbody = document.getElementById(`tblMaster${config.title}`);
        tbody.replaceChildren();
        if (!records.length) {
            clearMasterDataDetail(entity);
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = entity === 'pelanggan' ? 3 : 4;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = `Belum ada data ${config.title.toLowerCase()}.`;
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            records.forEach(record => {
                const row = document.createElement('tr');
                row.className = 'cursor-pointer hover:bg-indigo-50';
                row.addEventListener('click', () => loadMasterRecord(entity, record[config.key]));
                const values = entity === 'barang'
                    ? [record.kode_barang, record.nama_barang, record.satuan, `Rp ${Number(record.satuan_harga || 0).toLocaleString('id-ID')}`]
                    : entity === 'supplier'
                        ? [record.kode_supplier, record.nama_supplier, record.no_telp || '-', record.alamat || '-']
                        : [record.kode_pelanggan, record.nama_pelanggan, record.alamat || '-'];
                values.forEach((value, index) => {
                    const cell = document.createElement('td');
                    cell.className = index === 0 ? 'p-3 font-mono text-xs' : 'p-3';
                    cell.textContent = value ?? '-';
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
            const selected = selectedMasterData[entity];
            if (selected && !records.some(record => String(record[config.key]) === String(selected.id))) {
                clearMasterDataDetail(entity);
            }
        }

        if (entity === 'barang') {
            globalBarang = records;
            renderPosTable(globalBarang);
            const selectBarang = document.getElementById('stokInBarangId');
            if (selectBarang) {
                selectBarang.replaceChildren(new Option('-- Pilih Barang --', ''));
                globalBarang.forEach(item => {
                    selectBarang.add(new Option(`${item.nama_barang} (${item.kode_barang})`, item.kode_barang));
                });
            }
        }
        showMasterDataMessage(entity, '');
    } catch (err) {
        console.error(`Gagal load ${config.title.toLowerCase()}:`, err);
        showMasterDataMessage(entity, err.message);
    }
}

function buildMasterDataFields(container, entity, values = {}, creating = false) {
    const config = masterDataConfigs[entity];
    container.replaceChildren();
    config.fields.forEach(field => {
        const label = document.createElement('label');
        label.className = `block text-sm font-medium text-gray-700${field.wide ? ' sm:col-span-2' : ''}`;
        label.append(document.createTextNode(field.label));
        const control = field.type === 'textarea'
            ? document.createElement('textarea')
            : document.createElement('input');
        if (control instanceof HTMLInputElement) {
            control.type = field.type || 'text';
            if (field.step) control.step = field.step;
            if (field.min != null) control.min = field.min;
            if (field.maxLength) control.maxLength = field.maxLength;
        } else {
            control.rows = 3;
        }
        control.id = `masterDataField-${entity}-${field.name}`;
        control.dataset.field = field.name;
        control.required = Boolean(creating && field.required);
        control.value = values[field.name] ?? '';
        control.readOnly = !creating && field.name === config.key;
        control.className = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' +
            (control.readOnly ? ' bg-gray-100 text-gray-500' : '');
        if (!creating) {
            control.addEventListener('input', () => updateMasterDataSaveButton(entity));
        }
        label.appendChild(control);
        container.appendChild(label);
    });
}

async function loadMasterRecord(entity, id) {
    const config = masterDataConfigs[entity];
    const prefix = `master${config.title}`;
    try {
        const res = await fetch(`${API_URL}/${config.api}/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Gagal mengambil detail ${config.title.toLowerCase()}.`);
        const record = result.data;
        selectedMasterData[entity] = {
            id: record[config.key],
            initialValues: { ...record }
        };
        buildMasterDataFields(document.getElementById(`${prefix}Fields`), entity, record);
        document.getElementById(`${prefix}Detail`).classList.remove('hidden');
        updateMasterDataSaveButton(entity);
        showMasterDataMessage(entity, '');
    } catch (err) {
        console.error(`Gagal load detail ${config.title.toLowerCase()}:`, err);
        showMasterDataMessage(entity, err.message);
    }
}

function getMasterDataPayload(entity, creating) {
    const config = masterDataConfigs[entity];
    const payload = {};
    config.fields.forEach(field => {
        if (!creating && field.name === config.key) return;
        const control = document.getElementById(`masterDataField-${entity}-${field.name}`);
        payload[field.name] = field.type === 'number'
            ? (control.value === '' ? '' : Number(control.value))
            : control.value.trim();
    });
    return payload;
}

function updateMasterDataSaveButton(entity) {
    const selected = selectedMasterData[entity];
    if (!selected) return;
    const config = masterDataConfigs[entity];
    const fields = config.fields.filter(field => field.name !== config.key);
    const changed = fields.some(field => {
        const control = document.getElementById(`masterDataField-${entity}-${field.name}`);
        if (field.type === 'number') {
            return Number(control.value) !== Number(selected.initialValues[field.name]);
        }
        return control.value.trim() !== String(selected.initialValues[field.name] ?? '').trim();
    });
    document.getElementById(`btnSaveMaster${config.title}`).classList.toggle('hidden', !changed);
}

async function saveMasterRecord(entity) {
    const config = masterDataConfigs[entity];
    const selected = selectedMasterData[entity];
    if (!selected) return;
    const button = document.getElementById(`btnSaveMaster${config.title}`);
    button.disabled = true;
    try {
        const res = await fetch(`${API_URL}/${config.api}/${encodeURIComponent(selected.id)}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(getMasterDataPayload(entity, false))
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Gagal menyimpan ${config.title.toLowerCase()}.`);
        await fetchMasterData(entity);
        await loadMasterRecord(entity, selected.id);
        showMasterDataMessage(entity, `${config.title} berhasil disimpan.`, true);
    } catch (err) {
        console.error(`Gagal menyimpan ${config.title.toLowerCase()}:`, err);
        showMasterDataMessage(entity, err.message);
    } finally {
        button.disabled = false;
    }
}

async function deleteMasterRecord(entity) {
    const config = masterDataConfigs[entity];
    const selected = selectedMasterData[entity];
    if (!selected || !window.confirm(`Hapus ${config.title.toLowerCase()} ini secara permanen?`)) return;
    try {
        const res = await fetch(`${API_URL}/${config.api}/${encodeURIComponent(selected.id)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Gagal menghapus ${config.title.toLowerCase()}.`);
        clearMasterDataDetail(entity);
        await fetchMasterData(entity);
        showMasterDataMessage(entity, `${config.title} berhasil dihapus.`, true);
    } catch (err) {
        console.error(`Gagal menghapus ${config.title.toLowerCase()}:`, err);
        showMasterDataMessage(entity, err.message);
    }
}

function clearMasterDataDetail(entity) {
    const config = masterDataConfigs[entity];
    selectedMasterData[entity] = null;
    document.getElementById(`master${config.title}Detail`).classList.add('hidden');
    document.getElementById(`btnSaveMaster${config.title}`).classList.add('hidden');
}

function showMasterDataMessage(entity, message, success = false) {
    const element = document.getElementById(`master${masterDataConfigs[entity].title}Message`);
    element.textContent = message;
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-green-700', success);
    element.classList.toggle('text-red-600', Boolean(message) && !success);
}

function openMasterCreate(entity) {
    closeCreateMasterUser();
    activeMasterCreateEntity = entity;
    const config = masterDataConfigs[entity];
    document.getElementById('masterDataCreateTitle').textContent = `Tambah ${config.title} Baru`;
    buildMasterDataFields(document.getElementById('masterDataCreateFields'), entity, {}, true);
    document.getElementById('masterDataCreateMessage').textContent = '';
    document.getElementById('masterDataCreateMessage').classList.add('hidden');
    document.getElementById('masterDataCreate').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    document.getElementById(`masterDataField-${entity}-${config.key}`).focus();
    showMasterDataMessage(entity, '');
}

function closeMasterCreate() {
    const modal = document.getElementById('masterDataCreate');
    if (modal.classList.contains('hidden')) return;
    const entity = activeMasterCreateEntity;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    document.getElementById('formMasterDataCreate').reset();
    activeMasterCreateEntity = null;
    if (entity) document.getElementById(`btnAddMaster${masterDataConfigs[entity].title}`).focus();
}

async function createMasterRecord(event) {
    event.preventDefault();
    const entity = activeMasterCreateEntity;
    if (!entity) return;
    const config = masterDataConfigs[entity];
    const button = document.getElementById('btnCreateMasterRecord');
    button.disabled = true;
    try {
        const res = await fetch(`${API_URL}/${config.api}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(getMasterDataPayload(entity, true))
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Gagal menambahkan ${config.title.toLowerCase()}.`);
        closeMasterCreate();
        await fetchMasterData(entity);
        showMasterDataMessage(entity, `${config.title} berhasil ditambahkan.`, true);
    } catch (err) {
        console.error(`Gagal menambahkan ${config.title.toLowerCase()}:`, err);
        const message = document.getElementById('masterDataCreateMessage');
        message.textContent = err.message;
        message.classList.remove('hidden');
    } finally {
        button.disabled = false;
    }
}

function renderPosTable(items) {
    const tbody = document.getElementById('tblPosBarang');
    tbody.replaceChildren();
    if (!items.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'p-4 text-center text-gray-400';
        cell.textContent = 'Belum ada barang';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        [
            item.kode_barang,
            item.nama_barang,
            `Rp ${Number(item.satuan_harga || 0).toLocaleString('id-ID')}`,
            item.stok ?? 0
        ].forEach((value, index) => {
            const cell = document.createElement('td');
            cell.className = index === 1 ? 'p-3 font-medium' : 'p-3';
            cell.textContent = value;
            row.appendChild(cell);
        });
        const actionCell = document.createElement('td');
        actionCell.className = 'p-3 text-center';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1 rounded font-medium';
        button.textContent = '+ Tambah';
        actionCell.appendChild(button);
        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

async function fetchStockIn() {
    try {
        const res = await fetch(`${API_URL}/stokin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil daftar stok in.');
        if (!Array.isArray(result.data)) throw new Error('Format daftar stok in tidak valid.');

        const tbody = document.getElementById('tblStockIn');
        tbody.replaceChildren();
        if (!result.data.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Belum ada transaksi stok in.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            result.data.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'cursor-pointer hover:bg-indigo-50';
                row.addEventListener('click', () => showStockInDetail(item.no_stok_in));
                const numberCell = document.createElement('td');
                numberCell.className = 'p-3 font-mono text-xs font-semibold text-indigo-700';
                numberCell.textContent = item.no_stok_in;
                const dateCell = document.createElement('td');
                dateCell.className = 'p-3';
                dateCell.textContent = formatStockInDate(item.tanggal);
                row.append(numberCell, dateCell);
                tbody.appendChild(row);
            });
        }
        showStockInMessage('');
    } catch (err) {
        console.error('Gagal load daftar stok in:', err);
        showStockInMessage(err.message);
    }
}

async function openStockInCreate() {
    const form = document.getElementById('formStockInCreate');
    form.reset();
    document.getElementById('stockInCreateMessage').classList.add('hidden');
    const today = new Date();
    document.getElementById('newStockInDate').value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
    document.getElementById('stockInCreateItems').replaceChildren();
    document.getElementById('newStockInTotal').textContent = 'Rp 0';
    try {
        const [supplierResponse, barangResponse] = await Promise.all([
            fetch(`${API_URL}/supplier`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/barang`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [supplierResult, barangResult] = await Promise.all([
            supplierResponse.json(),
            barangResponse.json()
        ]);
        if (!supplierResponse.ok) throw new Error(supplierResult.error || 'Gagal mengambil daftar supplier.');
        if (!barangResponse.ok) throw new Error(barangResult.error || 'Gagal mengambil daftar barang.');
        if (!Array.isArray(supplierResult.data) || !Array.isArray(barangResult.data)) {
            throw new Error('Format data supplier atau barang tidak valid.');
        }

        const supplierSelect = document.getElementById('newStockInSupplier');
        supplierSelect.replaceChildren(new Option('Tanpa supplier', ''));
        supplierResult.data.forEach(supplier => {
            supplierSelect.add(new Option(
                `${supplier.nama_supplier} (${supplier.kode_supplier})`,
                supplier.kode_supplier
            ));
        });
        globalBarang = barangResult.data;
        if (!globalBarang.length) throw new Error('Tambahkan master barang terlebih dahulu sebelum membuat stok in.');

        document.getElementById('stockInCreateModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        addStockInItemRow();
        document.getElementById('newStockInNumber').focus();
    } catch (err) {
        console.error('Gagal membuka form stok in:', err);
        showStockInMessage(err.message);
    }
}

function closeStockInCreate() {
    const modal = document.getElementById('stockInCreateModal');
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    document.getElementById('formStockInCreate').reset();
}

function addStockInItemRow() {
    const tbody = document.getElementById('stockInCreateItems');
    const row = document.createElement('tr');
    row.className = 'stock-in-create-row';

    const productCell = document.createElement('td');
    productCell.className = 'p-2';
    const productSelect = document.createElement('select');
    productSelect.className = 'stock-in-product w-full min-w-48 rounded-lg border border-gray-300 px-2 py-2 text-sm';
    productSelect.required = true;
    productSelect.add(new Option('-- Pilih barang --', ''));
    globalBarang.forEach(product => {
        productSelect.add(new Option(
            `${product.nama_barang} (${product.kode_barang})`,
            product.kode_barang
        ));
    });
    productCell.appendChild(productSelect);

    const qtyCell = document.createElement('td');
    qtyCell.className = 'p-2';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.step = '1';
    qtyInput.value = '1';
    qtyInput.required = true;
    qtyInput.className = 'stock-in-qty w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm';
    qtyCell.appendChild(qtyInput);

    const priceCell = document.createElement('td');
    priceCell.className = 'p-2';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.value = '0';
    priceInput.required = true;
    priceInput.className = 'stock-in-price w-32 rounded-lg border border-gray-300 px-2 py-2 text-sm';
    priceCell.appendChild(priceInput);

    const subtotalCell = document.createElement('td');
    subtotalCell.className = 'stock-in-subtotal whitespace-nowrap p-2 text-sm font-medium';
    subtotalCell.textContent = 'Rp 0';

    const actionCell = document.createElement('td');
    actionCell.className = 'p-2';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100';
    removeButton.textContent = 'Hapus';
    removeButton.addEventListener('click', () => {
        row.remove();
        updateStockInCreateTotal();
    });
    actionCell.appendChild(removeButton);

    productSelect.addEventListener('change', () => {
        const product = globalBarang.find(item => item.kode_barang === productSelect.value);
        priceInput.value = product ? Number(product.satuan_harga || 0) : '0';
        updateStockInCreateTotal();
    });
    qtyInput.addEventListener('input', updateStockInCreateTotal);
    priceInput.addEventListener('input', updateStockInCreateTotal);
    row.append(productCell, qtyCell, priceCell, subtotalCell, actionCell);
    tbody.appendChild(row);
    updateStockInCreateTotal();
}

function updateStockInCreateTotal() {
    let grandTotal = 0;
    document.querySelectorAll('.stock-in-create-row').forEach(row => {
        const qty = Number(row.querySelector('.stock-in-qty').value) || 0;
        const price = Number(row.querySelector('.stock-in-price').value) || 0;
        const subtotal = qty * price;
        grandTotal += subtotal;
        row.querySelector('.stock-in-subtotal').textContent =
            `Rp ${subtotal.toLocaleString('id-ID')}`;
    });
    document.getElementById('newStockInTotal').textContent =
        `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

async function createStockIn(event) {
    event.preventDefault();
    const rows = Array.from(document.querySelectorAll('.stock-in-create-row'));
    if (!rows.length) {
        document.getElementById('stockInCreateMessage').textContent = 'Tambahkan minimal satu barang.';
        document.getElementById('stockInCreateMessage').classList.remove('hidden');
        return;
    }

    const button = document.getElementById('btnCreateStockIn');
    const message = document.getElementById('stockInCreateMessage');
    button.disabled = true;
    message.classList.add('hidden');
    try {
        const payload = {
            no_stok_in: document.getElementById('newStockInNumber').value.trim(),
            tanggal: document.getElementById('newStockInDate').value,
            kode_supplier: document.getElementById('newStockInSupplier').value || null,
            items: rows.map(row => ({
                kode_barang: row.querySelector('.stock-in-product').value,
                qty: Number(row.querySelector('.stock-in-qty').value),
                satuan_harga: Number(row.querySelector('.stock-in-price').value)
            }))
        };
        const res = await fetch(`${API_URL}/stokin`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan stok in.');
        closeStockInCreate();
        await fetchStockIn();
        showStockInMessage('Transaksi stok in berhasil ditambahkan.', true);
    } catch (err) {
        console.error('Gagal menyimpan stok in:', err);
        message.textContent = err.message;
        message.classList.remove('hidden');
    } finally {
        button.disabled = false;
    }
}

async function fetchSales() {
    try {
        const res = await fetch(`${API_URL}/penjualan`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil daftar penjualan.');
        if (!Array.isArray(result.data)) throw new Error('Format daftar penjualan tidak valid.');

        const tbody = document.getElementById('tblSales');
        tbody.replaceChildren();
        if (!result.data.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Belum ada transaksi penjualan.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            result.data.forEach(sale => {
                const row = document.createElement('tr');
                row.className = 'cursor-pointer hover:bg-indigo-50';
                row.addEventListener('click', () => showSalesDetail(sale.no_penjualan));
                const numberCell = document.createElement('td');
                numberCell.className = 'p-3 font-mono text-xs font-semibold text-indigo-700';
                numberCell.textContent = sale.no_penjualan;
                const dateCell = document.createElement('td');
                dateCell.className = 'p-3';
                dateCell.textContent = formatStockInDate(sale.tanggal);
                row.append(numberCell, dateCell);
                tbody.appendChild(row);
            });
        }
        showSalesMessage('');
    } catch (err) {
        console.error('Gagal load daftar penjualan:', err);
        showSalesMessage(err.message);
    }
}

async function showSalesDetail(noPenjualan) {
    try {
        const res = await fetch(`${API_URL}/penjualan/${encodeURIComponent(noPenjualan)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil detail penjualan.');

        const sale = result.data;
        document.getElementById('salesDetailSubtitle').textContent = formatStockInDate(sale.tanggal);
        document.getElementById('salesDetailNumber').textContent = sale.no_penjualan;
        document.getElementById('salesDetailCustomer').textContent =
            sale.nama_pelanggan || sale.kode_pelanggan || '-';
        document.getElementById('salesDetailTotal').textContent =
            `Rp ${Number(sale.grand_total || 0).toLocaleString('id-ID')}`;

        const tbody = document.getElementById('tblSalesDetails');
        tbody.replaceChildren();
        if (!Array.isArray(sale.details) || !sale.details.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Tidak ada rincian barang.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            sale.details.forEach(detail => {
                const row = document.createElement('tr');
                [
                    detail.kode_barang,
                    detail.nama_barang || '-',
                    `${detail.qty} ${detail.satuan || ''}`.trim(),
                    `Rp ${Number(detail.satuan_harga || 0).toLocaleString('id-ID')}`,
                    `Rp ${Number(detail.subtotal || 0).toLocaleString('id-ID')}`
                ].forEach(value => {
                    const cell = document.createElement('td');
                    cell.className = 'p-3';
                    cell.textContent = value ?? '-';
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }
        document.getElementById('salesDetailModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        showSalesMessage('');
    } catch (err) {
        console.error('Gagal load detail penjualan:', err);
        showSalesMessage(err.message);
    }
}

function closeSalesDetail() {
    document.getElementById('salesDetailModal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function showSalesMessage(message, success = false) {
    const element = document.getElementById('salesMessage');
    element.textContent = message;
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-green-700', success);
    element.classList.toggle('text-red-600', Boolean(message) && !success);
}

async function openSalesCreate() {
    document.getElementById('formSalesCreate').reset();
    document.getElementById('salesCreateMessage').classList.add('hidden');
    const today = new Date();
    document.getElementById('newSalesDate').value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
    document.getElementById('salesCreateItems').replaceChildren();
    document.getElementById('newSalesTotal').textContent = 'Rp 0';
    try {
        const [customerResponse, productResponse] = await Promise.all([
            fetch(`${API_URL}/pelanggan`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/barang`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [customerResult, productResult] = await Promise.all([
            customerResponse.json(),
            productResponse.json()
        ]);
        if (!customerResponse.ok) throw new Error(customerResult.error || 'Gagal mengambil daftar pelanggan.');
        if (!productResponse.ok) throw new Error(productResult.error || 'Gagal mengambil daftar barang.');
        if (!Array.isArray(customerResult.data) || !Array.isArray(productResult.data)) {
            throw new Error('Format data pelanggan atau barang tidak valid.');
        }

        const customerSelect = document.getElementById('newSalesCustomer');
        customerSelect.replaceChildren(new Option('Tanpa pelanggan', ''));
        customerResult.data.forEach(customer => customerSelect.add(new Option(
            `${customer.nama_pelanggan} (${customer.kode_pelanggan})`,
            customer.kode_pelanggan
        )));
        globalBarang = productResult.data;
        if (!globalBarang.length) throw new Error('Tambahkan master barang terlebih dahulu sebelum membuat penjualan.');

        document.getElementById('salesCreateModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        addSalesItemRow();
        document.getElementById('newSalesNumber').focus();
    } catch (err) {
        console.error('Gagal membuka form penjualan:', err);
        showSalesMessage(err.message);
    }
}

function closeSalesCreate() {
    const modal = document.getElementById('salesCreateModal');
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    document.getElementById('formSalesCreate').reset();
}

function addSalesItemRow() {
    const row = document.createElement('tr');
    row.className = 'sales-create-row';

    const productCell = document.createElement('td');
    productCell.className = 'p-2';
    const productSelect = document.createElement('select');
    productSelect.className = 'sales-product w-full min-w-48 rounded-lg border border-gray-300 px-2 py-2 text-sm';
    productSelect.required = true;
    productSelect.add(new Option('-- Pilih barang --', ''));
    globalBarang.forEach(product => productSelect.add(new Option(
        `${product.nama_barang} (${product.kode_barang})`,
        product.kode_barang
    )));
    productCell.appendChild(productSelect);

    const stockCell = document.createElement('td');
    stockCell.className = 'sales-stock whitespace-nowrap p-2 text-sm text-gray-600';
    stockCell.textContent = '-';

    const qtyCell = document.createElement('td');
    qtyCell.className = 'p-2';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.step = '1';
    qtyInput.value = '1';
    qtyInput.required = true;
    qtyInput.className = 'sales-qty w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm';
    qtyCell.appendChild(qtyInput);

    const priceCell = document.createElement('td');
    priceCell.className = 'sales-price whitespace-nowrap p-2 text-sm';
    priceCell.textContent = '-';

    const subtotalCell = document.createElement('td');
    subtotalCell.className = 'sales-subtotal whitespace-nowrap p-2 text-sm font-medium';
    subtotalCell.textContent = 'Rp 0';

    const actionCell = document.createElement('td');
    actionCell.className = 'p-2';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100';
    removeButton.textContent = 'Hapus';
    removeButton.addEventListener('click', () => {
        row.remove();
        updateSalesCreateTotal();
    });
    actionCell.appendChild(removeButton);

    productSelect.addEventListener('change', () => {
        const product = globalBarang.find(item => item.kode_barang === productSelect.value);
        stockCell.textContent = product ? `${product.stok ?? 0} ${product.satuan || ''}`.trim() : '-';
        priceCell.textContent = product
            ? `Rp ${Number(product.satuan_harga || 0).toLocaleString('id-ID')}`
            : '-';
        updateSalesCreateTotal();
    });
    qtyInput.addEventListener('input', updateSalesCreateTotal);
    row.append(productCell, stockCell, qtyCell, priceCell, subtotalCell, actionCell);
    document.getElementById('salesCreateItems').appendChild(row);
    updateSalesCreateTotal();
}

function updateSalesCreateTotal() {
    let grandTotal = 0;
    document.querySelectorAll('.sales-create-row').forEach(row => {
        const product = globalBarang.find(item =>
            item.kode_barang === row.querySelector('.sales-product').value
        );
        const qty = Number(row.querySelector('.sales-qty').value) || 0;
        const subtotal = product ? qty * Number(product.satuan_harga || 0) : 0;
        grandTotal += subtotal;
        row.querySelector('.sales-subtotal').textContent =
            `Rp ${subtotal.toLocaleString('id-ID')}`;
    });
    document.getElementById('newSalesTotal').textContent =
        `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

async function createSale(event) {
    event.preventDefault();
    const rows = Array.from(document.querySelectorAll('.sales-create-row'));
    const message = document.getElementById('salesCreateMessage');
    if (!rows.length) {
        message.textContent = 'Tambahkan minimal satu barang.';
        message.classList.remove('hidden');
        return;
    }

    const button = document.getElementById('btnCreateSale');
    button.disabled = true;
    message.classList.add('hidden');
    try {
        const payload = {
            no_penjualan: document.getElementById('newSalesNumber').value.trim(),
            tanggal: document.getElementById('newSalesDate').value,
            kode_pelanggan: document.getElementById('newSalesCustomer').value || null,
            items: rows.map(row => ({
                kode_barang: row.querySelector('.sales-product').value,
                qty: Number(row.querySelector('.sales-qty').value)
            }))
        };
        const res = await fetch(`${API_URL}/penjualan`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal menyimpan penjualan.');
        closeSalesCreate();
        await fetchSales();
        showSalesMessage('Transaksi penjualan berhasil ditambahkan.', true);
    } catch (err) {
        console.error('Gagal menyimpan penjualan:', err);
        message.textContent = err.message;
        message.classList.remove('hidden');
    } finally {
        button.disabled = false;
    }
}

function formatStockInDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '-');
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

async function showStockInDetail(noStokIn) {
    try {
        const res = await fetch(`${API_URL}/stokin/${encodeURIComponent(noStokIn)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mengambil detail stok in.');

        const stockIn = result.data;
        document.getElementById('stockInDetailTitle').textContent = `Detail Stok In`;
        document.getElementById('stockInDetailSubtitle').textContent = formatStockInDate(stockIn.tanggal);
        document.getElementById('stockInDetailNumber').textContent = stockIn.no_stok_in;
        document.getElementById('stockInDetailSupplier').textContent =
            stockIn.nama_supplier || stockIn.kode_supplier || '-';
        document.getElementById('stockInDetailTotal').textContent =
            `Rp ${Number(stockIn.grand_total || 0).toLocaleString('id-ID')}`;

        const tbody = document.getElementById('tblStockInDetails');
        tbody.replaceChildren();
        if (!Array.isArray(stockIn.details) || !stockIn.details.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Tidak ada rincian barang.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            stockIn.details.forEach(detail => {
                const row = document.createElement('tr');
                [
                    detail.kode_barang,
                    detail.nama_barang || '-',
                    `${detail.qty} ${detail.satuan || ''}`.trim(),
                    `Rp ${Number(detail.satuan_harga || 0).toLocaleString('id-ID')}`,
                    `Rp ${Number(detail.subtotal || 0).toLocaleString('id-ID')}`
                ].forEach(value => {
                    const cell = document.createElement('td');
                    cell.className = 'p-3';
                    cell.textContent = value ?? '-';
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }
        document.getElementById('stockInDetailModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        showStockInMessage('');
    } catch (err) {
        console.error('Gagal load detail stok in:', err);
        showStockInMessage(err.message);
    }
}

function closeStockInDetail() {
    document.getElementById('stockInDetailModal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function showStockInMessage(message, success = false) {
    const element = document.getElementById('stockInMessage');
    element.textContent = message;
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-green-700', success);
    element.classList.toggle('text-red-600', Boolean(message) && !success);
}

async function fetchInventoryLegacy() {
    try {
        const res = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        const items = result.data || result || [];
        const tbody = document.getElementById('tblInventory');
        tbody.innerHTML = items.map(i => `
            <tr class="hover:bg-gray-50">
                <td class="p-3">${i.id}</td>
                <td class="p-3 font-medium">${i.nama_barang || i.nama}</td>
                <td class="p-3 font-bold">${i.stok ?? 0}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold ${(i.stok ?? 0) < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${(i.stok ?? 0) < 5 ? 'Stok Kritis' : 'Aman'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Gagal load inventory:", err);
    }
}

async function handleInventoryFilterChange() {
    const filter = document.getElementById('inventoryFilter').value;
    const input = document.getElementById('inventorySearchValue');
    const select = document.getElementById('inventoryBarangSelect');
    const isBarangFilter = filter === 'nama_barang';

    input.classList.toggle('hidden', isBarangFilter);
    input.required = !isBarangFilter;
    select.classList.toggle('hidden', !isBarangFilter);
    select.required = isBarangFilter;
    input.value = '';
    select.value = '';
    showInventoryMessage('');

    if (!isBarangFilter || inventoryBarangOptions) return;

    select.replaceChildren(new Option('Memuat daftar barang...', ''));
    try {
        const res = await fetch(`${API_URL}/barang`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal memuat daftar barang.');
        if (!Array.isArray(result.data)) throw new Error('Format daftar barang tidak valid.');

        inventoryBarangOptions = result.data;
        select.replaceChildren(new Option('-- Pilih nama barang --', ''));
        const names = new Map();
        inventoryBarangOptions.forEach(item => {
            if (item.nama_barang && !names.has(item.nama_barang)) {
                names.set(item.nama_barang, item.kode_barang);
            }
        });
        names.forEach((code, name) => {
            select.add(new Option(`${name} (${code})`, name));
        });
        if (!names.size) select.replaceChildren(new Option('Belum ada data barang', ''));
    } catch (err) {
        console.error('Gagal memuat pilihan nama barang:', err);
        inventoryBarangOptions = null;
        select.replaceChildren(new Option('-- Gagal memuat, pilih ulang kriteria --', ''));
        showInventoryMessage(err.message);
    }
}

async function fetchInventory(event) {
    if (event) event.preventDefault();
    const filter = document.getElementById('inventoryFilter').value;
    const value = (filter === 'nama_barang'
        ? document.getElementById('inventoryBarangSelect').value
        : document.getElementById('inventorySearchValue').value).trim();
    const tbody = document.getElementById('tblInventory');
    if (!filter || !value) {
        if (!filter && !value) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Pilih kriteria dan masukkan kata kunci untuk mencari stok.';
            tbody.replaceChildren(row);
            row.appendChild(cell);
            showInventoryMessage('');
            return;
        }
        showInventoryMessage('Pilih kriteria dan masukkan kata kunci pencarian.');
        return;
    }

    const button = document.getElementById('btnInventorySearch');
    button.disabled = true;
    try {
        const params = new URLSearchParams({ filter, value });
        const res = await fetch(`${API_URL}/inventory?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal mencari stok inventory.');
        if (!Array.isArray(result.data)) throw new Error('Format data inventory tidak valid.');

        tbody.replaceChildren();
        if (!result.data.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'p-4 text-center text-gray-400';
            cell.textContent = 'Tidak ditemukan barang untuk kriteria tersebut.';
            row.appendChild(cell);
            tbody.appendChild(row);
        } else {
            result.data.forEach(item => {
                const row = document.createElement('tr');
                const stock = Number(item.stok) || 0;
                [item.kode_barang, item.nama_barang, stock, stock < 5 ? 'Stok Kritis' : 'Aman'].forEach((value, index) => {
                    const cell = document.createElement('td');
                    cell.className = index === 1 ? 'p-3 font-medium' : 'p-3';
                    cell.textContent = value ?? '-';
                    if (index === 2) cell.classList.add('font-bold');
                    if (index === 3) {
                        const badge = document.createElement('span');
                        badge.className = `rounded px-2 py-0.5 text-xs font-semibold ${stock < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`;
                        badge.textContent = value;
                        cell.replaceChildren(badge);
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }
        showInventoryMessage(`${result.data.length} barang ditemukan.`, true);
    } catch (err) {
        console.error('Gagal mencari inventory:', err);
        showInventoryMessage(err.message);
    } finally {
        button.disabled = false;
    }
}

function showInventoryMessage(message, success = false) {
    const element = document.getElementById('inventoryMessage');
    element.textContent = message;
    element.classList.toggle('hidden', !message);
    element.classList.toggle('text-green-700', success);
    element.classList.toggle('text-red-600', Boolean(message) && !success);
}

