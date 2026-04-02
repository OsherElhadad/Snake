const canvas = document.getElementById("game-board");
const context = canvas.getContext("2d");
const canvasWrap = document.getElementById("canvas-wrap");

const levelLabel = document.getElementById("level-label");
const scoreLabel = document.getElementById("score-label");
const lengthLabel = document.getElementById("length-label");
const targetLabel = document.getElementById("target-label");
const levelTitle = document.getElementById("level-title");
const levelDescription = document.getElementById("level-description");
const progressCount = document.getElementById("progress-count");
const progressFill = document.getElementById("progress-fill");

const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const touchPauseButton = document.getElementById("touch-pause-button");
const touchDirectionButtons = document.querySelectorAll("[data-direction]");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

const levels = [
  {
    name: "שלב 1: פתיחה חלקה",
    description: "מתרגלים שליטה בסיסית. בלי מכשולים ועם קצב רגוע.",
    targetFood: 6,
    speed: 170,
    obstacles: [],
  },
  {
    name: "שלב 2: המסדרון הבוער",
    description: "המשחק מואץ ומופיעים מחסומים שיוצרים נתיבים צרים.",
    targetFood: 8,
    speed: 130,
    obstacles: [
      { x: 7, y: 4 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      { x: 7, y: 7 },
      { x: 12, y: 12 },
      { x: 12, y: 13 },
      { x: 12, y: 14 },
      { x: 12, y: 15 },
      { x: 13, y: 12 },
      { x: 14, y: 12 },
    ],
  },
  {
    name: "שלב 3: הזירה הסופית",
    description: "עוד יותר מהיר, יותר מכשולים, ודורש תכנון תנועה אמיתי.",
    targetFood: 10,
    speed: 95,
    obstacles: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 5, y: 8 },
      { x: 14, y: 4 },
      { x: 14, y: 5 },
      { x: 14, y: 6 },
      { x: 14, y: 7 },
      { x: 9, y: 10 },
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
      { x: 2, y: 15 },
      { x: 3, y: 15 },
      { x: 4, y: 15 },
      { x: 15, y: 15 },
      { x: 15, y: 14 },
      { x: 15, y: 13 },
    ],
  },
];

const state = {
  levelIndex: 0,
  score: 0,
  stageScore: 0,
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 0, y: 0 },
  running: false,
  paused: false,
  loopId: null,
  touchStart: null,
};

function createStartingSnake() {
  return [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ];
}

function levelConfig() {
  return levels[state.levelIndex];
}

function startLevel(levelIndex, keepScore = true) {
  state.levelIndex = levelIndex;
  state.stageScore = 0;
  if (!keepScore) {
    state.score = 0;
  }
  state.snake = createStartingSnake();
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.food = spawnFood();
  state.paused = false;
  syncHud();
  draw();
}

function spawnFood() {
  const obstacles = levelConfig().obstacles;

  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };

    const onSnake = state.snake.some(
      (segment) => segment.x === candidate.x && segment.y === candidate.y
    );
    const onObstacle = obstacles.some(
      (obstacle) => obstacle.x === candidate.x && obstacle.y === candidate.y
    );

    if (!onSnake && !onObstacle) {
      return candidate;
    }
  }
}

function syncHud() {
  const level = levelConfig();
  levelLabel.textContent = String(state.levelIndex + 1);
  scoreLabel.textContent = String(state.score);
  lengthLabel.textContent = String(state.snake.length);
  targetLabel.textContent = String(level.targetFood);
  levelTitle.textContent = level.name;
  levelDescription.textContent = level.description;
  progressCount.textContent = `${state.stageScore} / ${level.targetFood}`;
  progressFill.style.width = `${(state.stageScore / level.targetFood) * 100}%`;
}

function drawGrid() {
  context.strokeStyle = "rgba(148, 163, 184, 0.08)";
  context.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const offset = i * gridSize;

    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }
}

function drawSnake() {
  state.snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? "#86efac" : "#22c55e";
    context.fillRect(
      segment.x * gridSize + 2,
      segment.y * gridSize + 2,
      gridSize - 4,
      gridSize - 4
    );
  });
}

function drawFood() {
  context.fillStyle = "#f97316";
  context.beginPath();
  context.arc(
    state.food.x * gridSize + gridSize / 2,
    state.food.y * gridSize + gridSize / 2,
    gridSize / 2.7,
    0,
    Math.PI * 2
  );
  context.fill();
}

function drawObstacles() {
  context.fillStyle = "#facc15";
  levelConfig().obstacles.forEach((obstacle) => {
    context.fillRect(
      obstacle.x * gridSize + 3,
      obstacle.y * gridSize + 3,
      gridSize - 6,
      gridSize - 6
    );
  });
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#07111f";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawObstacles();
  drawFood();
  drawSnake();
}

function setOverlay(kicker, title, text, show = true) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.toggle("hidden", !show);
}

function scheduleTick() {
  if (state.loopId) {
    window.clearTimeout(state.loopId);
  }

  if (!state.running || state.paused) {
    return;
  }

  state.loopId = window.setTimeout(() => {
    tick();
    scheduleTick();
  }, levelConfig().speed);
}

function startGame() {
  state.running = true;
  setOverlay("", "", "", false);
  syncPauseButton();
  scheduleTick();
}

function resetGame() {
  state.running = false;
  state.paused = false;
  if (state.loopId) {
    window.clearTimeout(state.loopId);
    state.loopId = null;
  }
  startLevel(0, false);
  setOverlay(
    "מוכנים?",
    "לחצו על התחל משחק",
    "סיימו כל שלב על ידי איסוף כמות האוכל הדרושה בלי להתנגש."
  );
  syncPauseButton();
}

