#!/usr/bin/env node
/**
 * Ashen Warden - A Turn-Based Strategy CLI Game
 * 
 * Protect the realm as the Ashen Warden. Manage resources, upgrade defenses,
 * and withstand waves of darkness.
 */

const chalk = require('chalk').default || require('chalk');
const readline = require('readline');

const GAME_VERSION = '1.0.0';

const COLORS = {
  reset: chalk.reset,
  bright: chalk.bright,
  dim: chalk.dim,
  red: chalk.red,
  green: chalk.green,
  yellow: chalk.yellow,
  blue: chalk.blue,
  magenta: chalk.magenta,
  cyan: chalk.cyan,
  white: chalk.white,
  bgRed: chalk.bgRed,
  bgGreen: chalk.bgGreen,
  bgYellow: chalk.bgYellow,
  bgBlue: chalk.bgBlue,
  bgMagenta: chalk.bgMagenta,
  bgCyan: chalk.bgCyan,
  bgWhite: chalk.bgWhite,
};

const SYMBOLS = {
  player: '@',
  gold: '$',
  shield: '🛡️',
  sword: '⚔️',
  heart: '❤️',
  fire: '🔥',
  darkness: '⚫',
  wall: '█',
};

const WELCOME_ART = `
  ${COLORS.magenta}========================================${COLORS.reset}
  ${COLORS.magenta}   ASHEN WARDEN v1.0.0${COLORS.reset}
  ${COLORS.magenta}   A Turn-Based Strategy CLI Game${COLORS.reset}
  ${COLORS.magenta}========================================${COLORS.reset}
`;

const RULES = `
  ${COLORS.cyan}GAME RULES${COLORS.reset}

  Each turn you may:
  ${COLORS.green}[1]${COLORS.reset} Meditate           - Regenerate focus (10 points)
  ${COLORS.green}[2]${COLORS.reset} Fortify Walls       - Spend 20 gold to strengthen defenses
  ${COLORS.green}[3]${COLORS.reset} Train Militia     - Spend 30 gold to increase guard capacity
  ${COLORS.green}[4]${COLORS.reset} Rest              - Recover 15 health, cost 10 gold
  ${COLORS.green}[5]${COLORS.reset} View Status       - Check your current position
  ${COLORS.green}[0]${COLORS.reset} Quit Game         - Exit to main menu

  ${COLORS.yellow}Gold${COLORS.reset} is your primary currency.
  ${COLORS.yellow}Focus${COLORS.reset} determines your special abilities.
  ${COLORS.yellow}Health${COLORS.reset} - survive to the end of wave 10!

  ${COLORS.red}⚠️  Dark forces attack at the end of each turn!${COLORS.reset}
`;

// Game state
const state = {
  wave: 1,
  gold: 150,
  health: 100,
  maxHealth: 100,
  focus: 50,
  maxFocus: 50,
  walls: 5,
  guards: 3,
  gameOver: false,
  won: false,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function drawStatusBar() {
  const healthPct = (state.health / state.maxHealth * 100).toFixed(0);
  const focusPct = (state.focus / state.maxFocus * 100).toFixed(0);
  
  const healthBar = '█'.repeat(Math.max(0, Math.min(20, healthPct / 5))) +
                    '─'.repeat(20 - Math.max(0, Math.min(20, healthPct / 5)));
  const focusBar = '▮'.repeat(Math.max(0, Math.min(20, focusPct / 5))) +
                   '▯'.repeat(20 - Math.max(0, Math.min(20, focusPct / 5)));

  console.log('');
  console.log(`  ${COLORS.bgRed}${COLORS.black} HEALTH ${healthPct}% ${COLORS.reset}${COLORS.bgRed}${COLORS.black} ${healthBar} ${COLORS.reset}`);
  console.log(`  ${COLORS.bgBlue}${COLORS.white} FOCUS ${focusPct}% ${COLORS.reset}${COLORS.bgBlue}${COLORS.white} ${focusBar} ${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}Gold: ${state.gold}   ${COLORS.cyan}Walls: ${state.walls}   ${COLORS.green}Guards: ${state.guards}${COLORS.reset}`);
  console.log(`  ${COLORS.magenta}Wave: ${state.wave}${COLORS.reset} ${COLORS.darkness}${COLORS.black} Darkness: +${state.wave * 2}%${COLORS.reset}`);
  console.log('');
}

function drawWavePreview() {
  const darkness = state.wave * 2;
  console.log(`  ${COLORS.red}⚔️  Wave ${state.wave} approaching...${COLORS.reset}`);
  console.log(`  ${COLORS.red}Darkness intensity: ${darkness}%${COLORS.reset}`);
  console.log(`  ${COLORS.red}Enemies this wave: ${Math.max(3, state.wave + 2)}${COLORS.reset}`);
  console.log('');
}

function readChoice(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, (input) => {
      const choice = parseInt(input.trim(), 10);
      resolve(isNaN(choice) ? -1 : choice);
    });
  });
}

