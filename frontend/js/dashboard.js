/* ============================================
   ForexSupport Pro — Dashboard Logic
   ============================================ */

/* ══════════════════════════════════════
   DARK MODE
══════════════════════════════════════ */
const DM_KEY = 'fxsp_dark_mode';
let _autoThemeTimer = null;

function _isDarkHour() {
    const h = new Date().getHours();
    return h >= 20 || h < 7; // dark from 8 pm to 7 am
}

function initDarkMode() {
    const saved = localStorage.getItem(DM_KEY);
    if (saved === 'auto') {
        _startAutoTheme();
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved !== null ? saved === 'true' : prefersDark;
        applyDarkMode(isDark, false);
    }
}

function toggleDarkMode() {
    _stopAutoTheme();
    applyDarkMode(!document.body.classList.contains('dark-mode'), true);
}

function applyDarkMode(dark, withTransition) {
    if (withTransition) {
        document.body.classList.add('dark-transition');
        setTimeout(() => document.body.classList.remove('dark-transition'), 300);
    }

    document.body.classList.toggle('dark-mode', dark);
    if (localStorage.getItem(DM_KEY) !== 'auto') {
        localStorage.setItem(DM_KEY, dark);
    }

    const icon = document.getElementById('darkModeIcon');
    const btn  = document.getElementById('headerDarkToggle');
    if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    if (btn)  btn.title = dark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    const settingsToggle = document.getElementById('settingsDarkToggle');
    if (settingsToggle) settingsToggle.checked = dark;

    syncSettingsThemeCards(dark);
}

function activateAutoTheme() {
    localStorage.setItem(DM_KEY, 'auto');
    _startAutoTheme();
    syncSettingsThemeCards(document.body.classList.contains('dark-mode'));
}

function _startAutoTheme() {
    _stopAutoTheme();
    applyDarkMode(_isDarkHour(), true);
    // re-check every minute
    _autoThemeTimer = setInterval(() => applyDarkMode(_isDarkHour(), true), 60000);
}

function _stopAutoTheme() {
    if (_autoThemeTimer) { clearInterval(_autoThemeTimer); _autoThemeTimer = null; }
}

function syncSettingsThemeCards(dark) {
    const lightCard  = document.getElementById('dmCardLight');
    const darkCard   = document.getElementById('dmCardDark');
    const systemCard = document.getElementById('dmCardSystem');
    const autoCard   = document.getElementById('dmCardAuto');
    const cards = [lightCard, darkCard, systemCard, autoCard].filter(Boolean);
    if (!cards.length) return;

    cards.forEach(c => {
        c.style.borderColor = 'var(--border)';
        c.querySelector('.dm-card-label').style.color = 'var(--text-secondary)';
        c.querySelector('.dm-card-label').style.fontWeight = '500';
    });

    const isAuto = localStorage.getItem(DM_KEY) === 'auto';
    const active = isAuto ? autoCard : (dark ? darkCard : lightCard);
    if (active) {
        active.style.borderColor = 'var(--primary-light)';
        active.querySelector('.dm-card-label').style.color = 'var(--primary-light)';
        active.querySelector('.dm-card-label').style.fontWeight = '700';
    }
}

window.toggleDarkMode    = toggleDarkMode;
window.applyDarkMode     = applyDarkMode;
window.activateAutoTheme = activateAutoTheme;
window._stopAutoTheme    = _stopAutoTheme;

/* ── State ── */
let currentSection = 'overview';
let currentUser    = null;
let charts         = {};

/* ── Role-based access ── */
const ROLE_PERMISSIONS = {
    account_manager: ['overview', 'clients', 'team', 'performance', 'reports', 'settings', 'help'],
    support:         ['overview', 'my-tickets', 'all-tickets', 'team', 'performance', 'settings', 'help'],
    sales:           ['overview', 'team', 'performance', 'reports', 'settings', 'help'],
    finance:         ['overview', 'reports', 'settings', 'help'],
};

const ROLE_DEFAULTS = {
    account_manager: 'clients',
    support:         'my-tickets',
    sales:           'overview',
    finance:         'reports',
};

const ROLE_LABELS = {
    account_manager: 'Account Manager',
    support:         'Chat Support',
    sales:           'Sales / IB',
    finance:         'Finance / Back Office',
};

function getAllowedSections() {
    return ROLE_PERMISSIONS[currentUser?.role] || ROLE_PERMISSIONS['support'];
}

function applyRoleAccess() {
    const allowed = getAllowedSections();
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.style.display = allowed.includes(btn.dataset.nav) ? '' : 'none';
    });
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
    currentUser = requireAuth();
    if (!currentUser) return;
    initDarkMode();   // apply saved theme before rendering
    initDashboard();
});

function initDashboard() {
    renderUserInfo();
    applyRoleAccess();
    initNavigation();
    initSearch();
    navigateTo(ROLE_DEFAULTS[currentUser?.role] || 'overview');
}

/* ══════════════════════════════════════
   USER INFO
══════════════════════════════════════ */
function renderUserInfo() {
    // Header
    document.getElementById('headerUserName').textContent = currentUser.name;
    document.getElementById('headerUserRole').textContent = ROLE_LABELS[currentUser.role] || currentUser.role;
    setAvatarInitials('headerAvatar', currentUser.initials, currentUser.color);

    // Sidebar footer
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserRole').textContent = ROLE_LABELS[currentUser.role] || currentUser.role;
    setAvatarInitials('sidebarAvatar', currentUser.initials, currentUser.color);
}

function setAvatarInitials(id, initials, colorClass) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = initials || '?';
    if (colorClass) {
        el.className = el.className.replace(/\bav-\w+\b/, '').trim() + ' ' + colorClass;
    }
}

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
function initNavigation() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.nav);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('headerLogoutBtn')?.addEventListener('click', logout);
}

function navigateTo(section) {
    if (!getAllowedSections().includes(section)) {
        section = ROLE_DEFAULTS[currentUser?.role] || 'overview';
    }
    currentSection = section;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.nav === section);
    });

    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.toggle('active', el.id === `section-${section}`);
    });

    // Update page title
    const titles = {
        overview:      'Overview',
        'my-tickets':  'My Tickets',
        'all-tickets': 'All Tickets',
        clients:       'Client Accounts',
        performance:   'Performance',
        team:          'Team',
        reports:       'Reports',
        settings:      'Settings',
        help:          'Help & Documentation',
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Render section content
    const renderers = {
        overview:      renderOverview,
        'my-tickets':  renderMyTickets,
        'all-tickets': renderAllTickets,
        clients:       () => window.loadClients(),
        performance:   renderPerformance,
        team:          renderTeam,
        reports:       renderReports,
        settings:      renderSettings,
        help:          renderHelp,
    };

    if (renderers[section]) renderers[section]();
    window.scrollTo(0, 0);
}

/* ══════════════════════════════════════
   SEARCH
══════════════════════════════════════ */
function initSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = input.value.trim().toLowerCase();
            if (q) { navigateTo('all-tickets'); }
        }
    });
}

/* ══════════════════════════════════════
   OVERVIEW SECTION
══════════════════════════════════════ */
function renderOverview() {
    const el = document.getElementById('section-overview');
    if (el.dataset.rendered) return;
    el.dataset.rendered = '1';

    // Stats
    const myTickets   = FXSP_DATA.tickets.filter(t => t.assignee === 'You');
    const openCount   = myTickets.filter(t => ['open','in-progress'].includes(t.status)).length;
    const pendCount   = myTickets.filter(t => t.status === 'pending').length;
    const escCount    = FXSP_DATA.tickets.filter(t => t.status === 'escalated').length;
    const resolvedToday = 3;

    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Good morning, ${currentUser.name.split(' ')[0]} 👋</h2>
                <p>Here's what's happening on the support floor today.</p>
            </div>
            <div class="section-header-actions">
                <button class="btn btn-secondary btn-sm" onclick="navigateTo('all-tickets')"><i class="fas fa-list"></i> All Tickets</button>
                <button class="btn btn-primary btn-sm" onclick="showNewTicketModal()"><i class="fas fa-plus"></i> New Ticket</button>
            </div>
        </div>

        <div class="stats-grid">
            ${statCard('fa-ticket-alt',  'blue',   openCount,      'My Open Tickets',      '+2 since yesterday', 'up')}
            ${statCard('fa-clock',       'orange', pendCount,      'Awaiting Response',    'Needs your reply',   'neutral')}
            ${statCard('fa-check-circle','green',  resolvedToday,  'Resolved Today',       'vs 4 yesterday',     'neutral')}
            ${statCard('fa-exclamation-triangle', 'red', escCount, 'Escalated',            'Requires attention', 'down')}
        </div>

        <div class="card tickets-table-wrapper mb-6">
            <div class="card-header">
                <div>
                    <div class="card-title">My Active Tickets</div>
                    <div class="card-subtitle">Tickets assigned to you, sorted by priority</div>
                </div>
                <div class="table-filters">
                    <div class="search-input-small">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search tickets…" id="overviewTicketSearch" oninput="filterOverviewTable(this.value)">
                    </div>
                    <select class="filter-select" onchange="filterOverviewStatus(this.value)">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="escalated">Escalated</option>
                    </select>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="data-table" id="overviewTable">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Subject</th>
                            <th>Client</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="overviewTableBody">
                        ${buildTicketRows(myTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').slice(0, 8))}
                    </tbody>
                </table>
            </div>
            <div class="card-footer" style="display:flex;align-items:center;justify-content:space-between">
                <span class="text-sm text-muted">${myTickets.length} total tickets assigned to you</span>
                <button class="btn btn-ghost btn-sm" onclick="navigateTo('my-tickets')">View all <i class="fas fa-arrow-right"></i></button>
            </div>
        </div>

        <div class="content-grid-2">
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-fire" style="color:#ef4444;margin-right:6px"></i>Priority Queue</div>
                        <div class="card-subtitle">Tickets requiring urgent attention</div>
                    </div>
                    <span class="badge badge-escalated">${escCount} escalated</span>
                </div>
                <div class="priority-list">
                    ${FXSP_DATA.tickets.filter(t => ['escalated','in-progress'].includes(t.status)).slice(0,5).map(t => `
                    <div class="priority-item" onclick="navigateTo('all-tickets')">
                        <div class="priority-item-left">
                            <div class="priority-item-title">${t.subject}</div>
                            <div class="priority-item-meta">
                                <span>${t.id}</span>
                                <span>·</span>
                                <span>${t.client}</span>
                                <span>·</span>
                                <span>${t.category}</span>
                            </div>
                        </div>
                        <div class="priority-item-right">
                            <span class="badge badge-${t.status}">${formatStatus(t.status)}</span>
                            <span class="text-xs text-muted">${timeAgo(t.updated)}</span>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-stream" style="color:#6366f1;margin-right:6px"></i>Team Activity</div>
                        <div class="card-subtitle">Recent actions across the team</div>
                    </div>
                </div>
                <div class="activity-feed">
                    ${FXSP_DATA.activity.map(a => `
                    <div class="activity-item">
                        <div class="avatar avatar-sm ${a.color}"><i class="fas ${a.icon}" style="font-size:0.6rem"></i></div>
                        <div class="activity-body">
                            <div class="activity-text">${a.text}</div>
                            <div class="activity-time"><i class="far fa-clock"></i> ${a.time}</div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        </div>
    `;

    setupOverviewFilters();

    // Append charts without touching existing content
    const chartsWrap = document.createElement('div');
    chartsWrap.innerHTML = overviewChartsHTML();
    el.appendChild(chartsWrap);
    setTimeout(initOverviewCharts, 80);
}

/* ══════════════════════════════════════
   OVERVIEW CHARTS
══════════════════════════════════════ */

const ovCharts = {};

function getLast14Days() {
    const labels = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    }
    return labels;
}

function ovChartColors() {
    const dark = document.body.classList.contains('dark-mode');
    return {
        text: dark ? '#536882' : '#94a3b8',
        grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    };
}

function overviewChartsHTML() {
    return `
    <div class="ov-charts-top mt-6">
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Ticket Volume — Last 14 Days</div>
                    <div class="card-subtitle">Tickets opened vs. resolved per day</div>
                </div>
                <div style="display:flex;gap:1rem;align-items:center;flex-shrink:0">
                    <span style="display:flex;align-items:center;gap:5px;font-size:0.75rem;color:var(--text-muted)">
                        <span style="width:12px;height:2.5px;background:#3b82f6;border-radius:2px;display:inline-block"></span>Opened
                    </span>
                    <span style="display:flex;align-items:center;gap:5px;font-size:0.75rem;color:var(--text-muted)">
                        <span style="width:12px;height:2.5px;background:#10b981;border-radius:2px;display:inline-block"></span>Resolved
                    </span>
                </div>
            </div>
            <div class="card-body">
                <div style="position:relative;height:220px"><canvas id="ovLineChart"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Ticket Status Breakdown</div>
                    <div class="card-subtitle">Current distribution across all agents</div>
                </div>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:1rem;justify-content:center">
                <div style="position:relative;height:165px;display:flex;justify-content:center">
                    <canvas id="ovDonutChart"></canvas>
                </div>
                <div id="ovDonutLegend" style="display:flex;flex-direction:column;gap:0.375rem"></div>
            </div>
        </div>
    </div>

    <div class="card mt-5">
        <div class="card-header">
            <div>
                <div class="card-title">Team Performance — This Week</div>
                <div class="card-subtitle">Tickets resolved per agent (Mon – Sun)</div>
            </div>
            <span class="badge badge-resolved" style="flex-shrink:0">Week of Jan 8 – 14</span>
        </div>
        <div class="card-body">
            <div style="position:relative;height:210px"><canvas id="ovBarChart"></canvas></div>
        </div>
    </div>`;
}

function initOverviewCharts() {
    const c = ovChartColors();

    const tooltipDefaults = {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleFont: { size: 12, family: "'Inter',sans-serif" },
        bodyFont:  { size: 12, family: "'Inter',sans-serif" },
        padding: 10, cornerRadius: 8,
    };

    const scaleDefaults = {
        y: {
            beginAtZero: true,
            grid: { color: c.grid },
            ticks: { font: { size: 11, family: "'Inter',sans-serif" }, color: c.text },
        },
        x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: "'Inter',sans-serif" }, color: c.text },
        },
    };

    // ── Line Chart: Ticket Volume ──
    const lineCtx = document.getElementById('ovLineChart')?.getContext('2d');
    if (lineCtx) {
        if (ovCharts.line) ovCharts.line.destroy();
        ovCharts.line = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: getLast14Days(),
                datasets: [
                    {
                        label: 'Opened',
                        data: [8, 12, 6, 9, 15, 11, 7, 10, 13, 8, 11, 9, 14, 7],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.08)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#3b82f6',
                        pointRadius: 3, pointHoverRadius: 5,
                        fill: true, tension: 0.4,
                    },
                    {
                        label: 'Resolved',
                        data: [5, 9, 8, 7, 12, 10, 9, 8, 11, 9, 13, 7, 10, 8],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.07)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#10b981',
                        pointRadius: 3, pointHoverRadius: 5,
                        fill: true, tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { display: false }, tooltip: tooltipDefaults },
                scales: scaleDefaults,
            },
        });
    }

    // ── Doughnut Chart: Status Breakdown ──
    const donutCtx = document.getElementById('ovDonutChart')?.getContext('2d');
    if (donutCtx) {
        if (ovCharts.donut) ovCharts.donut.destroy();
        const donutLabels = ['Open', 'Pending', 'In Progress', 'Escalated', 'Resolved'];
        const donutValues = [18, 12, 9, 4, 47];
        const donutColors = ['#6366f1', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];
        const total = donutValues.reduce((a, b) => a + b, 0);

        ovCharts.donut = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: donutLabels,
                datasets: [{ data: donutValues, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 5 }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipDefaults,
                        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} tickets` },
                    },
                },
            },
        });

        const legendEl = document.getElementById('ovDonutLegend');
        if (legendEl) {
            legendEl.innerHTML = donutLabels.map((label, i) => `
            <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:0.5rem">
                    <span style="width:8px;height:8px;border-radius:2px;background:${donutColors[i]};flex-shrink:0;display:inline-block"></span>
                    <span style="font-size:0.78rem;color:var(--text-secondary)">${label}</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.625rem">
                    <span style="font-size:0.78rem;font-weight:600;color:var(--text-primary)">${donutValues[i]}</span>
                    <span style="font-size:0.68rem;color:var(--text-muted);width:28px;text-align:right">${Math.round(donutValues[i] / total * 100)}%</span>
                </div>
            </div>`).join('');
        }
    }

    // ── Bar Chart: Team Performance ──
    const barCtx = document.getElementById('ovBarChart')?.getContext('2d');
    if (barCtx) {
        if (ovCharts.bar) ovCharts.bar.destroy();
        ovCharts.bar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Sarah Chen', 'Priya Patel', 'Marcus Johnson', 'David Kim', 'Emma Wilson', 'James Carter'],
                datasets: [{
                    label: 'Tickets Resolved',
                    data: [24, 21, 19, 14, 11, 8],
                    backgroundColor: [
                        'rgba(99,102,241,0.75)', 'rgba(249,115,22,0.75)', 'rgba(16,185,129,0.75)',
                        'rgba(59,130,246,0.75)',  'rgba(20,184,166,0.75)', 'rgba(139,92,246,0.75)',
                    ],
                    borderColor: ['#6366f1','#f97316','#10b981','#3b82f6','#14b8a6','#8b5cf6'],
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: tooltipDefaults },
                scales: {
                    ...scaleDefaults,
                    x: { ...scaleDefaults.x, ticks: { ...scaleDefaults.x.ticks, maxRotation: 0 } },
                },
            },
        });
    }

    // Re-colour axis text/grid when dark mode is toggled (no existing code modified)
    if (!ovCharts._dmObserver) {
        ovCharts._dmObserver = new MutationObserver(() => {
            const nc = ovChartColors();
            [ovCharts.line, ovCharts.bar].forEach(ch => {
                if (!ch) return;
                ch.options.scales.x.ticks.color = nc.text;
                ch.options.scales.y.ticks.color = nc.text;
                ch.options.scales.y.grid.color  = nc.grid;
                ch.update('none');
            });
        });
        ovCharts._dmObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
}

