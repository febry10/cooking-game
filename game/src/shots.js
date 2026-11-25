// The deterministic screenshot scenes behind ?shot=start|play|end&seed=N.
// Each scene builds a real kitchen with the seeded random and then arranges it by
// hand — fixed orders, fixed cooking progress, fixed trays — so the composed frame
// is identical on every run and shows the game the way a player would see it.
// Nothing here animates: the boot module paints the staged frame twice and stops.

import { CUSTOMER_HAIR, CUSTOMER_SHIRTS, CUSTOMER_SKINS, DISHES } from './config.js';
import { priceOf, startDay } from './kitchen.js';
import { SCREEN_DAYEND, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stagedOrder(state, dishId, patienceFrac, lookIndex) {
  const dish = DISHES.find((d) => d.id === dishId);
  const patienceMax = 60;
  return {
    id: state.nextOrderId++,
    dish,
    price: priceOf(dish.items),
    patience: patienceMax * patienceFrac,
    patienceMax,
    skin: CUSTOMER_SKINS[lookIndex % CUSTOMER_SKINS.length],
    hair: CUSTOMER_HAIR[lookIndex % CUSTOMER_HAIR.length],
    shirt: CUSTOMER_SHIRTS[lookIndex % CUSTOMER_SHIRTS.length],
  };
}

/** The title screen over a just-opened kitchen. */
function stageStart(state) {
  startDay(state, 1);
  return { screen: SCREEN_TITLE, best: 0 };
}

/**
 * A mid-rush moment on Day 1: three tickets on the board, a patty in the golden
 * window and another still raw on the grill, fries frying, one tray holding a
 * finished cheeseburger ready to serve and the other a burger half assembled.
 */
function stagePlay(state) {
  startDay(state, 1);
  state.orders = [
    stagedOrder(state, 'cheese', 0.82, 0),
    stagedOrder(state, 'garden', 0.55, 1),
    stagedOrder(state, 'meal', 0.30, 2),
  ];
  state.timeLeft = 47;
  state.coins = 36;
  state.dayCoins = 36;
  state.score = 410;
  state.combo = 3;
  state.bestCombo = 3;
  state.served = 3;
  // The grill: one patty golden, one still raw. The fryer: fries mid-window.
  state.grill[0] = { progress: 0.60 };
  state.grill[1] = { progress: 0.22 };
  state.fryer[0] = { progress: 0.55 };
  // Tray 1: a finished cheeseburger, ready to serve to the first ticket.
  state.trays[0] = [
    { id: 'bun', doneness: null },
    { id: 'patty', doneness: 'perfect' },
    { id: 'cheese', doneness: null },
  ];
  // Tray 2: a garden burger half assembled.
  state.trays[1] = [
    { id: 'bun', doneness: null },
    { id: 'lettuce', doneness: null },
  ];
  state.activeTray = 0;
  state.popups.push({ x: 802, y: 264, text: '+18 coins', colour: '#b07f2e', life: 0.3, maxLife: 1.25 });
  state.popups.push({ x: 86, y: 284, text: 'PERFECT!', colour: '#b07f2e', life: 0.3, maxLife: 1.25 });
  return { screen: SCREEN_PLAY, best: 900 };
}

/** The Day 1 results screen, goal reached. */
function stageEnd(state) {
  startDay(state, 1);
  state.orders = [stagedOrder(state, 'burger', 0.7, 3)];
  state.dayOver = true;
  state.dayWon = true;
  state.timeLeft = 0;
  state.coins = 128;
  state.dayCoins = 128;
  state.score = 1420;
  state.served = 11;
  state.perfects = 6;
  state.bestCombo = 5;
  state.lost = 1;
  state.trays[0] = [
    { id: 'bun', doneness: null },
    { id: 'patty', doneness: 'perfect' },
    { id: 'cheese', doneness: null },
  ];
  return { screen: SCREEN_DAYEND, best: 1500 };
}

/** Set the kitchen to the named scene and say which screen to draw over it. */
export function stageShot(name, state) {
  if (name === 'play') return stagePlay(state);
  if (name === 'end') return stageEnd(state);
  return stageStart(state);
}
