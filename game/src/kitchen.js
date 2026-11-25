// Golden Skillet's kitchen: the whole simulation, with no drawing and no DOM.
// Orders arrive, patties and fries cook through raw -> perfect -> done -> burnt,
// trays are assembled from the stations, and serving a tray that matches a ticket
// pays coins plus a patience tip. The renderer only reads this state; input only
// calls the action functions at the bottom. Sound and announcements are requested
// by pushing names onto state.events, which the boot module drains each frame.

import {
  COOK, CUSTOMER_HAIR, CUSTOMER_SHIRTS, CUSTOMER_SKINS, DISHES, ECONOMY,
  FRYER_SLOTS, GRILL_SLOTS, INGREDIENTS, LAYOUT, MAX_ORDERS, TRAY_COUNT,
  TRAY_MAX_ITEMS, dayConfig,
} from './config.js';

/** Which cooking stage a portion is in, from its 0..1+ progress. */
export function donenessOf(progress) {
  if (progress >= COOK.burntFrom) return 'burnt';
  if (progress >= COOK.perfectTo) return 'done';
  if (progress >= COOK.perfectFrom) return 'perfect';
  return 'raw';
}

/** The menu price of a list of ingredient ids: the sum of the parts. */
export function priceOf(items) {
  return items.reduce((sum, id) => sum + INGREDIENTS[id].price, 0);
}

/** True when a tray holds exactly the items a ticket asks for (order does not matter). */
export function trayMatches(tray, items) {
  if (tray.length !== items.length) return false;
  const counts = new Map();
  for (const id of items) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const entry of tray) {
    const left = counts.get(entry.id) ?? 0;
    if (left === 0) return false;
    counts.set(entry.id, left - 1);
  }
  return true;
}

export function createKitchen(rng) {
  const state = {
    rng,
    day: 1,
    cfg: dayConfig(1),
    timeLeft: 0,
    dayOver: false,
    dayWon: false,
    coins: 0,
    dayCoins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    perfects: 0,
    lost: 0,
    rejected: 0,
    orders: [],
    nextOrderId: 1,
    spawnTimer: 0,
    grill: new Array(GRILL_SLOTS).fill(null),
    fryer: new Array(FRYER_SLOTS).fill(null),
    trays: Array.from({ length: TRAY_COUNT }, () => []),
    activeTray: 0,
    popups: [],
    particles: [],
    events: [],
    shake: 0,
    elapsed: 0,
  };
  return state;
}

export function startDay(state, day) {
  state.day = day;
  state.cfg = dayConfig(day);
  state.timeLeft = state.cfg.seconds;
  state.dayOver = false;
  state.dayWon = false;
  state.dayCoins = 0;
  state.combo = 0;
  state.served = 0;
  state.perfects = 0;
  state.lost = 0;
  state.rejected = 0;
  state.orders = [];
  state.grill.fill(null);
  state.fryer.fill(null);
  state.trays = Array.from({ length: TRAY_COUNT }, () => []);
  state.activeTray = 0;
  state.popups = [];
  state.particles = [];
  state.spawnTimer = 6;
  // The first two customers are already at the counter when the shutters go up.
  addOrder(state);
  addOrder(state);
}

function addOrder(state) {
  const menu = DISHES.filter((dish) => dish.minDay <= state.day);
  const dish = state.rng.pick(menu);
  const patienceMax = state.cfg.patience * state.rng.range(0.85, 1.2);
  state.orders.push({
    id: state.nextOrderId,
    dish,
    price: priceOf(dish.items),
    patience: patienceMax,
    patienceMax,
    skin: state.rng.pick(CUSTOMER_SKINS),
    hair: state.rng.pick(CUSTOMER_HAIR),
    shirt: state.rng.pick(CUSTOMER_SHIRTS),
  });
  state.nextOrderId += 1;
  state.events.push('ticket');
}

/** The on-screen centre of a ticket, a grill slot, a fryer basket or a tray. */
export function ticketCentre(index) {
  const t = LAYOUT.tickets;
  return { x: t.x + index * (t.w + t.gap) + t.w / 2, y: t.y + t.h / 2 };
}
export function grillSlotCentre(index) {
  const g = LAYOUT.grill;
  return { x: g.x + 62 + index * 126, y: g.y + 128 };
}
export function fryerSlotCentre(index) {
  const f = LAYOUT.fryer;
  return { x: f.x + 56 + index * 112, y: f.y + 118 };
}
export function trayCentre(index) {
  const t = LAYOUT.trays;
  return { x: t.x + index * (t.w + t.gap) + t.w / 2, y: t.y + t.h / 2 };
}

