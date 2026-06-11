/* ============================================================
   data.js — Source unique de données + helpers
   Partagé par index.html (planning) et rh.html (pointage RH)
   Modifié via Claude.
   ============================================================ */

// ===== Accès protégé (mot de passe : THEBUREAU) =====
// Pour changer : générer le SHA-256 du nouveau mot de passe et remplacer PWD_HASH.
const PWD_HASH = 'f2fc97cfa4baa8682a96ef023913fb10ab7eb5fd7ee1d5ded2fabfb9c0b849d0';
const PWD_KEY  = 'planning-auth-v1';
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function setupGate() {
  const lock = document.getElementById('lock-screen');
  if (!lock) return;
  if (sessionStorage.getItem(PWD_KEY) === '1') { lock.remove(); return; }
  document.getElementById('lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('lock-input');
    const err = document.getElementById('lock-error');
    err.textContent = '';
    const h = await sha256Hex(input.value);
    if (h === PWD_HASH) {
      sessionStorage.setItem(PWD_KEY, '1');
      lock.style.transition = 'opacity .25s ease'; lock.style.opacity = '0';
      setTimeout(() => lock.remove(), 250);
    } else {
      err.textContent = 'Mot de passe incorrect';
      input.value = ''; input.focus();
      lock.querySelector('.lock-card').animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
        { duration: 250 });
    }
  });
}

// ===== Collaborateurs =====
// rtt: true => ce collaborateur peut cumuler des RTT (Charles uniquement)
const COLLABORATORS = {
  Emilie:  { building: 'TB3', color: 'emilie',  role: 'concierge', shortName: 'Émilie' },
  Flora:   { building: 'TB3', color: 'flora',   role: 'concierge', shortName: 'Flora' },
  Cédric:  { building: 'TB4', color: 'cedric',  role: 'concierge', shortName: 'Cédric' },
  Chiara:  { building: 'TB4', color: 'chiara',  role: 'concierge', shortName: 'Chiara' },
  Dynah:   { building: null,  color: 'dynah',   role: 'renfort',   shortName: 'Dynah' },
  Charles: { building: null,  color: 'charles', role: 'renfort',   shortName: 'Charles', rtt: true },
};
const PARTNER = { Emilie: 'Flora', Flora: 'Emilie', Cédric: 'Chiara', Chiara: 'Cédric' };
const BUILDING_CONCIERGES = { TB3: ['Emilie', 'Flora'], TB4: ['Cédric', 'Chiara'] };
const COLOR_HEX = {
  emilie: '#ec4899', flora: '#a855f7', chiara: '#14b8a6',
  cedric: '#3b82f6', dynah: '#f59e0b', charles: '#10b981', none: '#94a3b8'
};

// ===== Calendrier =====
// Semaine de référence 08-14/06/2026 → Flora & Cédric matin, Émilie & Chiara soir
const REF_MONDAY    = new Date(2026, 5, 8);
// Périodes en horaires réduits (9h-17h)
const REDUCED_PERIODS = [
  { start: new Date(2026, 6, 13), end: new Date(2026, 7, 28) },   // été : 13/07 → 28/08/2026
  { start: new Date(2026, 11, 21), end: new Date(2027, 0, 1) }    // fêtes : 21/12/2026 → 01/01/2027
];
const MIN_Y = 2026, MIN_M = 5;                 // juin 2026 = premier mois visible

// ===== Absences (pointage) =====
// Type par jour : 'CP' | 'RTT' | 'AM' (arrêt maladie) | 'ABI' (absence injustifiée) | 'CS' (congé sans solde)
// RTT réservé à Charles. Toute absence = la personne ne travaille pas ce jour.
const ABSENCES = {
  Emilie:  { '2026-06-12': 'CP', '2026-07-13': 'CP' },
  Flora:   { '2026-08-10': 'CP', '2026-08-11': 'CP', '2026-08-12': 'CP', '2026-08-13': 'CP', '2026-08-14': 'CP' },
  Chiara:  { '2026-09-07': 'CP', '2026-09-08': 'CP', '2026-09-09': 'CP', '2026-09-10': 'CP', '2026-09-11': 'CP' },
  Cédric:  {},
  Dynah:   {
    '2026-07-13': 'CP',
    '2026-07-27': 'CP', '2026-07-28': 'CP', '2026-07-29': 'CP', '2026-07-30': 'CP', '2026-07-31': 'CP',
    '2026-08-01': 'CP', '2026-08-02': 'CP', '2026-08-03': 'CP', '2026-08-04': 'CP', '2026-08-05': 'CP', '2026-08-06': 'CP', '2026-08-07': 'CP',
    '2026-09-09': 'CP', '2026-09-10': 'CP', '2026-09-11': 'CP',
    '2026-09-21': 'CP'
  },
  Charles: {
    '2026-06-15': 'CP', '2026-06-16': 'CP', '2026-06-17': 'CP', '2026-06-18': 'CP', '2026-06-19': 'CP',
    '2026-09-21': 'CP', '2026-09-22': 'CP', '2026-09-23': 'CP', '2026-09-24': 'CP', '2026-09-25': 'CP',
    '2026-09-26': 'CP', '2026-09-27': 'CP', '2026-09-28': 'CP', '2026-09-29': 'CP', '2026-09-30': 'CP',
    '2026-10-01': 'CP', '2026-10-02': 'CP', '2026-10-03': 'CP', '2026-10-04': 'CP'
  }
};

