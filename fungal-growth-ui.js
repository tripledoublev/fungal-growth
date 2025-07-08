// Fungal Growth Generator - Browser UI implementation
// Based on the Node.js implementation by the original author

// Global state variables
let hyphae = [];
let hyphaCounter = 0;
let config = {};
let colors = {};
let animationId = null;
let currentIteration = 0;
let generationInProgress = false;
let pausedGeneration = false;
let visibilitySettings = {
    hyphae: true,
    septa: true,
    tips: true,
    spitzenkorper: true
};

// Default configuration parameters
const defaultConfig = {
    width: 800,
    height: 600,
    initialHyphae: 2,
    iterations: 100,
    growthSpeed: 3.0,
    branchProbability: 0.02,
    maxBranchAngleDegrees: 120,
    septaSpacing: 100,
    maxHyphae: 50,
    attractionPoints: [
        { x: 500, y: 300, strength: 0.12 },
        { x: 650, y: 150, strength: 0.08 },
        { x: 350, y: 450, strength: 0.14 }
    ]
};

// Default colors
const defaultColors = {
    background: '#ffffff',
    hypha: '#9900FC',
    septa: '#ac45ff',
    tip: '#c47aff',
    spitzenkorper: '#ff6600'
};

// Initialize the UI
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Set up attraction points UI
    initAttractionPoints();
    
    // Set up event listeners for UI controls
    setupEventListeners();
    
    // Initialize values
    initializeValues();
    
    // Initial SVG container setup
    updateSvgContainer();
    
    // Auto-start generation after a short delay to allow UI to render
    setTimeout(() => {
        startGeneration();
    }, 300);
}

// Initialize attraction points UI
function initAttractionPoints() {
    const container = document.getElementById('attraction-points-container');
    container.innerHTML = '';
    
    defaultConfig.attractionPoints.forEach((point, index) => {
        addAttractionPointUI(point, index);
    });
    
    document.getElementById('add-attraction-point').addEventListener('click', () => {
        const newPoint = {
            x: Math.floor(config.width / 2),
            y: Math.floor(config.height / 2),
            strength: 0.1
        };
        
        addAttractionPointUI(newPoint);
        updateAttractionPoints();
    });
}

// Add a new attraction point to the UI
function addAttractionPointUI(point, index) {
    const container = document.getElementById('attraction-points-container');
    const pointId = index !== undefined ? index : container.children.length;
    
    const pointElement = document.createElement('div');
    pointElement.className = 'attraction-point';
    pointElement.dataset.index = pointId;
    
    pointElement.innerHTML = `
        <div class="point-controls">
            <div class="param-row">
                <div class="param-label">X</div>
                <div class="param-control">
                    <input type="range" class="point-x" min="0" max="${config.width || defaultConfig.width}" value="${point.x}">
                    <div class="param-value">${point.x}</div>
                </div>
            </div>
            <div class="param-row">
                <div class="param-label">Y</div>
                <div class="param-control">
                    <input type="range" class="point-y" min="0" max="${config.height || defaultConfig.height}" value="${point.y}">
                    <div class="param-value">${point.y}</div>
                </div>
            </div>
            <div class="param-row">
                <div class="param-label">Strength</div>
                <div class="param-control">
                    <input type="range" class="point-strength" min="0.01" max="0.5" step="0.01" value="${point.strength}">
                    <div class="param-value">${point.strength}</div>
                </div>
            </div>
        </div>
        <div class="point-actions">
            <button class="remove-point">Remove</button>
        </div>
    `;
    
    container.appendChild(pointElement);
    
    // Add event listeners for this point's controls
    const xInput = pointElement.querySelector('.point-x');
    const yInput = pointElement.querySelector('.point-y');
    const strengthInput = pointElement.querySelector('.point-strength');
    const xValue = xInput.nextElementSibling;
    const yValue = yInput.nextElementSibling;
    const strengthValue = strengthInput.nextElementSibling;
    
    // Update values on input
    xInput.addEventListener('input', () => {
        xValue.textContent = xInput.value;
        updateAttractionPoints();
    });
    
    yInput.addEventListener('input', () => {
        yValue.textContent = yInput.value;
        updateAttractionPoints();
    });
    
    strengthInput.addEventListener('input', () => {
        strengthValue.textContent = strengthInput.value;
        updateAttractionPoints();
    });
    
    // Remove point button
    pointElement.querySelector('.remove-point').addEventListener('click', () => {
        container.removeChild(pointElement);
        updateAttractionPoints();
    });
}

