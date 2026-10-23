/**
 * Birthday Surprise Web Application
 * Handles:
 *  - Intro curtain & blinding white flash transition
 *  - Edge-to-edge pure fullscreen comic video player
 *  - Soft pinkish glowy background with aesthetic birthday cake
 *  - Interactive 7 candles with animated flames, smoke wisps & whoosh audio
 *  - Grand celebration finale: confetti physics cannon, floating balloons, fanfare
 *  - "Wanna see what's next? 👉✨" interactive button
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements - Intro & Stage 0
  const introCurtain = document.getElementById('introCurtain');
  const startSurpriseBtn = document.getElementById('startSurpriseBtn');
  const whiteFlash = document.getElementById('whiteFlash');

  // Elements - Stage 1 (Fullscreen Comic Video)
  const stageVideo = document.getElementById('stageVideo');
  const birthdayVideo = document.getElementById('birthdayVideo');
  const videoActionSection = document.getElementById('videoActionSection');
  const cutCakeBtn = document.getElementById('cutCakeBtn');

  // Elements - Stage 2 (Soft Pink Glowy Cake Scene)
  const stageRoom = document.getElementById('stageRoom');
  const candlesRow = document.getElementById('candlesRow');
  const candlesLeftCount = document.getElementById('candlesLeftCount');
  const celebrationOverlay = document.getElementById('celebrationOverlay');
  const whatsNextBtn = document.getElementById('whatsNextBtn');
  const balloonContainer = document.getElementById('balloonContainer');
  const effectsCanvas = document.getElementById('effectsCanvas');
  const sparklesField = document.getElementById('sparklesField');

  // Elements - Stage 3 (Family Surprise Envelopes)
  const stageEnvelopes = document.getElementById('stageEnvelopes');
  const envelopesSparklesField = document.getElementById('envelopesSparklesField');
  const envelopeVideoModal = document.getElementById('envelopeVideoModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalReturnBtn = document.getElementById('modalReturnBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalSenderTitle = document.getElementById('modalSenderTitle');
  const placeholderAuthorText = document.getElementById('placeholderAuthorText');
  const placeholderFileBadge = document.getElementById('placeholderFileBadge');
  const familyVideoPlayer = document.getElementById('familyVideoPlayer');
  const blackWindowPlaceholder = document.getElementById('blackWindowPlaceholder');

  // State
  let audioCtx = null;
  const totalCandles = 7;
  let candlesRemaining = totalCandles;
  let isVideoPlaying = false;
  let hasRealVideo = false;

  // Direct URL shortcut for fast preview: #stage3 or ?stage=3
  if (window.location.hash === '#stage3' || window.location.search.includes('stage=3')) {
    introCurtain.classList.add('fade-out');
    stageVideo.classList.add('hidden');
    stageRoom.classList.add('hidden');
    stageEnvelopes.classList.remove('hidden');
    initEnvelopesStage();
  } else if (window.location.hash === '#cake' || window.location.search.includes('stage=2')) {
    introCurtain.classList.add('fade-out');
    stageVideo.classList.add('hidden');
    stageRoom.classList.remove('hidden');
    initCakeScene();
  }

  /* ==========================================================
     AUDIO SYNTHESIS (Zero External Audio File Dependencies)
     ========================================================== */
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Realistic Candle Blowing "Whoosh / Puff" Sound
  function playCandleBlowSound() {
    if (!audioCtx) return;
    try {
      const bufferSize = audioCtx.sampleRate * 0.35;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.3);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.34);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Sweet chime when action button appears
  function playChimeSound() {
    if (!audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.55);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.65);
      });
    } catch (e) {}
  }

  // Celebratory Fanfare chord sequence
  function playCelebrationFanfare() {
    if (!audioCtx) return;
    try {
      const chords = [
        { freqs: [261.63, 329.63, 392.00], time: 0.0, dur: 0.3 },
        { freqs: [349.23, 440.00, 523.25], time: 0.3, dur: 0.3 },
        { freqs: [392.00, 493.88, 587.33], time: 0.6, dur: 0.4 },
        { freqs: [523.25, 659.25, 783.99, 1046.50], time: 1.0, dur: 1.5 }
      ];

      chords.forEach(c => {
        c.freqs.forEach(freq => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + c.time);

          gain.gain.setValueAtTime(0.16, audioCtx.currentTime + c.time);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + c.time + c.dur);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(audioCtx.currentTime + c.time);
          osc.stop(audioCtx.currentTime + c.time + c.dur + 0.1);
        });
      });
    } catch (e) {}
  }

  /* ==========================================================
     STAGE 0 -> STAGE 1: BLACK TO BLINDING WHITE TO FULLSCREEN VIDEO
     ========================================================== */
  function startExperience() {
    initAudio();

    // 1. Blinding white flash
    whiteFlash.classList.add('active');

    // 2. Hide intro curtain & show video stage
    setTimeout(() => {
      introCurtain.classList.add('fade-out');
      stageVideo.classList.remove('hidden');

      // 3. Clear white flash to reveal video
      setTimeout(() => {
        whiteFlash.classList.remove('active');
        playVideoSequence();
      }, 350);
    }, 450);
  }

  startSurpriseBtn.addEventListener('click', startExperience);
  introCurtain.addEventListener('click', (e) => {
    if (e.target !== startSurpriseBtn) {
      startExperience();
    }
  });

  /* ==========================================================
     STAGE 1: PURE FULLSCREEN VIDEO PLAYBACK
     ========================================================== */
  function onVideoReady() {
    hasRealVideo = true;
  }

  birthdayVideo.addEventListener('loadedmetadata', onVideoReady);
  birthdayVideo.addEventListener('canplay', onVideoReady);
  birthdayVideo.addEventListener('ended', onVideoCompleted);

  if (birthdayVideo.readyState >= 1) {
    onVideoReady();
  } else {
    birthdayVideo.load();
  }

  function playVideoSequence() {
    isVideoPlaying = true;
    videoActionSection.classList.add('hidden');
    birthdayVideo.currentTime = 0;

    const playPromise = birthdayVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          onVideoReady();
        })
        .catch((err) => {
          console.warn('Autoplay handled:', err);
          // If video file failed to load, automatically show the button after short delay
          setTimeout(onVideoCompleted, 4000);
        });
    } else {
      setTimeout(onVideoCompleted, 4000);
    }
  }

  function onVideoCompleted() {
    isVideoPlaying = false;
    videoActionSection.classList.remove('hidden');
    playChimeSound();
  }

  // Click video to resume if paused or fast-skip
  birthdayVideo.addEventListener('click', () => {
    if (birthdayVideo.paused) {
      birthdayVideo.play();
    }
  });

  /* ==========================================================
     STAGE 1 -> STAGE 2: TRANSITION TO SOFT PINK CAKE SCENE
     ========================================================== */
  cutCakeBtn.addEventListener('click', () => {
    stageVideo.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    stageVideo.style.transform = 'scale(1.08)';
    stageVideo.style.opacity = '0';

    setTimeout(() => {
      stageVideo.classList.add('hidden');
      stageRoom.classList.remove('hidden');
      initCakeScene();
    }, 700);
  });

  /* ==========================================================
     STAGE 2: SOFT PINKISH GLOWY CAKE & CANDLE SETUP
     ========================================================== */
  function initCakeScene() {
    celebrationOverlay.classList.add('hidden');
    candlesRemaining = totalCandles;
    updateCandlesCount();
    setupCandles();
    spawnFloatingSparkles();
  }

  function updateCandlesCount() {
    if (candlesLeftCount) {
      candlesLeftCount.textContent = candlesRemaining;
    }
  }

  // Setup 7 candles elegantly curved across the top tier surface
  function setupCandles() {
    candlesRow.innerHTML = '';

    // Oval cake surface dimensions: width ~ 240px, height ~ 52px
    // We position 7 candles along a gentle natural arc
    for (let i = 0; i < totalCandles; i++) {
      const candle = document.createElement('div');
      candle.classList.add('candle-item');
      candle.setAttribute('data-index', i);

      // Distribute from 24px to 216px
      const progress = i / (totalCandles - 1); // 0.0 to 1.0
      const x = 26 + progress * (240 - 52); // horizontal position in px
      
      // Arc curvature: parabolic curve following the cake oval top
      const normalizedX = (progress - 0.5) * 2; // -1 to 1
      const y = 8 + (normalizedX * normalizedX) * 11; // 8px at center, 19px at outer edges

      // Center horizontally on x, rest bottom of stick on y
      candle.style.left = `${x}px`;
      candle.style.top = `${y}px`;
      candle.style.marginLeft = '-7px';
      candle.style.marginTop = '-52px';

      // Internal candle elements
      candle.innerHTML = `
        <div class="candle-smoke"></div>
        <div class="candle-flame"></div>
        <div class="candle-wick"></div>
        <div class="candle-stick"></div>
      `;

      // Interactive Click / Tap to Blow
      candle.addEventListener('click', (e) => {
        e.stopPropagation();
        blowCandle(candle);
      });
      candle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        blowCandle(candle);
      });

      candlesRow.appendChild(candle);
    }
  }

  // Blow candle action
  function blowCandle(candleEl) {
    if (candleEl.classList.contains('extinguished')) return;

    candleEl.classList.add('extinguished');
    playCandleBlowSound();

    // Explicitly snuff the flame element immediately
    const flame = candleEl.querySelector('.candle-flame');
    if (flame) {
      flame.style.animation = 'none';
      flame.style.opacity = '0';
      flame.style.visibility = 'hidden';
      flame.style.boxShadow = 'none';
    }

    // Billow smoke wisps into the air
    spawnCandleSmoke(candleEl);

    candlesRemaining--;
    updateCandlesCount();

    // Check if all candles blown
    if (candlesRemaining <= 0) {
      setTimeout(() => {
        triggerCelebration();
      }, 750);
    }
  }

  // Spawn dynamic billowing smoke puffs into the air
  function spawnCandleSmoke(candleEl) {
    for (let i = 0; i < 6; i++) {
      const puff = document.createElement('div');
      puff.className = 'smoke-puff';
      const drift = (Math.random() - 0.5) * 60;
      puff.style.setProperty('--drift-x', `${drift}px`);
      puff.style.animationDelay = `${i * 0.12}s`;
      candleEl.appendChild(puff);
      setTimeout(() => puff.remove(), 2400);
    }
  }

  // Floating background sparkles generator
  function spawnFloatingSparkles() {
    if (!sparklesField) return;
    sparklesField.innerHTML = '';
    const sparkleSymbols = ['✨', '💖', '⭐', '🌸', '✨'];

    for (let i = 0; i < 18; i++) {
      const s = document.createElement('div');
      s.textContent = sparkleSymbols[i % sparkleSymbols.length];
      s.style.position = 'absolute';
      s.style.left = `${Math.random() * 96}%`;
      s.style.top = `${Math.random() * 90}%`;
      s.style.fontSize = `${10 + Math.random() * 16}px`;
      s.style.opacity = `${0.3 + Math.random() * 0.5}`;
      s.style.pointerEvents = 'none';
      s.style.animation = `sparkleFloat ${3 + Math.random() * 4}s infinite alternate ease-in-out`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      sparklesField.appendChild(s);
    }
  }

  /* ==========================================================
     GRAND CELEBRATION FINALE (All Candles Blown!)
     ========================================================== */
  function triggerCelebration() {
    playCelebrationFanfare();
    startConfettiAnimation();
    spawnBalloons(26);

    setTimeout(() => {
      celebrationOverlay.classList.remove('hidden');
    }, 750);
  }

  // "Wanna see what's next?" Button Interaction -> Transition to Stage 3 Envelopes
  if (whatsNextBtn) {
    whatsNextBtn.addEventListener('click', () => {
      playChimeSound();
      whatsNextBtn.classList.add('glow-pulse');
      whatsNextBtn.innerHTML = `<span>Surprise Unlocking... 🎁💖</span>`;

      setTimeout(() => {
        // Fade out Stage 2 (Cake & Celebration Cards)
        stageRoom.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
        stageRoom.style.opacity = '0';
        stageRoom.style.transform = 'scale(0.95)';
        celebrationOverlay.classList.add('hidden');
        stopConfettiAnimation();

        setTimeout(() => {
          stageRoom.classList.add('hidden');
          stageEnvelopes.classList.remove('hidden');
          initEnvelopesStage();
        }, 700);
      }, 850);
    });
  }

  /* ==========================================================
     STAGE 3: FAMILY ENVELOPES STAGE LOGIC
     ========================================================== */
  function initEnvelopesStage() {
    spawnEnvelopesSparkles();
    setupEnvelopesInteraction();
  }

  function spawnEnvelopesSparkles() {
    if (!envelopesSparklesField) return;
    envelopesSparklesField.innerHTML = '';
    const sparkleSymbols = ['✨', '💌', '💖', '⭐', '🌸', '✨'];

    for (let i = 0; i < 20; i++) {
      const s = document.createElement('div');
      s.textContent = sparkleSymbols[i % sparkleSymbols.length];
      s.style.position = 'absolute';
      s.style.left = `${Math.random() * 96}%`;
      s.style.top = `${Math.random() * 92}%`;
      s.style.fontSize = `${12 + Math.random() * 16}px`;
      s.style.opacity = `${0.35 + Math.random() * 0.45}`;
      s.style.pointerEvents = 'none';
      s.style.animation = `sparkleFloat ${3.5 + Math.random() * 4}s infinite alternate ease-in-out`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      envelopesSparklesField.appendChild(s);
    }
  }

  let activeFlyingEnvelope = null;
  let currentActiveItem = null;
  let currentItemRect = null;
  let isAnimatingEnvelope = false;

  function setupEnvelopesInteraction() {
    const envelopeItems = document.querySelectorAll('.envelope-item');
    envelopeItems.forEach((item, idx) => {
      // Gentle staggered entrance
      item.style.opacity = '0';
      item.style.transform = 'translateY(24px)';
      item.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 80 + idx * 70);

      item.addEventListener('click', () => {
        const senderId = item.getAttribute('data-id');
        const senderName = item.getAttribute('data-name');
        const videoSrc = item.getAttribute('data-video');
        openEnvelopeModal(item, senderId, senderName, videoSrc);
      });
    });
  }

  function openEnvelopeModal(item, senderId, senderName, videoSrc) {
    if (isAnimatingEnvelope) return;
    isAnimatingEnvelope = true;

    currentActiveItem = item;
    const rect = item.getBoundingClientRect();
    currentItemRect = rect;

    playChimeSound();

    // 1. Create flying clone exactly over original envelope
    const clone = item.cloneNode(true);
    clone.classList.add('flying-envelope-clone');
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.transform = 'scale(1)';
    document.body.appendChild(clone);
    activeFlyingEnvelope = clone;

    // Temporarily hide original item in its slot
    item.style.visibility = 'hidden';

    // 2. Animate clone smoothly to center of screen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetW = Math.min(580, window.innerWidth * 0.92);
        const targetH = Math.min(480, window.innerHeight * 0.82);
        const targetLeft = (window.innerWidth - targetW) / 2;
        const targetTop = (window.innerHeight - targetH) / 2;

        clone.style.top = `${targetTop}px`;
        clone.style.left = `${targetLeft}px`;
        clone.style.width = `${targetW}px`;
        clone.style.height = `${targetH}px`;
        clone.classList.add('is-centered');
      });
    });

    // 3. Prepare video modal data & player
    if (modalSenderTitle) modalSenderTitle.textContent = senderName;
    if (placeholderAuthorText) placeholderAuthorText.textContent = `Video from ${senderName}`;
    if (placeholderFileBadge) placeholderFileBadge.textContent = videoSrc;

    setupVideoSource(senderId, videoSrc);

    // 4. After flight completes (620ms), show modal in place of clone
    setTimeout(() => {
      envelopeVideoModal.classList.remove('hidden');
      if (activeFlyingEnvelope) {
        activeFlyingEnvelope.remove();
        activeFlyingEnvelope = null;
      }
      isAnimatingEnvelope = false;
    }, 620);
  }

  function setupVideoSource(senderId, videoSrc) {
    // Reset video player & placeholder
    if (familyVideoPlayer) {
      familyVideoPlayer.pause();
      familyVideoPlayer.classList.remove('active');
    }
    if (blackWindowPlaceholder) {
      blackWindowPlaceholder.classList.remove('hidden');
    }

    // Mapping for video sources with fallbacks
    const videoSources = {
      'mom': ['assets/videos/mom.mp4', 'assets/videos/meena.mp4', 'mom.mp4', 'meena.mp4'],
      'swayam': ['assets/videos/swayam.mp4', 'swayam.mp4'],
      'mama_mami': ['assets/videos/mama_mami.mp4', 'mama_mami.mp4'],
      'mayur': ['assets/videos/mayur.mp4', 'mayur.mp4']
    };

    if (videoSources[senderId]) {
      const sources = videoSources[senderId];
      let sourceIdx = 0;

      function tryLoadSource(src) {
        familyVideoPlayer.src = src;
        familyVideoPlayer.oncanplay = () => {
          familyVideoPlayer.classList.add('active');
          if (blackWindowPlaceholder) {
            blackWindowPlaceholder.classList.add('hidden');
          }
          familyVideoPlayer.play().catch(() => {});
        };
        familyVideoPlayer.onerror = () => {
          sourceIdx++;
          if (sourceIdx < sources.length) {
            tryLoadSource(sources[sourceIdx]);
          } else {
            // All attempts failed -> black window placeholder
            familyVideoPlayer.classList.remove('active');
            if (blackWindowPlaceholder) {
              blackWindowPlaceholder.classList.remove('hidden');
            }
          }
        };
        familyVideoPlayer.load();
      }

      tryLoadSource(sources[0]);
    } else {
      // For Siddhi or Kaka Masi (videos not added yet) -> keep pure black window placeholder
      familyVideoPlayer.removeAttribute('src');
      familyVideoPlayer.classList.remove('active');
      if (blackWindowPlaceholder) {
        blackWindowPlaceholder.classList.remove('hidden');
      }
    }
  }

  function closeEnvelopeModal() {
    if (isAnimatingEnvelope) return;
    if (familyVideoPlayer) {
      familyVideoPlayer.pause();
    }

    if (!currentActiveItem || !currentItemRect) {
      envelopeVideoModal.classList.add('hidden');
      return;
    }

    isAnimatingEnvelope = true;

    // 1. Capture current modal position
    const modalCard = document.querySelector('.envelope-modal-card');
    const modalRect = modalCard ? modalCard.getBoundingClientRect() : {
      top: (window.innerHeight - 460) / 2,
      left: (window.innerWidth - 560) / 2,
      width: 560,
      height: 460
    };

    // 2. Hide modal and create return flight clone
    envelopeVideoModal.classList.add('hidden');

    const returnClone = currentActiveItem.cloneNode(true);
    returnClone.classList.add('flying-envelope-clone', 'is-centered');
    returnClone.style.top = `${modalRect.top}px`;
    returnClone.style.left = `${modalRect.left}px`;
    returnClone.style.width = `${modalRect.width}px`;
    returnClone.style.height = `${modalRect.height}px`;
    document.body.appendChild(returnClone);

    // 3. Next frame: glide back to original slot on the side!
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        returnClone.classList.remove('is-centered');
        returnClone.style.top = `${currentItemRect.top}px`;
        returnClone.style.left = `${currentItemRect.left}px`;
        returnClone.style.width = `${currentItemRect.width}px`;
        returnClone.style.height = `${currentItemRect.height}px`;
      });
    });

    // 4. When return flight completes (620ms), restore original item
    setTimeout(() => {
      returnClone.remove();
      if (currentActiveItem) {
        currentActiveItem.style.visibility = 'visible';
        currentActiveItem = null;
        currentItemRect = null;
      }
      isAnimatingEnvelope = false;
    }, 620);
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeEnvelopeModal);
  if (modalReturnBtn) modalReturnBtn.addEventListener('click', closeEnvelopeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeEnvelopeModal);

  /* ==========================================================
     FLOATING BALLOONS GENERATOR
     ========================================================== */
  const balloonColors = ['#f472b6', '#fb7185', '#a78bfa', '#fbcfe8', '#f43f5e', '#38bdf8', '#ffd1dc'];

  function spawnBalloons(count) {
    balloonContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const balloon = document.createElement('div');
      balloon.classList.add('balloon');
      const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      balloon.style.backgroundColor = color;
      balloon.style.left = `${Math.random() * 95}%`;
      const dur = 4.5 + Math.random() * 3.5;
      balloon.style.animationDuration = `${dur}s`;
      balloon.style.animationDelay = `${Math.random() * 2}s`;
      balloonContainer.appendChild(balloon);
    }
  }

  /* ==========================================================
     CANVAS PHYSICS CONFETTI ENGINE
     ========================================================== */
  let confettiAnimationId = null;
  const particles = [];
  const confettiColors = ['#ff4081', '#ec4899', '#f43f5e', '#a855f7', '#fbbf24', '#38bdf8', '#ffffff', '#ffd1dc'];

  function resizeCanvas() {
    if (!effectsCanvas) return;
    effectsCanvas.width = window.innerWidth;
    effectsCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class ConfettiParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      this.size = Math.random() * 11 + 6;
      this.speedX = (Math.random() - 0.5) * 16;
      this.speedY = Math.random() * -17 - 4;
      this.gravity = 0.32;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 12;
      this.drag = 0.98;
      this.opacity = 1;
    }

    update() {
      this.speedX *= this.drag;
      this.speedY += this.gravity;
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      if (this.y > effectsCanvas.height - 20) {
        this.opacity -= 0.02;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      ctx.restore();
    }
  }

  function startConfettiAnimation() {
    stopConfettiAnimation();
    particles.length = 0;

    // Burst from both corners and center
    for (let i = 0; i < 180; i++) {
      particles.push(new ConfettiParticle(window.innerWidth * 0.15, window.innerHeight * 0.85));
      particles.push(new ConfettiParticle(window.innerWidth * 0.85, window.innerHeight * 0.85));
      particles.push(new ConfettiParticle(window.innerWidth * 0.5, window.innerHeight * 0.65));
    }

    const ctx = effectsCanvas.getContext('2d');

    function animate() {
      ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.opacity <= 0 || p.y > effectsCanvas.height + 50) {
          particles.splice(i, 1);
        }
      }

      // Continuous gentle trickle
      if (particles.length < 50) {
        particles.push(new ConfettiParticle(Math.random() * effectsCanvas.width, -10));
      }

      confettiAnimationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function stopConfettiAnimation() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    if (effectsCanvas) {
      const ctx = effectsCanvas.getContext('2d');
      ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    }
  }
});
