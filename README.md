# cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/febry10/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/febry10/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Golden Skillet** is a fast-paced bistro cooking game that runs entirely in the browser — no build step, no libraries, just plain HTML canvas and JavaScript. Customers pin order tickets to the board, and you build each dish from eight ingredient stations: buns, cheese, lettuce and tomato go straight onto one of two assembly trays, while patties sizzle on the grill and fries bubble in the fryer, each with a timing ring that sweeps from raw through a golden PERFECT window to done — and then burnt. Serve a tray that matches a ticket exactly to earn its price plus a patience tip; golden, fast serves add a perfect bonus and build your combo.

Each day has a coin goal and a countdown timer, and the days get faster, longer and fancier — garden burgers, deluxe burgers, skillet meals and full bistro feasts join the menu — until a missed goal closes the bistro. Along the way you juggle two trays, rescue food from the heat at the perfect moment, bin the burnt mistakes (for a small fee) and watch every customer's patience bar, because a walkout costs you score and your combo.

## How to play

- Click an ingredient station (or press **1–8**) to add it to the active tray — patties go to the grill, fries to the fryer
- Click a cooked patty or fries basket to plate it; take it off inside the golden window for a **PERFECT** serve
- Click a tray to switch between the two assembly trays
- Press **SERVE** (or **Space**) when the active tray matches an order ticket exactly
- Press **BIN** (or **Backspace**) to bin a tray for 2 coins, **Esc/P** to pause, **M** to mute
- Reach the day's coin goal before the timer runs out to open the next day

## Run it

```sh
node serve.ts
```
Then open http://localhost:8080 in a desktop browser.

To produce the hand-in output (the game, the screenshots and `dossier.json`) the way the grader runs it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---
<sub>Entered on [make.fun](https://make.fun/?ref=xttqesbf&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
