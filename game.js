const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 18;
const WIN_SCORE = 7;

// Player paddle
let player = { x: 20, y: HEIGHT/2 - PADDLE_HEIGHT/2, dy: 0, speed: 6 };

// Computer paddle
let ai = { x: WIDTH - 20 - PADDLE_WIDTH, y: HEIGHT/2 - PADDLE_HEIGHT/2, dy: 0, speed: 5 };

// Ball
let ball = {
  x: WIDTH/2 - BALL_SIZE/2,
  y: HEIGHT/2 - BALL_SIZE/2,
  dx: 5 * (Math.random() > 0.5 ? 1 : -1),
  dy: 4 * (Math.random() > 0.5 ? 1 : -1)
};

let score = { player: 0, ai: 0 };
let keys = { w: false, s: false };
let gameOver = false;

function drawField() {
  // Background
  ctx.fillStyle = "#0c2e4e";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Center line
  ctx.strokeStyle = "#fff5";
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 18]);
  ctx.beginPath();
  ctx.moveTo(WIDTH/2, 0);
  ctx.lineTo(WIDTH/2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center circle
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(WIDTH/2, HEIGHT/2, 50, 0, Math.PI*2);
  ctx.stroke();

  // Goals
  ctx.fillStyle = "#0af7";
  ctx.fillRect(0, HEIGHT/2 - 60, 8, 120);
  ctx.fillRect(WIDTH-8, HEIGHT/2 - 60, 8, 120);
}

function drawPaddle(p, color="#fd0") {
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  // Lyla face (for fun) on player paddle
  if(color==="#fd0") {
    ctx.save();
    ctx.translate(p.x+PADDLE_WIDTH/2, p.y+PADDLE_HEIGHT/2);
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, 2*Math.PI);
    ctx.fillStyle = "#ffecb3";
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(-7,-3,3,0,2*Math.PI); ctx.arc(7,-3,3,0,2*Math.PI); ctx.fill();
    // Smile
    ctx.strokeStyle = "#c47";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,5,9,0.1,Math.PI-0.1); ctx.stroke();
    ctx.restore();
  }
}

function drawBall() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x + BALL_SIZE/2, ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#0af";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.restore();
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "44px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(score.player, WIDTH/2 - 60, 60);
  ctx.fillText(score.ai, WIDTH/2 + 60, 60);
}

function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.font = "54px Arial Black, Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    score.player > score.ai ? "You Win! 🏆" : "Computer Wins!",
    WIDTH/2, HEIGHT/2 - 30);
  ctx.font = "30px Arial";
  ctx.fillText("Press Restart to play again.", WIDTH/2, HEIGHT/2 + 30);
}

function movePlayer() {
  if (keys.w) player.dy = -player.speed;
  else if (keys.s) player.dy = player.speed;
  else player.dy = 0;

  player.y += player.dy;
  // Boundaries
  if (player.y < 0) player.y = 0;
  if (player.y + PADDLE_HEIGHT > HEIGHT) player.y = HEIGHT - PADDLE_HEIGHT;
}

function moveAI() {
  const center = ai.y + PADDLE_HEIGHT/2;
  // Only move when ball is coming towards AI
  if (ball.dx > 0 && ball.x > WIDTH/2) {
    if (center < ball.y+BALL_SIZE/2-10) ai.dy = ai.speed;
    else if (center > ball.y+BALL_SIZE/2+10) ai.dy = -ai.speed;
    else ai.dy = 0;
  } else {
    // Slowly move to center
    if (center < HEIGHT/2-5) ai.dy = ai.speed/2;
    else if (center > HEIGHT/2+5) ai.dy = -ai.speed/2;
    else ai.dy = 0;
  }
  ai.y += ai.dy;
  if (ai.y < 0) ai.y = 0;
  if (ai.y + PADDLE_HEIGHT > HEIGHT) ai.y = HEIGHT - PADDLE_HEIGHT;
}

function moveBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top/bottom wall
  if (ball.y <= 0 || ball.y + BALL_SIZE >= HEIGHT) {
    ball.dy *= -1;
    ball.y = Math.max(0, Math.min(ball.y, HEIGHT-BALL_SIZE));
  }

  // Player paddle collision
  if (
    ball.x <= player.x + PADDLE_WIDTH &&
    ball.x >= player.x &&
    ball.y + BALL_SIZE > player.y &&
    ball.y < player.y + PADDLE_HEIGHT
  ) {
    ball.dx *= -1;
    ball.x = player.x + PADDLE_WIDTH + 1;
    // Add some randomness based on hit spot
    let delta = (ball.y + BALL_SIZE/2) - (player.y + PADDLE_HEIGHT/2);
    ball.dy = delta * 0.25 + (Math.random()-0.5)*3;
  }

  // AI paddle collision
  if (
    ball.x + BALL_SIZE >= ai.x &&
    ball.x + BALL_SIZE <= ai.x + PADDLE_WIDTH &&
    ball.y + BALL_SIZE > ai.y &&
    ball.y < ai.y + PADDLE_HEIGHT
  ) {
    ball.dx *= -1;
    ball.x = ai.x - BALL_SIZE - 1;
    let delta = (ball.y + BALL_SIZE/2) - (ai.y + PADDLE_HEIGHT/2);
    ball.dy = delta * 0.25 + (Math.random()-0.5)*3;
  }

  // Score
  if (ball.x < 0) {
    score.ai += 1;
    resetBall(-1);
  } else if (ball.x + BALL_SIZE > WIDTH) {
    score.player += 1;
    resetBall(1);
  }

  // Game over
  if (score.player >= WIN_SCORE || score.ai >= WIN_SCORE) {
    gameOver = true;
  }
}

function resetBall(direction = 1) {
  ball.x = WIDTH/2 - BALL_SIZE/2;
  ball.y = HEIGHT/2 - BALL_SIZE/2;
  ball.dx = 5 * direction;
  ball.dy = (Math.random() - 0.5) * 7;
}

function gameLoop() {
  drawField();
  drawPaddle(player, "#fd0");
  drawPaddle(ai, "#0af");
  drawBall();
  drawScore();

  if (gameOver) {
    drawGameOver();
    return;
  }

  movePlayer();
  moveAI();
  moveBall();

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "w" || e.key === "W") keys.w = true;
  if (e.key === "s" || e.key === "S") keys.s = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "w" || e.key === "W") keys.w = false;
  if (e.key === "s" || e.key === "S") keys.s = false;
});

window.restartGame = function() {
  score = { player: 0, ai: 0 };
  player.y = HEIGHT/2 - PADDLE_HEIGHT/2;
  ai.y = HEIGHT/2 - PADDLE_HEIGHT/2;
  resetBall(Math.random() > 0.5 ? 1 : -1);
  gameOver = false;
  gameLoop();
}

// Start game
gameLoop();
