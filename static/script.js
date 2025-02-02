const mazeElement = document.getElementById('maze');
const timerElement = document.getElementById('timer');
const gameStatus = document.getElementById('game-status');
const statusMessage = document.getElementById('status-message');
const completionTime = document.getElementById('completion-time');

// Extract player_name and player_number from the URL
const urlParams = new URLSearchParams(window.location.search);
const playerName = urlParams.get('player_name');
const playerNumber = urlParams.get('player_number');

document.addEventListener('DOMContentLoaded', () => {
    if (playerName && playerNumber) {
        // Check if player is already registered
        fetch('/check-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, playerNumber })
        })
        .then(response => response.json())
        .then(data => {
            const message = data.message;

            // Check if player exists and handle accordingly
            if (data.exists) {
                // Check if player is allowed to play or not
                if (message.includes("Welcome back")) {
                    // Restrict gameplay for returning players
                    restrictGameplay(message);
                }
            } else {
                // New player - register them and continue game
                registerPlayer();
            }
        })
        .catch(error => console.error("Error checking player:", error));
    }
});

// Register player if they are new
function registerPlayer() {
    fetch('/register-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerNumber })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message.includes("You are now registered")) {
            // Allow the player to play the game
            enableGameplay();
        }
    })
    .catch(error => console.error("Error registering player:", error));
}

// Restrict gameplay for existing players
function restrictGameplay(message) {
    alert(message);

    // Disable game controls
    document.getElementById('controls').style.display = 'none';
    document.getElementById('maze').style.opacity = '0.5';
    document.getElementById('timer-container').style.display = 'none';

    // Show a restriction message to the player
    const restrictionMessage = document.createElement('div');
    restrictionMessage.className = 'restriction-message';
    restrictionMessage.textContent = message;
    document.querySelector('.game-container').appendChild(restrictionMessage);

    if (gameTimer) {
        clearInterval(gameTimer);
    }
}

// Allow player to play the game
function enableGameplay() {
    // Show the game controls
    document.getElementById('controls').style.display = 'block';
    document.getElementById('maze').style.opacity = '1';
}


// Display the player details in the UI
document.getElementById('player-name').textContent = playerName ? playerName : 'Player Name';
document.getElementById('player-number').textContent = playerNumber ? playerNumber : 'Player Number';


const TOTAL_TIME = 300; // 5:30 in seconds
const CIRCUMFERENCE = 2 * Math.PI * 22;
const timerProgress = document.querySelector('.timer-progress');
timerProgress.style.strokeDasharray = CIRCUMFERENCE;

function generateMaze(width, height) {
    const maze = Array.from({ length: height }, () => Array(width).fill(1));
    const stack = [];
    const start = { x: 1, y: Math.floor(height / 2) };
    maze[start.y][start.x] = 0;
    stack.push(start);

    // Generate the maze using recursive backtracking
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const directions = [
            { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }
        ].sort(() => Math.random() - 0.5);

        let found = false;
        for (const dir of directions) {
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
                maze[ny][nx] = 0;
                maze[current.y + dir.y / 2][current.x + dir.x / 2] = 0;
                stack.push({ x: nx, y: ny });
                found = true;
                break;
            }
        }
        if (!found) stack.pop();
    }

    // Mark the entrance and exit
    maze[Math.floor(height / 2)][1] = 0; // Entrance (left side)
    maze[Math.floor(height / 2)][width - 2] = 0; // Exit (right side)
    return maze;
}



// Game state
let gameStarted = false;
let timeLeft = 330; // 5 minutes
let gameTimer;
const player = { x: 1, y: Math.floor(50 / 2), canMove: false };

// Initialize game
const maze = generateMaze(50, 50);
renderMaze(maze);

