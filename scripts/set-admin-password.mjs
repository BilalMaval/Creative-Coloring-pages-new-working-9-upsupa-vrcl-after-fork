// Sets a new password for an admin account (and optionally a new login email).
// Run it yourself in a terminal so the password never appears in chat, logs or files:
//   node scripts/set-admin-password.mjs
//   node scripts/set-admin-password.mjs --email admin@printables.com --new-email you@yourdomain.com
//   add --show to see the characters as you type (otherwise nothing is echoed)
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env. Only that one user row is changed.
import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : fallback; };
const email = arg('email', 'admin@printables.com');
const newEmail = arg('new-email', null);
const SHOW = process.argv.includes('--show'); // echo the characters you type (default: hidden)

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// Hidden password prompt (characters are not echoed)
function ask(prompt) {
  if (SHOW) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
    });
  }
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    let value = '';
    const onData = (ch) => {
      if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
      if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); process.stdout.write('\n'); resolve(value); return; }
      if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); return; }
      value += ch;
    };
    stdin.on('data', onData);
  });
}

if (!process.stdin.isTTY) { console.error('Run this in an interactive terminal (it asks for the password with hidden input).'); process.exit(1); }

const rows = await (await fetch(`${URL_}/rest/v1/users?select=id,email,role&email=eq.${encodeURIComponent(email)}`, { headers: H })).json();
if (!Array.isArray(rows) || rows.length !== 1) { console.error(`No single user found with email ${email}`); process.exit(1); }
if (rows[0].role !== 'ADMIN') { console.error(`${email} is not an ADMIN account; refusing.`); process.exit(1); }
console.log(`Setting a new password for ${email} (ADMIN)${newEmail ? ` and changing the login email to ${newEmail}` : ''}.`);

const p1 = await ask('New password (min 12 characters): ');
if (p1.length < 12) { console.error('Too short. Use at least 12 characters (a long passphrase is best).'); process.exit(1); }
const p2 = await ask('Repeat password: ');
if (p1 !== p2) { console.error('Passwords did not match. Nothing was changed.'); process.exit(1); }

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(p1, salt, 64).toString('hex');
const patch = { password: `scrypt$${salt}$${hash}` };
if (newEmail) patch.email = newEmail;

const r = await fetch(`${URL_}/rest/v1/users?id=eq.${rows[0].id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
if (!r.ok) { console.error('Update failed:', r.status, await r.text()); process.exit(1); }
console.log(`Done. ${newEmail || email} can now log in with the new password. Old sessions stay valid until they expire; to sign everyone out, set a new AUTH_SECRET in Vercel and redeploy.`);