function applyDarkness() {
  const damage = state.wave * 3;
  const focusLoss = state.wave;
  
  state.health = Math.max(0, state.health - damage);
  state.focus = Math.max(0, state.focus - focusLoss);
  
  if (state.walls <= 3) {
    state.health -= 5;
  }
  
  return damage;
}

function waveAttack() {
  console.log(`${COLORS.red}========================================${COLORS.reset}`);
  console.log(`${COLORS.red}  DARK FORCES ATTACK${COLORS.reset}`);
  console.log(`${COLORS.red}========================================${COLORS.reset}`);
  
  const damage = applyDarkness();
  
  console.log(`  ${COLORS.red}Damage taken: ${damage} health${COLORS.reset}`);
  console.log(`  ${COLORS.red}Focus drained: ${state.wave}${COLORS.reset}`);
  
  if (state.walls > 0) {
    const saved = Math.min(damage, 3);
    state.walls -= 1;
    console.log(`  ${COLORS.yellow}Walls absorbed ${saved} damage!${COLORS.reset}`);
  }
  
  const guardProtection = Math.min(state.guards, 2);
  if (guardProtection > 0) {
    state.health = Math.min(state.maxHealth, state.health + guardProtection);
    console.log(`  ${COLORS.green}Guards protected you for ${guardProtection} health!${COLORS.reset}`);
  }
  
  console.log('');
}

function checkGameState() {
  if (state.health <= 0) {
    state.gameOver = true;
    state.won = false;
    return 'gameover';
  }
  
  if (state.wave > 10) {
    state.gameOver = true;
    state.won = true;
    return 'won';
  }
  
  return 'continue';
}

function showHelp() {
  clearScreen();
  console.log(WELCOME_ART);
  console.log(RULES);
  console.log('');
  console.log('Controls:');
  console.log('  Use numbers 0-5 to select actions');
  console.log('  Press any other key to redraw interface');
  console.log('');
  rl.question('  Press Enter to continue...', () => {});
}

