/**
 * MediaPipe finger-lift jump detector for Phaser game.
 * Dispatches "vision-jump" CustomEvent when index finger lifts upward.
 * Tuned for low sensitivity so small movements don't trigger jumps.
 */
(function () {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');

  if (!video || !canvas || !startBtn || !stopBtn || !statusEl) {
    console.warn('Vision: overlay elements not found, vision-jump disabled');
    return;
  }

  const ctx = canvas.getContext('2d');
  let camera = null;
  let hands = null;
  let stream = null;

  // Finger-lift detection
  const INDEX_TIP = 8;
  const INDEX_BASE = 5;

  // Less sensitive settings
  const LIFT_THRESHOLD = 0.045;   // higher threshold = less sensitive
  const SMOOTHING = 0.75;         // stronger smoothing = less jitter
  const COOLDOWN_MS = 400;

  // Require the finger to stay lifted for a few frames
  const REQUIRED_FRAMES = 3;
  let liftedFrames = 0;

  let smoothedLift = 0;
  let lastJumpTime = 0;

  function setStatus(text) {
    statusEl.textContent = text;
    try {
      window.dispatchEvent(new CustomEvent('vision-status', { detail: { status: text } }));
    } catch (_) {}
  }

  function triggerJump() {
    const now = Date.now();
    if (now - lastJumpTime < COOLDOWN_MS) return;
    lastJumpTime = now;

    window.dispatchEvent(new CustomEvent('vision-jump'));
    setStatus('Jump detected!');
  }

  function initializeHands() {
    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
  }

  function onResults(results) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      if (typeof drawConnectors === 'function') {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      }
      if (typeof drawLandmarks === 'function') {
        drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
      }

      const tip = landmarks[INDEX_TIP];
      const base = landmarks[INDEX_BASE];

      if (tip && base) {
        const rawLift = base.y - tip.y; // positive = finger lifted

        // Smooth the signal heavily
        smoothedLift = SMOOTHING * smoothedLift + (1 - SMOOTHING) * rawLift;

        // Debug
        console.log("raw:", rawLift.toFixed(3), "smooth:", smoothedLift.toFixed(3));

        // Check if finger is lifted enough
        if (smoothedLift > LIFT_THRESHOLD) {
          liftedFrames++;
        } else {
          liftedFrames = 0;
        }

        // Only trigger if lifted for multiple frames
        if (liftedFrames >= REQUIRED_FRAMES) {
          liftedFrames = 0;
          triggerJump();
        }
      }
    }

    ctx.restore();
  }

  async function startCamera() {
    try {
      setStatus('Requesting camera access...');

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });

      video.srcObject = stream;
      setStatus('Camera active – lift finger to jump');
      startBtn.disabled = true;
      stopBtn.disabled = false;

      if (!camera) {
        camera = new Camera(video, {
          onFrame: async () => { await hands.send({ image: video }); },
          width: 1280,
          height: 720,
        });
        camera.start();
      }
    } catch (err) {
      console.error('Vision: camera error', err);
      setStatus('Error: Could not access camera.');
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (camera) {
      camera.stop();
      camera = null;
    }
    video.srcObject = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStatus('Ready to start');
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);

  if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
    initializeHands();
    setStatus('Ready to start – click Start Camera');
  } else {
    setStatus('MediaPipe not loaded – check scripts');
  }

  window.addEventListener('beforeunload', stopCamera);
})();