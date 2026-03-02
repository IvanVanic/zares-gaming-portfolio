/**
 * ZARES GAMING PORTFOLIO — main.js
 * Agent: AGENT-JS
 * Scope: All interactive effects, animations, and visual systems for
 *        index.html and gaming-ideas.html
 *
 * Systems:
 *  1. Loading Screen
 *  2. Neural Network Background (Canvas)
 *  3. Custom Cursor
 *  4. Hero Parallax
 *  5. 3D Tilt Effect (Holo Cards)
 *  6. Scroll Animations
 *  7. Glitch Text Randomizer
 *  8. Section Reveal Animations
 *  9. Counter Animation
 * 10. Sound Visualizer (Fake/Visual Only)
 * 11. Page Transition
 * 12. Mobile Menu
 */

'use strict';

// ─── UTILITIES ────────────────────────────────────────────────────────────────

/**
 * Linear interpolation helper.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Factor (0..1)
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * EaseOutExpo easing function.
 * @param {number} t - Progress (0..1)
 * @returns {number}
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Inject a <style> block into the document <head>.
 * @param {string} css - CSS rules as a string
 */
function injectStyles(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// ─── SYSTEM 1: LOADING SCREEN ─────────────────────────────────────────────────

/**
 * Loading Screen System
 *
 * - Animates loading text with glitch distortions
 * - Displays a fake progress bar filling 0→100% with accelerating speed
 * - After 2000ms, adds class "loaded" to #loading-screen (triggers CSS fade)
 * - Removes the element from the DOM after the transition ends
 */
function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  // ── Progress bar element ──────────────────────────────────────────────────
  const bar = screen.querySelector('.loading-bar-fill') || (() => {
    const barWrap = document.createElement('div');
    barWrap.style.cssText = [
      'position:absolute',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:320px',
      'height:3px',
      'background:rgba(0,255,255,0.15)',
      'border:1px solid rgba(0,255,255,0.3)',
      'overflow:hidden',
    ].join(';');

    const fill = document.createElement('div');
    fill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:linear-gradient(90deg,#00ffff,#ff00cc)',
      'box-shadow:0 0 12px #00ffff',
      'transition:width 0.05s linear',
    ].join(';');
    barWrap.appendChild(fill);
    screen.appendChild(barWrap);
    return fill;
  })();

  // ── Loading text element ──────────────────────────────────────────────────
  const textEl = screen.querySelector('.loading-text') || (() => {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:absolute',
      'bottom:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'letter-spacing:4px',
      'color:#00ffff',
      'text-transform:uppercase',
      'white-space:nowrap',
    ].join(';');
    el.textContent = 'INITIALIZING ZARES PROTOCOL...';
    screen.appendChild(el);
    return el;
  })();

  const originalText = 'INITIALIZING ZARES PROTOCOL...';
  const GLITCH_CHARS = '!@#$%^&*<>?/|0123456789ABCDEF';

  let progress = 0;
  let progressRafId = null;

  // ── Accelerating progress bar ──────────────────────────────────────────────
  function animateProgress() {
    const speed = 0.018 + (progress / 100) * 0.09; // accelerates as it fills
    progress = Math.min(100, progress + speed);
    bar.style.width = progress + '%';
    if (progress < 100) {
      progressRafId = requestAnimationFrame(animateProgress);
    }
  }
  progressRafId = requestAnimationFrame(animateProgress);

  // ── Glitch text loop ───────────────────────────────────────────────────────
  let glitchIntervalId = null;

  function scrambleText(duration) {
    const end = performance.now() + duration;

    function tick() {
      if (performance.now() >= end) {
        textEl.textContent = originalText;
        textEl.style.textShadow = '';
        return;
      }

      const scrambled = originalText.split('').map((ch) => {
        if (ch === ' ' || ch === '.') return ch;
        return Math.random() < 0.35
          ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          : ch;
      }).join('');

      textEl.textContent = scrambled;

      // Occasional colour flash
      textEl.style.textShadow = Math.random() < 0.4
        ? '0 0 8px #ff00cc, 2px 0 0 #ff00cc'
        : '0 0 6px #00ffff';

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Trigger glitch every 400ms during load
  glitchIntervalId = setInterval(() => scrambleText(200), 400);

  // ── Dismiss loading screen after 2000ms ────────────────────────────────────
  setTimeout(() => {
    clearInterval(glitchIntervalId);
    cancelAnimationFrame(progressRafId);
    bar.style.width = '100%';
    textEl.textContent = originalText;
    textEl.style.textShadow = '0 0 6px #00ffff';

    // Small delay so the bar visually hits 100% before fading
    setTimeout(() => {
      screen.classList.add('loaded');

      screen.addEventListener('transitionend', () => {
        if (screen.parentNode) {
          screen.parentNode.removeChild(screen);
        }
      }, { once: true });

      // Safety fallback in case transitionend never fires
      setTimeout(() => {
        if (screen.parentNode) {
          screen.parentNode.removeChild(screen);
        }
      }, 1200);
    }, 120);
  }, 2000);
}

// ─── SYSTEM 2: NEURAL NETWORK BACKGROUND (CANVAS) ─────────────────────────────

/**
 * Neural Network Background
 *
 * - Full-screen canvas, fixed, z-index 0, pointer-events none
 * - ~80 drifting nodes connected when distance < 180px
 * - Nodes pulse (radius 2–4px), colour-cycle cyan/magenta/purple
 * - Mouse proximity: nodes within 200px pulled toward cursor, glow brighter
 */
function initNeuralNet() {
  const canvas = document.createElement('canvas');
  canvas.id = 'neural-canvas';
  canvas.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'z-index:0',
    'pointer-events:none',
  ].join(';');
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  let mouseX = -9999;
  let mouseY = -9999;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // ── Node factory ──────────────────────────────────────────────────────────
  const NODE_COUNT = 80;
  const CONNECT_DIST = 180;
  const MOUSE_DIST = 200;

  /**
   * @typedef {Object} NeuralNode
   * @property {number} x
   * @property {number} y
   * @property {number} vx
   * @property {number} vy
   * @property {number} baseRadius
   * @property {number} phaseOffset - for pulsing
   * @property {number} hueOffset   - for colour cycling
   */

  /** @type {NeuralNode[]} */
  const nodes = [];

  function makeNode() {
    // Weighted toward edges: occasionally place near boundary
    const edgeBias = Math.random() < 0.25;
    const x = edgeBias
      ? (Math.random() < 0.5 ? Math.random() * 120 : W - Math.random() * 120)
      : Math.random() * W;
    const y = edgeBias
      ? (Math.random() < 0.5 ? Math.random() * 120 : H - Math.random() * 120)
      : Math.random() * H;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      baseRadius: 2 + Math.random() * 1.5,
      phaseOffset: Math.random() * Math.PI * 2,
      hueOffset: Math.random() * 360,
    };
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(makeNode());
  }

  let frame = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    const time = frame * 0.012;

    // ── Update & draw connections ─────────────────────────────────────────
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0,255,255,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // ── Update & draw nodes ───────────────────────────────────────────────
    for (const node of nodes) {
      // Mouse attraction
      const mdx = mouseX - node.x;
      const mdy = mouseY - node.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDist < MOUSE_DIST && mDist > 0) {
        const force = (1 - mDist / MOUSE_DIST) * 0.06;
        node.vx += (mdx / mDist) * force;
        node.vy += (mdy / mDist) * force;
      }

      // Velocity damping
      node.vx *= 0.98;
      node.vy *= 0.98;

      // Speed cap
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > 1.2) {
        node.vx = (node.vx / speed) * 1.2;
        node.vy = (node.vy / speed) * 1.2;
      }

      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0) { node.x = 0; node.vx *= -1; }
      if (node.x > W) { node.x = W; node.vx *= -1; }
      if (node.y < 0) { node.y = 0; node.vy *= -1; }
      if (node.y > H) { node.y = H; node.vy *= -1; }

      // Pulsing radius
      const pulse = Math.sin(time * 2 + node.phaseOffset);
      const r = node.baseRadius + pulse * 1.2;

      // Colour cycling: cyan (180) → magenta (300) → purple (270)
      const hue = (node.hueOffset + time * 20) % 360;
      const glowMult = mDist < MOUSE_DIST ? 1 + (1 - mDist / MOUSE_DIST) * 2 : 1;

      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},100%,60%,${(0.04 * glowMult).toFixed(3)})`;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},100%,75%,${(0.85 * glowMult).toFixed(3)})`;
      ctx.fill();
    }

    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);
}

