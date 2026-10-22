import { GameModel } from './src/models/GameModel.js';
import { GameState } from './src/models/GameState.js';
import { ParticleSystem } from './src/utils/ParticleSystem.js';
import { STATE, TILE_TYPE, SPECIAL_TYPE, BOOSTER_TYPE, GAME_MODE, STORAGE_KEY } from './src/constants.js';

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
        process.exitCode = 1;
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
        
        const type = TILE_TYPE.BONE;
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
        model.initGrid(undefined, 0, 1);
        
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

    // Test 6: Mid-Level State Persistence (Serialization & Deserialization)
    try {
        const model1 = new GameModel(100);
        model1.initGrid();
        model1.grid[1][2].type = TILE_TYPE.COOKIE;
        model1.grid[1][2].isFrozen = true;
        model1.grid[3][4].special = SPECIAL_TYPE.STRIPED_V;

        const serialized = model1.serializeGrid();
        assert(Array.isArray(serialized) && serialized.length === 64, "Serialized grid should contain 64 tiles");

        const model2 = new GameModel(100);
        const restored = model2.deserializeGrid(serialized);
        assert(restored === true, "Deserialization should succeed");
        assert(model2.grid[1][2].type === TILE_TYPE.COOKIE, "Restored tile type should match");
        assert(model2.grid[1][2].isFrozen === true, "Restored frozen status should match");
        assert(model2.grid[3][4].special === SPECIAL_TYPE.STRIPED_V, "Restored special status should match");
    } catch (e) {
        assert(false, "State persistence threw an error: " + e);
    }

    // Test 7: GameState Session Persistence
    try {
        const gs = new GameState();
        gs.startLevel(3, {
            targetScore: 2500,
            maxMoves: 20,
            objectives: { [TILE_TYPE.BONE]: 14, [TILE_TYPE.MEAT]: 8 }
        });
        gs.session.currentScore = 1500;
        gs.session.movesLeft = 12;
        gs.session.collectedItems[TILE_TYPE.BONE] = 7;

        const serializedSession = gs.serializeSession();
        const gs2 = new GameState();
        const success = gs2.restoreSession(serializedSession);

        assert(success === true, "Session restoration should succeed");
        assert(gs2.levelData.currentLevel === 3, "Restored level number should match");
        assert(gs2.session.currentScore === 1500, "Restored score should match");
        assert(gs2.session.movesLeft === 12, "Restored moves left should match");
        assert(gs2.session.collectedItems[TILE_TYPE.BONE] === 7, "Restored collected goals should match");
    } catch (e) {
        assert(false, "GameState session persistence threw an error: " + e);
    }

    // Test 8: Particle Pooling & Flat Memory across 25+ matches
    try {
        const ps = new ParticleSystem(null);
        for (let match = 0; match < 25; match++) {
            ps.spawnExplosion(100, 100, '#ffeb3b', 10);
            ps.spawnText(100, 100, '+50');
            ps.spawnLaser(100, 100, 'vertical', '#ffeb3b');
            ps.update(0.5); // Age out particles
        }
        assert(ps.particles.length <= 120, "Particle count should stay strictly capped at MAX_PARTICLES");
        assert(ps.particlePool.length > 0, "Expired particles should be recycled into the object pool");
        assert(ps.texts.length <= 15, "Text count should stay strictly capped at MAX_TEXTS");
        assert(ps.lasers.length <= 6, "Laser count should stay strictly capped at MAX_LASERS");
    } catch (e) {
        assert(false, "Particle Pooling test threw an error: " + e);
    }

    // Test 9: Enums Integrity
    try {
        assert(Object.isFrozen(STATE), "STATE enum should be frozen");
        assert(Object.isFrozen(TILE_TYPE), "TILE_TYPE enum should be frozen");
        assert(Object.isFrozen(SPECIAL_TYPE), "SPECIAL_TYPE enum should be frozen");
        assert(Object.isFrozen(BOOSTER_TYPE), "BOOSTER_TYPE enum should be frozen");
        assert(Object.isFrozen(GAME_MODE), "GAME_MODE enum should be frozen");
        assert(Object.isFrozen(STORAGE_KEY), "STORAGE_KEY enum should be frozen");
    } catch (e) {
        assert(false, "Enums integrity threw an error: " + e);
    }
}

runTests();