// Update the attraction points configuration from UI
function updateAttractionPoints() {
    const points = [];
    const pointElements = document.querySelectorAll('.attraction-point');
    
    pointElements.forEach(element => {
        const x = parseInt(element.querySelector('.point-x').value);
        const y = parseInt(element.querySelector('.point-y').value);
        const strength = parseFloat(element.querySelector('.point-strength').value);
        
        points.push({ x, y, strength });
    });
    
    config.attractionPoints = points;
    
    // If we're not generating, update the SVG preview
    if (!generationInProgress) {
        updateSvgContainer();
    }
}

// Set up event listeners for UI controls
function setupEventListeners() {
    // Slider inputs
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueDisplay = document.getElementById(`${input.id}-value`);
        if (valueDisplay) {
            input.addEventListener('input', () => {
                valueDisplay.textContent = input.value;
                updateConfigFromUI();
            });
        }
    });
    
    // Color inputs
    document.querySelectorAll('input[type="color"]').forEach(input => {
        const previewElement = document.getElementById(`${input.id.split('-')[0]}-preview`);
        
        input.addEventListener('input', () => {
            if (previewElement) {
                previewElement.style.backgroundColor = input.value;
            }
            updateColorsFromUI();
        });
    });
    
    // Canvas dimensions should update attraction point sliders
    document.getElementById('width').addEventListener('input', () => {
        const newWidth = parseInt(document.getElementById('width').value);
        document.querySelectorAll('.point-x').forEach(input => {
            input.max = newWidth;
            // Adjust the value if it's now out of bounds
            if (parseInt(input.value) > newWidth) {
                input.value = newWidth;
                input.nextElementSibling.textContent = newWidth;
            }
        });
    });
    
    document.getElementById('height').addEventListener('input', () => {
        const newHeight = parseInt(document.getElementById('height').value);
        document.querySelectorAll('.point-y').forEach(input => {
            input.max = newHeight;
            // Adjust the value if it's now out of bounds
            if (parseInt(input.value) > newHeight) {
                input.value = newHeight;
                input.nextElementSibling.textContent = newHeight;
            }
        });
    });
    
    // Visibility toggles
    document.getElementById('show-hyphae').addEventListener('change', function() {
        visibilitySettings.hyphae = this.checked;
        updateVisibility();
    });
    
    document.getElementById('show-septa').addEventListener('change', function() {
        visibilitySettings.septa = this.checked;
        updateVisibility();
    });
    
    document.getElementById('show-tips').addEventListener('change', function() {
        visibilitySettings.tips = this.checked;
        updateVisibility();
    });
    
    document.getElementById('show-spitzenkorper').addEventListener('change', function() {
        visibilitySettings.spitzenkorper = this.checked;
        updateVisibility();
    });
    
    // Collapsible panels
    document.querySelectorAll('.param-group h3').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.parentElement;
            group.classList.toggle('collapsed');
        });
    });
    
    // Toggle controls
    document.getElementById('toggle-controls').addEventListener('click', () => {
        document.querySelector('.controls-content').classList.toggle('collapsed');
        
        const toggleButton = document.getElementById('toggle-controls');
        if (document.querySelector('.controls-content').classList.contains('collapsed')) {
            toggleButton.textContent = 'Show Controls';
        } else {
            toggleButton.textContent = 'Hide Controls';
        }
    });
    
    // Button actions
    document.getElementById('generate').addEventListener('click', toggleGeneration);
    document.getElementById('clear').addEventListener('click', clearVisualization);
    document.getElementById('randomize').addEventListener('click', randomizeParameters);
    document.getElementById('export-svg').addEventListener('click', exportSvg);
}

