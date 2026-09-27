import { GameModel } from './src/models/GameModel.js';

global.window = {
    audioManager: { play: () => {} },
    particleSystem: { spawnExplosion: () => {}, spawnText: () => {}, spawnLaser: () => {} },
    repository: { addCoins: () => {}, getCoins: () => 100, spendCoins: () => {} },
    renderShop: () => {}
};

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
    }
}

async function runTests() {
    console.log("Running tests...");
    
    // Test 1: Grid Initialization
    try {
        const model = new GameModel(100);
        model.initGrid();
        assert(model.grid.length === 8 && model.grid[0].length === 8, "Grid should be 8x8");
        assert(model.grid[0][0] !== null, "Grid cells should be populated with Tiles");
    } catch (e) {
        assert(false, "Grid Initialization threw an error: " + e);
    }
    
    // Test 2: Basic Match-3 Detection
    try {
        const model = new GameModel(100);
        model.initGrid();
        
        const type = '🦴';
        model.grid[0][0].type = type;
        model.grid[1][0].type = type;
        model.grid[2][0].type = type;
        
        const matches = model.findMatches();
        assert(matches.length > 0, "findMatches() should detect horizontal match-3");
        
        let foundMatch3 = false;
        matches.forEach(group => {
            if (group.tiles.length >= 3) foundMatch3 = true;
        });
        assert(foundMatch3, "Detected match group should contain at least 3 tiles");
    } catch (e) {
        assert(false, "Match-3 detection threw an error: " + e);
    }

    // Test 3: Hammer Booster Logic
    try {
        const model = new GameModel(100);
        model.initGrid();
        const tile = model.grid[2][2];
        model.useHammer(2, 2, { session: { collectedItems: {} } });
        assert(tile.matched === true, "Hammer should set tile.matched to true");
    } catch (e) {
        assert(false, "Hammer Booster threw an error: " + e);
    }
    
    // Test 4: Swap Logic
    try {
        const model = new GameModel(100);
        model.initGrid();
        const tile1 = model.grid[0][0];
        const tile2 = model.grid[0][1];
        model.swapTiles(tile1, tile2);
        
        assert(model.grid[0][0] === tile2, "Tiles should be swapped in the grid (1)");
        assert(model.grid[0][1] === tile1, "Tiles should be swapped in the grid (2)");
        assert(tile1.r === 1 && tile2.r === 0, "Tile coordinates should be updated");
    } catch (e) {
        assert(false, "Swap Logic threw an error: " + e);
    }
    
    // Test 5: Cat Thief Movement
    try {
        const model = new GameModel(100);
        model.initGrid(['🦴', '🍪'], 0, 1);
        
        let catCount = 0;
        let catTile = null;
        for(let c = 0; c < 8; c++) {
            for(let r = 0; r < 8; r++) {
                if(model.grid[c][r].isCat) {
                    catCount++;
                    catTile = model.grid[c][r];
                }
            }
        }
        
        assert(catCount === 1, "Grid should spawn exactly 1 Cat Thief");
        
        const initialC = catTile.c;
        const initialR = catTile.r;
        
        model.moveCats();
        
        let newCatTile = null;
        for(let c = 0; c < 8; c++) {
            for(let r = 0; r < 8; r++) {
                if(model.grid[c][r].isCat) {
                    newCatTile = model.grid[c][r];
                }
            }
        }
        
        const moved = (initialC !== newCatTile.c) || (initialR !== newCatTile.r);
        assert(moved, "Cat Thief should move to a new adjacent tile after moveCats() is called");
        assert(newCatTile.moveCount === 1, "Cat Thief moveCount should increment to 1");
        
    } catch (e) {
        assert(false, "Cat Thief Logic threw an error: " + e);
    }
}
runTests();
