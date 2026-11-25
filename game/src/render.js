// Golden Skillet's renderer: everything is drawn with canvas vector shapes — the
// food, the customers, the kitchen — so the game needs no image assets at all.
// The kitchen is composed in the fixed 1280x800 space from config.js and scaled
// to fit the window; input coordinates are converted back with toLogical().

import {
  FONT, LAYOUT, PALETTE, STATION_ORDER, TRAY_COUNT, VIEW,
} from './config.js';
import { donenessOf } from './kitchen.js';

/** Buttons on the overlay screens; the boot module hit-tests clicks against these. */
export const BUTTONS = {
  play: { x: 440, y: 436, w: 400, h: 74 },
  howto: { x: 440, y: 526, w: 400, h: 56 },
  howtoClose: { x: 490, y: 656, w: 300, h: 52 },
  resume: { x: 465, y: 392, w: 350, h: 60 },
  restartDay: { x: 465, y: 466, w: 350, h: 56 },
  toMenu: { x: 465, y: 536, w: 350, h: 56 },
  dayPrimary: { x: 440, y: 528, w: 400, h: 66 },
  dayMenu: { x: 490, y: 610, w: 300, h: 50 },
};

export const SCREEN_TITLE = 'title';
export const SCREEN_HOWTO = 'howto';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAYEND = 'dayend';

