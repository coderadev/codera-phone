'use strict';

/* =====================================================================
   Codera Phone - NUI
   ===================================================================== */
const RES = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'codera-phone';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const nui = (ep, d = {}) => fetch(`https://${RES}/${ep}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
}).then(r => r.json()).catch(() => ({}));
const api = (name, payload = {}) => nui('cb', { name, payload });

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const safeImg = u => (/^data:image\/svg\+xml[^\s"'<>]+$/.test(u || '') ? u : /^https?:\/\/[^\s"'<>]+$/.test(u || '') ? esc(u) : '');
const hue = s => ([...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;

/* ---------------------------------------------------------------------
   Icons (24x24 stroke icons)
   --------------------------------------------------------------------- */
const ICONS = {
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.870M16 3.130a4 4 0 0 1 0 7.750"/>',
  device: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  eyeoff: '<path d="M17.940 17.940A10.070 10.070 0 0 1 12 20c-7 0-11-8-11-8a18.450 18.450 0 0 1 5.060-5.940M9.900 4.240A9.120 9.120 0 0 1 12 4c7 0 11 8 11 8a18.500 18.500 0 0 1-2.160 3.190"/><line x1="1" y1="1" x2="23" y2="23"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  heart: '<path d="M20.8 4.6a5.500 5.500 0 0 0-7.800 0L12 5.700l-1-1.100a5.500 5.500 0 0 0-7.800 7.800l1 1.100L12 21.200l7.800-7.700 1-1.100a5.500 5.500 0 0 0 0-7.800z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
  download: '<path d="M12 4v11"/><polyline points="7 11 12 16 17 11"/><path d="M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  car: '<path d="M3 11l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5"/><rect x="2" y="11" width="20" height="6" rx="2"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/>',
  calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><line x1="8" y1="18.5" x2="12" y2="18.5"/>',
  idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2"/><line x1="14" y1="10" x2="19" y2="10"/><line x1="14" y1="14" x2="18" y2="14"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  coin: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  bank: '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  chev: '<polyline points="15 18 9 12 15 6"/>',
  chevr: '<polyline points="9 18 15 12 9 6"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  delete: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  arrowin: '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>',
  arrowout: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  userfill: '<circle cx="12" cy="7.5" r="4" fill="currentColor" stroke="none"/><path d="M4.5 21c0-4.2 3.3-6.6 7.5-6.6s7.5 2.4 7.5 6.6z" fill="currentColor" stroke="none"/>',
  dialpad: '<g fill="currentColor" stroke="none"><rect x="4.3" y="4.3" width="3.4" height="3.4" rx="1"/><rect x="10.3" y="4.3" width="3.4" height="3.4" rx="1"/><rect x="16.3" y="4.3" width="3.4" height="3.4" rx="1"/><rect x="4.3" y="10.3" width="3.4" height="3.4" rx="1"/><rect x="10.3" y="10.3" width="3.4" height="3.4" rx="1"/><rect x="16.3" y="10.3" width="3.4" height="3.4" rx="1"/><rect x="4.3" y="16.3" width="3.4" height="3.4" rx="1"/><rect x="10.3" y="16.3" width="3.4" height="3.4" rx="1"/><rect x="16.3" y="16.3" width="3.4" height="3.4" rx="1"/></g>',
  contactcard: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16.2c.5-1.5 1.8-2.3 3.2-2.3s2.7.8 3.2 2.3M14.5 10h3.5M14.5 13.5h3.5"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;

/* ---------------------------------------------------------------------
   App registry
   --------------------------------------------------------------------- */
const APPS = {
  settings:   { name: 'Settings',   ic: 'settings',  cls: 'a-light'  },
  garage:     { name: 'Garage',     ic: 'car',       cls: 'a-dark'   },
  calculator: { name: 'Calculator', ic: 'calc',      cls: 'a-dark'   },
  licenses:   { name: 'Licenses',   ic: 'idcard',    cls: 'a-dark'   },
  gallery:    { name: 'Gallery',    ic: 'image',     cls: 'a-dark'   },
  calendar:   { name: 'Calendar',   ic: 'calendar',  cls: 'a-dark'   },
  business:   { name: 'Business',   ic: 'briefcase', cls: 'a-blue'   },
  crypto:     { name: 'Crypto',     ic: 'coin',      cls: 'a-purple' },
  notes:      { name: 'Notes',      ic: 'note',      cls: 'a-lime'  },
  bank:       { name: 'Bank',       ic: 'bank',      cls: 'a-green'  },
  news:       { name: 'News',       ic: 'news',      cls: 'a-news'   },
  phone:      { name: 'Phone',      ic: 'phone',     cls: 'a-green'  },
  messages:   { name: 'Messages',   ic: 'message',   cls: 'a-teal'   },
  contacts:   { name: 'Contacts',   ic: 'user',      cls: 'a-gray'   },
  socials:    { name: 'Socials',    ic: 'message',   cls: 'a-socials' },
  market:     { name: 'Lemon List', ic: 'bag',       cls: 'a-lemon'  },
  store:      { name: 'App Store', ic: 'store',     cls: 'a-blue'   },
  camera:     { name: 'Camera',     ic: 'camera',    cls: 'a-dark'   },
};

/* Filled app-tile glyphs (48x48). Elements with class "cut" are knocked out using the tile colour. */
const APPICON = {
  socials: '<path d="M16 7h16a10 10 0 0 1 10 10v9a10 10 0 0 1-10 10H25.500l-6.300 6.500a1.600 1.600 0 0 1-2.700-1.100V36H16A10 10 0 0 1 6 26v-9A10 10 0 0 1 16 7z" fill="#2fb0f0"/><rect x="13" y="15" width="9.500" height="3.800" rx="1.900" fill="#fff"/><rect x="25.500" y="15" width="9.500" height="3.800" rx="1.900" fill="#fff"/><rect x="13" y="22" width="9.500" height="3.800" rx="1.900" fill="#fff"/><rect x="25.500" y="22" width="9.500" height="3.800" rx="1.900" fill="#fff"/>',
  market: '<path d="M22.3 14.7C22.5 10 25 5.9 29.5 5.9H35C35 10 32.200 14.700 26.500 14.700z"/><path d="M20.700 12.100A14.200 14.200 0 1 0 34.350 16.500" fill="none" stroke="currentColor" stroke-width="4.100" stroke-linecap="round"/>',
  bank: '<path d="M24 5L6 14.5V18h36v-3.5z"/><rect x="8" y="20" width="32" height="3" rx="1"/><rect x="10" y="25" width="5.5" height="11" rx="1"/><rect x="17.5" y="25" width="5.5" height="11" rx="1"/><rect x="25" y="25" width="5.5" height="11" rx="1"/><rect x="32.5" y="25" width="5.5" height="11" rx="1"/><rect x="8" y="37.5" width="32" height="3" rx="1"/><rect x="5" y="41.5" width="38" height="3" rx="1"/>',
  calendar: '<rect x="14" y="5" width="4.5" height="9" rx="2.2"/><rect x="29.5" y="5" width="4.5" height="9" rx="2.2"/><path d="M7 15a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v3H7z"/><path d="M7 20.5h34V36a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5z"/>',
  crypto: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="30" height="30" stroke-width="1.2" opacity=".55"/><path d="M9 9h20M9 9v13M5.5 18.5L9 22l3.5-3.5M39 39H19M39 39V26M35.5 29.5L39 26l3.5 3.5" stroke-width="2"/><path d="M31 18.5a8.5 8.5 0 1 0 0 11" stroke-width="5" stroke-linecap="butt"/></g>',
  garage: '<path d="M5 41V16.5a4 4 0 0 1 2.2-3.6l15-7.3a4 4 0 0 1 3.6 0l15 7.3A4 4 0 0 1 43 16.5V41h-7V23H12v18z"/><path d="M16 28.5h16l2.6 6v6.5h-4.3v-2H17.7v2h-4.3v-6.5z"/><circle class="cut" cx="17.8" cy="34.4" r="1.5"/><circle class="cut" cx="30.2" cy="34.4" r="1.5"/>',
  licenses: '<path d="M7 13a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v1.5H7z"/><path d="M7 17.5h34V35a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z"/><circle class="cut" cx="16" cy="25" r="3.2"/><path class="cut" d="M10.5 34c.6-3.2 2.8-4.6 5.5-4.6s4.900 1.400 5.500 4.600z"/><rect class="cut" x="25" y="23" width="12" height="2.6" rx="1.300"/><rect class="cut" x="25" y="29" width="9" height="2.600" rx="1.300"/>',
  gallery: '<rect x="6" y="6" width="36" height="36" rx="10"/><circle class="cut" cx="17.500" cy="17.500" r="4.300"/><path class="cut" d="M6 33.500l11-8 9 7 6-4.500 10 6.500v1.500H6z"/><path d="M6 36l11-8.500 9 7 6-4.500L42 36" fill="none" stroke="currentColor" stroke-width="2"/>',
  settings: '<g fill="currentColor"><circle cx="24" cy="24" r="12"/><rect x="20.500" y="4.500" width="7" height="39" rx="2.500"/><rect x="20.500" y="4.500" width="7" height="39" rx="2.500" transform="rotate(45 24 24)"/><rect x="20.500" y="4.500" width="7" height="39" rx="2.500" transform="rotate(90 24 24)"/><rect x="20.500" y="4.500" width="7" height="39" rx="2.500" transform="rotate(135 24 24)"/></g><circle class="cut" cx="24" cy="24" r="5.500"/>',
  news: '<rect x="5" y="15" width="21" height="10" fill="#d4262c"/><text x="15.500" y="23" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="9" textLength="18" lengthAdjust="spacingAndGlyphs" fill="#fff">NEWS</text><rect x="28" y="15.500" width="15" height="2" fill="#15171a"/><rect x="28" y="19.500" width="15" height="2" fill="#15171a"/><rect x="28" y="23.500" width="15" height="2" fill="#15171a"/><rect x="5" y="28.500" width="38" height="2" fill="#15171a"/><rect x="5" y="32.500" width="38" height="2" fill="#15171a"/><rect x="5" y="36.500" width="38" height="2" fill="#15171a"/>',
  business: '<path d="M17 15v-3.500a3.500 3.500 0 0 1 3.500-3.500h7a3.500 3.500 0 0 1 3.500 3.500V15" fill="none" stroke="currentColor" stroke-width="3.200"/><rect x="6" y="15" width="36" height="25" rx="5"/><rect class="cut" x="6" y="26" width="36" height="2.400"/><rect x="21" y="23.500" width="6" height="7" rx="1.500"/>',
  notes: '<circle cx="23" cy="26" r="13" fill="none" stroke="currentColor" stroke-width="4.600"/><path d="M25.500 12.500c.4-4.600 3.600-7.600 8.500-7.800.200 4.800-2.600 8.200-8 8.400z"/>',
  calc: '<rect x="9" y="5" width="30" height="38" rx="6"/><rect class="cut" x="13.500" y="9.500" width="21" height="8.500" rx="2"/><g class="cut"><circle cx="17.500" cy="25" r="2.400"/><circle cx="24" cy="25" r="2.400"/><circle cx="30.500" cy="25" r="2.400"/><circle cx="17.500" cy="31.500" r="2.400"/><circle cx="24" cy="31.500" r="2.400"/><circle cx="30.500" cy="31.500" r="2.400"/><circle cx="17.500" cy="38" r="2.400"/><circle cx="24" cy="38" r="2.400"/><circle cx="30.500" cy="38" r="2.400"/></g>',
};
const appGlyph = id => (APPICON[id] || (id === 'calculator' && APPICON.calc)) ? `<svg class="ai" viewBox="0 0 48 48">${APPICON[id] || APPICON.calc}</svg>` : null;
const GRID = ['settings', 'socials', 'garage', 'licenses', 'gallery', 'calendar', 'business', 'crypto', 'bank', 'market'];
const GRID_UNFOLD = ['calendar', 'socials', 'garage', 'licenses', 'gallery', 'settings', 'bank', 'crypto', 'business', 'market'];
const DOCK = ['phone', 'messages', 'contacts', 'store', 'camera'];
const STORE = [
  { id: 'bank',     desc: 'Check your balance, move money, and send transfers by phone number.' },
  { id: 'crypto',   desc: 'Watch coin prices and trade straight from your phone.' },
  { id: 'market',   desc: 'Browse local listings and sell something of your own.' },
  { id: 'business', desc: 'Manage your job, check your paycheck and toggle duty.' },
];
const STORE_IDS = STORE.map(a => a.id);
const installed = () => (settings().installed || ['market', 'news']);

/* ---------------------------------------------------------------------
   State
   --------------------------------------------------------------------- */
const S = {
  open: false, data: {}, cfg: {}, app: null, view: null, tmp: {},
  notifs: [], call: null, missed: 0, h: 8, m: 0, zone: '', shade: false,
};
const R = {}, AFTER = {}, LOAD = {}, ACT = {};
const settings = () => S.data.settings || {};
const money = n => (S.cfg.currency || '$') + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/* ---------------------------------------------------------------------
   Formatting helpers
   --------------------------------------------------------------------- */
function fmtPhone(n) {
  n = String(n || '');
  return n.length === 10 ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}` : n;
}
function clockParts() {
  if (S.cfg.realTime) { const d = new Date(); return [d.getHours(), d.getMinutes()]; }
  return [S.h, S.m];
}
function timeStr() {
  const [h, m] = clockParts();
  if (settings().h24) return `${pad(h)}:${pad(m)}`;
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}
function fmtClock(ts) { const d = new Date(ts * 1000); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtDay(ts) {
  const d = new Date(ts * 1000), n = new Date();
  if (d.toDateString() === n.toDateString()) return fmtClock(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function fmtDate(ts) { const d = new Date(ts * 1000); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
function fmtDur(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const contactName = n => { const c = (S.data.contacts || []).find(x => x.number === n); return c ? c.name : null; };
const label = n => contactName(n) || fmtPhone(n);

/* ---------------------------------------------------------------------
   UI building blocks
   --------------------------------------------------------------------- */
const hdr = (title, o = {}) => `<div class="hdr">${o.back === false ? '<i></i>' : `<button class="ib" data-act="back">${ic('chev')}</button>`}<h2>${esc(title)}</h2><div class="hr">${o.right || ''}</div></div>`;
const wrap = (h, b, cls = '') => `<div class="page ${cls}">${h}<div class="body">${b}</div></div>`;
const empty = (t, i = 'inbox') => `<div class="empty">${ic(i)}<p>${esc(t)}</p></div>`;
const avatar = (name, cls = '') => `<div class="avatar ${cls}" style="--hue:${hue(name)}">${esc(((name || '?').trim()[0] || '?').toUpperCase())}</div>`;
const toggle = (k, on) => `<div class="toggle ${on ? 'on' : ''}" data-act="tog" data-k="${k}"></div>`;

const initials = n => ((n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('') || '?').toUpperCase();
function toast(title, text, app, force) {
  if (settings().dnd && !force) return;
  if (!force && settings()['nx_' + app]) return;
  const a = APPS[app] || APPS.settings;
  const box = $('#toasts'), wrapEl = $('#phone-wrap');
  const el = document.createElement('div');
  el.className = 'toast';
  const lead = app === 'messages' ? `<div class="t-av">${esc(initials(title))}</div>` : `<div class="i ${a.cls}">${ic(a.ic)}</div>`;
  el.innerHTML = `${lead}<div class="t-tx"><b>${esc(title)}</b><small>${esc(text)}</small></div>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  // Phone is put away: let it peek up so the banner is visible
  if (!S.open) wrapEl.classList.add('npeek');
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => {
      el.remove();
      if (!box.children.length) wrapEl.classList.remove('npeek');
    }, 320);
  }, 4500);
}

/* ---------------------------------------------------------------------
   Core: home, router, clock
   --------------------------------------------------------------------- */
function unreadCount() {
  const me = (S.data.me || {}).phone;
  return (S.data.messages || []).filter(m => m.receiver === me && !m.is_read).length;
}
function badgeFor(id) {
  const n = id === 'messages' ? unreadCount() : id === 'phone' ? S.missed : 0;
  return n > 0 ? `<span class="badge">${n > 9 ? '9+' : n}</span>` : '';
}
function appIcon(id) {
  const a = APPS[id];
  return `<div class="app" data-act="open" data-id="${id}"><div class="i ${a.cls}">${appGlyph(id) || ic(a.ic)}${badgeFor(id)}</div>${DOCK.includes(id) ? '' : `<span>${a.name}</span>`}</div>`;
}
function renderHome() {
  $('#home').innerHTML = `<div class="clock" id="home-clock">${timeStr()}</div><div class="zone-wrap"><div class="zone">${esc(S.zone || 'Los Santos')}</div></div><div class="grid">${(settings().unfold ? GRID_UNFOLD : GRID).filter(id => !STORE_IDS.includes(id) || installed().includes(id)).map(appIcon).join('')}</div>`;
  $('#dock').innerHTML = DOCK.map(appIcon).join('');
}
function updateClock() {
  const t = timeStr();
  $('#sb-time').textContent = t;
  const hc = $('#home-clock');
  if (hc) hc.textContent = t;
}
function render() {
  if (!S.app) return;
  const f = R[S.app];
  if (!f) return;
  document.body.classList.toggle('soapp', S.app === 'socials');
  document.body.classList.toggle('msgapp', S.app === 'messages' || S.app === 'contacts' || S.app === 'phone');
  document.body.classList.toggle('splash', S.app === 'socials' && !S.tmp.soc);
  document.body.classList.toggle('cxapp', S.app === 'crypto');
  document.body.classList.toggle('bzapp', S.app === 'business' && !!S.tmp.bizOn);
  document.body.classList.toggle('bkapp', S.app === 'bank' && bkSt().tab !== 'transfer');
  document.body.classList.toggle('bsplash', S.app === 'business' && !S.tmp.bizOn);
  $('#appview').innerHTML = f();
  if (AFTER[S.app]) AFTER[S.app]();
}
function openApp(id) {
  if (id === 'camera') { nui('camera'); return; }
  S.app = id; S.view = null;
  document.body.classList.add('inapp');
  $('#appview').classList.add('on');
  render();
  if (LOAD[id]) LOAD[id]();
}
function goHome() {
  S.app = null; S.view = null;
  document.body.classList.remove('inapp', 'soapp', 'msgapp', 'splash', 'bsplash', 'bkapp', 'cxapp', 'bzapp');
  S.tmp.bizOn = false;
  $('#appview').classList.remove('on');
  setShade(false);
  renderHome();
}
function back() {
  if (S.view) { S.view = null; render(); } else goHome();
}
function setView(v) { S.view = v; render(); }
function applySettings() {
  const s = settings();
  document.body.classList.toggle('light', !!s.light);
  const w = (S.cfg.wallpapers || []).find(x => x.id === s.wallpaper);
  const css = s.custom ? `url("${String(s.custom).replace(/"/g, '%22')}") center/cover` : (w ? w.css : '#1a1c20');
  $('#screen').style.setProperty('--wall', css);
  nui('sync', { dnd: !!s.dnd, airplane: !!s.airplane });
}
function saveSettings() { api('saveSettings', settings()); applySettings(); }
function fit() {
  const s = Math.min(1.15, (innerHeight * 0.95) / 750);
  document.documentElement.style.setProperty('--s', s);
}

/* notifications */
function updateBell() {
  const b = $('#sb-bell'), n = S.notifs.length;
  b.classList.toggle('hidden', !n);
  b.innerHTML = n ? String(n > 9 ? '9+' : n) : '';
}
function renderShade() {
  $('#shade-list').innerHTML = S.notifs.length ? S.notifs.map((n, i) => {
    const a = APPS[n.app] || APPS.settings;
    return `<div class="nitem" data-act="nopen" data-i="${i}"><div class="i ${a.cls}">${ic(a.ic)}</div><div><b>${esc(n.title)}</b><small>${esc(n.text)}</small></div></div>`;
  }).join('') : '<div style="text-align:center;color:#9aa0aa;padding:20px">No notifications</div>';
}
function setShade(on) { S.shade = on; $('#shade').classList.toggle('on', on); if (on) renderShade(); }
function pushNotif(app, title, text) {
  if (settings()['nx_' + app]) return;
  S.notifs.unshift({ app, title, text });
  S.notifs = S.notifs.slice(0, 30);
  updateBell();
  toast(title, text, app);
}


/* ---------------------------------------------------------------------
   Fold / unfold
   --------------------------------------------------------------------- */
function applyFold(on) {
  document.body.classList.toggle('unfold', !!on);
  if (S.app) render();
  const l = $('#hint-fold');
  if (l) l.textContent = on ? 'Fold' : 'Unfold';
  renderHome();
  nui('fold', { open: !!on });
}
function toggleFold() {
  if (S.folding) return;
  S.folding = true;
  const next = !settings().unfold;
  settings().unfold = next;
  document.body.classList.add('morph');
  setTimeout(() => applyFold(next), 160);
  setTimeout(() => { document.body.classList.remove('morph'); S.folding = false; }, 440);
  saveSettings();
}

/* ---------------------------------------------------------------------
   PHONE app
   --------------------------------------------------------------------- */
const agoStr = ts => {
  const d = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (d < 60) return 'now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};
const durWords = s => { s = +s || 0; const m = Math.floor(s / 60); return m ? `${m}m ${s % 60}s` : `${s}s`; };
const dialHtml = () => S.tmp.dial ? esc(fmtPhone(S.tmp.dial)) : '<span class="ph">Enter number</span>';
R.phone = () => {
  const t = S.tmp.pTab || 'recent';
  const list = S.data.calls || [];
  const blocked = settings().blocked || [];
  const tool = (k, icn) => `<button class="${t === k ? 'on' : ''}" data-act="ptab" data-v="${t === k ? 'recent' : k}">${ic(icn)}</button>`;
  const info = t === 'keypad' ? 'Keypad' : t === 'fav' ? 'Favorites' : `${list.length} Call${list.length === 1 ? '' : 's'}`;
  const bar = `<div class="cbar"><span>${info}</span><div>${tool('fav', 'star')}${tool('keypad', 'dialpad')}</div></div>`;
  let b = '';
  if (t === 'keypad') {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map(k => k ? `<button data-act="key" data-v="${k}">${k}</button>` : '<button class="gap"></button>').join('');
    b = `<div class="dial-num" id="dial-num">${dialHtml()}</div><div class="keypad">${keys}</div>
      <div class="dial-act"><span></span><button class="callbtn" data-act="dialcall">${ic('phone')}</button><button class="ib" data-act="keydel">${ic('delete')}</button></div>`;
  } else if (t === 'recent') {
    b = list.length ? list.map(c => {
      const answered = c.status === 'answered';
      const missed = !answered && c.direction === 'in';
      const dir = c.direction === 'in' ? 'Incoming' : 'Outgoing';
      const sub = missed ? '<small class="missed">Missed</small>'
        : `<small>${dir}${answered && c.duration ? ' · ' + durWords(c.duration) : answered ? '' : ' · No answer'}</small>`;
      const icn = missed ? 'phoneoff' : c.direction === 'in' ? 'arrowin' : 'arrowout';
      const known = !!contactName(c.number), isBlocked = blocked.includes(c.number);
      return `<div class="row cl-row" data-act="callnum" data-n="${esc(c.number)}"><div class="cl-ic ${missed ? 'missed' : ''}">${ic(icn)}</div><div class="grow"><b>${esc(contactName(c.number) || sPhone(c.number))}</b>${sub}</div><span class="cl-ago">${agoStr(c.ts)}</span>${known ? '' : `<button class="cl-btn" data-act="cladd" data-n="${esc(c.number)}">${ic('userplus')}</button>`}<button class="cl-btn ${isBlocked ? 'on' : ''}" data-act="cblock" data-n="${esc(c.number)}">${ic('ban')}</button></div>`;
    }).join('') : empty('No recent calls', 'phone');
  } else {
    const favs = (S.data.contacts || []).filter(c => c.favorite);
    b = favs.length ? favs.map(c => `<div class="row" data-act="callnum" data-n="${esc(c.number)}">${avatar(c.name)}<div class="grow"><b>${esc(c.name)}</b><small>${esc(fmtPhone(c.number))}</small></div>${ic('phone', 'dir in')}</div>`).join('') : empty('No favorites yet', 'star');
  }
  const modal = S.tmp.padd ? `<div class="mback nc"><div class="modal nc-modal"><h3>New Contact</h3><p class="nc-num">${esc(sPhone(S.tmp.padd))}</p><div class="nc-label">Contact Name</div><input id="pc-name" class="input" maxlength="40" placeholder="Contact Name" autocomplete="off"><div class="err" id="pc-err"></div><button class="nc-b main" data-act="pcsave">Create</button><button class="nc-b" data-act="pccancel">Cancel</button></div></div>` : '';
  return `<div class="page"><div class="hdr mh"><h2 class="mt">CALLS</h2></div><div class="body">${bar}${b}</div></div>` + msgNav(t === 'keypad' ? 'keypad' : 'phone') + modal;
};
ACT.cladd = el => { S.tmp.padd = el.dataset.n; render(); };
ACT.pccancel = () => { S.tmp.padd = null; render(); };
ACT.pcsave = async () => {
  const name = ($('#pc-name').value || '').trim();
  if (!name) { $('#pc-err').textContent = 'Enter a name'; return; }
  const r = await api('contact:save', { id: null, name, number: S.tmp.padd, favorite: false });
  if (Array.isArray(r)) { S.data.contacts = r; S.tmp.padd = null; render(); toast('Contacts', `${name} saved`, 'contacts', true); }
  else $('#pc-err').textContent = 'Could not save contact';
};
AFTER.phone = () => {
  const i = $('#pc-name');
  if (!i) return;
  i.onkeydown = e => { if (e.key === 'Enter') ACT.pcsave(); };
  setTimeout(() => i.focus(), 40);
};
LOAD.phone = () => { S.missed = 0; renderHome(); };
ACT.ptab = el => { S.tmp.pTab = el.dataset.v; render(); };
ACT.key = el => { if ((S.tmp.dial || '').length < 12) S.tmp.dial = (S.tmp.dial || '') + el.dataset.v; $('#dial-num').innerHTML = dialHtml(); };
ACT.keydel = () => { S.tmp.dial = (S.tmp.dial || '').slice(0, -1); $('#dial-num').innerHTML = dialHtml(); };
ACT.dialcall = () => { if (S.tmp.dial) startCall(S.tmp.dial); };
ACT.callnum = el => startCall(el.dataset.n);

/* ---------------------------------------------------------------------
   CONTACTS app
   --------------------------------------------------------------------- */
function contactListHtml() {
  const q = (S.tmp.cq || '').toLowerCase();
  const list = (S.data.contacts || []).filter(c => !q || c.name.toLowerCase().includes(q) || c.number.includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) return empty('No contacts', 'user');
  let last = '';
  return list.map(c => {
    const L = (c.name[0] || '#').toUpperCase();
    const h = L !== last ? `<div class="mlabel">${esc(L)}</div>` : '';
    last = L;
    return `${h}<div class="row" data-act="cview" data-id="${c.id}">${mav(c.name)}<div class="grow"><b>${esc(c.name)}</b><small>${esc(sPhone(c.number))}</small></div>${c.favorite ? ic('star', 'fav') : ''}</div>`;
  }).join('');
}
function cShareModal(c) {
  return `<div class="mback"><div class="modal"><h3>Share contact</h3><p>Send ${esc(c.name)} to a player nearby.</p><div class="mmid">${S.tmp.nearby ? (S.tmp.nearby.length ? S.tmp.nearby.map(n => `<div class="row" data-act="cshsend" data-id="${n.id}" data-c="${c.id}">${avatar(n.name)}<div class="grow"><b>${esc(n.name)}</b></div>${ic('send')}</div>`).join('') : '<b>No players nearby.</b><small>Move close to someone with a visible phone.</small>') : '<b>Searching...</b>'}</div><button class="link" data-act="cshrefresh">Refresh nearby players</button><button class="btn full mclose" data-act="cshclose">Close</button></div></div>`;
}
function contactsRoot() {
  const v = S.view;
  if (v && v.t === 'edit') {
    const c = v.id ? (S.data.contacts.find(x => x.id === v.id) || {}) : { name: '', number: v.number || '', favorite: 0 };
    return wrap(hdr(v.id ? 'Edit contact' : 'New contact'), `
      <div class="label">Name</div><input id="c-name" class="input" maxlength="40" value="${esc(c.name)}">
      <div class="label">Number</div><input id="c-num" class="input" maxlength="15" inputmode="numeric" value="${esc(c.number)}">
      <div class="row" data-act="favtoggle"><div class="grow"><b>Favorite</b></div><div id="c-fav" class="toggle ${c.favorite ? 'on' : ''}"></div></div>
      <div class="err" id="c-err"></div>
      <div class="hrow"><button class="btn primary" data-act="csave" data-id="${v.id || ''}">Save</button></div>
      ${v.id ? `<div class="hrow"><button class="btn danger" data-act="cdel" data-id="${v.id}">Delete contact</button></div>` : ''}`);
  }
  if (v && v.t === 'detail') {
    const c = S.data.contacts.find(x => x.id === v.id);
    if (!c) { S.view = null; return contactsRoot(); }
    const blocked = (settings().blocked || []).includes(c.number);
    const act = (cls, a, icn, text, extra = '') => `<div class="cd-a ${cls}"><button data-act="${a}" ${extra}>${ic(icn)}</button><span>${text}</span></div>`;
    const d = `data-id="${c.id}" data-n="${esc(c.number)}"`;
    return `<div class="page"><div class="hdr mh ln"><button class="ib rnd" data-act="back">${ic('arrowl')}</button><div class="hav">${esc(soInit(c.name))}</div><div class="ht"><b>${esc(c.name)}</b><small>${esc(sPhone(c.number))}</small></div></div>
      <div class="body"><div class="cd-hero"><div class="cd-av">${esc(soInit(c.name))}</div><h3>${esc(c.name)}</h3></div>
      <div class="cd-acts">${act('', 'callnum', 'phone', 'Call', d)}${act('', 'mopen', 'message', 'Message', d)}${act('', 'cshare', 'send', 'Share', d)}${act('', 'cedit', 'edit', 'Edit', d)}${act('del', 'cdel', 'trash', 'Delete', d)}</div>
      <div class="mlabel" style="margin-top:18px">Phone Numbers</div><div class="cd-num" data-act="callnum" data-n="${esc(c.number)}">${esc(sPhone(c.number))}</div>
      <div class="cd-block" data-act="cblock" data-n="${esc(c.number)}"><div class="bi">${ic('ban')}</div><div><b>${blocked ? 'Unblock Number' : 'Block Number'}</b><small>${blocked ? 'Allow this number to call and text you' : 'Stop this number calling or texting you'}</small></div></div></div></div>${S.tmp.cshare ? cShareModal(c) : ''}`;
  }
  const n = (S.data.contacts || []).length;
  return `<div class="page"><div class="hdr mh"><h2 class="mt">CONTACTS</h2></div><div class="body">
    <div class="cbar"><span>${n} Contact${n === 1 ? '' : 's'}</span><div><button data-act="cnew">${ic('plus')}</button></div></div>
    <div class="msearch">${ic('search')}<input id="cq" class="input" placeholder="Search" value="${esc(S.tmp.cq || '')}"></div><div id="clist">${contactListHtml()}</div></div></div>`;
}
R.contacts = () => contactsRoot() + msgNav('contacts');
AFTER.contacts = () => {
  const q = $('#cq');
  if (q) q.oninput = e => { S.tmp.cq = e.target.value; $('#clist').innerHTML = contactListHtml(); };
};
ACT.cblock = el => {
  const s = settings(), n = el.dataset.n, l = s.blocked || [];
  s.blocked = l.includes(n) ? l.filter(x => x !== n) : [...l, n];
  saveSettings(); render(); toast('Contacts', s.blocked.includes(n) ? 'Number blocked' : 'Number unblocked', 'settings', true);
};
ACT.cshare = () => { S.tmp.cshare = true; loadNearby(); };
ACT.cshclose = () => { S.tmp.cshare = false; render(); };
ACT.cshrefresh = () => loadNearby();
ACT.cshsend = async el => {
  const c = S.data.contacts.find(x => x.id === +el.dataset.c); if (!c) return;
  const r = await api('share:send', { id: +el.dataset.id, contact: { name: c.name, number: c.number } });
  if (r && r.ok) { S.tmp.cshare = false; render(); toast('Contacts', `Contact sent to ${r.name}`, 'settings', true); }
  else { toast('Contacts', r && r.err === 'airplane' ? 'Turn off airplane mode first' : 'That player is no longer nearby', 'settings', true); loadNearby(); }
};
ACT.cnew = () => setView({ t: 'edit' });
ACT.cedit = el => setView({ t: 'edit', id: +el.dataset.id });
ACT.cview = el => setView({ t: 'detail', id: +el.dataset.id });
ACT.favtoggle = () => $('#c-fav').classList.toggle('on');
ACT.csave = async el => {
  const name = $('#c-name').value.trim(), number = $('#c-num').value.replace(/\D/g, '');
  if (!name || !number) { $('#c-err').textContent = 'Name and number are required'; return; }
  const r = await api('contact:save', { id: el.dataset.id ? +el.dataset.id : null, name, number, favorite: $('#c-fav').classList.contains('on') });
  if (Array.isArray(r)) { S.data.contacts = r; S.view = null; render(); } else $('#c-err').textContent = 'Could not save contact';
};
ACT.cdel = async el => {
  const r = await api('contact:delete', { id: +el.dataset.id });
  if (Array.isArray(r)) { S.data.contacts = r; S.view = null; render(); }
};

/* ---------------------------------------------------------------------
   MESSAGES app
   --------------------------------------------------------------------- */
Object.assign(ICONS, {
  clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  phoneoff: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="3" y1="3" x2="21" y2="21"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
  micoff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/>',
  speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  chevd: '<polyline points="6 9 12 15 18 9"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
});
const EMOJIS = ['😀', '😂', '😅', '😍', '😎', '🤔', '😭', '😡', '👍', '👎', '🙏', '🔥', '💯', '🎉', '❤️', '💀', '👀', '🚗', '💰', '📍'];
const isGroup = k => /^g\d+$/.test(k || '');
const groupOf = k => (S.data.groups || []).find(g => g.key === k);
const threadName = k => isGroup(k) ? ((groupOf(k) || {}).name || 'Group') : label(k);
const memberName = n => contactName(n) || (((S.data.groups || []).flatMap(g => g.members || []).find(m => m.number === n) || {}).name) || fmtPhone(n);
const lastText = m => {
  if (!m) return 'No messages yet';
  const body = m.message ? esc(m.message) : m.loc ? 'Shared location' : 'Photo';
  const me = (S.data.me || {}).phone;
  return isGroup(m.receiver) ? `${esc(m.sender === me ? 'You' : memberName(m.sender))}: ${body}` : body;
};
function conversations() {
  const me = S.data.me.phone, map = new Map();
  for (const m of S.data.messages || []) {
    const o = isGroup(m.receiver) ? m.receiver : (m.sender === me ? m.receiver : m.sender);
    let c = map.get(o);
    if (!c) { c = { n: o, last: m, unread: 0 }; map.set(o, c); }
    if (!isGroup(o) && m.receiver === me && !m.is_read) c.unread++;
  }
  for (const g of S.data.groups || []) if (!map.has(g.key)) map.set(g.key, { n: g.key, last: null, unread: 0 });
  return [...map.values()];
}
const fmtT = ts => { const d = new Date(ts * 1000), h = d.getHours(); return settings().h24 ? `${pad(h)}:${pad(d.getMinutes())}` : `${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`; };
const fmtMDay = ts => { const d = new Date(ts * 1000); return d.toDateString() === new Date().toDateString() ? fmtT(ts) : `${d.getDate()}/${d.getMonth() + 1}`; };
const mav = n => `<div class="mav">${esc(soInit(n))}</div>`;
function chatListHtml() {
  const q = (S.tmp.mq || '').toLowerCase();
  const l = conversations().filter(c => !q || threadName(c.n).toLowerCase().includes(q) || (c.last && String(c.last.message || '').toLowerCase().includes(q)));
  if (!l.length) return empty(q ? 'No chats found' : 'No conversations yet', 'message');
  return l.map(c => `<div class="row ${S.view && S.view.t === 'thread' && S.view.n === c.n ? 'sel' : ''}" data-act="mopen" data-n="${esc(c.n)}">${mav(threadName(c.n))}<div class="grow"><b>${esc(threadName(c.n))}</b><small>${lastText(c.last)}</small></div><div class="meta">${c.last ? fmtMDay(c.last.ts) : ''}${c.unread ? `<br><span class="pill bad">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}</div></div>`).join('');
}
const locCard = (loc, ts, mine) => `<div class="locard ${mine ? 'me' : ''}" data-act="locgo" data-loc="${esc(loc)}"><svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><rect width="160" height="90" fill="#0f5a65"/><path d="M0 72 L38 44 L68 62 L112 22 L160 56 L160 90 L0 90Z" fill="#0c4b55"/><path d="M-5 26 C38 4 72 38 100 70 S150 96 172 80" stroke="#8fbfc2" stroke-width="9" fill="none" opacity=".8"/><g transform="translate(86 40)"><path d="M0 13C-8 3-8-11 0-11S8 3 0 13z" fill="#e53935"/><circle cy="-4" r="3.2" fill="#7b1f1f"/></g></svg><div class="lcf">${ic('pin')}<span>Shared location</span><time>${fmtT(ts)}</time></div></div>`;
const dayLabel = ts => { const d = new Date(ts * 1000), n = new Date(), y = new Date(Date.now() - 864e5); return d.toDateString() === n.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
function threadView(n) {
  const me = S.data.me.phone, grp = isGroup(n);
  const msgs = (S.data.messages || []).filter(m => grp ? m.receiver === n : ((m.sender === n && m.receiver === me) || (m.sender === me && m.receiver === n))).reverse();
  let prev = null, prevDay = null;
  const bubbles = msgs.map(m => {
    const dk = new Date(m.ts * 1000).toDateString(), sep = dk !== prevDay ? `<div class="dsep">${dayLabel(m.ts)}</div>` : '';
    if (dk !== prevDay) prev = null;
    prevDay = dk;
    const mine = m.sender === me, nameTag = grp && !mine && prev !== m.sender ? `<span class="bsn">${esc(memberName(m.sender))}</span>` : '';
    prev = m.sender;
    const inner = m.loc ? locCard(m.loc, m.ts, mine) : `<div class="bubble ${mine ? 'me' : 'them'}">${m.image ? `<img src="${safeImg(m.image)}">` : ''}${m.message ? esc(m.message) : ''}<time>${fmtT(m.ts)}</time></div>`;
    return `${sep}<div class="bw ${mine ? 'me' : 'them'}">${nameTag}${inner}</div>`;
  }).join('');
  const strip = S.tmp.attach ? `<div class="attach">${(S.data.gallery || []).map(g => `<img src="${safeImg(g.url)}" class="${S.tmp.pendingImg === g.url ? 'sel' : ''}" data-act="pick" data-url="${esc(g.url)}">`).join('') || '<small style="color:var(--muted)">Gallery is empty</small>'}</div>` : '';
  const emo = S.tmp.emoji ? `<div class="emojis">${EMOJIS.map(e => `<button data-act="emo" data-e="${e}">${e}</button>`).join('')}</div>` : '';
  const pend = S.tmp.pendingImg ? `<div class="pending"><img src="${safeImg(S.tmp.pendingImg)}"></div>` : '';
  const g = grp ? (groupOf(n) || { members: [] }) : null, nm = threadName(n), muted = !!settings()['mute_' + n], blocked = (settings().blocked || []).includes(n);
  const head = `<div class="hdr mh"><button class="ib rnd" data-act="back">${ic('arrowl')}</button><div class="hav">${esc(soInit(nm))}</div><div class="ht"><b>${esc(nm)}</b><small>${grp ? g.members.length + ' Members' : 'Direct Message'}</small></div><div class="hr"><button class="ib rnd ${muted ? 'on' : ''}" data-act="mpmute">${ic('bell')}</button>${grp ? `<button class="ib rnd" data-act="mpinfo">${ic('info')}</button>` : `<button class="ib rnd" data-act="callnum" data-n="${esc(n)}">${ic('phone')}</button><button class="ib rnd ${blocked ? 'bad' : ''}" data-act="mpblock">${ic('ban')}</button>`}</div></div>`;
  return `<div class="page chat">${head}
    <div class="body"><div class="thread">${bubbles || empty('Say hi!', 'message')}</div></div>
    <div class="composer">${pend}${strip}${emo}<div class="crow"><div class="cpill"><input id="m-text" class="input" maxlength="500" placeholder="Type a message..."><button data-act="emotog">${ic('smile')}</button><button data-act="attach">${ic('clip')}</button><button data-act="mloc">${ic('pin')}</button></div><button class="ib send" data-act="msend">${ic('send')}</button></div></div></div>`;
}
const msgNav = (at = 'messages') => `<div class="mnav"><button class="mk" data-act="dockstep" data-d="-1">Q</button><button class="${at === 'contacts' ? 'on' : ''}" data-act="open" data-id="contacts">${ic('contactcard')}</button><button class="${at === 'messages' ? 'on' : ''}" data-act="open" data-id="messages">${ic('message')}</button><button class="${at === 'phone' ? 'on' : ''}" data-act="pcalls">${ic('phone')}</button><button class="${at === 'keypad' ? 'on' : ''}" data-act="pdial">${ic('dialpad')}</button><button class="mk" data-act="dockstep" data-d="1">E</button></div>`;
function msgRight() {
  const v = S.view;
  if (v && v.t === 'thread') return threadView(v.n);
  if (v && v.t === 'compose') {
    return wrap(hdr('New message'), `<div class="label">To</div><input id="m-to" class="input" inputmode="numeric" maxlength="15" placeholder="Phone number">
      <div class="hrow"><button class="btn primary" data-act="mstart">Start chat</button></div>
      <div class="label">Contacts</div>${(S.data.contacts || []).map(c => `<div class="row" data-act="mopen" data-n="${esc(c.number)}">${avatar(c.name)}<div class="grow"><b>${esc(c.name)}</b><small>${esc(fmtPhone(c.number))}</small></div></div>`).join('') || empty('No contacts', 'user')}`);
  }
  if (v && v.t === 'newgroup') {
    const sel = S.tmp.gsel || (S.tmp.gsel = new Set());
    return wrap(hdr('New group'), `<div class="label">Group name</div><input id="gp-name" class="input" maxlength="40" value="${esc(S.tmp.gpname || '')}">
      <div class="label">Members</div>${(S.data.contacts || []).map(c => `<div class="row" data-act="gptoggle" data-n="${esc(c.number)}">${avatar(c.name)}<div class="grow"><b>${esc(c.name)}</b><small>${esc(fmtPhone(c.number))}</small></div><div class="toggle ${sel.has(c.number) ? 'on' : ''}"></div></div>`).join('') || empty('Add contacts first', 'user')}
      <div class="label">Or add a number</div><input id="gp-num" class="input" inputmode="numeric" maxlength="15" placeholder="Phone number" value="${esc(S.tmp.gpnum || '')}">
      <div class="err" id="gp-err"></div><div class="hrow"><button class="btn primary" data-act="gpcreate">Create group</button></div>`);
  }
  if (v && v.t === 'ginfo') {
    const g = groupOf(v.n);
    if (!g) { S.view = null; return null; }
    return wrap(hdr(g.name), `<div class="label">${g.members.length} Members</div>${g.members.map(m => `<div class="row" style="cursor:default">${avatar(memberName(m.number))}<div class="grow"><b>${esc(memberName(m.number))}</b><small>${esc(fmtPhone(m.number))}</small></div></div>`).join('')}
      <div class="hrow"><button class="btn danger" data-act="gpleave" data-id="${g.id}">Leave group</button></div>`);
  }
  return null;
}
function msgList() {
  const n = conversations().length;
  return `<div class="page"><div class="hdr mh"><h2 class="mt">CHATS</h2></div><div class="body">
    <div class="cbar"><span>${n} Chat${n === 1 ? '' : 's'}</span><div><button data-act="gpnew">${ic('users')}</button><button data-act="mcompose">${ic('plus')}</button></div></div>
    <div class="msearch">${ic('search')}<input id="mq" class="input" placeholder="Search" value="${esc(S.tmp.mq || '')}"></div>
    <div class="mlabel">Chat Contacts</div><div id="chatlist">${chatListHtml()}</div></div></div>`;
}
function msgRoot() {
  const r = msgRight();
  if (!settings().unfold) return r || msgList();
  const right = r ? r.replace('<div class="page', '<div class="page rp') : `<div class="page rp"><div class="mph">${ic('message')}<p>Select a conversation</p></div></div>`;
  return `<div class="msplit">${msgList().replace('<div class="page">', '<div class="page lp">')}${right}</div>`;
}
R.messages = () => msgRoot() + msgNav();
ACT.pcalls = () => { S.tmp.pTab = 'recent'; openApp('phone'); };
ACT.pdial = () => { S.tmp.pTab = 'keypad'; openApp('phone'); };
ACT.mpmute = () => { const s = settings(), k = 'mute_' + S.view.n; if (s[k]) delete s[k]; else s[k] = true; saveSettings(); render(); toast('Messages', s[k] ? 'Chat muted' : 'Chat unmuted', 'messages', true); };
ACT.mpblock = () => {
  const s = settings(), n = S.view.n, l = s.blocked || [];
  s.blocked = l.includes(n) ? l.filter(x => x !== n) : [...l, n];
  saveSettings(); render(); toast('Messages', s.blocked.includes(n) ? 'Number blocked' : 'Number unblocked', 'messages', true);
};
ACT.mpinfo = () => {
  const n = S.view.n;
  if (isGroup(n)) return ACT.gpinfo();
  const c = (S.data.contacts || []).find(x => x.number === n);
  openApp('contacts'); setView(c ? { t: 'detail', id: c.id } : { t: 'edit', number: n });
};
AFTER.messages = () => {
  const inp = $('#m-text');
  if (inp) {
    inp.onkeydown = e => { if (e.key === 'Enter') ACT.msend(); };
    const b = $('#appview .page.chat .body'); if (b) b.scrollTop = b.scrollHeight;
  }
  const q = $('#mq'); if (q) q.oninput = e => { S.tmp.mq = e.target.value; $('#chatlist').innerHTML = chatListHtml(); };
};
function openThread(n) {
  const me = S.data.me.phone;
  let changed = false;
  for (const m of S.data.messages || []) if (m.sender === n && m.receiver === me && !m.is_read) { m.is_read = 1; changed = true; }
  if (changed) api('msg:read', { number: n });
  S.tmp.pendingImg = null; S.tmp.attach = false; S.tmp.emoji = false;
  S.view = { t: 'thread', n };
  if (S.app !== 'messages') { S.app = 'messages'; document.body.classList.add('inapp'); $('#appview').classList.add('on'); }
  render();
}
const keepText = fn => { const t = $('#m-text') ? $('#m-text').value : ''; fn(); render(); if ($('#m-text')) { $('#m-text').value = t; $('#m-text').focus(); } };
ACT.mopen = el => openThread(el.dataset.n);
ACT.mcompose = () => setView({ t: 'compose' });
ACT.mstart = () => { const n = $('#m-to').value.replace(/\D/g, ''); if (n) openThread(n); };
ACT.attach = () => keepText(() => { S.tmp.attach = !S.tmp.attach; S.tmp.emoji = false; });
ACT.emotog = () => keepText(() => { S.tmp.emoji = !S.tmp.emoji; S.tmp.attach = false; });
ACT.emo = el => { const i = $('#m-text'); i.value += el.dataset.e; i.focus(); };
ACT.pick = el => keepText(() => { S.tmp.pendingImg = S.tmp.pendingImg === el.dataset.url ? null : el.dataset.url; });
ACT.msend = async () => {
  const text = $('#m-text').value.trim(), img = S.tmp.pendingImg || '';
  if (!text && !img) return;
  const r = await api('msg:send', { to: S.view.n, message: text, image: img });
  if (r && r.messages) { S.data.messages = r.messages; S.tmp.pendingImg = null; S.tmp.attach = false; S.tmp.emoji = false; render(); renderHome(); }
  else if (r && r.err === 'airplane') toast('Airplane mode', 'Turn it off to send messages', 'settings', true);
};
ACT.mloc = async () => {
  const c = await nui('coords');
  if (!c || !c.loc) return;
  const r = await api('msg:send', { to: S.view.n, message: '', image: '', loc: c.loc });
  if (r && r.messages) { S.data.messages = r.messages; render(); renderHome(); }
  else if (r && r.err === 'airplane') toast('Airplane mode', 'Turn it off to send messages', 'settings', true);
};
ACT.locgo = el => { nui('waypoint', { loc: el.dataset.loc }); toast('Messages', 'Waypoint set on your map', 'messages', true); };
ACT.gpnew = () => { S.tmp.gsel = new Set(); S.tmp.gpname = ''; S.tmp.gpnum = ''; setView({ t: 'newgroup' }); };
ACT.gptoggle = el => {
  const sel = S.tmp.gsel || (S.tmp.gsel = new Set());
  S.tmp.gpname = $('#gp-name').value; S.tmp.gpnum = $('#gp-num').value;
  sel.has(el.dataset.n) ? sel.delete(el.dataset.n) : sel.add(el.dataset.n); render();
};
ACT.gpcreate = async () => {
  const name = $('#gp-name').value.trim(), extra = $('#gp-num').value.replace(/\D/g, '');
  const numbers = [...(S.tmp.gsel || [])]; if (extra) numbers.push(extra);
  if (!name || !numbers.length) { $('#gp-err').textContent = 'Enter a name and pick at least one member'; return; }
  const r = await api('group:create', { name, numbers });
  if (Array.isArray(r) && r.length) { S.data.groups = r; S.tmp.gsel = null; openThread(r[0].key); }
  else $('#gp-err').textContent = 'Could not create the group';
};
ACT.gpinfo = () => setView({ t: 'ginfo', n: S.view.n });
ACT.gpleave = async el => {
  const r = await api('group:leave', { id: +el.dataset.id });
  if (Array.isArray(r)) { S.data.groups = r; S.data.messages = (S.data.messages || []).filter(m => !isGroup(m.receiver) || r.some(g => g.key === m.receiver)); S.view = null; render(); }
};

/* ---------------------------------------------------------------------
   GALLERY app
   --------------------------------------------------------------------- */
const favs = () => settings().favs || [];
function galFiltered() {
  const q = (S.tmp.gq || '').toLowerCase(), al = S.tmp.album;
  return (S.data.gallery || []).filter(g => {
    if (S.tmp.gfav && !favs().includes(g.id)) return false;
    if (al === 'fav' && !favs().includes(g.id)) return false;
    if (al && al !== 'fav' && monthKey(g.ts) !== al) return false;
    return !q || `${fmtDate(g.ts)} ${fmtClock(g.ts)}`.toLowerCase().includes(q);
  });
}
const monthKey = ts => { const d = new Date(ts * 1000); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthLabel = k => new Date(k + '-01T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
function galGridHtml() {
  const l = galFiltered();
  return l.length ? `<div class="gal">${l.map(g => `<div class="gi"><img src="${safeImg(g.url)}" data-act="gview" data-id="${g.id}">${favs().includes(g.id) ? `<span class="gh">${ic('heart')}</span>` : ''}</div>`).join('')}</div>` : empty('No photos found', 'image');
}
R.gallery = () => {
  const v = S.view, list = S.data.gallery || [];
  if (v && v.t === 'img') {
    const g = list.find(x => x.id === v.id);
    if (!g) { S.view = null; return R.gallery(); }
    const f = favs().includes(g.id);
    return wrap(hdr('Photo', { right: `<button class="ib ${f ? 'red' : ''}" data-act="gfav" data-id="${g.id}">${ic('heart')}</button><button class="ib red" data-act="gdel" data-id="${g.id}">${ic('trash')}</button>` }), `<div class="viewer"><img src="${safeImg(g.url)}"><small style="color:var(--muted)">${fmtDate(g.ts)} ${fmtClock(g.ts)}</small></div>`);
  }
  const tab = S.tmp.gTab || 'all', al = S.tmp.album;
  let body;
  if (tab === 'albums' && !al) {
    const months = [...new Set(list.map(g => monthKey(g.ts)))];
    const row = (k, name, n) => `<div class="row" data-act="galbum" data-k="${k}"><div class="i a-dark" style="width:36px;height:36px;border-radius:10px;flex:none">${ic(k === 'fav' ? 'heart' : 'image')}</div><div class="grow"><b>${esc(name)}</b><small>${n} photo${n === 1 ? '' : 's'}</small></div>${ic('chevr')}</div>`;
    body = `<div class="card" style="padding:4px">${row('fav', 'Favorites', list.filter(g => favs().includes(g.id)).length)}${months.map(k => row(k, monthLabel(k), list.filter(g => monthKey(g.ts) === k).length)).join('')}</div>`;
  } else {
    body = `<input id="g-q" class="input" placeholder="Search by date" value="${esc(S.tmp.gq || '')}" style="margin-bottom:10px"><div id="g-grid">${galGridHtml()}</div>`;
  }
  const head = hdr(al ? (al === 'fav' ? 'Favorites' : monthLabel(al)) : 'Gallery', { right: `<button class="ib ${S.tmp.gfav ? 'red' : ''}" data-act="gfilter">${ic('heart')}</button><button class="ib accent" data-act="open" data-id="camera">${ic('camera')}</button>` });
  return `<div class="page">${head}<div class="body">${body}</div><div class="gtabs"><button class="${tab === 'all' ? 'on' : ''}" data-act="gtab" data-t="all">${ic('image')}<span>All Photos</span></button><button class="${tab === 'albums' ? 'on' : ''}" data-act="gtab" data-t="albums">${ic('folder')}<span>Albums</span></button></div></div>`;
};
AFTER.gallery = () => { const q = $('#g-q'); if (q) q.oninput = e => { S.tmp.gq = e.target.value; $('#g-grid').innerHTML = galGridHtml(); }; };
ACT.gtab = el => { S.tmp.gTab = el.dataset.t; S.tmp.album = null; S.view = null; render(); };
ACT.galbum = el => { S.tmp.album = el.dataset.k; render(); };
ACT.gfilter = () => { S.tmp.gfav = !S.tmp.gfav; render(); };
ACT.gfav = el => { const s = settings(), id = +el.dataset.id; s.favs = favs().includes(id) ? favs().filter(x => x !== id) : [...favs(), id]; saveSettings(); render(); };
ACT.gview = el => setView({ t: 'img', id: +el.dataset.id });
ACT.gdel = async el => { const r = await api('gallery:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.gallery = r; S.view = null; render(); } };

/* ---------------------------------------------------------------------
   NOTES app
   --------------------------------------------------------------------- */
R.notes = () => {
  const v = S.view;
  if (v && v.t === 'edit') {
    const n = v.id ? (S.data.notes.find(x => x.id === v.id) || {}) : { title: '', content: '' };
    return wrap(hdr(v.id ? 'Edit note' : 'New note', { right: v.id ? `<button class="ib red" data-act="ndel" data-id="${v.id}">${ic('trash')}</button>` : '' }), `
      <input id="n-title" class="input" maxlength="60" placeholder="Title" value="${esc(n.title)}" style="margin-bottom:8px">
      <textarea id="n-body" class="textarea" maxlength="4000" placeholder="Write something...">${esc(n.content)}</textarea>
      <div class="hrow"><button class="btn primary" data-act="nsave" data-id="${v.id || ''}">${ic('check')}Save</button></div>`);
  }
  const list = S.data.notes || [];
  return wrap(hdr('Notes', { right: `<button class="ib accent" data-act="nnew">${ic('plus')}</button>` }),
    list.length ? list.map(n => `<div class="card" data-act="nedit" data-id="${n.id}" style="cursor:pointer"><b>${esc(n.title)}</b><p style="color:var(--muted);font-size:12.5px;margin-top:4px;max-height:36px;overflow:hidden">${esc((n.content || '').slice(0, 140))}</p><small style="color:var(--muted);font-size:11px">${fmtDate(n.ts)}</small></div>`).join('') : empty('No notes yet', 'note'));
};
ACT.nnew = () => setView({ t: 'edit' });
ACT.nedit = el => setView({ t: 'edit', id: +el.dataset.id });
ACT.nsave = async el => {
  const r = await api('notes:save', { id: el.dataset.id ? +el.dataset.id : null, title: $('#n-title').value, content: $('#n-body').value });
  if (Array.isArray(r)) { S.data.notes = r; S.view = null; render(); }
};
ACT.ndel = async el => { const r = await api('notes:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.notes = r; S.view = null; render(); } };

/* ---------------------------------------------------------------------
   CALENDAR app
   --------------------------------------------------------------------- */
function calState() {
  if (!S.tmp.cal) { const d = new Date(); S.tmp.cal = { y: d.getFullYear(), m: d.getMonth(), sel: todayStr() }; }
  return S.tmp.cal;
}
R.calendar = () => {
  const c = calState(), v = S.view;
  if (v && v.t === 'add') {
    return wrap(hdr('New event'), `
      <div class="label">Title</div><input id="e-title" class="input" maxlength="60">
      <div class="two"><div><div class="label">Date</div><input id="e-date" type="date" class="input" value="${c.sel}"></div><div><div class="label">Time</div><input id="e-time" type="time" class="input"></div></div>
      <div class="label">Note</div><input id="e-note" class="input" maxlength="200">
      <div class="err" id="e-err"></div><div class="hrow"><button class="btn primary" data-act="esave">Save event</button></div>`);
  }
  const first = new Date(c.y, c.m, 1), days = new Date(c.y, c.m + 1, 0).getDate(), off = (first.getDay() + 6) % 7;
  const has = new Set((S.data.calendar || []).map(e => e.date));
  const t = todayStr();
  let grid = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => `<div class="dow">${d}</div>`).join('') + '<div></div>'.repeat(off);
  for (let d = 1; d <= days; d++) {
    const ds = `${c.y}-${pad(c.m + 1)}-${pad(d)}`;
    grid += `<div class="d ${ds === t ? 'today' : ''} ${ds === c.sel ? 'sel' : ''} ${has.has(ds) ? 'has' : ''}" data-act="csel" data-d="${ds}">${d}</div>`;
  }
  const events = (S.data.calendar || []).filter(e => e.date === c.sel);
  const mname = first.toLocaleString('en-US', { month: 'long' });
  return wrap(hdr('Calendar', { right: `<button class="ib accent" data-act="eadd">${ic('plus')}</button>` }), `
    <div class="cal-h"><button class="ib" data-act="cnav" data-d="-1">${ic('chev')}</button><b>${mname} ${c.y}</b><button class="ib" data-act="cnav" data-d="1">${ic('chevr')}</button></div>
    <div class="cal-g">${grid}</div>
    <div class="label">${esc(c.sel)}</div>
    ${events.length ? events.map(e => `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(e.title)}</b><button class="ib red" style="width:30px;height:30px" data-act="edel" data-id="${e.id}">${ic('trash')}</button></div><small style="color:var(--muted)">${esc(e.time || 'All day')}${e.note ? ' · ' + esc(e.note) : ''}</small></div>`).join('') : '<div style="color:var(--muted);padding:6px 4px">No events</div>'}`);
};
ACT.csel = el => { calState().sel = el.dataset.d; render(); };
ACT.cnav = el => { const c = calState(); c.m += +el.dataset.d; if (c.m < 0) { c.m = 11; c.y--; } if (c.m > 11) { c.m = 0; c.y++; } render(); };
ACT.eadd = () => setView({ t: 'add' });
ACT.esave = async () => {
  const r = await api('calendar:save', { title: $('#e-title').value, date: $('#e-date').value, time: $('#e-time').value, note: $('#e-note').value });
  if (Array.isArray(r)) { S.data.calendar = r; calState().sel = $('#e-date').value || calState().sel; S.view = null; render(); } else $('#e-err').textContent = 'Title and date are required';
};
ACT.edel = async el => { const r = await api('calendar:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.calendar = r; render(); } };

/* ---------------------------------------------------------------------
   CALCULATOR app
   --------------------------------------------------------------------- */
R.calculator = () => {
  const keys = [['C', 'fn'], ['±', 'fn'], ['%', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['-', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['0', 'zero'], ['.'], ['=', 'op']];
  return `<div class="page">${hdr('Calculator')}<div class="calc"><div class="disp" id="cdisp">${esc((S.tmp.calc || {}).d || '0')}</div><div class="keys">${keys.map(([k, c]) => `<button class="${c || ''}" data-act="calc" data-k="${k}">${k}</button>`).join('')}</div></div></div>`;
};
function calcEval(a, b, op) {
  switch (op) { case '+': return a + b; case '-': return a - b; case '×': return a * b; case '÷': return b === 0 ? NaN : a / b; }
  return b;
}
const calcFmt = r => (Number.isFinite(r) ? String(+r.toPrecision(10)) : 'Error');
ACT.calc = el => {
  const k = el.dataset.k;
  let c = S.tmp.calc || (S.tmp.calc = { d: '0', a: null, op: null, f: true });
  if (c.d === 'Error' && k !== 'C') c = S.tmp.calc = { d: '0', a: null, op: null, f: true };
  if (/^\d$/.test(k)) { c.d = (c.f || c.d === '0') ? k : c.d + k; c.f = false; }
  else if (k === '.') { if (c.f) { c.d = '0.'; c.f = false; } else if (!c.d.includes('.')) c.d += '.'; }
  else if (k === 'C') { S.tmp.calc = null; $('#cdisp').textContent = '0'; return; }
  else if (k === '±') c.d = calcFmt(-parseFloat(c.d));
  else if (k === '%') { c.d = calcFmt(parseFloat(c.d) / 100); c.f = true; }
  else {
    const cur = parseFloat(c.d);
    if (c.op && !c.f) { const r = calcEval(c.a, cur, c.op); c.d = calcFmt(r); c.a = r; } else c.a = cur;
    c.op = k === '=' ? null : k; c.f = true;
  }
  $('#cdisp').textContent = c.d.length > 12 ? Number(c.d).toExponential(5) : c.d;
};

/* ---------------------------------------------------------------------
   GARAGE app
   --------------------------------------------------------------------- */
R.garage = () => {
  const list = S.tmp.garage;
  if (!list) return wrap(hdr('Garage'), empty('Loading...', 'car'));
  const st = { 0: 'Out', 1: 'Garaged', 2: 'Impounded' };
  const v = S.view && S.view.t === 'veh' ? list.find(x => x.plate === S.view.plate) : null;
  if (v) {
    const f = (l, val) => `<div><div class="gl">${l}</div><div class="gv">${esc(val)}</div></div>`;
    return wrap(hdr('Vehicle Details'), `
      <div style="margin-bottom:12px">${f('Vehicle', `${v.brand} ${v.name}`.trim())}</div>
      <div class="two" style="margin-bottom:12px">${f('Plate', v.plate)}${f('Garage', v.garage || '-')}</div>
      <div class="two" style="margin-bottom:12px">${f('Status', st[v.state] || st[1])}${f('Fuel', v.fuel + '%')}</div>
      <div class="two">${f('Engine', v.engine + '%')}${f('Body', v.body + '%')}</div>`);
  }
  return wrap(hdr('Garage'), `<div class="card" style="padding:10px 12px;margin-bottom:10px;font-size:12.5px;color:var(--muted)">Manage your vehicles</div>` +
    (list.length ? `<div class="card" style="padding:4px">${list.map(x => `<div class="row" data-act="veh" data-plate="${esc(x.plate)}"><div class="i a-dark" style="width:34px;height:34px;border-radius:10px;flex:none">${ic('car')}</div><div class="grow"><b>${esc(x.brand)} ${esc(x.name)}</b><small>${esc(x.plate)}</small></div>${ic('chevr')}</div>`).join('')}</div>` : empty('You do not own any vehicles', 'car')));
};
ACT.veh = el => setView({ t: 'veh', plate: el.dataset.plate });
LOAD.garage = async () => { const r = await api('garage'); S.tmp.garage = Array.isArray(r) ? r : []; if (S.app === 'garage') render(); };

/* ---------------------------------------------------------------------
   LICENSES app
   --------------------------------------------------------------------- */
const LICS = [['driver', 'Driver License', 'car'], ['business', 'Business License', 'briefcase'], ['weapon', 'Weapon License', 'shield']];
function licListHtml() {
  const lic = S.data.licenses || {}, q = (S.tmp.lq || '').toLowerCase();
  const rows = LICS.filter(([k, n]) => !q || n.toLowerCase().includes(q));
  if (!rows.length) return empty('No licenses found', 'idcard');
  return rows.map(([k, n, i]) => `<div class="row" data-act="lic" data-k="${k}"><div class="i" style="width:36px;height:36px;border-radius:10px;flex:none;background:${lic[k] ? '#14c8a0' : '#3b4a4a'};color:#0b2b25">${ic(i)}</div><div class="grow"><small>${lic[k] ? 'Valid' : 'Not recorded'}</small><b style="font-size:15px">${n}</b></div>${ic('chevr')}</div>`).join('');
}
R.licenses = () => {
  const me = S.data.me || {}, lic = S.data.licenses || {};
  const v = S.view && S.view.t === 'lic' ? LICS.find(x => x[0] === S.view.k) : null;
  if (v) return wrap(hdr(v[1]), `
    <div class="idcard"><div style="display:flex;justify-content:space-between;align-items:center"><small style="opacity:.8;letter-spacing:1px">STATE ID</small>${ic('idcard')}</div><h3>${esc(me.name)}</h3>
      <div class="kv"><div><span>Citizen ID</span><b>${esc(me.citizenid)}</b></div><div><span>Phone</span><b>${esc(fmtPhone(me.phone))}</b></div><div><span>Date of birth</span><b>${esc(me.birthdate)}</b></div><div><span>Nationality</span><b>${esc(me.nationality)}</b></div></div></div>
    <div class="gl">Status</div><div class="gv">${lic[v[0]] ? 'Valid' : 'Not recorded'}</div>`);
  const n = LICS.filter(x => lic[x[0]]).length;
  return wrap(hdr('Licenses'), `<div class="card" style="padding:10px 12px;margin-bottom:10px;font-size:12.5px;color:var(--muted)">${n} License${n === 1 ? '' : 's'}</div>
    <input id="l-q" class="input" placeholder="Search" value="${esc(S.tmp.lq || '')}" style="margin-bottom:10px">
    <div class="card" style="padding:4px" id="l-list">${licListHtml()}</div>`);
};
AFTER.licenses = () => { const q = $('#l-q'); if (q) q.oninput = e => { S.tmp.lq = e.target.value; $('#l-list').innerHTML = licListHtml(); }; };
ACT.lic = el => setView({ t: 'lic', k: el.dataset.k });

/* ---------------------------------------------------------------------
   BUSINESS app
   --------------------------------------------------------------------- */
const BIZ_LOGO = '<svg viewBox="0 0 56 48"><path d="M18 12v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="3" y="12" width="44" height="30" rx="6" fill="#fff"/><circle cx="43" cy="37" r="12" fill="#0b4fb8"/><circle cx="43" cy="37" r="9" fill="#fff"/><path d="M43 31v6l4 2.500" stroke="#0b4fb8" stroke-width="2.400" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
Object.assign(ICONS, {
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M18.500 9.500a4 4 0 0 1 0 5"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  swap: '<path d="M4 8h14M18 8l-3-3M18 8l-3 3"/><path d="M20 16H6M6 16l3-3M6 16l3 3"/>',
});
const BZ_NAV = [['home', 'home'], ['news', 'megaphone'], ['profile', 'user'], ['staff', 'users'], ['settings', 'settings']];
const bz = () => S.tmp.bz || (S.tmp.bz = { tab: 'home', id: null, list: [], invites: [], d: null, q: '', max: 3 });
const BZ_ERR = {
  name: 'Please enter a valid name', limit: 'You reached the business limit', denied: 'You are not allowed to do that', missing: 'Business not found',
  closed: 'Hiring is closed for this business', invalid: 'State ID is not valid', notfound: 'No citizen found with this State ID', member: 'Already an employee',
  invited: 'Already invited', owner: 'The owner cannot do that', exists: 'This role already exists', role: 'Role not found', protected: 'This role cannot be removed', empty: 'Fill in every field',
};
const bzErr = r => BZ_ERR[(r || {}).err] || 'Something went wrong';
const bzDate = ts => { const d = new Date(ts * 1000); return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`; };

async function bzLoadList() {
  const r = await api('biz:list');
  if (!r || !Array.isArray(r.list)) return;
  const s = bz(); s.list = r.list; s.invites = r.invites || []; s.max = r.max || 3;
  if (s.id && !s.list.some(b => b.id === s.id)) { s.id = null; s.d = null; s.tab = 'home'; }
  if (S.app === 'business' && S.tmp.bizOn) render();
}
async function bzLoadDetail(id) {
  const s = bz(), r = await api('biz:get', { id });
  if (r && r.business) { s.d = r; s.id = id; } else { s.d = null; s.id = null; s.tab = 'home'; }
  if (S.app === 'business') render();
}
LOAD.business = () => {
  const t = S.bizT = (S.bizT || 0) + 1;
  S.tmp.bizOn = false;
  bzLoadList();
  setTimeout(() => { if (S.bizT !== t || S.app !== 'business') return; S.tmp.bizOn = true; render(); }, 1400);
};

const bzSearch = (ph, val) => `<div class="bz-search">${ic('search')}<input id="bz-q" placeholder="${ph}" value="${esc(val || '')}" autocomplete="off" spellcheck="false"></div>`;
const bzTitle = (t, btn) => `<div class="bz-tt"><h2>${t}</h2>${btn || ''}</div>`;
const bzPlus = act => `<button class="bz-sq blue" data-act="${act}">${ic('plus')}</button>`;
const bzEmpty = (t, i = '!') => `<div class="bz-empty"><div class="bz-ring"><span>${i}</span></div><b>${t}</b></div>`;
const bzNav = keys => `<div class="bz-nav">${keys ? '<button class="bz-key" data-act="dockstep" data-d="-1">Q</button>' : ''}${BZ_NAV.map(([k, i]) => `<button class="bz-nb ${bz().tab === k ? 'on' : ''}" data-act="bznav" data-k="${k}">${ic(i)}</button>`).join('')}${keys ? '<button class="bz-key" data-act="dockstep" data-d="1">E</button>' : ''}</div>`;
// form screen: title/subtitle with close button, fields, then Create + Cancel
function bzForm(o) {
  const fields = o.fields.map(f => `<label class="bz-lbl">${f.label} <span id="c-${f.id}">(${(f.val || '').length}/${f.max})</span></label>${f.area ? `<textarea id="${f.id}" class="bz-in area" maxlength="${f.max}" placeholder="${f.ph}" data-req="1">${esc(f.val || '')}</textarea>` : `<input id="${f.id}" class="bz-in" maxlength="${f.max}" placeholder="${f.ph}" value="${esc(f.val || '')}" data-req="1" ${f.re ? `data-re="${f.re}" data-msg="${f.msg}"` : ''} autocomplete="off" spellcheck="false">`}`).join('');
  return `<div class="bz-fh"><div><b>${o.title}</b><small>${o.sub}</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div>
    <div class="bz-scroll">${fields}<div class="bz-err" id="bz-err"></div></div>
    <div class="bz-fb"><button class="bz-pb" id="bz-go" data-act="${o.act}" disabled>${o.submit}</button><button class="bz-ob" data-act="bzclose">Cancel</button></div>`;
}
const bzVal = id => ((document.getElementById(id) || {}).value || '').trim();

function bzBody() {
  const s = bz(), v = S.view, d = s.d;
  if (v && v.t === 'create') return { html: bzForm({ title: 'Create Business', sub: 'Create a New Business', act: 'bzcreate', submit: 'Create Business', fields: [{ id: 'f-name', label: 'Business Name', max: 30, ph: 'Name' }, { id: 'f-desc', label: 'Business Description', max: 42, ph: 'Description', area: true }] }), form: true };
  if (v && v.t === 'invites') {
    return { form: true, html: `<div class="bz-fh"><div><b>Invitations</b><small>Businesses that want you</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll">${s.invites.length ? s.invites.map(i => `<div class="bz-card"><div class="bz-ct"><div class="bz-bi">${ic('building')}</div><div class="grow"><b>${esc(i.business)}</b><small>Invited by ${esc(i.invited_by)}</small></div></div><div class="bz-ab"><button class="bz-pb sm" data-act="bzanswer" data-id="${i.id}" data-a="1">Accept</button><button class="bz-ob sm" data-act="bzanswer" data-id="${i.id}" data-a="0">Decline</button></div></div>`).join('') : bzEmpty('No Invitations Found')}</div>` };
  }
  if (s.tab === 'home') {
    const list = s.list.filter(b => b.name.toLowerCase().includes(s.q.trim().toLowerCase()));
    return { html: `<div class="bz-scroll"><div class="bz-top">${bzSearch('Search something...', s.q)}<button class="bz-sq" data-act="bzinv">${ic('mail')}${s.invites.length ? `<i>${s.invites.length}</i>` : ''}</button>${bzPlus('bzcreateform')}</div><div id="bz-list">${bzCards(list)}</div></div>` };
  }
  if (!d) return { html: `<div class="bz-scroll">${s.id ? bzEmpty('Loading...', '…') : bzEmpty('Open a business first', ic('building'))}</div>` };
  const me = d.me;
  if (v && v.t === 'announce') return { form: true, html: bzForm({ title: 'Create Announcement', sub: 'Make an Announcement for the employees', act: 'bzannounce', submit: 'Create', fields: [{ id: 'f-title', label: 'Title', max: 30, ph: 'Title' }, { id: 'f-msg', label: 'Message', max: 400, ph: 'Description', area: true }] }) };
  if (v && v.t === 'invite') return { form: true, html: bzForm({ title: 'Invite Employee', sub: 'Send an invitation by State ID', act: 'bzsendinvite', submit: 'Send Invite', fields: [{ id: 'f-sid', label: 'State ID', max: 20, ph: 'State ID', re: '^[A-Za-z0-9]{3,20}$', msg: 'State ID is not valid' }] }).replace(/ <span id="c-f-sid">[^<]*<\/span>/, '') };
  if (v && v.t === 'editprofile') return { form: true, html: bzForm({ title: 'Edit Profile', sub: 'Change the name shown to your coworkers', act: 'bzsaveprofile', submit: 'Save', fields: [{ id: 'f-pname', label: 'Display name', max: 30, ph: 'Name', val: me.name }] }) };
  if (v && v.t === 'desc') return { form: true, html: bzForm({ title: 'Edit Description', sub: 'Describe your business', act: 'bzsavedesc', submit: 'Save', fields: [{ id: 'f-desc2', label: 'Business Description', max: 42, ph: 'Description', area: true, val: d.business.description }] }) };
  if (v && v.t === 'addrole') return { form: true, html: bzForm({ title: 'New Role', sub: 'Create a role for your employees', act: 'bzaddrole', submit: 'Create Role', fields: [{ id: 'f-role', label: 'Role Name', max: 20, ph: 'Role' }] }).replace('<div class="bz-err" id="bz-err"></div>', `<label class="bz-chk"><input type="checkbox" id="f-mgr"> Can manage the business (announcements, hiring)</label><div class="bz-err" id="bz-err"></div>`) };
  if (v && v.t === 'roles') return { html: `<div class="bz-fh"><div><b>Manage Roles</b><small>Roles available to employees</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll">${d.roles.map(r => `<div class="bz-row"><div class="bz-ic">${ic('shield')}</div><div class="grow"><b>${esc(r.name)}</b><small>${+r.manage ? 'Can manage' : 'Standard'}</small></div>${r.name === 'Employee' ? '' : `<button class="bz-del" data-act="bzdelrole" data-n="${esc(r.name)}">${ic('trash')}</button>`}</div>`).join('')}<button class="bz-pb" data-act="bzaddroleform" style="margin-top:8px">New Role</button></div>` };
  if (v && v.t === 'hiring') return { html: `<div class="bz-fh"><div><b>Manage Hiring</b><small>Decide whether you can invite people</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll"><div class="bz-row" style="cursor:default"><div class="bz-ic">${ic('briefcase')}</div><div class="grow"><b>Accepting new employees</b><small>${d.business.hiring ? 'Hiring is open' : 'Hiring is closed'}</small></div>${toggle('bzhire', d.business.hiring)}</div></div>` };
  if (v && v.t === 'dissolve') return { form: true, html: `<div class="bz-fh"><div><b>Dissolve Business</b><small>This cannot be undone</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll"><div class="bz-warn">All employees, roles and announcements of <b>${esc(d.business.name)}</b> will be deleted permanently.</div><div class="bz-err" id="bz-err"></div></div><div class="bz-fb"><button class="bz-pb red" data-act="bzdissolve">Dissolve Business</button><button class="bz-ob" data-act="bzclose">Cancel</button></div>` };
  if (v && v.t === 'transfer') { const others = d.employees.filter(e => e.citizenid !== me.citizenid); return { html: `<div class="bz-fh"><div><b>Transfer Ownership</b><small>Pick the new owner</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll">${others.length ? others.map(e => `<div class="bz-row" data-act="bztransfer" data-c="${esc(e.citizenid)}"><div class="bz-ic">${ic('user')}</div><div class="grow"><b>${esc(e.name)}</b><small>${esc(e.role)}</small></div></div>`).join('') : bzEmpty('No Employees Found')}<div class="bz-err" id="bz-err"></div></div>` }; }
  if (v && v.t === 'emp') {
    const e = d.employees.find(x => x.citizenid === v.c);
    if (!e) return { html: `<div class="bz-scroll">${bzEmpty('Employee not found')}</div>` };
    const canEdit = me.manage && e.role !== 'Owner' && e.citizenid !== me.citizenid;
    return { html: `<div class="bz-fh"><div><b>Employee</b><small>${esc(d.business.name)}</small></div><button class="bz-x" data-act="bzclose">${ic('x')}</button></div><div class="bz-scroll">${bzPerson(e)}${canEdit ? `<div class="bz-sec">Role</div><div class="bz-chips">${d.roles.filter(r => me.owner || !+r.manage).map(r => `<button class="${e.role === r.name ? 'on' : ''}" data-act="bzsetrole" data-c="${esc(e.citizenid)}" data-r="${esc(r.name)}">${esc(r.name)}</button>`).join('')}</div><button class="bz-ob red" data-act="bzremove" data-c="${esc(e.citizenid)}" style="margin-top:14px">Remove Employee</button>` : ''}<div class="bz-err" id="bz-err"></div></div>` };
  }
  if (s.tab === 'news') {
    return { html: `<div class="bz-scroll">${bzTitle('Announcements', me.manage ? bzPlus('bzannounceform') : '')}${d.news.length ? d.news.map(n => `<div class="bz-card"><div class="bz-nt"><b>${esc(n.title)}</b>${me.manage ? `<button class="bz-del" data-act="bzdelnews" data-id="${n.id}">${ic('trash')}</button>` : ''}</div><p>${esc(n.message)}</p><small>${esc(n.author)} · ${bzDate(n.ts)}</small></div>`).join('') : bzEmpty('No Announcements Found')}</div>` };
  }
  if (s.tab === 'profile') {
    return { html: `<div class="bz-scroll">${bzTitle('Profile', `<button class="bz-sq blue" data-act="bzeditprofile">${ic('edit')}</button>`)}${bzPerson({ name: me.name, role: me.role })}<div class="bz-sec">Information about Employee</div>
      <div class="bz-info"><span>Employee Role</span><b>${esc(me.role)}</b></div><div class="bz-info"><span>Hired Date</span><b>${esc(me.hired || '-')}</b></div>
      <div class="bz-info"><span>Business</span><b>${esc(d.business.name)}</b></div></div>` };
  }
  if (s.tab === 'staff') {
    const list = d.employees.filter(e => e.name.toLowerCase().includes(s.q.trim().toLowerCase()));
    return { html: `<div class="bz-scroll">${bzTitle('Employees')}<div class="bz-top">${bzSearch('Search something...', s.q)}${me.manage ? bzPlus('bzinviteform') : ''}</div><div id="bz-slist">${bzStaff(list)}</div></div>` };
  }
  const items = me.owner ? [['bzroles', 'shield', 'Manage Roles'], ['bzdescform', 'edit', 'Edit Description'], ['bzhiring', 'briefcase', 'Manage Hiring'], ['bzdissolveform', 'ban', 'Dissolve Business'], ['bztransferform', 'swap', 'Transfer Ownership']] : [['bzleave', 'ban', 'Leave Business']];
  return { html: `<div class="bz-scroll">${bzTitle('Business Settings')}${items.map(([a, i, t]) => `<div class="bz-row menu" data-act="${a}"><div class="bz-ic">${ic(i)}</div><div class="grow"><b>${t}</b></div></div>`).join('')}<div class="bz-err" id="bz-err"></div></div>` };
}
const bzPerson = p => `<div class="bz-row" style="cursor:default"><div class="bz-ic">${ic('user')}</div><div class="grow"><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div></div>`;
const bzStaff = list => list.length ? list.map(e => `<div class="bz-row" data-act="bzemp" data-c="${esc(e.citizenid)}"><div class="bz-ic">${ic('user')}</div><div class="grow"><b>${esc(e.name)}</b><small>${esc(e.role)}</small></div></div>`).join('') : bzEmpty('No Employees Found');
const bzCards = list => list.length ? list.map(b => `<div class="bz-card click" data-act="bzopen" data-id="${b.id}"><div class="bz-ct"><div class="bz-bi">${ic('building')}</div><div class="grow"><b>${esc(b.name)}</b><small>${esc(b.description || 'No description')}</small><em>${esc(b.role)}</em></div></div>
  <div class="bz-cf"><span>${ic('user')}${esc(b.owner_name || '-')}</span><span>${ic('users')}${b.employees} Employee${b.employees === 1 ? '' : 's'}</span></div></div>`).join('') : bzEmpty('No Businesses Yet');

R.business = () => {
  if (!S.tmp.bizOn) return `<div class="page biz-splash"><div class="biz-logo">${BIZ_LOGO}<span>Business</span></div><small>ENJOY YOUR BUSINESS</small></div>`;
  const b = bzBody();
  return `<div class="page bz">${b.html}${bzNav(!b.form)}</div>`;
};
AFTER.business = () => {
  const s = bz(), q = $('#bz-q');
  if (q) q.oninput = e => {
    s.q = e.target.value; const t = s.q.trim().toLowerCase();
    if (s.tab === 'home') $('#bz-list').innerHTML = bzCards(s.list.filter(x => x.name.toLowerCase().includes(t)));
    else $('#bz-slist').innerHTML = bzStaff(s.d.employees.filter(x => x.name.toLowerCase().includes(t)));
  };
  const go = $('#bz-go');
  if (go) {
    const ins = [...document.querySelectorAll('.bz-in')];
    const check = () => {
      let ok = true, msg = '';
      ins.forEach(i => {
        const c = $('#c-' + i.id); if (c) c.textContent = `(${i.value.length}/${i.maxLength})`;
        const v = i.value.trim();
        if (!v) ok = false;
        else if (i.dataset.re && !new RegExp(i.dataset.re).test(v)) { ok = false; msg = i.dataset.msg; }
      });
      go.disabled = !ok; const e = $('#bz-err'); if (e) e.textContent = msg;
    };
    ins.forEach(i => { i.oninput = check; i.onkeydown = e => { if (e.key === 'Enter' && !i.matches('textarea') && !go.disabled) go.click(); }; });
    check();
    if (ins[0]) setTimeout(() => ins[0].focus(), 50);
  }
};

const bzSet = r => { if (r && r.ok && r.state) { bz().d = r.state; return true; } return false; };
const bzFail = r => { const e = $('#bz-err'); if (e) e.textContent = bzErr(r); else toast('Business', bzErr(r), 'business', true); };
ACT.bznav = el => { const s = bz(); s.tab = el.dataset.k; s.q = ''; S.view = null; if (s.tab !== 'home' && !s.id && s.list.length === 1) { bzLoadDetail(s.list[0].id); } render(); };
ACT.bzclose = () => { S.view = null; render(); };
ACT.bzcreateform = () => setView({ t: 'create' });
ACT.bzinv = () => setView({ t: 'invites' });
ACT.bzopen = async el => { const s = bz(); s.tab = 'news'; s.id = +el.dataset.id; s.d = null; s.q = ''; render(); await bzLoadDetail(s.id); };
ACT.bzcreate = async () => {
  const r = await api('biz:create', { name: bzVal('f-name'), description: bzVal('f-desc') });
  if (r && r.ok) { S.view = null; await bzLoadList(); toast('Business', 'Business created', 'business', true); } else bzFail(r);
};
ACT.bzanswer = async el => {
  const r = await api('biz:invite:answer', { id: +el.dataset.id, accept: el.dataset.a === '1' });
  if (r && r.ok) { await bzLoadList(); if (!bz().invites.length) S.view = null; render(); toast('Business', el.dataset.a === '1' ? 'You joined the business' : 'Invitation declined', 'business', true); } else bzFail(r);
};
ACT.bzannounceform = () => setView({ t: 'announce' });
ACT.bzannounce = async () => { const r = await api('biz:announce', { id: bz().id, title: bzVal('f-title'), message: bzVal('f-msg') }); if (bzSet(r)) { S.view = null; render(); toast('Business', 'Announcement posted', 'business', true); } else bzFail(r); };
ACT.bzdelnews = async el => { const r = await api('biz:announce:del', { id: bz().id, aid: +el.dataset.id }); if (bzSet(r)) render(); else bzFail(r); };
ACT.bzinviteform = () => setView({ t: 'invite' });
ACT.bzsendinvite = async () => {
  const r = await api('biz:invite', { id: bz().id, stateid: bzVal('f-sid') });
  if (r && r.ok) { S.view = null; render(); toast('Business', `Invitation sent to ${r.name || 'the citizen'}`, 'business', true); } else bzFail(r);
};
ACT.bzeditprofile = () => setView({ t: 'editprofile' });
ACT.bzsaveprofile = async () => { const r = await api('biz:profile', { id: bz().id, name: bzVal('f-pname') }); if (bzSet(r)) { S.view = null; render(); toast('Business', 'Profile updated', 'business', true); } else bzFail(r); };
ACT.bzemp = el => setView({ t: 'emp', c: el.dataset.c });
ACT.bzsetrole = async el => { const r = await api('biz:member:role', { id: bz().id, citizenid: el.dataset.c, role: el.dataset.r }); if (bzSet(r)) render(); else bzFail(r); };
ACT.bzremove = async el => { const r = await api('biz:member:remove', { id: bz().id, citizenid: el.dataset.c }); if (bzSet(r)) { S.view = null; render(); toast('Business', 'Employee removed', 'business', true); } else bzFail(r); };
ACT.bzroles = () => setView({ t: 'roles' });
ACT.bzaddroleform = () => setView({ t: 'addrole' });
ACT.bzaddrole = async () => { const r = await api('biz:role:add', { id: bz().id, name: bzVal('f-role'), manage: !!$('#f-mgr').checked }); if (bzSet(r)) { S.view = { t: 'roles' }; render(); } else bzFail(r); };
ACT.bzdelrole = async el => { const r = await api('biz:role:del', { id: bz().id, name: el.dataset.n }); if (bzSet(r)) render(); else bzFail(r); };
ACT.bzdescform = () => setView({ t: 'desc' });
ACT.bzsavedesc = async () => { const r = await api('biz:desc', { id: bz().id, description: bzVal('f-desc2') }); if (bzSet(r)) { S.view = null; await bzLoadList(); toast('Business', 'Description updated', 'business', true); } else bzFail(r); };
ACT.bzhiring = () => setView({ t: 'hiring' });
ACT.tog_bzhire = async () => { const d = bz().d, r = await api('biz:hiring', { id: bz().id, open: !d.business.hiring }); if (bzSet(r)) render(); };
ACT.bzdissolveform = () => setView({ t: 'dissolve' });
ACT.bzdissolve = async () => { const r = await api('biz:dissolve', { id: bz().id }); if (r && r.ok) { const s = bz(); s.id = null; s.d = null; s.tab = 'home'; S.view = null; await bzLoadList(); toast('Business', 'Business dissolved', 'business', true); } else bzFail(r); };
ACT.bztransferform = () => setView({ t: 'transfer' });
ACT.bztransfer = async el => { const r = await api('biz:transfer', { id: bz().id, citizenid: el.dataset.c }); if (bzSet(r)) { S.view = null; await bzLoadList(); toast('Business', 'Ownership transferred', 'business', true); } else bzFail(r); };
ACT.bzleave = async () => { const r = await api('biz:leave', { id: bz().id }); if (r && r.ok) { const s = bz(); s.id = null; s.d = null; s.tab = 'home'; S.view = null; await bzLoadList(); toast('Business', 'You left the business', 'business', true); } else bzFail(r); };

ACT.tog_duty = async () => { const r = await api('business:duty'); if (r && r.name) { S.data.job = r; render(); } };

/* ---------------------------------------------------------------------
   CRYPTO app
   --------------------------------------------------------------------- */
const spark = (h, up, cls = '') => {
  const mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
  const pts = h.map((v, i) => `${(i / Math.max(1, h.length - 1)) * 100},${36 - ((v - mn) / r) * 32}`).join(' ');
  return `<svg class="spark ${cls}" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up ? 'var(--ok)' : 'var(--bad)'}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
};
const coinChange = c => { const h = c.history, a = h[h.length - 2] || h[h.length - 1], b = h[h.length - 1]; return a ? ((b - a) / a) * 100 : 0; };
Object.assign(ICONS, {
  updown: '<path d="M7 4v16M7 4L4 7M7 4l3 3"/><path d="M17 20V4M17 20l-3-3M17 20l3-3"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  chartline: '<path d="M4 4v16h16"/><path d="M8 15l4-4 3 3 5-6"/>',
});
const CX_ICONS = ['coin', 'bag', 'car', 'star', 'tag', 'shield', 'store', 'calc'];
const cxIcon = c => CX_ICONS[[...String(c.symbol)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % CX_ICONS.length];
const CX_TABS = [['home', 'home', 'Home'], ['market', 'layers', 'Market'], ['portfolio', 'chartline', 'Portfolio']];
const cxSt = () => S.tmp.cx || (S.tmp.cx = { tab: 'home', q: '' });
const cxUsd = n => (S.cfg.currency || '$') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cxPrice = n => (S.cfg.currency || '$') + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const cxCoinRow = c => `<div class="cx-row" data-act="coin" data-id="${c.id}"><div class="cx-ic">${ic(cxIcon(c))}</div><div class="grow"><b>${esc(c.name)}</b><small>${esc(c.symbol)}</small></div><b class="cx-pr">${cxPrice(c.price)}</b></div>`;
const cxFilter = (list, q) => { q = (q || '').trim().toLowerCase(); return q ? list.filter(c => `${c.name} ${c.symbol}`.toLowerCase().includes(q)) : list; };
const cxHist = (st, c) => (st.history || []).filter(h => h.title === c.name);
const cxHistRows = list => list.length ? list.map(h => `<div class="cx-hrow"><span>${h.amount < 0 ? 'Purchase' : 'Sale'}</span><b>${cxPrice(Math.abs(h.amount))}</b></div>`).join('') : '<div class="cx-none">No history yet</div>';

function cxDetails(st, v) {
  const c = st.coins.find(x => x.id === v.id);
  if (!c) return '';
  const form = v.mode ? `<div class="cx-form"><input id="cx-amt" inputmode="numeric" placeholder="Amount (${S.cfg.currency || '$'})" autocomplete="off"><div class="cx-err" id="cx-err">${v.mode === 'buy' ? 'Bank: ' + cxUsd(st.bank) : 'You hold ' + c.owned.toFixed(4) + ' ' + esc(c.symbol)}</div>
      <div class="cx-fb"><button class="cx-p" data-act="cxgo">Confirm</button>${v.mode === 'sell' ? '<button class="cx-o" data-act="cxall">Sell all</button>' : ''}</div></div>` : '';
  return `<div class="cx-bar"><button class="cx-back" data-act="back">${ic('arrowl')}</button><h2>Details</h2></div>
    <div class="cx-scroll"><div class="cx-row static"><div class="cx-ic">${ic(cxIcon(c))}</div><div class="grow"><b>${esc(c.name)}</b><small>${esc(c.symbol)}</small></div><b class="cx-pr">${cxPrice(c.price)}</b></div>
    <div class="cx-bal"><small>BALANCE</small><b>${cxUsd(c.owned * c.price)}</b><small>${c.owned.toFixed(5)} ${esc(c.symbol)}</small></div>
    <div class="cx-btns"><button class="cx-p" data-act="cxmode" data-m="buy">Purchase</button><button class="cx-o" data-act="cxmode" data-m="sell">Sell</button></div>${form}
    <div class="cx-h">History</div>${cxHistRows(cxHist(st, c))}</div>`;
}
function cxTabBody(st, cs) {
  const coins = st.coins, name = (S.data.me || {}).name || 'Player';
  if (cs.tab === 'market') {
    return `<div class="cx-bar"><h2>Market</h2><div class="cx-search">${ic('search')}<input id="cx-q" placeholder="Search" value="${esc(cs.q)}" autocomplete="off" spellcheck="false"></div></div><div class="cx-scroll"><div id="cx-list">${cxFilter(coins, cs.q).map(cxCoinRow).join('') || '<div class="cx-none">No coins found</div>'}</div></div>`;
  }
  if (cs.tab === 'portfolio') {
    const held = coins.filter(c => c.owned > 0), total = held.reduce((s, c) => s + c.owned * c.price, 0);
    return `<div class="cx-bar"><h2>Portfolio</h2></div><div class="cx-scroll"><div class="cx-bal"><small>TOTAL VALUE</small><b>${cxUsd(total)}</b><small>Bank: ${cxUsd(st.bank)}</small></div>
      <div class="cx-h">Your coins</div>${held.length ? held.map(c => `<div class="cx-row" data-act="coin" data-id="${c.id}"><div class="cx-ic">${ic(cxIcon(c))}</div><div class="grow"><b>${esc(c.name)}</b><small>${c.owned.toFixed(4)} ${esc(c.symbol)}</small></div><b class="cx-pr">${cxUsd(c.owned * c.price)}</b></div>`).join('') : '<div class="cx-none">You do not own any coins yet</div>'}
      <div class="cx-h">History</div>${cxHistRows(st.history || [])}</div>`;
  }
  const trending = cxFilter(coins, cs.q).slice(0, 6);
  return `<div class="cx-scroll"><div class="cx-hello"><div class="cx-av">${ic('userfill')}</div><div class="grow"><small>Welcome back,</small><b>${esc(name)}</b></div><div class="cx-search">${ic('search')}<input id="cx-q" placeholder="Search" value="${esc(cs.q)}" autocomplete="off" spellcheck="false"></div></div>
    <div class="cx-actions"><button data-act="cxact" data-k="purchase"><span class="flip">${ic('download')}</span>Purchase</button><button data-act="cxact" data-k="withdraw">${ic('download')}Withdraw</button><button data-act="cxact" data-k="transfer">${ic('updown')}Transfer</button></div>
    <div class="cx-th"><b>Trending</b><button data-act="cxtab" data-k="market">See All</button></div><div id="cx-list">${trending.map(cxCoinRow).join('') || '<div class="cx-none">No coins found</div>'}</div></div>`;
}
R.crypto = () => {
  const st = S.tmp.crypto, cs = cxSt(), v = S.view, unfold = settings().unfold;
  if (!st) return `<div class="page cx"><div class="cx-none" style="margin-top:120px">Loading...</div></div>`;
  const nav = `<div class="cx-nav ${unfold ? 'lbl' : ''}"><button class="cx-key" data-act="dockstep" data-d="-1">Q</button>${CX_TABS.map(([k, i, n]) => `<button class="cx-nb ${cs.tab === k && !(v && v.t === 'transfer') ? 'on' : ''}" data-act="cxtab" data-k="${k}"><span>${ic(i)}</span>${unfold ? `<em>${n}</em>` : ''}</button>`).join('')}<button class="cx-key" data-act="dockstep" data-d="1">E</button></div>`;
  if (v && v.t === 'transfer') {
    const held = st.coins.filter(c => c.owned > 0);
    if (!v.coin && held[0]) v.coin = held[0].id;
    return `<div class="page cx"><div class="cx-bar"><button class="cx-back" data-act="back">${ic('arrowl')}</button><h2>Transfer</h2></div><div class="cx-scroll">
      ${held.length ? `<div class="cx-h">Coin</div><div class="cx-chips">${held.map(c => `<button class="${v.coin === c.id ? 'on' : ''}" data-act="cxcoin" data-id="${c.id}">${esc(c.symbol)}</button>`).join('')}</div>
      <div class="cx-form"><input id="cx-num" inputmode="numeric" maxlength="15" placeholder="Recipient phone number" value="${esc(v.num || '')}" autocomplete="off"><input id="cx-units" inputmode="decimal" placeholder="Amount of coins" value="${esc(v.units || '')}" autocomplete="off"><div class="cx-err" id="cx-err">${esc(v.err || '')}</div><div class="cx-fb"><button class="cx-p" data-act="cxsend">Send</button></div></div>` : '<div class="cx-none">You do not own any coins to transfer</div>'}</div></div>`;
  }
  const detail = v && v.t === 'coin' ? cxDetails(st, v) : '';
  if (unfold && (!v || v.t === 'coin')) {
    return `<div class="page cx"><div class="cx-split"><div class="cx-pane lp">${cxTabBody(st, cs)}</div><div class="cx-pane rp">${detail || `<div class="cx-ph">${ic('coin')}<p>Select a coin</p></div>`}</div></div>${nav}</div>`;
  }
  if (detail) return `<div class="page cx">${detail}</div>`;
  return `<div class="page cx">${cxTabBody(st, cs)}${nav}</div>`;
};
LOAD.crypto = async () => { const r = await api('crypto:get'); if (r && r.coins) { S.tmp.crypto = r; if (S.app === 'crypto') render(); } };
AFTER.crypto = () => {
  const q = $('#cx-q');
  if (q) q.oninput = e => {
    const cs = cxSt(), st = S.tmp.crypto; cs.q = e.target.value;
    const list = cxFilter(st.coins, cs.q);
    $('#cx-list').innerHTML = (cs.tab === 'home' ? list.slice(0, 6) : list).map(cxCoinRow).join('') || '<div class="cx-none">No coins found</div>';
  };
  const a = $('#cx-amt') || $('#cx-units');
  if (a && S.view && S.view.focus) { S.view.focus = false; a.focus(); }
  const n = $('#cx-num'); if (n) n.oninput = () => { S.view.num = n.value; };
  const u = $('#cx-units'); if (u) u.oninput = () => { S.view.units = u.value; };
  [$('#cx-amt'), $('#cx-units')].forEach(el => { if (el) el.onkeydown = e => { if (e.key === 'Enter') (S.view.t === 'transfer' ? ACT.cxsend : ACT.cxgo)(); }; });
};
ACT.coin = el => setView({ t: 'coin', id: el.dataset.id });
ACT.cxtab = el => { const cs = cxSt(); cs.tab = el.dataset.k; cs.q = ''; S.view = null; render(); };
ACT.cxact = el => {
  const k = el.dataset.k, cs = cxSt();
  if (k === 'transfer') return setView({ t: 'transfer' });
  cs.tab = k === 'purchase' ? 'market' : 'portfolio'; cs.q = ''; S.view = null; render();
};
ACT.cxmode = el => { const v = S.view; v.mode = el.dataset.m; v.focus = true; render(); };
ACT.cxcoin = el => { S.view.coin = el.dataset.id; render(); };
async function cryptoTrade(mode, coinId, all) {
  const usd = parseInt(($('#cx-amt') || {}).value, 10) || 0;
  const r = await api(mode === 'buy' ? 'crypto:buy' : 'crypto:sell', { coin: coinId, usd, all: !!all });
  const errs = { amount: 'Enter a valid amount', funds: 'Not enough money in your bank', none: 'You do not own this coin' };
  if (r && r.ok) { S.tmp.crypto = r.state; S.data.bank.bank = r.state.bank; if (S.view) S.view.mode = null; render(); toast('Crypto', mode === 'buy' ? 'Purchase completed' : 'Sale completed', 'crypto', true); }
  else { const e = $('#cx-err'); if (e) e.textContent = errs[(r || {}).err] || 'Something went wrong'; }
}
ACT.cxgo = () => cryptoTrade(S.view.mode, S.view.id, false);
ACT.cxall = () => cryptoTrade('sell', S.view.id, true);
ACT.cxsend = async () => {
  const v = S.view, errs = { amount: 'Enter a valid amount', offline: 'Recipient is not available', self: 'You cannot send coins to yourself', none: 'You do not have enough of this coin' };
  const r = await api('crypto:transfer', { coin: v.coin, number: $('#cx-num').value, units: parseFloat(($('#cx-units').value || '').replace(',', '.')) || 0 });
  if (r && r.ok) { S.tmp.crypto = r.state; S.view = null; render(); toast('Crypto', 'Transfer completed', 'crypto', true); }
  else { v.err = errs[(r || {}).err] || 'Transfer failed'; const e = $('#cx-err'); if (e) e.textContent = v.err; }
};

/* ---------------------------------------------------------------------
   APP STORE app
   --------------------------------------------------------------------- */
function storeListHtml() {
  const q = (S.tmp.sq || '').toLowerCase(), tab = S.tmp.sTab || 'explore', inst = installed();
  const list = STORE.filter(a => (tab === 'installed') === inst.includes(a.id) && (!q || APPS[a.id].name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)));
  if (!list.length) return empty(tab === 'installed' ? 'No apps installed' : 'Nothing left to install', 'store');
  return list.map(a => {
    const busy = S.tmp.sBusy === a.id;
    const btn = busy ? '<span class="spin"></span>' : `<button class="ib" data-act="${tab === 'installed' ? 'suninst' : 'sinst'}" data-id="${a.id}">${ic(tab === 'installed' ? 'trash' : 'download')}</button>`;
    return `<div class="row" style="cursor:default"><div class="i ${APPS[a.id].cls}" style="width:46px;height:46px;border-radius:13px;flex:none">${appGlyph(a.id) || ic(APPS[a.id].ic)}</div><div class="grow"><b>${esc(APPS[a.id].name)}</b><small style="white-space:normal;line-height:1.35">${esc(a.desc)}</small></div>${btn}</div>`;
  }).join('');
}
R.store = () => {
  const inst = installed(), tab = S.tmp.sTab || 'explore';
  return wrap(hdr('App Store'), `
    <div class="card" style="padding:10px 12px;margin-bottom:10px;font-size:12.5px;color:var(--muted)">Install and remove apps on your phone</div>
    <div style="position:relative"><input id="s-q" class="input" placeholder="Search apps" value="${esc(S.tmp.sq || '')}" style="padding-left:12px"></div>
    <div class="seg" style="margin-top:10px"><button class="${tab === 'explore' ? 'on' : ''}" data-act="stab" data-t="explore">Explore (${STORE.length - inst.length})</button><button class="${tab === 'installed' ? 'on' : ''}" data-act="stab" data-t="installed">Installed (${inst.length})</button></div>
    <div id="s-list">${storeListHtml()}</div>`);
};
AFTER.store = () => { const q = $('#s-q'); if (q) q.oninput = e => { S.tmp.sq = e.target.value; $('#s-list').innerHTML = storeListHtml(); }; };
ACT.stab = el => { S.tmp.sTab = el.dataset.t; render(); };
ACT.sinst = el => {
  if (S.tmp.sBusy) return;
  S.tmp.sBusy = el.dataset.id; $('#s-list').innerHTML = storeListHtml();
  setTimeout(() => {
    const s = settings(); s.installed = [...new Set([...installed(), el.dataset.id])]; S.tmp.sBusy = null;
    saveSettings(); toast('App Store', `${APPS[el.dataset.id].name} installed`, 'store', true);
    if (S.app === 'store') render();
  }, 1100);
};
ACT.suninst = el => {
  const s = settings(); s.installed = installed().filter(x => x !== el.dataset.id);
  saveSettings(); if (S.app === 'store') render();
};

/* ---------------------------------------------------------------------
   BANK app
   --------------------------------------------------------------------- */
const BK_NAV = [['home', 'home'], ['transfer', 'send'], ['history', 'note'], ['crypto', 'coin']];
const bkSt = () => S.tmp.bk || (S.tmp.bk = { tab: 'home', card: 0, q: '' });
const bkMoney = n => (S.cfg.currency || '$') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bkAmt = a => `${a < 0 ? '- ' : '+ '}${(S.cfg.currency || '$')}${Math.abs(a).toLocaleString('en-US')}`;
function bkRows(list, none) {
  if (!list.length) return `<div class="bk-none">${none}</div>`;
  return list.map(t => `<div class="bk-row"><div class="bk-ic">${ic('bank')}</div><div class="grow"><b>${esc(t.title)}</b><small>${esc(t.subtitle || '')}</small></div><div class="bk-am"><b class="${t.amount < 0 ? 'neg' : 'pos'}">${bkAmt(t.amount)}</b><small>${agoStr(t.ts)}</small></div></div>`).join('');
}
const bkFilter = (all, q) => { q = (q || '').trim().toLowerCase(); return q ? all.filter(t => `${t.title} ${t.subtitle}`.toLowerCase().includes(q)) : all; };
LOAD.bank = async () => {
  const r = await api('bank:get');
  if (r && typeof r.bank === 'number') { S.data.bank = { bank: r.bank, cash: r.cash }; S.tmp.bkacc = r.account; S.tmp.bktx = Array.isArray(r.tx) ? r.tx : []; if (S.app === 'bank') render(); }
};
R.bank = () => {
  const st = bkSt(), b = S.data.bank || {}, all = S.tmp.bktx || [];
  const logo = `<div class="bk-logo">${ic('bank')}<span>CODERA<br>BANK</span></div>`;
  const search = `<div class="bk-search">${ic('search')}<input id="bk-q" placeholder="Search" value="${esc(st.q)}" autocomplete="off" spellcheck="false"></div>`;
  const nav = `<div class="bk-nav"><button class="bk-key" data-act="dockstep" data-d="-1">Q</button>${BK_NAV.map(([k, i]) => `<button class="bk-nb ${st.tab === k ? 'on' : ''}" data-act="bknav" data-k="${k}">${ic(i)}</button>`).join('')}<button class="bk-key" data-act="dockstep" data-d="1">E</button></div>`;
  let top, body;
  if (st.tab === 'transfer') {
    top = `<div class="bk-top"><div class="bk-head">${logo}<h2>Transfer</h2></div></div>`;
    body = `<div class="bk-card2"><div class="bk-lbl">Send money</div>
        <input id="b-num" class="bk-in" inputmode="numeric" maxlength="15" placeholder="Recipient phone number" value="${esc(S.tmp.bnum || '')}">
        <input id="b-amt" class="bk-in" inputmode="numeric" placeholder="Amount">
        <div class="bk-err" id="b-err"></div><button class="bk-btn" data-act="btransfer">${ic('send')}Send money</button></div>
      <div class="bk-h">Quick send</div>
      ${(S.data.contacts || []).slice(0, 6).map(c => `<div class="bk-row" data-act="bpick" data-n="${esc(c.number)}"><div class="bk-ic">${esc(String(c.name).slice(0, 2).toUpperCase())}</div><div class="grow"><b>${esc(c.name)}</b><small>${esc(fmtPhone(c.number))}</small></div></div>`).join('') || '<div class="bk-none">No contacts yet</div>'}`;
  } else if (st.tab === 'history') {
    top = `<div class="bk-top"><div class="bk-head">${logo}${search}</div></div>`;
    body = `<div class="bk-h">Transactions</div><div id="bk-list">${bkRows(bkFilter(all, st.q), 'No transactions found')}</div>`;
  } else {
    const cards = [
      { tag: 'Personal', label: 'Current Balance', amt: b.bank, sub: 'Personal', id: `Account ID: ${S.tmp.bkacc || '—'}` },
      { tag: 'Cash', label: 'Cash on hand', amt: b.cash, sub: 'Wallet', id: 'Not in the bank' },
    ], c = cards[st.card % cards.length];
    top = `<div class="bk-top"><div class="bk-head">${logo}${search}</div>
      <div class="bk-card"><small>${c.tag}</small><span>${c.label}</span><b>${bkMoney(c.amt)}</b><small>${c.sub}</small><small>${c.id}</small></div>
      <div class="bk-dots"><button data-act="bkcard" data-d="-1">${ic('chev')}</button>${cards.map((_, i) => `<i class="${i === st.card % cards.length ? 'on' : ''}"></i>`).join('')}<button data-act="bkcard" data-d="1">${ic('chevr')}</button></div></div>`;
    const list = bkFilter(all, st.q);
    body = `<div class="bk-h">Latest Transactions</div><div id="bk-list">${bkRows(list.slice(0, 4), 'No transactions yet')}</div>${list.length > 4 ? '<button class="bk-all" data-act="bknav" data-k="history">See All →</button>' : ''}`;
  }
  return `<div class="page bk">${top}<div class="bk-body">${body}</div>${nav}</div>`;
};
AFTER.bank = () => {
  const q = $('#bk-q');
  if (q) q.oninput = e => {
    const st = bkSt(); st.q = e.target.value;
    const list = bkFilter(S.tmp.bktx || [], st.q), box = $('#bk-list');
    if (box) box.innerHTML = bkRows(st.tab === 'home' ? list.slice(0, 4) : list, st.tab === 'home' ? 'No transactions yet' : 'No transactions found');
  };
};
ACT.bknav = el => {
  if (el.dataset.k === 'crypto') { openApp('crypto'); return; }
  const st = bkSt(); st.tab = el.dataset.k; st.q = ''; render();
};
ACT.bkcard = el => { const st = bkSt(); st.card = (st.card + (+el.dataset.d) + 2) % 2; render(); };
ACT.bpick = el => { S.tmp.bnum = el.dataset.n; const i = $('#b-num'); if (i) i.value = el.dataset.n; };
ACT.btransfer = async () => {
  const errs = { amount: 'Enter a valid amount', offline: 'Recipient is not available', self: 'You cannot send money to yourself', funds: 'Not enough money in your bank' };
  const r = await api('bank:transfer', { number: $('#b-num').value, amount: parseInt($('#b-amt').value, 10) || 0 });
  if (r && r.ok) { S.data.bank = { bank: r.bank, cash: r.cash }; S.tmp.bnum = ''; bkSt().tab = 'home'; render(); LOAD.bank(); toast('Bank', 'Transfer completed', 'bank', true); }
  else $('#b-err').textContent = errs[(r || {}).err] || 'Transfer failed';
};

/* ---------------------------------------------------------------------
   MARKET app
   --------------------------------------------------------------------- */
const LM_CATS = ['Mechanic', 'Services', 'Food', 'Taxi', 'Government', 'Real Estate', 'Other'];
function lmListHtml() {
  const q = (S.tmp.lmq || '').toLowerCase(), c = S.tmp.lmc || 'All';
  const l = (S.data.market || []).filter(a => (c === 'All' || a.category === c) && (!q || `${a.name} ${a.description} ${a.category}`.toLowerCase().includes(q)));
  if (!l.length) return '<div class="lm-empty">No ads yet. Be the first to post!<br>Ads appear while their owners are in the city.</div>';
  return l.map(a => `<div class="lm-ad"><div class="lm-top"><b>${esc(a.name)}</b><span>${esc(a.category)}</span></div><p>${esc(a.description)}</p><div class="lm-act"><span class="lm-num">${ic('phone')}${esc(sPhone(a.number))}</span><button class="lm-call" data-act="callnum" data-n="${esc(a.number)}">${ic('phone')}</button><button class="lm-copy" data-act="lmcopy" data-n="${esc(a.number)}">${ic('copy')}</button>${a.mine ? `<button class="lm-rm" data-act="mkdel" data-id="${a.id}">Remove</button>` : ''}</div></div>`).join('');
}
R.market = () => {
  const c = S.tmp.lmc || 'All', p = S.tmp.lmPost;
  const chips = ['All', ...LM_CATS].map(k => `<button class="${k === c ? 'on' : ''}" data-act="lmcat" data-c="${k}">${k}</button>`).join('');
  const modal = p ? `<div class="mback lm-back"><div class="modal lm-modal"><h3>Post an Ad</h3><p>Your name and phone number are attached automatically. Your ad is only shown while you're in the city.</p>
    <div class="lm-l">Category</div><div class="lm-sel"><button data-act="lmprev">${ic('chev')}</button><span>${LM_CATS[p.i]}</span><button data-act="lmnext">${ic('chevr')}</button></div>
    <div class="lm-l">Description</div><textarea id="lm-desc" class="lm-ta" maxlength="150" placeholder="What are you advertising?">${esc(p.text)}</textarea><div class="lm-cnt" id="lm-cnt">${p.text.length} / 150</div>
    <button class="lm-go ${p.text.trim() ? 'on' : ''}" id="lm-go" data-act="lmsubmit">Post Ad</button><button class="lm-cancel" data-act="lmclose">Cancel</button></div></div>` : '';
  return `<div class="page lm"><div class="lm-h"><h2>Lemon List</h2></div><div class="body">
    <div class="lm-s">${ic('search')}<input id="lm-q" class="input" placeholder="Search ads" value="${esc(S.tmp.lmq || '')}"></div>
    <div class="lm-chips">${chips}</div><div id="lm-list">${lmListHtml()}</div></div>
    <button class="lm-post" data-act="lmnew">+ Post an Ad</button></div>${modal}`;
};
AFTER.market = () => {
  const q = $('#lm-q'); if (q) q.oninput = e => { S.tmp.lmq = e.target.value; $('#lm-list').innerHTML = lmListHtml(); };
  const d = $('#lm-desc');
  if (d) d.oninput = e => { S.tmp.lmPost.text = e.target.value; $('#lm-cnt').textContent = `${e.target.value.length} / 150`; $('#lm-go').classList.toggle('on', !!e.target.value.trim()); };
};
ACT.lmcat = el => { S.tmp.lmc = el.dataset.c; render(); const b = $('.lm-chips .on'); if (b) b.scrollIntoView({ inline: 'center', block: 'nearest' }); };
ACT.lmnew = () => { S.tmp.lmPost = { i: 0, text: '' }; render(); };
ACT.lmclose = () => { S.tmp.lmPost = null; render(); };
ACT.lmprev = () => { const p = S.tmp.lmPost; p.i = (p.i + LM_CATS.length - 1) % LM_CATS.length; render(); };
ACT.lmnext = () => { const p = S.tmp.lmPost; p.i = (p.i + 1) % LM_CATS.length; render(); };
ACT.lmsubmit = async () => {
  const p = S.tmp.lmPost; if (!p || !p.text.trim()) return;
  const r = await api('market:post', { category: LM_CATS[p.i], description: p.text.trim() });
  if (Array.isArray(r)) { S.data.market = r; S.tmp.lmPost = null; render(); toast('Lemon List', 'Your ad is live', 'market', true); }
};
ACT.lmcopy = el => {
  const ta = document.createElement('textarea'); ta.value = el.dataset.n; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {} ta.remove();
  toast('Lemon List', 'Phone number copied', 'market', true);
};
ACT.mkdel = async el => { const r = await api('market:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.market = r; render(); } };

/* ---------------------------------------------------------------------
   NEWS app
   --------------------------------------------------------------------- */
R.news = () => {
  const v = S.view;
  if (v && v.t === 'post') {
    return wrap(hdr('Write article'), `
      <div class="label">Headline</div><input id="nw-title" class="input" maxlength="100">
      <div class="label">Article</div><textarea id="nw-body" class="textarea" maxlength="3000"></textarea>
      <div class="label">Image URL (optional)</div><input id="nw-img" class="input" placeholder="https://...">
      <div class="err" id="nw-err"></div><button class="btn primary full" data-act="nwpost">Publish</button>`);
  }
  if (v && v.t === 'read') {
    const a = (S.data.news || []).find(x => x.id === v.id);
    if (!a) { S.view = null; return R.news(); }
    return wrap(hdr('News'), `<div class="news-item">${a.image ? `<img src="${safeImg(a.image)}">` : ''}<h4 style="font-size:19px;line-height:1.25">${esc(a.title)}</h4><small style="color:var(--muted)">${esc(a.author)} · ${fmtDate(a.ts)}</small><p style="color:var(--text);margin-top:12px;font-size:14px;line-height:1.55;white-space:pre-wrap">${esc(a.body)}</p>${a.mine ? `<div class="hrow"><button class="btn danger" data-act="nwdel" data-id="${a.id}">${ic('trash')}Delete</button></div>` : ''}</div>`);
  }
  const list = S.data.news || [];
  return wrap(hdr('News', { right: S.data.canPostNews ? `<button class="ib accent" data-act="nwnew">${ic('edit')}</button>` : '' }),
    list.length ? list.map(a => `<div class="card news-item" data-act="nwread" data-id="${a.id}" style="cursor:pointer">${a.image ? `<img src="${safeImg(a.image)}">` : ''}<h4>${esc(a.title)}</h4><p style="max-height:38px;overflow:hidden">${esc(a.body.slice(0, 120))}</p><small style="color:var(--muted);font-size:11px;display:block;margin-top:6px">${esc(a.author)} · ${fmtDay(a.ts)}</small></div>`).join('') : empty('No news right now', 'news'));
};
ACT.nwnew = () => setView({ t: 'post' });
ACT.nwread = el => setView({ t: 'read', id: +el.dataset.id });
ACT.nwpost = async () => {
  const r = await api('news:post', { title: $('#nw-title').value, body: $('#nw-body').value, image: $('#nw-img').value });
  if (Array.isArray(r)) { S.data.news = r; S.view = null; render(); } else $('#nw-err').textContent = 'Headline and article are required';
};
ACT.nwdel = async el => { const r = await api('news:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.news = r; S.view = null; render(); } };

/* ---------------------------------------------------------------------
   SOCIALS app
   --------------------------------------------------------------------- */
Object.assign(ICONS, {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  chart: '<line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="9"/>',
  repost: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  ban: '<circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>',
  swap: '<path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4"/>',
  signout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  arrowl: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
});
const SO_NAV = ['home', 'notif', 'compose', 'search', 'profile'];
const SO_NAV_IC = { home: 'home', notif: 'bell', compose: 'plus', search: 'search', profile: 'user' };
const soSt = () => S.tmp.so || (S.tmp.so = { nav: 'home', tab: 'all', ptab: 'posts', q: '' });
const soProf = () => S.tmp.soprof || {};
const soHandle = () => soProf().handle || 'USER';
const soInit = n => String(n || '?').trim().slice(0, 2).toUpperCase();
const soRel = ts => {
  const m = Math.max(1, Math.floor((Date.now() / 1000 - ts) / 60));
  if (m < 60) return m + 'm';
  if (m < 1440) return Math.floor(m / 60) + 'h';
  const d = new Date(ts * 1000);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};
const soDate = ts => { const d = new Date(ts * 1000), h = d.getHours(); return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${String(d.getFullYear()).slice(2)}, ${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`; };
const soAv = (n, big) => `<div class="so-av ${big ? 'lg' : ''}">${esc(soInit(n))}</div>`;
const soNames = () => (S.data.me || {}).name || 'Me';

const soBar = p => `<div class="so-bar"><button class="so-b like ${p.liked ? 'on' : ''}" data-act="solike" data-id="${p.id}">${ic('heart')}<span>${p.likes}</span></button>
    <button class="so-b cm" data-act="soreply" data-id="${p.id}">${ic('message')}<span>${p.comments}</span></button>
    <button class="so-b rp ${p.reposted ? 'on' : ''}" data-act="sorepost" data-id="${p.id}">${ic('repost')}<span>${p.reposts}</span></button>
    <span class="so-b vw">${ic('chart')}<span>${p.views}</span></span>
    <button class="so-b bk ${p.bookmarked ? 'on' : ''}" data-act="sobook" data-id="${p.id}">${ic('bookmark')}</button>
    ${p.mine ? `<button class="so-b tr" data-act="sodel" data-id="${p.id}">${ic('trash')}</button>` : '<span style="width:16px"></span>'}</div>`;
function soPost(p) {
  const sel = S.view && S.view.t === 'post' && S.view.id === p.id;
  return `<div class="so-post ${sel ? 'sel' : ''}" data-act="soopen" data-id="${p.id}">${p.reposted ? `<div class="so-rp">${ic('repost')}${esc(soNames())} reposted</div>` : ''}
    <div class="so-row">${soAv(p.name)}<div class="grow"><div class="so-top"><b>${esc(p.name)}</b><span>@${esc(p.handle)}</span>${p.mine ? '' : `<button class="so-fl ${p.following ? 'on' : ''}" data-act="sofollow" data-id="${p.id}">${p.following ? 'Following' : 'Follow'}</button>`}<time>${soRel(p.ts)}</time></div><p>${esc(p.text)}</p>${p.image ? `<img src="${safeImg(p.image)}">` : ''}</div></div>${soBar(p)}</div>`;
}
// Thread Post: the post itself, its replies and a reply box
function soThreadParts(id) {
  const list = soAll(), p = list.find(x => x.id === id);
  if (!p) return null;
  const replies = list.filter(r => r.reply_to === p.id).sort((a, b) => a.id - b.id), v = S.view;
  const head = `<div class="so-h so-th"><button class="so-ib" data-act="back">${ic('arrowl')}</button><h2>Thread Post</h2></div>`;
  const body = `<div class="so-main"><div class="so-mh">${soAv(p.name)}<div><b>${esc(p.name)}</b><small>@${esc(p.handle)}</small></div></div>
      <div class="so-mb"><p>${esc(p.text)}</p>${p.image ? `<img src="${safeImg(p.image)}">` : ''}<time>${soDate(p.ts)}</time></div>
      <div class="so-mc"><span><b>${p.reposts}</b> Reposts</span><span><b>${p.likes}</b> Likes</span><span><b>${p.views}</b> Views</span></div></div>
    <div class="so-actions">${soBar(p)}</div>
    ${replies.length ? replies.map(soPost).join('') : '<div class="so-empty sm">No replies yet</div>'}`;
  const foot = `${v.img ? `<img class="so-rthumb" src="${safeImg(v.img)}">` : ''}<div class="so-rc"><div class="so-rav">${esc(soInit(soNames()))}</div><input id="so-rtext" maxlength="280" placeholder="Reply to this post" autocomplete="off"><button class="so-ri ${v.img ? 'on' : ''}" data-act="sorimg">${ic('image')}</button><button class="so-rs" id="so-rgo" data-act="sorsend">${ic('send')}</button></div>`;
  return { head, body, foot };
}
const soFeed = (l, msg) => l.length ? l.map(soPost).join('') : `<div class="so-empty">${esc(msg || 'Nothing here yet')}</div>`;
const soHdrBtn = (act, icn, cls = '') => `<button class="so-ib ${cls}" data-act="${act}">${ic(icn)}</button>`;
const soTop = (title, left, right) => `<div class="so-h">${left}<h2>${title}</h2>${right || '<i></i>'}</div>`;
function soNavHtml() {
  const st = soSt(), on = (!S.view || ['post', 'user'].includes(S.view.t)) && st.nav;
  return `<div class="so-nav"><button class="so-key" data-act="sonavstep" data-d="-1">Q</button>${SO_NAV.map(k => `<button class="so-nb ${on === k ? 'on' : ''} ${k === 'compose' ? 'ring' : ''}" data-act="sonav" data-k="${k}">${ic(SO_NAV_IC[k])}</button>`).join('')}<button class="so-key" data-act="sonavstep" data-d="1">E</button></div>`;
}
function soTabs(items, cur, act) {
  return `<div class="so-tabs">${items.map(([k, n]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-t="${k}">${n}</button>`).join('')}</div>`;
}
const soAll = () => S.tmp.soc || [];
function soSearchRes() {
  const q = soSt().q.trim().toLowerCase();
  if (!q) return `<div class="so-sx"><span>${ic('search')}</span><b>Search for users or posts</b><small>Type to search for users or posts</small></div>`;
  const users = S.tmp.sousers || [];
  const posts = soAll().filter(p => `${p.name} ${p.handle} ${p.text}`.toLowerCase().includes(q));
  if (!users.length && !posts.length) return '<div class="so-empty">No results</div>';
  return (users.length ? `<div class="so-sec">Users</div>${users.map(u => `<div class="so-ucard" data-act="souser" data-h="${esc(u.handle)}" data-n="${esc(u.name)}">${soAv(u.name)}<div><b>${esc(u.name)}</b><small>@${esc(u.handle)}</small></div></div>`).join('')}` : '')
    + (posts.length ? `<div class="so-sec">Posts</div><div class="so-pad">${soFeed(posts)}</div>` : '');
}
const soMine = () => soAll().filter(p => p.mine || p.reposted);
const soReplies = () => soAll().filter(p => p.mine && p.reply_to);
const soMentions = () => { const h = '@' + soHandle().toLowerCase(); return soAll().filter(p => !p.mine && String(p.text).toLowerCase().includes(h)); };
const SO_NT = { like: ['heart', 'liked your post'], repost: ['repost', 'reposted your post'], follow: ['user', 'started following you'], reply: ['message', 'replied to your post'] };

R.socials = () => {
  const st = soSt(), v = S.view, list = soAll(), me = soNames();
  let top = '', body = '', nav = true;
  if (!S.tmp.soc) return `<div class="page so splash"><div class="so-logo"><svg viewBox="0 0 48 48"><path d="M16 7h16a10 10 0 0 1 10 10v9a10 10 0 0 1-10 10H25.500l-6.300 6.500a1.600 1.600 0 0 1-2.700-1.100V36H16A10 10 0 0 1 6 26v-9A10 10 0 0 1 16 7z" fill="#1fb0f3"/><circle cx="16" cy="21.500" r="2.600" fill="#fff"/><circle cx="24" cy="21.500" r="2.600" fill="#fff"/><circle cx="32" cy="21.500" r="2.600" fill="#fff"/></svg><span>Socials</span></div></div>`;
  if (soProf().needsJoin) return `<div class="page so join"><div class="so-logo sm"><svg viewBox="0 0 48 48"><path d="M16 7h16a10 10 0 0 1 10 10v9a10 10 0 0 1-10 10H25.500l-6.300 6.500a1.600 1.600 0 0 1-2.700-1.100V36H16A10 10 0 0 1 6 26v-9A10 10 0 0 1 16 7z" fill="#1fb0f3"/><circle cx="16" cy="21.500" r="2.600" fill="#fff"/><circle cx="24" cy="21.500" r="2.600" fill="#fff"/><circle cx="32" cy="21.500" r="2.600" fill="#fff"/></svg><span>Socials</span></div>
    <h2 class="jn-h">Hey, Join Us</h2><p class="jn-s">Pick a username to get started.</p>
    <label class="jn-l" for="jn-user">Username</label><input id="jn-user" class="jn-in" maxlength="16" placeholder="Enter username" autocomplete="off" spellcheck="false">
    <label class="jn-l" for="jn-name">Display name</label><input id="jn-name" class="jn-in" maxlength="30" placeholder="Enter name (optional)" autocomplete="off">
    <div class="jn-err" id="jn-err"></div><button class="jn-b" id="jn-btn" data-act="sojoin" disabled>Create</button></div>`;
  let tp = null;
  if (v && v.t === 'post') { tp = soThreadParts(v.id); if (!tp) S.view = null; }
  const feedList = (st.tab === 'following' ? list.filter(p => p.following) : list).filter(p => !p.reply_to);
  const homeTop = soTop('Socials', soHdrBtn('somenu', 'menu'), soHdrBtn('socompose', 'edit', 'blue'));
  const homeBody = soTabs([['all', 'All'], ['following', 'Following']], st.tab, 'sotab') + `<div class="so-pad">${soFeed(feedList, st.tab === 'following' ? 'Follow people to see their posts here' : 'No posts yet')}</div>`;
  if (settings().unfold && st.nav === 'home' && (!S.view || S.view.t === 'post')) {
    const right = tp ? `<div class="so-pane rp">${tp.head}<div class="so-body">${tp.body}</div>${tp.foot}</div>` : `<div class="so-pane rp"><div class="so-ph">${ic('message')}<p>Select a post</p></div></div>`;
    return `<div class="page so cmp"><div class="so-split"><div class="so-pane lp">${homeTop}<div class="so-body">${homeBody}</div></div>${right}</div>${soNavHtml()}</div>`;
  }
  if (tp) return `<div class="page so">${tp.head}<div class="so-body">${tp.body}</div>${tp.foot}</div>`;
  if (v && v.t === 'menu') {
    nav = false;
    top = soTop('Menu', soHdrBtn('back', 'arrowl'));
    const it = (icn, n, act, cls = '') => `<div class="so-it ${cls}" data-act="${act}">${ic(icn)}<b>${n}</b>${ic('chevr', 'cv')}</div>`;
    body = `<div class="so-card prof" data-act="soprofile">${soAv(me)}<div class="grow"><b>${esc(me)}</b><small>@${soHandle()}</small></div>${ic('edit')}</div>
      <div class="so-sec">Library</div><div class="so-grp">${it('bookmark', 'Bookmarks', 'sobooks')}${it('mute', 'Muted accounts', 'somuted')}${it('ban', 'Blocked accounts', 'soblocked')}</div>
      <div class="so-sec">Session</div><div class="so-grp">${it('swap', 'Transfer ownership', 'sotoast', 'hl')}${it('signout', 'Sign out', 'sotoast', 'pk')}</div>`;
  } else if (v && ['bookmarks', 'muted', 'blocked'].includes(v.t)) {
    const names = { bookmarks: 'Bookmarks', muted: 'Muted accounts', blocked: 'Blocked accounts' };
    top = soTop(names[v.t], soHdrBtn('back', 'arrowl'));
    body = v.t === 'bookmarks' ? soFeed(list.filter(p => p.bookmarked), 'No bookmarks yet') : `<div class="so-empty">No ${names[v.t].toLowerCase()}</div>`;
  } else if (v && v.t === 'editprof') {
    nav = false;
    top = soTop('Edit Profile', soHdrBtn('back', 'arrowl'), `<button class="so-pb" data-act="sobiosave">Save</button>`);
    const gal = S.data.gallery || [], ban = v.banner || '';
    body = `<div class="so-card"><div class="so-sec" style="margin:0 0 6px">Banner</div>
        <div class="so-bprev" ${ban ? `style="background:url('${safeImg(ban)}') center/cover"` : ''}>${ban ? '' : '<span>No banner</span>'}</div>
        <div class="so-bstrip">${gal.map(g => `<img src="${safeImg(g.url)}" class="${ban === g.url ? 'sel' : ''}" data-act="sobpick" data-url="${esc(g.url)}">`).join('') || '<small>Take a photo with the camera to use it as a banner</small>'}</div>
        <div class="so-burl"><input id="so-burl" class="so-bin" placeholder="Or paste an image link (https://...)" autocomplete="off" spellcheck="false" value="${esc(v.url || '')}"><button class="so-eb" data-act="sobset">Set</button></div>
        <div class="so-berr" id="so-berr">${esc(v.err || '')}</div>
        ${ban ? '<button class="so-eb" data-act="sobclear">Remove banner</button>' : ''}</div>
      <div class="so-card"><div class="so-sec" style="margin:0 0 6px">Bio</div><textarea id="so-bio" class="so-ta" maxlength="120" placeholder="Tell people about yourself">${esc(v.bio !== undefined ? v.bio : (soProf().bio || ''))}</textarea></div>`;
  } else if (v && v.t === 'compose') {
    nav = false;
    const r = v.reply ? list.find(p => p.id === v.reply) : null;
    top = `<div class="so-h so-ch"><button class="so-x" data-act="back">${ic('x')}</button><h2>${r ? 'Reply' : 'New Thread'}</h2><div class="so-hr"><button class="so-sq" data-act="soemo">${ic('smile')}</button><button class="so-sq ${v.img ? 'act' : ''}" data-act="soimg">${ic('image')}</button><button class="so-sq send" id="so-go" data-act="sosubmit">${ic('send')}</button></div></div>`;
    body = `${r ? `<div class="so-card" style="font-size:12px;color:var(--smu)">Replying to <b style="color:var(--sbl)">@${esc(r.handle)}</b></div>` : ''}
      <div class="so-box"><div class="so-qav">${esc(((me || '?').trim()[0] || '?').toUpperCase())}</div><div class="grow"><textarea id="so-text" class="so-ta" maxlength="280" placeholder="${r ? 'Write your reply' : "What's on your mind?"}"></textarea>${v.img ? `<img class="so-pimg" src="${safeImg(v.img)}">` : ''}</div></div>
      <div class="so-cnt" id="so-cnt">0 / 280</div>${v.emo ? `<div class="emojis so-emo">${EMOJIS.map(e => `<button data-act="soemoadd" data-e="${e}">${e}</button>`).join('')}</div>` : ''}`;
  } else if (v && v.t === 'user') {
    top = soTop(esc(v.n), soHdrBtn('back', 'arrowl'));
    body = `<div class="so-card prof" style="cursor:default">${soAv(v.n)}<div class="grow"><b>${esc(v.n)}</b><small>@${esc(v.h)}</small></div></div><div class="so-pad">${soFeed(list.filter(p => p.handle === v.h), 'No posts yet')}</div>`;
  } else if (st.nav === 'notif') {
    top = soTop('Notifications', soHdrBtn('somenu', 'menu'));
    const ns = soProf().notifs || [];
    body = ns.length ? ns.map(n => { const [i, t] = SO_NT[n.kind] || ['bell', 'interacted with you']; return `<div class="so-card so-nt">${ic(i)}<div class="grow"><b>${esc(n.actor)} ${t}</b></div><time>${soRel(n.ts)}</time></div>`; }).join('') : '<div class="so-empty">No notifications yet</div>';
  } else if (st.nav === 'search') {
    top = `<div class="so-sbar">${ic('search')}<input id="so-q" class="input" placeholder="Search" value="${esc(st.q)}" autocomplete="off" spellcheck="false"></div>`;
    body = `<div id="so-res">${soSearchRes()}</div>`;
  } else if (st.nav === 'profile') {
    top = '';
    const pt = st.ptab, mine = soMine();
    const lst = pt === 'posts' ? mine : pt === 'replies' ? soReplies() : pt === 'mentions' ? soMentions() : pt === 'likes' ? list.filter(p => p.liked) : pt === 'bookmarks' ? list.filter(p => p.bookmarked) : [];
    body = `<div class="so-ban" ${soProf().banner ? `style="background:url('${safeImg(soProf().banner)}') center/cover"` : ''}></div><div class="so-pr"><div class="so-avw">${soAv(me, true)}</div><div class="so-pn"><h3>${esc(me)}</h3><small>@${soHandle()}</small></div></div>
      <div class="so-pa"><button class="so-eb" data-act="soeditprof">Edit Profile</button><button class="so-eb sq" data-act="somenu">${ic('menu')}</button></div>
      <div class="so-bio">${esc(soProf().bio || 'Out and about in Los Santos.')}</div><div class="so-join">${ic('calendar')}Joined ${esc(soProf().joined || '-')}</div>
      <div class="so-stats"><div><b>${list.filter(p => p.mine).length}</b><span>Posts</span></div><div><b>${soProf().followers || 0}</b><span>Followers</span></div><div><b>${soProf().following || 0}</b><span>Following</span></div></div>
      ${soTabs([['posts', 'Posts'], ['replies', 'Replies'], ['mentions', 'Mentions'], ['likes', 'Likes'], ['bookmarks', 'Bookmarks']], pt, 'soptab')}
      <div class="so-pad">${soFeed(lst, 'Nothing here yet')}</div>`;
  } else {
    top = homeTop;
    body = homeBody;
  }
  return `<div class="page so">${top}<div class="so-body ${st.nav === 'profile' && !v ? 'flush' : ''}">${body}</div>${nav ? soNavHtml() : ''}</div>`;
};
AFTER.socials = () => {
  const bu = $('#so-burl');
  if (bu) bu.onkeydown = e => { if (e.key === 'Enter') ACT.sobset(); };
  const ju = $('#jn-user');
  if (ju) {
    const ok = v => /^[A-Za-z0-9_]{3,16}$/.test(v);
    const sync = () => { const good = ok(ju.value.trim()); $('#jn-btn').disabled = !good; $('#jn-err').textContent = ju.value && !good ? 'Use 3-16 letters, numbers or _' : ''; };
    ju.oninput = sync;
    ju.onkeydown = $('#jn-name').onkeydown = e => { if (e.key === 'Enter' && !$('#jn-btn').disabled) ACT.sojoin(); };
    setTimeout(() => ju.focus(), 60);
  }
  const rt = $('#so-rtext');
  if (rt) {
    const go = () => { const g = $('#so-rgo'); if (g) g.classList.toggle('on', !!rt.value.trim() || !!S.view.img); };
    rt.value = S.view.draft || '';
    rt.oninput = () => { S.view.draft = rt.value; go(); };
    rt.onkeydown = e => { if (e.key === 'Enter') ACT.sorsend(); };
    go();
    if (S.view.focus) { S.view.focus = false; rt.focus(); }
  }
  const q = $('#so-q');
  if (q) {
    let timer;
    q.oninput = e => {
      const val = e.target.value.trim();
      soSt().q = e.target.value;
      clearTimeout(timer);
      if (!val) S.tmp.sousers = [];
      $('#so-res').innerHTML = soSearchRes();
      if (!val) return;
      timer = setTimeout(async () => {
        const r = await api('socials:search', { q: val });
        if (soSt().q.trim() !== val) return;
        S.tmp.sousers = Array.isArray(r) ? r.map(u => ({ handle: u.handle, name: u.display || u.handle })) : [];
        const box = $('#so-res'); if (box) box.innerHTML = soSearchRes();
      }, 220);
    };
    if (!S.view) setTimeout(() => { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 40);
  }
  const t = $('#so-text');
  if (t) { const go = () => { const g = $('#so-go'); if (g) g.classList.toggle('on', !!t.value.trim() || !!S.view.img); }; t.oninput = e => { $('#so-cnt').textContent = `${e.target.value.length} / 280`; go(); }; if (S.view.draft) { t.value = S.view.draft; $('#so-cnt').textContent = `${t.value.length} / 280`; } go(); }
};
LOAD.socials = async () => {
  const [r, pr] = await Promise.all([api('socials:get'), api('socials:profile'), new Promise(res => setTimeout(res, 1300))]);
  S.tmp.soc = Array.isArray(r) ? r : []; S.tmp.soprof = pr && (pr.handle || pr.needsJoin) ? pr : {};
  if (S.app === 'socials') render();
};
ACT.sojoin = async () => {
  const btn = $('#jn-btn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const r = await api('socials:join', { username: $('#jn-user').value.trim(), display: $('#jn-name').value.trim() });
  if (r && r.handle) { S.tmp.soprof = r; soSt().nav = 'home'; render(); toast('Socials', `Welcome, @${r.handle}`, 'socials', true); return; }
  btn.disabled = false;
  $('#jn-err').textContent = r && r.err === 'taken' ? 'That username is already taken' : r && r.err === 'invalid' ? 'Use 3-16 letters, numbers or _' : 'Could not create your profile';
};
const soUpdate = r => { if (Array.isArray(r)) { S.tmp.soc = r; render(); } };
ACT.sonav = el => { const k = el.dataset.k, st = soSt(); if (k === 'compose') return ACT.socompose(); S.view = null; st.nav = k; render(); };
ACT.sonavstep = el => { const st = soSt(), o = SO_NAV.filter(k => k !== 'compose'); S.view = null; st.nav = o[(o.indexOf(st.nav) + (+el.dataset.d) + o.length) % o.length]; render(); };
ACT.sotab = el => { soSt().tab = el.dataset.t; render(); };
ACT.soptab = el => { soSt().ptab = el.dataset.t; render(); };
ACT.somenu = () => setView({ t: 'menu' });
ACT.sobooks = () => setView({ t: 'bookmarks' });
ACT.somuted = () => setView({ t: 'muted' });
ACT.soblocked = () => setView({ t: 'blocked' });
ACT.soprofile = () => { soSt().nav = 'profile'; S.view = null; render(); };
ACT.sotoast = () => toast('Socials', 'Coming soon', 'socials', true);
ACT.socompose = () => setView({ t: 'compose' });
ACT.souser = el => setView({ t: 'user', h: el.dataset.h, n: el.dataset.n });
ACT.soopen = el => setView({ t: 'post', id: +el.dataset.id });
ACT.soreply = el => setView({ t: 'post', id: +el.dataset.id, focus: true });
ACT.sorimg = () => { const v = S.view, t = $('#so-rtext'); v.draft = t ? t.value : ''; v.img = v.img ? null : ((S.data.gallery || [])[0] || {}).url || null; v.focus = true; render(); };
ACT.sorsend = async () => {
  const t = $('#so-rtext'), v = S.view, text = t ? t.value.trim() : '';
  if (!v || v.t !== 'post' || (!text && !v.img)) return;
  const r = await api('socials:post', { text, image: v.img || '', reply: v.id });
  if (!Array.isArray(r)) return;
  S.tmp.soc = r; v.draft = ''; v.img = null; v.focus = true; render();
  const b = $('.so-pane.rp .so-body') || $('.so-body'); if (b) b.scrollTop = b.scrollHeight;
  toast('Socials', 'Reply posted', 'socials', true);
};
ACT.soemo = () => { const v = S.view, t = $('#so-text'); v.draft = t ? t.value : ''; v.emo = !v.emo; render(); };
ACT.soemoadd = el => { const t = $('#so-text'); t.value += el.dataset.e; t.dispatchEvent(new Event('input')); t.focus(); };
ACT.soimg = () => { const v = S.view, t = $('#so-text'); v.draft = t ? t.value : ''; v.img = v.img ? null : ((S.data.gallery || [])[0] || {}).url || null; render(); };
ACT.sosubmit = async () => {
  const t = $('#so-text'), v = S.view, text = t ? t.value.trim() : '';
  if (!text && !v.img) return;
  const r = await api('socials:post', { text, image: v.img || '', reply: v.reply || null });
  if (Array.isArray(r)) { S.tmp.soc = r; S.view = null; soSt().nav = 'home'; soSt().tab = 'all'; render(); toast('Socials', v.reply ? 'Reply posted' : 'Post published', 'socials', true); }
};
ACT.solike = async el => soUpdate(await api('socials:like', { id: +el.dataset.id }));
ACT.sorepost = async el => soUpdate(await api('socials:repost', { id: +el.dataset.id }));
ACT.sobook = async el => soUpdate(await api('socials:bookmark', { id: +el.dataset.id }));
ACT.sodel = async el => soUpdate(await api('socials:delete', { id: +el.dataset.id }));
ACT.sofollow = async el => { soUpdate(await api('socials:follow', { id: +el.dataset.id })); const pr = await api('socials:profile'); if (pr && pr.handle) { S.tmp.soprof = pr; if (S.app === 'socials') render(); } };
ACT.soeditprof = () => setView({ t: 'editprof', banner: soProf().banner || '' });
const soKeepBio = () => { const t = $('#so-bio'); if (t) S.view.bio = t.value; };
ACT.sobpick = el => { soKeepBio(); S.view.banner = el.dataset.url; render(); };
ACT.sobclear = () => { soKeepBio(); S.view.banner = ''; S.view.url = ''; S.view.err = ''; render(); };
ACT.sobset = () => {
  const u = ($('#so-burl').value || '').trim();
  soKeepBio();
  if (!/^https?:\/\/[^\s"'<>]{4,480}$/.test(u)) { S.view.url = u; S.view.err = 'Enter a valid link starting with http:// or https://'; return render(); }
  S.view.banner = u; S.view.url = ''; S.view.err = ''; render();
};
ACT.sobiosave = async () => {
  const v = S.view, r = await api('socials:bio', { bio: $('#so-bio').value, banner: v.banner || '' });
  if (r && typeof r.bio === 'string') { soProf().bio = r.bio; soProf().banner = r.banner || ''; S.view = null; render(); toast('Socials', 'Profile updated', 'socials', true); }
};

/* ---------------------------------------------------------------------
   SETTINGS app
   --------------------------------------------------------------------- */
const NOTIF_APPS = ['bank', 'calendar', 'crypto', 'messages', 'socials', 'market'];
const appTile = id => { const a = APPS[id]; return `<div class="i ${a.cls}">${appGlyph(id) || ic(a.ic)}</div>`; };
const sPhone = n => { n = String(n || '').replace(/\D/g, ''); return n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : n.length === 7 ? `${n.slice(0, 3)}-${n.slice(3)}` : n; };
const sRow = (icn, title, sub, act, data = '', right = null, tile = null) => `<div class="row" ${act ? `data-act="${act}" ${data}` : 'style="cursor:default"'}>${tile || `<div class="i a-dark">${ic(icn)}</div>`}<div class="grow"><b>${title}</b><small>${sub}</small></div>${right === null ? (act ? ic('chevr') : '') : right}</div>`;
const sBlock = (label, rows) => `<div class="label">${label}</div><div class="card">${rows}</div>`;
const wallName = s => s.custom ? 'Custom image' : ((S.cfg.wallpapers || []).find(w => w.id === s.wallpaper) || {}).label || 'Default';
R.settings = () => {
  const s = settings(), me = S.data.me || {}, v = S.view || {}, inst = installed();
  if (v.t === 'shared') {
    const l = S.data.shared || [], have = new Set((S.data.contacts || []).map(c => c.number));
    return wrap(hdr('Saved Contacts'), l.length ? l.map(x => `<div class="row" style="cursor:default">${avatar(x.name)}<div class="grow"><b>${esc(x.name)}</b><small>${esc(fmtPhone(x.number))}</small></div>${have.has(x.number) ? `<small style="color:var(--muted)">Saved</small>` : `<button class="ib accent" data-act="shadd" data-id="${x.id}">${ic('plus')}</button>`}<button class="ib red" data-act="shrm" data-id="${x.id}">${ic('trash')}</button></div>`).join('') : empty('Nobody has shared a contact with you', 'contactcard'));
  }
  if (v.t === 'devname') return wrap(hdr('Device Name'), `<div style="color:var(--muted);font-size:12.5px;margin-bottom:8px">Choose the name other nearby phones can see.</div>
    <input id="s-dev" class="input" maxlength="32" value="${esc(s.deviceName || me.name || '')}" style="margin-bottom:10px"><div class="err" id="s-err"></div><button class="btn primary full" data-act="devsave">Save Name</button>`);
  if (v.t === 'wall') {
    const w = (S.cfg.wallpapers || []).map(x => `<div data-act="wall" data-id="${x.id}" style="height:96px;border-radius:14px;background:${x.css};cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding:6px;font-size:11px;font-weight:600;color:#fff;text-shadow:0 1px 3px #000;border:2px solid ${s.wallpaper === x.id && !s.custom ? 'var(--accent)' : 'transparent'}">${esc(x.label)}</div>`).join('');
    return wrap(hdr('Wallpaper'), `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">${w}</div>
      <div class="label">Custom image URL</div><input id="s-wall" class="input" placeholder="https://example.com/wallpaper.jpg" value="${esc(s.custom || '')}">
      <div style="color:var(--muted);font-size:11.5px;margin:6px 2px 10px">Use a direct HTTPS image link. Works best when folded.</div><div class="err" id="s-err"></div>
      <button class="btn primary full" data-act="wallcustom">Apply Wallpaper</button>`);
  }
  if (v.t === 'iface') return wrap(hdr('Interface'), `<div class="card" style="padding:4px 8px">${[['plane', 'Airplane mode', 'airplane'], ['bell', 'Do not disturb', 'dnd'], [s.light ? 'sun' : 'moon', 'Light theme', 'light'], ['settings', '24-hour clock', 'h24'], ['phone', 'Unfolded layout', 'unfold']].map(([i, n, k]) => `<div class="row" style="cursor:default"><div class="i a-dark" style="width:34px;height:34px;border-radius:10px">${ic(i)}</div><div class="grow"><b>${n}</b></div>${toggle(k, s[k])}</div>`).join('')}</div>`);
  if (v.t === 'appn') return wrap(hdr(APPS[v.id].name), `<div class="card" style="padding:4px 8px"><div class="row" style="cursor:default"><div class="grow"><b>Allow notifications</b><small>Banners and the notification shade</small></div>${toggle('nx_' + v.id, !s['nx_' + v.id])}</div></div>`);
  const phone = sPhone(me.phone);
  const share = S.tmp.share ? `<div class="mback"><div class="modal"><h3>Share my contact</h3><p>Pick a player nearby to send your own number to.</p><div class="mmid">${shareListHtml()}</div><button class="link" data-act="shrefresh">Refresh nearby players</button><button class="btn full mclose" data-act="shclose">Close</button></div></div>` : '';
  return wrap(hdr('Settings', { back: false }), `<div class="sub">Manage your phone settings</div>
    ${sBlock('About', sRow('userfill', esc(me.name), 'Phone Account', null) + sRow('dialpad', esc(phone), 'Phone Number', null, '', `<button class="ib" data-act="copynum">${ic('copy')}</button>`) + sRow('share', 'Share My Contact', 'Send your number to someone nearby', 'shopen') + sRow('contactcard', 'Saved Contacts', `${(S.data.shared || []).length} shared contacts`, 'sharedview'))}
    ${sBlock('Privacy', sRow('device', esc(s.deviceName || me.name || ''), 'Device Name · Shown to nearby phones', 'devname') + sRow('eyeoff', 'Hide From Nearby Devices', 'Keep this phone out of nearby device lists', null, '', toggle('hidden', s.hidden)))}
    ${sBlock('Appearance', sRow('image', 'Default Wallpaper', 'Cover Image · Wallpaper Style', 'wallview') + sRow('sliders', 'Interface', 'Control Hints · App Layout', 'ifaceview'))}
    ${sBlock('Apps', NOTIF_APPS.filter(id => !STORE_IDS.includes(id) || inst.includes(id)).map(id => sRow(APPS[id].ic, APPS[id].name, 'Notifications', 'appn', `data-id="${id}"`, null, appTile(id))).join(''))}`) + share;
};
const _settingsRender = R.settings;
R.settings = () => _settingsRender().replace('<div class="page ', `<div class="page set${S.view ? '' : ' root'} `);
function shareListHtml() {
  const l = S.tmp.nearby;
  if (!l) return '<b>Searching...</b>';
  if (!l.length) return '<b>No players nearby.</b><small>Move close to someone with a visible phone.</small>';
  return l.map(n => `<div class="row" data-act="shsend" data-id="${n.id}">${avatar(n.name)}<div class="grow"><b>${esc(n.name)}</b></div>${ic('send')}</div>`).join('');
}
async function loadNearby() {
  S.tmp.nearby = null; if (S.tmp.share || S.tmp.cshare) render();
  const r = await api('share:nearby');
  S.tmp.nearby = Array.isArray(r) ? r : []; if (S.tmp.share || S.tmp.cshare) render();
}
ACT.shopen = () => { S.tmp.share = true; loadNearby(); };
ACT.shclose = () => { S.tmp.share = false; render(); };
ACT.shrefresh = () => loadNearby();
ACT.shsend = async el => {
  const r = await api('share:send', { id: +el.dataset.id });
  if (r && r.ok) { S.tmp.share = false; render(); toast('Settings', `Contact sent to ${r.name}`, 'settings', true); }
  else { toast('Settings', r && r.err === 'airplane' ? 'Turn off airplane mode first' : 'That player is no longer nearby', 'settings', true); loadNearby(); }
};
ACT.sharedview = () => setView({ t: 'shared' });
ACT.shadd = async el => {
  const x = (S.data.shared || []).find(s => s.id === +el.dataset.id); if (!x) return;
  const r = await api('contact:save', { name: x.name, number: x.number, favorite: false });
  if (Array.isArray(r)) { S.data.contacts = r; render(); toast('Contacts', `${x.name} saved`, 'settings', true); }
};
ACT.shrm = async el => { const r = await api('share:delete', { id: +el.dataset.id }); if (Array.isArray(r)) { S.data.shared = r; render(); } };
ACT.devname = () => setView({ t: 'devname' });
ACT.wallview = () => setView({ t: 'wall' });
ACT.ifaceview = () => setView({ t: 'iface' });
ACT.appn = el => setView({ t: 'appn', id: el.dataset.id });
ACT.copynum = () => {
  const n = ((S.data.me || {}).phone || '');
  const ta = document.createElement('textarea'); ta.value = n; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {} ta.remove();
  toast('Settings', 'Phone number copied', 'settings', true);
};
ACT.devsave = () => {
  const n = $('#s-dev').value.trim();
  if (!n) { $('#s-err').textContent = 'Please enter a name'; return; }
  settings().deviceName = n; saveSettings(); S.view = null; render(); toast('Settings', 'Device name saved', 'settings', true);
};
ACT.tog = el => {
  const k = el.dataset.k;
  if (k === 'duty') return ACT.tog_duty();
  if (k === 'bzhire') return ACT.tog_bzhire();
  const s = settings(); s[k] = !s[k];
  saveSettings(); render(); updateClock();
};
ACT.wall = el => { const s = settings(); s.wallpaper = el.dataset.id; s.custom = ''; saveSettings(); render(); toast('Settings', 'Wallpaper updated.', 'settings', true); };
ACT.wallcustom = () => {
  const u = $('#s-wall').value.trim();
  if (!/^https?:\/\/[^\s"'<>]+$/.test(u)) { $('#s-err').textContent = 'Enter a valid https:// image link'; return; }
  const s = settings(); s.custom = u; saveSettings(); render(); toast('Settings', 'Wallpaper updated.', 'settings', true);
};

/* ---------------------------------------------------------------------
   CALLS
   --------------------------------------------------------------------- */
async function startCall(number) {
  if (S.call) return;
  number = String(number).replace(/\D/g, '');
  if (!number) return;
  const errs = { airplane: 'Turn off airplane mode first', self: 'You cannot call yourself', busy: 'The line is busy', unavailable: 'The number is unavailable', invalid: 'Invalid number' };
  const r = await api('call:start', { number });
  if (r && r.ok) { S.call = { id: r.id, number, dir: 'out', state: 'ringing' }; renderCall(); }
  else toast('Call failed', errs[(r || {}).err] || 'Could not place the call', 'phone', true);
}
function renderBanner() {
  const c = S.call, h = $('#headsup'), k = $('#callkeys'), w = $('#phone-wrap');
  const show = c && c.dir === 'in' && c.state === 'ringing' && !S.open;
  w.classList.toggle('peek', !!show);
  if (!show) { h.classList.remove('on'); k.classList.remove('on'); return; }
  const nm = label(c.number);
  h.innerHTML = `<div class="hu-av">${esc(soInit(nm))}<i>${ic('phone')}</i></div><div class="grow"><b>${esc(nm)}</b><small>Incoming call</small></div><span class="bn-b r">${ic('phoneoff')}</span><span class="bn-b g">${ic('phone')}</span>`;
  k.innerHTML = `<div><kbd>&#8629;</kbd><span>Accept</span></div><div><kbd>&larr;</kbd><span>Decline</span></div>`;
  h.classList.add('on'); k.classList.add('on');
}
function renderCall() {
  renderBanner();
  const c = S.call, el = $('#call');
  if (!c) { el.classList.remove('on'); el.innerHTML = ''; return; }
  const nm = label(c.number);
  const st = c.state === 'active' ? fmtDur(Math.floor((Date.now() - c.start) / 1000)) : (c.dir === 'in' ? 'Incoming call...' : 'Calling...');
  const inRing = c.dir === 'in' && c.state === 'ringing', active = c.state === 'active';
  const pill = $('#callpill');
  if (active && c.hidden) { el.classList.remove('on'); pill.classList.add('on'); pill.innerHTML = `<span class="dot"></span><b id="pill-t">${c.hold ? 'On hold' : fmtDur(Math.floor((Date.now() - c.start) / 1000))}</b><small>${esc(nm)}</small>`; return; }
  pill.classList.remove('on');
  el.classList.add('on');
  const num = contactName(c.number) ? `<div class="cnum">${esc(sPhone(c.number))}</div>` : '';
  const init = soInit(nm);
  const cb = (act, icn, text, on, cls = '') => `<div class="cw"><button class="cbtn ${cls} ${on ? 'on' : ''}" data-act="${act}">${ic(icn)}</button><small>${text}</small></div>`;
  const ctrls = active ? `<div class="cgrid">${cb('cmute', c.muted ? 'micoff' : 'mic', 'Mute', c.muted)}${cb('cspeaker', 'speaker', 'Loudspeaker', c.speaker)}${cb('chold', 'pause', 'Hold', c.hold)}${cb('cadd', 'userplus', 'Add')}${cb('chide', 'chevd', 'Hide')}${cb('chang', 'phoneoff', 'End', false, 'r')}</div>`
    : `<div class="acts">${inRing ? `<div class="cw"><button class="cbtn g ring" data-act="canswer">${ic('phone')}</button><small>Accept</small></div>` : ''}<div class="cw"><button class="cbtn r" data-act="chang">${ic('phoneoff')}</button><small>${inRing ? 'Decline' : 'Cancel'}</small></div></div>`;
  el.innerHTML = `<div class="who"><div class="avatar lg">${esc(init)}</div><h2>${esc(nm)}</h2>${num}<div class="st ${active ? 'live' : ''}" id="call-st">${st}</div></div>${ctrls}`;
}
ACT.cmute = () => { S.call.muted = !S.call.muted; nui('callopt', { kind: 'mute', on: S.call.muted }); renderCall(); };
ACT.cspeaker = () => { S.call.speaker = !S.call.speaker; nui('callopt', { kind: 'speaker', on: S.call.speaker }); renderCall(); };
ACT.chold = () => nui('callhold');
ACT.chide = () => { S.call.hidden = true; renderCall(); };
ACT.cshow = () => { if (S.call) { S.call.hidden = false; renderCall(); } };
ACT.cadd = () => {
  const n = S.call.number; S.call.hidden = true; renderCall();
  if ((S.data.contacts || []).find(x => x.number === n)) return toast('Contacts', 'Already in your contacts', 'settings', true);
  openApp('contacts'); setView({ t: 'edit', number: n });
};
ACT.canswer = () => nui('answer');
ACT.chang = () => nui('hangup');
setInterval(() => {
  if (S.call && S.call.state === 'active') { const t = S.call.hold ? 'On hold' : fmtDur(Math.floor((Date.now() - S.call.start) / 1000)); const e = $('#call-st'); if (e) e.textContent = t; const q = $('#pill-t'); if (q) q.textContent = t; }
  updateClock();
}, 1000);

/* ---------------------------------------------------------------------
   Global events
   --------------------------------------------------------------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const f = ACT[el.dataset.act];
  if (f) f(el, e);
});
ACT.open = el => openApp(el.dataset.id);
ACT.dockstep = el => {
  const apps = DOCK.filter(x => x !== 'camera'), i = apps.indexOf(S.app), d = +el.dataset.d;
  openApp(apps[i < 0 ? (d > 0 ? 0 : apps.length - 1) : (i + d + apps.length) % apps.length]);
};
ACT.back = back;
ACT.home = goHome;
ACT.shade = () => setShade(!S.shade);
ACT.clearnotifs = () => { S.notifs = []; updateBell(); renderShade(); };
ACT.nopen = el => {
  const n = S.notifs[+el.dataset.i];
  setShade(false);
  if (n && n.app && APPS[n.app] && n.app !== 'camera') openApp(n.app);
};

/* ---------------------------------------------------------------------
   Typing detection -> tells the client to play the typing emote
   (ported from prp-phone's phone:inputFocus)
   --------------------------------------------------------------------- */
let typing = false;
const TEXT_TYPES = new Set(['text', 'password', 'email', 'tel', 'url', 'search', 'number']);
const isTextField = el => {
  if (!el || !el.tagName) return false;
  const t = el.tagName.toLowerCase();
  if (t === 'input') return TEXT_TYPES.has((el.type || 'text').toLowerCase());
  return t === 'textarea' || !!el.isContentEditable;
};
const setTyping = on => {
  if (typing === on) return;
  typing = on;
  nui('inputFocus', { focused: on });
};
document.addEventListener('focusin', () => { if (isTextField(document.activeElement)) setTyping(true); });
document.addEventListener('focusout', () => setTimeout(() => { if (!isTextField(document.activeElement)) setTyping(false); }, 0));
// A focused field can vanish when the view re-renders (no blur is fired), so double-check.
setInterval(() => { if (typing && !isTextField(document.activeElement)) setTyping(false); }, 500);

// Use the physical key so shortcuts also work with non-English keyboard layouts (e.g. Persian)
const keyOf = e => /^Key[A-Z]$/.test(e.code || '') ? e.code.slice(3).toLowerCase() : String(e.key || '').toLowerCase();
const digitOf = e => /^(Digit|Numpad)\d$/.test(e.code || '') ? e.code.slice(-1) : (/^\d$/.test(e.key) ? e.key : null);
document.addEventListener('keydown', e => {
  if (!S.open) return;
  if (e.key === 'Escape') { nui('close'); return; }
  const tag = (document.activeElement || {}).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = keyOf(e);
  if (S.call && S.call.dir === 'in' && S.call.state === 'ringing') {
    if (k === 'y' || e.key === 'Enter') { ACT.canswer(); return; }
    if (k === 'n' || e.key === 'Backspace') { ACT.chang(); return; }
  }
  if (k === 't') { toggleFold(); return; }
  if (k === 'y') { goHome(); return; }
  if (k === 'u') { setShade(!S.shade); return; }
  if (k === 'q' || k === 'e') { ACT.dockstep({ dataset: { d: k === 'q' ? -1 : 1 } }); return; }
  if (e.key === 'ArrowLeft') { back(); return; }
  if (S.app === 'phone' && (S.tmp.pTab || 'keypad') === 'keypad' && !S.call) {
    const dg = digitOf(e);
    if (dg !== null) { ACT.key({ dataset: { v: dg } }); return; }
    if (e.key === 'Backspace') { ACT.keydel(); return; }
    if (e.key === 'Enter') { ACT.dialcall(); return; }
  }
  if (e.key === 'Backspace') back();
  else if (e.key === 'Enter') { const a = document.activeElement; if (a && a.dataset && a.dataset.act) a.click(); }
});

window.addEventListener('message', ev => {
  const d = ev.data || {};
  switch (d.action) {
    case 'open':
      S.data = d.data; S.cfg = d.cfg || {}; S.h = d.h; S.m = d.m; S.zone = d.zone || '';
      S.open = true; S.tmp = {};
      applySettings(); updateBell(); goHome(); updateClock(); renderCall();
      document.body.classList.add('noanim'); applyFold(!!settings().unfold); S.folding = false;
      document.body.classList.remove('morph');
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('noanim')));
      $('#phone-wrap').classList.add('open');
      break;
    case 'close':
      S.open = false; typing = false; S.tmp.padd = null; setShade(false);
      $('#phone-wrap').classList.remove('open');
      renderCall();
      break;
    case 'tick':
      S.h = d.h; S.m = d.m; S.zone = d.zone || S.zone;
      updateClock();
      { const z = $('.zone'); if (z) z.textContent = S.zone; }
      break;
    case 'gallery':
      S.data.gallery = d.gallery || [];
      if (S.app === 'gallery') render();
      break;
    case 'groups':
      S.data.groups = d.groups || [];
      if (S.app === 'messages') render();
      break;
    case 'newMessage': {
      const m = d.msg, me = (S.data.me || {}).phone;
      if (!me) break;
      const grp = isGroup(m.to), key = grp ? m.to : m.from;
      const viewing = S.open && S.app === 'messages' && S.view && S.view.t === 'thread' && S.view.n === key;
      S.data.messages.unshift({ id: m.id, sender: m.from, receiver: grp ? m.to : me, message: m.message, image: m.image, loc: m.loc, is_read: (viewing || grp) ? 1 : 0, ts: m.ts });
      if (viewing) { if (!grp) api('msg:read', { number: m.from }); render(); }
      else if (!settings()['mute_' + key]) {
        const body = m.message || (m.loc ? 'Shared a location' : 'Sent you a photo');
        pushNotif('messages', grp ? threadName(key) : label(m.from), grp ? `${memberName(m.from)}: ${body}` : body);
        if (S.app === 'messages') render();
      }
      if (!S.app) renderHome();
      break;
    }
    case 'shared':
      S.data.shared = d.shared || [];
      pushNotif('settings', 'Contact received', `${d.from || 'Someone'} shared a contact with you`);
      if (S.app === 'settings') render();
      break;
    case 'notify':
      pushNotif((d.notif || {}).app || 'settings', (d.notif || {}).title || 'Notification', (d.notif || {}).text || '');
      break;
    case 'incomingCall':
      S.call = { id: d.id, number: d.number, dir: 'in', state: 'ringing' };
      renderCall();
      if (S.open) toast('Incoming call', `${label(d.number)} - Enter to accept, Backspace to decline`, 'phone');
      break;
    case 'callHold':
      if (S.call) { S.call.hold = !!d.on; renderCall(); }
      break;
    case 'callAnswered':
      if (S.call) { S.call.state = 'active'; S.call.start = Date.now(); renderCall(); }
      break;
    case 'callEnded':
      if (S.call) {
        const c = S.call;
        const missed = c.dir === 'in' && c.state === 'ringing';
        const dur = c.state === 'active' ? Math.floor((Date.now() - c.start) / 1000) : 0;
        (S.data.calls = S.data.calls || []).unshift({ number: c.number, direction: c.dir === 'in' ? 'in' : 'out', status: c.state === 'active' ? 'answered' : (c.dir === 'in' ? 'missed' : 'no answer'), duration: dur, ts: Math.floor(Date.now() / 1000) });
        if (missed) { S.missed++; pushNotif('phone', 'Missed call', label(c.number)); }
        S.call = null; renderCall();
        if (S.app === 'phone') render(); else if (!S.app) renderHome();
      }
      break;
  }
});

window.addEventListener('resize', fit);
fit();
