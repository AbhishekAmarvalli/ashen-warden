# Ashen Warden

A turn-based strategy CLI game where you protect the realm as the Ashen Warden.

## About

Defend the realm from encroaching darkness. Manage your resources, fortify your walls, train your militia, and survive wave after wave of darkness. Each decision matters as the darkness grows stronger with each passing wave.

## How to Play

```bash
npm start
```

Or run directly:

```bash
node index.js
```

## Game Controls

Each turn, choose an action:

- **[1] Meditate** - Regenerate 10 focus points
- **[2] Fortify Walls** - Spend 20 gold to strengthen defenses (+1 wall)
- **[3] Train Militia** - Spend 30 gold to increase guard capacity (+1 guard)
- **[4] Rest** - Recover 15 health (cost: 10 gold)
- **[5] View Status** - Check your current position and stats
- **[6] Save Game** - Save your progress to `savegame.json`
- **[7] Load Game** - Load a saved game
- **[0] Quit** - Exit the game

## Game Features

- **Turn-based resource management** - Balance gold, health, and focus
- **Upgrade system** - Strengthen walls and train guards
- **Wave-based challenge** - Each wave grows progressively darker and more dangerous
- **Save/load system** - Persist your progress between sessions
- **Clean UI/UX** - Color-coded status bars and intuitive interface
- **Fantasy fantasy setting** - Play as the Ashen Warden, guardian of the last light

## Development

```bash
# Install dependencies
npm install

# Run the game
npm start

# Build for production
# (no build step - pure CLI game)
```