function pauseGame() {
  if (!state.running) {
    return;
  }

  state.paused = !state.paused;
  if (state.paused) {
    setOverlay("עצירה", "המשחק בהשהיה", "לחצו רווח כדי להמשיך.", true);
    if (state.loopId) {
      window.clearTimeout(state.loopId);
      state.loopId = null;
    }
  } else {
    setOverlay("", "", "", false);
    scheduleTick();
  }

  syncPauseButton();
}

function advanceLevel() {
  if (state.levelIndex === levels.length - 1) {
    state.running = false;
    setOverlay(
      "ניצחון",
      "השלמתם את כל השלבים",
      `סיימתם עם ${state.score} נקודות ואורך ${state.snake.length}. לחצו על אתחל כדי לשחק שוב.`,
      true
    );
    syncPauseButton();
    return;
  }

  state.running = false;
  if (state.loopId) {
    window.clearTimeout(state.loopId);
    state.loopId = null;
  }

  startLevel(state.levelIndex + 1, true);
  setOverlay(
    "שלב הושלם",
    levels[state.levelIndex].name,
    `${levels[state.levelIndex].description} לחצו על התחל כדי להמשיך לשלב הבא.`,
    true
  );
  syncPauseButton();
}

function endGame(reason) {
  state.running = false;
  if (state.loopId) {
    window.clearTimeout(state.loopId);
    state.loopId = null;
  }

  const message =
    reason === "wall"
      ? "פגעתם בקיר. במסלול הבא נסו לחשוב כמה צעדים קדימה."
      : reason === "obstacle"
        ? "נכנסתם במכשול. שימו לב במיוחד למעברים הצרים."
        : "פגעתם בעצמכם. לפעמים הפנייה הכי מסוכנת היא דווקא המוכרת.";

  setOverlay("הפסד", "הנחש התרסק", `${message} לחצו על אתחל כדי לנסות שוב.`, true);
  syncPauseButton();
}

function syncPauseButton() {
  if (!touchPauseButton) {
    return;
  }

  if (!state.running) {
    touchPauseButton.textContent = "התחל";
    return;
  }

  touchPauseButton.textContent = state.paused ? "המשך" : "עצור";
}

function tick() {
  state.direction = state.nextDirection;
  const nextHead = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= tileCount ||
    nextHead.y < 0 ||
    nextHead.y >= tileCount;
  if (hitWall) {
    endGame("wall");
    return;
  }

  const hitObstacle = levelConfig().obstacles.some(
    (obstacle) => obstacle.x === nextHead.x && obstacle.y === nextHead.y
  );
  if (hitObstacle) {
    endGame("obstacle");
    return;
  }

  const hitSelf = state.snake.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y
  );
  if (hitSelf) {
    endGame("self");
    return;
  }

  state.snake.unshift(nextHead);

  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;

  if (ateFood) {
    state.score += 10;
    state.stageScore += 1;
    state.food = spawnFood();

    if (state.stageScore >= levelConfig().targetFood) {
      syncHud();
      draw();
      advanceLevel();
      return;
    }
  } else {
    state.snake.pop();
  }

  syncHud();
  draw();
}

function handleDirectionChange(key) {
  const map = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
  };

  const next = map[key];
  if (!next) {
    return;
  }

  const blocked =
    next.x === -state.direction.x && next.y === -state.direction.y;

  if (!blocked) {
    state.nextDirection = next;
  }
}

function setDirectionFromTouch(direction) {
  const map = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
  };

  handleDirectionChange(map[direction]);
}

function handleTouchStart(event) {
  const point = event.touches?.[0] || event.changedTouches?.[0] || event;
  state.touchStart = { x: point.clientX, y: point.clientY };
}

function handleTouchEnd(event) {
  if (!state.touchStart) {
    return;
  }

  const point = event.changedTouches?.[0] || event;
  const deltaX = point.clientX - state.touchStart.x;
  const deltaY = point.clientY - state.touchStart.y;
  const threshold = 24;

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    state.touchStart = null;
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    setDirectionFromTouch(deltaX > 0 ? "right" : "left");
  } else {
    setDirectionFromTouch(deltaY > 0 ? "down" : "up");
  }

  state.touchStart = null;
}

function registerSwipeControls(element) {
  element.addEventListener("touchstart", handleTouchStart, { passive: true });
  element.addEventListener("touchend", handleTouchEnd, { passive: true });
  element.addEventListener("pointerdown", handleTouchStart);
  element.addEventListener("pointerup", handleTouchEnd);
}

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    pauseGame();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    resetGame();
    return;
  }

  handleDirectionChange(event.key);
});

startButton.addEventListener("click", () => {
  if (!state.running) {
    startGame();
  }
});

restartButton.addEventListener("click", () => {
  resetGame();
});

touchDirectionButtons.forEach((button) => {
  const handler = () => {
    setDirectionFromTouch(button.dataset.direction);
  };

  if (window.PointerEvent) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handler();
    });
  } else {
    button.addEventListener("click", handler);
  }
});

if (touchPauseButton) {
  touchPauseButton.addEventListener("click", () => {
    if (!state.running) {
      startGame();
      return;
    }

    pauseGame();
  });
}

registerSwipeControls(canvas);
registerSwipeControls(canvasWrap);
registerSwipeControls(overlay);

resetGame();