export function spawnPopup(state, x, y, text, colour) {
  state.popups.push({ x, y, text, colour, life: 0, maxLife: 1.25 });
}

export function spawnParticles(state, x, y, count, colour, spread = 46, up = 60) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x: x + state.rng.range(-spread, spread) * 0.4,
      y,
      vx: state.rng.range(-spread, spread),
      vy: state.rng.range(-up, -up * 0.25),
      life: 0,
      maxLife: state.rng.range(0.45, 0.95),
      size: state.rng.range(2, 5),
      colour,
    });
  }
}

function updateCooking(state, slots, seconds, centres, dt) {
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot) continue;
    const before = donenessOf(slot.progress);
    slot.progress += dt / seconds;
    const after = donenessOf(slot.progress);
    const c = centres(i);
    if (before !== 'burnt' && after === 'burnt') {
      state.events.push('burnt');
      spawnPopup(state, c.x, c.y - 52, 'Burnt!', '#c0392b');
      spawnParticles(state, c.x, c.y - 10, 8, '#4a4a4a');
    } else if (after === 'perfect' && before === 'raw') {
      state.events.push('ready');
    }
    // A gentle wisp of steam while anything is on the heat.
    if (after !== 'burnt' && state.rng.chance(0.10)) {
      spawnParticles(state, c.x, c.y - 16, 1, 'rgba(255,255,255,0.8)', 16, 34);
    }
    if (after === 'burnt' && state.rng.chance(0.06)) {
      spawnParticles(state, c.x, c.y - 14, 1, 'rgba(70,70,70,0.7)', 12, 30);
    }
  }
}

export function update(state, dt) {
  state.elapsed += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.4);

  for (const popup of state.popups) {
    popup.life += dt;
    popup.y -= 34 * dt;
  }
  state.popups = state.popups.filter((p) => p.life < p.maxLife);
  for (const p of state.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 26 * dt; // steam and sparks drift upward
  }
  state.particles = state.particles.filter((p) => p.life < p.maxLife);

  if (state.dayOver) return;

  state.timeLeft -= dt;
  updateCooking(state, state.grill, COOK.pattySeconds, grillSlotCentre, dt);
  updateCooking(state, state.fryer, COOK.friesSeconds, fryerSlotCentre, dt);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.orders.length < MAX_ORDERS) addOrder(state);
    state.spawnTimer = state.cfg.spawnEvery * state.rng.range(0.75, 1.3);
  }

  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      const c = ticketCentre(i);
      state.orders.splice(i, 1);
      state.lost += 1;
      state.combo = 0;
      state.score = Math.max(0, state.score - ECONOMY.walkoutPenalty * ECONOMY.scorePerCoin);
      state.events.push('leave');
      spawnPopup(state, c.x, c.y - 30, 'Too slow!', '#c0392b');
    }
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.dayOver = true;
    state.dayWon = state.dayCoins >= state.cfg.goal;
    state.events.push(state.dayWon ? 'fanfare' : 'leave');
  }
}

/** A click on an ingredient station (or its number key). */
export function stationAction(state, id) {
  const info = INGREDIENTS[id];
  if (!info || state.dayOver) return;
  if (info.kind === 'direct') {
    const tray = state.trays[state.activeTray];
    if (tray.length >= TRAY_MAX_ITEMS) {
      state.events.push('buzz');
      spawnPopup(state, trayCentre(state.activeTray).x, 470, 'Tray is full!', '#c0392b');
      return;
    }
    tray.push({ id, doneness: null });
    state.events.push('pop');
    const c = trayCentre(state.activeTray);
    spawnParticles(state, c.x, c.y + 30, 3, '#ffc94d', 60, 30);
    return;
  }
  const slots = info.kind === 'grill' ? state.grill : state.fryer;
  const free = slots.indexOf(null);
  if (free === -1) {
    state.events.push('buzz');
    spawnPopup(state, 320, 200, info.kind === 'grill' ? 'Grill is full!' : 'Fryer is full!', '#c0392b');
    return;
  }
  slots[free] = { progress: 0 };
  state.events.push('sizzle');
}

