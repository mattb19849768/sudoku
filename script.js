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

// ---------------- Render Sudoku ----------------
function renderSudoku() {
    sudokuEl.innerHTML='';
    for (let r=0;r<9;r++){
        for (let c=0;c<9;c++){
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            if(r%3===0) cellDiv.classList.add('thick-top');
            if(r%3===2) cellDiv.classList.add('thick-bottom');
            if(c%3===0) cellDiv.classList.add('thick-left');
            if(c%3===2) cellDiv.classList.add('thick-right');

            const input=document.createElement('input');
            input.type='text';
            input.maxLength=1;
            input.dataset.r=r;
            input.dataset.c=c;
            if(puzzle[r][c]!==0){input.value=puzzle[r][c]; input.disabled=true;}
            input.addEventListener('input', onCellInput);
            cellDiv.appendChild(input);
            sudokuEl.appendChild(cellDiv);
        }
    }

    sudokuEl.addEventListener('click', e=>{
        const inp = e.target.closest('input');
        if(!inp || inp.disabled) return;
        if(selectedCell) selectedCell.classList.remove('selected');
        selectedCell = inp.parentElement;
        selectedCell.classList.add('selected');
    });
}

// ---------------- Cell Input ----------------
function onCellInput(e){
    const val = e.target.value;
    const r = parseInt(e.target.dataset.r,10);
    const c = parseInt(e.target.dataset.c,10);
    e.target.classList.remove('incorrect');
    if(!/^[1-9]?$/.test(val)) e.target.value='';
    else if(val !== '' && parseInt(val,10) !== solution[r][c]){
      e.target.classList.add('incorrect');
      errors++;
      errorCount.textContent = errors;
    }
    checkWinCondition();
}

// ---------------- Numpad ----------------
if(numPad){
    numPad.addEventListener('click', e=>{
      const btn = e.target.closest('button');
      if(!btn || !selectedCell) return;
      const input = selectedCell.querySelector('input');
      if(!input || input.disabled) return;
      if(btn.id==='clearKey') input.value='';
      else input.value=btn.textContent;
      input.classList.remove('incorrect');
      onCellInput({target:input});
    });
}

// ---------------- Check/Solve ----------------
checkBtn.addEventListener('click', checkBoard);
solveBtn.addEventListener('click', solveBoard);

function checkBoard(){
    errors=0;
    const inputs=sudokuEl.querySelectorAll('input');
    inputs.forEach(input=>{
      const r=parseInt(input.dataset.r,10);
      const c=parseInt(input.dataset.c,10);
      input.classList.remove('incorrect');
      if(!input.disabled && input.value!=='' && parseInt(input.value,10)!==solution[r][c]){
        input.classList.add('incorrect');
        errors++;
      }
    });
    errorCount.textContent=errors;
}

function solveBoard(){
    const inputs = sudokuEl.querySelectorAll('input');
    inputs.forEach(input=>{
      const r=parseInt(input.dataset.r,10);
      const c=parseInt(input.dataset.c,10);
      input.value = solution[r][c];
      input.disabled = true;
      input.classList.remove('incorrect');
    });
    stopTimer();
    showFireworks();
    winTime.textContent = `Time: ${formatTime(seconds)} | Errors: ${errors}`;
    winModal.classList.remove('hidden');
    saveUserTime(player,difficulty,seconds);
}

// ---------------- Win Detection ----------------
function checkWinCondition(){
    const inputs = sudokuEl.querySelectorAll('input');
    let complete=true;
    inputs.forEach(input=>{
      const r=parseInt(input.dataset.r,10);
      const c=parseInt(input.dataset.c,10);
      if(input.value==='' || parseInt(input.value,10)!==solution[r][c]) complete=false;
    });
    if(complete){
      stopTimer();
      showFireworks();
      winTime.textContent = `Time: ${formatTime(seconds)} | Errors: ${errors}`;
      winModal.classList.remove('hidden');
      inputs.forEach(input=>input.disabled=true);
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
