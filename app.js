// DOM references
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const character = document.getElementById('character');

// start cat running immediately
character.classList.add('running');

// MediaPipe / camera
let camera = null;
let hands = null;
let stream = null;

// state
let currentState = 'normal';

// smoothing
let smoothedY = null;
const SMOOTHING_FACTOR = 0.25;

const buffer = [];
const BUFFER_SIZE = 5;

// gesture detection
let lastY = null;
let upwardFrames = 0;
let lastJumpTime = 0;

const DEADZONE = 0.015;
const FRAME_THRESHOLD = 3;
const JUMP_COOLDOWN = 1300;

// helpers for smoothing
function smoothValue(raw) {
  if (smoothedY === null) smoothedY = raw;
  smoothedY = smoothedY + (raw - smoothedY) * SMOOTHING_FACTOR;
  return smoothedY;
}

function rollingAverage(raw) {
  buffer.push(raw);
  if (buffer.length > BUFFER_SIZE) buffer.shift();
  return buffer.reduce((a, b) => a + b, 0) / buffer.length;
}

function getStableY(rawY) {
  const lowPass = smoothValue(rawY);
  return rollingAverage(lowPass);
}

// sprite running helper
function setRunning(isRunning) {
  if (isRunning) {
    character.classList.add('running');
  } else {
    character.classList.remove('running');
  }
}

// finger gesture detection
function detectFingerMovement(fingerTip) {
  const rawY = fingerTip.y;
  const currentY = getStableY(rawY);

  if (lastY === null) {
    lastY = currentY;
    return;
  }

  const delta = currentY - lastY;

  if (Math.abs(delta) < DEADZONE) {
    upwardFrames = 0;
    lastY = currentY;
    return;
  }

  if (currentState !== 'normal') {
    lastY = currentY;
    return;
  }

  // movement up is negative delta
  if (delta < -DEADZONE) {
    upwardFrames++;
  } else {
    upwardFrames = 0;
  }

  const now = Date.now();
  if (
    upwardFrames >= FRAME_THRESHOLD &&
    currentState === 'normal' &&
    now - lastJumpTime >= JUMP_COOLDOWN
  ) {
    upwardFrames = 0;
    lastJumpTime = now;
    triggerJump();
  }

  lastY = currentY;
}

// character jump animation
function triggerJump() {
  if (currentState === 'jumping') return;
  if (character.classList.contains('jumping')) return;

  currentState = 'jumping';
  setRunning(false);

  character.classList.remove('jumping');
  void character.offsetHeight; // reflow
  character.classList.add('jumping');

  upwardFrames = 0;
  console.log('Jump detected');

  setTimeout(() => {
    if (currentState === 'jumping') {
      character.classList.remove('jumping');
      currentState = 'normal';
      upwardFrames = 0;
      setRunning(true);
    }
  }, 1200);
}

// MediaPipe hands initialization
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

// frame processing
function onResults(results) {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    if (landmarks.length > 8) {
      const indexFingerTip = landmarks[8];
      detectFingerMovement(indexFingerTip);
    }

    for (const handLandmarks of results.multiHandLandmarks) {
      drawConnectors(ctx, handLandmarks, HAND_CONNECTIONS, {
        color: '#00ff00',
        lineWidth: 2,
      });

      drawLandmarks(ctx, handLandmarks, {
        color: '#ff0000',
        radius: 3,
      });
    }
  } else {
    lastY = null;
    smoothedY = null;
    buffer.length = 0;
  }

  ctx.restore();
}

// camera control
async function startCamera() {
  try {
    status.textContent = 'Requesting camera access...';

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    });

    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    status.textContent = 'Camera active - Hand tracking running';

    startBtn.disabled = true;
    stopBtn.disabled = false;

    if (!camera && hands) {
      camera = new Camera(video, {
        onFrame: async () => {
          if (hands) {
            await hands.send({ image: video });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  } catch (error) {
    console.error('Camera error:', error);
    status.textContent =
      'Error: Could not access camera. Please allow camera permissions.';
    alert('Could not access camera. Please check permissions and try again.');
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  if (camera) {
    camera.stop();
    camera = null;
  }

  video.srcObject = null;
  if (canvas.width > 0 && canvas.height > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  character.classList.remove('jumping');
  currentState = 'normal';
  setRunning(true);

  lastY = null;
  smoothedY = null;
  buffer.length = 0;
  lastJumpTime = 0;

  status.textContent = 'Camera stopped';

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// events
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
      initializeHands();
      status.textContent = 'Ready to start - Click "Start Camera"';
    } else {
      status.textContent =
        'Error: MediaPipe libraries failed to load. Please refresh the page.';
      console.error('MediaPipe libraries not loaded');
    }
  }, 100);
});

window.addEventListener('beforeunload', stopCamera);
