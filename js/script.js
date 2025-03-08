        const video = document.getElementById('video');
const captureBtn = document.getElementById('capture');
const downloadBtn = document.getElementById('download');
const retryBtn = document.getElementById('retry');
const canvas = document.getElementById('canvas');
const mergedCanvas = document.getElementById('mergedCanvas');
const timerDisplay = document.getElementById('timer');
const bgColorPicker = document.getElementById('bgColor');
const resultContainer = document.getElementById('resultContainer');
const effectSelect = document.getElementById('effectSelect');
const overlaySelect = document.getElementById('overlaySelect');
const flashElement = document.getElementById('flash');
const ctx = canvas.getContext('2d');
const mergedCtx = mergedCanvas.getContext('2d');
const effectControl = document.getElementById('effect-control');
const overlayControl = document.getElementById('overlay-control');
const bgColorControl = document.getElementById('bg-color-control');
let capturedImages = [];
const styles = ['none', 'none', 'none', 'none']; // Semua tanpa filter
let currentImages = [];
let isCapturing = false;
let originalImages = [];

// Set smaller photo dimensions to prevent scrolling with 4 photos
const photoWidth = 140;  // Lebar foto - reduced
const photoHeight = 105; // Tinggi foto - reduced
const padding = 8;      // Padding - slightly reduced

// Hide controls initially
effectControl.style.display = 'none';
overlayControl.style.display = 'none';
bgColorControl.style.display = 'none';

// Function to draw rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
}

// Request camera with higher resolution
function requestCamera() {
    // Try to get the highest resolution possible
    const constraints = {
        video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            video.play();
            video.addEventListener('loadedmetadata', () => {
                // Adjust canvas sizes to match video resolution
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                // Keep original resolution for merged canvas
                mergedCanvas.width = video.videoWidth;
                mergedCanvas.height = video.videoHeight;
            });
        })
        .catch(err => {
            console.error('Error accessing webcam at high resolution:', err);
            // Fall back to any available resolution without showing alert
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    video.srcObject = stream;
                    video.play();
                    video.addEventListener('loadedmetadata', () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        mergedCanvas.width = video.videoWidth;
                        mergedCanvas.height = video.videoHeight;
                    });
                })
                .catch(err => console.error('Error accessing webcam:', err));
        });
}

// Flash animation
function triggerFlash() {
    flashElement.style.opacity = '0.9';
    setTimeout(() => {
        flashElement.style.opacity = '0';
    }, 200);
}

