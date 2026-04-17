/* ============================================================
   API configuration — change this if your backend runs on a
   different host or port (e.g. a staging or production server).
   ============================================================ */
const CONFIG = {
    API_BASE:  'http://localhost:3001/api',
    TOKEN_KEY: 'fxsp_token',
};

function apiFetch(url, options = {}) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = {
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
}
