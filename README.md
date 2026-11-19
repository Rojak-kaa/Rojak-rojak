# Rojak-rojak

A real-time Malaysian hawker-stall game for one to four desktop players. The React lobby and Phaser kitchen share a Node.js and Socket.IO server. The game uses original landing art, procedural kitchen graphics, and synthesized sound cues.

## Run locally

Use Node.js 22.13 or newer and npm. From the project directory:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards account requests and Socket.IO to the Express server on port 3001. Create an account or sign in to play. Select a shop on the town map, then choose **Play Solo** or **Play Team**. Use **Join room** when you already have a code. Guests use the host’s shop and menu.

On your first sign-in, design your chef and choose **Save and continue** to reach the landing page. Returning players go straight to the landing page. Open **Profile & outfit** to view your dishes served or edit your nickname, chef, and wardrobe. Choose Ayu, Li Wei, or Kavitha and dress them in Malay baju Melayu or baju kurung, Chinese samfu or cheongsam, or Indian kurta or sari, with custom colours and headwear. Choose Bahasa Melayu, Mandarin Chinese (Simplified), Tamil, or English.

Review the controls, ingredients, and cooking methods for the selected menu in the pre-game guide. Each connected chef selects **Ready to cook** before the timer starts. The round clock and receipt-style order tickets appear to the left of the kitchen. Stations show seconds remaining while they work, and hot dishes display how soon they need plating.

Open **Hawker Centre** and select **Training** to practise Fruit Rojak, Nasi Lemak, Curry Laksa, or Ais Kacang. Lessons have no round or order deadline, but hot stations still have a burn timer so players can practise taking food off the heat.

Each shop stocks only the ingredients needed for its own menu. Chicken Rice Shop serves chicken rice dishes, barley water, and iced liang teh. Mamak serves roti, mee goreng, teh tarik, nasi kandar, and ayam paprik. Hawker Centre serves ban mee, chicken rice, char kway teow, curry laksa, and fruit rojak. Kopitiam serves kaya butter toast, black coffee, white coffee, and half-boiled eggs.

Drink ingredients are along the left wall, with stoves and prep tables along the bottom. Fill drinks using a clean cup from **Cups**. Collect used cups at **Cup Return** and wash them at the sink. Food uses the separate plate stock.

For a one-computer multiplayer test, open two or more separate tabs and enter a different nickname in each. Each tab uses a separate room session unless it inherited one from a duplicated tab.

Create a private room and share its code or invite link. Select aprons, have every chef mark ready, and start from the host's screen. For LAN play, use the host computer's LAN IP and port 5173 in every browser. Allow port 5173 through the host firewall if required.

## How to play

| Control | Action |
| --- | --- |
| WASD or arrow keys | Move |
| E | Use a nearby station, drop a held item on open floor, or pick up a dropped item while standing on it with empty hands |
| Space | Work at a station or clear a burned batch |

1. Read the tickets and collect their ingredients. Chop cucumber, pineapple, and chicken on a cutting board. Other ingredients go straight to the recipe station.
2. Add all the ingredients at the station shown on the ticket, then press Space. You can take back the last ingredient with E and empty hands before starting.
3. A green light means the dish is ready. Pick it up with clean dishware and take it to the serving counter. Hot dishes can burn if left at the stove or grill. Wash returns in the sink.
4. Use spare counters to stage ingredients or hand them off. The bin clears a held item and salvages its plate when applicable.

| Dish | Station | In-game ingredients |
| --- | --- | --- |
| Nasi Lemak | Fryer and stove | Coconut rice, sambal, chopped cucumber, fried ikan bilis |
| Fruit Rojak | Mixing bowl | Chopped cucumber, chopped pineapple, rojak sauce |
| Ais Kacang | Ice station | Ice, red beans, rose syrup |
| Char Kway Teow | Stove | Flat rice noodles, prawns, bean sprouts |
| Chicken Satay | Grill | Chopped chicken, peanut sauce |

The game uses simplified recipes. Quick service and streaks earn bonus points. Expired orders cost 20 points and break the streak. Difficulty changes the menu and the stations and ingredients available in the kitchen.

- **Easy · Rice & dessert** serves nasi lemak and ais kacang. The stove provides sambal, and the ice station provides rose syrup. Fry ikan bilis separately before adding it to nasi lemak.
- **Normal · Hot favourites** serves nasi lemak, char kway teow, and chicken satay.
- **Hard · Full hawker menu** serves all five dishes with their full in-game ingredient lists.

Disconnected chefs can restore their session from the same browser tab within 30 seconds. Host privileges pass to a connected chef when available. Active matches continue during disconnects. The host can return everyone to the lobby for a rematch after results.

## Build and deploy

```sh
npm ci
npm run build
npm start
```

Run the resulting project on a single long-running Node.js instance with HTTPS and WebSocket support. Express serves `dist/` and Socket.IO on the same origin. Set the `PORT` environment variable if your host requires it. The default is `3001`. Configure the reverse proxy to forward HTTP and WebSocket upgrades for `/socket.io/`. Use `GET /health` for a readiness check. Share the public HTTPS address with your players.

Keep the service at a single replica for this version. Rooms and live matches are in memory and expire on restart. Accounts, signed-in sessions, language preferences, outfits, and dishes served persist in SQLite at `data/rojak.sqlite`. Mount a persistent volume for it or set `ROJAK_DB` to a database path on that volume. Set `COOKIE_SECURE=1` when serving over HTTPS. A static-only host does not run the game server.

## Verify

```sh
npm test
npm run build
```

The tests exercise live Socket.IO room membership, authorization, movement, shared inventory, and reconnects. A deterministic match test covers the preparation, cooking, serving, washing, scoring, and round-ending rules.

- `client/` contains the React interface, Phaser scene, and original kitchen drawing routines.
- `server/` contains room and session handling plus the authoritative kitchen simulation.
- `shared/` contains the map, recipes, and difficulty configuration.
