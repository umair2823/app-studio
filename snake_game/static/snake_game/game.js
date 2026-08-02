/* =========================================================================
   SNAKE GAME — annotated for learning
   =========================================================================
   Read this top-to-bottom once. The whole game is really just three ideas
   repeated over and over:
     1. Everything lives on a GRID (not pixels) — the snake moves one
        grid cell at a time, never half a cell.
     2. The snake is just an ARRAY of {x, y} points. Moving = adding a new
        head and removing the tail (unless it just ate food).
     3. A GAME LOOP runs on a timer, and each tick: move -> check collisions
        -> check food -> draw. That's it. That's the whole game.
   ========================================================================= */

// ---- 1. CONSTANTS: the grid ------------------------------------------------
const GRID_SIZE = 20;                 // the board is 20x20 cells
const CANVAS_SIZE = 400;              // canvas is 400x400 px
const CELL = CANVAS_SIZE / GRID_SIZE; // so each cell is 20x20 px

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");  // the drawing tool for the canvas

// ---- 2. GAME STATE ----------------------------------------------------------
// This object holds EVERYTHING about "what is happening right now".
// If you can describe the current moment of the game, it should be in here.
let state = {
  snake: [{ x: 10, y: 10 }],   // array of segments; index 0 = head
  direction: { x: 0, y: 0 },   // current direction of travel (grid units)
  nextDirection: { x: 0, y: 0 }, // buffered input, applied on next tick (see below)
  food: { x: 5, y: 5 },
  score: 0,
  best: Number(localStorage.getItem("snake_best") || 0),
  running: false,
  paused: false,
  gameOver: false,
};

let tickIntervalMs = 130; // lower = faster snake. This is our "speed".
let loopHandle = null;    // holds the setInterval id so we can stop it later

document.getElementById("best").textContent = pad(state.best);

// ---- 3. INPUT HANDLING ------------------------------------------------------
// Why buffer input into `nextDirection` instead of changing `direction`
// immediately? Because keydown can fire multiple times between game ticks.
// If the player presses Down then Right very fast, and we apply directly,
// the snake could be told to go Down then instantly Right-into-itself
// before it has even moved Down once. Buffering means only ONE direction
// change is applied per tick, matching what the player actually sees.
const KEY_TO_DIR = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
};

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    togglePause();
    return;
  }

  const dir = KEY_TO_DIR[e.key];
  if (!dir) return;

  // Start the game on first arrow press
  if (!state.running && !state.gameOver) startGame();

  // Prevent reversing directly into yourself (e.g. moving right, can't
  // instantly go left — that would collide with your own neck).
  const isReverse =
    dir.x === -state.direction.x && dir.y === -state.direction.y;
  const isFirstMove = state.direction.x === 0 && state.direction.y === 0;

  if (!isReverse || isFirstMove) {
    state.nextDirection = dir;
  }
});

// ---- 4. GAME LOOP -----------------------------------------------------------
function startGame() {
  state = {
    ...state,
    snake: [{ x: 10, y: 10 }],
    direction: { x: 0, y: 0 },
    nextDirection: { x: 1, y: 0 }, // start moving right
    score: 0,
    running: true,
    paused: false,
    gameOver: false,
  };
  placeFood();
  updateScoreDisplay();
  document.getElementById("overlay").hidden = true;
  document.getElementById("gameOverPanel").hidden = true;

  if (loopHandle) clearInterval(loopHandle);
  loopHandle = setInterval(tick, tickIntervalMs);
}

function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
  document.getElementById("overlay").hidden = !state.paused;
  document.getElementById("overlayMsg").textContent = "PAUSED";
  document.getElementById("gameOverPanel").hidden = true;
}

// This runs once per "frame" of the game (every tickIntervalMs).
function tick() {
  if (state.paused || state.gameOver) return;

  state.direction = state.nextDirection;

  // If the snake hasn't started moving yet, do nothing this tick.
  if (state.direction.x === 0 && state.direction.y === 0) {
    draw();
    return;
  }

  const head = state.snake[0];
  const newHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  if (isWallCollision(newHead) || isSelfCollision(newHead)) {
    endGame();
    return;
  }

  state.snake.unshift(newHead); // add new head to the front

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  if (ateFood) {
    state.score += 10;
    updateScoreDisplay();
    placeFood();
    // Note: we do NOT remove the tail this tick — that's what makes the
    // snake grow by one segment when it eats.
  } else {
    state.snake.pop(); // remove tail — this is what makes it "move" not "grow"
  }

  draw();
}

function isWallCollision(point) {
  return (
    point.x < 0 || point.x >= GRID_SIZE || point.y < 0 || point.y >= GRID_SIZE
  );
}

function isSelfCollision(point) {
  // check against every existing segment (the snake array before we add newHead)
  return state.snake.some((seg) => seg.x === point.x && seg.y === point.y);
}

function placeFood() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (state.snake.some((seg) => seg.x === candidate.x && seg.y === candidate.y));
  // ^ keep re-rolling if the random spot landed inside the snake's body
  state.food = candidate;
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  clearInterval(loopHandle);

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("snake_best", String(state.best));
    document.getElementById("best").textContent = pad(state.best);
  }

  document.getElementById("finalScore").textContent = state.score;
  document.getElementById("overlay").hidden = false;
  document.getElementById("gameOverPanel").hidden = false;
  document.getElementById("overlayMsg").textContent = ""; // panel has its own text
}

// ---- 5. DRAWING ---------------------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // food
  ctx.fillStyle = "#ffb703";
  ctx.fillRect(state.food.x * CELL + 2, state.food.y * CELL + 2, CELL - 4, CELL - 4);

  // snake
  state.snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#3dff6e" : "#1f8a3d"; // head brighter than body
    ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function updateScoreDisplay() {
  document.getElementById("score").textContent = pad(state.score);
}

function pad(n) {
  return String(n).padStart(3, "0");
}

draw(); // draw the initial idle frame before the game starts

// ---- 6. TALKING TO DJANGO (this is the backend part) --------------------------
// Django's CSRF protection requires this token on every POST request.
// We read it out of the hidden {% csrf_token %} input Django rendered for us.
function getCsrfToken() {
  return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

async function submitScore(name, score) {
  const response = await fetch("/snake/api/save-score/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({ player_name: name, score: score }),
  });
  return response.json();
}

async function loadLeaderboard() {
  const response = await fetch("/snake/api/leaderboard/");
  const data = await response.json();
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";

  if (!data.scores.length) {
    list.innerHTML = '<li class="lb-empty">No runs yet — be the first.</li>';
    return;
  }

  data.scores.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(entry.player_name)}</span><span>${entry.score}</span>`;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("submitScore").addEventListener("click", async () => {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim() || "Anonymous";

  await submitScore(name, state.score);
  await loadLeaderboard();
  startGame(); // restart immediately after saving
});

loadLeaderboard(); // populate the leaderboard as soon as the page loads
