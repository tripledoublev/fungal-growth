const fs = require('fs');

// Default configuration parameters for the simulation
const defaultConfig = {
  width: 800,           // SVG canvas width
  height: 600,          // SVG canvas height
  initialHyphae: 4,     // Number of starting hyphae (increased for even more diversity)
  iterations: 350,      // Increased number of growth iterations
  growthSpeed: 3.5,     // Faster growth for more expansive structures
  branchProbability: 0.025, // Higher chance of branching for more chaotic patterns
  maxBranchAngle: Math.PI / 1.5, // Even wider angle range for more diverse directions
  septaSpacing: 100,    // Wider spacing between septa for less density
  maxHyphae: 220,       // Adjusted maximum for better growth potential
  attractionPoints: [   // Environmental stimuli with variable strength for diverse growth patterns
    { x: 500, y: 300, strength: 0.12 },
    { x: 650, y: 150, strength: 0.08 },
    { x: 350, y: 450, strength: 0.14 },
    { x: 750, y: 400, strength: 0.05 }
  ]
};

// Default colors for the various hyphal components
const defaultColors = {
  background: '#f8f8f8',
  hypha: '#436b31',
  septa: '#547a3e',
  tip: '#7aa364',
  spitzenkorper: '#d98032'
};

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let configOverrides = {};
  let colorOverrides = {};
  let outputFile = 'fungal_hyphae.svg';
  
  // Handle JSON input via --config and --colors flags
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && i + 1 < args.length) {
      try {
        configOverrides = JSON.parse(args[i + 1]);
        i++;
      } catch (e) {
        console.error('Error parsing config JSON:', e.message);
      }
    } else if (args[i] === '--colors' && i + 1 < args.length) {
      try {
        colorOverrides = JSON.parse(args[i + 1]);
        i++;
      } catch (e) {
        console.error('Error parsing colors JSON:', e.message);
      }
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputFile = args[i + 1];
      i++;
    }
  }
  
  // Process attraction points separately if provided
  if (configOverrides.attractionPoints && 
      typeof configOverrides.attractionPoints === 'string') {
    try {
      configOverrides.attractionPoints = JSON.parse(configOverrides.attractionPoints);
    } catch (e) {
      console.error('Error parsing attraction points:', e.message);
      delete configOverrides.attractionPoints;
    }
  }
  
  // Merge default config with overrides
  const config = { ...defaultConfig, ...configOverrides };
  
  // Handle maxBranchAngle conversion if provided as degrees
  if (configOverrides.maxBranchAngleDegrees) {
    config.maxBranchAngle = configOverrides.maxBranchAngleDegrees * (Math.PI / 180);
    delete config.maxBranchAngleDegrees;
  }
  
  // Merge default colors with overrides
  const colors = { ...defaultColors, ...colorOverrides };
  
  return { config, colors, outputFile };
}

// Get merged configuration from defaults and command-line args
const { config, colors, outputFile } = parseArgs();

// State variables
let hyphae = [];
let hyphaCounter = 0;