// Initialize the values in UI from defaults
function initializeValues() {
    // Initialize config from defaults
    config = { ...defaultConfig };
    colors = { ...defaultColors };
    
    // Set slider values from config
    for (const key in config) {
        if (key === 'attractionPoints') continue;
        
        const element = document.getElementById(key);
        if (element) {
            element.value = config[key];
            const valueDisplay = document.getElementById(`${key}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = config[key];
            }
        }
    }
    
    // Set color values
    for (const key in colors) {
        const element = document.getElementById(`${key}-color`);
        if (element) {
            element.value = colors[key];
            const preview = document.getElementById(`${key}-preview`);
            if (preview) {
                preview.style.backgroundColor = colors[key];
            }
        }
    }
}

// Update config object from UI values
function updateConfigFromUI() {
    for (const key in defaultConfig) {
        if (key === 'attractionPoints') continue;
        
        const element = document.getElementById(key);
        if (element) {
            // Parse value according to type
            if (key === 'branchProbability' || key === 'growthSpeed') {
                config[key] = parseFloat(element.value);
            } else {
                config[key] = parseInt(element.value);
            }
        }
    }
    
    // Update attraction points separately
    updateAttractionPoints();
    
    // Update SVG container dimensions
    if (!generationInProgress) {
        updateSvgContainer();
    }
}

// Update colors object from UI values
function updateColorsFromUI() {
    for (const key in defaultColors) {
        const element = document.getElementById(`${key}-color`);
        if (element) {
            colors[key] = element.value;
        }
    }
    
    // Update SVG styles if not generating
    if (!generationInProgress) {
        updateSvgStyles();
    }
}

// Update the SVG container with current dimensions
function updateSvgContainer() {
    const container = document.getElementById('svg-container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Create SVG element with proper dimensions if it doesn't exist
    if (!container.querySelector('svg')) {
        container.innerHTML = createSvgElement();
    } else {
        // Update existing SVG dimensions
        // We'll make SVG viewBox match the configured dimensions while SVG element itself is 100% of container
        const svg = container.querySelector('svg');
        svg.setAttribute('viewBox', `0 0 ${config.width} ${config.height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.querySelector('rect').setAttribute('width', '100%');
        svg.querySelector('rect').setAttribute('height', '100%');
        
        // Update attraction points visualization
        updateAttractionPointsVisualization();
    }
    
    // Update styles
    updateSvgStyles();
}

// Create initial SVG element
function createSvgElement() {
    return `<svg width="100%" height="100%" viewBox="0 0 ${config.width} ${config.height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${colors.background}" />
        <defs>
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
            </filter>
        </defs>
        <style>
            .hypha { 
                fill: none; 
                stroke: ${colors.hypha}; 
                stroke-width: 2; 
                stroke-linecap: round; 
                visibility: ${visibilitySettings.hyphae ? 'visible' : 'hidden'}; 
            }
            .septa { 
                stroke: ${colors.septa}; 
                stroke-width: 1; 
                visibility: ${visibilitySettings.septa ? 'visible' : 'hidden'}; 
            }
            .tip { 
                fill: ${colors.tip}; 
                filter: url(#blur); 
                visibility: ${visibilitySettings.tips ? 'visible' : 'hidden'}; 
            }
            .spitzenkorper { 
                fill: ${colors.spitzenkorper}; 
                filter: url(#blur); 
                visibility: ${visibilitySettings.spitzenkorper ? 'visible' : 'hidden'}; 
            }
        </style>
        <g id="attraction-points">
            ${config.attractionPoints.map(point => 
                `<circle cx="${point.x}" cy="${point.y}" r="${10 * point.strength}" fill="#996633" opacity="0.2" />`
            ).join('\n            ')}
        </g>
        <g id="hyphae"></g>
    </svg>`;
}

// Update the visualization of attraction points
function updateAttractionPointsVisualization() {
    const svg = document.querySelector('#svg-container svg');
    if (!svg) return;
    
    const attractionPointsGroup = svg.querySelector('#attraction-points');
    if (!attractionPointsGroup) return;
    
    attractionPointsGroup.innerHTML = config.attractionPoints.map(point => 
        `<circle cx="${point.x}" cy="${point.y}" r="${10 * point.strength}" fill="#996633" opacity="0.2" />`
    ).join('\n            ');
}

// Update SVG styles based on current colors and visibility settings
function updateSvgStyles() {
    const svg = document.querySelector('#svg-container svg');
    if (!svg) return;
    
    // Update background
    svg.querySelector('rect').setAttribute('fill', colors.background);
    
    // Update styles with visibility settings
    svg.querySelector('style').textContent = `
        .hypha { 
            fill: none; 
            stroke: ${colors.hypha}; 
            stroke-width: 2; 
            stroke-linecap: round; 
            visibility: ${visibilitySettings.hyphae ? 'visible' : 'hidden'}; 
        }
        .septa { 
            stroke: ${colors.septa}; 
            stroke-width: 1; 
            visibility: ${visibilitySettings.septa ? 'visible' : 'hidden'}; 
        }
        .tip { 
            fill: ${colors.tip}; 
            filter: url(#blur); 
            visibility: ${visibilitySettings.tips ? 'visible' : 'hidden'}; 
        }
        .spitzenkorper { 
            fill: ${colors.spitzenkorper}; 
            filter: url(#blur); 
            visibility: ${visibilitySettings.spitzenkorper ? 'visible' : 'hidden'}; 
        }
    `;
}

// Update visibility based on toggle settings
function updateVisibility() {
    updateSvgStyles();
}

// Toggle between start, pause, and stop generation
function toggleGeneration() {
    if (!generationInProgress) {
        // If "Start New" was clicked (after a completed generation)
        if (document.getElementById('generate').textContent === 'Start New') {
            // Clear first, then start a new generation
            clearVisualization();
            startGeneration();
        } else {
            // Just start a generation
            startGeneration();
        }
    } else if (pausedGeneration) {
        // Resume generation
        resumeGeneration();
    } else {
        // Pause generation
        pauseGeneration();
    }
}

// Start the growth generation
function startGeneration() {
    // Update button text
    document.getElementById('generate').textContent = 'Pause';
    document.getElementById('generate').classList.remove('paused');
    
    // Clear existing hyphae
    hyphae = [];
    hyphaCounter = 0;
    currentIteration = 0;
    generationInProgress = true;
    pausedGeneration = false;
    
    // Update config and colors from UI
    updateConfigFromUI();
    updateColorsFromUI();
    
    // Show progress bar
    const progressBar = document.querySelector('.progress');
    progressBar.style.display = 'block';
    
    // Clear existing hyphae in SVG
    const hyphaeGroup = document.querySelector('#svg-container svg #hyphae');
    if (hyphaeGroup) {
        hyphaeGroup.innerHTML = '';
    }
    
    // Update status display
    updateStatusDisplay('Growing...');
    
    // Create initial hyphae
    createInitialHyphae();
    
    // Start animation loop
    animateGrowth();
}

// Pause the growth generation
function pauseGeneration() {
    pausedGeneration = true;
    document.getElementById('generate').textContent = 'Resume';
    document.getElementById('generate').classList.add('paused');
    
    // Cancel animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Update status display
    updateStatusDisplay('Paused');
}

// Resume the growth generation
function resumeGeneration() {
    pausedGeneration = false;
    document.getElementById('generate').textContent = 'Pause';
    document.getElementById('generate').classList.remove('paused');
    
    // Update status display
    updateStatusDisplay('Growing...');
    
    // Restart animation loop
    animateGrowth();
}

// Stop the growth generation
function stopGeneration() {
    generationInProgress = false;
    pausedGeneration = false;
    document.getElementById('generate').textContent = 'Generate';
    document.getElementById('generate').classList.remove('paused');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Hide progress bar
    const progressBar = document.querySelector('.progress');
    progressBar.style.display = 'none';
    
    // Update status display
    updateStatusDisplay('');
}

// Clear the visualization and reset to initial state
function clearVisualization() {
    // Stop any ongoing generation
    if (generationInProgress) {
        stopGeneration();
    }
    
    // Clear existing hyphae
    hyphae = [];
    hyphaCounter = 0;
    currentIteration = 0;
    
    // Reset the SVG container
    const svgContainer = document.getElementById('svg-container');
    if (svgContainer) {
        // Recreate SVG element
        svgContainer.innerHTML = createSvgElement();
    }
    
    // Update status display
    updateStatusDisplay('Visualization cleared');
}

// Update the status display
function updateStatusDisplay(message) {
    const statusElement = document.getElementById('status-display');
    statusElement.textContent = message;
    
    if (message && generationInProgress) {
        if (hyphae.length > 0) {
            statusElement.textContent += ` Iteration: ${currentIteration}/${config.iterations}, Hyphae: ${hyphae.length}/${config.maxHyphae}`;
        }
    }
}

// Create initial hyphae
function createInitialHyphae() {
    // Calculate center area
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    
    for (let i = 0; i < config.initialHyphae; i++) {
        // Position in center area with random offset
        const startX = centerX + (Math.random() * 100 - 50);
        const startY = centerY + (Math.random() * 100 - 50);
        
        // Random angle in all directions
        const startAngle = Math.random() * Math.PI * 2;
        
        // Create initial hypha with variable growth rates for more diversity
        const newHypha = createHypha(startX, startY, startAngle);
        
        // Occasionally create stunted or accelerated initial hyphae (40% chance)
        if (Math.random() < 0.4) {
            newHypha.growth *= Math.random() < 0.5 ? 
                            0.6 + Math.random() * 0.2 : // Stunted (30-40% normal growth)
                            1.3 + Math.random() * 0.3;  // Accelerated (130-160% normal growth)
        }
    }
}

// Animation loop for growth
function animateGrowth() {
    if (!generationInProgress || pausedGeneration) return;
    
    // Update progress
    const progressPercent = (currentIteration / config.iterations) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    
    // Update status display every 5 iterations
    if (currentIteration % 5 === 0) {
        updateStatusDisplay('Growing...');
    }
    
    // Grow hyphae for one iteration
    if (currentIteration < config.iterations) {
        const startTime = performance.now();
        
        // Make a copy of the current hyphae array to avoid issues with adding new hyphae during iteration
        const currentHyphae = [...hyphae];
        
        // Process hyphae in batches for better performance
        const batchSize = 50; // Adjust based on performance testing
        const totalBatches = Math.ceil(currentHyphae.length / batchSize);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * batchSize;
            const end = Math.min(start + batchSize, currentHyphae.length);
            
            for (let i = start; i < end; i++) {
                growHypha(currentHyphae[i]);
            }
        }
        
        // Render only every few iterations for better performance when there are many hyphae
        const renderInterval = hyphae.length > 300 ? 3 : (hyphae.length > 150 ? 2 : 1);
        
        if (currentIteration % renderInterval === 0) {
            renderHyphae();
        }
        
        currentIteration++;
        
        // Adjust frame rate based on complexity to prevent slowdowns
        const elapsed = performance.now() - startTime;
        const delay = Math.max(0, 16 - elapsed); // Target ~60fps with a minimum 16ms frame time
        
        // Continue animation with timeout for performance control
        setTimeout(() => {
            animationId = requestAnimationFrame(animateGrowth);
        }, delay);
    } else {
        // Render final state
        renderHyphae();
        updateStatusDisplay('Generation complete!');
        
        // Mark as completed generation by setting special state
        pausedGeneration = false;  // Not paused, but completed
        generationInProgress = false;  // Not in progress anymore
        document.getElementById('generate').textContent = 'Start New';
    }
}

// Create a new hypha
function createHypha(x, y, angle) {
    hyphaCounter++;
    
    const newHypha = {
        id: hyphaCounter,
        x, y,
        angle,
        length: 0,
        segments: [{x, y}],
        lastSeptaDistance: 0,
        growth: 1.0 + Math.random() * 0.5,
        septas: []
    };
    
    hyphae.push(newHypha);
    
    return newHypha;
}

// Calculate the attraction force from environmental stimuli
function calculateAttractionForce(x, y) {
    let forceX = 0;
    let forceY = 0;
    
    for (const point of config.attractionPoints) {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const force = point.strength / Math.pow(distance, 1.5);
            forceX += dx / distance * force;
            forceY += dy / distance * force;
        }
    }
    
    return { x: forceX, y: forceY };
}

// Grow the hypha one step
function growHypha(hypha) {
    // Increased randomness factor for more chaotic growth
    const randomFactor = 0.4;
    
    // Using more varied randomness patterns with occasional larger jumps
    const randomAngle = (Math.random() * 2 - 1) * randomFactor;
    
    // Add more frequent sharp turns to create more chaotic growth patterns
    const chaosProbability = 0.18;
    const chaosAmplitude = Math.PI/1.8;
    const chaosFactor = Math.random() < chaosProbability ? (Math.random() * chaosAmplitude - chaosAmplitude/2) : 0;
    
    // Calculate attraction force with reduced influence
    const attraction = calculateAttractionForce(hypha.x, hypha.y);
    
    // Occasionally reverse attraction influence for even more chaos (10% chance)
    const attractionMultiplier = Math.random() < 0.1 ? -0.015 : 0.015;
    
    // Update angle based on attraction and increased randomness
    const attractionAngle = Math.atan2(attraction.y, attraction.x);
    const angleDiff = (attractionAngle - hypha.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    hypha.angle += (angleDiff * attractionMultiplier) + randomAngle + chaosFactor;
    
    // Random growth speed variations with wider range for more natural appearance
    const speedVariation = 0.6 + Math.random() * 1.0;
    const growthStep = config.growthSpeed * hypha.growth * speedVariation;
    
    // Calculate new position
    const newX = hypha.x + Math.cos(hypha.angle) * growthStep;
    const newY = hypha.y + Math.sin(hypha.angle) * growthStep;
    
    // Add segment
    hypha.segments.push({ x: newX, y: newY });
    
    // Calculate segment length
    const dx = newX - hypha.x;
    const dy = newY - hypha.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    // Update hypha length
    hypha.length += segmentLength;
    hypha.lastSeptaDistance += segmentLength;
    
    // Add septa if needed
    if (hypha.lastSeptaDistance >= config.septaSpacing) {
        const angle = Math.atan2(newY - hypha.y, newX - hypha.x) + Math.PI / 2;
        const septaLength = 6;
        
        const septaX1 = newX + Math.cos(angle) * septaLength;
        const septaY1 = newY + Math.sin(angle) * septaLength;
        const septaX2 = newX - Math.cos(angle) * septaLength;
        const septaY2 = newY - Math.sin(angle) * septaLength;
        
        hypha.septas.push({
            x1: septaX1,
            y1: septaY1,
            x2: septaX2,
            y2: septaY2
        });
        
        hypha.lastSeptaDistance = 0;
    }
    
    // Try to branch with more varied branching behavior
    if (Math.random() < config.branchProbability && hyphae.length < config.maxHyphae) {
        // Branch from a random previous segment with more flexibility in branching locations
        // Allow branching from anywhere along the hypha for more aerial-like growth
        const minSegmentIndex = Math.max(0, Math.floor(hypha.segments.length * 0.08));
        if (minSegmentIndex < hypha.segments.length - 3) {
            // Occasional multiple branching from same segment for more bushy growth (15% chance)
            const branchCount = Math.random() < 0.15 ? 2 : 1;
            
            for (let i = 0; i < branchCount; i++) {
                const branchSegmentIndex = minSegmentIndex + Math.floor(Math.random() * (hypha.segments.length - 3 - minSegmentIndex));
                const branchSegment = hypha.segments[branchSegmentIndex];
                
                // Calculate branch angle with increased deviation for more outward spreading
                // This creates more orthogonal branching typical of aerial mycelia
                const branchDirection = Math.random() < 0.5 ? 1 : -1; // Randomly choose side to branch
                
                // More extreme branching angles with wider distribution patterns
                // Use a trimodal distribution to create more varied patterns
                let branchAngleOffset;
                const branchTypeRoll = Math.random();
                
                if (branchTypeRoll < 0.6) {
                    // 60% chance of near-perpendicular branching (45-100 degrees)
                    branchAngleOffset = (Math.PI/4 + Math.random() * Math.PI/3) * branchDirection;
                } else if (branchTypeRoll < 0.85) {
                    // 25% chance of acute angle branching (10-45 degrees)
                    branchAngleOffset = (Math.PI/18 + Math.random() * Math.PI/8) * branchDirection;
                } else {
                    // 15% chance of extreme angle (100-150 degrees) for occasional dramatic shifts
                    branchAngleOffset = (Math.PI*5/9 + Math.random() * Math.PI/6) * branchDirection;
                }
                
                const branchAngle = hypha.angle + branchAngleOffset;
                
                // Create branch with more varied growth rates for diversity
                // Occasional stunted branches (20% chance)
                const growthModifier = Math.random() < 0.2 ? 0.5 + Math.random() * 0.3 : 1.0 + Math.random() * 0.5;
                const newHypha = createHypha(branchSegment.x, branchSegment.y, branchAngle);
                newHypha.growth *= growthModifier; // Modify growth rate for more diversity
            }
        }
    }
    
    // Update hypha position
    hypha.x = newX;
    hypha.y = newY;
}

// Render the hyphae to SVG
function renderHyphae() {
    const hyphaeGroup = document.querySelector('#svg-container svg #hyphae');
    if (!hyphaeGroup) return;
    
    hyphaeGroup.innerHTML = '';
    
    for (const hypha of hyphae) {
        const hyphaSvg = generateHyphaSvg(hypha);
        hyphaeGroup.innerHTML += hyphaSvg;
    }
}

// Generate SVG elements for a hypha
function generateHyphaSvg(hypha) {
    // Generate path for the hypha segments
    const pathPoints = hypha.segments.map((segment, index) => 
        index === 0 ? `M ${segment.x} ${segment.y}` : `L ${segment.x} ${segment.y}`
    ).join(' ');
    
    // Generate septa lines
    const septaLines = hypha.septas.map(septa => 
        `<line class="septa" x1="${septa.x1}" y1="${septa.y1}" x2="${septa.x2}" y2="${septa.y2}" />`
    ).join('\n      ');
    
    // Get the last segment (tip position)
    const tipSegment = hypha.segments[hypha.segments.length - 1];
    
    // Calculate spitzenkorper position
    const spkX = tipSegment.x + Math.cos(hypha.angle) * 3;
    const spkY = tipSegment.y + Math.sin(hypha.angle) * 3;
    
    return `
    <g id="hypha-${hypha.id}">
      <path class="hypha" d="${pathPoints}" />
      ${septaLines}
      <circle class="tip" cx="${tipSegment.x}" cy="${tipSegment.y}" r="4" />
      <circle class="spitzenkorper" cx="${spkX}" cy="${spkY}" r="2" />
    </g>`;
}

// Randomize all parameters
function randomizeParameters() {
    // Canvas dimensions (fixed for web version)
    document.getElementById('width').value = 1200;
    document.getElementById('width-value').textContent = 1200;
    document.getElementById('height').value = 800;
    document.getElementById('height-value').textContent = 800;
    
    // Growth parameters
    document.getElementById('initialHyphae').value = randomInt(1, 7);
    document.getElementById('initialHyphae-value').textContent = document.getElementById('initialHyphae').value;
    
    document.getElementById('iterations').value = randomInt(200, 550);
    document.getElementById('iterations-value').textContent = document.getElementById('iterations').value;
    
    document.getElementById('growthSpeed').value = randomFloat(1.5, 5).toFixed(1);
    document.getElementById('growthSpeed-value').textContent = document.getElementById('growthSpeed').value;
    
    document.getElementById('branchProbability').value = randomFloat(0.01, 0.04).toFixed(3);
    document.getElementById('branchProbability-value').textContent = document.getElementById('branchProbability').value;
    
    document.getElementById('maxBranchAngleDegrees').value = randomInt(30, 120);
    document.getElementById('maxBranchAngleDegrees-value').textContent = document.getElementById('maxBranchAngleDegrees').value;
    
    document.getElementById('septaSpacing').value = randomInt(60, 150);
    document.getElementById('septaSpacing-value').textContent = document.getElementById('septaSpacing').value;
    
    document.getElementById('maxHyphae').value = randomInt(100, 300);
    document.getElementById('maxHyphae-value').textContent = document.getElementById('maxHyphae').value;
    
    // Randomize colors
    document.getElementById('background-color').value = randomHslColor(
        { min: 0, max: 360 }, { min: 0, max: 15 }, { min: 92, max: 100 }
    );
    document.getElementById('background-preview').style.backgroundColor = document.getElementById('background-color').value;
    
    document.getElementById('hypha-color').value = randomHslColor(
        { min: 60, max: 200 }, { min: 10, max: 80 }, { min: 20, max: 65 }
    );
    document.getElementById('hypha-preview').style.backgroundColor = document.getElementById('hypha-color').value;
    
    document.getElementById('septa-color').value = randomHslColor(
        { min: 60, max: 200 }, { min: 10, max: 80 }, { min: 20, max: 65 }
    );
    document.getElementById('septa-preview').style.backgroundColor = document.getElementById('septa-color').value;
    
    document.getElementById('tip-color').value = randomHslColor(
        { min: 60, max: 200 }, { min: 15, max: 95 }, { min: 35, max: 80 }
    );
    document.getElementById('tip-preview').style.backgroundColor = document.getElementById('tip-color').value;
    
    document.getElementById('spitzenkorper-color').value = randomHslColor(
        { min: 0, max: 70 }, { min: 65, max: 100 }, { min: 35, max: 75 }
    );
    document.getElementById('spitzenkorper-preview').style.backgroundColor = document.getElementById('spitzenkorper-color').value;
    
    // Randomize attraction points
    const pointCount = randomInt(1, 5);
    const container = document.getElementById('attraction-points-container');
    container.innerHTML = '';
    
    for (let i = 0; i < pointCount; i++) {
        const point = {
            x: randomInt(200, 1100),
            y: randomInt(50, 750),
            strength: randomFloat(0.02, 0.2).toFixed(2)
        };
        
        addAttractionPointUI(point, i);
    }
    
    // Update config from UI
    updateConfigFromUI();
    updateColorsFromUI();
}

// Export current SVG
function exportSvg() {
    const svgElement = document.querySelector('#svg-container svg');
    if (!svgElement) return;
    
    // Create a copy of the SVG element
    const svgCopy = svgElement.cloneNode(true);
    
    // Convert to string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgCopy);
    
    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
    
    // Create a blob from the SVG string
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'fungal_growth.svg';
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the object URL
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

// Helper function: Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function: Random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper function: Generate random HSL color
function randomHslColor(h, s, l) {
    const hValue = randomInt(h.min, h.max);
    const sValue = randomInt(s.min, s.max);
    const lValue = randomInt(l.min, l.max);
    
    // Convert HSL to hex color
    return hslToHex(hValue, sValue, lValue);
}

// Helper function: Convert HSL to Hex
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}