// ─── SYSTEM 3: CUSTOM CURSOR ──────────────────────────────────────────────────

/**
 * Custom Cursor System
 *
 * - cursor-dot  : 8px cyan dot, follows mouse instantly
 * - cursor-ring : 40px outline ring, lerps toward mouse at 0.12 speed
 * - Mousedown: dot scales up, ring squishes
 * - Hover over links/buttons: ring expands to 60px, turns magenta
 * - Particle trail: every 30ms while moving, spawns a tiny fading dot
 */
function initCursor() {
  // Only on non-touch/desktop devices
  if (window.matchMedia('(hover: none)').matches) return;

  injectStyles(`
    body { cursor: none; }
    a, button, [role="button"], input[type="submit"], .holo-card { cursor: none; }

    #cursor-dot {
      position: fixed;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00ffff;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: transform 0.08s ease, background 0.15s ease;
      box-shadow: 0 0 6px #00ffff, 0 0 12px rgba(0,255,255,0.5);
      will-change: left, top;
    }

    #cursor-ring {
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #00ffff;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      opacity: 0.7;
      will-change: left, top;
      transition: width 0.2s ease, height 0.2s ease,
                  border-color 0.2s ease, opacity 0.2s ease;
    }

    #cursor-ring.is-hovered {
      width: 60px;
      height: 60px;
      border-color: #ff00cc;
      box-shadow: 0 0 10px rgba(255,0,204,0.4);
      opacity: 0.9;
    }

    #cursor-dot.is-pressed {
      transform: translate(-50%, -50%) scale(1.8);
      background: #ff00cc;
    }

    #cursor-ring.is-pressed {
      transform: translate(-50%, -50%) scaleX(0.75) scaleY(1.25);
    }

    .cursor-particle {
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9997;
      transform: translate(-50%, -50%);
    }
  `);

  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  document.body.appendChild(dot);

  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.appendChild(ring);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let isMoving = false;
  let lastMoveTime = 0;

  // Particle colours cycling
  const PARTICLE_COLORS = ['#00ffff', '#ff00cc', '#9900ff'];
  let particleColorIdx = 0;
  let lastParticleTime = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    lastMoveTime = performance.now();

    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';

    // Particle trail throttle: 30ms
    const now = performance.now();
    if (now - lastParticleTime >= 30) {
      lastParticleTime = now;
      spawnParticle(mouseX, mouseY);
    }
  }, { passive: true });

  document.addEventListener('mousedown', () => {
    dot.classList.add('is-pressed');
    ring.classList.add('is-pressed');
  });

  document.addEventListener('mouseup', () => {
    dot.classList.remove('is-pressed');
    ring.classList.remove('is-pressed');
  });

  // Hover detection for interactive elements
  const hoverTargets = 'a, button, [role="button"], input[type="submit"], .holo-card, .nav-link, .cta-btn, .social-link';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('is-hovered');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('is-hovered');
    }
  }, { passive: true });

  // Particle spawner
  function spawnParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'cursor-particle';
    const color = PARTICLE_COLORS[particleColorIdx % PARTICLE_COLORS.length];
    particleColorIdx++;

    const size = 3;
    p.style.cssText = [
      `left:${x}px`,
      `top:${y}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${color}`,
      `opacity:0.8`,
      `box-shadow:0 0 4px ${color}`,
      `transition:opacity 0.6s ease, transform 0.6s ease`,
    ].join(';');

    document.body.appendChild(p);

    // Trigger fade + drift on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.style.opacity = '0';
        const drift = (Math.random() - 0.5) * 16;
        p.style.transform = `translate(calc(-50% + ${drift}px), calc(-50% - 12px))`;
      });
    });

    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 650);
  }

  // Ring lerp loop
  function ringLoop() {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(ringLoop);
  }
  requestAnimationFrame(ringLoop);
}

