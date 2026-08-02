// ============================================================
// STEP 1: GET THE CANVAS AND ITS "CONTEXT"
// ============================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ============================================================
// STEP 2: GAME STATE VARIABLES
// ============================================================
const GROUND_Y = 120;

const dino = {
  x: 50,
  y: GROUND_Y,
  width: 30,
  height: 30,
  velocityY: 0,
  isJumping: false,
};

const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;

let obstacles = [];
let frameCount = 0;
let score = 0;
let gameSpeed = 4;
let isGameOver = false;
let isRunning = false;

// ============================================================
// STEP 3: INPUT HANDLING
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;

  if (!isRunning) {
    isRunning = true;
    requestAnimationFrame(gameLoop);
    return;
  }

  if (isGameOver) {
    resetGame();
    return;
  }

  if (!dino.isJumping) {
    dino.velocityY = JUMP_STRENGTH;
    dino.isJumping = true;
  }
});

// ============================================================
// STEP 4: UPDATE FUNCTIONS
// ============================================================
function updateDino() {
  dino.velocityY += GRAVITY;
  dino.y += dino.velocityY;

  if (dino.y > GROUND_Y) {
    dino.y = GROUND_Y;
    dino.velocityY = 0;
    dino.isJumping = false;
  }
}

function spawnObstacles() {
  if (frameCount % 90 === 0 && Math.random() > 0.3) {
    obstacles.push({
      x: canvas.width,
      y: GROUND_Y + 5,
      width: 15,
      height: 25,
    });
  }
}

function updateObstacles() {
  obstacles.forEach((obs) => (obs.x -= gameSpeed));
  obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkAllCollisions() {
  for (const obs of obstacles) {
    if (checkCollision(dino, obs)) {
      endGame();
      return;
    }
  }
}

// ============================================================
// STEP 5: DRAWING
// ============================================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 30);
  ctx.lineTo(canvas.width, GROUND_Y + 30);
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

  ctx.fillStyle = "green";
  obstacles.forEach((obs) => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

  if (isGameOver) {
    ctx.fillStyle = "red";
    ctx.font = "20px sans-serif";
    ctx.fillText("Game Over - press SPACE to restart", 130, 70);
  }
}

// ============================================================
// STEP 6: THE GAME LOOP ITSELF
// ============================================================
function gameLoop() {
  if (isGameOver) return;

  frameCount++;
  score = Math.floor(frameCount / 5);
  document.getElementById("scoreDisplay").textContent = `Score: ${score}`;

  gameSpeed = 4 + score / 200;

  updateDino();
  spawnObstacles();
  updateObstacles();
  checkAllCollisions();
  draw();

  requestAnimationFrame(gameLoop);
}

function endGame() {
  isGameOver = true;
  draw();
  submitScore(score);
}

function resetGame() {
  dino.y = GROUND_Y;
  dino.velocityY = 0;
  obstacles = [];
  frameCount = 0;
  score = 0;
  gameSpeed = 4;
  isGameOver = false;
  requestAnimationFrame(gameLoop);
}

// ============================================================
// STEP 7: TALKING TO THE DJANGO BACKEND
// ============================================================
// NOTE: these paths now match your urls.py ("s/" and "s/t/"),
// assuming your project's main urls.py includes this app's urls
// under the "api/" prefix, e.g. path("api/", include("scores.urls")).
// If your prefix is different, adjust these two strings to match.
async function submitScore(finalScore) {
  try {
    const response = await fetch("/api/s/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_name: "guest", score: finalScore }),
    });
    if (response.ok) loadLeaderboard();
  } catch (err) {
    console.error("Could not submit score:", err);
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch("/api/s/t/");
    const data = await response.json();
    const list = document.getElementById("leaderboardList");
    list.innerHTML = "";
    data.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.player_name}: ${entry.score}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Could not load leaderboard:", err);
  }
}

loadLeaderboard();
draw();