function saveGame() {
  const fs = require('fs');
  const path = require('path');
  const dir = path.dirname(process.mainModule.path);
  const saveFile = path.join(dir, 'savegame.json');
  
  const saveData = {
    wave: state.wave,
    gold: state.gold,
    health: state.health,
    maxHealth: state.maxHealth,
    focus: state.focus,
    maxFocus: state.maxFocus,
    walls: state.walls,
    guards: state.guards,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(saveFile, JSON.stringify(saveData, null, 2));
  console.log(`${COLORS.green}✓${COLORS.reset} Game saved successfully!`);
  rl.question('  Press Enter to continue...', () => {});
}

function loadGame() {
  const fs = require('fs');
  const path = require('path');
  const dir = path.dirname(process.mainModule.path);
  const saveFile = path.join(dir, 'savegame.json');
  
  if (!fs.existsSync(saveFile)) {
    console.log(`${COLORS.red}✗${COLORS.reset} No saved game found!`);
    rl.question('  Press Enter to continue...', () => {});
    return;
  }
  
  try {
    const saveData = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
    
    state.wave = saveData.wave || 1;
    state.gold = saveData.gold || 150;
    state.health = saveData.health || 100;
    state.maxHealth = saveData.maxHealth || 100;
    state.focus = saveData.focus || 50;
    state.maxFocus = saveData.maxFocus || 50;
    state.walls = saveData.walls || 5;
    state.guards = saveData.guards || 3;
    
    console.log(`${COLORS.green}✓${COLORS.reset} Game loaded successfully!`);
    rl.question('  Press Enter to continue...', () => {});
  } catch (err) {
    console.log(`${COLORS.red}✗${COLORS.reset} Error loading save game: ${err.message}`);
    rl.question('  Press Enter to continue...', () => {});
  }
}

function showIntro() {
  clearScreen();
  console.log(WELCOME_ART);
  console.log('');
  console.log('  In the realm of Eternal Night, you are the Ashen Warden.');
  console.log('  Your ancestors\' ashes fuel your resolve, your blade guards the');
  console.log('  last light against the encroaching darkness.');
  console.log('');
  console.log('  Your fortress stands on the edge of the abyss. The first wave');
  console.log('  of darkness is hours away. Prepare wisely, Warden.');
  console.log('');
  rl.question('  Press Enter to begin your watch...', () => {});
}

async function mainMenu() {
  let firstRun = true;
  
  while (!state.gameOver) {
    clearScreen();
    
    if (firstRun) {
      showIntro();
      firstRun = false;
    }
    
    drawStatusBar();
    drawWavePreview();
    
    console.log(`${COLORS.cyan}========================================${COLORS.reset}`);
    console.log(`${COLORS.cyan}       ASHEN WARDEN - Turn ${state.wave}${COLORS.reset}`);
    console.log(`${COLORS.cyan}========================================${COLORS.reset}`);
    console.log('');
    console.log('  Choose your action:');
    console.log(`  ${COLORS.green}[1]${COLORS.reset} Meditate           - Regenerate 10 focus`);
    console.log(`  ${COLORS.green}[2]${COLORS.reset} Fortify Walls       - Spend 20 gold, +1 wall`);
    console.log(`  ${COLORS.green}[3]${COLORS.reset} Train Militia       - Spend 30 gold, +1 guard`);
    console.log(`  ${COLORS.green}[4]${COLORS.reset} Rest                - Recover 15 health, cost 10 gold`);
    console.log(`  ${COLORS.green}[5]${COLORS.reset} View Status         - Check your current position`);
    console.log(`  ${COLORS.green}[6]${COLORS.reset} Save Game           - Save progress`);
    console.log(`  ${COLORS.green}[7]${COLORS.reset} Load Game           - Load saved progress`);
    console.log(`  ${COLORS.green}[0]${COLORS.reset} Quit Game           - Exit`);
    console.log('');
    console.log('  ? Help              - Show game rules and controls');
    
    const choice = parseInt(await readChoice(
      `\n  ${COLORS.yellow}Enter your choice (0-7): ${COLORS.reset}`
    ), 10);
    
    switch (choice) {
      case 1:
        // Meditate - regenerate focus
        if (state.focus < state.maxFocus) {
          state.focus = Math.min(state.maxFocus, state.focus + 10);
          console.log(`${COLORS.green}✓${COLORS.reset} You meditate and regain 10 focus!`);
        } else {
          console.log(`${COLORS.yellow}~${COLORS.reset} Your focus is already full.`);
        }
        break;
        
      case 2:
        // Fortify Walls
        if (state.gold >= 20) {
          state.gold -= 20;
          state.walls += 1;
          console.log(`${COLORS.green}✓${COLORS.reset} Walls fortified! +1 wall (cost: 20 gold)`);
        } else {
          console.log(`${COLORS.red}✗${COLORS.reset} Not enough gold! You need 20 gold.`);
        }
        break;
        
      case 3:
        // Train Militia
        if (state.gold >= 30) {
          state.gold -= 30;
          state.guards += 1;
          console.log(`${COLORS.green}✓${COLORS.reset} Militia trained! +1 guard (cost: 30 gold)`);
        } else {
          console.log(`${COLORS.red}✗${COLORS.reset} Not enough gold! You need 30 gold.`);
        }
        break;
        
      case 4:
        // Rest
        if (state.gold >= 10) {
          state.gold -= 10;
          state.health = Math.min(state.maxHealth, state.health + 15);
          console.log(`${COLORS.green}✓${COLORS.reset} You rest and recover 15 health (cost: 10 gold)`);
        } else {
          console.log(`${COLORS.red}✗${COLORS.reset} Not enough gold! You need 10 gold.`);
        }
        break;
        
      case 5:
        // View Status
        clearScreen();
        console.log(WELCOME_ART);
        console.log('');
        console.log(`${COLORS.cyan}ASHEW WARDEN - STATUS SCREEN${COLORS.reset}`);
        console.log('');
        console.log(`  ${COLORS.yellow}Wave:${COLORS.reset} ${state.wave}`);
        console.log(`  ${COLORS.yellow}Health:${COLORS.reset} ${state.health}/${state.maxHealth} ${state.health/state.maxHealth*100}%`);
        console.log(`  ${COLORS.yellow}Focus:${COLORS.reset} ${state.focus}/${state.maxFocus} ${state.focus/state.maxFocus*100}%`);
        console.log(`  ${COLORS.yellow}Gold:${COLORS.reset} ${state.gold}`);
        console.log(`  ${COLORS.yellow}Walls:${COLORS.reset} ${state.walls}`);
        console.log(`  ${COLORS.yellow}Guards:${COLORS.reset} ${state.guards}`);
        console.log('');
        console.log(`  ${COLORS.red}Darkness:${COLORS.reset} +${state.wave * 2}%`);
        console.log('');
        console.log('  Press Enter to continue...');
        rl.question('', () => {});
        break;
        
      case 6:
        saveGame();
        break;
        
      case 7:
        loadGame();
        break;
        
      case 0:
        // Quit
        clearScreen();
        console.log(WELCOME_ART);
        console.log('');
        console.log(`${COLORS.magenta}Farewell, Ashen Warden...${COLORS.reset}`);
        console.log(`${COLORS.magenta}You held the line for ${state.wave} waves.${COLORS.reset}`);
        console.log('');
        state.gameOver = true;
        break;
        
      default:
        console.log(`${COLORS.red}✗${COLORS.reset} Invalid choice. Please enter a number 0-7.`);
        break;
    }
    
    // Check game state after actions
    if (!state.gameOver) {
      const stateCheck = checkGameState();
      if (stateCheck === 'continue') {
        // Apply darkness attack at end of turn
        waveAttack();
        const result = checkGameState();
        if (result !== 'continue') {
          clearScreen();
          drawStatusBar();
          if (state.won) {
            console.log(`${COLORS.green}========================================${COLORS.reset}`);
            console.log(`${COLORS.green}       CONGRATULATIONS! YOU WIN!${COLORS.reset}`);
            console.log(`${COLORS.green}========================================${COLORS.reset}`);
            console.log(`  ${COLORS.green}You survived ${state.wave} waves of darkness!${COLORS.reset}`);
            console.log(`  ${COLORS.green}Final gold: ${state.gold}${COLORS.reset}`);
            console.log(`${COLORS.green}========================================${COLORS.reset}`);
          } else {
            console.log(`${COLORS.red}========================================${COLORS.reset}`);
            console.log(`${COLORS.red}       GAME OVER${COLORS.reset}`);
            console.log(`${COLORS.red}========================================${COLORS.reset}`);
            console.log(`  ${COLORS.red}The darkness consumed you at wave ${state.wave}.${COLORS.reset}`);
            console.log(`  ${COLORS.red}Final gold: ${state.gold}${COLORS.reset}`);
            console.log(`${COLORS.red}========================================${COLORS.reset}`);
          }
          state.gameOver = true;
        }
      }
    }
  }
  
  rl.close();
}

// Start the game
clearScreen();
mainMenu();