// Apply effects to image
function applyEffect(ctx, effectType, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch(effectType) {
        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;
            
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            break;
            
        case 'invert':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
            
        case 'duotone':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                
                if (avg < 128) {
                    data[i] = avg * 2;     // Red channel for darker areas
                    data[i + 1] = 0;       // Green
                    data[i + 2] = avg / 2; // Blue
                } else {
                    data[i] = 255;         // Red
                    data[i + 1] = (avg - 128) * 2; // Green
                    data[i + 2] = 255;     // Blue
                }
            }
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Draw overlay patterns
function drawOverlay(ctx, type, width, height) {
    ctx.save();
    
    switch(type) {
        case 'hearts':
            ctx.fillStyle = 'rgba(255, 105, 180, 0.3)';
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 10 + 5;
                
                // Draw heart
                ctx.beginPath();
                ctx.moveTo(x, y + size/4);
                ctx.quadraticCurveTo(x, y, x - size/2, y);
                ctx.quadraticCurveTo(x - size, y, x - size, y + size/2);
                ctx.quadraticCurveTo(x - size, y + size, x, y + size * 1.5);
                ctx.quadraticCurveTo(x + size, y + size, x + size, y + size/2);
                ctx.quadraticCurveTo(x + size, y, x + size/2, y);
                ctx.quadraticCurveTo(x, y, x, y + size/4);
                ctx.fill();
            }
            break;
            
        case 'stars':
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 6 + 4;
                const rotation = Math.random() * Math.PI;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                
                // Draw star
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    ctx.lineTo(Math.cos((j * 4 * Math.PI) / 5) * size, 
                              Math.sin((j * 4 * Math.PI) / 5) * size);
                    ctx.lineTo(Math.cos(((j * 4 + 2) * Math.PI) / 5) * size / 2, 
                              Math.sin(((j * 4 + 2) * Math.PI) / 5) * size / 2);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            break;
            
        case 'dots':
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 4 + 1;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
            
        case 'confetti':
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 5 + 1;
                
                ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.3)`;
                ctx.fillRect(x, y, size, size);
            }
            break;
            
        case 'rainbow':
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 5 + 1;
                const hue = Math.random() * 360;
                
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
                ctx.fillRect(x, y, size, size);
            }
            break;
            
        case 'squares':
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 10 + 5;
                
                ctx.fillRect(x, y, size, size);
            }
            break;
            
        case 'lines':
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 50; i++) {
                const x1 = Math.random() * width;
                const y1 = Math.random() * height;
                const x2 = Math.random() * width;
                const y2 = Math.random() * height;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            break;
    }
    
    ctx.restore();
}

// Update merged canvas with current settings
function updateMergedCanvas() {
    // Calculate dimensions based on the photos
    const numPhotos = currentImages.length;
    const scaleFactor = 2; // Increase resolution by factor of 2
    
    // Scale up dimensions while maintaining aspect ratio
    const scaledWidth = (photoWidth + (padding * 2)) * scaleFactor;
    const scaledHeight = ((photoHeight * numPhotos) + (padding * (numPhotos + 1))) * scaleFactor;
    
    // Resize the merged canvas
    mergedCanvas.width = scaledWidth;
    mergedCanvas.height = scaledHeight;
    
    // Apply CSS to ensure it displays at the original size
    mergedCanvas.style.width = `${scaledWidth/scaleFactor}px`;
    mergedCanvas.style.height = `${scaledHeight/scaleFactor}px`;
    
    // Draw background
    mergedCtx.fillStyle = bgColorPicker.value;
    mergedCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);
    
    // Process each image with the current effect and overlay settings
    for (let i = 0; i < currentImages.length; i++) {
        const item = currentImages[i];
        const y = (i * photoHeight + (i + 1) * padding) * scaleFactor;
        
        // Use a temporary canvas to apply effects to each image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = item.img.width;
        tempCanvas.height = item.img.height;
        
        // Draw the original image
        tempCtx.drawImage(item.img, 0, 0);
        
        // Apply selected effect
        if (effectSelect.value !== 'none') {
            applyEffect(tempCtx, effectSelect.value, tempCanvas.width, tempCanvas.height);
        }
        
        // Apply selected overlay
        if (overlaySelect.value !== 'none') {
            drawOverlay(tempCtx, overlaySelect.value, tempCanvas.width, tempCanvas.height);
        }
        
        // Scale image dimensions
        const imgRatio = tempCanvas.width / tempCanvas.height;
        
        let drawWidth, drawHeight;
        if (imgRatio > 1) {
            // Landscape
            drawWidth = photoWidth * scaleFactor;
            drawHeight = (photoWidth / imgRatio) * scaleFactor;
        } else {
            // Portrait
            drawHeight = photoHeight * scaleFactor;
            drawWidth = (photoHeight * imgRatio) * scaleFactor;
        }
        
        // Center the image horizontally
        const xOffset = (mergedCanvas.width - drawWidth) / 2;
        
        // Create clipping path for rounded corners
        mergedCtx.save();
        mergedCtx.roundRect(padding * scaleFactor, y, photoWidth * scaleFactor, photoHeight * scaleFactor, 8 * scaleFactor).clip();
        
        // Draw the processed image
        mergedCtx.drawImage(tempCanvas, xOffset, y, drawWidth, drawHeight);
        
        // Restore context
        mergedCtx.restore();
    }
}

// Capture a photo and save the original image data
function capturePhoto(style, index) {
    return new Promise(resolve => {
        // Capture image at full resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Save the original image data
        const originalImgData = canvas.toDataURL('image/png', 1.0);
        
        // Create original image object
        const img = new Image();
        img.onload = () => {
            // Store original image for later use with effects
            originalImages.push(img);
            
            // Add to current images
            currentImages.push({
                img: img,
                index: index
            });
            
            updateMergedCanvas();
            resolve();
        };
        img.src = originalImgData;
    });
}

// Create countdown timer
function countdown(seconds) {
    return new Promise(resolve => {
        timerDisplay.classList.remove('hidden');
        let timeLeft = seconds;
        timerDisplay.textContent = timeLeft;
        const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerDisplay.classList.add('hidden');
                triggerFlash();
                resolve();
            } else {
                timerDisplay.textContent = timeLeft;
            }
        }, 1000);
    });
}

// Create background bubbles
function createBubbles() {
    const bubbleContainer = document.getElementById('bubbles');
    const bubbleCount = 20;
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        // Randomize bubble properties
        const size = Math.random() * 60 + 20;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 5;
        const delay = Math.random() * 10;
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.bottom = `-${size}px`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        
        bubbleContainer.appendChild(bubble);
    }
}

// Function to show edit controls after all photos are taken
function showEditControls() {
    effectControl.style.display = 'block';
    overlayControl.style.display = 'block';
    bgColorControl.style.display = 'block';
}

// Initialize the app
requestCamera();
createBubbles();

// Add event listeners
captureBtn.addEventListener('click', async () => {
    if (isCapturing) return; // Prevent multiple clicks during capture
    
    isCapturing = true;
    captureBtn.disabled = true;
    captureBtn.classList.add('opacity-50');
    downloadBtn.classList.add('hidden');
    retryBtn.classList.add('hidden');
    
    // Hide edit controls during capture
    effectControl.style.display = 'none';
    overlayControl.style.display = 'none';
    bgColorControl.style.display = 'none';
    
    capturedImages = [];
    currentImages = [];
    originalImages = [];
    resultContainer.classList.add('hidden');
    
    try {
        for (let i = 0; i < styles.length; i++) {
            await countdown(3);
            
            // Capture photo without filters initially
            await capturePhoto(styles[i], i);
            
            // Show results after first photo
            if (i === 0) {
                resultContainer.classList.remove('hidden');
            }
        }
        
        // Show edit controls and buttons AFTER all photos are taken
        showEditControls();
        downloadBtn.classList.remove('hidden');
        retryBtn.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error during capture:', error);
    } finally {
        isCapturing = false;
        captureBtn.disabled = false;
        captureBtn.classList.remove('opacity-50');
    }
});

// Add change listeners for controls to update the canvas
effectSelect.addEventListener('change', updateMergedCanvas);
overlaySelect.addEventListener('change', updateMergedCanvas);
bgColorPicker.addEventListener('input', updateMergedCanvas);

// Download button event
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'photobooth_picture.png';
    // Use maximum quality PNG
    link.href = mergedCanvas.toDataURL('image/png', 1.0);
    link.click();
});

// Retry button event
retryBtn.addEventListener('click', () => {
    capturedImages = [];
    currentImages = [];
    originalImages = [];
    resultContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    retryBtn.classList.add('hidden');
    
    // Hide edit controls when retrying
    effectControl.style.display = 'none';
    overlayControl.style.display = 'none';
    bgColorControl.style.display = 'none';
});