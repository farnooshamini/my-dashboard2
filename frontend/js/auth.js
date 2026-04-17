/* ============================================
   ForexSupport Pro — Auth Logic
   ============================================ */

const AUTH_KEY  = 'fxsp_session';
const USERS_KEY = 'fxsp_users';
const TOKEN_KEY = 'fxsp_token';

/* ── Utilities ── */
function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
    catch { return null; }
}

function setSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
}

function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

function isLoggedIn() {
    return getSession() !== null;
}

function getInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

/* ── Redirect helpers ── */
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

/* ── Validation ── */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pw) {
    return pw.length >= 6;
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
    const fe = document.getElementById('formError');
    if (fe) fe.classList.add('hidden');
}

function showFormError(msg) {
    const el = document.getElementById('formError');
    if (el) { el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`; el.classList.remove('hidden'); }
}

function markInputError(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.classList.add('error');
}

function clearInputError(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.classList.remove('error');
}

/* ── Password Strength ── */
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(4, score);
}

function updatePasswordStrength(pw) {
    const container = document.getElementById('passwordStrength');
    if (!container) return;
    const strength = getPasswordStrength(pw);
    const labels   = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const classes  = ['', 'strength-1', 'strength-2', 'strength-3', 'strength-4'];

    container.className = 'password-strength ' + (pw ? classes[strength] : '');
    const label = container.querySelector('.strength-label');
    if (label) label.textContent = pw ? labels[strength] : '';
}

/* ── Toggle Password Visibility ── */
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.input-wrapper');
            const input   = wrapper.querySelector('input[type="password"], input[type="text"]');
            const icon    = btn.querySelector('i');
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
function initLogin() {
    if (isLoggedIn()) { redirectToDashboard(); return; }

    const form    = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    if (!form) return;

    initPasswordToggles();

    // Clear errors on input
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            clearInputError(input.id);
            clearErrors();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        let   valid    = true;

        if (!email) {
            showFieldError('emailError', 'Email address is required.');
            markInputError('email'); valid = false;
        } else if (!validateEmail(email)) {
            showFieldError('emailError', 'Please enter a valid email address.');
            markInputError('email'); valid = false;
        }

        if (!password) {
            showFieldError('passwordError', 'Password is required.');
            markInputError('password'); valid = false;
        }

        if (!valid) return;

        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        try {
            const res  = await fetch(`${CONFIG.API_BASE}/auth/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password }),
            });
            const json = await res.json();

            if (!res.ok) {
                showFormError(json.error || 'Login failed. Please try again.');
                if (res.status === 401) markInputError('password');
                if (res.status === 404) markInputError('email');
                return;
            }

            const { name, role } = json.user;
            setToken(json.token);
            setSession({ name, email, initials: getInitials(name), role, color: 'av-blue' });
            redirectToDashboard();
        } catch {
            showFormError('Cannot reach the server. Make sure the backend is running.');
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });
}

/* ══════════════════════════════════════
   SIGN UP
══════════════════════════════════════ */
function initSignup() {
    if (isLoggedIn()) { redirectToDashboard(); return; }

    const form      = document.getElementById('signupForm');
    const submitBtn = document.getElementById('signupBtn');

    if (!form) return;

    initPasswordToggles();

    // Password strength meter
    const pwInput = document.getElementById('password');
    if (pwInput) {
        pwInput.addEventListener('input', () => updatePasswordStrength(pwInput.value));
    }

    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            clearInputError(input.id);
            clearErrors();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const email     = document.getElementById('email').value.trim();
        const password  = document.getElementById('password').value;
        const confirm   = document.getElementById('confirmPassword').value;
        let   valid     = true;

        if (!firstName) {
            showFieldError('firstNameError', 'First name is required.');
            markInputError('firstName'); valid = false;
        }

        if (!lastName) {
            showFieldError('lastNameError', 'Last name is required.');
            markInputError('lastName'); valid = false;
        }

        if (!email) {
            showFieldError('emailError', 'Email address is required.');
            markInputError('email'); valid = false;
        } else if (!validateEmail(email)) {
            showFieldError('emailError', 'Please enter a valid email address.');
            markInputError('email'); valid = false;
        }

        if (!password) {
            showFieldError('passwordError', 'Password is required.');
            markInputError('password'); valid = false;
        } else if (!validatePassword(password)) {
            showFieldError('passwordError', 'Password must be at least 6 characters.');
            markInputError('password'); valid = false;
        }

        if (!confirm) {
            showFieldError('confirmError', 'Please confirm your password.');
            markInputError('confirmPassword'); valid = false;
        } else if (password && password !== confirm) {
            showFieldError('confirmError', 'Passwords do not match.');
            markInputError('confirmPassword'); valid = false;
        }

        if (!valid) return;

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const fullName = `${firstName} ${lastName}`;
        const role     = document.getElementById('role')?.value || 'account_manager';

        try {
            const res  = await fetch(`${CONFIG.API_BASE}/auth/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name: fullName, email, password, role }),
            });
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 409) markInputError('email');
                showFormError(json.error || 'Registration failed. Please try again.');
                return;
            }

            setToken(json.token);
            setSession({ name: fullName, email, initials: getInitials(fullName), role, color: 'av-blue' });
            redirectToDashboard();
        } catch {
            showFormError('Cannot reach the server. Make sure the backend is running.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

/* ══════════════════════════════════════
   LOGOUT (called from dashboard)
══════════════════════════════════════ */
function logout() {
    clearSession();
    window.location.href = 'login.html';
}

/* ── Route Guard (dashboard calls this) ── */
function requireAuth() {
    const session = getSession();
    if (!session) { redirectToLogin(); return null; }
    return session;
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm'))  initLogin();
    if (document.getElementById('signupForm')) initSignup();
});
