// Golden Skillet — every tuning number, colour and layout rectangle in one place.
// The kitchen is drawn in a fixed 1280x800 logical space; the renderer scales that
// space to whatever window the game finds itself in, so nothing below depends on
// the real screen size.

export const VIEW = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** Warm bistro palette: cream walls, terracotta, deep green, wood browns, brass. */
export const PALETTE = {
  wallTop: '#f3e3c2',
  wallBottom: '#e8cf9f',
  wallBand: '#b4552d', // terracotta stripe along the wall
  floor: '#8a5a33',
  floorDark: '#744a29',
  counterTop: '#a06a3b',
  counterFace: '#7c4f27',
  counterEdge: '#c98d4e',
  board: '#2e4a38', // deep green order board
  boardFrame: '#5d3a1e',
  ticket: '#fff6e0',
  ticketEdge: '#d9b878',
  ink: '#3a2413',
  inkSoft: '#6d5138',
  cream: '#fff8ea',
  green: '#3e7d4e',
  greenDark: '#2e5c3a',
  red: '#c0392b',
  gold: '#e9a13b',
  goldBright: '#ffc94d',
  brass: '#b07f2e',
  steel: '#9aa0a3',
  steelDark: '#6f7477',
  black: '#241207',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/**
 * The ingredient catalogue. `kind` decides how a station behaves:
 *  - 'direct': one click puts the item straight onto the active tray.
 *  - 'grill' / 'fryer': one click starts a raw portion cooking; click the finished
 *    portion to move it onto the tray.
 * `key` is the keyboard shortcut shown on the station.
 */
export const INGREDIENTS = {
  bun:     { label: 'Bun',     kind: 'direct', key: '1', price: 2 },
  patty:   { label: 'Patty',   kind: 'grill',  key: '2', price: 5 },
  cheese:  { label: 'Cheese',  kind: 'direct', key: '3', price: 2 },
  lettuce: { label: 'Lettuce', kind: 'direct', key: '4', price: 1 },
  tomato:  { label: 'Tomato',  kind: 'direct', key: '5', price: 1 },
  fries:   { label: 'Fries',   kind: 'fryer',  key: '6', price: 4 },
  salad:   { label: 'Salad',   kind: 'direct', key: '7', price: 6 },
  drink:   { label: 'Drink',   kind: 'direct', key: '8', price: 4 },
};

/** Station order along the counter, left to right. */
export const STATION_ORDER = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'fries', 'salad', 'drink'];

/**
 * Dish templates. `items` is the exact multiset a tray must hold to serve the dish;
 * burgers always list the bun once (the bun is drawn as a full bun around the stack).
 * `minDay` is the first day the dish can be ordered.
 */
export const DISHES = [
  { id: 'burger',    name: 'Burger',          items: ['bun', 'patty'],                              minDay: 1 },
  { id: 'cheese',    name: 'Cheeseburger',    items: ['bun', 'patty', 'cheese'],                    minDay: 1 },
  { id: 'garden',    name: 'Garden Burger',   items: ['bun', 'patty', 'lettuce', 'tomato'],         minDay: 1 },
  { id: 'fries',     name: 'Fries',           items: ['fries'],                                     minDay: 1 },
  { id: 'drink',     name: 'Soda',            items: ['drink'],                                     minDay: 1 },
  { id: 'salad',     name: 'Garden Salad',    items: ['salad'],                                     minDay: 2 },
  { id: 'deluxe',    name: 'Deluxe Burger',   items: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'], minDay: 2 },
  { id: 'burgerfry', name: 'Burger & Fries',  items: ['bun', 'patty', 'fries'],                     minDay: 2 },
  { id: 'meal',      name: 'Skillet Meal',    items: ['bun', 'patty', 'cheese', 'fries', 'drink'],  minDay: 3 },
  { id: 'feast',     name: 'Bistro Feast',    items: ['bun', 'patty', 'cheese', 'lettuce', 'fries', 'drink'], minDay: 3 },
];

/** Cooking windows, as fractions of a portion's total cook time. */
export const COOK = {
  pattySeconds: 6.0,
  friesSeconds: 4.5,
  perfectFrom: 0.42, // before this the portion is still raw
  perfectTo: 0.78,   // the golden window: take it off here for a PERFECT
  burntFrom: 1.0,    // at 1.0 the portion is burnt and only fit for the bin
};

export const GRILL_SLOTS = 3;
export const FRYER_SLOTS = 2;
export const TRAY_COUNT = 2;
export const TRAY_MAX_ITEMS = 7;
export const MAX_ORDERS = 4;

/** Per-day tuning: how long the day lasts, the coin goal, and how the rush feels. */
export function dayConfig(day) {
  return {
    seconds: 90 + Math.min(30, (day - 1) * 5),
    goal: 110 + (day - 1) * 70,
    spawnEvery: Math.max(4.2, 8.5 - (day - 1) * 0.8),
    patience: Math.max(34, 62 - (day - 1) * 4),
  };
}

export const ECONOMY = {
  perfectBonus: 4,   // extra coins when every cooked item on the tray was perfect
  comboCoinStep: 3,  // every this many combo serves adds +1 coin to the next serve
  trashCost: 2,      // coins charged for binning a non-empty tray
  walkoutPenalty: 5, // score lost when a customer's patience runs out
  scorePerCoin: 10,
};

/** Where things sit in the 1280x800 kitchen. All rectangles are {x, y, w, h}. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 54 },
  tickets: { x: 16, y: 64, w: 296, h: 140, gap: 12 },
  grill: { x: 24, y: 222, w: 376, h: 218 },
  fryer: { x: 416, y: 222, w: 224, h: 218 },
  trays: { x: 656, y: 222, w: 292, h: 218, gap: 16 },
  stations: { x: 16, y: 548, w: 120, h: 128, gap: 8 },
  actions: { y: 692, h: 92 },
  serveButton: { x: 16, y: 692, w: 300, h: 92 },
  trashButton: { x: 332, y: 692, w: 200, h: 92 },
  goalPanel: { x: 548, y: 692, w: 716, h: 92 },
  pauseButton: { x: 1152, y: 8, w: 56, h: 38 },
  muteButton: { x: 1216, y: 8, w: 56, h: 38 },
};

/** Customer looks, picked with the seeded random so shot scenes stay repeatable. */
export const CUSTOMER_SKINS = ['#f2c188', '#c68850', '#8a5a33', '#ffd9ad'];
export const CUSTOMER_HAIR = ['#3a2413', '#7a3b16', '#c9a227', '#555f6b', '#a33327'];
export const CUSTOMER_SHIRTS = ['#b4552d', '#3e7d4e', '#33608c', '#8c3365', '#c9862b'];

/** Where the best score and the mute choice are kept between visits (this browser only). */
export const BEST_KEY = 'golden-skillet.best';
export const MUTE_KEY = 'golden-skillet.muted';
