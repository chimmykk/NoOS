// renderer process script for the Minesweeper window

// Window controls event listeners (send IPC messages to main process)
document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.minesweeper.minimize();
});

document.getElementById('maximizeBtn').addEventListener('click', () => {
    window.minesweeper.maximize();
});

document.getElementById('closeBtn').addEventListener('click', () => {
    window.minesweeper.close();
});

// --- Minesweeper Game Logic ---

const ROWS = 10; // Example board size
const COLS = 10;
const NUM_MINES = 15; // Example number of mines

let board = [];
let gameEnded = false;

// Function to initialize the board
function initializeBoard() {
    board = [];
    gameEnded = false;
    for (let i = 0; i < ROWS; i++) {
        board[i] = [];
        for (let j = 0; j < COLS; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
    placeMines();
    calculateNeighborMines();
}

// Function to place mines randomly
function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < NUM_MINES) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            minesPlaced++;
        }
    }
}

// Function to calculate neighbor mine counts
function calculateNeighborMines() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (!board[i][j].isMine) {
                let count = 0;
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        if (di === 0 && dj === 0) continue;
                        const ni = i + di;
                        const nj = j + dj;
                        if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj].isMine) {
                            count++;
                        }
                    }
                }
                board[i][j].neighborMines = count;
            }
        }
    }
}

// Function to render the board
function renderBoard() {
    const gameBoardElement = document.getElementById('minesweeper-board'); // Use the new container
    gameBoardElement.innerHTML = ''; // Clear previous board
    // Get the game-container to set grid columns, or set it directly on minesweeper-board if preferred
    // const gameContainer = document.getElementById('game-container'); // This line is no longer needed
    gameBoardElement.style.gridTemplateColumns = `repeat(${COLS}, 30px)`; // Set grid columns on the board container
    gameBoardElement.style.display = 'grid'; // Ensure it's a grid
    gameBoardElement.style.gap = '1px'; // Add gap as defined in CSS
    gameBoardElement.style.borderColor = '#7b7b7b'; // Add border as defined in CSS
    gameBoardElement.style.backgroundColor = '#7b7b7b'; // Add background as defined in CSS

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('minesweeper-cell');
            cellElement.dataset.row = i;
            cellElement.dataset.col = j;
            // Add event listeners for clicking
            cellElement.addEventListener('click', handleCellClick);
            cellElement.addEventListener('contextmenu', handleCellRightClick);

            gameBoardElement.appendChild(cellElement);
        }
    }
}

// Function to handle left click on a cell
function handleCellClick(event) {
    if (gameEnded) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = board[row][col];

    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    event.target.classList.add('revealed');

    if (cell.isMine) {
        // Game over logic
        event.target.classList.add('mine');
        console.log('Game Over - Hit a mine!');
        gameEnded = true;
        revealAllMines(); // Reveal all mines on game over
        updateStatus('Game Over!'); // Update status on lose
    } else if (cell.neighborMines > 0) {
        event.target.textContent = cell.neighborMines;
        event.target.dataset.neighborMines = cell.neighborMines; // Set data attribute for styling
    } else {
        // Reveal adjacent cells if neighborMines is 0
        revealAdjacentCells(row, col);
    }

    checkWinCondition(); // Check for win after revealing a cell
}

// Function to handle right click on a cell (for flagging)
function handleCellRightClick(event) {
    event.preventDefault(); // Prevent context menu
    if (gameEnded) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const cell = board[row][col];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    event.target.classList.toggle('flagged', cell.isFlagged);

    // Update flag count display (will implement later)
    // Check for win condition (can also check for win after flagging, optional)
    // checkWinCondition();
}

// Function to reveal adjacent cells (Recursive function for 0-cells)
function revealAdjacentCells(row, col) {
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const ni = row + di;
            const nj = col + dj;

            if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS) {
                const neighborCell = board[ni][nj];
                const neighborElement = document.querySelector(`.minesweeper-cell[data-row="${ni}"][data-col="${nj}"]`);

                if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                    neighborCell.isRevealed = true;
                    neighborElement.classList.add('revealed');

                    if (neighborCell.neighborMines > 0) {
                        neighborElement.textContent = neighborCell.neighborMines;
                        neighborElement.dataset.neighborMines = neighborCell.neighborMines; // Set data attribute
                    } else {
                        revealAdjacentCells(ni, nj); // Recurse for 0-cells
                    }
                }
            }
        }
    }
}

// Function to reveal all mines at the end of the game
function revealAllMines() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cell = board[i][j];
            if (cell.isMine) {
                const cellElement = document.querySelector(`.minesweeper-cell[data-row="${i}"][data-col="${j}"]`);
                if (cellElement && !cell.isFlagged) { // Don't un-flag correctly flagged mines
                    cellElement.classList.add('revealed', 'mine');
                } else if (cellElement && cell.isFlagged && !cell.isMine) {
                    // Optional: Mark incorrectly flagged cells
                    cellElement.classList.add('revealed', 'wrong-flag');
                }
            }
        }
    }
}

// Function to check for win condition
function checkWinCondition() {
    let revealedCount = 0;
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j].isRevealed && !board[i][j].isMine) {
                revealedCount++;
            }
        }
    }

    const totalNonMineCells = ROWS * COLS - NUM_MINES;
    if (revealedCount === totalNonMineCells) {
        gameEnded = true;
        console.log('You Win!');
        updateStatus('You Win!'); // Update status on win
        // Optional: Auto-flag remaining mines
    }
}

// Function to update game status display
function updateStatus(message) {
    const statusElement = document.getElementById('game-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    initializeBoard();
    renderBoard();
    updateStatus('Game started!'); // Initial status
    // Add restart button listener
    document.getElementById('restart-button').addEventListener('click', () => {
        initializeBoard();
        renderBoard();
        updateStatus('Game started!'); // Reset status on restart
    });
}); 