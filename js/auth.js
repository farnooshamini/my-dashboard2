/* ============================================
   ForexSupport Pro — Auth Logic
   ============================================ */

const AUTH_KEY  = 'fxsp_session';
const USERS_KEY = 'fxsp_users';

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

        // Loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        await new Promise(r => setTimeout(r, 900));

        // Check registered users first, fallback to any credentials
        const users       = getUsers();
        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        let sessionUser;

        if (matchedUser) {
            if (matchedUser.password !== password) {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                showFormError('Incorrect password. Please try again.');
                markInputError('password');
                return;
            }
            sessionUser = { name: matchedUser.name, email: matchedUser.email, initials: getInitials(matchedUser.name), role: 'Support Agent', color: 'av-blue' };
        } else {
            // Demo mode — accept any credentials
            const inferredName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            sessionUser = { name: inferredName, email, initials: getInitials(inferredName), role: 'Support Agent', color: 'av-blue', isDemo: true };
        }

        setSession(sessionUser);
        redirectToDashboard();
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

        // Check existing email
        const users = getUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            showFormError('An account with this email already exists.');
            markInputError('email');
            return;
        }

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await new Promise(r => setTimeout(r, 1000));

        const fullName = `${firstName} ${lastName}`;
        const newUser  = { name: fullName, email, password };
        users.push(newUser);
        saveUsers(users);

        const sessionUser = {
            name:     fullName,
            email,
            initials: getInitials(fullName),
            role:     'Support Agent',
            color:    'av-blue'
        };

        setSession(sessionUser);
        redirectToDashboard();
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
    const path = window.location.pathname;
    if (path.includes('login.html'))  initLogin();
    if (path.includes('signup.html')) initSignup();
});