function renderMaze(maze) {
    mazeElement.innerHTML = '';  // Clear the maze

    maze.forEach((row, y) => {
        row.forEach((cell, x) => {
            const cellElement = document.createElement('div');
            cellElement.className = `cell ${cell === 1 ? 'wall' : 'path'}`;
            cellElement.dataset.x = x;
            cellElement.dataset.y = y;

            // Mark exit door at the right end of the maze (right middle row)
            if (x === maze[0].length - 2 && y === Math.floor(maze.length / 2)) {
                cellElement.classList.add('exit');  // This is the exit door
            }

            mazeElement.appendChild(cellElement);
        });
    });

    // Update player's position
    updatePlayerPosition();
}


function getCellClass(cell) {
    switch (cell) {
        case 0: return 'path';
        case 1: return 'wall';
        case 2: return 'entrance';  // Entrance Door
        case 3: return 'exit';      // Exit Door
        default: return 'path';
    }
}

// Update player position logic
function updatePlayerPosition() {
    // Remove the player class from previous positions
    document.querySelectorAll('.cell.player').forEach(cell => cell.classList.remove('player'));

    // Find the current position of the player in the maze
    const cell = document.querySelector(`[data-x="${player.x}"][data-y="${player.y}"]`);
    if (cell) cell.classList.add('player');  // Add player class to the new position

    // Check if the player has reached the exit door
    const exitCell = document.querySelector('.cell.exit');
    if (exitCell && player.x === parseInt(exitCell.dataset.x) && player.y === parseInt(exitCell.dataset.y)) {
        endGame(won = true);  // End the game with a win
    }
}



// Movement controls
document.getElementById('up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('right').addEventListener('click', () => movePlayer(1, 0));

function movePlayer(dx, dy) {
    if (!player.canMove) return;
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < maze[0].length && newY >= 0 && newY < maze.length && maze[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;
        updatePlayerPosition();
    }
}

// Timer function (already defined but with small changes)
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        player.canMove = true;
        timeLeft = TOTAL_TIME;
        
        // Initialize timer progress
        timerProgress.style.strokeDashoffset = 0;
        
        // Start the countdown timer
        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame(false);
            }
        }, 1000);
        
        // Initial timer update
        updateTimer();
    }
}

// Update timer display
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Update text
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update circle progress
    const progress = timeLeft / TOTAL_TIME;
    const dashOffset = CIRCUMFERENCE * (1 - progress);
    timerProgress.style.strokeDashoffset = dashOffset;
    
    // Add warning animation when less than 1 minute remains
    if (timeLeft <= 30) {
        timerProgress.classList.add('warning');
    } else {
        timerProgress.classList.remove('warning');
    }
}


function endGame(won) {
    clearInterval(gameTimer);
    gameStarted = false;
    player.canMove = false;

    timerProgress.style.strokeDashoffset = CIRCUMFERENCE;
    timerProgress.classList.remove('warning');

    if (won) {
        statusMessage.textContent = "🎉 Congratulations! You Escaped!";

        fetch('/submit-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName,
                playerNumber,
                timeRemaining: timeLeft,
                escaped: true
            })
        })
        .then(response => response.json())
        .then(data => console.log("Game Result Submitted:", data))
        .catch(error => console.error("Error submitting game result:", error));

    } else {
        statusMessage.textContent = "⏳ Time's Up! You’re Trapped!";
        completionTime.textContent = "";

        // Send fail result to server
        fetch('/submit-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName,
                playerNumber,
                timeRemaining: 0,
                escaped: false
            })
        })
        .then(response => response.json())
        .then(data => console.log("Game Result Submitted:", data))
        .catch(error => console.error("Error submitting game result:", error));
    }


    // Show the game status modal
    gameStatus.classList.remove('hidden');
    gameStatus.style.display = 'block';

     // Send result to server
    fetch('/submit-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerName: document.getElementById('player-name').textContent,
            playerNumber: document.getElementById('player-number').textContent,
            escaped: won,
            timeRemaining: timeLeft
        })
    });
    
}




// Start the game automatically
startGame();

