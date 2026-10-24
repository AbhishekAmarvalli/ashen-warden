#!/usr/bin/env node
/** 
 * Rule of Life - Turn-Based Cellular Combat Game
 * Players choose rules that affect how cells survive/die.
 * Enemy cells have different rules. Goal: choose effective rules to kill enemies.
 */

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const GAME_VERSION = '1.0.0';

const RULE_SETS = {
  standard: { birth: [3], survival: [2, 3] },
  aggressive: { birth: [3], survival: [2] },
  lenient: { birth: [3], survival: [2, 3, 4] },
  overcrowded: { birth: [3], survival: [2, 3] },
  lonely: { birth: [3], survival: [3] },
  reproductive: { birth: [3, 6], survival: [2, 3] },
};

const ENEMY_RULE_SETS = {
  standard: { birth: [3], survival: [2, 3] },
  aggressive: { birth: [3], survival: [2] },
  lenient: { birth: [3], survival: [2, 3, 4] },
  overcrowded: { birth: [3], survival: [2, 3] },
  lonely: { birth: [3], survival: [3] },
  reproductive: { birth: [3, 6], survival: [2, 3] },
};

const RULE_EFFECTIVENESS = {
  aggressive: { counter: ['lenient', 'reproductive'], weakAgainst: ['standard', 'overcrowded'] },
  lenient: { counter: ['aggressive', 'overcrowded'], weakAgainst: ['standard', 'reproductive'] },
  overcrowded: { counter: ['lenient', 'aggressive'], weakAgainst: ['standard', 'reproductive'] },
  lonely: { counter: ['reproductive', 'standard'], weakAgainst: ['aggressive', 'lenient'] },
  reproductive: { counter: ['lonely', 'standard'], weakAgainst: ['aggressive', 'lenient'] },
  standard: { counter: [], weakAgainst: [] },
};

const state = {
  width: 40, height: 20, grid: null,
  playerRule: 'standard', enemyRule: 'aggressive',
  turn: 1, score: 0, cellsKilled: 0,
  gameOver: false, won: false
};

function initGrid() {
  const grid = [];
  for (let y = 0; y < state.height; y++) {
    const row = [];
    for (let x = 0; x < state.width; x++) {
      const alive = Math.random() < 0.3;
      row.push({ alive, type: alive ? (Math.random() < 0.5 ? 'player' : 'enemy') : 'neutral', age: 0 });
    }
    grid.push(row);
  }
  state.grid = grid;
}

function countAllNeighbors(grid, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = (x + dx + state.width) % state.width;
      const ny = (y + dy + state.height) % state.height;
      if (grid[ny][nx].alive) count++;
    }
  }
  return count;
}

function applyRule(alive, neighbors, rule) {
  const { birth, survival } = rule;
  if (alive) return survival.includes(neighbors);
  else return birth.includes(neighbors);
}

function computeNextState() {
  const nextGrid = [];
  for (let y = 0; y < state.height; y++) {
    const row = [];
    for (let x = 0; x < state.width; x++) {
      const cell = state.grid[y][x];
      const neighbors = countAllNeighbors(state.grid, x, y);
      const rule = cell.type === 'player' ? state.playerRule : state.enemyRule;
      const newAlive = applyRule(cell.alive, neighbors, rule);
      row.push({ alive: newAlive, type: newAlive ? cell.type : 'neutral', age: newAlive ? cell.age + 1 : 0 });
    }
    nextGrid.push(row);
  }
  return nextGrid;
}

function renderGrid() {
  let output = '';
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const cell = state.grid[y][x];
      output += !cell.alive ? '░' : cell.type === 'player' ? '@' : cell.type === 'enemy' ? '⚔' : '░';
    }
    output += '\n';
  }
  return output;
}

function drawStatus() {
  const p = state.grid.flat().filter(c => c.alive && c.type === 'player').length;
  const e = state.grid.flat().filter(c => c.alive && c.type === 'enemy').length;
  const t = state.grid.flat().length;
  const pp = t > 0 ? Math.round(p / (t / 2) * 100) : 0;
  const pe = t > 0 ? Math.round(e / (t / 2) * 100) : 0;

  let s = '========================================\n';
  s += `       RULE OF LIFE - Turn ${state.turn}\n`;
  s += `========================================\n`;
  s += '\n';
  s += `YOUR RULE: ${state.playerRule.toUpperCase()}\n`;
  s += `ENEMY RULE: ${state.enemyRule.toUpperCase()}\n`;
  s += '\n';
  s += `Your Cells: ${p} (${pp}%)\n`;
  s += `Enemy Cells: ${e} (${pe}%)\n`;
  s += `Cells Killed This Turn: ${state.cellsKilled}\n`;
  s += `Total Score: ${state.score}\n`;
  s += '\n';
  s += `Rule Effectiveness:\n`;
  const eff = RULE_EFFECTIVENESS[state.playerRule];
  if (eff.counter.length > 0) s += `  Counters: ${eff.counter.join(', ')}\n`;
  if (eff.weakAgainst.length > 0) s += `  Weak against: ${eff.weakAgainst.join(', ')}\n`;
  s += '\n';
  s += '  [1] Change Rule  [2] View Rules  [0] Quit\n';
  s += '\n';
  return s;
}