const STAGE_COLOURS = {
  raw: '#d98c8c',
  perfect: '#e9a13b',
  done: '#b4552d',
  burnt: '#5a4632',
};
const PATTY_COLOURS = {
  raw: '#cf7d72',
  perfect: '#8a4f24',
  done: '#75431f',
  burnt: '#2e2018',
  none: '#a05a30',
};

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'center', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function ellipse(ctx, x, y, rx, ry, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoin(ctx, x, y, r) {
  ellipse(ctx, x, y, r, r, PALETTE.goldBright);
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
}

/** One ingredient, drawn centred on (x, y) inside a box of side s. */
export function drawFood(ctx, id, x, y, s, doneness = null) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 100; // draw in a 100-unit box, scaled
  ctx.scale(u, u);
  if (id === 'bun') {
    ctx.fillStyle = '#eab26c';
    rr(ctx, -42, 4, 84, 20, 9);
    ctx.fill();
    ctx.fillStyle = '#f2c078';
    ctx.beginPath();
    ctx.arc(0, 4, 42, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff0cd';
    for (const [sx, sy] of [[-20, -16], [2, -26], [22, -12], [-4, -8], [14, -30]]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4.4, 2.6, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = PATTY_COLOURS[doneness ?? 'none'];
    rr(ctx, -44, -14, 88, 28, 13);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (const [sx, sy] of [[-24, -4], [6, 4], [26, -6], [-4, -8]]) ellipse(ctx, sx, sy, 4, 2.4, 'rgba(0,0,0,0.16)');
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f7b733';
    ctx.beginPath();
    ctx.moveTo(-42, -16);
    ctx.lineTo(42, -22);
    ctx.lineTo(38, 12);
    ctx.lineTo(16, 12);
    ctx.lineTo(10, 24);
    ctx.lineTo(2, 12);
    ctx.lineTo(-38, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e09a1f';
    ellipse(ctx, -16, -4, 5, 3.4, '#e09a1f');
    ellipse(ctx, 20, -8, 4, 2.8, '#e09a1f');
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#4f9e57';
    for (const off of [-24, 0, 24]) {
      ctx.beginPath();
      ctx.arc(off, 2, 21, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#79c47e';
    for (const off of [-20, 4, 24]) {
      ctx.beginPath();
      ctx.arc(off, -2, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tomato') {
    ellipse(ctx, 0, 0, 36, 36, '#d8442e');
    ellipse(ctx, 0, 0, 26, 26, '#e86048');
    ctx.fillStyle = '#f4a48f';
    for (const [sx, sy] of [[-11, -8], [11, -8], [-11, 10], [11, 10]]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4.6, 7, sx > 0 ? 0.5 : -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'fries') {
    ctx.fillStyle = '#ffd34d';
    ctx.strokeStyle = '#e0a92e';
    ctx.lineWidth = 2;
    for (const [off, tall] of [[-26, 62], [-9, 74], [9, 68], [26, 58]]) {
      rr(ctx, off - 6, -tall + 18, 12, tall, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-40, -6);
    ctx.lineTo(40, -6);
    ctx.lineTo(31, 40);
    ctx.lineTo(-31, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(0, 12, 11, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'G', 0, 13, 15, '#c0392b');
  } else if (id === 'salad') {
    ctx.fillStyle = '#4f9e57';
    for (const [off, up] of [[-22, -14], [0, -22], [22, -14]]) {
      ctx.beginPath();
      ctx.arc(off, up, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#79c47e';
    ctx.beginPath();
    ctx.arc(-6, -18, 10, 0, Math.PI * 2);
    ctx.fill();
    ellipse(ctx, 14, -10, 6, 6, '#d8442e');
    ellipse(ctx, -24, -6, 5, 5, '#d8442e');
    ctx.fillStyle = '#b4552d';
    ctx.beginPath();
    ctx.arc(0, 2, 42, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#96431f';
    rr(ctx, -42, -2, 84, 7, 3);
    ctx.fill();
  } else if (id === 'drink') {
    ctx.fillStyle = '#c23a54';
    rr(ctx, 8, -52, 7, 34, 3);
    ctx.fill();
    ctx.fillStyle = '#e8563f';
    ctx.beginPath();
    ctx.moveTo(-26, -22);
    ctx.lineTo(26, -22);
    ctx.lineTo(20, 40);
    ctx.lineTo(-20, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-14, -22);
    ctx.lineTo(-4, -22);
    ctx.lineTo(-8, 40);
    ctx.lineTo(-14, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    rr(ctx, -29, -30, 58, 10, 4);
    ctx.fill();
  }
  ctx.restore();
}

/** A customer's face: skin, hair and a mouth that follows their patience. */
function drawCustomer(ctx, order, x, y, r) {
  const frac = Math.max(0, order.patience / order.patienceMax);
  // Shoulders in the customer's shirt colour.
  ctx.fillStyle = order.shirt;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.92, r * 0.78, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, x, y, r, r * 0.94, order.skin);
  // Hair: a cap over the top of the head.
  ctx.fillStyle = order.hair;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.14, r * 0.99, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fill();
  // Eyes.
  ellipse(ctx, x - r * 0.34, y + r * 0.02, r * 0.09, r * 0.12, PALETTE.black);
  ellipse(ctx, x + r * 0.34, y + r * 0.02, r * 0.09, r * 0.12, PALETTE.black);
  // Mouth: smile, flat line or frown as patience drains.
  ctx.strokeStyle = PALETTE.black;
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (frac > 0.5) ctx.arc(x, y + r * 0.28, r * 0.4, Math.PI * 0.15, Math.PI * 0.85);
  else if (frac > 0.25) {
    ctx.moveTo(x - r * 0.3, y + r * 0.48);
    ctx.lineTo(x + r * 0.3, y + r * 0.48);
  } else ctx.arc(x, y + r * 0.72, r * 0.38, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  if (frac <= 0.25) {
    // Cross-popping anger vein.
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 3;
    const ax = x + r * 0.62;
    const ay = y - r * 0.52;
    for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + dx, ay + dy);
      ctx.stroke();
    }
  }
}

/**
 * A tray's contents as food: a burger stack in the middle of the plate when the
 * tray holds burger parts, with fries / salad / drink set beside it.
 */
function drawTrayContents(ctx, tray, cx, baseY) {
  ellipse(ctx, cx, baseY + 16, 118, 20, 'rgba(0,0,0,0.18)');
  ellipse(ctx, cx, baseY + 10, 112, 22, '#fdfdf8');
  ellipse(ctx, cx, baseY + 9, 92, 16, '#e8e4d8');
  const stack = tray.filter((e) => e.id !== 'fries' && e.id !== 'salad' && e.id !== 'drink');
  const sides = tray.filter((e) => e.id === 'fries' || e.id === 'salad' || e.id === 'drink');
  const sideSpots = [
    { x: cx - 86, y: baseY - 6 },
    { x: cx + 88, y: baseY - 6 },
    { x: cx + 62, y: baseY + 2 },
  ];
  sides.forEach((entry, i) => {
    const spot = sideSpots[i % sideSpots.length];
    drawFood(ctx, entry.id, spot.x, spot.y, 62, entry.doneness);
  });
  if (stack.length === 0) return;
  const hasBun = stack.some((e) => e.id === 'bun');
  let y = baseY + 2;
  if (hasBun) {
    drawFood(ctx, 'bun', cx, y + 16, 104, null); // bottom half sits under the stack
    y -= 4;
  }
  for (const entry of stack) {
    if (entry.id === 'bun') continue;
    if (entry.id === 'patty') {
      ctx.fillStyle = PATTY_COLOURS[entry.doneness ?? 'none'];
      rr(ctx, cx - 52, y - 13, 104, 15, 7);
      ctx.fill();
      y -= 13;
    } else if (entry.id === 'cheese') {
      ctx.fillStyle = '#f7b733';
      ctx.beginPath();
      ctx.moveTo(cx - 56, y - 8);
      ctx.lineTo(cx + 56, y - 10);
      ctx.lineTo(cx + 50, y + 2);
      ctx.lineTo(cx + 12, y + 2);
      ctx.lineTo(cx + 6, y + 9);
      ctx.lineTo(cx, y + 2);
      ctx.lineTo(cx - 50, y + 3);
      ctx.closePath();
      ctx.fill();
      y -= 9;
    } else if (entry.id === 'lettuce') {
      ctx.fillStyle = '#5da65f';
      for (const off of [-30, 0, 30]) {
        ctx.beginPath();
        ctx.arc(cx + off, y - 3, 17, 0, Math.PI * 2);
        ctx.fill();
      }
      y -= 10;
    } else if (entry.id === 'tomato') {
      ellipse(ctx, cx, y - 5, 42, 8, '#d8442e');
      ellipse(ctx, cx, y - 5, 30, 5, '#e86048');
      y -= 10;
    }
  }
  if (hasBun) {
    ctx.save();
    ctx.translate(cx, y - 2);
    ctx.fillStyle = '#f2c078';
    ctx.beginPath();
    ctx.arc(0, 6, 52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff0cd';
    for (const [sx, sy] of [[-24, -16], [4, -28], [26, -12], [-4, -6]]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 5, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Scene pieces
// ---------------------------------------------------------------------------

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, 470);
  grad.addColorStop(0, PALETTE.wallTop);
  grad.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, 470);
  ctx.fillStyle = PALETTE.wallBand;
  ctx.fillRect(0, 196, VIEW.width, 10);
  // A row of hanging pans for charm.
  for (const [px, pr] of [[70, 17], [124, 13], [1160, 15], [1214, 19]]) {
    ctx.fillStyle = PALETTE.steelDark;
    ctx.fillRect(px - 2, 120, 4, 26);
    ellipse(ctx, px, 120 + 26 + pr, pr, pr, PALETTE.steel);
    ellipse(ctx, px, 120 + 26 + pr, pr * 0.62, pr * 0.62, PALETTE.steelDark);
  }
  // Floor and the long wooden counter the stations sit on.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 470, VIEW.width, 330);
  ctx.fillStyle = PALETTE.floorDark;
  for (let x = 0; x < VIEW.width; x += 160) ctx.fillRect(x, 470, 3, 330);
  ctx.fillStyle = PALETTE.counterFace;
  ctx.fillRect(0, 452, VIEW.width, 66);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 440, VIEW.width, 16);
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(0, 440, VIEW.width, 4);
}

function drawHud(ctx, state, ui) {
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(0, 0, VIEW.width, LAYOUT.hud.h);
  ctx.fillStyle = PALETTE.wallBand;
  ctx.fillRect(0, LAYOUT.hud.h - 4, VIEW.width, 4);
  drawCoin(ctx, 34, 27, 13);
  text(ctx, `${state.coins}`, 56, 28, 24, PALETTE.cream, 'left');
  text(ctx, `Score ${state.score}`, 190, 28, 20, '#e8cf9f', 'left', 600);
  text(ctx, `Day ${state.day}`, 420, 28, 22, PALETTE.cream, 'left');
  // Day timer: a draining bar with the seconds left.
  const tx = 560;
  const tw = 300;
  const frac = state.cfg.seconds > 0 ? Math.max(0, state.timeLeft / state.cfg.seconds) : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, tx, 16, tw, 22, 11);
  ctx.fill();
  ctx.fillStyle = frac > 0.35 ? PALETTE.green : frac > 0.15 ? PALETTE.gold : PALETTE.red;
  if (frac > 0) {
    rr(ctx, tx, 16, Math.max(22, tw * frac), 22, 11);
    ctx.fill();
  }
  text(ctx, `${Math.ceil(state.timeLeft)}s`, tx + tw + 14, 28, 20, PALETTE.cream, 'left', 600);
  if (state.combo >= 2) text(ctx, `Combo x${state.combo}`, 1136, 28, 22, PALETTE.goldBright, 'right');
  drawHudButton(ctx, LAYOUT.pauseButton, ui.hover, 'pause');
  drawHudButton(ctx, LAYOUT.muteButton, ui.hover, ui.muted ? 'muted' : 'sound');
}

function drawHudButton(ctx, rect, hover, kind) {
  const hot = hover && hover.x >= rect.x && hover.x <= rect.x + rect.w && hover.y >= rect.y && hover.y <= rect.y + rect.h;
  ctx.fillStyle = hot ? '#6d4423' : '#5d3a1e';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 9);
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.fillStyle = PALETTE.cream;
  if (kind === 'pause') {
    ctx.fillRect(cx - 9, cy - 10, 6, 20);
    ctx.fillRect(cx + 3, cy - 10, 6, 20);
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 4);
    ctx.lineTo(cx - 6, cy - 4);
    ctx.lineTo(cx + 2, cy - 12);
    ctx.lineTo(cx + 2, cy + 12);
    ctx.lineTo(cx - 6, cy + 4);
    ctx.lineTo(cx - 14, cy + 4);
    ctx.closePath();
    ctx.fill();
    if (kind === 'sound') {
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 8, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 13, -0.9, 0.9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 5, cy - 8);
      ctx.lineTo(cx + 15, cy + 8);
      ctx.moveTo(cx + 15, cy - 8);
      ctx.lineTo(cx + 5, cy + 8);
      ctx.stroke();
    }
  }
}

function drawTickets(ctx, state) {
  const t = LAYOUT.tickets;
  // The green board the tickets pin to.
  ctx.fillStyle = PALETTE.boardFrame;
  rr(ctx, 8, 58, VIEW.width - 16, t.h + 18, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.board;
  rr(ctx, 14, 64, VIEW.width - 28, t.h + 6, 9);
  ctx.fill();
  for (let i = 0; i < 4; i += 1) {
    const x = t.x + i * (t.w + t.gap);
    const order = state.orders[i];
    if (!order) {
      ctx.strokeStyle = 'rgba(255,246,224,0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      rr(ctx, x, t.y, t.w, t.h, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + 3, t.y + 5, t.w, t.h, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, x, t.y, t.w, t.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ellipse(ctx, x + t.w / 2, t.y + 7, 6, 6, PALETTE.red); // the pin
    drawCustomer(ctx, order, x + 44, t.y + 52, 30);
    text(ctx, order.dish.name, x + 84, t.y + 32, 21, PALETTE.ink, 'left');
    drawCoin(ctx, x + 92, t.y + 62, 9);
    text(ctx, `${order.price}`, x + 106, t.y + 63, 17, PALETTE.inkSoft, 'left', 600);
    // The recipe, as a row of little food pictures.
    const items = order.dish.items;
    const iconSize = items.length > 4 ? 40 : 46;
    items.forEach((id, j) => {
      drawFood(ctx, id, x + 34 + j * (iconSize + 8), t.y + 106, iconSize, id === 'patty' ? 'perfect' : null);
    });
    // Patience bar along the bottom of the ticket.
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#e3d3ac';
    rr(ctx, x + 12, t.y + t.h - 16, t.w - 24, 9, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
    if (frac > 0) {
      rr(ctx, x + 12, t.y + t.h - 16, Math.max(9, (t.w - 24) * frac), 9, 4);
      ctx.fill();
    }
  }
}

function drawTimingRing(ctx, x, y, radius, progress) {
  const stage = donenessOf(progress);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  // The golden window, marked on the ring itself.
  ctx.strokeStyle = 'rgba(255,201,77,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2 + 0.42 * Math.PI * 2, -Math.PI / 2 + 0.78 * Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = STAGE_COLOURS[stage];
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.min(1, progress) * Math.PI * 2);
  ctx.stroke();
  text(ctx, stage === 'perfect' ? 'PERFECT!' : stage.toUpperCase(), x, y + radius + 16, stage === 'perfect' ? 17 : 14, STAGE_COLOURS[stage]);
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, g.x, g.y, g.w, g.h, 14);
  ctx.fill();
  ctx.fillStyle = '#3c3f41';
  rr(ctx, g.x + 10, g.y + 34, g.w - 20, g.h - 46, 10);
  ctx.fill();
  ctx.strokeStyle = '#55595c';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(g.x + 22, g.y + 66 + i * 34);
    ctx.lineTo(g.x + g.w - 22, g.y + 66 + i * 34);
    ctx.stroke();
  }
  text(ctx, 'GRILL', g.x + 20, g.y + 18, 17, PALETTE.cream, 'left');
  text(ctx, 'click a cooked patty to plate it', g.x + g.w - 16, g.y + 18, 13, '#cfd4d6', 'right', 400);
  for (let i = 0; i < state.grill.length; i += 1) {
    const cx = g.x + 62 + i * 126;
    const cy = g.y + 128;
    const slot = state.grill[i];
    if (!slot) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    const stage = donenessOf(slot.progress);
    if (stage === 'perfect') {
      ellipse(ctx, cx, cy, 52, 30, 'rgba(255,201,77,0.30)');
    }
    ctx.fillStyle = PATTY_COLOURS[stage];
    rr(ctx, cx - 42, cy - 15, 84, 30, 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, cx - 42, cy - 15, 84, 10, 5);
    ctx.fill();
    drawTimingRing(ctx, cx, cy, 50, slot.progress);
  }
}

function drawFryer(ctx, state) {
  const f = LAYOUT.fryer;
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, f.x, f.y, f.w, f.h, 14);
  ctx.fill();
  text(ctx, 'FRYER', f.x + 20, f.y + 18, 17, PALETTE.cream, 'left');
  for (let i = 0; i < state.fryer.length; i += 1) {
    const cx = f.x + 56 + i * 112;
    const cy = f.y + 118;
    ctx.fillStyle = '#8a6a1f';
    rr(ctx, cx - 46, cy - 44, 92, 96, 8);
    ctx.fill();
    ctx.fillStyle = '#d9a92e';
    rr(ctx, cx - 46, cy - 44, 92, 30, 8);
    ctx.fill();
    const slot = state.fryer[i];
    if (!slot) {
      text(ctx, 'empty', cx, cy + 26, 13, '#e8e2cc', 'center', 400);
      continue;
    }
    const stage = donenessOf(slot.progress);
    const browning = stage === 'raw' ? '#ffe9a3' : stage === 'perfect' ? '#ffd34d' : stage === 'done' ? '#eda93a' : '#6b4a26';
    ctx.fillStyle = browning;
    for (const off of [-26, -9, 9, 26]) {
      rr(ctx, cx + off - 5, cy - 58, 10, 52, 3);
      ctx.fill();
    }
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 3;
    rr(ctx, cx - 40, cy - 12, 80, 34, 5);
    ctx.stroke();
    drawTimingRing(ctx, cx, cy + 40, 27, slot.progress);
  }
}

function drawTrays(ctx, state, ui) {
  const t = LAYOUT.trays;
  for (let i = 0; i < TRAY_COUNT; i += 1) {
    const x = t.x + i * (t.w + t.gap);
    const active = i === state.activeTray;
    ctx.fillStyle = active ? '#5d3a1e' : 'rgba(60,38,18,0.55)';
    rr(ctx, x, t.y, t.w, t.h, 14);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    text(ctx, active ? `TRAY ${i + 1} — ACTIVE` : `TRAY ${i + 1} (click to use)`, x + t.w / 2, t.y + 20, 15, active ? PALETTE.goldBright : '#d9c39a');
    drawTrayContents(ctx, state.trays[i], x + t.w / 2, t.y + 138);
    if (state.trays[i].length === 0) text(ctx, 'empty', x + t.w / 2, t.y + 120, 14, 'rgba(255,246,224,0.5)', 'center', 400);
  }
}

function drawStations(ctx, state, ui) {
  const s = LAYOUT.stations;
  text(ctx, 'INGREDIENT STATIONS — click or press 1–8', s.x + 4, 532, 15, '#f3e3c2', 'left', 600);
  STATION_ORDER.forEach((id, i) => {
    const x = s.x + i * (s.w + s.gap);
    const info = { bun: 'Bun', patty: 'Patty', cheese: 'Cheese', lettuce: 'Lettuce', tomato: 'Tomato', fries: 'Fries', salad: 'Salad', drink: 'Drink' }[id];
    const hot = ui.hover && ui.hover.x >= x && ui.hover.x <= x + s.w && ui.hover.y >= s.y && ui.hover.y <= s.y + s.h;
    ctx.fillStyle = hot ? '#fff2d2' : PALETTE.ticket;
    rr(ctx, x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ellipse(ctx, x + 17, s.y + 17, 12, 12, PALETTE.wallBand);
    text(ctx, `${i + 1}`, x + 17, s.y + 18, 14, '#fff6e0');
    drawFood(ctx, id, x + s.w / 2, s.y + 52, 62, id === 'patty' ? 'raw' : null);
    text(ctx, info, x + s.w / 2, s.y + 96, 16, PALETTE.ink);
    const kind = id === 'patty' ? '→ grill' : id === 'fries' ? '→ fryer' : '→ tray';
    text(ctx, kind, x + s.w / 2, s.y + 115, 12, PALETTE.inkSoft, 'center', 400);
  });
}

function drawActions(ctx, state, ui) {
  const serve = LAYOUT.serveButton;
  const hotServe = ui.hover && ui.hover.x >= serve.x && ui.hover.x <= serve.x + serve.w && ui.hover.y >= serve.y && ui.hover.y <= serve.y + serve.h;
  ctx.fillStyle = hotServe ? '#4c9159' : PALETTE.green;
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.greenDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SERVE TRAY', serve.x + serve.w / 2, serve.y + 34, 27, '#ffffff');
  text(ctx, 'Space — serve the active tray', serve.x + serve.w / 2, serve.y + 66, 14, '#dff0da', 'center', 400);
  const trash = LAYOUT.trashButton;
  const hotTrash = ui.hover && ui.hover.x >= trash.x && ui.hover.x <= trash.x + trash.w && ui.hover.y >= trash.y && ui.hover.y <= trash.y + trash.h;
  ctx.fillStyle = hotTrash ? '#c65a41' : PALETTE.wallBand;
  rr(ctx, trash.x, trash.y, trash.w, trash.h, 14);
  ctx.fill();
  text(ctx, 'BIN TRAY', trash.x + trash.w / 2, trash.y + 34, 22, '#ffffff');
  text(ctx, 'Backspace — costs 2 coins', trash.x + trash.w / 2, trash.y + 66, 13, '#f6d9c8', 'center', 400);
  const goal = LAYOUT.goalPanel;
  ctx.fillStyle = 'rgba(46,74,56,0.92)';
  rr(ctx, goal.x, goal.y, goal.w, goal.h, 14);
  ctx.fill();
  const frac = Math.min(1, state.dayCoins / state.cfg.goal);
  text(ctx, `Today's goal: ${state.dayCoins} / ${state.cfg.goal} coins`, goal.x + 20, goal.y + 24, 18, PALETTE.cream, 'left');
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, goal.x + 20, goal.y + 44, goal.w - 40, 18, 9);
  ctx.fill();
  ctx.fillStyle = frac >= 1 ? PALETTE.goldBright : PALETTE.gold;
  if (frac > 0) {
    rr(ctx, goal.x + 20, goal.y + 44, Math.max(18, (goal.w - 40) * frac), 18, 9);
    ctx.fill();
  }
  text(ctx, 'Golden window = PERFECT serve. Burnt food goes in the bin!', goal.x + 20, goal.y + 78, 14, '#cfe3c8', 'left', 400);
}

function drawPopupsAndParticles(ctx, state) {
  for (const p of state.particles) {
    const a = 1 - p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, a);
    ellipse(ctx, p.x, p.y, p.size, p.size, p.colour);
  }
  ctx.globalAlpha = 1;
  for (const popup of state.popups) {
    const a = popup.life < 0.15 ? popup.life / 0.15 : 1 - Math.max(0, (popup.life - 0.8) / (popup.maxLife - 0.8));
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.font = `800 21px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(36,18,7,0.75)';
    ctx.strokeText(popup.text, popup.x, popup.y);
    ctx.fillStyle = popup.colour === '#b07f2e' ? PALETTE.goldBright : popup.colour;
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;
}

function drawKitchen(ctx, state, ui) {
  ctx.save();
  if (state.shake > 0) {
    const dx = Math.sin(state.elapsed * 70) * 5 * state.shake;
    ctx.translate(dx, 0);
  }
  drawBackground(ctx);
  drawTickets(ctx, state);
  drawGrill(ctx, state);
  drawFryer(ctx, state);
  drawTrays(ctx, state, ui);
  drawStations(ctx, state, ui);
  drawActions(ctx, state, ui);
  drawHud(ctx, state, ui);
  drawPopupsAndParticles(ctx, state);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Overlay screens
// ---------------------------------------------------------------------------

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(30,16,6,${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rr(ctx, x + 5, y + 7, w, h, 20);
  ctx.fill();
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSkillet(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.28);
  ctx.fillStyle = '#33383b';
  rr(ctx, s * 0.28, -s * 0.09, s * 0.62, s * 0.18, s * 0.09);
  ctx.fill();
  ctx.restore();
  ellipse(ctx, x, y, s * 0.42, s * 0.42, '#33383b');
  ellipse(ctx, x, y, s * 0.34, s * 0.34, '#4a5054');
  ellipse(ctx, x - s * 0.04, y + s * 0.02, s * 0.19, s * 0.15, '#fdfdf8');
  ellipse(ctx, x - s * 0.04, y + s * 0.02, s * 0.09, s * 0.09, PALETTE.goldBright);
}

function drawButton(ctx, rect, label, ui, primary) {
  const hot = ui.hover && ui.hover.x >= rect.x && ui.hover.x <= rect.x + rect.w && ui.hover.y >= rect.y && ui.hover.y <= rect.y + rect.h;
  ctx.fillStyle = primary ? (hot ? '#4c9159' : PALETTE.green) : (hot ? '#fff2d2' : PALETTE.cream);
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.strokeStyle = primary ? PALETTE.greenDark : PALETTE.brass;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, primary ? 26 : 20, primary ? '#ffffff' : PALETTE.ink);
}

function drawTitle(ctx, state, ui) {
  drawKitchen(ctx, state, ui);
  dim(ctx, 0.45);
  drawSkillet(ctx, 640, 168, 190);
  ctx.font = `800 92px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(36,18,7,0.85)';
  ctx.strokeText('Golden Skillet', 640, 292);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText('Golden Skillet', 640, 292);
  text(ctx, 'Cook fast. Serve golden. Keep the bistro alive.', 640, 356, 24, PALETTE.cream, 'center', 600);
  if (ui.best > 0) text(ctx, `Best score: ${ui.best}`, 640, 398, 19, '#e8cf9f', 'center', 600);
  drawButton(ctx, BUTTONS.play, '▶  PLAY', ui, true);
  drawButton(ctx, BUTTONS.howto, 'How to Play', ui, false);
  text(ctx, 'Mouse or touch to cook • Keys 1–8 for stations • Space serves', 640, 640, 17, '#e8cf9f', 'center', 400);
}

function drawHowto(ctx, state, ui) {
  drawKitchen(ctx, state, ui);
  dim(ctx, 0.55);
  panel(ctx, 240, 70, 800, 620);
  text(ctx, 'How to Play', 640, 116, 36, PALETTE.ink);
  const lines = [
    ['1.', 'Customers pin order tickets to the green board. Each ticket'],
    ['', 'shows the dish, its price, and a patience bar that drains.'],
    ['2.', 'Click ingredient stations (or press 1–8) to build the dish'],
    ['', 'on the active tray. You have two trays — click one to switch.'],
    ['3.', 'Patties go on the GRILL, fries in the FRYER. Watch the ring:'],
    ['', 'take food off in the golden window for a PERFECT serve.'],
    ['', 'Leave it too long and it burns — burnt food only fits the bin.'],
    ['4.', 'Press SERVE (Space) when the tray matches a ticket exactly.'],
    ['', 'Fast, golden serves earn tips and build your combo.'],
    ['5.', 'Bin a tray with BIN (Backspace) for 2 coins. Reach the coin'],
    ['', "goal before the day timer ends, or the bistro closes!"],
  ];
  lines.forEach(([num, line], i) => {
    const y = 168 + i * 33;
    if (num) text(ctx, num, 316, y, 20, PALETTE.wallBand, 'right');
    text(ctx, line, 330, y, 20, PALETTE.ink, 'left', 500);
  });
  // A mini legend of the cooking stages.
  const stages = [['raw', 'RAW'], ['perfect', 'PERFECT'], ['done', 'DONE'], ['burnt', 'BURNT']];
  stages.forEach(([stage, label], i) => {
    const x = 356 + i * 190;
    ellipse(ctx, x, 574, 13, 13, STAGE_COLOURS[stage]);
    text(ctx, label, x + 22, 575, 16, PALETTE.inkSoft, 'left', 600);
  });
  drawButton(ctx, BUTTONS.howtoClose, 'Back', ui, true);
}

function drawPaused(ctx, state, ui) {
  drawKitchen(ctx, state, ui);
  dim(ctx, 0.55);
  panel(ctx, 390, 240, 500, 420);
  text(ctx, 'Paused', 640, 306, 40, PALETTE.ink);
  text(ctx, 'The grill is holding its breath…', 640, 348, 17, PALETTE.inkSoft, 'center', 400);
  drawButton(ctx, BUTTONS.resume, 'Resume', ui, true);
  drawButton(ctx, BUTTONS.restartDay, 'Restart Day', ui, false);
  drawButton(ctx, BUTTONS.toMenu, 'Back to Menu', ui, false);
}

function drawDayEnd(ctx, state, ui) {
  drawKitchen(ctx, state, ui);
  dim(ctx, 0.5);
  panel(ctx, 340, 130, 600, 560);
  if (state.dayWon) {
    text(ctx, `Day ${state.day} Complete!`, 640, 186, 38, PALETTE.greenDark);
    text(ctx, 'The bistro lives to cook another day.', 640, 224, 17, PALETTE.inkSoft, 'center', 400);
  } else {
    text(ctx, `Day ${state.day} Missed`, 640, 186, 38, PALETTE.red);
    text(ctx, 'The goal slipped away — the bistro closes.', 640, 224, 17, PALETTE.inkSoft, 'center', 400);
  }
  const rows = [
    ['Coins earned', `${state.dayCoins} / ${state.cfg.goal}`],
    ['Customers served', `${state.served}`],
    ['Perfect serves', `${state.perfects}`],
    ['Best combo', `x${state.bestCombo}`],
    ['Customers lost', `${state.lost}`],
    ['Total score', `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 272 + i * 38;
    text(ctx, label, 420, y, 20, PALETTE.ink, 'left', 500);
    text(ctx, value, 860, y, 20, PALETTE.ink, 'right');
    ctx.strokeStyle = 'rgba(217,184,120,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(420, y + 19);
    ctx.lineTo(860, y + 19);
    ctx.stroke();
  });
  if (ui.best > 0) text(ctx, `Best score: ${ui.best}`, 640, 502, 16, PALETTE.inkSoft, 'center', 600);
  drawButton(ctx, BUTTONS.dayPrimary, state.dayWon ? `Start Day ${state.day + 1}` : 'Try Again', ui, true);
  drawButton(ctx, BUTTONS.dayMenu, 'Back to Menu', ui, false);
}

// ---------------------------------------------------------------------------
// The renderer itself
// ---------------------------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    offsetX = (canvas.width - VIEW.width * scale) / 2;
    offsetY = (canvas.height - VIEW.height * scale) / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
  }

  function draw(state, screen, ui) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2a1a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.beginPath();
    ctx.rect(0, 0, VIEW.width, VIEW.height);
    ctx.clip();
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, ui);
    else if (screen === SCREEN_HOWTO) drawHowto(ctx, state, ui);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx, state, ui);
    else if (screen === SCREEN_DAYEND) drawDayEnd(ctx, state, ui);
    else drawKitchen(ctx, state, ui);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return { draw, toLogical, resize };
}
