/* ==========================================================================
   Love you Forever — หน้ารูปโพลารอยด์ + หัวใจจากอนุภาค
   ==========================================================================
   หน้า 1  กระดานโพลารอยด์ (พื้นหลังครีม มีอนุภาคชมพูลอยบางๆ)
   หน้า 2  อนุภาคชมพู แดง ขาว ชมพูอ่อน รวมตัวเป็นหัวใจดวงเดียว เต้นเป็นจังหวะ

   พื้นหลังค่อยๆ เปลี่ยนจากครีมเป็นสีกุหลาบเข้มตามการเลื่อน
   (ตรงกับสีตราประทับในการ์ดหน้าแรก) เพื่อให้อนุภาคสีขาวมองเห็นชัด
   ========================================================================== */

(function () {
  'use strict';

  /* ====================================================================== *
   *  ตั้งค่า (แก้ตรงนี้)                                                      *
   * ====================================================================== */

  // รูปแบบกระดานรูปหน้า 1
  //   'gallery' = การ์ดหลายใบ (แนะนำ 5-6 ใบ)
  //   'single'  = การ์ดรูปใหญ่ใบเดียว (ใช้รูปแรกในรายการ PHOTOS)
  var LAYOUT = 'gallery';

  // รายการรูป — ใส่ชื่อไฟล์ที่ src เช่น 'photos/01.jpg'
  // ปล่อย src ว่างไว้ = แสดงช่อง "ใส่รูปของคุณ"
  // เพิ่ม/ลดจำนวนการ์ดได้ด้วยการเพิ่ม/ลบบรรทัด
  var PHOTOS = [
    { src: 'photos/ปีแรก.jpg', caption: 'ปีที่ 1' },
    { src: 'photos/ปี 2.jpg', caption: 'ปีที่ 2' },
    { src: 'photos/ปี3.jpg', caption: 'ปีที่ 3' },
    { src: 'photos/ปี 4.jpg', caption: 'ปีที่ 4' },
    { src: 'photos/ความรัก.jpg', caption: 'วันธรรมดาของเรา' },
    { src: 'photos/ตลอดไป.jpg', caption: 'ต่อจากนี้' },
  ];

  /* ====================================================================== *
   *  สีและค่าคงที่                                                           *
   * ====================================================================== */

  var COLORS = {
    paper: '#FDFBF7',      // พื้นครีม (หน้า 1)
    wine: '#4a1a27',       // พื้นกุหลาบเข้ม (หน้า 2)
    wineGlow: '#8f4455',   // แสงตรงกลางพื้นกุหลาบ
    tintFree: '#f2a0b0',
    tintHeart: '#ff6b8a',
  };

  // อนุภาคมีเพียง 4 สี: ชมพู แดง ชมพูอ่อน ขาว
  var FAMILIES = [
    { key: 'pink',      hex: '#f28ca4', weight: 0.30 },
    { key: 'red',       hex: '#e5384f', weight: 0.20 },
    { key: 'lightPink', hex: '#fcd5dc', weight: 0.28 },
    { key: 'white',     hex: '#fffaf5', weight: 0.22 },
  ];

  var SECTION_COUNT = 2;
  var TWO_PI = Math.PI * 2;

  // จำนวนอนุภาคตามขนาดหน้าจอ
  var TIERS = [
    { key: 'desktop', minWidth: 1200, rows: 40, cols: 36, dotSize: 2.2 },
    { key: 'laptop',  minWidth: 1024, rows: 30, cols: 28, dotSize: 2.3 },
    { key: 'tablet',  minWidth: 768,  rows: 24, cols: 22, dotSize: 2.5 },
    { key: 'mobile',  minWidth: 0,    rows: 20, cols: 20, dotSize: 2.7 },
  ];

  // ขอบเขตการกระจายของอนุภาคอิสระ (หน้า 1) — กว้างกว่าจอเพื่อให้ล้นขอบ
  var FREE_SCALE = { x: 1.3, y: 0.95, z: 0.8 };

  // ความหนาของหัวใจ (หน่วยเดียวกับสมการหัวใจ ความกว้างทั้งดวง = 32)
  var HEART_DEPTH = 6.5;

  /* ====================================================================== *
   *  ฟังก์ชันช่วยคำนวณ                                                       *
   * ====================================================================== */

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { var c = clamp01(t); return c * c * (3 - 2 * c); }
  function mapRange(v, inMin, inMax, outMin, outMax) {
    var t = clamp01((v - inMin) / (inMax - inMin));
    return outMin + t * (outMax - outMin);
  }
  // สุ่มแบบคงที่ (ไม่เปลี่ยนทุกเฟรม) เพื่อให้อนุภาคแต่ละเม็ดมี "นิสัย" คงเดิม
  function hash(n) {
    var x = Math.sin(n) * 43758.5453123;
    return x - Math.floor(x);
  }
  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }
  function rgbToHex(r, g, b) {
    function h(n) { return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0'); }
    return '#' + h(r) + h(g) + h(b);
  }
  function hexToRgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + clamp01(alpha) + ')';
  }
  function lerpColorHex(hexA, hexB, t) {
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
  }

  var FAMILY_RGB = FAMILIES.map(function (f) { return hexToRgb(f.hex); });

  function pickFamily(roll) {
    var acc = 0;
    for (var i = 0; i < FAMILIES.length; i++) {
      acc += FAMILIES[i].weight;
      if (roll < acc) return i;
    }
    return FAMILIES.length - 1;
  }

  // สีของอนุภาค: ความลึกใช้ความโปร่งใส + ดึงเข้าหาสีขาวเล็กน้อยสำหรับเม็ดที่อยู่ใกล้
  function particleFillStyle(familyIdx, brightness, alpha) {
    var base = FAMILY_RGB[familyIdx];
    var r = base.r + (255 - base.r) * brightness;
    var g = base.g + (255 - base.g) * brightness;
    var b = base.b + (255 - base.b) * brightness;
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + alpha.toFixed(2) + ')';
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  /* ====================================================================== *
   *  รูปทรง (Formations)                                                     *
   *  อนุภาคเม็ดเดิม (row, col) ย้ายจากรูปทรงหนึ่งไปอีกรูปทรงหนึ่ง              *
   *  จึงดูเหมือนวัตถุชิ้นเดียวที่ค่อยๆ เปลี่ยนรูป                              *
   * ====================================================================== */

  // หน้า 1: กระจายแบบอิสระ ล้นออกนอกจอ
  function formationFree(p, scale, out) {
    var jitterX = (p.seed1 - 0.5) * 2;
    var jitterY = (p.seed2 - 0.5) * 2;
    var jitterZ = (p.seed3 - 0.5) * 2;
    var clusterX = (p.clusterSeedA - 0.5) * 2;
    var clusterY = (p.clusterSeedB - 0.5) * 2;
    var clusterPull = 0.4;

    out.x = (jitterX * (1 - clusterPull) + clusterX * clusterPull) * scale * FREE_SCALE.x;
    out.y = (jitterY * (1 - clusterPull) + clusterY * clusterPull) * scale * FREE_SCALE.y;
    out.z = jitterZ * scale * FREE_SCALE.z;
    return out;
  }

  // หน้า 2: หัวใจ 3 มิติทรงหมอน
  //   - ขอบหัวใจใช้สมการมาตรฐาน x = 16 sin^3 t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
  //   - แต่ละวงย่อเข้าหาศูนย์กลางด้วย rho = sqrt(u) ให้ความหนาแน่นเท่ากันทั่วพื้นที่
  //   - เม็ดสลับด้านหน้า/ด้านหลัง ความหนาโค้งขึ้นตรงกลางเหมือนหมอน
  //   - ราว 16% ของเม็ดถูกดึงมาอยู่บนเส้นขอบ เพื่อให้รูปทรงชัด
  function formationHeart(p, scale, out) {
    var stagger = (p.row % 2) * (Math.PI / p.cols);
    var t = (p.col / p.cols) * TWO_PI + stagger;
    var u = (p.row + 0.5) / p.rows;
    var rho = p.seed1 > 0.84 ? 1 : Math.sqrt(u);

    var st = Math.sin(t);
    var hx = 16 * st * st * st;
    var hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    var k = heartK * beatScale;
    var face = (p.col % 2 === 0) ? 1 : -1;
    var depth = HEART_DEPTH * Math.pow(Math.max(0, 1 - rho * rho), 0.55);

    out.x = hx * rho * k;
    out.y = -(hy + 2.5) * rho * k;              // +2.5 = ย้ายจุดกึ่งกลางหัวใจมาที่ (0,0)
    out.z = face * (depth + (p.seed3 - 0.5) * 0.9) * k;
    return out;
  }

  var FORMATION_REGISTRY = {
    free: {
      generate: formationFree,
      meta: { originYFrac: 0.46, tint: COLORS.tintFree, lineWeight: 0, rotationInfluence: 0.5 },
    },
    heart: {
      generate: formationHeart,
      meta: { originYFrac: 0.5, tint: COLORS.tintHeart, lineWeight: 0, rotationInfluence: 0.9 },
    },
  };
  var DEFAULT_FORMATION_NAME = 'free';

  var FORMATIONS = [];
  var FORMATION_META = [];

  /* ====================================================================== *
   *  สถานะ                                                                   *
   * ====================================================================== */

  var canvas, ctx;
  var width = 0, height = 0, dpr = 1;
  var worldScale = 0, CAMERA_DISTANCE = 0, FOCAL_BASE = 0;
  var noisePattern = null;
  var glowSprites = [];

  var particles = [];
  var projectedScratch = [];
  var currentTier = null;

  var reducedMotionMQ = null;
  var reducedMotion = false;

  var scrollProgress = 0;
  var sectionFloatValue = 0;
  var currentIndex = 0;
  var scrollDirty = true;

  var lastFrameTime = 0;
  var lastScrollYForVelocity = 0;
  var scrollVelocitySmoothed = 0;

  var mouseTarget = { x: 0, y: 0 };
  var mouseDamped = { x: 0, y: 0 };
  var sinYaw = 0, cosYaw = 1, sinPitch = 0, cosPitch = 1;

  var blendedTint = COLORS.tintFree;
  var blendedOriginYFrac = 0.46;
  var blendedRotationInfluence = 1;
  var focalMultiplier = 1;

  // 0 = พื้นครีม (หน้า 1) → 1 = พื้นกุหลาบเข้ม (หน้า 2)
  var bgTarget = 0;
  var bgBlend = 0;

  // หัวใจ: หน่วยโลกต่อ 1 หน่วยสมการ + จังหวะเต้น
  var heartK = 1;
  var beatScale = 1;

  var slowFrameCount = 0;
  var perfDowngradeStage = 0;

  var _f0 = { x: 0, y: 0, z: 0 };
  var _f1 = { x: 0, y: 0, z: 0 };
  var _targetScratch = { x: 0, y: 0, z: 0 };

  // DOM
  var sectionEls, dotsContainer, sectionDotEls, navLinkEls;
  var prevBtn, nextBtn, sectionCountEl, scrollRailFillEl, siteNavEl, scrollCueEl;

  /* ====================================================================== *
   *  กระดานรูปโพลารอยด์ (หน้า 1)                                             *
   * ====================================================================== */

  var CAMERA_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  var ROTATIONS = [-4, 3, -2.5, 4, -3, 2.2, -3.5, 3];
  var OFFSETS_Y = [0, 16, -6, 12, -4, 18, 4, -8];
  var TAPE_ROTATIONS = [-4, 3, -2, 5, -5, 2, -3, 4];

  var lightboxEl, lightboxImageEl, lightboxCaptionEl, lightboxCloseBtn;
  var lastFocusedBeforeLightbox = null;

  function buildPolaroid(photo, i, single) {
    var card = document.createElement('figure');
    card.className = 'polaroid';
    card.style.setProperty('--i', String(i));
    card.style.setProperty('--rot', (single ? -2 : ROTATIONS[i % ROTATIONS.length]) + 'deg');
    card.style.setProperty('--dy', (single ? 0 : OFFSETS_Y[i % OFFSETS_Y.length]) + 'px');
    card.style.setProperty('--tape-rot', TAPE_ROTATIONS[i % TAPE_ROTATIONS.length] + 'deg');

    var tape = document.createElement('span');
    tape.className = 'tape';
    card.appendChild(tape);

    var frame = document.createElement('div');
    frame.className = 'photo';

    var img = document.createElement('img');
    img.alt = photo.caption || '';
    img.hidden = true;
    img.decoding = 'async';
    frame.appendChild(img);

    var placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = CAMERA_SVG + '<span>ใส่รูปของคุณ</span>'; // ข้อความคงที่ ไม่นำข้อมูลจาก config มาต่อ HTML
    frame.appendChild(placeholder);
    card.appendChild(frame);

    var caption = document.createElement('figcaption');
    caption.textContent = photo.caption || '';
    card.appendChild(caption);

    if (photo.src) {
      img.onload = function () {
        img.hidden = false;
        placeholder.hidden = true;
        card.classList.add('has-photo');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'ดูรูปขนาดใหญ่' + (photo.caption ? ' — ' + photo.caption : ''));
      };
      img.onerror = function () {
        img.hidden = true;
        placeholder.hidden = false;
      };
      img.src = photo.src;

      card.addEventListener('click', function () {
        if (card.classList.contains('has-photo')) openLightbox(photo);
      });
      card.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && card.classList.contains('has-photo')) {
          e.preventDefault();
          openLightbox(photo);
        }
      });
    }
    return card;
  }

  function renderPhotoBoard() {
    var board = document.getElementById('photoBoard');
    if (!board) return;
    var single = LAYOUT === 'single';
    board.innerHTML = '';
    board.setAttribute('data-layout', single ? 'single' : 'gallery');

    var list = single ? PHOTOS.slice(0, 1) : PHOTOS;
    list.forEach(function (photo, i) {
      board.appendChild(buildPolaroid(photo, i, single));
    });
  }

  function openLightbox(photo) {
    lastFocusedBeforeLightbox = document.activeElement;
    lightboxImageEl.src = photo.src;
    lightboxImageEl.alt = photo.caption || '';
    lightboxCaptionEl.textContent = photo.caption || '';
    lightboxEl.classList.add('is-open');
    lightboxEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lightboxCloseBtn) lightboxCloseBtn.focus();
  }

  function closeLightbox() {
    if (!lightboxEl.classList.contains('is-open')) return;
    lightboxEl.classList.remove('is-open');
    lightboxEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedBeforeLightbox && typeof lastFocusedBeforeLightbox.focus === 'function') {
      lastFocusedBeforeLightbox.focus();
    }
  }

  function initLightbox() {
    lightboxEl = document.getElementById('photoLightbox');
    lightboxImageEl = document.getElementById('lightboxImage');
    lightboxCaptionEl = document.getElementById('lightboxCaption');
    lightboxCloseBtn = document.getElementById('lightboxClose');

    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', function (e) {
      if (e.target === lightboxEl) closeLightbox();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ====================================================================== *
   *  ลำดับรูปทรงจาก DOM                                                      *
   * ====================================================================== */

  function buildFormationSequence() {
    var names = sectionEls.map(function (el) {
      var name = el.getAttribute('data-formation');
      return FORMATION_REGISTRY[name] ? name : DEFAULT_FORMATION_NAME;
    });
    if (names.length === 0) names = [DEFAULT_FORMATION_NAME];
    if (names.length === 1) names.push(names[0]);

    FORMATIONS = names.map(function (n) { return FORMATION_REGISTRY[n].generate; });
    FORMATION_META = names.map(function (n) { return FORMATION_REGISTRY[n].meta; });
    SECTION_COUNT = sectionEls.length || 1;
  }

  /* ====================================================================== *
   *  Canvas                                                                  *
   * ====================================================================== */

  function initCanvas() {
    canvas = document.getElementById('backgroundCanvas');
    ctx = canvas.getContext('2d');
    buildNoiseTexture();
    buildGlowSprites();
    resizeCanvas();
  }

  // เกรนกระดานบางๆ (สีกุหลาบอมน้ำตาล มองเห็นทั้งบนพื้นครีมและพื้นเข้ม)
  function buildNoiseTexture() {
    var size = 128;
    var off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    var octx = off.getContext('2d');
    var imgData = octx.createImageData(size, size);
    var total = size * size;
    for (var p = 0; p < total; p++) {
      var v = hash(p * 12.9898 + 78.233);
      var o = p * 4;
      imgData.data[o] = 150;
      imgData.data[o + 1] = 90;
      imgData.data[o + 2] = 100;
      imgData.data[o + 3] = Math.floor(v * 60);
    }
    octx.putImageData(imgData, 0, 0);
    noisePattern = ctx.createPattern(off, 'repeat');
  }

  // ภาพแสงฟุ้งสำเร็จรูปของแต่ละสี วาดด้วย drawImage ซึ่งเร็วกว่าไล่เฉดทีละเม็ด
  function buildGlowSprites() {
    glowSprites = FAMILIES.map(function (f) {
      var size = 48;
      var c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, hexToRgba(f.hex, 0.55));
      grad.addColorStop(1, hexToRgba(f.hex, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      return c;
    });
  }

  function getTier(w) {
    for (var i = 0; i < TIERS.length; i++) {
      if (w >= TIERS[i].minWidth) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  // ขนาดหัวใจ: ให้พอดีจอ (กว้างไม่เกิน 88% / สูงไม่เกิน 74%) และชดเชยมุมมอง perspective
  function updateHeartMetrics() {
    var fit = Math.min(width * 0.88 / 32, height * 0.74 / 29);
    var perspectiveAtZero = FOCAL_BASE / CAMERA_DISTANCE;
    heartK = fit / (perspectiveAtZero || 1);
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    worldScale = Math.min(width, height);
    CAMERA_DISTANCE = worldScale * 1.5;
    FOCAL_BASE = worldScale * 1.3;
    updateHeartMetrics();

    var tier = getTier(width);
    if (!currentTier || tier.key !== currentTier.key) {
      currentTier = tier;
      perfDowngradeStage = 0;
      slowFrameCount = 0;
      createParticles(tier.rows, tier.cols);
    }
  }

  var resizeTimer = null;
  function onResizeDebounced() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 150);
  }

  /* ====================================================================== *
   *  อนุภาค                                                                  *
   * ====================================================================== */

  function createParticles(rows, cols) {
    rows = Math.max(rows, 2);
    cols = Math.max(cols, 3);
    var list = [];
    var now = performance.now();
    var idx = 0;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var clusterKey = Math.floor(idx / 7);
        var particle = {
          row: r, col: c, rows: rows, cols: cols, idx: idx,
          family: pickFamily(hash(idx * 7.777 + 3.1)),
          phase: hash(idx * 1.618 + 0.42) * TWO_PI,
          speed: 0.16 + hash(idx * 3.14159 + 1.7) * 0.20,
          sizeSeed: 0.7 + hash(idx * 5.55 + 2.2) * 0.6,
          seed1: hash(idx * 9.61 + 4.1),
          seed2: hash(idx * 15.23 + 7.7),
          seed3: hash(idx * 21.77 + 2.3),
          seed4: hash(idx * 27.91 + 6.5),
          clusterSeedA: hash(clusterKey * 4.21 + 8.8),
          clusterSeedB: hash(clusterKey * 6.13 + 1.9),
          x: 0, y: 0, z: 0,
        };

        // เริ่มที่ตำแหน่งเป้าหมายเลย ไม่ให้อนุภาคบินเข้ามาผิดที่ตอนเปลี่ยนขนาดจอ
        computeFormationTarget(particle, sectionFloatValue, now, _targetScratch);
        particle.x = _targetScratch.x;
        particle.y = _targetScratch.y;
        particle.z = _targetScratch.z;

        list.push(particle);
        idx++;
      }
    }

    particles = list;
    projectedScratch = new Array(list.length);
    for (var i = 0; i < list.length; i++) projectedScratch[i] = { x: 0, y: 0, scale: 0 };
  }

  function computeFormationTarget(p, sectionFloat, nowMs, out) {
    var clamped = clamp(sectionFloat, 0, SECTION_COUNT - 1);
    var idx0 = Math.floor(clamped);
    idx0 = clamp(idx0, 0, Math.max(FORMATIONS.length - 2, 0));
    var idx1 = Math.min(idx0 + 1, FORMATIONS.length - 1);
    var tRaw = clamped - idx0;
    var t = smoothstep(tRaw);

    FORMATIONS[idx0](p, worldScale, _f0);
    FORMATIONS[idx1](p, worldScale, _f1);

    var timeSec = nowMs / 1000;
    var wobble = worldScale * (reducedMotion ? 0.0009 : 0.006);
    var wobbleX = Math.sin(timeSec * p.speed + p.phase) * wobble;
    var wobbleY = Math.cos(timeSec * p.speed * 0.8 + p.phase * 1.3) * wobble;

    // ระหว่างเปลี่ยนรูปทรง อนุภาคกระจายออกเล็กน้อยก่อนรวมตัวใหม่
    var dissolveEnvelope = Math.sin(tRaw * Math.PI);
    var dissolveStrength = worldScale * (reducedMotion ? 0.03 : 0.20) * dissolveEnvelope;
    var dissX = (p.seed2 - 0.5) * dissolveStrength;
    var dissY = (p.seed3 - 0.5) * dissolveStrength;
    var dissZ = (p.seed4 - 0.5) * dissolveStrength;

    out.x = lerp(_f0.x, _f1.x, t) + wobbleX + dissX;
    out.y = lerp(_f0.y, _f1.y, t) + wobbleY + dissY;
    out.z = lerp(_f0.z, _f1.z, t) + dissZ;
    return out;
  }

  function updateParticles(dt, nowMs) {
    var followFactor = 1 - Math.pow(0.0008, dt);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      computeFormationTarget(p, sectionFloatValue, nowMs, _targetScratch);
      p.x += (_targetScratch.x - p.x) * followFactor;
      p.y += (_targetScratch.y - p.y) * followFactor;
      p.z += (_targetScratch.z - p.z) * followFactor;
    }
  }

  /* ====================================================================== *
   *  กล้อง / perspective                                                     *
   * ====================================================================== */

  // จังหวะหัวใจเต้นสองครั้งติดกัน (ตุบ-ตุบ) ทุก ~1.4 วินาที
  function heartbeat(nowMs) {
    var phase = ((nowMs / 1000) % 1.4) / 1.4;
    var a = Math.exp(-Math.pow((phase - 0.08) / 0.045, 2));
    var b = 0.6 * Math.exp(-Math.pow((phase - 0.30) / 0.055, 2));
    return a + b;
  }

  function updatePerspective(dt, nowMs) {
    var mouseDampFactor = 1 - Math.pow(0.001, dt);
    mouseDamped.x += (mouseTarget.x - mouseDamped.x) * mouseDampFactor;
    mouseDamped.y += (mouseTarget.y - mouseDamped.y) * mouseDampFactor;

    var clamped = clamp(sectionFloatValue, 0, SECTION_COUNT - 1);
    var idx0 = clamp(Math.floor(clamped), 0, Math.max(FORMATIONS.length - 2, 0));
    var idx1 = Math.min(idx0 + 1, FORMATIONS.length - 1);
    var t = smoothstep(clamped - idx0);
    var m0 = FORMATION_META[idx0];
    var m1 = FORMATION_META[idx1];

    blendedOriginYFrac = lerp(m0.originYFrac, m1.originYFrac, t);
    blendedRotationInfluence = lerp(m0.rotationInfluence, m1.rotationInfluence, t);
    blendedTint = lerpColorHex(m0.tint, m1.tint, t);

    // พื้นหลังเปลี่ยนสีนุ่มๆ ตามเป้าหมายที่คำนวณจากการเลื่อน
    var bgDamp = 1 - Math.pow(0.002, dt);
    bgBlend += (bgTarget - bgBlend) * bgDamp;

    var withinSection = clamped - Math.floor(clamped);
    var sectionPush = reducedMotion ? 0 : Math.sin(withinSection * Math.PI);
    var idleBreath = reducedMotion ? 0 : Math.sin(nowMs / 2600) * 0.5 + 0.5;
    var velocityKick = reducedMotion ? 0 : clamp(Math.abs(scrollVelocitySmoothed) / 2600, 0, 1);
    focalMultiplier = 1 + sectionPush * 0.12 + idleBreath * 0.02 + velocityKick * 0.12;

    // หัวใจเต้น (เฉพาะเมื่อกำลังอยู่ในหน้าหัวใจ) และแกว่งซ้าย-ขวาเล็กน้อย
    // แกว่งแทนการหมุนเต็มรอบ เพื่อให้เห็นหน้าหัวใจชัดตลอดเวลา
    var heartPresence = smoothstep((sectionFloatValue - 0.6) / 0.4);
    beatScale = reducedMotion ? 1 : 1 + 0.045 * heartbeat(nowMs) * heartPresence;
    var swing = reducedMotion ? 0 : Math.sin(nowMs / 4200) * 0.3;

    var yaw = swing + mouseDamped.x * 0.22 * blendedRotationInfluence;
    var pitch = mouseDamped.y * -0.11 * blendedRotationInfluence;
    sinYaw = Math.sin(yaw); cosYaw = Math.cos(yaw);
    sinPitch = Math.sin(pitch); cosPitch = Math.cos(pitch);
  }

  function project(lx, ly, lz, out) {
    var x = lx * cosYaw - lz * sinYaw;
    var zYaw = lx * sinYaw + lz * cosYaw;
    var y = ly * cosPitch - zYaw * sinPitch;
    var z = ly * sinPitch + zYaw * cosPitch;

    var focal = FOCAL_BASE * focalMultiplier;
    var denom = Math.max(CAMERA_DISTANCE + z, worldScale * 0.15);
    var scaleProj = focal / denom;

    out.x = width * 0.5 + x * scaleProj;
    out.y = height * blendedOriginYFrac + y * scaleProj;
    out.scale = scaleProj;
    return out;
  }

  /* ====================================================================== *
   *  วาด                                                                     *
   * ====================================================================== */

  function drawBase() {
    var t = bgBlend;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    ctx.fillStyle = lerpColorHex(COLORS.paper, COLORS.wine, t);
    ctx.fillRect(0, 0, width, height);

    // แสงนุ่มตรงกลาง: ครีมสว่างขึ้น / กุหลาบเข้มมีแสงกุหลาบ
    var poolColor = lerpColorHex('#fff3ef', COLORS.wineGlow, t);
    var g = ctx.createRadialGradient(
      width * 0.5, height * 0.42, 0,
      width * 0.5, height * 0.42, Math.max(width, height) * 0.8
    );
    g.addColorStop(0, hexToRgba(poolColor, lerp(0.7, 0.85, t)));
    g.addColorStop(1, hexToRgba(poolColor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    if (noisePattern) {
      ctx.save();
      ctx.globalAlpha = lerp(0.3, 0.5, t);
      ctx.fillStyle = noisePattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // ขอบมืดจางๆ
    var v = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.max(width, height) * 0.3,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.78
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1,
      'rgba(' + (lerp(181, 20, t) | 0) + ',' + (lerp(123, 5, t) | 0) + ',' + (lerp(123, 10, t) | 0) + ',' +
      lerp(0.14, 0.6, t).toFixed(2) + ')'
    );
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }

  // แสงฟุ้งใหญ่ตรงกลางหัวใจ (เฉพาะพื้นเข้ม — บนพื้นครีมการบวกแสงแทบไม่เห็นผล)
  function drawGlow() {
    if (bgBlend < 0.02) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    var anchorX = width * 0.5;
    var anchorY = height * blendedOriginYFrac;
    var r1 = worldScale * 0.95;
    var g1 = ctx.createRadialGradient(anchorX, anchorY, 0, anchorX, anchorY, r1);
    g1.addColorStop(0, hexToRgba(blendedTint, 0.2 * bgBlend));
    g1.addColorStop(1, hexToRgba(blendedTint, 0));
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    if (!reducedMotion) {
      var mgx = width * 0.5 + mouseDamped.x * width * 0.2;
      var mgy = height * 0.5 + mouseDamped.y * height * 0.2;
      var r2 = worldScale * 0.4;
      var g2 = ctx.createRadialGradient(mgx, mgy, 0, mgx, mgy, r2);
      g2.addColorStop(0, hexToRgba(blendedTint, 0.08 * bgBlend));
      g2.addColorStop(1, hexToRgba(blendedTint, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  function drawParticles() {
    var n = particles.length;
    for (var i = 0; i < n; i++) {
      var p = particles[i];
      project(p.x, p.y, p.z, projectedScratch[i]);
    }

    var baseSize = currentTier ? currentTier.dotSize : 2;
    var margin = 60;
    // บนพื้นครีมให้อนุภาคจางลง ไม่แย่งความสนใจจากรูป
    var presence = lerp(0.7, 1, bgBlend);

    // รอบที่ 1: แสงฟุ้งรอบเม็ด (เฉพาะเมื่อพื้นเริ่มมืด)
    if (bgBlend > 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var j = 0; j < n; j++) {
        var pj = particles[j];
        var pr = projectedScratch[j];
        if (pr.x < -margin || pr.x > width + margin || pr.y < -margin || pr.y > height + margin) continue;
        var aj = clamp(mapRange(pr.scale, 0.6, 1.05, 0.30, 1.0), 0.2, 1.0);
        if (aj < 0.45) continue;
        var gr = clamp(baseSize * 1.3 * pj.sizeSeed * pr.scale, 0.5, baseSize * 3.4) * 4.2;
        ctx.globalAlpha = aj * 0.5 * bgBlend;
        ctx.drawImage(glowSprites[pj.family], pr.x - gr, pr.y - gr, gr * 2, gr * 2);
      }
      ctx.restore();
    }

    // รอบที่ 2: ตัวเม็ด
    for (var k = 0; k < n; k++) {
      var pk = particles[k];
      var proj = projectedScratch[k];
      if (proj.x < -margin || proj.x > width + margin || proj.y < -margin || proj.y > height + margin) continue;

      var r = clamp(baseSize * 1.3 * pk.sizeSeed * proj.scale, 0.5, baseSize * 3.4);
      var alpha = clamp(mapRange(proj.scale, 0.6, 1.05, 0.30, 1.0), 0.15, 1.0) * presence;
      var brightness = clamp(mapRange(proj.scale, 0.6, 1.05, 0.0, 0.22), 0, 0.3);

      ctx.beginPath();
      ctx.fillStyle = particleFillStyle(pk.family, brightness, alpha);
      ctx.arc(proj.x, proj.y, r, 0, TWO_PI);
      ctx.fill();
    }
  }

  /* ====================================================================== *
   *  การเลื่อน / เมาส์                                                       *
   * ====================================================================== */

  function handleScroll() { scrollDirty = true; }

  function handleMouseMove(e) {
    mouseTarget.x = (e.clientX / width) * 2 - 1;
    mouseTarget.y = (e.clientY / height) * 2 - 1;
  }

  // ความคืบหน้าระหว่างหน้า คำนวณจากตำแหน่งจริงของแต่ละ section
  // (0 = เห็นหน้า 1 เต็มจอ, 1 = หน้า 2 ชนขอบบนของจอ) ใช้ได้แม้หน้า 1 สูงกว่าจอ
  function computeScrollProgress() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    scrollProgress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;

    var vh = window.innerHeight;
    var f = 0;
    for (var i = 1; i < sectionEls.length; i++) {
      var top = sectionEls[i].getBoundingClientRect().top;
      f += clamp((vh - top) / vh, 0, 1);
    }
    sectionFloatValue = f;
    currentIndex = clamp(Math.round(f), 0, SECTION_COUNT - 1);

    // พื้นหลังเริ่มเปลี่ยนเมื่อหน้า 2 ขึ้นมาเกินราว 1/3 ของจอ
    bgTarget = smoothstep((f - 0.35) / 0.5);
  }

  function syncChromeToScroll() {
    if (scrollRailFillEl) scrollRailFillEl.style.height = (scrollProgress * 100).toFixed(2) + '%';
    if (siteNavEl) siteNavEl.classList.toggle('is-scrolled', window.scrollY > 4);
    if (scrollCueEl) {
      var hide = window.scrollY > 40;
      scrollCueEl.style.opacity = hide ? '0' : '1';
    }
    document.body.classList.toggle('theme-rose', bgTarget > 0.5);
  }

  function updateSection() {
    var previous = currentIndex;
    computeScrollProgress();
    if (currentIndex !== previous) reflectSectionUI();
    syncChromeToScroll();
  }

  function reflectSectionUI() {
    for (var i = 0; i < sectionDotEls.length; i++) {
      var active = i === currentIndex;
      sectionDotEls[i].classList.toggle('is-active', active);
      sectionDotEls[i].setAttribute('aria-selected', String(active));
    }
    for (var j = 0; j < navLinkEls.length; j++) {
      navLinkEls[j].classList.toggle('is-active', Number(navLinkEls[j].getAttribute('data-nav-index')) === currentIndex);
    }
    if (sectionCountEl) sectionCountEl.textContent = (currentIndex + 1) + ' / ' + SECTION_COUNT;
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === SECTION_COUNT - 1;
  }

  function goToSection(index) {
    var clamped = clamp(index, 0, SECTION_COUNT - 1);
    var targetY = clamped === 0 ? 0 : sectionEls[clamped].offsetTop;
    window.scrollTo({ top: targetY, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function initSectionNav() {
    sectionEls = Array.prototype.slice.call(document.querySelectorAll('.lab-section'));
    dotsContainer = document.getElementById('sectionDots');
    prevBtn = document.getElementById('prevSection');
    nextBtn = document.getElementById('nextSection');
    sectionCountEl = document.getElementById('sectionCount');
    scrollRailFillEl = document.getElementById('scrollRailFill');
    siteNavEl = document.getElementById('siteNav');
    scrollCueEl = document.getElementById('scrollCue');
    navLinkEls = Array.prototype.slice.call(document.querySelectorAll('[data-nav-index]'));

    dotsContainer.innerHTML = '';
    sectionEls.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'section-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'ไปยังหน้าที่ ' + (i + 1));
      dot.addEventListener('click', function () { goToSection(i); });
      dotsContainer.appendChild(dot);
    });
    sectionDotEls = Array.prototype.slice.call(dotsContainer.children);

    prevBtn.addEventListener('click', function () { goToSection(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { goToSection(currentIndex + 1); });

    // ลิงก์เมนูใช้การเลื่อนแบบเดียวกับปุ่มด้านล่าง
    navLinkEls.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        goToSection(Number(el.getAttribute('data-nav-index')));
      });
    });
    var logo = document.querySelector('.nav-logo');
    if (logo) logo.addEventListener('click', function (e) { e.preventDefault(); goToSection(0); });
  }

  /* ====================================================================== *
   *  ตัวป้องกันเครื่องช้า: ลดจำนวนอนุภาคลงอัตโนมัติถ้าเฟรมเรตตก               *
   * ====================================================================== */

  var PERF_DOWNGRADE_FACTOR = 0.72;
  var PERF_MIN_ROWS = 8;
  var PERF_MIN_COLS = 8;
  var PERF_MAX_DOWNGRADES = 2;

  function trackPerformance(dt) {
    if (dt > 0.034) {
      slowFrameCount++;
      if (slowFrameCount > 200 && perfDowngradeStage < PERF_MAX_DOWNGRADES) {
        downgradeParticleDensity();
        slowFrameCount = 0;
      }
    } else if (slowFrameCount > 0) {
      slowFrameCount -= 0.5;
    }
  }

  function downgradeParticleDensity() {
    if (!currentTier) return;
    perfDowngradeStage++;
    // คอลัมน์ปัดให้เป็นเลขคู่ เพื่อให้หัวใจสลับด้านหน้า/หลังได้สมมาตร
    var newRows = Math.max(PERF_MIN_ROWS, Math.round(currentTier.rows * PERF_DOWNGRADE_FACTOR));
    var newCols = Math.max(PERF_MIN_COLS, Math.round(currentTier.cols * PERF_DOWNGRADE_FACTOR / 2) * 2);
    currentTier = {
      key: currentTier.key,
      minWidth: currentTier.minWidth,
      rows: newRows,
      cols: newCols,
      dotSize: currentTier.dotSize,
    };
    createParticles(newRows, newCols);
  }

  /* ====================================================================== *
   *  ลูปเรนเดอร์ / เริ่มทำงาน                                                 *
   * ====================================================================== */

  function renderLoop(nowMs) {
    var dt = Math.min((nowMs - lastFrameTime) / 1000, 0.05);
    lastFrameTime = nowMs;
    trackPerformance(dt);

    var currentScrollY = window.scrollY;
    var rawVelocity = (currentScrollY - lastScrollYForVelocity) / Math.max(dt, 0.0001);
    lastScrollYForVelocity = currentScrollY;
    var velDamp = 1 - Math.pow(0.02, dt);
    scrollVelocitySmoothed += (rawVelocity - scrollVelocitySmoothed) * velDamp;

    if (scrollDirty) {
      updateSection();
      scrollDirty = false;
    }

    updatePerspective(dt, nowMs);
    updateParticles(dt, nowMs);

    drawBase();
    drawGlow();
    drawParticles();

    requestAnimationFrame(renderLoop);
  }

  function init() {
    reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = reducedMotionMQ.matches;
    reducedMotionMQ.addEventListener('change', function (e) { reducedMotion = e.matches; });

    renderPhotoBoard();
    initLightbox();

    // ลำดับสำคัญ: ต่อ DOM → สร้างรูปทรง → คำนวณการเลื่อน → ค่อยสร้างอนุภาค
    initSectionNav();
    buildFormationSequence();
    computeScrollProgress();
    bgBlend = bgTarget; // รีโหลดกลางหน้าแล้วพื้นหลังต้องเป็นสีที่ถูกต้องทันที
    initCanvas();
    reflectSectionUI();
    syncChromeToScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', function () {
      onResizeDebounced();
      scrollDirty = true;
    });

    lastFrameTime = performance.now();
    lastScrollYForVelocity = window.scrollY;
    requestAnimationFrame(renderLoop);
  }

  init();
})();