// ─── SYSTEM 4: HERO PARALLAX ──────────────────────────────────────────────────

/**
 * Hero Parallax
 *
 * - .shape elements inside #hero-shapes move based on mousemove
 * - Each shape's data-speed attribute controls depth of movement
 * - Lerped for smooth motion; returns to center on mouse leave
 */
function initHeroParallax() {
  const hero = document.getElementById('hero') || document.querySelector('.hero-section');
  if (!hero) return;

  const shapes = hero.querySelectorAll('.shape');
  if (!shapes.length) return;

  /** @type {Array<{el: HTMLElement, speed: number, x: number, y: number, tx: number, ty: number}>} */
  const shapeData = Array.from(shapes).map((el) => ({
    el,
    speed: parseFloat(el.dataset.speed) || 0.05,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
  }));

  let rafId = null;
  let isHovering = false;

  function tick() {
    let stillMoving = false;

    for (const s of shapeData) {
      s.x = lerp(s.x, s.tx, 0.08);
      s.y = lerp(s.y, s.ty, 0.08);

      s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;

      if (Math.abs(s.x - s.tx) > 0.05 || Math.abs(s.y - s.ty) > 0.05) {
        stillMoving = true;
      }
    }

    if (stillMoving || isHovering) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  hero.addEventListener('mousemove', (e) => {
    isHovering = true;
    const rect = hero.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;

    for (const s of shapeData) {
      s.tx = mx * s.speed;
      s.ty = my * s.speed;
    }

    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    isHovering = false;
    for (const s of shapeData) {
      s.tx = 0;
      s.ty = 0;
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: true });
}

// ─── SYSTEM 5: 3D TILT EFFECT ─────────────────────────────────────────────────

/**
 * 3D Tilt Effect for .holo-card elements
 *
 * - On mousemove: perspective(1000px) rotateX/rotateY up to ±15°
 * - CSS custom properties --mx, --my control shimmer overlay position
 * - On mouseleave: lerp back to flat
 */
function initTiltEffect() {
  const cards = document.querySelectorAll('.holo-card');
  if (!cards.length) return;

  const MAX_TILT = 15;

  cards.forEach((card) => {
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let mx = 50;
    let my = 50;
    let targetMx = 50;
    let targetMy = 50;
    let rafId = null;
    let isHover = false;

    function animate() {
      rotX = lerp(rotX, targetRotX, 0.1);
      rotY = lerp(rotY, targetRotY, 0.1);
      mx = lerp(mx, targetMx, 0.1);
      my = lerp(my, targetMy, 0.1);

      card.style.transform =
        `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
      card.style.setProperty('--mx', mx.toFixed(1) + '%');
      card.style.setProperty('--my', my.toFixed(1) + '%');

      const stillMoving =
        Math.abs(rotX - targetRotX) > 0.01 ||
        Math.abs(rotY - targetRotY) > 0.01;

      if (stillMoving || isHover) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
        card.style.transform = '';
      }
    }

    card.addEventListener('mousemove', (e) => {
      isHover = true;
      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const pcX = relX / rect.width;
      const pcY = relY / rect.height;

      targetRotY = (pcX - 0.5) * MAX_TILT * 2;
      targetRotX = -(pcY - 0.5) * MAX_TILT * 2;
      targetMx = pcX * 100;
      targetMy = pcY * 100;

      if (!rafId) rafId = requestAnimationFrame(animate);
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      isHover = false;
      targetRotX = 0;
      targetRotY = 0;
      targetMx = 50;
      targetMy = 50;
      if (!rafId) rafId = requestAnimationFrame(animate);
    }, { passive: true });
  });
}

// ─── SYSTEM 6: SCROLL ANIMATIONS ──────────────────────────────────────────────

/**
 * Scroll Animations
 *
 * - IntersectionObserver for .quantum-dissolve: adds "is-visible" at 20% threshold
 * - Nav #nav gets class "scrolled" after scrolling past 80px
 * - Parallax on elements with .parallax-bg: subtle vertical drift
 */
function initScrollAnimations() {
  // ── Quantum dissolve elements ─────────────────────────────────────────────
  const dissolveEls = document.querySelectorAll('.quantum-dissolve');

  if (dissolveEls.length) {
    const dissolveObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            dissolveObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    dissolveEls.forEach((el) => dissolveObserver.observe(el));
  }

  // ── Nav scroll class ──────────────────────────────────────────────────────
  const nav = document.getElementById('nav');

  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── Subtle parallax backgrounds ───────────────────────────────────────────
  const parallaxEls = document.querySelectorAll('.parallax-bg');

  if (parallaxEls.length) {
    function updateParallax() {
      const scrollY = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.3;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }
    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }
}

// ─── SYSTEM 7: GLITCH TEXT RANDOMIZER ─────────────────────────────────────────

/**
 * Glitch Text Randomizer
 *
 * - All .glitch elements randomly scramble every 3–8 seconds
 * - Scramble duration: ~400ms, returns to original text
 * - Hover triggers immediate 200ms scramble
 */
function initGlitchText() {
  const glitchEls = document.querySelectorAll('.glitch');
  if (!glitchEls.length) return;

  const SCRAMBLE_CHARS = '!@#$%^&*<>?/|0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop';

  /**
   * Scramble the text content of an element over a given duration.
   * @param {HTMLElement} el
   * @param {number} duration - milliseconds
   */
  function scramble(el, duration) {
    if (el._isGlitching) return;
    el._isGlitching = true;

    const original = el.dataset.originalText || el.textContent;
    if (!el.dataset.originalText) el.dataset.originalText = original;

    const end = performance.now() + duration;

    function tick() {
      if (performance.now() >= end) {
        el.textContent = original;
        el.style.textShadow = '';
        el._isGlitching = false;
        return;
      }

      // Preserve spaces and punctuation mostly
      const scrambled = original.split('').map((ch) => {
        if (ch === ' ') return ch;
        if (Math.random() < 0.5) {
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        return ch;
      }).join('');

      el.textContent = scrambled;

      // Glitch visual artefact
      const offsetX = (Math.random() - 0.5) * 4;
      el.style.textShadow = [
        `${offsetX}px 0 #ff00cc`,
        `-${offsetX}px 0 #00ffff`,
      ].join(', ');

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /**
   * Schedule random glitch on element with delay between 3–8 seconds.
   * @param {HTMLElement} el
   */
  function scheduleGlitch(el) {
    const delay = 3000 + Math.random() * 5000;
    setTimeout(() => {
      scramble(el, 400);
      scheduleGlitch(el);
    }, delay);
  }

  glitchEls.forEach((el) => {
    // Store original text
    el.dataset.originalText = el.textContent;

    scheduleGlitch(el);

    el.addEventListener('mouseenter', () => {
      scramble(el, 200);
    });
  });
}

// ─── SYSTEM 8: SECTION REVEAL ANIMATIONS ──────────────────────────────────────

/**
 * Section Reveal Animations
 *
 * - IntersectionObserver: when a section enters viewport, sequentially
 *   reveal its direct children by adding class "revealed" with staggered delay
 */
function initSectionReveals() {
  const sections = document.querySelectorAll('section, .section');
  if (!sections.length) return;

  injectStyles(`
    .reveal-child {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .reveal-child.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `);

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const children = Array.from(entry.target.children);
        children.forEach((child, idx) => {
          // Skip elements that handle their own animation
          if (
            child.classList.contains('quantum-dissolve') ||
            child.classList.contains('glitch')
          ) return;

          child.classList.add('reveal-child');

          const delay = idx * 80 + (parseFloat(child.dataset.delay) || 0);
          setTimeout(() => {
            child.classList.add('revealed');
          }, delay);
        });

        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  sections.forEach((section) => revealObserver.observe(section));
}

// ─── SYSTEM 9: COUNTER ANIMATION ──────────────────────────────────────────────

/**
 * Counter Animation
 *
 * - .stat-number elements animate from 0 to data-target over 1.5s
 * - easeOutExpo easing
 * - Triggered by IntersectionObserver on entering viewport
 */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const DURATION = 1500;

  /**
   * Animate a single counter element.
   * @param {HTMLElement} el
   */
  function animateCounter(el) {
    if (el._counted) return;
    el._counted = true;

    const target = parseFloat(el.dataset.target) || 0;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = (el.dataset.target.includes('.'))
      ? el.dataset.target.split('.')[1].length
      : 0;

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = clamp(elapsed / DURATION, 0, 1);
      const eased = easeOutExpo(progress);
      const current = eased * target;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => counterObserver.observe(el));
}

// ─── SYSTEM 10: SOUND VISUALIZER (FAKE/VISUAL) ────────────────────────────────

/**
 * Sound Visualizer — decorative only, no actual audio
 *
 * - Creates 20 animated bar elements near the hero section
 * - Each bar animates height at a random speed using CSS keyframes
 */
function initSoundVisualizer() {
  const hero = document.getElementById('hero') || document.querySelector('.hero-section');
  if (!hero) return;

  const BAR_COUNT = 20;

  // Inject visualizer CSS
  injectStyles(`
    #sound-viz {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 48px;
      padding: 0 4px;
      position: relative;
      z-index: 2;
    }

    .viz-bar {
      width: 4px;
      border-radius: 2px 2px 0 0;
      transform-origin: bottom;
      animation-name: vizPulse;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      animation-direction: alternate;
    }

    @keyframes vizPulse {
      0%   { transform: scaleY(0.1); }
      100% { transform: scaleY(1); }
    }
  `);

  const vizContainer = document.createElement('div');
  vizContainer.id = 'sound-viz';

  const COLORS = ['#00ffff', '#9900ff', '#ff00cc'];

  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'viz-bar';

    const maxH = 16 + Math.random() * 32;
    const duration = (0.35 + Math.random() * 0.7).toFixed(2);
    const delay = (Math.random() * 0.8).toFixed(2);
    const color = COLORS[i % COLORS.length];

    bar.style.cssText = [
      `height:${maxH}px`,
      `animation-duration:${duration}s`,
      `animation-delay:${delay}s`,
      `background:linear-gradient(to top, ${color}, rgba(255,255,255,0.3))`,
      `box-shadow:0 0 6px ${color}`,
    ].join(';');

    vizContainer.appendChild(bar);
  }

  // Try inserting after the hero heading, otherwise append to hero
  const heroHeading = hero.querySelector('h1, h2, .hero-title');
  if (heroHeading && heroHeading.parentNode) {
    heroHeading.parentNode.insertBefore(vizContainer, heroHeading.nextSibling);
  } else {
    hero.appendChild(vizContainer);
  }
}

// ─── SYSTEM 11: PAGE TRANSITION ───────────────────────────────────────────────

/**
 * Page Transition
 *
 * - Internal links (to/from gaming-ideas.html) show a fullscreen
 *   "reality tear" overlay before navigating
 * - Diagonal wipe + glitch + colour flash effect
 */
function initPageTransitions() {
  // Build overlay element
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';

  injectStyles(`
    #page-transition-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(135deg, #00ffff 0%, #9900ff 50%, #ff00cc 100%);
      clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
      transition: clip-path 0.25s cubic-bezier(0.76,0,0.24,1),
                  opacity 0.1s ease;
    }

    #page-transition-overlay.tearing {
      clip-path: polygon(0 0, 110% -10%, 110% 110%, 0 100%);
      opacity: 0.92;
    }

    #page-transition-overlay.tearing-out {
      clip-path: polygon(110% 0, 110% 0, 110% 100%, 110% 100%);
      opacity: 0;
      transition: clip-path 0.22s cubic-bezier(0.76,0,0.24,1),
                  opacity 0.22s ease;
    }
  `);

  document.body.appendChild(overlay);

  /**
   * Trigger the transition then navigate.
   * @param {string} href
   */
  function tearTo(href) {
    overlay.classList.remove('tearing-out');
    // Force reflow
    void overlay.offsetWidth;
    overlay.classList.add('tearing');

    setTimeout(() => {
      window.location.href = href;
    }, 500);
  }

  // Intercept internal anchor clicks
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Only intercept relative links to known pages
    const isInternal =
      href === 'gaming-ideas.html' ||
      href === 'index.html' ||
      href === './' ||
      href === '../' ||
      (href.startsWith('./') && !href.startsWith('//'));

    if (!isInternal) return;
    if (anchor.target === '_blank') return;

    e.preventDefault();
    tearTo(href);
  });

  // Animate overlay out when page has loaded (arriving via transition)
  window.addEventListener('load', () => {
    overlay.classList.add('tearing');
    void overlay.offsetWidth;
    setTimeout(() => {
      overlay.classList.add('tearing-out');
      overlay.classList.remove('tearing');
    }, 80);
  });
}

