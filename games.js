'use strict';

// ===========================
// ZARES™ GAMES ENGINE v2030
// ===========================
// 5 fully playable browser game engines
// Pure vanilla JS + Canvas — zero dependencies
// ===========================

// ==============================================================
// GAME 1: ZARES™ VOIDRUNNER: CHROMATIC RIFT
// Canvas-based endless runner with chromatic aberration
// ==============================================================

function initVoidrunner(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { stop: () => {} };
  const ctx = canvas.getContext('2d');

  // --- State ---
  let W = canvas.width;
  let H = canvas.height;
  let rafId = null;
  let running = false;
  let gameOver = false;

  const state = {
    score: 0,
    speed: 3,
    frameCount: 0,
    player: { x: 0, y: 0, w: 18, h: 22, trail: [] },
    obstacles: [],
    stars: [],
    flashTimer: 0,
    spawnInterval: 70,
  };

  // --- Resize ---
  function resize() {
    W = canvas.width;
    H = canvas.height;
    state.player.x = W / 2;
    state.player.y = H * 0.72;
  }

  // --- Init stars ---
  function initStars() {
    state.stars = [];
    for (let i = 0; i < 120; i++) {
      state.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 1.5 + 0.5,
        brightness: Math.random(),
      });
    }
  }

  // --- Input ---
  const keys = {};
  function onKeyDown(e) {
    keys[e.code] = true;
    if (gameOver && (e.code === 'Space' || e.code === 'Enter')) restartGame();
  }
  function onKeyUp(e) { keys[e.code] = false; }

  // Touch support
  let touchStartX = 0;
  let touchDir = 0;
  function onTouchStart(e) { touchStartX = e.touches[0].clientX; touchDir = 0; }
  function onTouchMove(e) {
    const dx = e.touches[0].clientX - touchStartX;
    touchDir = dx > 10 ? 1 : dx < -10 ? -1 : 0;
    e.preventDefault();
  }
  function onTouchEnd() { touchDir = 0; }

  // --- Spawn obstacle ---
  function spawnObstacle() {
    const shapes = ['triangle', 'square', 'diamond'];
    const colors = ['#ff00cc', '#9900ff', '#ff4400', '#cc00ff', '#ff0066'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 14 + Math.random() * 22;
    state.obstacles.push({
      x: 40 + Math.random() * (W - 80),
      y: -size * 2,
      size,
      shape,
      color,
      speedY: state.speed * (0.7 + Math.random() * 0.6),
      speedX: (Math.random() - 0.5) * 1.4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.12,
    });
  }

  // --- Draw chromatic star ---
  function drawStars() {
    state.stars.forEach(s => {
      s.y += s.speed * (state.speed / 3);
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      const alpha = 0.4 + s.brightness * 0.6;
      // Chromatic aberration on stars
      ctx.fillStyle = `rgba(255,0,200,${alpha * 0.5})`;
      ctx.fillRect(s.x - 1.5, s.y, s.r, s.r);
      ctx.fillStyle = `rgba(0,255,255,${alpha * 0.5})`;
      ctx.fillRect(s.x + 1.5, s.y, s.r, s.r);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
  }

  // --- Draw player with trail ---
  function drawPlayer() {
    const p = state.player;
    // Trail
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 18) p.trail.shift();
    p.trail.forEach((pt, i) => {
      const alpha = (i / p.trail.length) * 0.45;
      const sz = p.w * 0.5 * (i / p.trail.length);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - sz);
      ctx.lineTo(pt.x - sz * 0.7, pt.y + sz);
      ctx.lineTo(pt.x + sz * 0.7, pt.y + sz);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Chromatic aberration on player
    const drawTriangle = (ox, oy, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(p.x + ox, p.y - p.h / 2 + oy);
      ctx.lineTo(p.x - p.w / 2 + ox, p.y + p.h / 2 + oy);
      ctx.lineTo(p.x + p.w / 2 + ox, p.y + p.h / 2 + oy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawTriangle(-2, 0, '#ff00cc', 0.6);
    drawTriangle(2, 0, '#ff4400', 0.4);
    drawTriangle(0, 0, '#00ffff', 1.0);
  }

  // --- Draw obstacle ---
  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    ctx.fillStyle = o.color;
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.92;

    if (o.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -o.size);
      ctx.lineTo(-o.size * 0.75, o.size * 0.75);
      ctx.lineTo(o.size * 0.75, o.size * 0.75);
      ctx.closePath();
      ctx.fill();
    } else if (o.shape === 'square') {
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
    } else {
      // diamond
      ctx.beginPath();
      ctx.moveTo(0, -o.size);
      ctx.lineTo(o.size * 0.7, 0);
      ctx.lineTo(0, o.size);
      ctx.lineTo(-o.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Collision check ---
  function checkCollision(p, o) {
    const dx = Math.abs(p.x - o.x);
    const dy = Math.abs(p.y - o.y);
    return dx < (p.w / 2 + o.size * 0.55) && dy < (p.h / 2 + o.size * 0.55);
  }

  // --- Draw HUD ---
  function drawHUD() {
    ctx.save();
    ctx.fillStyle = '#00ffff';
    ctx.font = `bold 15px "Courier New", monospace`;
    ctx.textAlign = 'right';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillText(`SCORE: ${Math.floor(state.score)}`, W - 14, 28);
    ctx.fillText(`SPEED: x${state.speed.toFixed(1)}`, W - 14, 48);
    ctx.restore();
  }

  // --- Draw game over ---
  function drawGameOver() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, W, H);

    // Glitch title
    ctx.font = `bold ${Math.min(W * 0.07, 38)}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff00cc';
    ctx.fillText('CHROMATIC COLLAPSE', W / 2 - 2, H / 2 - 44);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('CHROMATIC COLLAPSE', W / 2 + 2, H / 2 - 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CHROMATIC COLLAPSE', W / 2, H / 2 - 42);

    ctx.font = `bold ${Math.min(W * 0.045, 22)}px "Courier New", monospace`;
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;
    ctx.fillText(`DISTANCE: ${Math.floor(state.score)}`, W / 2, H / 2 + 4);
    ctx.fillStyle = 'rgba(0,255,255,0.55)';
    ctx.font = `${Math.min(W * 0.032, 16)}px "Courier New", monospace`;
    ctx.fillText('[ SPACE / ENTER / TAP ] TO RESTART', W / 2, H / 2 + 38);
    ctx.restore();
  }

  // --- Restart ---
  function restartGame() {
    state.score = 0;
    state.speed = 3;
    state.frameCount = 0;
    state.obstacles = [];
    state.player.trail = [];
    state.player.x = W / 2;
    state.player.y = H * 0.72;
    state.flashTimer = 0;
    state.spawnInterval = 70;
    gameOver = false;
    running = true;
  }

  // --- Game loop ---
  function update() {
    if (!running || gameOver) return;
    state.frameCount++;
    state.score += state.speed * 0.08;

    // Speed ramp
    if (state.frameCount % 400 === 0) {
      state.speed = Math.min(state.speed + 0.4, 11);
      state.spawnInterval = Math.max(28, state.spawnInterval - 4);
    }

    // Player movement
    const moveSpeed = 4.5 + state.speed * 0.3;
    if ((keys['ArrowLeft'] || keys['KeyA']) || touchDir === -1) {
      state.player.x = Math.max(state.player.w / 2 + 4, state.player.x - moveSpeed);
    }
    if ((keys['ArrowRight'] || keys['KeyD']) || touchDir === 1) {
      state.player.x = Math.min(W - state.player.w / 2 - 4, state.player.x + moveSpeed);
    }

    // Spawn
    if (state.frameCount % state.spawnInterval === 0) spawnObstacle();

    // Update obstacles
    state.obstacles = state.obstacles.filter(o => {
      o.y += o.speedY;
      o.x += o.speedX;
      o.rot += o.rotSpeed;
      // Bounce off walls
      if (o.x < o.size || o.x > W - o.size) o.speedX *= -1;
      return o.y < H + o.size * 2;
    });

    // Collision
    if (state.flashTimer <= 0) {
      for (const o of state.obstacles) {
        if (checkCollision(state.player, o)) {
          state.flashTimer = 18;
          gameOver = true;
          running = false;
          break;
        }
      }
    } else {
      state.flashTimer--;
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#07000f';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

    // Void gradient
    const grad = ctx.createRadialGradient(W / 2, H, 10, W / 2, H / 2, H * 0.9);
    grad.addColorStop(0, 'rgba(153,0,255,0.07)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawStars();

    state.obstacles.forEach(drawObstacle);
    drawPlayer();

    // Flash on hit
    if (state.flashTimer > 0) {
      ctx.fillStyle = `rgba(255,0,200,${state.flashTimer / 18 * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawHUD();

    if (gameOver) drawGameOver();
  }

  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // --- Start ---
  resize();
  initStars();
  restartGame();

  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // Tap to restart on canvas
  canvas.addEventListener('click', () => { if (gameOver) restartGame(); });

  loop();

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    },
  };
}


// ==============================================================
// GAME 2: ZARES™ NEURALSTRIKE: SYNAPTIC OVERLOAD
// DOM-based click/tap reflex game with node types + combos
// ==============================================================

function initNeuralstrike(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return { stop: () => {} };

  // Inject styles scoped to this game
  const styleId = 'neuralstrike-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #neuralstrike-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 420px;
        background: #07000f;
        overflow: hidden;
        font-family: 'Courier New', monospace;
        user-select: none;
        cursor: crosshair;
      }
      #neuralstrike-root .ns-hud {
        position: absolute;
        top: 0; left: 0; right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        z-index: 10;
        background: rgba(0,0,0,0.45);
        border-bottom: 1px solid rgba(0,255,255,0.15);
      }
      #neuralstrike-root .ns-stat {
        color: #00ffff;
        font-size: 13px;
        font-weight: bold;
        text-shadow: 0 0 8px #00ffff;
        letter-spacing: 1px;
      }
      #neuralstrike-root .ns-timer {
        font-size: 20px;
        color: #ff00cc;
        text-shadow: 0 0 12px #ff00cc;
      }
      #neuralstrike-root .ns-combo {
        position: absolute;
        top: 54px;
        left: 50%;
        transform: translateX(-50%);
        color: #ffff00;
        font-size: 14px;
        font-weight: bold;
        text-shadow: 0 0 12px #ffff00;
        pointer-events: none;
        z-index: 10;
        transition: opacity 0.3s;
      }
      .ns-node {
        position: absolute;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        font-size: 11px;
        transition: transform 0.1s;
        box-sizing: border-box;
        z-index: 5;
      }
      .ns-node:active { transform: scale(0.88) !important; }
      .ns-node.cyan {
        background: radial-gradient(circle, rgba(0,255,255,0.25), rgba(0,255,255,0.05));
        border: 2px solid #00ffff;
        color: #00ffff;
        box-shadow: 0 0 14px #00ffff, inset 0 0 10px rgba(0,255,255,0.12);
      }
      .ns-node.magenta {
        background: radial-gradient(circle, rgba(255,0,204,0.25), rgba(255,0,204,0.05));
        border: 2px solid #ff00cc;
        color: #ff00cc;
        box-shadow: 0 0 18px #ff00cc, inset 0 0 10px rgba(255,0,204,0.12);
      }
      .ns-node.red {
        background: radial-gradient(circle, rgba(255,50,0,0.28), rgba(255,0,0,0.06));
        border: 2px solid #ff3300;
        color: #ff3300;
        box-shadow: 0 0 16px #ff3300, inset 0 0 10px rgba(255,50,0,0.14);
      }
      @keyframes ns-pulse {
        0%, 100% { box-shadow: 0 0 14px currentColor, inset 0 0 10px rgba(255,255,255,0.05); transform: scale(1); }
        50% { box-shadow: 0 0 30px currentColor, inset 0 0 18px rgba(255,255,255,0.1); transform: scale(1.06); }
      }
      .ns-node.cyan { animation: ns-pulse 1.1s ease-in-out infinite; color: #00ffff; }
      .ns-node.magenta { animation: ns-pulse 0.9s ease-in-out infinite; color: #ff00cc; }
      .ns-node.red { animation: ns-pulse 0.75s ease-in-out infinite; color: #ff3300; }
      @keyframes ns-float-score {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-48px) scale(1.3); }
      }
      .ns-float { position: absolute; pointer-events: none; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px; animation: ns-float-score 0.8s ease forwards; z-index: 20; }
      #neuralstrike-root .ns-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.82);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 30;
        font-family: 'Courier New', monospace;
      }
      #neuralstrike-root .ns-overlay h2 {
        font-size: clamp(20px, 5vw, 36px);
        letter-spacing: 3px;
        margin-bottom: 16px;
      }
      #neuralstrike-root .ns-overlay .ns-final-score {
        color: #00ffff; font-size: clamp(15px, 3vw, 22px); margin-bottom: 6px;
        text-shadow: 0 0 10px #00ffff;
      }
      #neuralstrike-root .ns-overlay .ns-hi-score {
        color: #ff00cc; font-size: clamp(13px, 2.5vw, 18px); margin-bottom: 24px;
        text-shadow: 0 0 8px #ff00cc;
      }
      #neuralstrike-root .ns-overlay button {
        background: transparent; border: 2px solid #00ffff; color: #00ffff;
        font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold;
        padding: 10px 28px; cursor: pointer; letter-spacing: 2px;
        transition: all 0.2s;
      }
      #neuralstrike-root .ns-overlay button:hover {
        background: rgba(0,255,255,0.12); box-shadow: 0 0 18px #00ffff;
      }
      #neuralstrike-root .ns-scanline {
        position: absolute; inset: 0; pointer-events: none;
        background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 4px);
        z-index: 2;
      }
    `;
    document.head.appendChild(style);
  }

  // Build DOM
  container.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'neuralstrike-root';

  const hud = document.createElement('div');
  hud.className = 'ns-hud';
  hud.innerHTML = `
    <div class="ns-stat" id="ns-score-el">SCORE: 0</div>
    <div class="ns-stat ns-timer" id="ns-timer-el">60s</div>
    <div class="ns-stat" id="ns-hi-el">BEST: 0</div>
  `;
  const comboEl = document.createElement('div');
  comboEl.className = 'ns-combo';
  comboEl.id = 'ns-combo-el';
  comboEl.style.opacity = '0';

  const scanline = document.createElement('div');
  scanline.className = 'ns-scanline';

  root.appendChild(hud);
  root.appendChild(comboEl);
  root.appendChild(scanline);
  container.appendChild(root);

  // --- State ---
  let score = 0;
  let hiScore = parseInt(localStorage.getItem('ns_hi') || '0', 10);
  let timeLeft = 60;
  let combo = 0;
  let gameActive = false;
  let spawnRate = 1400;
  let nodeIdCounter = 0;
  const activeNodes = new Map();
  const timers = [];

  // Cached DOM refs
  const scoreEl = root.querySelector('#ns-score-el');
  const timerEl = root.querySelector('#ns-timer-el');
  const hiEl = root.querySelector('#ns-hi-el');
  hiEl.textContent = `BEST: ${hiScore}`;

  function addTimer(fn, delay) {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  }
  function addInterval(fn, delay) {
    const id = setInterval(fn, delay);
    timers.push(id);
    return id;
  }
  function clearAllTimers() {
    timers.forEach(id => { clearTimeout(id); clearInterval(id); });
    timers.length = 0;
  }

  function updateScoreEl() {
    scoreEl.textContent = `SCORE: ${score}`;
  }

  function spawnNode() {
    if (!gameActive) return;
    const W = root.clientWidth;
    const H = root.clientHeight;

    // Node type
    let type, pts, size;
    const r = Math.random();
    if (r < 0.55) { type = 'cyan'; pts = 10; size = 46 + Math.random() * 20; }
    else if (r < 0.85) { type = 'magenta'; pts = 25; size = 32 + Math.random() * 14; }
    else { type = 'red'; pts = -20; size = 40 + Math.random() * 18; }

    const id = nodeIdCounter++;
    const node = document.createElement('div');
    node.className = `ns-node ${type}`;
    node.style.width = size + 'px';
    node.style.height = size + 'px';
    node.style.left = (16 + Math.random() * (W - size - 32)) + 'px';
    node.style.top = (52 + Math.random() * (H - size - 68)) + 'px';

    // Shrinking timer bar via scale
    const lifespan = type === 'magenta' ? 1800 : type === 'red' ? 2200 : 2600;
    node.style.transition = `transform ${lifespan}ms linear, opacity 0.2s`;
    node.dataset.id = id;
    node.dataset.pts = pts;
    node.dataset.type = type;

    root.appendChild(node);
    activeNodes.set(id, node);

    // Auto expire
    const expireId = addTimer(() => {
      if (activeNodes.has(id)) {
        // Missed a good node
        if (type !== 'red') {
          combo = 0;
          updateCombo();
        }
        removeNode(id);
      }
    }, lifespan);

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(expireId);
      const pts = parseInt(node.dataset.pts, 10);
      const type = node.dataset.type;

      if (type === 'red') {
        score = Math.max(0, score + pts);
        combo = 0;
        showFloat(node, pts, '#ff3300');
        updateCombo();
      } else {
        score += pts;
        combo++;
        showFloat(node, `+${pts}`, type === 'magenta' ? '#ff00cc' : '#00ffff');
        if (combo >= 5 && combo % 5 === 0) {
          score += 50;
          showCascade();
        }
        updateCombo();
      }
      updateScoreEl();
      removeNode(id);
    });
  }

  function removeNode(id) {
    const node = activeNodes.get(id);
    if (node) {
      node.style.opacity = '0';
      addTimer(() => { node.remove(); }, 220);
      activeNodes.delete(id);
    }
  }

  function showFloat(node, text, color) {
    const rect = node.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'ns-float';
    el.textContent = text;
    el.style.color = color;
    el.style.textShadow = `0 0 10px ${color}`;
    el.style.left = (rect.left - rootRect.left + rect.width / 2 - 20) + 'px';
    el.style.top = (rect.top - rootRect.top) + 'px';
    root.appendChild(el);
    addTimer(() => el.remove(), 900);
  }

  function showCascade() {
    const el = document.createElement('div');
    el.className = 'ns-float';
    el.textContent = 'NEURAL CASCADE +50!';
    el.style.color = '#ffff00';
    el.style.textShadow = '0 0 16px #ffff00';
    el.style.fontSize = '18px';
    el.style.left = '50%';
    el.style.top = '120px';
    el.style.transform = 'translateX(-50%)';
    root.appendChild(el);
    addTimer(() => el.remove(), 1000);
  }

  function updateCombo() {
    const el = root.querySelector('#ns-combo-el');
    if (combo >= 2) {
      el.textContent = `COMBO x${combo}`;
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  }

  let spawnIntervalId;

  function startGame() {
    score = 0;
    timeLeft = 60;
    combo = 0;
    spawnRate = 1400;
    gameActive = true;
    activeNodes.forEach((_, id) => removeNode(id));
    updateScoreEl();
    updateCombo();
    timerEl.style.color = '#ff00cc';

    // Remove overlay if present
    const ov = root.querySelector('.ns-overlay');
    if (ov) ov.remove();

    // Countdown
    const countdownId = addInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 10) timerEl.style.color = '#ff4400';
      // Speed up spawn
      if (timeLeft % 12 === 0) spawnRate = Math.max(550, spawnRate - 120);
      if (timeLeft <= 0) {
        clearInterval(countdownId);
        endGame();
      }
    }, 1000);
    timers.push(countdownId);

    // Spawn loop (use recursive timeout for variable rate)
    function scheduleSpawn() {
      if (!gameActive) return;
      spawnIntervalId = addTimer(() => {
        spawnNode();
        scheduleSpawn();
      }, spawnRate + Math.random() * 400 - 200);
    }
    scheduleSpawn();
    // Spawn a couple immediately
    addTimer(spawnNode, 100);
    addTimer(spawnNode, 500);
  }

  function endGame() {
    gameActive = false;
    clearAllTimers();
    // Remove all nodes
    activeNodes.forEach((node) => node.remove());
    activeNodes.clear();

    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem('ns_hi', hiScore);
    }
    hiEl.textContent = `BEST: ${hiScore}`;

    // Show overlay
    const overlay = document.createElement('div');
    overlay.className = 'ns-overlay';
    overlay.innerHTML = `
      <h2 style="color:#ff00cc;text-shadow:0 0 16px #ff00cc;letter-spacing:4px;">SYNAPTIC OVERLOAD</h2>
      <div class="ns-final-score">SCORE: ${score}</div>
      <div class="ns-hi-score">BEST: ${hiScore}</div>
      <button id="ns-restart-btn">[ RECONNECT ]</button>
    `;
    root.appendChild(overlay);
    overlay.querySelector('#ns-restart-btn').addEventListener('click', startGame);
  }

  // Start overlay
  const startOverlay = document.createElement('div');
  startOverlay.className = 'ns-overlay';
  startOverlay.innerHTML = `
    <h2 style="color:#00ffff;text-shadow:0 0 16px #00ffff;letter-spacing:4px;">NEURALSTRIKE</h2>
    <div style="color:#9900ff;font-size:13px;margin-bottom:8px;text-shadow:0 0 8px #9900ff;">SYNAPTIC OVERLOAD</div>
    <div style="color:#f0f0ff;font-size:12px;margin-bottom:6px;text-align:center;max-width:280px;line-height:1.7;">
      Click CYAN nodes (+10) and MAGENTA nodes (+25).<br>
      AVOID RED nodes (-20).<br>
      5+ combo = NEURAL CASCADE +50!
    </div>
    <div style="color:rgba(0,255,255,0.45);font-size:11px;margin-bottom:22px;">60 SECOND CHALLENGE</div>
    <button id="ns-start-btn">[ INITIATE SEQUENCE ]</button>
  `;
  root.appendChild(startOverlay);
  startOverlay.querySelector('#ns-start-btn').addEventListener('click', startGame);

  return {
    stop() {
      gameActive = false;
      clearAllTimers();
      activeNodes.forEach((node) => node.remove());
      activeNodes.clear();
      container.innerHTML = '';
    },
  };
}


// ==============================================================
// GAME 3: ZARES™ GRAVITON BREACH: NULL PHYSICS
// Canvas-based gravity sandbox with ball, hazards, user blocks
// ==============================================================

function initGraviton(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { stop: () => {} };
  const ctx = canvas.getContext('2d');

  let W = canvas.width;
  let H = canvas.height;
  let rafId = null;

  // Inject control buttons above/below canvas via parent
  let controlsEl = document.getElementById('graviton-controls');
  if (!controlsEl) {
    controlsEl = document.createElement('div');
    controlsEl.id = 'graviton-controls';
    controlsEl.style.cssText = `
      display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
      padding: 10px 0 6px;
      font-family: 'Courier New', monospace;
    `;
    const btnDefs = [
      { id: 'grav-up', label: '[ UP ]', gx: 0, gy: -1 },
      { id: 'grav-down', label: '[ DOWN ]', gx: 0, gy: 1 },
      { id: 'grav-left', label: '[ LEFT ]', gx: -1, gy: 0 },
      { id: 'grav-right', label: '[ RIGHT ]', gx: 1, gy: 0 },
      { id: 'grav-zero', label: '[ ZERO-G ]', gx: 0, gy: 0, zero: true },
      { id: 'grav-chaos', label: '[ CHAOS ]', chaos: true },
    ];
    const btnStyle = `background:transparent;border:1px solid #00ffff;color:#00ffff;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;padding:6px 12px;cursor:pointer;letter-spacing:1px;transition:all 0.15s;`;
    btnDefs.forEach(def => {
      const btn = document.createElement('button');
      btn.id = def.id;
      btn.textContent = def.label;
      btn.style.cssText = btnStyle;
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(0,255,255,0.12)'; btn.style.boxShadow = '0 0 12px #00ffff'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.boxShadow = 'none'; });
      controlsEl.appendChild(btn);
    });
    canvas.parentNode.insertBefore(controlsEl, canvas);
  }

  // --- State ---
  const BALL_R = 11;
  const BOUNCE = 0.68;
  const FRICTION = 0.992;
  const GRAVITY_STRENGTH = 0.28;

  const ball = {
    x: 0, y: 0,
    vx: 1.2, vy: 0.5,
    trail: [],
    invincible: 0,
  };

  const gravDir = { x: 0, y: 1 }; // default: down
  let chaosMode = false;
  let chaosTimer = 0;

  const hazards = [];
  const blocks = [];
  let score = 0;
  let frameCount = 0;
  let glitchTimer = 0;
  let gameOver = false;
  let lives = 5;

  // Draw controls hint
  const hintEl = document.getElementById('graviton-hint');

  function resize() {
    W = canvas.width;
    H = canvas.height;
    ball.x = W / 2;
    ball.y = H / 2;
  }

  // --- Controls ---
  function setupButtons() {
    const map = {
      'grav-up': () => { chaosMode = false; gravDir.x = 0; gravDir.y = -1; },
      'grav-down': () => { chaosMode = false; gravDir.x = 0; gravDir.y = 1; },
      'grav-left': () => { chaosMode = false; gravDir.x = -1; gravDir.y = 0; },
      'grav-right': () => { chaosMode = false; gravDir.x = 1; gravDir.y = 0; },
      'grav-zero': () => { chaosMode = false; gravDir.x = 0; gravDir.y = 0; },
      'grav-chaos': () => { chaosMode = true; },
    };
    Object.entries(map).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', fn);
    });
  }

  // Click canvas to place a block
  function onCanvasClick(e) {
    if (gameOver) { restartGame(); return; }
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (W / rect.width);
    const cy = (e.clientY - rect.top) * (H / rect.height);
    if (blocks.length < 24) {
      blocks.push({ x: cx, y: cy, w: 28 + Math.random() * 22, h: 14 + Math.random() * 14, color: '#9900ff' });
    }
  }

  // --- Hazard spawn ---
  function spawnHazard() {
    hazards.push({
      x: 14 + Math.random() * (W - 28),
      y: 14 + Math.random() * (H - 28),
      r: 3 + Math.random() * 4,
      color: `hsl(${Math.random() * 60 + 300}, 100%, 60%)`,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  // --- Restart ---
  function restartGame() {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.vx = 1.2 + Math.random();
    ball.vy = 0.5;
    ball.trail = [];
    ball.invincible = 0;
    hazards.length = 0;
    blocks.length = 0;
    score = 0;
    frameCount = 0;
    lives = 5;
    gameOver = false;
    chaosMode = false;
    gravDir.x = 0; gravDir.y = 1;
  }

  // --- Update ---
  function update() {
    if (gameOver) return;
    frameCount++;
    score += 0.05;

    // Chaos mode
    if (chaosMode) {
      chaosTimer--;
      if (chaosTimer <= 0) {
        chaosTimer = 30;
        const angle = Math.random() * Math.PI * 2;
        gravDir.x = Math.cos(angle);
        gravDir.y = Math.sin(angle);
      }
    }

    // Apply gravity
    ball.vx += gravDir.x * GRAVITY_STRENGTH;
    ball.vy += gravDir.y * GRAVITY_STRENGTH;

    // Friction
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Clamp speed
    const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (spd > 14) { ball.vx = ball.vx / spd * 14; ball.vy = ball.vy / spd * 14; }

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounce
    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx *= -BOUNCE; }
    if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx *= -BOUNCE; }
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy *= -BOUNCE; }
    if (ball.y > H - BALL_R) { ball.y = H - BALL_R; ball.vy *= -BOUNCE; }

    // Block collision
    blocks.forEach(b => {
      const nearest = {
        x: Math.max(b.x - b.w / 2, Math.min(ball.x, b.x + b.w / 2)),
        y: Math.max(b.y - b.h / 2, Math.min(ball.y, b.y + b.h / 2)),
      };
      const dx = ball.x - nearest.x;
      const dy = ball.y - nearest.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_R) {
        // Push out
        const norm = dist === 0 ? { x: 0, y: -1 } : { x: dx / dist, y: dy / dist };
        ball.x = nearest.x + norm.x * (BALL_R + 1);
        ball.y = nearest.y + norm.y * (BALL_R + 1);
        const dot = ball.vx * norm.x + ball.vy * norm.y;
        ball.vx -= 2 * dot * norm.x * BOUNCE;
        ball.vy -= 2 * dot * norm.y * BOUNCE;
        score += 1;
      }
    });

    // Hazard collision
    if (ball.invincible <= 0) {
      hazards.forEach((h, idx) => {
        const dx = ball.x - h.x;
        const dy = ball.y - h.y;
        if (Math.sqrt(dx * dx + dy * dy) < BALL_R + h.r + 1) {
          lives--;
          ball.invincible = 90;
          glitchTimer = 24;
          // Remove hazard
          hazards.splice(idx, 1);
          if (lives <= 0) { gameOver = true; }
        }
      });
    } else {
      ball.invincible--;
    }

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 28) ball.trail.shift();

    // Spawn hazards occasionally
    if (frameCount % 180 === 0 && hazards.length < 20) spawnHazard();
    if (glitchTimer > 0) glitchTimer--;
  }

  // --- Draw ---
  function draw() {
    // Background grid
    ctx.fillStyle = '#06000e';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,255,0.055)';
    ctx.lineWidth = 1;
    const GRID = 32;
    for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glitch effect
    if (glitchTimer > 0) {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const gy = Math.random() * H;
        const gh = 4 + Math.random() * 12;
        const gx = (Math.random() - 0.5) * 18;
        const region = ctx.getImageData(0, gy, W, gh);
        ctx.putImageData(region, gx, gy);
      }
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ff0066';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Blocks
    blocks.forEach(b => {
      ctx.save();
      ctx.fillStyle = 'rgba(153,0,255,0.3)';
      ctx.strokeStyle = '#9900ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#9900ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Hazards
    hazards.forEach(h => {
      h.pulsePhase += 0.08;
      const pulse = 1 + Math.sin(h.pulsePhase) * 0.35;
      ctx.save();
      ctx.fillStyle = h.color;
      ctx.shadowColor = h.color;
      ctx.shadowBlur = 12 * pulse;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Ball trail
    ball.trail.forEach((pt, i) => {
      const alpha = (i / ball.trail.length) * 0.5;
      const r = BALL_R * 0.6 * (i / ball.trail.length);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Ball
    if (ball.invincible > 0 && Math.floor(ball.invincible / 6) % 2 === 0) {
      // Blink during invincibility
    } else {
      ctx.save();
      const ballGrad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, BALL_R);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.4, '#00ffff');
      ballGrad.addColorStop(1, '#0066ff');
      ctx.fillStyle = ballGrad;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Gravity arrow
    const arrowLen = 36;
    const arrowX = 36;
    const arrowY = H - 36;
    const angle = Math.atan2(gravDir.y, gravDir.x);
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.globalAlpha = gravDir.x === 0 && gravDir.y === 0 ? 0.2 : 0.85;
    ctx.beginPath();
    ctx.moveTo(-arrowLen / 2, 0);
    ctx.lineTo(arrowLen / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowLen / 2, 0);
    ctx.lineTo(arrowLen / 2 - 8, -6);
    ctx.moveTo(arrowLen / 2, 0);
    ctx.lineTo(arrowLen / 2 - 8, 6);
    ctx.stroke();
    ctx.restore();

    // HUD
    ctx.save();
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${Math.floor(score)}`, W - 12, 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff00cc';
    ctx.shadowColor = '#ff00cc';
    for (let i = 0; i < lives; i++) {
      ctx.fillText('▮', 12 + i * 18, 26);
    }
    if (chaosMode) {
      ctx.fillStyle = '#ff4400';
      ctx.shadowColor = '#ff4400';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('// CHAOS MODE //', W / 2, 22);
    }
    ctx.restore();

    // Hint
    ctx.save();
    ctx.fillStyle = 'rgba(0,255,255,0.28)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK CANVAS TO PLACE BLOCKS', W / 2, H - 8);
    ctx.restore();

    // Game over
    if (gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `bold ${Math.min(W * 0.065, 32)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff00cc';
      ctx.fillText('GRAVITON FAILURE', W / 2 - 2, H / 2 - 30);
      ctx.fillStyle = '#00ffff';
      ctx.fillText('GRAVITON FAILURE', W / 2 + 2, H / 2 - 28);
      ctx.fillStyle = '#fff';
      ctx.fillText('GRAVITON FAILURE', W / 2, H / 2 - 29);
      ctx.font = `bold ${Math.min(W * 0.04, 18)}px "Courier New", monospace`;
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillText(`SCORE: ${Math.floor(score)}`, W / 2, H / 2 + 10);
      ctx.fillStyle = 'rgba(0,255,255,0.5)';
      ctx.font = `${Math.min(W * 0.028, 13)}px "Courier New", monospace`;
      ctx.fillText('[ CLICK TO RESTART ]', W / 2, H / 2 + 40);
      ctx.restore();
    }
  }

  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  resize();
  setupButtons();
  restartGame();
  canvas.addEventListener('click', onCanvasClick);
  loop();

  return {
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onCanvasClick);
      if (controlsEl && controlsEl.parentNode) controlsEl.remove();
      chaosMode = false;
    },
    setGravity(dir) {
      chaosMode = false;
      if (chaosTimer) { clearInterval(chaosTimer); chaosTimer = 0; }
      switch (dir) {
        case 'up':    gravDir.x = 0;  gravDir.y = -1; break;
        case 'down':  gravDir.x = 0;  gravDir.y = 1;  break;
        case 'left':  gravDir.x = -1; gravDir.y = 0;  break;
        case 'right': gravDir.x = 1;  gravDir.y = 0;  break;
        case 'none':  gravDir.x = 0;  gravDir.y = 0;  break;
        case 'chaos':
          chaosMode = true;
          chaosTimer = setInterval(() => {
            const dirs = [
              { x: 0, y: 1 }, { x: 0, y: -1 },
              { x: 1, y: 0 }, { x: -1, y: 0 },
              { x: 0, y: 0 }
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            gravDir.x = d.x; gravDir.y = d.y;
          }, 500);
          break;
      }
    },
  };
}


// ==============================================================
// GAME 4: ZARES™ PIXELDRIFT: REALITY BREAKOUT
// Canvas-based breakout with reality glitch mechanics
// ==============================================================

function initPixeldrift(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { stop: () => {} };
  const ctx = canvas.getContext('2d');

  let W = canvas.width;
  let H = canvas.height;
  let rafId = null;

  // --- Layout constants (recalculated on resize) ---
  let COLS = 10;
  let ROWS = 6;
  let BRICK_W, BRICK_H, BRICK_PAD;
  let PADDLE_W = 90;
  const PADDLE_H = 12;
  const PADDLE_Y_OFFSET = 44;
  const BALL_R = 7;

  // --- State ---
  let paddle = { x: 0, y: 0, phase: false, phaseTimer: 0 };
  let balls = [];
  let bricks = [];
  let powerups = [];
  let score = 0;
  let lives = 3;
  let bricksBroken = 0;
  let glitchCount = 0;
  let glitchTimer = 0;
  let tearTimer = 0;
  let gameOver = false;
  let gameWon = false;
  let frameCount = 0;
  let launched = false;
  let mouseX = 0;

  function computeLayout() {
    W = canvas.width;
    H = canvas.height;
    BRICK_PAD = Math.max(3, Math.floor(W / 100));
    BRICK_W = Math.floor((W - BRICK_PAD * (COLS + 1)) / COLS);
    BRICK_H = Math.max(14, Math.floor(H / 18));
    paddle.y = H - PADDLE_Y_OFFSET;
    if (!paddle.x) paddle.x = W / 2;
  }

  // --- Build bricks ---
  function buildBricks() {
    bricks = [];
    const colors = { 1: '#00ffff', 2: '#ff00cc', 3: '#9900ff' };
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const hp = row < 2 ? 1 : row < 4 ? 2 : 3;
        bricks.push({
          x: BRICK_PAD + col * (BRICK_W + BRICK_PAD),
          y: 36 + row * (BRICK_H + BRICK_PAD),
          w: BRICK_W,
          h: BRICK_H,
          hp,
          maxHp: hp,
          color: colors[hp],
          alive: true,
          glitchOffX: 0,
          glitchOffY: 0,
        });
      }
    }
  }

  // --- Spawn ball ---
  function spawnBall(x, y, vx, vy) {
    balls.push({ x, y, vx, vy, r: BALL_R });
  }

  function resetBall() {
    balls = [];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    spawnBall(paddle.x, paddle.y - BALL_R - 2, Math.cos(angle) * 5, Math.sin(angle) * 5);
    launched = false;
  }

  // --- Powerup drop ---
  function dropPowerup(x, y) {
    const types = ['RIFT', 'PHASE', 'OVERLOAD'];
    const colors = { RIFT: '#00ffff', PHASE: '#ff00cc', OVERLOAD: '#ffff00' };
    if (Math.random() < 0.22) {
      const type = types[Math.floor(Math.random() * types.length)];
      powerups.push({ x, y, type, color: colors[type], vy: 2.2, w: 52, h: 18 });
    }
  }

  // --- Reality glitch ---
  function triggerGlitch() {
    glitchTimer = 90;
    tearTimer = 60;
    // Shift bricks randomly
    bricks.forEach(b => {
      if (b.alive) {
        b.glitchOffX = (Math.random() - 0.5) * W * 0.15;
        b.glitchOffY = (Math.random() - 0.5) * 30;
      }
    });
    // After 1s, settle bricks
    setTimeout(() => {
      bricks.forEach(b => { b.glitchOffX = 0; b.glitchOffY = 0; });
    }, 900);

    // Clone balls briefly
    const origBalls = [...balls];
    origBalls.forEach(b => {
      const ghost = { ...b, vx: b.vx * -0.9, vy: b.vy * 0.9, ghost: true, ghostLife: 90 };
      balls.push(ghost);
    });
  }

  // --- Apply powerup ---
  function applyPowerup(type) {
    if (type === 'RIFT') {
      const orig = balls[0];
      if (orig) {
        spawnBall(orig.x, orig.y, orig.vx * 1.1, -orig.vy);
        spawnBall(orig.x, orig.y, -orig.vx * 1.1, -orig.vy * 0.9);
      }
    } else if (type === 'PHASE') {
      paddle.phase = true;
      paddle.phaseTimer = 300;
    } else if (type === 'OVERLOAD') {
      // Destroy entire row of bricks the ball is near
      if (balls.length > 0) {
        const ballY = balls[0].y;
        let closestRow = null;
        let closestDist = Infinity;
        bricks.forEach(b => {
          if (b.alive) {
            const d = Math.abs(b.y + b.h / 2 - ballY);
            if (d < closestDist) { closestDist = d; closestRow = b.y; }
          }
        });
        bricks.forEach(b => {
          if (b.alive && b.y === closestRow) {
            b.alive = false;
            score += 50;
            bricksBroken++;
          }
        });
      }
    }
  }

  // --- Mouse control ---
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (W / rect.width);
  }
  function onTouchMoveP(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.touches[0].clientX - rect.left) * (W / rect.width);
    e.preventDefault();
  }
  function onLaunch() { if (!launched && !gameOver && !gameWon) launched = true; }

  function onKeyDownP(e) {
    if ((e.code === 'Space' || e.code === 'Enter') && !launched) onLaunch();
    if ((e.code === 'Space' || e.code === 'Enter') && (gameOver || gameWon)) restartGame();
  }

  // --- Restart ---
  function restartGame() {
    score = 0;
    lives = 3;
    bricksBroken = 0;
    glitchCount = 0;
    glitchTimer = 0;
    tearTimer = 0;
    gameOver = false;
    gameWon = false;
    powerups = [];
    buildBricks();
    computeLayout();
    paddle.x = W / 2;
    paddle.phase = false;
    paddle.phaseTimer = 0;
    resetBall();
    launched = false;
  }

  // --- Update ---
  function update() {
    if (gameOver || gameWon) return;
    frameCount++;

    // Move paddle
    const targetX = mouseX;
    paddle.x += (targetX - paddle.x) * 0.18;
    const halfPaddle = PADDLE_W / 2;
    if (!paddle.phase) {
      paddle.x = Math.max(halfPaddle, Math.min(W - halfPaddle, paddle.x));
    } else {
      // Phase mode: paddle can go through walls
      if (paddle.x < -halfPaddle) paddle.x = W + halfPaddle;
      if (paddle.x > W + halfPaddle) paddle.x = -halfPaddle;
      paddle.phaseTimer--;
      if (paddle.phaseTimer <= 0) paddle.phase = false;
    }

    // Update balls
    balls = balls.filter(ball => {
      if (ball.ghost) {
        ball.ghostLife--;
        if (ball.ghostLife <= 0) return false;
      }

      if (!launched) {
        ball.x = paddle.x;
        return true;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

      // Bottom = lost
      if (ball.y > H + ball.r * 4) return false;

      // Speed clamp (increases over time)
      const baseSpeed = 5 + Math.min(bricksBroken * 0.04, 4);
      const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (spd < baseSpeed) { ball.vx = ball.vx / spd * baseSpeed; ball.vy = ball.vy / spd * baseSpeed; }
      if (spd > baseSpeed * 2) { ball.vx = ball.vx / spd * baseSpeed * 2; ball.vy = ball.vy / spd * baseSpeed * 2; }

      // Paddle collision
      const ph = PADDLE_H;
      const pw = PADDLE_W;
      if (
        ball.y + ball.r > paddle.y - ph / 2 &&
        ball.y - ball.r < paddle.y + ph / 2 &&
        ball.x > paddle.x - pw / 2 - ball.r &&
        ball.x < paddle.x + pw / 2 + ball.r &&
        ball.vy > 0
      ) {
        ball.vy = -Math.abs(ball.vy);
        const offset = (ball.x - paddle.x) / (pw / 2);
        ball.vx = offset * 6;
        ball.y = paddle.y - ph / 2 - ball.r;
      }

      // Brick collision
      bricks.forEach(b => {
        if (!b.alive) return;
        const bx = b.x + b.glitchOffX;
        const by = b.y + b.glitchOffY;
        if (
          ball.x + ball.r > bx && ball.x - ball.r < bx + b.w &&
          ball.y + ball.r > by && ball.y - ball.r < by + b.h
        ) {
          // Which face?
          const fromLeft = ball.x - ball.vx < bx;
          const fromRight = ball.x - ball.vx > bx + b.w;
          const fromTop = ball.y - ball.vy < by;
          const fromBottom = ball.y - ball.vy > by + b.h;

          if (!ball.ghost) {
            b.hp--;
            if (b.hp <= 0) {
              b.alive = false;
              score += b.maxHp * 15;
              bricksBroken++;
              dropPowerup(bx + b.w / 2, by + b.h);
              // Every 10 bricks: reality glitch
              if (bricksBroken > 0 && bricksBroken % 10 === 0) {
                glitchCount++;
                triggerGlitch();
              }
            } else {
              const hpColors = { 1: '#00ffff', 2: '#ff00cc', 3: '#9900ff' };
              b.color = hpColors[b.hp] || '#00ffff';
            }
          }

          if (fromLeft || fromRight) ball.vx *= -1;
          else ball.vy *= -1;
        }
      });

      return true;
    });

    // Ball lost
    if (launched && balls.filter(b => !b.ghost).length === 0) {
      lives--;
      if (lives <= 0) { gameOver = true; return; }
      resetBall();
      paddle.x = W / 2;
    }

    // Win check
    if (bricks.every(b => !b.alive)) { gameWon = true; return; }

    // Powerups
    powerups = powerups.filter(p => {
      p.y += p.vy;
      // Check paddle
      if (
        p.y + p.h / 2 > paddle.y - PADDLE_H / 2 &&
        p.y - p.h / 2 < paddle.y + PADDLE_H / 2 &&
        p.x + p.w / 2 > paddle.x - PADDLE_W / 2 &&
        p.x - p.w / 2 < paddle.x + PADDLE_W / 2
      ) {
        applyPowerup(p.type);
        score += 30;
        return false;
      }
      return p.y < H + 20;
    });

    if (glitchTimer > 0) glitchTimer--;
    if (tearTimer > 0) tearTimer--;
  }

  // --- Draw ---
  function draw() {
    ctx.fillStyle = '#06000e';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    // Screen tear effect
    if (tearTimer > 0 && Math.random() > 0.4) {
      const ty = Math.random() * H;
      const th = 4 + Math.random() * 16;
      const td = (Math.random() - 0.5) * 24;
      try {
        const imgData = ctx.getImageData(0, ty, W, th);
        ctx.putImageData(imgData, td, ty);
      } catch (e) { /* ignore cross-origin issues */ }
    }

    // Bricks
    bricks.forEach(b => {
      if (!b.alive) return;
      const bx = b.x + b.glitchOffX;
      const by = b.y + b.glitchOffY;
      ctx.save();
      ctx.fillStyle = b.color + '33';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = glitchTimer > 0 ? 20 : 8;
      ctx.beginPath();
      ctx.roundRect(bx + 2, by + 2, b.w - 4, b.h - 4, 3);
      ctx.fill();
      ctx.stroke();
      // HP indicator
      if (b.maxHp > 1) {
        ctx.fillStyle = b.color;
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.hp, bx + b.w / 2, by + b.h / 2 + 3);
      }
      ctx.restore();
    });

    // Powerups
    powerups.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color + '22';
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.type, p.x, p.y + 3);
      ctx.restore();
    });

    // Paddle
    ctx.save();
    const paddleColor = paddle.phase ? '#ff00cc' : '#00ffff';
    ctx.fillStyle = paddleColor + '22';
    ctx.strokeStyle = paddleColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = paddleColor;
    ctx.shadowBlur = paddle.phase ? 24 : 14;
    ctx.globalAlpha = paddle.phase ? (0.5 + Math.sin(frameCount * 0.3) * 0.5) : 1;
    ctx.beginPath();
    ctx.roundRect(paddle.x - PADDLE_W / 2, paddle.y - PADDLE_H / 2, PADDLE_W, PADDLE_H, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Balls
    balls.forEach(ball => {
      ctx.save();
      if (ball.ghost) {
        ctx.globalAlpha = (ball.ghostLife / 90) * 0.4;
        ctx.fillStyle = '#ff00cc';
        ctx.shadowColor = '#ff00cc';
      } else {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
      }
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Launch hint
    if (!launched && !gameOver && !gameWon) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,255,255,0.5)';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ CLICK / SPACE TO LAUNCH ]', W / 2, H / 2 + 20);
      ctx.restore();
    }

    // HUD
    ctx.save();
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${score}`, W - 12, 24);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff00cc';
    ctx.shadowColor = '#ff00cc';
    for (let i = 0; i < lives; i++) ctx.fillText('♦', 12 + i * 18, 24);
    if (glitchTimer > 0) {
      ctx.fillStyle = '#ff4400';
      ctx.shadowColor = '#ff4400';
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillText('// REALITY GLITCH //', W / 2, 24);
    }
    ctx.restore();

    // Game over / win
    if (gameOver || gameWon) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `bold ${Math.min(W * 0.06, 30)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      const msg = gameWon ? 'REALITY RESTORED' : 'PIXEL CORRUPTION';
      const color = gameWon ? '#00ffff' : '#ff00cc';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillText(msg, W / 2, H / 2 - 30);
      ctx.font = `bold ${Math.min(W * 0.038, 18)}px "Courier New", monospace`;
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`SCORE: ${score}`, W / 2, H / 2 + 8);
      ctx.fillStyle = 'rgba(0,255,255,0.5)';
      ctx.font = `${Math.min(W * 0.028, 13)}px "Courier New", monospace`;
      ctx.fillText('[ CLICK / SPACE TO RESTART ]', W / 2, H / 2 + 38);
      ctx.restore();
    }
  }

  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // --- Init ---
  computeLayout();
  mouseX = W / 2;
  buildBricks();
  restartGame();

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchmove', onTouchMoveP, { passive: false });
  canvas.addEventListener('click', () => {
    if (!launched && !gameOver && !gameWon) { onLaunch(); return; }
    if (gameOver || gameWon) restartGame();
  });
  document.addEventListener('keydown', onKeyDownP);

  loop();

  return {
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMoveP);
      document.removeEventListener('keydown', onKeyDownP);
    },
  };
}


