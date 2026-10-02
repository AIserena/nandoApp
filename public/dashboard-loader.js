const dashboardModules = [
    'master-data.html',
    'sales.html',
    'stock-in.html',
    'inventory.html'
];

async function loadDashboard() {
    const container = document.getElementById('moduleContent');
    const errorMessage = document.getElementById('moduleLoadError');

    try {
        const responses = await Promise.all(dashboardModules.map(async filename => {
            const response = await fetch('/modules/' + filename);
            if (!response.ok) {
                throw new Error('Gagal memuat modul ' + filename + ' (' + response.status + ').');
            }
            return response.text();
        }));

        container.innerHTML = responses.join('\n');
        const appScript = document.createElement('script');
        appScript.src = '/dashboard.js';
        appScript.onerror = () => showModuleLoadError(new Error('Gagal memuat skrip dashboard.'));
        document.body.appendChild(appScript);
    } catch (error) {
        showModuleLoadError(error);
    }

    function showModuleLoadError(error) {
        console.error('Gagal menyiapkan dashboard:', error);
        container.classList.add('hidden');
        errorMessage.textContent = 'Dashboard gagal dimuat. Muat ulang halaman atau hubungi administrator.';
        errorMessage.classList.remove('hidden');
    }
}

loadDashboard();
