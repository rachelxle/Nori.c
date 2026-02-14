// ======================================================
// DOM ELEMENTS
// ======================================================
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const character = document.getElementById('character');

// ======================================================
// GLOBALS
// ======================================================
let camera = null;
let hands = null;
let stream = null;

// Gesture state
let currentState = 'normal';

// Smoothing buffers
let smoothedY = null;
const SMOOTHING_FACTOR = 0.25;

const buffer = [];
const BUFFER_SIZE = 5;

// Gesture detection
let lastY = null;
let upwardFrames = 0;
let lastJumpTime = 0;

const DEADZONE = 0.015;
const FRAME_THRESHOLD = 3;
const JUMP_COOLDOWN = 1300; // Milliseconds - prevents double jumps (longer than 1.2s animation)

// ======================================================
// SMOOTHING FUNCTIONS
// ======================================================
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

// ======================================================
// GESTURE DETECTION
// ======================================================
function detectFingerMovement(fingerTip) {
    const rawY = fingerTip.y;
    const currentY = getStableY(rawY);

    if (lastY === null) {
        lastY = currentY;
        return;
    }

    const delta = currentY - lastY;

    // Ignore tiny jitter
    if (Math.abs(delta) < DEADZONE) {
        upwardFrames = 0;
        lastY = currentY;
        return;
    }

    // Don't track movement if already in an action state (prevents double triggers)
    if (currentState !== 'normal') {
        lastY = currentY;
        return;
    }

    // Track upward movement
    if (delta < -DEADZONE) {
        upwardFrames++;
    } else {
        // Reset upward frames if not moving up
        upwardFrames = 0;
    }

    // Trigger jump (with cooldown)
    const now = Date.now();
    if (upwardFrames >= FRAME_THRESHOLD && currentState === 'normal' && (now - lastJumpTime) >= JUMP_COOLDOWN) {
        upwardFrames = 0; // Reset immediately before triggering
        lastJumpTime = now;
        triggerJump();
    }

    lastY = currentY;
}

// ======================================================
// CHARACTER ACTIONS
// ======================================================
function triggerJump() {
    if (currentState === 'jumping') return;
    
    // Double-check state before proceeding
    if (character.classList.contains('jumping')) return;

    // Set state immediately to prevent double triggers
    currentState = 'jumping';
    
    // Remove any existing animation first
    character.classList.remove('jumping');
    
    // Force a reflow to ensure class removal is processed
    void character.offsetHeight;
    
    // Add jumping class to trigger animation
    character.classList.add('jumping');
    
    // Reset frame counters to prevent immediate re-trigger
    upwardFrames = 0;

    console.log('Jump detected');

    setTimeout(() => {
        // Only remove if still in jumping state (prevent race conditions)
        if (currentState === 'jumping') {
            character.classList.remove('jumping');
            currentState = 'normal';
            // Reset frame counters when returning to normal
            upwardFrames = 0;
        }
    }, 1200); // Match animation duration (1.2s)
}

// ======================================================
// MEDIAPIPE SETUP
// ======================================================
function initializeHands() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
}

// ======================================================
// HAND TRACKING CALLBACK
// ======================================================
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
                color: '#00FF00',
                lineWidth: 2
            });

            drawLandmarks(ctx, handLandmarks, {
                color: '#FF0000',
                radius: 3
            });
        }
    } else {
        lastY = null;
        smoothedY = null;
        buffer.length = 0;
    }

    ctx.restore();
}

// ======================================================
// CAMERA CONTROL
// ======================================================
async function startCamera() {
    try {
        status.textContent = 'Requesting camera access...';

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
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
                height: 720
            });
            camera.start();
        }
    } catch (error) {
        console.error('Camera error:', error);
        status.textContent = 'Error: Could not access camera. Please allow camera permissions.';
        alert('Could not access camera. Please check permissions and try again.');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
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

    lastY = null;
    smoothedY = null;
    buffer.length = 0;
    lastJumpTime = 0;

    status.textContent = 'Camera stopped';

    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// ======================================================
// EVENT LISTENERS
// ======================================================
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

window.addEventListener('load', () => {
    // Wait a bit for MediaPipe libraries to load
    setTimeout(() => {
        if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
            initializeHands();
            status.textContent = 'Ready to start - Click "Start Camera"';
        } else {
            status.textContent = 'Error: MediaPipe libraries failed to load. Please refresh the page.';
            console.error('MediaPipe libraries not loaded');
        }
    }, 100);
});

window.addEventListener('beforeunload', stopCamera);