// ─── SYSTEM 12: MOBILE MENU ───────────────────────────────────────────────────

/**
 * Mobile Menu
 *
 * - Toggles .menu-open class on nav when #hamburger (or .hamburger) is clicked
 * - Closes on outside click or Escape key
 */
function initMobileMenu() {
  const nav = document.getElementById('nav');
  const hamburger =
    document.getElementById('hamburger') ||
    document.querySelector('.hamburger') ||
    document.querySelector('[data-menu-toggle]');

  if (!nav || !hamburger) return;

  function openMenu() {
    nav.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    nav.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (nav.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('menu-open') && !nav.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
      closeMenu();
    }
  });

  // Close menu when a nav link is clicked (single-page navigation)
  const navLinks = nav.querySelectorAll('a');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('menu-open')) {
        closeMenu();
      }
    });
  });
}

// ─── ENTRYPOINT ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // System 1 — must run first; handles its own async lifecycle
  initLoadingScreen();

  // System 2 — background canvas layer
  initNeuralNet();

  // System 3 — custom cursor (desktop only)
  initCursor();

  // System 4 — hero section parallax shapes
  initHeroParallax();

  // System 5 — 3D tilt on holo-card elements
  initTiltEffect();

  // System 6 — scroll-driven animations and nav state
  initScrollAnimations();

  // System 7 — glitch text scrambler
  initGlitchText();

  // System 8 — sequential section child reveals
  initSectionReveals();

  // System 9 — animated number counters
  initCounters();

  // System 10 — decorative audio visualizer bars
  initSoundVisualizer();

  // System 11 — page transition overlay
  initPageTransitions();

  // System 12 — mobile hamburger menu toggle
  initMobileMenu();
});
