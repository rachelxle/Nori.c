/**
 * MediaPipe hand-jump detector for Phaser game.
 * Dispatches "vision-jump" CustomEvent when upward hand motion is detected.
 * Uses window events so Phaser can listen without coupling.
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

  // Jump detection: track hand Y over time, detect upward motion
  const MIDDLE_FINGER_TIP = 9;
  const JUMP_THRESHOLD = 0.08;       // min Y delta (upward = negative)
  const SMOOTHING = 0.3;             // exponential smoothing
  const COOLDOWN_MS = 400;
  let prevY = 0.5;
  let smoothedY = 0.5;
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
      maxNumHands: 2,
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
      for (const landmarks of results.multiHandLandmarks) {
        if (typeof drawConnectors === 'function') {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        }
        if (typeof drawLandmarks === 'function') {
          drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
        }

        // Jump detection: middle finger tip Y (0=top, 1=bottom)
        const tip = landmarks[MIDDLE_FINGER_TIP];
        if (tip && typeof tip.y === 'number') {
          smoothedY = SMOOTHING * smoothedY + (1 - SMOOTHING) * tip.y;
          const delta = prevY - smoothedY; // positive = hand moved up
          prevY = smoothedY;
          if (delta > JUMP_THRESHOLD) {
            triggerJump();
          }
        }
      }
    } else {
      prevY = 0.5;
      smoothedY = 0.5;
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
      setStatus('Camera active – raise hand to jump');
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