// Libellés des types de pointage
const POINTAGE_LABELS = {
  P:   'Présent',
  CP:  'Congé payé',
  RTT: 'RTT',
  AM:  'Arrêt maladie',
  ABI: 'Absence injustifiée',
  CS:  'Congé sans solde'
};

// ===== Cumuls CP / RTT =====
const CP_PER_MONTH  = 2.5;                 // jours de CP acquis à la fin de chaque mois (tous)
const RTT_ANNUAL    = { Charles: 13 };     // dotation RTT annuelle (Charles uniquement)
const ACCRUAL_START = { y: 2026, m: 5 };   // début d'acquisition des CP : juin 2026 (m: 0=janv)
// Report / solde initial AU 31/05/2026 (soldes à fin mai, hors jours posés après cette date).
// L'acquisition (CP 2,5/mois, RTT au prorata) démarre ensuite en juin via ACCRUAL_START.
const OPENING_BALANCE = {
  Emilie:  { cp: 20.5 },
  Flora:   { cp: 14 },
  Chiara:  { cp: 5 },
  Cédric:  { cp: 17.5 },
  Dynah:   { cp: 14 },
  Charles: { cp: 6, rtt: 5.4 }
};
// Règles métier : poser des CP/RTT ne réduit PAS l'acquisition. En toute rigueur, le congé sans
// solde (CS) ne génère pas de CP, et l'arrêt maladie non pro génère 2 j/mois (loi 2024) — ces
// réductions ne sont PAS appliquées automatiquement dans les compteurs (à ajuster si besoin).

// Heures supplémentaires — { 'AAAA-MM-JJ': [ { person, label, hours } ] }
const EXTRA_HOURS = {
  '2026-06-24': [ { person: 'Emilie', label: '19h–22h', hours: 3 } ]
};

// Exceptions manuelles par date — écrasent l'affectation auto du planning (après remplacements)
// Format : { 'AAAA-MM-JJ': { TB3|TB4: { morning|evening: { person, substituteFor } } } }
const OVERRIDES = {
  // 12/06 : exception — Dynah ne peut pas faire le soir. Flora prend le soir (remplace Émilie),
  // et Dynah ouvre le matin (à la place de Flora).
  '2026-06-12': {
    TB3: {
      morning: { person: 'Dynah', substituteFor: 'Flora' },
      evening: { person: 'Flora', substituteFor: 'Emilie' }
    }
  }
};

const HOLIDAYS_2026 = {
  '2026-01-01': "Jour de l'An", '2026-04-06': 'Lundi de Pâques', '2026-05-01': 'Fête du Travail',
  '2026-05-08': 'Victoire 1945', '2026-05-14': 'Ascension', '2026-05-25': 'Lundi de Pentecôte',
  '2026-07-14': 'Fête nationale', '2026-08-15': 'Assomption', '2026-11-01': 'Toussaint',
  '2026-11-11': 'Armistice', '2026-12-25': 'Noël',
  '2027-01-01': "Jour de l'An"
};

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

// ===== Date du jour =====
const today = new Date(); today.setHours(0, 0, 0, 0);

// ===== Helpers de dates =====
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const fmtFR = s => { const d = parseD(s); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const todayStr = fmt(today);
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function range(startStr, endStr) {
  const a = parseD(startStr), b = parseD(endStr), out = [];
  for (let d = new Date(a); d <= b; d.setDate(d.getDate()+1)) out.push(fmt(d));
  return out;
}
function isHoliday(d) { return HOLIDAYS_2026[fmt(d)]; }
function isWorkday(d) { const w = d.getDay(); return w !== 0 && w !== 6 && !isHoliday(d); }
// Jour de pont : vendredi après un jeudi férié, ou lundi avant un mardi férié
function isBridgeDay(d) {
  if (!isWorkday(d)) return false;
  const dow = d.getDay();
  if (dow === 5) { const p = new Date(d); p.setDate(p.getDate()-1); if (isHoliday(p)) return true; }
  if (dow === 1) { const n = new Date(d); n.setDate(n.getDate()+1); if (isHoliday(n)) return true; }
  return false;
}
// Horaires réduits : période 13/07–28/08 OU jour de pont
function isReducedDay(d) {
  for (const p of REDUCED_PERIODS) if (d >= p.start && d <= p.end) return true;
  return isBridgeDay(d);
}
function getWeekParity(d) {
  const monday = new Date(d);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const w = Math.floor(daysBetween(REF_MONDAY, monday) / 7);
  return ((w % 2) + 2) % 2;
}
const SN = p => COLLABORATORS[p]?.shortName || p;

// ===== Accès aux absences / heures supp =====
function absenceType(person, dateStr) { const a = ABSENCES[person]; return (a && a[dateStr]) || null; }
function isAbsent(person, dateStr) { return !!absenceType(person, dateStr); }
function personExtra(person, dateStr) {
  return (EXTRA_HOURS[dateStr] || []).find(e => e.person === person) || null;
}
