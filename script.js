document.addEventListener('DOMContentLoaded', () => {

  const homeScreen = document.getElementById('screen-home');
  const gameScreen = document.getElementById('screen-game');
  const leaderboardModal = document.getElementById('leaderboardModal');

  const playerNameInput = document.getElementById('playerNameInput');
  const addPlayerBtn = document.getElementById('addPlayerBtn');
  const playerSelect = document.getElementById('playerSelect');
  const difficultySelect = document.getElementById('difficulty');

  const playBtn = document.getElementById('playBtn');
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

  const currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
  const currentDifficulty = document.getElementById('currentDifficulty');
  const errorCount = document.getElementById('errorCount');
  const timerEl = document.getElementById('timer');
  const sudokuEl = document.getElementById('sudoku');

  const newGameBtn = document.getElementById('newGameBtn');
  const checkBtn = document.getElementById('checkBtn');
  const solveBtn = document.getElementById('solveBtn');
  const exitBtn = document.getElementById('exitBtn');

  const numPad = document.getElementById('numpad');
  const fxCanvas = document.getElementById('fx');

  const winModal = document.getElementById('winModal');
  const winTime = document.getElementById('winTime');
  const closeWinBtn = document.getElementById('closeWinBtn');

  const leaderboardContent = document.getElementById('leaderboardContent');

  let selectedCell = null;
  let player = '';
  let difficulty = 'medium';
  let solution = [];
  let puzzle = [];
  let errors = 0;
  let seconds = 0;
  let timerInterval = null;
  const STORAGE_PREFIX = 'sudoku_';

  // ---------------- Player Management ----------------
  function addPlayer() {
    const name = playerNameInput.value.trim();
    if (name && ![...playerSelect.options].some(opt => opt.value === name)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      playerSelect.appendChild(opt);
      savePlayers();
    }
    playerSelect.value = name;
    player = name;
  }

  function savePlayers() {
    const players = [...playerSelect.options].map(opt => opt.value);
    localStorage.setItem('sudoku_players', JSON.stringify(players));
  }

  function loadPlayers() {
    const stored = JSON.parse(localStorage.getItem('sudoku_players') || '[]');
    stored.forEach(name => {
      if (![...playerSelect.options].some(opt => opt.value === name)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        playerSelect.appendChild(opt);
      }
    });
  }

  loadPlayers();

  addPlayerBtn.addEventListener('click', addPlayer);
  playerSelect.addEventListener('change', () => { player = playerSelect.value; });

  playBtn.addEventListener('click', () => {
    if (!playerSelect.value) { alert('Select or add a player'); return; }
    player = playerSelect.value;
    difficulty = difficultySelect.value;
    homeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    currentPlayerDisplay.textContent = player;
    currentDifficulty.textContent = difficulty;
    startNewGame();
  });

  leaderboardBtn.addEventListener('click', () => {
    renderLeaderboard();
    leaderboardModal.classList.remove('hidden');
  });
  closeLeaderboardBtn.addEventListener('click', ()=>leaderboardModal.classList.add('hidden'));

  exitBtn.addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    stopTimer();
  });

  // ---------------- Timer ----------------
  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    if (timerEl) timerEl.textContent = formatTime(seconds);
    timerInterval = setInterval(() => {
      seconds++;
      if (timerEl) timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() { clearInterval(timerInterval); }
  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2,'0');
    const s = String(sec % 60).padStart(2,'0');
    return `${m}:${s}`;
  }

  // ---------------- Game ----------------
  newGameBtn.addEventListener('click', startNewGame);
function startNewGame() {
    errors = 0;
    errorCount.textContent = errors;
    selectedCell = null;
    generateSudoku(difficulty);
    renderSudoku();
    startTimer();
    resizeFxCanvas();
}

