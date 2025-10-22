// Game State
let gameState = {
    score: 0,
    clickPower: 1,
    totalClicks: 0,
    pointsPerSecond: 0,
    upgrades: {
        pauls: {
            owned: 0,
            basePrice: 10,
            currentPrice: 10,
            effect: 1, // adds to click power
            type: 'click'
        },
        biggs: {
            owned: 0,
            basePrice: 100,
            currentPrice: 100,
            effect: 2, // points per second
            type: 'passive'
        },
        mega: {
            owned: 0,
            basePrice: 1000,
            currentPrice: 1000,
            effect: 2, // multiplier for click power
            type: 'multiplier'
        }
    }
};

// DOM Elements
const scoreElement = document.getElementById('score');
const clickPowerElement = document.getElementById('clickPower');
const totalClicksElement = document.getElementById('totalClicks');
const pointsPerSecondElement = document.getElementById('pointsPerSecond');
const clickImage = document.getElementById('clickImage');
const clickEffect = document.getElementById('clickEffect');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    loadGame();
    updateDisplay();
    startPassiveIncome();
    
    // Add click event to the coach image
    clickImage.addEventListener('click', handleClick);
    
    // Auto-save every 30 seconds
    setInterval(saveGame, 30000);
});

// Handle clicking the coach image
function handleClick(event) {
    gameState.score += gameState.clickPower;
    gameState.totalClicks++;
    
    // Create click effect
    showClickEffect(event);
    
    // Add bounce animation to image
    clickImage.classList.add('bounce');
    setTimeout(() => clickImage.classList.remove('bounce'), 500);
    
    updateDisplay();
    updateUpgradeButtons();
}

// Show floating text effect when clicking
function showClickEffect(event) {
    const rect = clickImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    clickEffect.textContent = `+${gameState.clickPower}`;
    clickEffect.style.left = x + 'px';
    clickEffect.style.top = y + 'px';
    clickEffect.style.opacity = '1';
    clickEffect.classList.add('float-up');
    
    setTimeout(() => {
        clickEffect.style.opacity = '0';
        clickEffect.classList.remove('float-up');
    }, 500);
}

// Buy upgrade function
function buyUpgrade(upgradeType) {
    const upgrade = gameState.upgrades[upgradeType];
    
    if (gameState.score >= upgrade.currentPrice) {
        gameState.score -= upgrade.currentPrice;
        upgrade.owned++;
        
        // Apply upgrade effect
        if (upgrade.type === 'click') {
            gameState.clickPower += upgrade.effect;
        } else if (upgrade.type === 'passive') {
            gameState.pointsPerSecond += upgrade.effect;
        } else if (upgrade.type === 'multiplier') {
            gameState.clickPower *= upgrade.effect;
        }
        
        // Increase price (exponential growth)
        upgrade.currentPrice = Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.owned));
        
        updateDisplay();
        updateUpgradeButtons();
        
        // Add purchase effect
        const button = event.target;
        button.style.transform = 'scale(1.2)';
        setTimeout(() => button.style.transform = '', 200);
    }
}

// Update all display elements
function updateDisplay() {
    scoreElement.textContent = formatNumber(Math.floor(gameState.score));
    clickPowerElement.textContent = formatNumber(gameState.clickPower);
    totalClicksElement.textContent = formatNumber(gameState.totalClicks);
    pointsPerSecondElement.textContent = formatNumber(gameState.pointsPerSecond);
    
    // Update upgrade displays
    Object.keys(gameState.upgrades).forEach(upgradeType => {
        const upgrade = gameState.upgrades[upgradeType];
        document.getElementById(`${upgradeType}Owned`).textContent = upgrade.owned;
        document.getElementById(`${upgradeType}Price`).textContent = formatNumber(upgrade.currentPrice);
    });
}

// Update upgrade button states
function updateUpgradeButtons() {
    Object.keys(gameState.upgrades).forEach(upgradeType => {
        const upgrade = gameState.upgrades[upgradeType];
        const button = document.querySelector(`#${upgradeType}Upgrade .buy-button`);
        
        if (gameState.score >= upgrade.currentPrice) {
            button.disabled = false;
            button.style.opacity = '1';
        } else {
            button.disabled = true;
            button.style.opacity = '0.5';
        }
    });
}

// Passive income generation
function startPassiveIncome() {
    setInterval(() => {
        if (gameState.pointsPerSecond > 0) {
            gameState.score += gameState.pointsPerSecond / 10; // Update every 100ms
            updateDisplay();
            updateUpgradeButtons();
        }
    }, 100);
}

// Format large numbers
function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
}

// Save game to localStorage
function saveGame() {
    localStorage.setItem('bmcBrainrotSave', JSON.stringify(gameState));
}

// Load game from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('bmcBrainrotSave');
    if (savedGame) {
        try {
            const loadedState = JSON.parse(savedGame);
            // Merge saved state with default state to handle new properties
            gameState = { ...gameState, ...loadedState };
            
            // Ensure upgrades object is properly merged
            if (loadedState.upgrades) {
                Object.keys(gameState.upgrades).forEach(upgradeType => {
                    if (loadedState.upgrades[upgradeType]) {
                        gameState.upgrades[upgradeType] = {
                            ...gameState.upgrades[upgradeType],
                            ...loadedState.upgrades[upgradeType]
                        };
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load save game:', error);
        }
    }
}

// Reset game function (for testing)
function resetGame() {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
        localStorage.removeItem('bmcBrainrotSave');
        location.reload();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Space bar to click
    if (event.code === 'Space') {
        event.preventDefault();
        handleClick({ clientX: clickImage.offsetLeft + clickImage.offsetWidth/2, clientY: clickImage.offsetTop + clickImage.offsetHeight/2 });
    }
    
    // Number keys for upgrades
    if (event.key === '1') buyUpgrade('pauls');
    if (event.key === '2') buyUpgrade('biggs');
    if (event.key === '3') buyUpgrade('mega');
    
    // R key to reset (with confirmation)
    if (event.key === 'r' || event.key === 'R') {
        if (event.ctrlKey || event.metaKey) {
            resetGame();
        }
    }
});

// Auto-save when page is closed
window.addEventListener('beforeunload', function() {
    saveGame();
});

// Performance monitoring
let lastUpdate = Date.now();
function checkPerformance() {
    const now = Date.now();
    const deltaTime = now - lastUpdate;
    
    if (deltaTime > 1000) { // If frame took longer than 1 second
        console.warn('Performance issue detected, reducing update frequency');
    }
    
    lastUpdate = now;
}

// Add performance check to main update loop
setInterval(checkPerformance, 1000);