// Create SVG header
function svgHeader() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${colors.background}" />
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
    </filter>
  </defs>
  <style>
    .hypha { fill: none; stroke: ${colors.hypha}; stroke-width: 2; stroke-linecap: round; }
    .septa { stroke: ${colors.septa}; stroke-width: 1; }
    .tip { fill: ${colors.tip}; filter: url(#blur); }
    .spitzenkorper { fill: ${colors.spitzenkorper}; filter: url(#blur); }
  </style>
  <g id="attraction-points">
    ${config.attractionPoints.map(point => 
      `<circle cx="${point.x}" cy="${point.y}" r="${10 * point.strength}" fill="#996633" opacity="0.2" />`
    ).join('\n    ')}
  </g>
  <g id="hyphae">`;
}

// Create SVG footer
function svgFooter() {
  return `
  </g>
  <g id="legend" font-family="Arial" font-size="12" fill="#333">
    <text x="20" y="20">Hypha: Growing fungal filament</text>
    <text x="20" y="40">Green circles: Hyphal tips</text>
    <text x="20" y="60">Orange dots: Spitzenkörper (growth organelle)</text>
    <text x="20" y="80">Cross lines: Septa (cell walls)</text>
  </g>
</svg>`;
}

// Create a new hypha
function createHypha(x, y, angle) {
  hyphaCounter++;
  
  hyphae.push({
    id: hyphaCounter,
    x, y,
    angle,
    length: 0,
    segments: [{x, y}],
    lastSeptaDistance: 0,
    growth: 1.0 + Math.random() * 0.5,
    septas: []
  });
  
  return hyphae[hyphae.length - 1];
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
  const randomFactor = 0.4; // Increased from 0.35
  
  // Using more varied randomness patterns with occasional larger jumps
  const randomAngle = (Math.random() * 2 - 1) * randomFactor;
  
  // Add more frequent sharp turns to create more chaotic growth patterns
  const chaosProbability = 0.18; // Increased from 0.15
  const chaosAmplitude = Math.PI/1.8; // Increased from Math.PI/2
  const chaosFactor = Math.random() < chaosProbability ? (Math.random() * chaosAmplitude - chaosAmplitude/2) : 0;
  
  // Calculate attraction force with reduced influence
  const attraction = calculateAttractionForce(hypha.x, hypha.y);
  
  // Occasionally reverse attraction influence for even more chaos (10% chance)
  const attractionMultiplier = Math.random() < 0.1 ? -0.015 : 0.015; // Variable instead of fixed 0.01
  
  // Update angle based on attraction and increased randomness
  const attractionAngle = Math.atan2(attraction.y, attraction.x);
  const angleDiff = (attractionAngle - hypha.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  hypha.angle += (angleDiff * attractionMultiplier) + randomAngle + chaosFactor;
  
  // Random growth speed variations with wider range for more natural appearance
  const speedVariation = 0.6 + Math.random() * 1.0; // 0.6-1.6 range (widened from 0.7-1.5)
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
    const minSegmentIndex = Math.max(0, Math.floor(hypha.segments.length * 0.08)); // Reduced from 0.1 for branching from earlier points
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

// Run the simulation and generate the SVG
function runSimulation() {
  console.log('Starting fungal hyphae growth simulation...');
  
  // Create initial hyphae with much more varied starting positions and angles
  for (let i = 0; i < config.initialHyphae; i++) {
    // Randomize starting positions along left edge with expanded vertical distribution
    const startY = config.height * 0.1 + Math.random() * (config.height * 0.8); // Expanded from 0.2-0.8 to 0.1-0.9 range
    
    // Randomize X position occasionally for some interior starting points (30% chance)
    const startX = Math.random() < 0.3 ? 100 + Math.random() * (config.width * 0.25) : 100;
    
    // Much wider variation in starting angles for more diverse growth patterns
    // Occasional backward-facing hyphae (15% chance) for even more chaos
    let startAngle;
    if (Math.random() < 0.15) {
      // 15% chance of backward-facing hyphae (15-30 degrees off pure left)
      startAngle = Math.random() < 0.5 ? 
                  Math.PI/6 + Math.random() * Math.PI/6 : // Upper quadrant
                  -Math.PI/6 - Math.random() * Math.PI/6; // Lower quadrant
    } else {
      // 85% chance of forward-facing with wider spread (45 degrees above/below horizontal)
      startAngle = Math.PI + (Math.random() * 1.6 - 0.8); // Range from ~PI*0.2 to ~PI*1.8
    }
    
    // Create initial hypha with variable growth rates for more diversity
    const newHypha = createHypha(startX, startY, startAngle);
    
    // Occasionally create stunted or accelerated initial hyphae (40% chance)
    if (Math.random() < 0.4) {
      newHypha.growth *= Math.random() < 0.5 ? 
                        0.6 + Math.random() * 0.2 : // Stunted (30-40% normal growth)
                        1.3 + Math.random() * 0.3;  // Accelerated (130-160% normal growth)
    }
  }
  
  // Grow hyphae for the specified number of iterations
  for (let iteration = 0; iteration < config.iterations; iteration++) {
    // Make a copy of the current hyphae array to avoid issues with adding new hyphae during iteration
    const currentHyphae = [...hyphae];
    
    for (const hypha of currentHyphae) {
      growHypha(hypha);
    }
    
    // Status update every 50 iterations
    if (iteration % 50 === 0) {
      console.log(`Iteration ${iteration}: ${hyphae.length} hyphae generated`);
    }
  }
  
  console.log(`Simulation complete. Total hyphae: ${hyphae.length}`);
  
  // Generate SVG content
  let svgContent = svgHeader();
  
  // Add all hyphae to the SVG
  for (const hypha of hyphae) {
    svgContent += generateHyphaSvg(hypha);
  }
  
  // Close the SVG
  svgContent += svgFooter();
  
  // Write to file
  fs.writeFileSync(outputFile, svgContent);
  
  console.log(`SVG file generated: ${outputFile}`);
}

// Run the simulation
runSimulation();
