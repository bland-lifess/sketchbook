/* --- CONFIGURATION & DATA --- */

// The Monster Database
const MONSTER_DB = [
    { id: 'm1', name: 'Scrap-Ball', rarity: 'Common', base: 5, variance: 5, img: 'scrap_ball.png' },
    { id: 'm2', name: 'Pencil-Stub', rarity: 'Common', base: 8, variance: 6, img: 'pencil_stub.png' },
    { id: 'm3', name: 'Coffee-Stain', rarity: 'Rare', base: 15, variance: 10, img: 'coffee_stain.png' },
    { id: 'm4', name: 'Origami-Frog', rarity: 'Rare', base: 20, variance: 12, img: 'origami_frog.png' },
    { id: 'm5', name: 'Ink-Dragon', rarity: 'Legendary', base: 50, variance: 30, img: 'ink_dragon.png' },
    { id: 'm6', name: 'Gold-Star', rarity: 'Legendary', base: 60, variance: 40, img: 'gold_star.png' }
];

const AREAS = [
    { name: "The Scrap Paper", cost: 0, mult: 1, luck: 1 },
    { name: "School Notebook", cost: 500, mult: 1.5, luck: 1.2 },
    { name: "Art Studio", cost: 2500, mult: 3.0, luck: 1.5 }
];

// Initial State
let gameData = {
    gold: 100,
    inventory: [], // Array of obtained doodles
    slots: [
        { level: 1, equippedId: null },
        { level: 1, equippedId: null },
        { level: 1, equippedId: null }
    ],
    areaIndex: 0,
    areasUnlocked: 0
};

/* --- SYSTEM FUNCTIONS --- */

function init() {
    loadGame();
    renderUI();
    // Start Idle Loop (1 second tick)
    setInterval(idleLoop, 1000);
}

function idleLoop() {
    let income = 0;
    
    gameData.slots.forEach(slot => {
        if (slot.equippedId) {
            const doodle = gameData.inventory.find(d => d.uid === slot.equippedId);
            if (doodle) {
                // Formula: Vibe * SlotLevel * AreaMultiplier
                income += Math.floor(doodle.vibe * slot.level * 0.1); 
            }
        }
    });

    // Minimum income of 1 if you have stuff equipped but low stats
    if (income < 1 && gameData.slots.some(s => s.equippedId)) income = 1;

    addGold(income);
    document.getElementById('income-display').innerText = income;
    saveGame();
}

function addGold(amount) {
    gameData.gold += amount;
    updateHeader();
}

/* --- ACTIONS --- */

function summonDoodle() {
    const cost = 10 * (gameData.areaIndex + 1); // Cost scales with area
    
    if (gameData.gold < cost) {
        alert("Not enough Gold!");
        return;
    }

    addGold(-cost);

    // 1. Pick Rarity based on Luck
    const areaLuck = AREAS[gameData.areaIndex].luck;
    const roll = Math.random() * 100;
    let rarity = 'Common';
    if (roll > (90 / areaLuck)) rarity = 'Legendary';
    else if (roll > (70 / areaLuck)) rarity = 'Rare';

    // 2. Pick Monster
    const pool = MONSTER_DB.filter(m => m.rarity === rarity) || MONSTER_DB.filter(m => m.rarity === 'Common');
    const template = pool[Math.floor(Math.random() * pool.length)];

    // 3. Roll Stats (Area Multiplier affects stats)
    const areaMult = AREAS[gameData.areaIndex].mult;
    const atk = Math.floor((template.base + Math.random() * template.variance) * areaMult);
    const def = Math.floor((template.base + Math.random() * template.variance) * areaMult);
    const spd = Math.floor((template.base + Math.random() * template.variance) * areaMult);
    
    const vibe = atk + def + spd;

    // 4. Create Object
    const newDoodle = {
        uid: Date.now() + Math.random(), // Unique ID
        name: template.name,
        rarity: rarity,
        img: template.img,
        stats: { atk, def, spd },
        vibe: vibe
    };

    gameData.inventory.push(newDoodle);
    showPopup(newDoodle);
    renderInventory();
    saveGame();
}

function equipDoodle(uid) {
    // Find first empty slot or alert
    const emptySlot = gameData.slots.find(s => s.equippedId === null);
    
    if (emptySlot) {
        emptySlot.equippedId = uid;
    } else {
        // If full, replace the first one (simple logic for now)
        gameData.slots[0].equippedId = uid;
    }
    renderUI();
    saveGame();
}

function unequipDoodle(slotIndex) {
    gameData.slots[slotIndex].equippedId = null;
    renderUI();
    saveGame();
}

function upgradeSlot(index) {
    const slot = gameData.slots[index];
    const cost = slot.level * 200;
    
    if (gameData.gold >= cost) {
        addGold(-cost);
        slot.level++;
        renderUI();
    }
}

/* --- AREA SYSTEM --- */