function statCard(icon, color, value, label, change, dir) {
    const arrow = dir === 'up' ? 'fa-arrow-up' : dir === 'down' ? 'fa-arrow-down' : 'fa-minus';
    return `
    <div class="stat-card">
        <div class="stat-card-top">
            <div class="stat-icon ${color}"><i class="fas ${icon}"></i></div>
            <span class="stat-change ${dir}"><i class="fas ${arrow}"></i> ${change}</span>
        </div>
        <div>
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>
    </div>`;
}

function setupOverviewFilters() {
    window.filterOverviewTable = function(query) {
        const q = query.toLowerCase();
        document.querySelectorAll('#overviewTableBody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    };
    window.filterOverviewStatus = function(status) {
        document.querySelectorAll('#overviewTableBody tr').forEach(row => {
            row.style.display = (!status || row.dataset.status === status) ? '' : 'none';
        });
    };
}

/* ══════════════════════════════════════
   TICKET TABLE BUILDER
══════════════════════════════════════ */
function buildTicketRows(tickets) {
    if (!tickets.length) return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No tickets found</td></tr>`;
    return tickets.map(t => `
    <tr data-status="${t.status}">
        <td><span class="ticket-id">${t.id}</span></td>
        <td>
            <div class="ticket-subject">
                ${t.subject}
                <small>${t.category}</small>
            </div>
        </td>
        <td>
            <div class="user-cell">
                <div class="avatar avatar-sm" style="background:${stringToColor(t.client)}">${getInitials(t.client)}</div>
                <div class="user-cell-info">
                    <div class="name">${t.client}</div>
                    <div class="sub">${t.clientId}</div>
                </div>
            </div>
        </td>
        <td>${t.category}</td>
        <td><span class="priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status}">${formatStatus(t.status)}</span></td>
        <td><span class="text-xs text-muted">${timeAgo(t.updated)}</span></td>
        <td>
            <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-secondary" title="View ticket"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-primary" title="Reply" onclick="showToast('Opening ticket ${t.id}…', 'info')"><i class="fas fa-reply"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

/* ══════════════════════════════════════
   MY TICKETS
══════════════════════════════════════ */
function renderMyTickets() {
    const el = document.getElementById('section-my-tickets');
    const myTickets = FXSP_DATA.tickets.filter(t => t.assignee === 'You');

    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>My Tickets</h2>
                <p>All tickets currently assigned to you — ${myTickets.length} total</p>
            </div>
            <div class="section-header-actions">
                <button class="btn btn-primary btn-sm" onclick="showNewTicketModal()"><i class="fas fa-plus"></i> New Ticket</button>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="table-filters" style="flex-wrap:wrap;gap:0.5rem">
                    <div class="search-input-small">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search my tickets…" id="myTicketSearch" oninput="filterMyTickets()">
                    </div>
                    <select class="filter-select" id="myTicketStatus" onchange="filterMyTickets()">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select class="filter-select" id="myTicketPriority" onchange="filterMyTickets()">
                        <option value="">All Priority</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select class="filter-select" id="myTicketCategory" onchange="filterMyTickets()">
                        <option value="">All Categories</option>
                        <option value="Platform">Platform</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Deposit">Deposit</option>
                        <option value="Account">Account</option>
                        <option value="KYC/AML">KYC/AML</option>
                        <option value="Trading">Trading</option>
                    </select>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Subject</th>
                            <th>Client</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="myTicketsBody">
                        ${buildMyTicketRows(myTickets)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.filterMyTickets = function() {
        const q  = document.getElementById('myTicketSearch').value.toLowerCase();
        const st = document.getElementById('myTicketStatus').value;
        const pr = document.getElementById('myTicketPriority').value;
        const ca = document.getElementById('myTicketCategory').value;
        document.querySelectorAll('#myTicketsBody tr[data-status]').forEach(row => {
            const text    = row.textContent.toLowerCase();
            const status  = row.dataset.status;
            const priority= row.dataset.priority;
            const category= row.dataset.category;
            const show = (!q || text.includes(q)) && (!st || status === st) && (!pr || priority === pr) && (!ca || category === ca);
            row.style.display = show ? '' : 'none';
        });
    };
}

function buildMyTicketRows(tickets) {
    return tickets.map(t => `
    <tr data-status="${t.status}" data-priority="${t.priority}" data-category="${t.category}">
        <td><span class="ticket-id">${t.id}</span></td>
        <td><div class="ticket-subject">${t.subject}</div></td>
        <td>
            <div class="user-cell">
                <div class="avatar avatar-sm" style="background:${stringToColor(t.client)}">${getInitials(t.client)}</div>
                <div class="user-cell-info">
                    <div class="name">${t.client}</div>
                    <div class="sub">${t.clientId}</div>
                </div>
            </div>
        </td>
        <td>${t.category}</td>
        <td><span class="priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status}">${formatStatus(t.status)}</span></td>
        <td><span class="text-xs text-muted">${formatDate(t.created)}</span></td>
        <td><span class="text-xs text-muted">${timeAgo(t.updated)}</span></td>
        <td>
            <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-secondary" title="View"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-primary" title="Reply" onclick="showToast('Replying to ${t.id}','info')"><i class="fas fa-reply"></i></button>
                ${t.status !== 'resolved' ? `<button class="btn btn-sm btn-success" title="Resolve" onclick="showToast('Ticket ${t.id} marked resolved','success')"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </td>
    </tr>`).join('');
}

/* ══════════════════════════════════════
   ALL TICKETS
══════════════════════════════════════ */
function renderAllTickets() {
    const el = document.getElementById('section-all-tickets');
    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>All Tickets</h2>
                <p>Complete ticket queue across all agents — ${FXSP_DATA.tickets.length} tickets</p>
            </div>
            <div class="section-header-actions">
                <button class="btn btn-secondary btn-sm"><i class="fas fa-download"></i> Export</button>
                <button class="btn btn-primary btn-sm" onclick="showNewTicketModal()"><i class="fas fa-plus"></i> New Ticket</button>
            </div>
        </div>
        <div class="card">
            <div class="card-header" style="flex-wrap:wrap;gap:0.75rem">
                <div class="table-filters" style="flex-wrap:wrap;gap:0.5rem">
                    <div class="search-input-small">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search tickets, clients…" id="allTicketSearch" oninput="filterAllTickets()" style="width:200px">
                    </div>
                    <select class="filter-select" id="allTicketStatus" onchange="filterAllTickets()">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select class="filter-select" id="allTicketAssignee" onchange="filterAllTickets()">
                        <option value="">All Agents</option>
                        <option value="You">Me</option>
                        ${FXSP_DATA.team.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                    </select>
                    <select class="filter-select" id="allTicketPriority" onchange="filterAllTickets()">
                        <option value="">All Priority</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Subject</th>
                            <th>Client</th>
                            <th>Assignee</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="allTicketsBody">
                        ${buildAllTicketRows(FXSP_DATA.tickets)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.filterAllTickets = function() {
        const q  = document.getElementById('allTicketSearch').value.toLowerCase();
        const st = document.getElementById('allTicketStatus').value;
        const ag = document.getElementById('allTicketAssignee').value;
        const pr = document.getElementById('allTicketPriority').value;
        document.querySelectorAll('#allTicketsBody tr[data-id]').forEach(row => {
            const text = row.textContent.toLowerCase();
            const show = (!q || text.includes(q)) && (!st || row.dataset.status === st) && (!ag || row.dataset.assignee === ag) && (!pr || row.dataset.priority === pr);
            row.style.display = show ? '' : 'none';
        });
    };
}

function buildAllTicketRows(tickets) {
    return tickets.map(t => `
    <tr data-id="${t.id}" data-status="${t.status}" data-assignee="${t.assignee}" data-priority="${t.priority}">
        <td><span class="ticket-id">${t.id}</span></td>
        <td><div class="ticket-subject">${t.subject}<small>${t.category}</small></div></td>
        <td>
            <div class="user-cell">
                <div class="avatar avatar-sm" style="background:${stringToColor(t.client)}">${getInitials(t.client)}</div>
                <span style="font-size:0.8125rem;font-weight:500">${t.client}</span>
            </div>
        </td>
        <td>
            <div class="user-cell">
                <div class="avatar avatar-sm av-blue">${getInitials(t.assignee === 'You' ? currentUser.name : t.assignee)}</div>
                <span style="font-size:0.8125rem">${t.assignee === 'You' ? 'Me' : t.assignee}</span>
            </div>
        </td>
        <td><span class="priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status}">${formatStatus(t.status)}</span></td>
        <td><span class="text-xs text-muted">${timeAgo(t.updated)}</span></td>
        <td>
            <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-secondary"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-primary" onclick="showToast('Opening ${t.id}…','info')"><i class="fas fa-reply"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

/* ══════════════════════════════════════
   CLIENTS
══════════════════════════════════════ */
function renderClients() {
    const el = document.getElementById('section-clients');
    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Client Accounts</h2>
                <p>Manage and review client profiles — ${FXSP_DATA.clients.length} active clients</p>
            </div>
            <div class="section-header-actions">
                <div class="search-input-small">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search clients…" oninput="filterClients(this.value)" style="width:180px">
                </div>
                <select class="filter-select" onchange="filterClientStatus(this.value)">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
        </div>
        <div class="card mb-6">
            <div class="table-wrapper">
                <table class="data-table" id="clientsTable">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Account ID</th>
                            <th>Type</th>
                            <th>Balance</th>
                            <th>Platform</th>
                            <th>Leverage</th>
                            <th>KYC</th>
                            <th>Status</th>
                            <th>Open Tickets</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="clientsTableBody">
                        ${buildClientRows(FXSP_DATA.clients)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.filterClients = function(q) {
        const query = q.toLowerCase();
        document.querySelectorAll('#clientsTableBody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    };
    window.filterClientStatus = function(status) {
        document.querySelectorAll('#clientsTableBody tr[data-status]').forEach(row => {
            row.style.display = (!status || row.dataset.status === status) ? '' : 'none';
        });
    };
}

function buildClientRows(clients) {
    const accountTypeColors = { 'VIP': 'av-orange', 'Premium': 'av-purple', 'Standard': 'av-blue', 'Basic': 'av-green' };
    return clients.map(c => `
    <tr data-status="${c.status}">
        <td>
            <div class="user-cell">
                <div class="avatar avatar-sm ${accountTypeColors[c.accountType] || 'av-blue'}">${getInitials(c.name)}</div>
                <div class="user-cell-info">
                    <div class="name">${c.name}</div>
                    <div class="sub">${c.country}</div>
                </div>
            </div>
        </td>
        <td><span class="ticket-id">${c.id}</span></td>
        <td><span class="badge ${c.accountType === 'VIP' ? 'badge-escalated' : c.accountType === 'Premium' ? 'badge-in-progress' : 'badge-open'}">${c.accountType}</span></td>
        <td style="font-weight:600;color:var(--text-primary)">${c.balance}</td>
        <td>${c.platform}</td>
        <td style="font-family:var(--font-mono);font-size:0.78rem">${c.leverage}</td>
        <td><span class="badge ${c.kyc === 'Verified' ? 'badge-resolved' : 'badge-pending'}">${c.kyc}</span></td>
        <td><span class="badge badge-${c.status}">${c.status.charAt(0).toUpperCase()+c.status.slice(1)}</span></td>
        <td style="text-align:center">
            ${c.openTickets > 0 ? `<span class="badge badge-escalated">${c.openTickets}</span>` : '<span style="color:var(--text-muted)">—</span>'}
        </td>
        <td>
            <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-secondary" title="View Profile" onclick="showToast('Loading ${c.name} profile…','info')"><i class="fas fa-user"></i></button>
                <button class="btn btn-sm btn-primary" title="Create Ticket" onclick="showNewTicketModal()"><i class="fas fa-ticket-alt"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

/* ══════════════════════════════════════
   PERFORMANCE
══════════════════════════════════════ */
function renderPerformance() {
    const el = document.getElementById('section-performance');
    const p  = FXSP_DATA.myPerformance;
    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>My Performance</h2>
                <p>Your support metrics for the past 7 days</p>
            </div>
            <div class="section-header-actions">
                <select class="filter-select">
                    <option>This Week</option>
                    <option>Last Week</option>
                    <option>This Month</option>
                    <option>Last Month</option>
                </select>
            </div>
        </div>

        <div class="perf-stats">
            ${perfStatCard(p.ticketsResolved,    'Tickets Resolved', 82, 'blue')}
            ${perfStatCard(p.avgResponseTime,    'Avg Response Time','', 'green', true)}
            ${perfStatCard(p.satisfaction + '%', 'Client Satisfaction', p.satisfaction, 'purple')}
            ${perfStatCard(p.escalationRate + '%','Escalation Rate', 100 - (p.escalationRate * 10), 'orange', false, true)}
        </div>

        <div class="content-grid-2 mt-5">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Tickets Resolved — Daily Trend</div>
                    <span class="badge badge-resolved">7-day total: ${p.weeklyResolved.reduce((a,b)=>a+b,0)}</span>
                </div>
                <div class="card-body">
                    <div class="chart-wrapper"><canvas id="resolvedChart"></canvas></div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Avg Response Time (minutes)</div>
                    <span class="badge badge-pending">Target: ≤ 10 min</span>
                </div>
                <div class="card-body">
                    <div class="chart-wrapper"><canvas id="responseChart"></canvas></div>
                </div>
            </div>
        </div>

        <div class="content-grid-2 mt-5">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Ticket Category Breakdown</div>
                </div>
                <div class="card-body" style="display:flex;align-items:center;gap:2rem">
                    <div style="width:200px;height:200px;flex-shrink:0"><canvas id="categoryChart"></canvas></div>
                    <div style="flex:1">
                        ${p.categoryBreakdown.labels.map((label, i) => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-light)">
                            <div style="display:flex;align-items:center;gap:0.5rem">
                                <span style="width:10px;height:10px;border-radius:2px;background:${categoryColors[i]};flex-shrink:0;display:inline-block"></span>
                                <span style="font-size:0.8rem;color:var(--text-secondary)">${label}</span>
                            </div>
                            <span style="font-size:0.8rem;font-weight:600">${p.categoryBreakdown.values[i]}%</span>
                        </div>`).join('')}
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-trophy" style="color:#f59e0b;margin-right:6px"></i>Team Leaderboard</div>
                    <span class="badge badge-pending">This Week</span>
                </div>
                <div class="leaderboard">
                    ${buildLeaderboard()}
                </div>
            </div>
        </div>
    `;

    // Init charts after DOM render
    setTimeout(initPerfCharts, 50);
}

const categoryColors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#64748b'];

function perfStatCard(value, label, pct, color, noBar = false, inverted = false) {
    const barClass = color === 'blue' ? '' : color === 'green' ? 'progress-bar-success' : color === 'orange' ? 'progress-bar-warning' : '';
    return `
    <div class="perf-stat">
        <div class="perf-stat-value">${value}</div>
        <div class="perf-stat-label">${label}</div>
        ${!noBar && pct !== '' ? `<div class="progress-bar perf-stat-bar ${barClass}"><div class="progress-bar-fill" style="width:${pct}%"></div></div>` : ''}
    </div>`;
}

function buildLeaderboard() {
    const sorted = [...FXSP_DATA.team].sort((a, b) => b.ticketsResolved - a.ticketsResolved);
    return sorted.map((m, i) => `
    <div class="leaderboard-item">
        <div class="leaderboard-rank rank-${i+1}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)}</div>
        <div class="avatar avatar-sm ${m.color}">${m.avatar}</div>
        <div class="leaderboard-info">
            <div class="leaderboard-name">${m.name}${m.name === currentUser.name || (m.id === 'AGT-01' && false) ? ' <span style="font-size:0.68rem;color:var(--accent)">(you)</span>' : ''}</div>
            <div class="leaderboard-stat">${m.ticketsResolved} resolved · ${m.satisfaction}% CSAT · ${m.avgResponseTime} avg</div>
        </div>
        <div class="leaderboard-score">${m.ticketsResolved}</div>
    </div>`).join('');
}

function initPerfCharts() {
    const p = FXSP_DATA.myPerformance;

    if (charts.resolved) charts.resolved.destroy();
    if (charts.response) charts.response.destroy();
    if (charts.category) charts.category.destroy();

    const resolvedCtx = document.getElementById('resolvedChart')?.getContext('2d');
    if (resolvedCtx) {
        charts.resolved = new Chart(resolvedCtx, {
            type: 'bar',
            data: {
                labels: FXSP_DATA.weekLabels,
                datasets: [{
                    label: 'Tickets Resolved',
                    data: p.weeklyResolved,
                    backgroundColor: 'rgba(59,130,246,0.15)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: chartOptions('Tickets Resolved')
        });
    }

    const responseCtx = document.getElementById('responseChart')?.getContext('2d');
    if (responseCtx) {
        charts.response = new Chart(responseCtx, {
            type: 'line',
            data: {
                labels: FXSP_DATA.weekLabels,
                datasets: [{
                    label: 'Response Time (min)',
                    data: p.weeklyResponse,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4,
                }, {
                    label: 'Target (10 min)',
                    data: Array(7).fill(10),
                    borderColor: '#f59e0b',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                }]
            },
            options: chartOptions('Minutes')
        });
    }

    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: p.categoryBreakdown.labels,
                datasets: [{
                    data: p.categoryBreakdown.values,
                    backgroundColor: categoryColors,
                    borderWidth: 0,
                    hoverOffset: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${ctx.raw}%`
                        }
                    }
                },
                cutout: '70%',
            }
        });
    }
}

function chartOptions(yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { font: { size: 11, family: "'Inter',sans-serif" }, usePointStyle: true, pointStyleWidth: 8, boxHeight: 6 }
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.92)',
                titleFont: { size: 12, family: "'Inter',sans-serif" },
                bodyFont: { size: 12, family: "'Inter',sans-serif" },
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: false },
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { size: 11, family: "'Inter',sans-serif" }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, family: "'Inter',sans-serif" }, color: '#94a3b8' }
            }
        }
    };
}

