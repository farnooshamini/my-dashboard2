/* ============================================
   ForexSupport Pro — Clients CRUD Module
   ============================================ */

const API_BASE = CONFIG.API_BASE;

let clientsData  = [];
let editingId    = null;

/* ══════════════════════════════════════
   LOAD (entry point called by dashboard)
══════════════════════════════════════ */
async function loadClients() {
    const el = document.getElementById('section-clients');
    el.innerHTML = buildClientsShell();
    bindModalClose();
    await fetchAndRenderClients();
}

async function fetchAndRenderClients() {
    try {
        const res  = await apiFetch(`${API_BASE}/clients`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        clientsData = json.data;
        renderClientsTable(clientsData);
    } catch (err) {
        renderTableError(err.message || 'Failed to load clients.');
    }
}

/* ══════════════════════════════════════
   SHELL HTML
══════════════════════════════════════ */
function buildClientsShell() {
    return `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Client Accounts</h2>
                <p id="clientsSubtitle">Loading clients…</p>
            </div>
            <div class="section-header-actions">
                <div class="search-input-small">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients…" oninput="clientFilterText(this.value)" style="width:180px">
                </div>
                <select class="filter-select" onchange="clientFilterStatus(this.value)">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
                <button class="btn btn-primary btn-sm" onclick="openClientModal(null)">
                    <i class="fas fa-plus"></i> Add New
                </button>
            </div>
        </div>

        <div id="clientsAlert" class="clients-alert hidden"></div>

        <div class="card mb-6">
            <div class="table-wrapper">
                <table class="data-table" id="clientsTable">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Account #</th>
                            <th>Balance</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody">
                        <tr><td colspan="7" class="table-loading">
                            <i class="fas fa-circle-notch spin"></i> Loading…
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add / Edit Modal -->
        <div class="modal-overlay hidden" id="clientModal">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="clientModalTitle">Add New Client</h3>
                    <button class="modal-close-btn" onclick="closeClientModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="clientModalError" class="modal-error hidden"></div>
                <form id="clientForm" onsubmit="submitClientForm(event)" novalidate>
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label>Name <span class="req">*</span></label>
                            <input type="text" id="cf_name" placeholder="Full name">
                            <span class="modal-field-error" id="cf_nameErr"></span>
                        </div>
                        <div class="modal-form-group">
                            <label>Email <span class="req">*</span></label>
                            <input type="email" id="cf_email" placeholder="client@email.com">
                            <span class="modal-field-error" id="cf_emailErr"></span>
                        </div>
                    </div>
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label>Account Number <span class="req">*</span></label>
                            <input type="text" id="cf_accountNumber" placeholder="MT4-10001">
                            <span class="modal-field-error" id="cf_accountNumberErr"></span>
                        </div>
                        <div class="modal-form-group">
                            <label>Balance</label>
                            <input type="number" id="cf_balance" placeholder="0.00" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label>Currency</label>
                            <select id="cf_currency">
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                        <div class="modal-form-group">
                            <label>Status</label>
                            <select id="cf_status">
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeClientModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="clientModalSubmit">
                            <span class="btn-text">Save Client</span>
                            <span class="btn-loader"><i class="fas fa-circle-notch spin"></i></span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

/* ══════════════════════════════════════
   TABLE RENDERING
══════════════════════════════════════ */
function renderClientsTable(clients) {
    const subtitle = document.getElementById('clientsSubtitle');
    if (subtitle) subtitle.textContent = `${clients.length} client${clients.length !== 1 ? 's' : ''}`;

    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No clients found. Click <strong>Add New</strong> to create one.</td></tr>`;
        return;
    }

    const statusClass = {
        active:    'badge-resolved',
        pending:   'badge-pending',
        inactive:  'badge-open',
        suspended: 'badge-escalated',
    };

    tbody.innerHTML = clients.map(c => {
        const initials = c.name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
        const date     = new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const balance  = Number(c.balance).toLocaleString('en-US', { style: 'currency', currency: c.currency || 'USD' });
        const cls      = statusClass[c.status] || 'badge-open';
        const nameSafe = c.name.replace(/'/g, "\\'");

        return `
        <tr data-status="${c.status}" data-id="${c.id}">
            <td>
                <div class="user-cell">
                    <div class="avatar avatar-sm av-blue">${initials}</div>
                    <div class="user-cell-info">
                        <div class="name">${c.name}</div>
                        <div class="sub">${c.email}</div>
                    </div>
                </div>
            </td>
            <td><span class="ticket-id">${c.accountNumber}</span></td>
            <td style="font-weight:600;color:var(--text-primary)">${balance}</td>
            <td>${c.currency}</td>
            <td><span class="badge ${cls}">${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
            <td style="color:var(--text-muted);font-size:0.8rem">${date}</td>
            <td>
                <div class="row-actions">
                    <button class="btn btn-ghost btn-sm" onclick="openClientModal(${c.id})" title="Edit">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-ghost-danger" onclick="confirmDeleteClient(${c.id},'${nameSafe}')" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderTableError(msg) {
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="table-error"><i class="fas fa-exclamation-circle"></i> ${msg}</td></tr>`;
}

/* ══════════════════════════════════════
   MODAL
══════════════════════════════════════ */
function openClientModal(id) {
    editingId = id;
    const modal = document.getElementById('clientModal');
    clearModalErrors();

    document.getElementById('clientModalTitle').textContent = id ? 'Edit Client' : 'Add New Client';
    document.getElementById('clientModalSubmit').querySelector('.btn-text').textContent = id ? 'Update Client' : 'Save Client';

    if (id) {
        const c = clientsData.find(x => x.id === id);
        if (!c) return;
        document.getElementById('cf_name').value          = c.name;
        document.getElementById('cf_email').value         = c.email;
        document.getElementById('cf_accountNumber').value = c.accountNumber;
        document.getElementById('cf_balance').value       = c.balance;
        document.getElementById('cf_currency').value      = c.currency;
        document.getElementById('cf_status').value        = c.status;
    } else {
        document.getElementById('clientForm').reset();
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('cf_name').focus();
}

function closeClientModal() {
    document.getElementById('clientModal').classList.add('hidden');
    document.body.style.overflow = '';
    editingId = null;
}

function bindModalClose() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeClientModal();
    });
    document.getElementById('section-clients').addEventListener('click', e => {
        if (e.target.id === 'clientModal') closeClientModal();
    });
}

function clearModalErrors() {
    const errEl = document.getElementById('clientModalError');
    if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
    document.querySelectorAll('.modal-field-error').forEach(el => { el.textContent = ''; });
}

/* ══════════════════════════════════════
   CREATE / UPDATE
══════════════════════════════════════ */
async function submitClientForm(e) {
    e.preventDefault();
    clearModalErrors();

    const name          = document.getElementById('cf_name').value.trim();
    const email         = document.getElementById('cf_email').value.trim();
    const accountNumber = document.getElementById('cf_accountNumber').value.trim();

    let valid = true;
    if (!name)          { document.getElementById('cf_nameErr').textContent          = 'Name is required.';           valid = false; }
    if (!email)         { document.getElementById('cf_emailErr').textContent         = 'Email is required.';          valid = false; }
    if (!accountNumber) { document.getElementById('cf_accountNumberErr').textContent = 'Account number is required.'; valid = false; }
    if (!valid) return;

    const body = {
        name,
        email,
        accountNumber,
        balance:  document.getElementById('cf_balance').value       || 0,
        currency: document.getElementById('cf_currency').value,
        status:   document.getElementById('cf_status').value,
    };

    const btn    = document.getElementById('clientModalSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const url    = editingId ? `${API_BASE}/clients/${editingId}` : `${API_BASE}/clients`;
        const method = editingId ? 'PUT' : 'POST';
        const res    = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json   = await res.json();

        if (!json.success) {
            const errEl = document.getElementById('clientModalError');
            errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${json.message}`;
            errEl.classList.remove('hidden');
            return;
        }

        closeClientModal();
        showClientsAlert(editingId ? 'Client updated successfully.' : 'New client added.', 'success');
        await fetchAndRenderClients();
    } catch {
        const errEl = document.getElementById('clientModalError');
        errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Network error — is the server running?`;
        errEl.classList.remove('hidden');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

/* ══════════════════════════════════════
   DELETE
══════════════════════════════════════ */
async function confirmDeleteClient(id, name) {
    if (!confirm(`Delete client "${name}"?\n\nThis action cannot be undone.`)) return;

    try {
        const res  = await apiFetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
        const json = await res.json();

        if (!json.success) {
            showClientsAlert(json.message, 'error');
            return;
        }

        showClientsAlert(`"${name}" was deleted.`, 'success');
        await fetchAndRenderClients();
    } catch {
        showClientsAlert('Network error — is the server running?', 'error');
    }
}

/* ══════════════════════════════════════
   ALERT BANNER
══════════════════════════════════════ */
function showClientsAlert(msg, type) {
    const el = document.getElementById('clientsAlert');
    if (!el) return;
    el.className = `clients-alert clients-alert-${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 4000);
}

/* ══════════════════════════════════════
   FILTERS
══════════════════════════════════════ */
window.clientFilterText = function(q) {
    const query = q.toLowerCase();
    document.querySelectorAll('#clientsTableBody tr[data-id]').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
};

window.clientFilterStatus = function(status) {
    document.querySelectorAll('#clientsTableBody tr[data-status]').forEach(row => {
        row.style.display = (!status || row.dataset.status === status) ? '' : 'none';
    });
};

/* ── Expose to dashboard ── */
window.loadClients         = loadClients;
window.openClientModal     = openClientModal;
window.closeClientModal    = closeClientModal;
window.confirmDeleteClient = confirmDeleteClient;
window.submitClientForm    = submitClientForm;
