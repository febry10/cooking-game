// Golden Skillet's boot module: owns the canvas, the screen the player is on
// (title, how to play, play, paused, day results), the fixed-step game loop, and
// every pointer and keyboard input. The kitchen module holds the rules; this one
// just routes clicks and keys to it and plays the sounds it asks for.
//
// ?seed=N fixes the order rush. ?shot=start|play|end (with &seed=N) stages one
// deterministic scene from shots.js instead of running the loop, paints it twice
// and sets window.__shotReady for the screenshot harness.

import { BEST_KEY, LAYOUT, MUTE_KEY, STATION_ORDER, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  cookingAction, createKitchen, fryerSlotCentre, grillSlotCentre, serveActive,
  startDay, stationAction, selectTray, trashActive, update as stepKitchen,
} from './kitchen.js';
import {
  BUTTONS, createRenderer, SCREEN_DAYEND, SCREEN_HOWTO, SCREEN_PAUSED,
  SCREEN_PLAY, SCREEN_TITLE,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
// A handle for automated tests and curious players: the live kitchen state.
window.__kitchen = kitchen;
const renderer = createRenderer(canvas);
const audio = createAudio();

function readFlag(key) {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

const ui = { best: readBest(), muted: readFlag(MUTE_KEY), hover: null };
audio.setMuted(ui.muted);

function announce(message) {
  status.textContent = message;
}

const EVENT_SOUNDS = {
  pop: () => audio.sfx.pop(),
  sizzle: () => audio.sfx.sizzle(),
  trash: () => audio.sfx.trash(),
  buzz: () => audio.sfx.buzz(),
  ding: () => audio.sfx.ding(),
  coin: () => audio.sfx.coin(),
  leave: () => audio.sfx.leave(),
  ticket: () => audio.sfx.ticket(),
  click: () => audio.sfx.click(),
  fanfare: () => audio.sfx.fanfare(),
  perfect: () => audio.sfx.ding(),
  ready: () => audio.sfx.click(),
  burnt: () => audio.sfx.sizzle(),
  denied: () => audio.sfx.click(),
};

function drainEvents() {
  if (kitchen.events.length === 0) return;
  const played = new Set();
  for (const name of kitchen.events) {
    if (played.has(name)) continue;
    played.add(name);
    const play = EVENT_SOUNDS[name];
    if (play) play();
  }
  kitchen.events.length = 0;
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  ui.best = scene.best;
  let painted = 0;
  function paint() {
    renderer.draw(kitchen, scene.screen, ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  // Coins and score as they stood when the current day began, so Restart Day and
  // Try Again can hand back what the day earned before replaying it.
  let dayStartCoins = 0;
  let dayStartScore = 0;

  function beginDay(day) {
    dayStartCoins = kitchen.coins;
    dayStartScore = kitchen.score;
    startDay(kitchen, day);
    screen = SCREEN_PLAY;
    announce(`Day ${day}. Goal ${kitchen.cfg.goal} coins.`);
  }

  function startRun() {
    kitchen.coins = 0;
    kitchen.score = 0;
    audio.startMusic();
    beginDay(1);
  }

  function finishDayIfNeeded() {
    if (screen !== SCREEN_PLAY || !kitchen.dayOver) return;
    screen = SCREEN_DAYEND;
    if (kitchen.score > ui.best) {
      ui.best = kitchen.score;
      saveBest(ui.best);
    }
    announce(kitchen.dayWon
      ? `Day ${kitchen.day} complete. ${kitchen.dayCoins} coins earned.`
      : `Day ${kitchen.day} missed. The bistro closes. Score ${kitchen.score}.`);
  }

  function toggleMute() {
    ui.muted = !ui.muted;
    audio.setMuted(ui.muted);
    try {
      window.localStorage.setItem(MUTE_KEY, ui.muted ? '1' : '0');
    } catch {
      // Mute then lasts this visit only.
    }
  }

  function inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function handlePlayClick(point) {
    if (inRect(point, LAYOUT.pauseButton)) {
      screen = SCREEN_PAUSED;
      audio.sfx.click();
      announce('Paused.');
      return;
    }
    if (inRect(point, LAYOUT.muteButton)) {
      toggleMute();
      return;
    }
    for (let i = 0; i < kitchen.grill.length; i += 1) {
      const c = grillSlotCentre(i);
      if (Math.hypot(point.x - c.x, point.y - c.y) <= 58) {
        cookingAction(kitchen, 'grill', i);
        return;
      }
    }
    for (let i = 0; i < kitchen.fryer.length; i += 1) {
      const c = fryerSlotCentre(i);
      if (Math.abs(point.x - c.x) <= 54 && Math.abs(point.y - c.y) <= 66) {
        cookingAction(kitchen, 'fryer', i);
        return;
      }
    }
    const t = LAYOUT.trays;
    for (let i = 0; i < 2; i += 1) {
      if (inRect(point, { x: t.x + i * (t.w + t.gap), y: t.y, w: t.w, h: t.h })) {
        selectTray(kitchen, i);
        return;
      }
    }
    const s = LAYOUT.stations;
    for (let i = 0; i < STATION_ORDER.length; i += 1) {
      if (inRect(point, { x: s.x + i * (s.w + s.gap), y: s.y, w: s.w, h: s.h })) {
        stationAction(kitchen, STATION_ORDER[i]);
        return;
      }
    }
    if (inRect(point, LAYOUT.serveButton)) {
      serveActive(kitchen);
      return;
    }
    if (inRect(point, LAYOUT.trashButton)) trashActive(kitchen);
  }

  function handleClick(point) {
    audio.unlock();
    if (screen === SCREEN_TITLE) {
      if (inRect(point, BUTTONS.play)) {
        audio.sfx.click();
        startRun();
      } else if (inRect(point, BUTTONS.howto)) {
        audio.sfx.click();
        screen = SCREEN_HOWTO;
      }
    } else if (screen === SCREEN_HOWTO) {
      if (inRect(point, BUTTONS.howtoClose)) {
        audio.sfx.click();
        screen = SCREEN_TITLE;
      }
    } else if (screen === SCREEN_PLAY) {
      handlePlayClick(point);
    } else if (screen === SCREEN_PAUSED) {
      if (inRect(point, BUTTONS.resume)) {
        audio.sfx.click();
        screen = SCREEN_PLAY;
      } else if (inRect(point, BUTTONS.restartDay)) {
        audio.sfx.click();
        kitchen.coins = dayStartCoins;
        kitchen.score = dayStartScore;
        beginDay(kitchen.day);
      } else if (inRect(point, BUTTONS.toMenu)) {
        audio.sfx.click();
        screen = SCREEN_TITLE;
      }
    } else if (screen === SCREEN_DAYEND) {
      if (inRect(point, BUTTONS.dayPrimary)) {
        audio.sfx.click();
        if (kitchen.dayWon) beginDay(kitchen.day + 1);
        else {
          kitchen.coins = dayStartCoins;
          kitchen.score = dayStartScore;
          beginDay(kitchen.day);
        }
      } else if (inRect(point, BUTTONS.dayMenu)) {
        audio.sfx.click();
        screen = SCREEN_TITLE;
      }
    }
    drainEvents();
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handleClick(renderer.toLogical(event.clientX, event.clientY));
  });
  canvas.addEventListener('pointermove', (event) => {
    ui.hover = renderer.toLogical(event.clientX, event.clientY);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    audio.unlock();
    if (screen === SCREEN_PLAY) {
      if (key >= '1' && key <= '8') stationAction(kitchen, STATION_ORDER[Number(key) - 1]);
      else if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        serveActive(kitchen);
      } else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        trashActive(kitchen);
      } else if (key === 'Escape' || key === 'p' || key === 'P') {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (key === 'm' || key === 'M') toggleMute();
    } else if (screen === SCREEN_PAUSED) {
      if (key === 'Escape' || key === 'p' || key === 'P' || key === 'Enter') screen = SCREEN_PLAY;
    } else if (screen === SCREEN_TITLE) {
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        startRun();
      }
    } else if (screen === SCREEN_HOWTO) {
      if (key === 'Escape' || key === 'Enter') screen = SCREEN_TITLE;
    } else if (screen === SCREEN_DAYEND) {
      if (key === 'Enter') {
        if (kitchen.dayWon) beginDay(kitchen.day + 1);
        else {
          kitchen.coins = dayStartCoins;
          kitchen.score = dayStartScore;
          beginDay(kitchen.day);
        }
      }
    }
    drainEvents();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        updateKitchen();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    drainEvents();
    renderer.draw(kitchen, screen, ui);
  }

  function updateKitchen() {
    stepKitchen(kitchen, STEP);
    finishDayIfNeeded();
  }

  announce('Golden Skillet. Press Play to open the bistro.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