function killedThisTurn() {
  let k = 0;
  const prev = state._prevGrid || state.grid;
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const curr = state.grid[y][x];
      const prevCell = prev[y][x];
      if (prevCell && prevCell.alive && prevCell.type === 'player' && !curr.alive) k++;
      if (prevCell && prevCell.alive && prevCell.type === 'enemy' && !curr.alive) k++;
    }
  }
  return k;
}

async function mainMenu() {
  await chooseRule();
  initGrid();
  state._prevGrid = JSON.parse(JSON.stringify(state.grid));
  state.enemyRule = 'aggressive';

  while (!state.gameOver) {
    clearScreen();
    console.log(drawStatus());
    console.log(renderGrid());
    console.log('');

    console.log('========================================');
    console.log(`       RULE OF LIFE - Turn ${state.turn}`);
    console.log('========================================');
    console.log('');

    console.log('  Choose action:');
    console.log(`  [1] Change Rule - Currently: ${state.playerRule.toUpperCase()}`);
    console.log(`  [2] View Rule Effectiveness`);
    console.log(`  [3] Next Turn`);
    console.log(`  [0] Quit Game`);
    console.log('');

    const choice = parseInt(await readChoice('\n  Enter choice (0-3): '), 10);

    switch (choice) {
      case 1: await chooseRule(); break;
      case 2: showEffectiveness(); await readChoice('Press Enter...'); break;
      case 3: await nextTurn(); break;
      case 0: clearScreen(); console.log('Farewell, Warden... Survived ' + state.turn + ' turns, Score: ' + state.score); state.gameOver = true; break;
    }
    if (!state.gameOver) checkGameState();
  }
  rl.close();
}

async function chooseRule() {
  clearScreen();
  console.log('Choose Your Cell Rule Set\n');
  let i = 0;
  for (const [key, rule] of Object.entries(RULE_SETS)) {
    const eff = RULE_EFFECTIVENESS[key];
    const status = eff.counter.length > 0 ? ' (counters: ' + eff.counter.join(', ') + ')' : '';
    console.log('  [' + (i + 1) + '] ' + key.toUpperCase() + status);
    i++;
  }
  console.log('  [0] Random Rule');
  const choice = parseInt(await readChoice('\n  Select rule (0-' + Object.keys(RULE_SETS).length + '): '), 10);
  if (choice === 0) {
    const keys = Object.keys(RULE_SETS);
    state.playerRule = keys[Math.floor(Math.random() * keys.length)];
  } else if (choice > 0 && choice <= Object.keys(RULE_SETS).length) {
    const keys = Object.keys(RULE_SETS);
    state.playerRule = keys[choice - 1];
  }
  selectEnemyRule();
}

function selectEnemyRule() {
  const pr = state.playerRule;
  if (pr === 'standard') state.enemyRule = 'aggressive';
  else if (pr === 'aggressive') state.enemyRule = 'standard';
  else if (pr === 'lenient') state.enemyRule = 'aggressive';
  else if (pr === 'overcrowded') state.enemyRule = 'aggressive';
  else if (pr === 'lonely') state.enemyRule = 'reproductive';
  else if (pr === 'reproductive') state.enemyRule = 'lonely';
  if (!state.enemyRule) state.enemyRule = 'aggressive';
}

function showEffectiveness() {
  clearScreen();
  console.log('Rule Effectiveness Chart\n');
  let i = 0;
  for (const [key, rule] of Object.entries(RULE_EFFECTIVENESS)) {
    console.log('  [' + (i + 1) + '] ' + key.toUpperCase());
    if (rule.counter.length > 0) console.log('    Counters: ' + rule.counter.join(', '));
    if (rule.weakAgainst.length > 0) console.log('    Weak against: ' + rule.weakAgainst.join(', '));
    console.log('');
    i++;
  }
  console.log('Press Enter to continue...');
  readChoice('');
}

async function nextTurn() {
  state._prevGrid = JSON.parse(JSON.stringify(state.grid));
  state.grid = computeNextState();
  state.cellsKilled = killedThisTurn();
  state.score += state.cellsKilled * 10;
  state.turn++;
  checkGameState();
}

function checkGameState() {
  const p = state.grid.flat().filter(c => c.alive && c.type === 'player').length;
  const e = state.grid.flat().filter(c => c.alive && c.type === 'enemy').length;

  if (p <= 0) { state.gameOver = true; state.won = false; clearScreen(); console.log('GAME OVER - All cells eliminated at turn ' + state.turn); return; }
  if (e <= 0) { state.gameOver = true; state.won = true; clearScreen(); console.log('YOU WIN - All enemies eliminated at turn ' + state.turn); return; }
  if (state.turn >= 50) { state.gameOver = true; state.won = true; clearScreen(); console.log('SURVIVOR - ' + state.turn + ' turns! Score: ' + state.score); return; }
}

function clearScreen() { process.stdout.write('\x1B[2J\x1B[0f'); }

function readChoice(prompt) {
  return new Promise(resolve => { rl.question(prompt, input => { resolve(parseInt(input.trim(), 10) || -1); }); });
}

function showIntro() {
  clearScreen();
  console.log('RULE OF LIFE v' + GAME_VERSION);
  console.log('Choose rules for survivability and battle enemy cells!\n');
  console.log('Your cells use one rule set, enemy cells use another.');
  console.log('Choose effective rules to kill the other enemy cells!\n');
  console.log('Press Enter to continue...');
  readChoice('');
}

clearScreen();
mainMenu();