/** A click on a grill slot or fryer basket: harvest it, bin it, or wait. */
export function cookingAction(state, appliance, index) {
  const slots = appliance === 'grill' ? state.grill : state.fryer;
  const centres = appliance === 'grill' ? grillSlotCentre : fryerSlotCentre;
  const slot = slots[index];
  if (!slot || state.dayOver) return;
  const stage = donenessOf(slot.progress);
  const c = centres(index);
  if (stage === 'burnt') {
    slots[index] = null;
    state.events.push('trash');
    spawnPopup(state, c.x, c.y - 52, 'Binned', '#6d5138');
    spawnParticles(state, c.x, c.y, 7, '#4a4a4a');
    return;
  }
  if (stage === 'raw') {
    state.events.push('denied');
    spawnPopup(state, c.x, c.y - 52, 'Still cooking…', '#6d5138');
    return;
  }
  const tray = state.trays[state.activeTray];
  if (tray.length >= TRAY_MAX_ITEMS) {
    state.events.push('buzz');
    spawnPopup(state, trayCentre(state.activeTray).x, 470, 'Tray is full!', '#c0392b');
    return;
  }
  tray.push({ id: appliance === 'grill' ? 'patty' : 'fries', doneness: stage });
  slots[index] = null;
  state.events.push('pop');
  spawnParticles(state, c.x, c.y - 8, 4, '#ffc94d', 40, 40);
}

export function selectTray(state, index) {
  if (index >= 0 && index < TRAY_COUNT && index !== state.activeTray) {
    state.activeTray = index;
    state.events.push('click');
  }
}

/** Serve the active tray to the first ticket it matches exactly. */
export function serveActive(state) {
  const tray = state.trays[state.activeTray];
  const button = { x: LAYOUT.serveButton.x + LAYOUT.serveButton.w / 2, y: LAYOUT.serveButton.y - 12 };
  if (state.dayOver) return;
  if (tray.length === 0) {
    state.events.push('denied');
    spawnPopup(state, button.x, button.y, 'Tray is empty', '#6d5138');
    return;
  }
  if (tray.some((entry) => entry.doneness === 'burnt')) {
    state.events.push('buzz');
    state.rejected += 1;
    state.shake = 1;
    spawnPopup(state, button.x, button.y, 'Burnt food! Bin it first', '#c0392b');
    return;
  }
  if (tray.some((entry) => entry.doneness === 'raw')) {
    state.events.push('buzz');
    state.rejected += 1;
    state.shake = 1;
    spawnPopup(state, button.x, button.y, 'That is still raw!', '#c0392b');
    return;
  }
  const index = state.orders.findIndex((order) => trayMatches(tray, order.dish.items));
  if (index === -1) {
    state.events.push('buzz');
    state.rejected += 1;
    state.shake = 1;
    spawnPopup(state, button.x, button.y, 'No ticket matches this tray', '#c0392b');
    return;
  }
  const order = state.orders[index];
  const patienceFrac = Math.max(0, order.patience / order.patienceMax);
  const cooked = tray.filter((entry) => entry.doneness !== null);
  const golden = cooked.every((entry) => entry.doneness === 'perfect');
  const perfect = golden && patienceFrac >= 0.45;
  const tip = Math.round(order.price * 0.6 * patienceFrac);
  let gained = order.price + tip;
  if (perfect) {
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.perfects += 1;
    gained += ECONOMY.perfectBonus + Math.floor(state.combo / ECONOMY.comboCoinStep);
  } else {
    state.combo = 0;
  }
  state.coins += gained;
  state.dayCoins += gained;
  state.score += gained * ECONOMY.scorePerCoin + (perfect ? 50 : 0);
  state.served += 1;
  const c = ticketCentre(index);
  state.orders.splice(index, 1);
  state.trays[state.activeTray] = [];
  state.events.push('ding', 'coin');
  if (perfect) state.events.push('perfect');
  spawnPopup(state, c.x, c.y - 44, `+${gained} coins`, '#b07f2e');
  if (perfect) spawnPopup(state, c.x, c.y - 76, 'PERFECT!', '#3e7d4e');
  if (state.combo >= 2) spawnPopup(state, c.x, c.y - 106, `Combo x${state.combo}`, '#b4552d');
  spawnParticles(state, c.x, c.y, 10, '#ffc94d', 70, 70);
}

/** Bin the active tray's contents, for a small fee when there is anything to bin. */
export function trashActive(state) {
  const tray = state.trays[state.activeTray];
  if (tray.length === 0 || state.dayOver) {
    if (tray.length === 0) state.events.push('denied');
    return;
  }
  const fee = Math.min(ECONOMY.trashCost, state.coins);
  state.coins -= fee;
  state.trays[state.activeTray] = [];
  state.events.push('trash');
  const c = trayCentre(state.activeTray);
  spawnPopup(state, c.x, 470, fee > 0 ? `Binned (-${fee})` : 'Binned', '#6d5138');
  spawnParticles(state, c.x, c.y + 20, 6, '#9aa0a3', 50, 40);
}
