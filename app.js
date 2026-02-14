const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const handCount = document.getElementById('handCount');

let camera = null;
let hands = null;
let stream = null;

// Initialize MediaPipe Hands
function initializeHands() {
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
}

// Handle hand tracking results
function onResults(results) {
    // Update hand count
    handCount.textContent = results.multiHandLandmarks.length;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hand landmarks and connections
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // Draw connections
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
            });
            
            // Draw landmarks
            drawLandmarks(ctx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
            });
        }
    }

    ctx.restore();
}

// Start camera and hand tracking
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
        status.textContent = 'Camera active - Hand tracking running';
        
        startBtn.disabled = true;
        stopBtn.disabled = false;

        // Initialize camera for MediaPipe
        if (!camera) {
            camera = new Camera(video, {
                onFrame: async () => {
                    await hands.send({ image: video });
                },
                width: 1280,
                height: 720
            });
            camera.start();
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        status.textContent = 'Error: Could not access camera. Please allow camera permissions.';
        alert('Could not access camera. Please check permissions and try again.');
    }
}

// Stop camera and hand tracking
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    status.textContent = 'Camera stopped';
    handCount.textContent = '0';
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Event listeners
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

// Initialize when page loads
window.addEventListener('load', () => {
    initializeHands();
    status.textContent = 'Ready to start - Click "Start Camera" to begin';
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCamera();
});

