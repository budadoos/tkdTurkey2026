const turkeyContainer = document.getElementById('turkey-container');
const boardHolder = document.getElementById('board-holder');
const powerBarContainer = document.getElementById('power-bar-container');
const powerBar = document.getElementById('power-bar');
const kiapText = document.getElementById('kiap-text');
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('start-btn');
const congratsScreen = document.getElementById('congrats-screen');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let power = 0;
let powerDirection = 1;
let isCharging = false;
let isPlaying = false;
let animationFrameId = null;
let powerSpeed = 2.5;

const ranks = ["White Belt", "Yellow Belt", "Green Belt", "Blue Belt", "Red Belt", "Black Belt", "Grandmaster Turkey"];
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'miss') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'charge') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + power * 2, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        setTimeout(() => osc.stop(), 50);
    }
}

function startGame() {
    initAudio();
    instructions.style.display = 'none';
    powerBarContainer.style.display = 'block';
    score = 0;
    powerSpeed = 2.5;
    updateHUD();
    isPlaying = true;
    resetBoard();
    setupInputListeners();
}

function updateHUD() {
    scoreDisplay.innerText = `Boards Broken: ${score}`;
    
    // Use the 1-board-per-belt logic
    let rankIndex = Math.min(score, ranks.length - 1);
    levelDisplay.innerText = `Rank: ${ranks[rankIndex]}`;

    // Check if we reached "Grandmaster Turkey" (the last item in the array)
    if (rankIndex === ranks.length - 1 && isPlaying) {
        showCongratsScreen();
    }
}


function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && isPlaying && !isCharging) {
            e.preventDefault();
            startCharging();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && isPlaying && isCharging) {
            e.preventDefault();
            executeKick();
        }
    });

    window.addEventListener('mousedown', () => {
        if (isPlaying && !isCharging && instructions.style.display === 'none') startCharging();
    });
    window.addEventListener('mouseup', () => {
        if (isPlaying && isCharging) executeKick();
    });
    
    window.addEventListener('touchstart', () => {
        if (isPlaying && !isCharging && instructions.style.display === 'none') startCharging();
    });
    window.addEventListener('touchend', () => {
        if (isPlaying && isCharging) executeKick();
    });
}

function startCharging() {
    isCharging = true;
    power = 0;
    powerDirection = 1;
    boardHolder.classList.remove('broken');
    tickPower();
}

function tickPower() {
    if (!isCharging) return;

    power += powerSpeed * powerDirection;
    if (power >= 100) {
        power = 100;
        powerDirection = -1;
    } else if (power <= 0) {
        power = 0;
        powerDirection = 1;
    }

    powerBar.style.width = power + '%';
    if (Math.random() > 0.6) playSound('charge');

    animationFrameId = requestAnimationFrame(tickPower);
}

function executeKick() {
    isCharging = false;
    cancelAnimationFrame(animationFrameId);

    turkeyContainer.classList.add('kicking');
    kiapText.classList.add('show');

    setTimeout(() => {
        if (power >= 75) {
            boardHolder.classList.add('broken');
            playSound('hit');
            score++;
            powerSpeed += 0.3;
            updateHUD();
        } else {
            playSound('miss');
        }
    }, 50);

    setTimeout(() => {
        turkeyContainer.classList.remove('kicking');
        kiapText.classList.remove('show');
        if (power < 75) {
            resetPowerBar();
        } else {
            setTimeout(resetBoard, 600);
        }
    }, 400);
}

function resetPowerBar() {
    power = 0;
    powerBar.style.width = '0%';
}

function resetBoard() {
    boardHolder.classList.remove('broken');
    resetPowerBar();
}

startBtn.addEventListener('click', startGame);
function showCongratsScreen() {
    isPlaying = false; // Stops inputs and action loops
    isCharging = false;
    cancelAnimationFrame(animationFrameId);
    powerBarContainer.style.display = 'none';
    congratsScreen.style.display = 'block';
    
    // Play a quick high-pitched celebration chime sequence
    playSound('hit');
    setTimeout(() => playSound('hit'), 150);
}

function restartGame() {
    congratsScreen.style.display = 'none';
    startGame();
}

// Hook up the new play again button
restartBtn.addEventListener('click', restartGame);