function changeArea(dir) {
    const newIndex = gameData.areaIndex + dir;
    if (newIndex >= 0 && newIndex <= gameData.areasUnlocked && newIndex < AREAS.length) {
        gameData.areaIndex = newIndex;
        renderUI();
    }
}

function unlockNextArea() {
    const nextIndex = gameData.areasUnlocked + 1;
    if (nextIndex >= AREAS.length) return;

    const cost = AREAS[nextIndex].cost;
    if (gameData.gold >= cost) {
        addGold(-cost);
        gameData.areasUnlocked++;
        gameData.areaIndex = nextIndex; // Auto move to new area
        renderUI();
        saveGame();
    }
}

/* --- UI RENDERING --- */

function updateHeader() {
    document.getElementById('gold-display').innerText = gameData.gold;
}

function renderUI() {
    updateHeader();
    
    // Render Area
    const area = AREAS[gameData.areaIndex];
    document.getElementById('area-name').innerText = area.name;
    document.getElementById('area-stats').innerText = `Luck x${area.luck} | Stats x${area.mult}`;
    
    const nextAreaIdx = gameData.areasUnlocked + 1;
    const unlockBtn = document.getElementById('unlock-btn');
    if (nextAreaIdx < AREAS.length) {
        unlockBtn.innerText = `Unlock Next ($${AREAS[nextAreaIdx].cost})`;
        unlockBtn.style.display = 'block';
    } else {
        unlockBtn.style.display = 'none';
    }

    document.getElementById('summon-cost').innerText = `($${10 * (gameData.areaIndex + 1)})`;

    // Render Slots
    const slotsDiv = document.getElementById('slots-container');
    slotsDiv.innerHTML = '';
    
    gameData.slots.forEach((slot, idx) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';
        
        if (slot.equippedId) {
            const doodle = gameData.inventory.find(d => d.uid === slot.equippedId);
            slotDiv.innerHTML = `
                <div class="img-box">${getImageHTML(doodle.img)}</div>
                <div style="font-weight:bold">${doodle.name}</div>
                <div style="font-size:0.8rem">Vibe: ${doodle.vibe}</div>
                <button class="slot-upgrade-btn" onclick="unequipDoodle(${idx})">Unequip</button>
            `;
        } else {
            slotDiv.innerHTML = `<span style="opacity:0.5">Empty</span>`;
        }
        
        // Upgrade button
        const upBtn = document.createElement('button');
        upBtn.className = 'slot-upgrade-btn';
        upBtn.innerText = `Lvl ${slot.level} (Up: $${slot.level * 200})`;
        upBtn.onclick = () => upgradeSlot(idx);
        slotDiv.appendChild(upBtn);
        
        slotsDiv.appendChild(slotDiv);
    });

    renderInventory();
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    // Sort logic could go here
    const sortedInv = [...gameData.inventory].reverse(); // Newest first

    sortedInv.forEach(doodle => {
        const isEquipped = gameData.slots.some(s => s.equippedId === doodle.uid);
        
        const card = document.createElement('div');
        card.className = `inv-item ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
            <div class="img-box">${getImageHTML(doodle.img)}</div>
            <div>${doodle.name}</div>
            <div style="color:${getRarityColor(doodle.rarity)}">${doodle.rarity}</div>
            <div>Vibe: ${doodle.vibe}</div>
        `;
        card.onclick = () => { if(!isEquipped) equipDoodle(doodle.uid); };
        grid.appendChild(card);
    });
}

// Helper to handle images or fallbacks
function getImageHTML(imgName) {
    // If you have uploaded images to an 'images' folder, this works.
    // Otherwise it shows a generic icon.
    return `<img src="images/${imgName}" onerror="this.style.display='none';this.parentNode.innerText='?'">`;
}

function getRarityColor(rarity) {
    if(rarity === 'Legendary') return '#e67e22';
    if(rarity === 'Rare') return '#3498db';
    return '#7f8c8d';
}

/* --- POPUP & SAVE --- */

function showPopup(doodle) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-name').innerText = doodle.name;
    document.getElementById('modal-rarity').innerText = doodle.rarity;
    document.getElementById('modal-vibe').innerText = doodle.vibe;
    document.getElementById('modal-atk').innerText = doodle.stats.atk;
    document.getElementById('modal-def').innerText = doodle.stats.def;
    document.getElementById('modal-spd').innerText = doodle.stats.spd;
    document.getElementById('modal-img-placeholder').innerHTML = getImageHTML(doodle.img);
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function saveGame() {
    localStorage.setItem('doodleGachaSave', JSON.stringify(gameData));
}

function loadGame() {
    const saved = localStorage.getItem('doodleGachaSave');
    if (saved) {
        gameData = JSON.parse(saved);
    }
}

function clearSave() {
    localStorage.removeItem('doodleGachaSave');
    location.reload();
}

// Start
init();