// ---------------- Dynamic Sudoku Generator ----------------
function generateSudoku(level) {
    solution = Array.from({length: 9}, () => Array(9).fill(0));
    fillSudoku(solution);

    // Deep copy to puzzle
    puzzle = solution.map(row => row.slice());

    // Remove numbers based on difficulty
    let removeCount = level==='easy' ? 40 : level==='medium'?50:60;
    while (removeCount > 0) {
        const r = Math.floor(Math.random()*9);
        const c = Math.floor(Math.random()*9);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            removeCount--;
        }
    }
}

// Fill Sudoku using backtracking
function fillSudoku(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                const numbers = shuffle([...Array(9)].map((_,i)=>i+1));
                for (let n of numbers) {
                    if (isValid(board,r,c,n)) {
                        board[r][c] = n;
                        if (fillSudoku(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Check if placing num is valid
function isValid(board,row,col,num) {
    for (let i=0;i<9;i++){
        if(board[row][i]===num || board[i][col]===num) return false;
    }
    const startRow = Math.floor(row/3)*3;
    const startCol = Math.floor(col/3)*3;
    for (let r=0;r<3;r++){
        for (let c=0;c<3;c++){
            if(board[startRow+r][startCol+c]===num) return false;
        }
    }
    return true;
}

// Shuffle array
function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
// ---------------- Render Sudoku (div-based cells; no inputs) ----------------
function renderSudoku() {
    sudokuEl.innerHTML='';
    selectedCell = null;

    for (let r=0;r<9;r++){
        for (let c=0;c<9;c++){
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            if(r%3===0) cellDiv.classList.add('thick-top');
            if(r%3===2) cellDiv.classList.add('thick-bottom');
            if(c%3===0) cellDiv.classList.add('thick-left');
            if(c%3===2) cellDiv.classList.add('thick-right');

            cellDiv.dataset.r = r;
            cellDiv.dataset.c = c;

            if (puzzle[r][c] !== 0) {
                cellDiv.textContent = puzzle[r][c];
                cellDiv.classList.add('given');
            } else {
                cellDiv.textContent = '';
            }

            // Ensure no keyboard shows on mobile
            cellDiv.setAttribute('contenteditable','false');

            // Click selects cell unless it's a given
            cellDiv.addEventListener('click', () => {
                if (cellDiv.classList.contains('given')) return;
                if (selectedCell) selectedCell.classList.remove('selected');
                selectedCell = cellDiv;
                selectedCell.classList.add('selected');
            });

            sudokuEl.appendChild(cellDiv);
        }
    }
}

// ---------------- Cell Input handler (used by numpad actions) ----------------
function handleCellEntry(cell, value) {
    // cell = DOM element (div.cell), value = '' or '1'..'9'
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);

    // Clear previous incorrect marker if any
    cell.classList.remove('incorrect');

    if (value === '' || value === null) {
        cell.textContent = '';
        puzzle[r][c] = 0;
        return;
    }

    // Put value into div and model
    cell.textContent = value;
    puzzle[r][c] = Number(value);

    // Validate against solution (immediate feedback)
    if (Number(value) !== solution[r][c]) {
        cell.classList.add('incorrect');
        errors++;
        errorCount.textContent = errors;
    } else {
        // correct input; remove incorrect if present
        cell.classList.remove('incorrect');
    }

    checkWinCondition();
}

// ---------------- Numpad ----------------
if(numPad){
    numPad.addEventListener('click', e=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      if(!selectedCell) return;

      // don't allow editing given cells
      if (selectedCell.classList.contains('given')) return;

      const inputId = btn.id || '';
      if(inputId === 'clearKey') {
        // clear cell
        const r = parseInt(selectedCell.dataset.r,10);
        const c = parseInt(selectedCell.dataset.c,10);
        selectedCell.textContent = '';
        puzzle[r][c] = 0;
        selectedCell.classList.remove('incorrect');
        return;
      }

      const v = btn.textContent.trim();
      if(!/^[1-9]$/.test(v)) return;

      // write into selected cell and validate
      handleCellEntry(selectedCell, v);
    });
}

// ---------------- Check/Solve ----------------
checkBtn.addEventListener('click', checkBoard);
solveBtn.addEventListener('click', solveBoard);

function checkBoard(){
    errors=0;
    const cells = sudokuEl.querySelectorAll('.cell');
    cells.forEach(cell=>{
      const r=parseInt(cell.dataset.r,10);
      const c=parseInt(cell.dataset.c,10);
      cell.classList.remove('incorrect');
      // skip given cells
      if (cell.classList.contains('given')) return;
      const valText = (cell.textContent || '').trim();
      if(valText !== '' && parseInt(valText,10) !== solution[r][c]){
        cell.classList.add('incorrect');
        errors++;
      }
    });
    errorCount.textContent=errors;
}

function solveBoard(){
    const cells = sudokuEl.querySelectorAll('.cell');
    cells.forEach(cell=>{
      const r=parseInt(cell.dataset.r,10);
      const c=parseInt(cell.dataset.c,10);
      cell.textContent = solution[r][c];
      cell.classList.add('given');
      cell.classList.remove('incorrect');
    });
    stopTimer();
    showFireworks();
    winTime.textContent = `Time: ${formatTime(seconds)} | Errors: ${errors}`;
    winModal.classList.remove('hidden');
    saveUserTime(player,difficulty,seconds);
}

// ---------------- Win Detection ----------------
function checkWinCondition(){
    const cells = sudokuEl.querySelectorAll('.cell');
    let complete=true;
    cells.forEach(cell=>{
      const r=parseInt(cell.dataset.r,10);
      const c=parseInt(cell.dataset.c,10);
      const valText = (cell.textContent || '').trim();
      if(valText === '' || parseInt(valText,10) !== solution[r][c]) complete=false;
    });
    if(complete){
      stopTimer();
      showFireworks();
      winTime.textContent = `Time: ${formatTime(seconds)} | Errors: ${errors}`;
      winModal.classList.remove('hidden');
      cells.forEach(cell=>cell.classList.add('given'));
      saveUserTime(player,difficulty,seconds);
    }
}

closeWinBtn.addEventListener('click', ()=>winModal.classList.add('hidden'));

// ---------------- Leaderboard ----------------
function saveUserTime(playerName,diff,time){
    const key = `${STORAGE_PREFIX}${playerName}_${diff}`;
    const prev = JSON.parse(localStorage.getItem(key)||'[]');
    prev.push(time);
    prev.sort((a,b)=>a-b);
    localStorage.setItem(key,JSON.stringify(prev.slice(0,3)));
}

function getUserTimes(playerName,diff){
    const key = `${STORAGE_PREFIX}${playerName}_${diff}`;
    return JSON.parse(localStorage.getItem(key)||'[]');
}

function renderLeaderboard(){
    leaderboardContent.innerHTML='';
    for(let i=0;i<playerSelect.options.length;i++){
      const name=playerSelect.options[i].value;
      ['easy','medium','hard'].forEach(diff=>{
        const times = getUserTimes(name,diff);
        if(times.length){
          leaderboardContent.innerHTML+=`<p>${name} - ${diff}: ${times.map(t=>formatTime(t)).join(', ')}</p>`;
        }
      });
    }
}

// ---------------- Fireworks ----------------
function showFireworks(){
    if(!fxCanvas) return;
    const ctx = fxCanvas.getContext('2d');
    const rect = fxCanvas.getBoundingClientRect();
    fxCanvas.width = rect.width;
    fxCanvas.height = rect.height;
    let duration = 0;
    const interval = setInterval(()=>{
      ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`;
      ctx.beginPath();
      ctx.arc(Math.random()*rect.width,Math.random()*rect.height,5+Math.random()*10,0,Math.PI*2);
      ctx.fill();
      duration++;
      if(duration>50){
        clearInterval(interval);
        ctx.clearRect(0,0,rect.width,rect.height);
      }
    },50);
}

// ---------------- Resize Canvas ----------------
function resizeFxCanvas(){
    if(!fxCanvas) return;
    const rect = sudokuEl.getBoundingClientRect();
    fxCanvas.width = rect.width;
    fxCanvas.height = rect.height;
}

window.addEventListener('resize', resizeFxCanvas);

}); // end DOMContentLoaded