/* ══════════════════════════════════════
   TEAM
══════════════════════════════════════ */
async function renderTeam() {
    const el = document.getElementById('section-team');

    const roleLabel = {
        account_manager: 'Account Manager',
        support:         'Chat Support',
        sales:           'Sales / IB',
        finance:         'Finance / Back Office',
    };
    const roleSpec = {
        account_manager: 'Client Account Management',
        support:         'Chat & Email Support',
        sales:           'Sales & IB Relationships',
        finance:         'Back Office & Transactions',
    };
    const avatarColors = ['av-blue', 'av-purple', 'av-green', 'av-orange', 'av-teal', 'av-indigo'];

    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Support Team</h2>
                <p id="teamSubtitle">Loading…</p>
            </div>
        </div>
        <div class="team-grid" id="teamGrid">
            <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
                <i class="fas fa-circle-notch spin"></i> Loading team…
            </div>
        </div>
    `;

    try {
        const res   = await fetch(`${CONFIG.API_BASE}/users`);
        const json  = await res.json();
        const users = json.users || [];

        document.getElementById('teamSubtitle').textContent =
            `${users.length} agent${users.length !== 1 ? 's' : ''} registered`;

        document.getElementById('teamGrid').innerHTML = users.length === 0
            ? `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No team members found.</div>`
            : users.map((m, i) => {
                const initials = m.name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
                const color    = avatarColors[i % avatarColors.length];
                const label    = roleLabel[m.role] || m.role;
                const spec     = roleSpec[m.role]  || m.role;
                const nameSafe = m.name.replace(/'/g, "\\'");
                return `
                <div class="team-card">
                    <div class="team-card-header">
                        <div class="avatar avatar-lg ${color}">${initials}</div>
                        <div class="team-card-info">
                            <div class="team-card-name">${m.name}</div>
                            <div class="team-card-role">${label}</div>
                            <span class="badge badge-active" style="margin-top:4px">Active</span>
                        </div>
                        <button class="btn btn-sm btn-secondary btn-icon" title="Message" onclick="showToast('Chat with ${nameSafe} coming soon!','info')">
                            <i class="fas fa-comment"></i>
                        </button>
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-muted);background:var(--bg-alt);padding:0.5rem 0.75rem;border-radius:6px">
                        <i class="fas fa-star" style="color:#f59e0b;margin-right:4px"></i>${spec}
                    </div>
                    <div class="team-card-stats">
                        <div class="team-stat">
                            <div class="team-stat-value">—</div>
                            <div class="team-stat-label">Open</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">—</div>
                            <div class="team-stat-label">Resolved</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">—</div>
                            <div class="team-stat-label">CSAT</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;color:var(--text-muted)">
                        <span><i class="fas fa-envelope" style="margin-right:4px"></i>${m.email}</span>
                        <button class="btn btn-sm btn-primary" onclick="showToast('Viewing ${nameSafe} tickets…','info')">View Tickets</button>
                    </div>
                </div>`;
            }).join('');
    } catch {
        document.getElementById('teamGrid').innerHTML =
            `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--danger)">
                <i class="fas fa-exclamation-circle"></i> Could not load team — is the backend running?
            </div>`;
    }
}

/* ══════════════════════════════════════
   REPORTS
══════════════════════════════════════ */
function renderReports() {
    const el = document.getElementById('section-reports');
    const reportTypes = [
        { icon: 'fa-chart-line', color: '#dbeafe', iconColor: '#1d4ed8', name: 'Performance Report', desc: 'Agent KPIs, resolution rates, and CSAT scores by date range.' },
        { icon: 'fa-ticket-alt', color: '#d1fae5', iconColor: '#065f46', name: 'Ticket Summary',     desc: 'Volume, status breakdown, category distribution, SLA adherence.' },
        { icon: 'fa-users',      color: '#ede9fe', iconColor: '#5b21b6', name: 'Client Activity',    desc: 'Client engagement, new registrations, account changes, KYC status.' },
        { icon: 'fa-dollar-sign',color: '#fef3c7', iconColor: '#92400e', name: 'Financial Summary',  desc: 'Deposits, withdrawals, pending transactions, and flagged operations.' },
        { icon: 'fa-shield-alt', color: '#fee2e2', iconColor: '#b91c1c', name: 'Compliance Report',  desc: 'KYC/AML status, escalations, policy breaches, and audit trail.' },
        { icon: 'fa-headset',    color: '#ccfbf1', iconColor: '#0f766e', name: 'SLA Report',         desc: 'First-response time, resolution time, and SLA breach analysis.' },
    ];

    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Reports</h2>
                <p>Generate and export support analytics and compliance reports</p>
            </div>
        </div>

        <div class="reports-grid mb-6">
            ${reportTypes.map((r, i) => `
            <div class="report-type-card ${i === 0 ? 'selected' : ''}" onclick="selectReport(this)">
                <div class="report-icon" style="background:${r.color}">
                    <i class="fas ${r.icon}" style="color:${r.iconColor}"></i>
                </div>
                <div class="report-type-name">${r.name}</div>
                <div class="report-type-desc">${r.desc}</div>
            </div>`).join('')}
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">Report Configuration</div>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.25rem">
                    <div class="form-group">
                        <label class="form-label">Date From</label>
                        <input type="date" class="form-input" value="2024-01-01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date To</label>
                        <input type="date" class="form-input" value="2024-01-10">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Format</label>
                        <select class="form-select">
                            <option>PDF Report</option>
                            <option>Excel (.xlsx)</option>
                            <option>CSV</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem">
                    <div class="form-group">
                        <label class="form-label">Agent Filter</label>
                        <select class="form-select">
                            <option>All Agents</option>
                            <option>Me Only</option>
                            ${FXSP_DATA.team.map(m => `<option>${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Include Charts</label>
                        <select class="form-select">
                            <option>Yes — with visualizations</option>
                            <option>No — data only</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex;gap:0.75rem">
                    <button class="btn btn-primary" onclick="showToast('Generating report…','info');setTimeout(()=>showToast('Report ready! Download starting.','success'),1800)">
                        <i class="fas fa-file-download"></i> Generate Report
                    </button>
                    <button class="btn btn-secondary" onclick="showToast('Report scheduled for delivery','info')">
                        <i class="fas fa-calendar-alt"></i> Schedule
                    </button>
                </div>
            </div>
        </div>
    `;

    window.selectReport = function(card) {
        document.querySelectorAll('.report-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    };
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function renderSettings() {
    const el = document.getElementById('section-settings');
    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Settings</h2>
                <p>Manage your profile, notifications, and security preferences</p>
            </div>
        </div>
        <div class="settings-layout">
            <div>
                <div class="card">
                    <div class="card-body" style="padding:0.625rem">
                        ${['profile','notifications','security','appearance'].map((tab, i) => {
                            const icons  = ['fa-user','fa-bell','fa-shield-alt','fa-palette'];
                            const labels = ['Profile','Notifications','Security','Appearance'];
                            return `<button class="settings-nav-item ${i===0?'active':''}" data-settings-tab="${tab}" onclick="switchSettingsTab('${tab}')">
                                        <i class="fas ${icons[i]}"></i> ${labels[i]}
                                    </button>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="card">
                <!-- Profile Tab -->
                <div class="settings-content active" id="settings-profile">
                    <div class="settings-section">
                        <div class="settings-profile-top">
                            <div class="profile-avatar-section">
                                <div class="avatar avatar-xl ${currentUser.color || 'av-blue'}">${currentUser.initials}</div>
                                <div class="profile-change-avatar"><i class="fas fa-camera"></i></div>
                            </div>
                            <div>
                                <h4>${currentUser.name}</h4>
                                <p style="font-size:0.875rem;color:var(--text-muted)">${currentUser.role} · ${currentUser.email}</p>
                                <button class="btn btn-sm btn-secondary" style="margin-top:0.5rem" onclick="showToast('Upload photo feature coming soon!','info')">Change Photo</button>
                            </div>
                        </div>
                        <div class="settings-section-title">Personal Information</div>
                        <div class="settings-form-grid">
                            <div class="form-group">
                                <label class="form-label">First Name</label>
                                <input type="text" class="form-input" value="${currentUser.name.split(' ')[0]}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Last Name</label>
                                <input type="text" class="form-input" value="${currentUser.name.split(' ').slice(1).join(' ')}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-input" value="${currentUser.email}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" class="form-input" placeholder="+1 (555) 000-0000">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Department</label>
                                <select class="form-select"><option selected>Client Support</option><option>Technical Support</option><option>Compliance</option><option>VIP Services</option></select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Timezone</label>
                                <select class="form-select"><option>UTC+0 — London</option><option>UTC+1 — Central Europe</option><option>UTC+3 — Dubai</option><option>UTC+8 — Singapore</option><option selected>UTC-5 — New York</option></select>
                            </div>
                            <div class="form-group full-width">
                                <label class="form-label">Bio / Specialization Notes</label>
                                <textarea class="form-textarea" placeholder="e.g. Specializing in KYC/AML, deposits, and VIP client support…"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer" style="display:flex;gap:0.625rem">
                        <button class="btn btn-primary" onclick="showToast('Profile saved successfully!','success')"><i class="fas fa-save"></i> Save Changes</button>
                        <button class="btn btn-secondary">Cancel</button>
                    </div>
                </div>

                <!-- Notifications Tab -->
                <div class="settings-content" id="settings-notifications">
                    <div class="settings-section">
                        <div class="settings-section-title">Email Notifications</div>
                        ${[['New Ticket Assigned','Receive email when a ticket is assigned to you',true],['Ticket Replied','Client or colleague replies to your ticket',true],['Ticket Escalated','A ticket in your queue is escalated to Tier 2',true],['SLA Warning','Alert when a ticket is approaching SLA breach',false],['Daily Summary','Daily digest of your ticket queue performance',true]].map(([name,desc,checked]) => `
                        <div class="notif-row">
                            <div><div class="notif-row-label">${name}</div><div class="notif-row-desc">${desc}</div></div>
                            <label class="toggle-switch"><input type="checkbox" ${checked?'checked':''}><span class="toggle-slider"></span></label>
                        </div>`).join('')}
                        <div class="settings-section-title" style="margin-top:1.5rem">In-App Notifications</div>
                        ${[['Desktop Push Notifications','Browser notifications for urgent tickets',true],['Sound Alerts','Audio alert for new ticket assignments',false],['Escalation Alerts','Pop-up for tickets escalated to critical',true]].map(([name,desc,checked]) => `
                        <div class="notif-row">
                            <div><div class="notif-row-label">${name}</div><div class="notif-row-desc">${desc}</div></div>
                            <label class="toggle-switch"><input type="checkbox" ${checked?'checked':''}><span class="toggle-slider"></span></label>
                        </div>`).join('')}
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary" onclick="showToast('Notification preferences saved!','success')"><i class="fas fa-save"></i> Save Preferences</button>
                    </div>
                </div>

                <!-- Security Tab -->
                <div class="settings-content" id="settings-security">
                    <div class="settings-section">
                        <div class="settings-section-title">Change Password</div>
                        <div style="max-width:400px;display:flex;flex-direction:column;gap:0.875rem">
                            <div class="form-group">
                                <label class="form-label">Current Password</label>
                                <input type="password" class="form-input" placeholder="Enter current password">
                            </div>
                            <div class="form-group">
                                <label class="form-label">New Password</label>
                                <input type="password" class="form-input" placeholder="Minimum 8 characters">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirm New Password</label>
                                <input type="password" class="form-input" placeholder="Repeat new password">
                            </div>
                            <button class="btn btn-primary" style="align-self:flex-start" onclick="showToast('Password updated successfully!','success')"><i class="fas fa-key"></i> Update Password</button>
                        </div>
                        <div class="settings-section-title" style="margin-top:1.5rem">Two-Factor Authentication</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;background:var(--bg-alt);border-radius:var(--radius);border:1px solid var(--border)">
                            <div>
                                <div style="font-weight:600;margin-bottom:3px">Authenticator App (TOTP)</div>
                                <div style="font-size:0.8rem;color:var(--text-muted)">Use Google Authenticator or Authy for enhanced login security.</div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="showToast('2FA setup coming soon!','info')">Enable 2FA</button>
                        </div>
                        <div class="settings-section-title" style="margin-top:1.5rem">Active Sessions</div>
                        <div style="display:flex;flex-direction:column;gap:0.75rem">
                            ${[['Current Session','Chrome on macOS','192.168.1.1','Active now',true],['Previous Session','Firefox on Windows','89.45.102.23','2 hours ago',false]].map(([label,browser,ip,time,current])=>`
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem;background:var(--bg-alt);border-radius:var(--radius);border:1px solid ${current?'var(--accent)':'var(--border)'}">
                                <div style="display:flex;align-items:center;gap:0.75rem">
                                    <i class="fas fa-desktop" style="color:var(--text-muted);font-size:1.25rem"></i>
                                    <div>
                                        <div style="font-weight:600;font-size:0.875rem">${browser} ${current?'<span style="color:var(--success);font-size:0.7rem">● Current</span>':''}</div>
                                        <div style="font-size:0.78rem;color:var(--text-muted)">${ip} · ${time}</div>
                                    </div>
                                </div>
                                ${!current?`<button class="btn btn-sm btn-danger" onclick="showToast('Session terminated','success')">Revoke</button>`:'<span style="font-size:0.78rem;color:var(--success)">✓ This device</span>'}
                            </div>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Appearance Tab -->
                <div class="settings-content" id="settings-appearance">
                    <div class="settings-section">
                        <div class="settings-section-title">Theme</div>

                        <!-- Quick toggle row -->
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:1.25rem">
                            <div style="display:flex;align-items:center;gap:0.875rem">
                                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#6366f1);display:flex;align-items:center;justify-content:center">
                                    <i class="fas fa-adjust" style="color:#fff;font-size:1rem"></i>
                                </div>
                                <div>
                                    <div style="font-weight:600;font-size:0.9rem">Dark Mode</div>
                                    <div style="font-size:0.78rem;color:var(--text-muted)">Toggle between light and dark interface</div>
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="settingsDarkToggle"
                                    ${document.body.classList.contains('dark-mode') ? 'checked' : ''}
                                    onchange="applyDarkMode(this.checked, true)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <!-- Theme cards -->
                        <div style="display:flex;gap:0.875rem;margin-bottom:1.5rem">
                            <div id="dmCardLight" onclick="_stopAutoTheme();applyDarkMode(false,true);localStorage.setItem('fxsp_dark_mode','false')"
                                style="flex:1;padding:1rem;border:1.5px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;text-align:center;transition:all 0.2s ease">
                                <div style="width:44px;height:44px;background:#f8fafc;border-radius:10px;margin:0 auto 0.625rem;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
                                    <i class="fas fa-sun" style="color:#f59e0b;font-size:1.125rem"></i>
                                </div>
                                <div class="dm-card-label" style="font-size:0.8125rem">Light</div>
                            </div>
                            <div id="dmCardDark" onclick="_stopAutoTheme();applyDarkMode(true,true);localStorage.setItem('fxsp_dark_mode','true')"
                                style="flex:1;padding:1rem;border:1.5px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;text-align:center;transition:all 0.2s ease">
                                <div style="width:44px;height:44px;background:#0f172a;border-radius:10px;margin:0 auto 0.625rem;border:1px solid #1e293b;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2)">
                                    <i class="fas fa-moon" style="color:#60a5fa;font-size:1.125rem"></i>
                                </div>
                                <div class="dm-card-label" style="font-size:0.8125rem">Dark</div>
                            </div>
                            <div id="dmCardSystem" onclick="_stopAutoTheme();applyDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches,true);localStorage.setItem('fxsp_dark_mode',window.matchMedia('(prefers-color-scheme: dark)').matches)"
                                style="flex:1;padding:1rem;border:1.5px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;text-align:center;transition:all 0.2s ease">
                                <div style="width:44px;height:44px;background:linear-gradient(135deg,#f8fafc 50%,#0f172a 50%);border-radius:10px;margin:0 auto 0.625rem;border:1px solid var(--border);display:flex;align-items:center;justify-content:center">
                                    <i class="fas fa-circle-half-stroke" style="color:#64748b;font-size:1.125rem"></i>
                                </div>
                                <div class="dm-card-label" style="font-size:0.8125rem">System</div>
                            </div>
                            <div id="dmCardAuto" onclick="activateAutoTheme()"
                                style="flex:1;padding:1rem;border:1.5px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;text-align:center;transition:all 0.2s ease">
                                <div style="width:44px;height:44px;background:linear-gradient(135deg,#fef3c7 50%,#1e3a5f 50%);border-radius:10px;margin:0 auto 0.625rem;border:1px solid var(--border);display:flex;align-items:center;justify-content:center">
                                    <i class="fas fa-clock" style="color:#6366f1;font-size:1.125rem"></i>
                                </div>
                                <div class="dm-card-label" style="font-size:0.8125rem">Auto</div>
                            </div>
                        </div>

                        <div class="settings-section-title">Language &amp; Region</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:500px">
                            <div class="form-group">
                                <label class="form-label">Language</label>
                                <select class="form-select"><option>English (US)</option><option>English (UK)</option><option>French</option><option>Spanish</option><option>German</option></select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date Format</label>
                                <select class="form-select"><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer" style="display:flex;align-items:center;justify-content:space-between">
                        <span style="font-size:0.8rem;color:var(--text-muted)"><i class="fas fa-info-circle" style="margin-right:4px"></i>Theme preference is saved automatically.</span>
                        <button class="btn btn-primary" onclick="showToast('Appearance settings saved!','success')"><i class="fas fa-save"></i> Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.switchSettingsTab = function(tab) {
        document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.toggle('active', b.dataset.settingsTab === tab));
        document.querySelectorAll('.settings-content').forEach(c => c.classList.toggle('active', c.id === `settings-${tab}`));
        if (tab === 'appearance') syncSettingsThemeCards(document.body.classList.contains('dark-mode'));
    };
}

/* ══════════════════════════════════════
   NEW TICKET MODAL (simple)
══════════════════════════════════════ */
function showNewTicketModal() {
    const existing = document.getElementById('newTicketModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'newTicketModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:560px;box-shadow:0 25px 50px rgba(0,0,0,0.25);animation:toastIn 0.25s ease">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)">
                <h3 style="font-size:1.0625rem;font-weight:700">Create New Ticket</h3>
                <button onclick="document.getElementById('newTicketModal').remove()" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:var(--text-muted);line-height:1">×</button>
            </div>
            <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
                <div class="form-group">
                    <label class="form-label">Client</label>
                    <select class="form-select">
                        <option value="">Select a client…</option>
                        ${FXSP_DATA.clients.map(c => `<option>${c.name} (${c.id})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Subject</label>
                    <input type="text" class="form-input" placeholder="Brief description of the issue">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-select">
                            <option>Platform</option><option>Withdrawal</option><option>Deposit</option><option>Account</option><option>KYC/AML</option><option>Trading</option><option>Promotions</option><option>Documents</option><option>Security</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select class="form-select"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" placeholder="Detailed description of the client's issue…" style="min-height:100px"></textarea>
                </div>
            </div>
            <div style="display:flex;gap:0.625rem;padding:1rem 1.5rem;border-top:1px solid var(--border);background:var(--bg-alt);border-radius:0 0 16px 16px">
                <button class="btn btn-primary" onclick="document.getElementById('newTicketModal').remove();showToast('Ticket TKT-4822 created successfully!','success')">
                    <i class="fas fa-plus"></i> Create Ticket
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('newTicketModal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

/* ══════════════════════════════════════
   HELP & DOCUMENTATION
══════════════════════════════════════ */
function renderHelp() {
    const el = document.getElementById('section-help');

    el.innerHTML = `
        <div class="section-header">
            <div class="section-header-left">
                <h2>Help &amp; Documentation</h2>
                <p>Knowledge base, agent guides, SOPs, response templates, and training resources</p>
            </div>
            <div class="section-header-actions">
                <span class="badge badge-resolved"><i class="fas fa-circle" style="font-size:0.5rem"></i> 42 articles</span>
                <span class="badge badge-open">8 templates</span>
                <span class="badge badge-pending">7 guides</span>
            </div>
        </div>

        <!-- Search -->
        <div class="help-search-wrap">
            <div class="help-search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="helpSearchInput" placeholder="Search guides, FAQs, templates, SOPs…" oninput="helpSearch(this.value)">
                <button class="help-search-clear hidden" id="helpSearchClear" onclick="clearHelpSearch()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="help-search-hint">Try: "withdrawal", "KYC", "MT4 error", "angry client"</div>
        </div>

        <!-- Tabs -->
        <div class="help-tabs" id="helpTabs">
            ${[
                ['kb',           'fa-book-open',       'Knowledge Base'],
                ['guides',       'fa-list-ol',         'Agent Guides'],
                ['sops',         'fa-clipboard-list',  'SOPs'],
                ['templates',    'fa-comment-dots',    'Templates'],
                ['troubleshoot', 'fa-wrench',          'Troubleshooting'],
                ['training',     'fa-graduation-cap',  'Training'],
            ].map(([id, icon, label], i) => `
            <button class="help-tab-btn ${i===0?'active':''}" data-help-tab="${id}" onclick="switchHelpTab('${id}')">
                <i class="fas ${icon}"></i> ${label}
            </button>`).join('')}
        </div>

        <!-- ── KNOWLEDGE BASE ── -->
        <div class="help-panel active" id="help-panel-kb">
            <div class="kb-category-bar">
                ${['All','Deposits','Withdrawals','Verification','Platform','Security','Trading','Account'].map((c,i) =>
                    `<button class="kb-pill ${i===0?'active':''}" onclick="filterKB(this,'${c}')">${c}</button>`
                ).join('')}
            </div>
            <div id="kb-accordion">
                ${kbData().map(item => accordionItem(item.q, item.a, item.cat, item.tags)).join('')}
            </div>
        </div>

        <!-- ── AGENT GUIDES ── -->
        <div class="help-panel" id="help-panel-guides">
            <div class="guides-grid" id="guides-list">
                ${agentGuides().map(g => guideCard(g)).join('')}
            </div>
        </div>

        <!-- ── SOPs ── -->
        <div class="help-panel" id="help-panel-sops">
            <div id="sops-accordion">
                ${sopData().map(s => sopCard(s)).join('')}
            </div>
        </div>

        <!-- ── RESPONSE TEMPLATES ── -->
        <div class="help-panel" id="help-panel-templates">
            <div class="template-filter-bar">
                ${['All','Withdrawals','Deposits','KYC','Platform','General'].map((c,i) =>
                    `<button class="kb-pill ${i===0?'active':''}" onclick="filterTemplates(this,'${c}')">${c}</button>`
                ).join('')}
            </div>
            <div class="templates-grid" id="templates-list">
                ${responseTemplates().map(t => templateCard(t)).join('')}
            </div>
        </div>

        <!-- ── TROUBLESHOOTING ── -->
        <div class="help-panel" id="help-panel-troubleshoot">
            <div id="trouble-accordion">
                ${troubleshootData().map(t => troubleCard(t)).join('')}
            </div>
        </div>

        <!-- ── TRAINING ── -->
        <div class="help-panel" id="help-panel-training">
            <div class="training-grid" id="training-list">
                ${trainingData().map(r => trainingCard(r)).join('')}
            </div>
        </div>
    `;

    // Wire accordion toggles
    el.querySelectorAll('.accordion-header').forEach(hdr => {
        hdr.addEventListener('click', () => {
            const item = hdr.closest('.accordion-item, .trouble-item');
            const body = item.querySelector('.accordion-body');
            const icon = hdr.querySelector('.accordion-chevron');
            const isOpen = item.classList.contains('open');
            item.classList.toggle('open', !isOpen);
            body.style.maxHeight = isOpen ? '0' : body.scrollHeight + 'px';
            if (icon) icon.style.transform = isOpen ? '' : 'rotate(180deg)';
        });
    });
}

/* ── Data: Knowledge Base ── */
function kbData() {
    return [
        // Deposits
        { cat:'Deposits', tags:'deposit,bank,transfer,pending', q:'Client says bank transfer deposit not received after 24 hours — what to check first?', a:`<ol><li>Ask the client to provide proof of transfer (bank receipt or screenshot showing the transaction reference).</li><li>Cross-check the transaction amount and reference in the back office. Search by client ID, amount, and transfer date.</li><li>Verify the destination IBAN/SWIFT the client used. Confirm it matches the current active brokerage account details.</li><li>Check if the deposit is sitting in the <strong>Pending Deposits</strong> queue awaiting manual approval.</li><li>If not found: contact the payments team with the bank receipt. Processing time is typically 1–3 business days for international wires.</li><li>Inform the client of the expected timeline and create a follow-up task in 24 hours.</li></ol><div class="help-note"><i class="fas fa-info-circle"></i> Always request the MT Reference number from international transfers — this is required for bank traces.</div>` },
        { cat:'Deposits', tags:'deposit,card,credit,debit,declined,rejected', q:'Credit/debit card deposit declined — how to assist the client?', a:`<ol><li>Confirm the error message the client received (e.g. "Insufficient funds", "Card not supported", "3D Secure failed").</li><li>Check if the card type (Visa/Mastercard) is supported in the client's region — some jurisdictions restrict forex payments.</li><li>Ask the client to contact their bank to whitelist international/online payments to our merchant ID.</li><li>If 3D Secure failed: advise the client to ensure their phone number is up to date with their bank for OTP codes.</li><li>As an alternative, offer e-wallet options (Skrill, Neteller) or bank transfer.</li></ol><div class="help-note"><i class="fas fa-lightbulb"></i> Tip: Clients using prepaid cards will always be declined. Our policy requires cards registered in the client's own name.</div>` },
        { cat:'Deposits', tags:'deposit,crypto,bitcoin,blockchain,not credited', q:'Crypto deposit not credited — agent checklist', a:`<ol><li>Ask the client for the transaction hash (TxID) — this is mandatory for any crypto trace.</li><li>Verify the wallet address the client sent to matches the address shown in their portal at the time of deposit.</li><li>Check the blockchain confirmations on a block explorer (e.g. Etherscan for ETH, Blockchain.com for BTC). We require <strong>3 confirmations for BTC, 12 for ETH, 30 for USDT-TRC20</strong>.</li><li>If confirmations are complete but funds not credited, escalate to the crypto payments team with the TxID and screenshot.</li><li>If the client sent to the wrong address: inform them this is irreversible — document the conversation and escalate to compliance if the amount exceeds $1,000.</li></ol>` },
        { cat:'Deposits', tags:'deposit,third party,policy,name', q:'Client wants to deposit from a third-party account — what is our policy?', a:`<p>Our policy strictly prohibits third-party deposits. The depositing account <strong>must match the name on the trading account</strong>. This is required for AML compliance.</p><ul><li>If the client has already sent funds from a third-party: immediately flag to the compliance team and place the funds on hold.</li><li>Do not credit the account until compliance approves or the funds are returned to sender.</li><li>Document the interaction and add a compliance note to the client's profile.</li></ul><div class="help-note warn"><i class="fas fa-exclamation-triangle"></i> Failure to report third-party deposits is a serious compliance breach. Always escalate immediately.</div>` },
        // Withdrawals
        { cat:'Withdrawals', tags:'withdrawal,pending,delayed,not received', q:'Withdrawal pending for more than 3 business days — escalation steps', a:`<ol><li>Verify the withdrawal was submitted correctly: check for the <strong>Approved</strong> status in the back office (not just "Requested").</li><li>Check if the client has a verified bank account on file and that all KYC documents are approved.</li><li>Confirm there are no pending compliance reviews or AML flags on the account.</li><li>If all clear, escalate to the payments team via the internal Payments Escalation ticket with: client ID, withdrawal ID, amount, destination bank, date requested.</li><li>Inform the client of the escalation and provide an expected resolution time (typically 24–48 hours after escalation).</li><li>International wires may take 3–5 business days from the processing date.</li></ol>` },
        { cat:'Withdrawals', tags:'withdrawal,rejected,failed,reason', q:'Withdrawal rejected — common reasons and how to resolve', a:`<ul><li><strong>Unverified account:</strong> KYC not complete. Prompt client to submit outstanding documents.</li><li><strong>Insufficient balance:</strong> The withdrawal amount exceeds available (non-margin) balance. Explain the distinction between equity and free margin.</li><li><strong>Bank account mismatch:</strong> Client's bank details don't match KYC records. Ask client to update and re-verify bank info.</li><li><strong>Bonus conditions not met:</strong> Client has an active bonus with trading volume requirements. Check bonus terms and explain to client.</li><li><strong>Compliance hold:</strong> Account flagged for review. Do not disclose specific details — direct client to compliance via email.</li></ul>` },
        { cat:'Withdrawals', tags:'withdrawal,wrong account,bank,error', q:'Client sent withdrawal to wrong bank account — what to do?', a:`<ol><li>Check whether the payment has already been processed. If still in "Pending" state, you can cancel it — act immediately.</li><li>If processed: contact the payments team urgently with the incorrect bank details and request a recall.</li><li>Inform the client that bank recalls can take 5–10 business days and are not guaranteed.</li><li>Ask the client to also contact their bank directly to reject the incoming transfer if possible.</li><li>Document everything and escalate to supervisor if the amount exceeds $5,000.</li></ol>` },
        // Verification
        { cat:'Verification', tags:'kyc,verification,documents,id,passport', q:'What documents are required for full KYC verification?', a:`<p><strong>Tier 1 — Identity Verification (all clients):</strong></p><ul><li>Government-issued photo ID: passport, national ID card, or driver's licence</li><li>Must be valid (not expired), all 4 corners visible, no reflections or blurring</li></ul><p><strong>Tier 2 — Address Verification:</strong></p><ul><li>Utility bill, bank statement, or official government letter</li><li>Must be dated within the last <strong>3 months</strong></li><li>Must show full name and residential address (P.O. Boxes not accepted)</li></ul><p><strong>Tier 3 — Enhanced Due Diligence (deposits > $10,000 or flagged accounts):</strong></p><ul><li>Source of funds declaration</li><li>Proof of income (bank statements, payslips, or tax returns)</li><li>Politically Exposed Person (PEP) declaration form</li></ul>` },
        { cat:'Verification', tags:'kyc,id,rejected,passport,blurry', q:"Client's ID was rejected — common reasons and how to help", a:`<ul><li><strong>Image too blurry:</strong> Ask client to retake in good lighting, using the rear camera. No screenshots of photos.</li><li><strong>Expired document:</strong> Must use a valid, non-expired ID. Ask client to use an alternative document.</li><li><strong>Corners cut off:</strong> All 4 corners of the document must be visible in the frame.</li><li><strong>Glare/reflection:</strong> Common with laminated IDs. Ask client to tilt the ID slightly or take photo in shade.</li><li><strong>Name mismatch:</strong> The name on the ID must exactly match the name on the trading account. If client used a shortened name at registration, ask compliance to review manually.</li></ul>` },
        { cat:'Verification', tags:'kyc,proof of address,utility,bank statement', q:'What qualifies as an acceptable proof of address?', a:`<p><strong>Accepted:</strong></p><ul><li>Bank statement (dated within 3 months)</li><li>Utility bill: electricity, gas, water, internet/phone (landline)</li><li>Tax assessment or government correspondence</li><li>Municipal rates notice</li></ul><p><strong>Not accepted:</strong></p><ul><li>Mobile phone bills</li><li>P.O. Box addresses</li><li>Invoices from private companies (insurance, gym, etc.)</li><li>Documents older than 3 months</li><li>Handwritten or editable-looking documents</li></ul>` },
        // Platform
        { cat:'Platform', tags:'mt4,mt5,login,connection,error,cant connect', q:'Client cannot connect to MT4/MT5 — troubleshooting steps', a:`<ol><li>Ask which server the client is attempting to connect to (Live or Demo). Confirm the correct server name from the back office.</li><li>Verify the login credentials: the MT4/MT5 account number is <strong>different</strong> from the portal login. Share the correct account number from the back office.</li><li>Ask the client to check their internet connection and try switching from Wi-Fi to mobile data.</li><li>If using desktop MT4/MT5, ask client to try logging in via the WebTrader as a test.</li><li>Check our system status page for any ongoing server maintenance.</li><li>If issue persists: have the client send an error screenshot and escalate to the technical team.</li></ol>` },
        { cat:'Platform', tags:'margin call,stop out,loss,equity', q:"Client's account was stopped out / margin call triggered — how to respond", a:`<ol><li>Do NOT apologise in a way that implies liability. The client accepted trading risks in the T&Cs.</li><li>Explain the margin call and stop-out levels (e.g. margin call at 80%, stop-out at 50%).</li><li>Walk through the math using their account statement so they understand what happened.</li><li>If the client believes it was an execution error, escalate to the dealing desk with the trade ID and timestamp.</li><li>Offer a dealing statement for the relevant period and let compliance review if the client files a formal complaint.</li></ol><div class="help-note warn"><i class="fas fa-exclamation-triangle"></i> Never offer refunds or goodwill credit without explicit approval from a manager.</div>` },
        { cat:'Platform', tags:'swap,rollover,overnight,charge,fee', q:'Client asking about swap/rollover charges — how to explain?', a:`<p>Swaps are overnight financing fees charged when a position is held past the daily rollover time (typically 22:00 GMT).</p><ul><li>Swaps can be <strong>positive or negative</strong> depending on the currency pair and direction of the trade.</li><li>On Wednesdays, triple swaps are charged to account for the weekend.</li><li>Direct the client to check swap rates in MT4/MT5: right-click a symbol → Properties → Swap long/short.</li><li>Islamic (swap-free) accounts are available upon request — direct to the Account Management team.</li></ul>` },
        // Security
        { cat:'Security', tags:'hacked,compromised,account,security,breach,unauthorised', q:'Client reports their account has been compromised — immediate steps', a:`<ol><li><strong>Immediately</strong> suspend the account from the back office to prevent further damage.</li><li>Log the time, client ID, and details of the report in the security incident log.</li><li>Do NOT share any account information or trade history with the caller until identity is re-verified via a secondary method (security question, email verification).</li><li>Escalate to the security/fraud team and your supervisor immediately.</li><li>Ask the client to change their email password if the same credentials were used elsewhere.</li><li>Prepare a formal incident report within 2 hours of the report.</li></ol><div class="help-note warn"><i class="fas fa-exclamation-triangle"></i> This is a P1 incident. Supervisor must be notified within 10 minutes.</div>` },
        { cat:'Security', tags:'password,reset,login,forgot,portal', q:'Client forgot their portal password — reset process', a:`<ol><li>Direct the client to the login page → "Forgot Password?" link.</li><li>A reset link will be sent to the registered email address (valid for 30 minutes).</li><li>If the client no longer has access to the registered email: escalate to the account management team — manual identity verification is required before any email change can be processed.</li><li>Never reset a password manually or share password reset links over chat without full identity verification.</li></ol>` },
        // Trading
        { cat:'Trading', tags:'trade,order,rejected,error,execution', q:'Order rejected — common error codes and what they mean', a:`<table style="width:100%;border-collapse:collapse;font-size:0.8rem"><thead><tr style="background:var(--bg-alt)"><th style="padding:0.5rem;text-align:left;border-bottom:1px solid var(--border)">Error</th><th style="padding:0.5rem;text-align:left;border-bottom:1px solid var(--border)">Meaning</th><th style="padding:0.5rem;text-align:left;border-bottom:1px solid var(--border)">Resolution</th></tr></thead><tbody><tr><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Error 130</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Invalid stops (SL/TP too close to market)</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Advise to widen SL/TP by at least the minimum stop level</td></tr><tr><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Error 134</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Not enough money</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Insufficient free margin — reduce lot size or deposit</td></tr><tr><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Error 148</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Too many pending orders</td><td style="padding:0.5rem;border-bottom:1px solid var(--border-light)">Max pending orders reached — close some before placing new ones</td></tr><tr><td style="padding:0.5rem">Error 4110</td><td style="padding:0.5rem">Invalid volume</td><td style="padding:0.5rem">Lot size below minimum or above maximum for the instrument</td></tr></tbody></table>` },
    ];
}

/* ── Data: Agent Guides ── */
function agentGuides() {
    return [
        {
            icon: 'fa-money-bill-wave', color: '#dbeafe', iconColor: '#1d4ed8',
            title: 'How to Handle a Withdrawal Complaint',
            badge: 'Withdrawals', badgeClass: 'badge-open',
            time: '~10 min read', difficulty: 'Standard',
            intro: 'A systematic approach to resolving withdrawal delays and disputes without escalating unnecessarily.',
            steps: [
                { n:1, title:'Acknowledge immediately', body:'Reply within 15 minutes. Thank the client for reaching out and confirm you are personally looking into their case. Never make the client feel they are being dismissed.' },
                { n:2, title:'Gather all information', body:'Collect: withdrawal ID, amount, submission date, destination bank/wallet, and any error messages the client received. Check these against the back office records.' },
                { n:3, title:'Verify account standing', body:'Confirm KYC status is fully verified, no compliance holds, and the withdrawal method on file matches what the client expects payment to.' },
                { n:4, title:'Check payment queue status', body:'Open the Payments Dashboard. Filter by client ID. Identify if the withdrawal is in: Requested → Approved → Processing → Completed. Note any flags.' },
                { n:5, title:'Identify the root cause', body:'Common causes: bank processing delays (1–5 business days for wire), incorrect bank details, unmet bonus conditions, or a compliance review. Match symptoms to cause.' },
                { n:6, title:'Communicate clearly', body:'Update the client with specific information: "Your withdrawal of $X,XXX was approved on [date] and sent to your bank on [date]. International transfers take 3–5 business days. If not received by [date], please contact us."' },
                { n:7, title:'Escalate if needed', body:'If the payment is genuinely delayed beyond our SLA (5 business days post-approval), create a Payments Escalation ticket with full details. Do not promise specific dates without confirmation from the payments team.' },
                { n:8, title:'Follow up proactively', body:'Set a reminder to follow up with the client and the payments team if the issue is not resolved in 24 hours. Clients who feel forgotten escalate to chargeback disputes.' },
            ]
        },
        {
            icon: 'fa-id-card', color: '#d1fae5', iconColor: '#065f46',
            title: 'Processing KYC Account Verification',
            badge: 'KYC/AML', badgeClass: 'badge-resolved',
            time: '~8 min read', difficulty: 'Standard',
            intro: 'Complete guide for reviewing and approving KYC documents, handling edge cases, and managing client expectations.',
            steps: [
                { n:1, title:'Access the KYC queue', body:'Navigate to Back Office → KYC Pending. Tickets are sorted by submission date (oldest first). Process in order unless a VIP flag or compliance hold is present.' },
                { n:2, title:'Review identity document', body:'Check: valid expiry date, all 4 corners visible, no glare/obstruction, name matches account registration, photo clearly visible. Approve or reject with a specific reason code.' },
                { n:3, title:'Review proof of address', body:'Check: dated within 3 months, full name and residential address visible, from an accepted document type (see KB). P.O. Boxes, mobile bills, and handwritten docs are rejected.' },
                { n:4, title:'Cross-check for discrepancies', body:'Ensure name spelling, date of birth, and country of residence are consistent across all documents and the client profile. Flag any inconsistencies to compliance before approving.' },
                { n:5, title:'Handle EDD triggers', body:'If the client has deposited > $10,000 or is from a high-risk jurisdiction, trigger Enhanced Due Diligence. Request source of funds documentation via a compliance ticket before full account activation.' },
                { n:6, title:'Communicate the outcome', body:'Approved: send the Account Verified template. Rejected: send the Document Rejection template, specifying exactly which document failed and why — be specific so the client knows what to resubmit.' },
                { n:7, title:'Update client profile', body:'Mark KYC status in the back office, add a note with the review date, reviewer name, and documents approved. For EDD cases, document the source of funds decision.' },
            ]
        },
        {
            icon: 'fa-fire-extinguisher', color: '#ede9fe', iconColor: '#5b21b6',
            title: 'De-escalating an Angry or Frustrated Client',
            badge: 'Client Relations', badgeClass: 'badge-in-progress',
            time: '~12 min read', difficulty: 'Advanced',
            intro: 'Proven techniques for handling emotionally charged interactions professionally, preserving client relationships and preventing formal complaints.',
            steps: [
                { n:1, title:'Stay calm — never match their energy', body:'Lower your own tone and pace. The client is frustrated, not attacking you personally. A calm, measured response is the most powerful tool you have.' },
                { n:2, title:'Listen fully before responding', body:'Do not interrupt or rush to offer solutions. Let the client vent. Acknowledge what they\'ve said: "I completely understand why this is frustrating — let me look into this right away."' },
                { n:3, title:'Validate their feelings explicitly', body:'Say: "You\'re absolutely right to expect faster service" or "I would feel the same way in your position." This disarms hostility faster than jumping straight to solutions.' },
                { n:4, title:'Take ownership', body:'Even if the issue is not your fault, say: "I\'m taking full ownership of this and I\'ll make sure it\'s resolved." Avoid blame-shifting to "the system", "another department", or "policy".' },
                { n:5, title:'Give a concrete next step with a timeframe', body:'Vague responses increase frustration. Commit to: "I\'ll have an update for you within 2 hours" and follow through. If you need longer, say so and explain why.' },
                { n:6, title:'Know when to escalate', body:'If the client mentions legal action, regulators (FCA, ASIC, CySEC), or requests to speak to a manager, do not delay. Escalate to your team lead immediately and notify them before the client does.' },
            ]
        },
        {
            icon: 'fa-desktop', color: '#fef3c7', iconColor: '#92400e',
            title: 'Handling Platform & Technical Issues',
            badge: 'Platform', badgeClass: 'badge-pending',
            time: '~7 min read', difficulty: 'Standard',
            intro: 'Step-by-step process for diagnosing and resolving MT4/MT5 and WebTrader issues reported by clients.',
            steps: [
                { n:1, title:'Identify the exact issue', body:'Ask the client for: the platform (MT4/MT5/WebTrader), the operating system, the error message (screenshot if possible), and when the issue started.' },
                { n:2, title:'Check system status', body:'Before troubleshooting, verify there are no ongoing server issues or maintenance windows on the internal status board. If there is: inform the client and provide an ETA.' },
                { n:3, title:'Basic troubleshooting', body:'Ask the client to: (1) restart the platform, (2) check internet connection, (3) try a different network, (4) reinstall the platform if issue persists.' },
                { n:4, title:'Verify account and server details', body:'Confirm the client is using the correct account number (not email address) and the correct server name (e.g. BrokerageName-Live-01 vs Demo).' },
                { n:5, title:'Escalate to technical team', body:'If basic troubleshooting fails, log a technical ticket with: client ID, account number, platform version, OS, error message, and steps already taken. Set client expectation to 4–24 hours for technical review.' },
            ]
        },
        {
            icon: 'fa-university', color: '#ccfbf1', iconColor: '#0f766e',
            title: 'Resolving Deposit Discrepancies',
            badge: 'Deposits', badgeClass: 'badge-open',
            time: '~6 min read', difficulty: 'Standard',
            intro: 'How to investigate and resolve cases where a client\'s deposit has not been credited to their trading account.',
            steps: [
                { n:1, title:'Collect proof of payment', body:'Request the client provide a clear proof of payment: bank receipt, e-wallet transaction ID, or crypto TxID. This is mandatory before any investigation begins.' },
                { n:2, title:'Search the payments back office', body:'Search by client ID, amount, and date. Check all queues: pending, rejected, and processing. Also check if the deposit is linked to a different account or email address.' },
                { n:3, title:'Verify payment method details', body:'Confirm the client sent funds to the correct account/address currently displayed in their portal. If details changed recently, check historical records.' },
                { n:4, title:'Escalate to payments team', body:'If the deposit proof is valid but funds are not found, raise an internal investigation ticket with all evidence. The payments team will liaise with the bank/processor directly.' },
                { n:5, title:'Keep the client updated', body:'Provide daily updates. Investigations typically resolve in 1–3 business days for cards, 3–5 for bank transfers. If it exceeds 5 days, escalate to the payments manager.' },
            ]
        },
    ];
}

/* ── Data: SOPs ── */
function sopData() {
    return [
        {
            id: 'sop-01', code: 'SOP-001', title: 'Ticket Escalation Procedure', owner: 'All Agents', reviewed: 'Jan 2024',
            body: `<div class="sop-meta-row"><span class="sop-meta-tag">Trigger:</span> Ticket unresolved after 24h, involves amounts &gt;$10,000, client requests manager, involves legal/regulatory threat, or security incident.</div>
            <div class="sop-steps">
                <div class="sop-step"><div class="sop-step-num">1</div><div><strong>Tier 1 → Tier 2:</strong> Reassign the ticket in the system to the "Tier 2 Review" queue. Add a detailed internal note summarising what's been done and why escalation is needed.</div></div>
                <div class="sop-step"><div class="sop-step-num">2</div><div><strong>Notify the team lead:</strong> Send a direct message to the on-duty team lead with: client ID, ticket ID, issue summary, and urgency level (P1/P2/P3).</div></div>
                <div class="sop-step"><div class="sop-step-num">3</div><div><strong>Inform the client:</strong> Use the Escalation Notification template. Never tell the client you are "escalating because you can't handle it" — frame it as "connecting them with a specialist team".</div></div>
                <div class="sop-step"><div class="sop-step-num">4</div><div><strong>Handover documentation:</strong> The escalation ticket must include the full conversation history, all actions taken, and any relevant account notes before handover.</div></div>
                <div class="sop-step"><div class="sop-step-num">5</div><div><strong>Follow up:</strong> Even after escalation, the original agent remains responsible for keeping the client informed until the ticket is resolved and closed.</div></div>
            </div>`
        },
        {
            id: 'sop-02', code: 'SOP-002', title: 'VIP Client Handling Protocol', owner: 'Senior Agents & Team Lead', reviewed: 'Jan 2024',
            body: `<div class="sop-meta-row"><span class="sop-meta-tag">Applies to:</span> Clients with account balance &gt;$50,000 or clients tagged as VIP in the CRM.</div>
            <div class="sop-steps">
                <div class="sop-step"><div class="sop-step-num">1</div><div><strong>Priority queue:</strong> VIP tickets are automatically flagged in the system. They must be responded to within <strong>15 minutes</strong> during business hours.</div></div>
                <div class="sop-step"><div class="sop-step-num">2</div><div><strong>Dedicated handling:</strong> VIP tickets should not be handled by junior agents unless supervised. Assign to the VIP desk or a senior agent.</div></div>
                <div class="sop-step"><div class="sop-step-num">3</div><div><strong>Communication standard:</strong> Address the client formally by their preferred title (Mr/Ms/Dr). Use a professional, personalised tone. Do not use canned responses.</div></div>
                <div class="sop-step"><div class="sop-step-num">4</div><div><strong>No holds:</strong> VIP clients should never be placed on hold for more than 2 minutes during a call. If research is needed, offer to call back within a defined timeframe.</div></div>
                <div class="sop-step"><div class="sop-step-num">5</div><div><strong>Relationship management:</strong> After resolution, send a personalised follow-up within 24 hours. Log the client's preferences and communication style in the CRM notes for future interactions.</div></div>
            </div>`
        },
        {
            id: 'sop-03', code: 'SOP-003', title: 'AML / Fraud Alert Response Procedure', owner: 'Compliance & Senior Agents', reviewed: 'Jan 2024',
            body: `<div class="sop-meta-row"><span class="sop-meta-tag sop-tag-red">Priority:</span> P1 — Immediate response required.</div>
            <div class="sop-steps">
                <div class="sop-step"><div class="sop-step-num">1</div><div><strong>Do not tip off:</strong> Under no circumstances should you inform the client that an AML investigation has been initiated. This is a legal requirement.</div></div>
                <div class="sop-step"><div class="sop-step-num">2</div><div><strong>Freeze the account:</strong> Immediately place the account on a compliance hold from the back office. This blocks withdrawals and new deposits pending review.</div></div>
                <div class="sop-step"><div class="sop-step-num">3</div><div><strong>Notify the MLRO:</strong> File an internal Suspicious Activity Report (SAR) and notify the Money Laundering Reporting Officer within 1 hour of the flag being triggered.</div></div>
                <div class="sop-step"><div class="sop-step-num">4</div><div><strong>Preserve all records:</strong> Do not delete or modify any communication logs, transaction records, or account notes. All evidence must be preserved.</div></div>
                <div class="sop-step"><div class="sop-step-num">5</div><div><strong>If client contacts support:</strong> Respond that their account is "under a routine review" and that they will be contacted within 2–3 business days. Do not give further details.</div></div>
            </div>`
        },
        {
            id: 'sop-04', code: 'SOP-004', title: 'End-of-Shift Ticket Handover Process', owner: 'All Agents', reviewed: 'Jan 2024',
            body: `<div class="sop-meta-row"><span class="sop-meta-tag">Frequency:</span> Required at the end of every shift before logging off.</div>
            <div class="sop-steps">
                <div class="sop-step"><div class="sop-step-num">1</div><div><strong>Review your open queue:</strong> Check all tickets assigned to you. Identify which are pending client reply, pending internal action, or require hand-off.</div></div>
                <div class="sop-step"><div class="sop-step-num">2</div><div><strong>Add internal notes:</strong> For every unresolved ticket, add an internal note detailing: current status, last action taken, next expected action, and any client commitments made.</div></div>
                <div class="sop-step"><div class="sop-step-num">3</div><div><strong>Reassign urgent tickets:</strong> Any ticket with an SLA breach risk in the next 4 hours must be reassigned to a colleague on the next shift with a personal message handover.</div></div>
                <div class="sop-step"><div class="sop-step-num">4</div><div><strong>Update the shift log:</strong> Post a summary in the team handover channel including: escalations raised, VIP issues, any system problems observed, and pending payment investigations.</div></div>
            </div>`
        },
        {
            id: 'sop-05', code: 'SOP-005', title: 'New Client Onboarding Support Checklist', owner: 'All Agents', reviewed: 'Jan 2024',
            body: `<div class="sop-meta-row"><span class="sop-meta-tag">Applies to:</span> All new account registrations within the first 7 days.</div>
            <div class="sop-steps">
                <div class="sop-step"><div class="sop-step-num">1</div><div><strong>Welcome contact:</strong> New clients should receive a welcome message within 24 hours of registration, confirming their account number and outlining next steps for verification.</div></div>
                <div class="sop-step"><div class="sop-step-num">2</div><div><strong>KYC prompt:</strong> If KYC documents have not been submitted within 48 hours, send a reminder with the document requirements and a direct upload link.</div></div>
                <div class="sop-step"><div class="sop-step-num">3</div><div><strong>First deposit support:</strong> If the client has verified but not deposited within 72 hours, send a payment methods guide and offer to assist via live chat.</div></div>
                <div class="sop-step"><div class="sop-step-num">4</div><div><strong>Platform onboarding:</strong> Ensure the client has their MT4/MT5 credentials and knows how to log in. Offer the platform quick-start guide.</div></div>
                <div class="sop-step"><div class="sop-step-num">5</div><div><strong>Flag high-value new clients:</strong> If a new client's first deposit exceeds $10,000, tag the account for EDD review and notify the compliance team before approving any withdrawals.</div></div>
            </div>`
        },
    ];
}

/* ── Data: Response Templates ── */
function responseTemplates() {
    return [
        {
            cat:'Withdrawals', title:'Withdrawal Received & Under Review',
            subject:'RE: Your Withdrawal Request — [TICKET ID]',
            body:`Dear [CLIENT NAME],

Thank you for reaching out. I have located your withdrawal request of [AMOUNT] submitted on [DATE], and I can confirm it has been received and is currently being processed.

Estimated completion time: 3–5 business days for international bank transfers. You will receive a confirmation email once the funds have been dispatched.

If you haven't received the funds by [DATE + 5 DAYS], please don't hesitate to contact us and we will investigate further.

Warm regards,
[AGENT NAME] | Client Support Team`
        },
        {
            cat:'KYC', title:'KYC Documents Required',
            subject:'Action Required: Account Verification — [CLIENT NAME]',
            body:`Dear [CLIENT NAME],

To complete your account verification and unlock full access to deposits and withdrawals, we require the following documents:

1. ✅ Proof of Identity: Valid government-issued photo ID (passport, national ID, or driver's licence)
2. ✅ Proof of Address: A utility bill or bank statement dated within the last 3 months

Please upload your documents directly through your client portal under: My Profile → Documents.

If you need any assistance with the upload process, our team is available 24/5.

Kind regards,
[AGENT NAME] | Verification Team`
        },
        {
            cat:'KYC', title:'KYC Document Rejection Notice',
            subject:'RE: Document Verification — Action Required',
            body:`Dear [CLIENT NAME],

Thank you for submitting your verification documents. Unfortunately, we were unable to accept the [DOCUMENT TYPE] you provided for the following reason:

❌ [SPECIFIC REJECTION REASON — e.g. "The document is expired" / "The address is not clearly visible" / "The document is older than 3 months"]

Please resubmit a document that meets the following criteria:
• [SPECIFIC REQUIREMENT]
• [SPECIFIC REQUIREMENT]

You can re-upload via your client portal at any time. Our verification team reviews submissions within 24 business hours.

We apologise for any inconvenience.

Kind regards,
[AGENT NAME] | Verification Team`
        },
        {
            cat:'Platform', title:'Platform Issue Acknowledgement',
            subject:'RE: Platform Issue — [TICKET ID]',
            body:`Dear [CLIENT NAME],

Thank you for bringing this to our attention. I'm sorry to hear you've been experiencing difficulties with [PLATFORM/FEATURE].

I have logged this as a priority issue and escalated it to our technical team for investigation. Our technical team typically responds within 4–8 business hours.

In the meantime, you may wish to try accessing your account via our WebTrader at [WEB TRADER URL] as an alternative.

I will keep you personally updated on the progress and ensure this is resolved as quickly as possible.

Apologies again for the inconvenience.

Best regards,
[AGENT NAME] | Technical Support`
        },
        {
            cat:'General', title:'Ticket Resolved — Closing Notification',
            subject:'RE: Your Support Request [TICKET ID] — Resolved',
            body:`Dear [CLIENT NAME],

I'm pleased to confirm that your support request has been fully resolved.

Summary of resolution: [BRIEF DESCRIPTION OF WHAT WAS DONE]

Your account is now fully operational. If you have any further questions or experience any related issues, please don't hesitate to reply to this message — your ticket will be re-opened immediately.

We appreciate your patience and value your continued trust in [BROKERAGE NAME].

Warm regards,
[AGENT NAME] | Client Support Team`
        },
        {
            cat:'General', title:'Follow-Up After 48 Hours',
            subject:'Following Up: Your Support Request [TICKET ID]',
            body:`Dear [CLIENT NAME],

I wanted to follow up on your recent support request regarding [ISSUE SUMMARY].

As of today, the status is: [CURRENT STATUS]

[IF RESOLVED]: This matter has now been fully resolved.
[IF PENDING]: We are still actively working on this and expect a resolution by [DATE].

Please do not hesitate to contact me directly if you have any questions in the meantime.

Thank you for your patience.

Best regards,
[AGENT NAME] | Client Support Team`
        },
        {
            cat:'General', title:'Escalation Notification to Client',
            subject:'RE: Your Request [TICKET ID] — Specialist Team Update',
            body:`Dear [CLIENT NAME],

Thank you for your patience regarding your request.

To ensure you receive the best possible assistance, I have escalated your case to our specialist team who have the expertise to address your situation directly. You can expect to hear from them within [TIMEFRAME].

Rest assured, I will personally follow up to ensure this is handled to your full satisfaction.

Ticket reference: [TICKET ID]

Warm regards,
[AGENT NAME] | Client Support Team`
        },
        {
            cat:'Deposits', title:'Deposit Proof of Payment Request',
            subject:'RE: Deposit Investigation — Proof of Payment Needed',
            body:`Dear [CLIENT NAME],

Thank you for contacting us regarding your deposit of [AMOUNT] on [DATE].

To investigate this matter promptly, could you please provide us with the following:

• A copy of your bank transfer receipt or transaction confirmation
• The transaction reference number (MT Reference for wire transfers)
• The exact date and time of the transfer

Please reply to this email with the documentation attached, and our payments team will begin the investigation immediately. We aim to resolve deposit queries within 2–3 business days.

Kind regards,
[AGENT NAME] | Payments Team`
        },
    ];
}

/* ── Data: Troubleshooting ── */
function troubleshootData() {
    return [
        {
            severity:'high', icon:'fa-plug',
            title:'MT4/MT5 — "No Connection" Error',
            tags:'mt4,mt5,no connection,offline,server',
            steps:[
                'Check our system status page for any active server maintenance.',
                'Ask client to verify they are using the correct server name (e.g. BrokerageName-Live-01). This is found under File → Login to Trade Account.',
                'Ask client to switch internet connection (try mobile hotspot to rule out ISP/firewall block).',
                'Temporarily disable antivirus/firewall and retry connection.',
                'If using MT4 on Mac: advise using the official MetaTrader 4 for Mac or the WebTrader as an alternative.',
                'Uninstall and reinstall the latest version of MT4/MT5 from the official MetaQuotes website.',
                'If none resolve: collect platform version, OS, error screenshot → escalate to technical team.',
            ]
        },
        {
            severity:'high', icon:'fa-lock',
            title:'Client Cannot Log In to Web Portal',
            tags:'login,portal,password,access,locked',
            steps:[
                'Confirm the client is using their registered email address (not MT4 account number).',
                'Ask if they see a specific error: "Invalid credentials", "Account locked", or "Email not found".',
                '"Account locked" = 5 failed login attempts. Unlock via Back Office → Client → Security → Unlock Account.',
                'For password reset: direct to the "Forgot Password" link on the login page.',
                'If email not recognised: check for typos in registration email. Check for duplicate accounts with variations of the email.',
                'If client cannot access their recovery email: manual identity verification is required — escalate to Account Management.',
            ]
        },
        {
            severity:'medium', icon:'fa-coins',
            title:'Deposit Not Showing After 24 Hours',
            tags:'deposit,missing,not credited,pending',
            steps:[
                'Ask for: payment method, amount, transaction date, and reference number.',
                'Search the Payments Back Office by client ID and amount across all status queues (Pending, Rejected, Completed).',
                'Card deposits: typically credited within 0–30 minutes. If pending >4 hours, check with the card processor.',
                'Bank transfers: 1–3 business days domestically, 3–5 days internationally.',
                'Crypto: check blockchain confirmations using the TxID on the relevant block explorer.',
                'If deposit proof is valid and funds not found after 24h: raise a Payments Investigation ticket with full details.',
            ]
        },
        {
            severity:'medium', icon:'fa-clock',
            title:'Withdrawal Stuck in "Processing" Status',
            tags:'withdrawal,processing,stuck,pending,delayed',
            steps:[
                'Verify the withdrawal was approved (not just requested) — check the approval timestamp in the back office.',
                'Check for any compliance flags or holds on the account that may have paused processing.',
                'Confirm bank details on file are complete and correct (IBAN, SWIFT/BIC, beneficiary name and address).',
                'Check the payment processor queue for any batch delays or system errors.',
                'If approved and details are correct but still stuck after 2 business days: escalate to the Payments team with the withdrawal ID.',
                'International wires: 3–5 business days from processing date is normal — inform client if within this window.',
            ]
        },
        {
            severity:'low', icon:'fa-chart-bar',
            title:'Charts Not Loading / Platform Freezing',
            tags:'charts,freeze,slow,performance,lag',
            steps:[
                'Ask the client to close and reopen the platform.',
                'If on MT4/MT5: right-click the chart → Refresh.',
                'Clear the platform cache: in MT4, go to File → Open Data Folder → delete the "history" folder, then restart.',
                'Check if only specific symbols are affected — may indicate a data feed issue. Test with a major pair like EUR/USD.',
                'Reduce the number of open charts and indicators — MT4 performance degrades significantly with >10 charts.',
                'Recommend switching from "Every tick" modelling to "1 Minute OHLC" if running automated strategies.',
                'Persistent freezing: reinstall the platform and restore profile from backup.',
            ]
        },
        {
            severity:'high', icon:'fa-exclamation-triangle',
            title:'Margin Call / Account Stopped Out',
            tags:'margin call,stop out,closed,positions,loss',
            steps:[
                'Pull the full trade history for the relevant period from the back office.',
                'Identify the exact time of stop-out and the margin level at that point.',
                'Verify stop-out level is consistent with the account type T&Cs (e.g. 50% margin level for Standard accounts).',
                'Check for any abnormal spreads or execution at the time of stop-out — if spreads appear abnormal, escalate to the dealing desk.',
                'Do NOT apologise in a way implying liability. Explain the margin policy clearly with reference to T&Cs.',
                'If client disputes execution: collect trade ID, symbol, date/time, and claimed price vs actual execution price → raise a dealing desk investigation.',
            ]
        },
        {
            severity:'low', icon:'fa-id-card',
            title:'KYC Verification Taking Longer Than Expected',
            tags:'kyc,verification,slow,delayed,waiting',
            steps:[
                'Check the KYC queue in the back office — note the submission date and current position in queue.',
                'Standard KYC review is completed within 24 business hours. EDD cases may take 3–5 business days.',
                'Check if any documents are flagged as "needs review" or "pending compliance" — these pause auto-processing.',
                'If documents have been pending for more than 48 business hours without EDD: manually review or assign to the compliance team.',
                'Inform the client of the current estimated timeline and check in with them proactively — do not wait for them to follow up again.',
            ]
        },
    ];
}

/* ── Data: Training Resources ── */
function trainingData() {
    return [
        { type:'Video',    icon:'fa-play-circle',    color:'#fee2e2', iconColor:'#b91c1c', title:'Forex Fundamentals for Support Teams', desc:'Core forex concepts every support agent must know — pips, lots, leverage, margin, and order types explained for non-traders.', duration:'45 min', level:'Beginner', tag:'Required' },
        { type:'PDF',      icon:'fa-file-pdf',       color:'#dbeafe', iconColor:'#1d4ed8', title:'KYC/AML Compliance Training Manual', desc:'Complete guide to our compliance obligations, AML red flags, SAR filing process, and regulatory requirements (FCA/CySEC).', duration:'60 min', level:'All Agents', tag:'Required' },
        { type:'PDF',      icon:'fa-file-pdf',       color:'#d1fae5', iconColor:'#065f46', title:'MT4/MT5 Platform Guide for Support', desc:'How to navigate MT4 and MT5 from a support perspective — reading account history, diagnosing errors, explaining features to clients.', duration:'30 min', level:'Beginner', tag:'Required' },
        { type:'Video',    icon:'fa-play-circle',    color:'#ede9fe', iconColor:'#5b21b6', title:'Client De-escalation & Communication', desc:'Practical techniques for handling difficult clients, managing complaints, and turning negative experiences into positive outcomes.', duration:'55 min', level:'All Agents', tag:'Required' },
        { type:'Article',  icon:'fa-newspaper',      color:'#fef3c7', iconColor:'#92400e', title:'VIP Client Management Best Practices', desc:'How to identify, prioritise, and build lasting relationships with high-value clients. Includes case studies from real forex brokerage scenarios.', duration:'20 min', level:'Senior', tag:'Recommended' },
        { type:'PDF',      icon:'fa-file-pdf',       color:'#ccfbf1', iconColor:'#0f766e', title:'Payment Methods & Processing Guide', desc:'Detailed guide to all accepted payment methods, processing timelines, fee structures, and common failure scenarios.', duration:'25 min', level:'All Agents', tag:'Required' },
        { type:'Video',    icon:'fa-play-circle',    color:'#fff7ed', iconColor:'#c2410c', title:'Regulatory Obligations Overview', desc:'Overview of regulatory requirements under FCA, CySEC, and ASIC frameworks — what agents need to know about client reporting, GDPR, and data handling.', duration:'40 min', level:'All Agents', tag:'Required' },
        { type:'Document', icon:'fa-clipboard-check',color:'#f1f5f9', iconColor:'#475569', title:'New Agent Onboarding Checklist', desc:'Complete checklist for new support agents — system access setup, tool walkthroughs, shadowing schedule, and 30/60/90-day milestones.', duration:'Self-paced', level:'New Agents', tag:'Onboarding' },
    ];
}

/* ── HTML Builders ── */
function accordionItem(question, answer, category, tags) {
    return `
    <div class="accordion-item" data-cat="${category}" data-tags="${tags}">
        <div class="accordion-header">
            <div class="accordion-header-left">
                <span class="kb-cat-badge">${category}</span>
                <span class="accordion-question">${question}</span>
            </div>
            <i class="fas fa-chevron-down accordion-chevron"></i>
        </div>
        <div class="accordion-body">
            <div class="accordion-body-inner">${answer}</div>
        </div>
    </div>`;
}

function guideCard(g) {
    return `
    <div class="guide-card">
        <div class="guide-card-header">
            <div class="guide-icon" style="background:${g.color}">
                <i class="fas ${g.icon}" style="color:${g.iconColor}"></i>
            </div>
            <div class="guide-card-meta">
                <div class="guide-card-title">${g.title}</div>
                <div class="guide-card-tags">
                    <span class="badge ${g.badgeClass}">${g.badge}</span>
                    <span class="guide-meta-item"><i class="far fa-clock"></i> ${g.time}</span>
                    <span class="guide-meta-item"><i class="fas fa-signal"></i> ${g.difficulty}</span>
                </div>
            </div>
        </div>
        <p class="guide-intro">${g.intro}</p>
        <div class="guide-steps">
            ${g.steps.map(s => `
            <div class="guide-step">
                <div class="step-number">${s.n}</div>
                <div class="step-body">
                    <div class="step-title">${s.title}</div>
                    <div class="step-desc">${s.body}</div>
                </div>
            </div>`).join('')}
        </div>
    </div>`;
}

function sopCard(s) {
    return `
    <div class="accordion-item sop-item" data-id="${s.id}">
        <div class="accordion-header">
            <div class="accordion-header-left">
                <span class="sop-code-badge">${s.code}</span>
                <span class="accordion-question">${s.title}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
                <span class="sop-owner"><i class="fas fa-user-tie"></i> ${s.owner}</span>
                <span class="sop-reviewed"><i class="fas fa-calendar-check"></i> ${s.reviewed}</span>
                <i class="fas fa-chevron-down accordion-chevron"></i>
            </div>
        </div>
        <div class="accordion-body">
            <div class="accordion-body-inner">${s.body}</div>
        </div>
    </div>`;
}

function templateCard(t) {
    const escapedBody = t.body.replace(/`/g, '\\`');
    return `
    <div class="template-card" data-cat="${t.cat}">
        <div class="template-card-header">
            <div>
                <div class="template-title">${t.title}</div>
                <div class="template-subject"><i class="fas fa-envelope" style="font-size:0.7rem;margin-right:4px"></i>${t.subject}</div>
            </div>
            <span class="badge badge-open" style="flex-shrink:0">${t.cat}</span>
        </div>
        <pre class="template-body">${t.body}</pre>
        <div class="template-actions">
            <button class="btn btn-sm btn-primary" onclick='copyTemplate(\`${escapedBody}\`)'>
                <i class="fas fa-copy"></i> Copy Template
            </button>
            <span class="template-copied-msg hidden" id="copied-${t.title.replace(/\s/g,'-')}">
                <i class="fas fa-check" style="color:var(--success)"></i> Copied!
            </span>
        </div>
    </div>`;
}

function troubleCard(t) {
    const sevColor = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' }[t.severity];
    return `
    <div class="accordion-item trouble-item" data-tags="${t.tags}">
        <div class="accordion-header">
            <div class="accordion-header-left">
                <div class="trouble-icon" style="background:${sevColor}1a;color:${sevColor}">
                    <i class="fas ${t.icon}"></i>
                </div>
                <span class="accordion-question">${t.title}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
                <span class="sev-badge" style="background:${sevColor}1a;color:${sevColor}">${t.severity.charAt(0).toUpperCase()+t.severity.slice(1)}</span>
                <i class="fas fa-chevron-down accordion-chevron"></i>
            </div>
        </div>
        <div class="accordion-body">
            <div class="accordion-body-inner">
                <ol class="trouble-steps">
                    ${t.steps.map(s => `<li>${s}</li>`).join('')}
                </ol>
            </div>
        </div>
    </div>`;
}

function trainingCard(r) {
    const tagColors = { Required:'badge-escalated', Recommended:'badge-in-progress', Onboarding:'badge-open' };
    return `
    <div class="training-card">
        <div class="training-card-header">
            <div class="training-icon" style="background:${r.color}">
                <i class="fas ${r.icon}" style="color:${r.iconColor};font-size:1.25rem"></i>
            </div>
            <span class="badge ${tagColors[r.tag] || 'badge-open'}" style="align-self:flex-start">${r.tag}</span>
        </div>
        <div class="training-type"><i class="fas fa-tag" style="font-size:0.65rem;margin-right:3px"></i>${r.type}</div>
        <div class="training-title">${r.title}</div>
        <p class="training-desc">${r.desc}</p>
        <div class="training-footer">
            <span class="training-meta"><i class="far fa-clock"></i> ${r.duration}</span>
            <span class="training-meta"><i class="fas fa-signal"></i> ${r.level}</span>
            <button class="btn btn-sm btn-primary" onclick="showToast('Opening: ${r.title}…','info')" style="margin-left:auto">
                <i class="fas fa-external-link-alt"></i> Open
            </button>
        </div>
    </div>`;
}

/* ── Help Interaction Handlers (global) ── */
window.switchHelpTab = function(tab) {
    document.querySelectorAll('.help-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.helpTab === tab));
    document.querySelectorAll('.help-panel').forEach(p => p.classList.toggle('active', p.id === `help-panel-${tab}`));
};

window.filterKB = function(btn, cat) {
    document.querySelectorAll('.kb-category-bar .kb-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#kb-accordion .accordion-item').forEach(item => {
        item.style.display = (cat === 'All' || item.dataset.cat === cat) ? '' : 'none';
    });
};

window.filterTemplates = function(btn, cat) {
    document.querySelectorAll('.template-filter-bar .kb-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#templates-list .template-card').forEach(card => {
        card.style.display = (cat === 'All' || card.dataset.cat === cat) ? '' : 'none';
    });
};

window.helpSearch = function(query) {
    const q = query.toLowerCase().trim();
    const clearBtn = document.getElementById('helpSearchClear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !q);

    if (!q) {
        document.querySelectorAll('.accordion-item, .guide-card, .template-card, .training-card, .trouble-item').forEach(el => { el.style.display = ''; });
        return;
    }

    // Search across all panels
    const panelMap = {
        'kb-accordion':       '.accordion-item',
        'guides-list':        '.guide-card',
        'sops-accordion':     '.accordion-item',
        'templates-list':     '.template-card',
        'trouble-accordion':  '.trouble-item',
        'training-list':      '.training-card',
    };

    Object.entries(panelMap).forEach(([containerId, selector]) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll(selector).forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
};

window.clearHelpSearch = function() {
    const input = document.getElementById('helpSearchInput');
    if (input) { input.value = ''; window.helpSearch(''); input.focus(); }
};

window.copyTemplate = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Template copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Template copied!', 'success');
    });
};

/* ══════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════ */
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => removeToast(toast), 4000);
    return toast;
}

function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

window.showToast      = showToast;
window.showNewTicketModal = showNewTicketModal;

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function formatStatus(status) {
    const map = { 'open':'Open', 'in-progress':'In Progress', 'pending':'Pending', 'escalated':'Escalated', 'resolved':'Resolved', 'closed':'Closed' };
    return map[status] || status;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
}

function getInitials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0] || '').slice(0,2).join('').toUpperCase();
}

function stringToColor(str) {
    const palette = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#14b8a6','#ec4899','#6366f1','#f97316','#84cc16'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}