// ==============================================================
// GAME 5: ZARES™ MEMORYGLITCH: PATTERN CASCADE
// DOM-based Simon Says with glitch ghost tiles
// ==============================================================

function initMemoryglitch(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return { stop: () => {} };

  const styleId = 'memoryglitch-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #mg-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 440px;
        background: #06000e;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-family: 'Courier New', monospace;
        user-select: none;
        overflow: hidden;
      }
      #mg-root .mg-hud {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 18px 8px;
        background: rgba(0,0,0,0.4);
        border-bottom: 1px solid rgba(0,255,255,0.1);
        box-sizing: border-box;
        flex-shrink: 0;
      }
      #mg-root .mg-stat {
        color: #00ffff;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 0 8px #00ffff;
        letter-spacing: 1px;
      }
      #mg-root .mg-lives { color: #ff00cc; text-shadow: 0 0 8px #ff00cc; }
      #mg-root .mg-grid-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
      }
      #mg-root .mg-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        width: 100%;
        max-width: 340px;
      }
      .mg-tile {
        aspect-ratio: 1;
        background: rgba(0,255,255,0.04);
        border: 1px solid rgba(0,255,255,0.12);
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.1s, border-color 0.1s, box-shadow 0.1s, transform 0.08s;
        position: relative;
        overflow: hidden;
      }
      .mg-tile::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255,255,255,0.06), transparent 70%);
        pointer-events: none;
      }
      .mg-tile:hover:not(.mg-tile--disabled) {
        border-color: rgba(0,255,255,0.3);
        background: rgba(0,255,255,0.07);
      }
      .mg-tile:active:not(.mg-tile--disabled) { transform: scale(0.93); }
      .mg-tile--active {
        background: rgba(0,255,255,0.22) !important;
        border-color: #00ffff !important;
        box-shadow: 0 0 22px #00ffff, inset 0 0 14px rgba(0,255,255,0.15) !important;
        transform: scale(1.04);
      }
      .mg-tile--ghost {
        background: rgba(255,30,0,0.18) !important;
        border-color: #ff2200 !important;
        box-shadow: 0 0 18px #ff2200, inset 0 0 10px rgba(255,30,0,0.12) !important;
      }
      .mg-tile--wrong {
        background: rgba(255,0,50,0.25) !important;
        border-color: #ff0033 !important;
        box-shadow: 0 0 24px #ff0033 !important;
      }
      .mg-tile--correct {
        background: rgba(0,255,100,0.2) !important;
        border-color: #00ff66 !important;
        box-shadow: 0 0 20px #00ff66 !important;
      }
      .mg-tile--disabled { cursor: default; pointer-events: none; }
      @keyframes mg-cascade-glitch {
        0% { filter: hue-rotate(0deg) brightness(1); transform: translate(0,0); }
        15% { filter: hue-rotate(90deg) brightness(2); transform: translate(-3px, 2px); }
        30% { filter: hue-rotate(180deg) brightness(0.5); transform: translate(3px, -2px); }
        50% { filter: hue-rotate(270deg) brightness(1.5); transform: translate(-2px, 3px); }
        70% { filter: hue-rotate(90deg) brightness(0.8); transform: translate(2px, -1px); }
        100% { filter: hue-rotate(0deg) brightness(1); transform: translate(0,0); }
      }
      .mg-tile--glitch { animation: mg-cascade-glitch 0.5s ease forwards; }
      #mg-root .mg-status {
        font-size: 13px;
        color: rgba(0,255,255,0.6);
        letter-spacing: 2px;
        padding: 6px 0 10px;
        min-height: 26px;
        text-align: center;
      }
      #mg-root .mg-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.86);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 20;
      }
      #mg-root .mg-overlay h2 {
        font-size: clamp(18px, 5vw, 32px);
        letter-spacing: 3px;
        margin-bottom: 14px;
      }
      #mg-root .mg-overlay p {
        font-size: clamp(12px, 2.5vw, 15px);
        color: #00ffff;
        text-shadow: 0 0 8px #00ffff;
        margin-bottom: 6px;
      }
      #mg-root .mg-overlay button {
        margin-top: 18px;
        background: transparent;
        border: 2px solid #00ffff;
        color: #00ffff;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        font-weight: bold;
        padding: 9px 26px;
        cursor: pointer;
        letter-spacing: 2px;
        transition: all 0.2s;
      }
      #mg-root .mg-overlay button:hover {
        background: rgba(0,255,255,0.12);
        box-shadow: 0 0 16px #00ffff;
      }
      #mg-root .mg-scanline {
        position: absolute; inset: 0;
        background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 4px);
        pointer-events: none; z-index: 1;
      }
    `;
    document.head.appendChild(style);
  }

  // Build DOM
  container.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'mg-root';

  const hud = document.createElement('div');
  hud.className = 'mg-hud';
  hud.innerHTML = `
    <div class="mg-stat" id="mg-level">LEVEL: 1</div>
    <div class="mg-stat" id="mg-score">SCORE: 0</div>
    <div class="mg-stat mg-lives" id="mg-lives">♥ ♥ ♥</div>
  `;

  const statusEl = document.createElement('div');
  statusEl.className = 'mg-status';
  statusEl.id = 'mg-status';

  const gridWrap = document.createElement('div');
  gridWrap.className = 'mg-grid-wrap';
  const grid = document.createElement('div');
  grid.className = 'mg-grid';
  gridWrap.appendChild(grid);

  const scanline = document.createElement('div');
  scanline.className = 'mg-scanline';

  root.appendChild(hud);
  root.appendChild(statusEl);
  root.appendChild(gridWrap);
  root.appendChild(scanline);
  container.appendChild(root);

  // --- State ---
  const TILE_COUNT = 16;
  let tiles = [];
  let sequence = [];
  let playerInput = [];
  let level = 1;
  let score = 0;
  let lives = 3;
  let phase = 'idle'; // idle, showing, input, gameover
  let timers = [];

  function addTimer(fn, delay) {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  }
  function clearAllTimers() {
    timers.forEach(id => clearTimeout(id));
    timers.length = 0;
  }

  // Build tiles
  function buildGrid() {
    grid.innerHTML = '';
    tiles = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = document.createElement('div');
      tile.className = 'mg-tile mg-tile--disabled';
      tile.dataset.idx = i;
      tile.addEventListener('click', () => onTileClick(i));
      grid.appendChild(tile);
      tiles.push(tile);
    }
  }

  function setStatus(msg, color) {
    const el = root.querySelector('#mg-status');
    el.textContent = msg;
    el.style.color = color || 'rgba(0,255,255,0.6)';
  }

  function updateHUD() {
    root.querySelector('#mg-level').textContent = `LEVEL: ${level}`;
    root.querySelector('#mg-score').textContent = `SCORE: ${score}`;
    const livesStr = Array.from({ length: lives }, () => '♥').join(' ') || '—';
    root.querySelector('#mg-lives').textContent = livesStr;
  }

  function activateTile(idx, cls, duration) {
    tiles[idx].classList.add(cls);
    return new Promise(res => {
      addTimer(() => {
        tiles[idx].classList.remove(cls);
        res();
      }, duration);
    });
  }

  function sleep(ms) {
    return new Promise(res => addTimer(res, ms));
  }

  // --- Generate sequence ---
  function generateSequence() {
    sequence = [];
    const seqLen = 3 + Math.floor(level * 0.8);
    const pool = Array.from({ length: TILE_COUNT }, (_, i) => i);
    // Shuffle and pick seqLen
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    sequence = pool.slice(0, seqLen);
  }

  // --- Show sequence ---
  async function showSequence() {
    phase = 'showing';
    setStatus('MEMORIZE SEQUENCE...', '#ff00cc');
    tiles.forEach(t => t.classList.add('mg-tile--disabled'));

    // Ghost tiles (fakes) that briefly flash — increase with level
    const ghostCount = Math.min(Math.floor(level / 2), 3);
    const seqSet = new Set(sequence);
    const ghostPool = Array.from({ length: TILE_COUNT }, (_, i) => i).filter(i => !seqSet.has(i));
    for (let i = ghostPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ghostPool[i], ghostPool[j]] = [ghostPool[j], ghostPool[i]];
    }
    const ghosts = ghostPool.slice(0, ghostCount);

    const speed = Math.max(280, 620 - level * 28);

    for (let i = 0; i < sequence.length; i++) {
      await sleep(speed * 0.25);
      tiles[sequence[i]].classList.add('mg-tile--active');
      await sleep(speed);
      tiles[sequence[i]].classList.remove('mg-tile--active');
    }

    // Flash ghosts after sequence
    if (ghosts.length > 0) {
      await sleep(120);
      setStatus('IGNORE THE INTERFERENCE...', '#ff4400');
      for (const g of ghosts) {
        tiles[g].classList.add('mg-tile--ghost');
      }
      await sleep(Math.max(160, 420 - level * 20));
      ghosts.forEach(g => tiles[g].classList.remove('mg-tile--ghost'));
    }

    await sleep(180);
    startInput();
  }

  // --- Input phase ---
  function startInput() {
    phase = 'input';
    playerInput = [];
    setStatus('REPEAT THE SEQUENCE', '#00ffff');
    tiles.forEach(t => t.classList.remove('mg-tile--disabled'));
  }

  // --- Tile click ---
  function onTileClick(idx) {
    if (phase !== 'input') return;

    const expected = sequence[playerInput.length];
    playerInput.push(idx);

    if (idx === expected) {
      // Correct
      tiles[idx].classList.add('mg-tile--correct');
      addTimer(() => tiles[idx].classList.remove('mg-tile--correct'), 300);

      if (playerInput.length === sequence.length) {
        // Level complete
        score += level * 100 + sequence.length * 20;
        updateHUD();
        setStatus('SEQUENCE CONFIRMED!', '#00ff66');
        tiles.forEach(t => t.classList.add('mg-tile--disabled'));
        addTimer(() => {
          level++;
          updateHUD();
          startLevel();
        }, 900);
      }
    } else {
      // Wrong
      lives--;
      updateHUD();
      tiles.forEach(t => {
        t.classList.add('mg-tile--disabled');
        t.classList.add('mg-tile--wrong');
      });
      setStatus('WRONG TILE — CORRUPTING...', '#ff0033');

      // Cascade glitch animation
      addTimer(() => {
        tiles.forEach((t, i) => {
          addTimer(() => {
            t.classList.remove('mg-tile--wrong');
            t.classList.add('mg-tile--glitch');
            addTimer(() => t.classList.remove('mg-tile--glitch'), 550);
          }, i * 30);
        });
      }, 120);

      addTimer(() => {
        if (lives <= 0) {
          endGame();
        } else {
          setStatus('RETRYING...', '#ff00cc');
          addTimer(() => showSequence(), 500);
        }
      }, 900);
    }
  }

  function startLevel() {
    generateSequence();
    addTimer(() => showSequence(), 400);
  }

  function endGame() {
    phase = 'gameover';
    const overlay = document.createElement('div');
    overlay.className = 'mg-overlay';
    overlay.innerHTML = `
      <h2 style="color:#ff00cc;text-shadow:0 0 18px #ff00cc;">MEMORY CORRUPTED</h2>
      <p>LEVEL REACHED: ${level}</p>
      <p>FINAL SCORE: ${score}</p>
      <button id="mg-restart">[ REINITIALIZE ]</button>
    `;
    root.appendChild(overlay);
    overlay.querySelector('#mg-restart').addEventListener('click', () => {
      overlay.remove();
      startNewGame();
    });
  }

  function startNewGame() {
    clearAllTimers();
    level = 1;
    score = 0;
    lives = 3;
    phase = 'idle';
    tiles.forEach(t => {
      t.className = 'mg-tile mg-tile--disabled';
    });
    updateHUD();
    const ov = root.querySelector('.mg-overlay');
    if (ov) ov.remove();
    addTimer(() => startLevel(), 600);
  }

  // Start overlay
  const startOverlay = document.createElement('div');
  startOverlay.className = 'mg-overlay';
  startOverlay.innerHTML = `
    <h2 style="color:#00ffff;text-shadow:0 0 18px #00ffff;letter-spacing:4px;">MEMORYGLITCH</h2>
    <div style="color:#9900ff;font-size:12px;margin-bottom:10px;text-shadow:0 0 8px #9900ff;">PATTERN CASCADE</div>
    <p style="text-align:center;max-width:260px;line-height:1.8;font-size:12px;">
      Watch the cyan tile sequence.<br>
      Beware RED ghost tiles — they are FAKE.<br>
      Repeat the REAL sequence. 3 lives.
    </p>
    <button id="mg-start">[ BEGIN SEQUENCE ]</button>
  `;
  root.appendChild(startOverlay);

  buildGrid();
  updateHUD();

  startOverlay.querySelector('#mg-start').addEventListener('click', () => {
    startOverlay.remove();
    startNewGame();
  });

  return {
    stop() {
      clearAllTimers();
      container.innerHTML = '';
    },
  };
}
