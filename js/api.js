// Thin client for api.php. The auth token lives in localStorage.
const KEY = 'dwp_token';
export const auth = { token: localStorage.getItem(KEY) || '', username: '' };

async function call(action, body) {
  const opt = { headers: { 'X-Auth-Token': auth.token } };
  if (body) { opt.method = 'POST'; opt.body = JSON.stringify(body); opt.headers['Content-Type'] = 'application/json'; }
  try {
    const r = await fetch(`api.php?action=${action}`, opt);
    return await r.json();
  } catch (e) {
    return { ok: false, error: 'Cannot reach the game server (api.php).' };
  }
}
function setToken(t) { auth.token = t || ''; if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); }

export const api = {
  status: () => call('status'),
  async me() {
    if (!auth.token) return null;
    const r = await call('me');
    auth.username = r.ok && r.username ? r.username : '';
    if (!auth.username) setToken('');
    return auth.username || null;
  },
  async register(username, password) { const r = await call('register', { username, password }); if (r.ok) { setToken(r.token); auth.username = r.username; } return r; },
  async login(username, password) { const r = await call('login', { username, password }); if (r.ok) { setToken(r.token); auth.username = r.username; } return r; },
  async logout() { await call('logout', {}); setToken(''); auth.username = ''; },
  save: (state) => call('save', { state }),
  load: () => call('load'),
  async deleteAccount(password) { const r = await call('delete_account', { password }); if (r.ok) { setToken(''); auth.username = ''; } return r; },
  chat: (payload) => call('chat', payload),
};
