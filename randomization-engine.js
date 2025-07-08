const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration for the randomization engine
const engineConfig = {
  // Number of SVG files to generate
  iterations: 10,
  
  // Output directory for the generated SVGs
  outputDir: 'generated',
  
  // Parameter ranges for randomization
  ranges: {
    // Canvas dimensions - fixed dimensions
    width: { min: 1200, max: 1200 },
    height: { min: 800, max: 800 },
    
    // Growth parameters optimized for more aerial, chaotic growth with increased variability
    initialHyphae: { min: 1, max: 7 },          // Wider range of initial hyphae for more diversity
    iterations: { min: 200, max: 550 },         // Increased iteration range for more growth variability
    growthSpeed: { min: 1.5, max: 5 },          // Wider range for more expansive and variable structures
    branchProbability: { min: 0.01, max: 0.04 }, // Wider range for branching patterns
    maxBranchAngleDegrees: { min: 30, max: 120 }, // Much wider angle range for more diverse branching
    septaSpacing: { min: 60, max: 150 },        // Wider spacing range for variable density
    maxHyphae: { min: 100, max: 300 },          // Wider range for density variation
    
    // Attraction points - will generate between 1-5 attraction points
    // With variable strength and wider distribution for more diverse growth patterns
    attractionPoints: {
      count: { min: 1, max: 5 },                // Wider range of attraction points for more complex growth
      x: { min: 200, max: 1100 },               // Wider x range
      y: { min: 50, max: 750 },                 // Wider y range
      strength: { min: 0.02, max: 0.2 }         // Wider strength range for more diverse growth patterns
    },
    
    // Color ranges (in HSL format for better randomization)
    // With expanded ranges for more visual diversity
    colors: {
      background: { h: { min: 0, max: 360 }, s: { min: 0, max: 15 }, l: { min: 92, max: 100 } }, // Slight variation in background
      hypha: { h: { min: 60, max: 200 }, s: { min: 10, max: 80 }, l: { min: 20, max: 65 } }, // Wider color range for hyphae
      septa: { h: { min: 60, max: 200 }, s: { min: 10, max: 80 }, l: { min: 20, max: 65 } }, // Matching septa colors
      tip: { h: { min: 60, max: 200 }, s: { min: 15, max: 95 }, l: { min: 35, max: 80 } }, // Brighter tips with more variation
      spitzenkorper: { h: { min: 0, max: 70 }, s: { min: 65, max: 100 }, l: { min: 35, max: 75 } } // More vibrant oranges/yellows/reds
    }
  }
};

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomHslColor(h, s, l) {
  const hValue = randomInt(h.min, h.max);
  const sValue = randomInt(s.min, s.max);
  const lValue = randomInt(l.min, l.max);
  return `hsl(${hValue}, ${sValue}%, ${lValue}%)`;
}

// Generate random configuration based on ranges
function generateRandomConfig(index, width, height) {
  // Generate basic config parameters
  const config = {
    width,
    height,
    initialHyphae: randomInt(engineConfig.ranges.initialHyphae.min, engineConfig.ranges.initialHyphae.max),
    iterations: randomInt(engineConfig.ranges.iterations.min, engineConfig.ranges.iterations.max),
    growthSpeed: randomFloat(engineConfig.ranges.growthSpeed.min, engineConfig.ranges.growthSpeed.max),
    branchProbability: randomFloat(engineConfig.ranges.branchProbability.min, engineConfig.ranges.branchProbability.max),
    maxBranchAngleDegrees: randomInt(engineConfig.ranges.maxBranchAngleDegrees.min, engineConfig.ranges.maxBranchAngleDegrees.max),
    septaSpacing: randomInt(engineConfig.ranges.septaSpacing.min, engineConfig.ranges.septaSpacing.max),
    maxHyphae: randomInt(engineConfig.ranges.maxHyphae.min, engineConfig.ranges.maxHyphae.max)
  };
  
  // Generate random attraction points
  const attractionPoints = [];
  const pointCount = randomInt(
    engineConfig.ranges.attractionPoints.count.min, 
    engineConfig.ranges.attractionPoints.count.max
  );
  
  for (let i = 0; i < pointCount; i++) {
    const xMax = engineConfig.ranges.attractionPoints.x.max || width;
    const yMax = engineConfig.ranges.attractionPoints.y.max || height;
    
    attractionPoints.push({
      x: randomInt(engineConfig.ranges.attractionPoints.x.min, xMax),
      y: randomInt(engineConfig.ranges.attractionPoints.y.min, yMax),
      strength: randomFloat(
        engineConfig.ranges.attractionPoints.strength.min,
        engineConfig.ranges.attractionPoints.strength.max
      )
    });
  }
  
  config.attractionPoints = attractionPoints;
  
  return config;
}

// Generate random colors
function generateRandomColors() {
  const { colors } = engineConfig.ranges;
  
  return {
    background: randomHslColor(colors.background.h, colors.background.s, colors.background.l),
    hypha: randomHslColor(colors.hypha.h, colors.hypha.s, colors.hypha.l),
    septa: randomHslColor(colors.septa.h, colors.septa.s, colors.septa.l),
    tip: randomHslColor(colors.tip.h, colors.tip.s, colors.tip.l),
    spitzenkorper: randomHslColor(colors.spitzenkorper.h, colors.spitzenkorper.s, colors.spitzenkorper.l)
  };
}

// Run the main growth script with the generated config
function runGrowthScript(index, config, colors) {
  return new Promise((resolve, reject) => {
    const filename = `fungal_${index.toString().padStart(4, '0')}.svg`;
    const outputPath = path.join(engineConfig.outputDir, filename);
    
    // Create command-line arguments for the script
    const args = [
      'index.js',
      '--config', JSON.stringify(config),
      '--colors', JSON.stringify(colors),
      '--output', outputPath
    ];
    
    console.log(`[${index}/${engineConfig.iterations}] Generating: ${filename}`);
    
    const process = spawn('node', args);
    
    // Handle process events
    process.stdout.on('data', (data) => {
      // Optionally log the output
      // console.log(`stdout: ${data}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        // Save the metadata alongside the SVG
        const metadata = {
          config,
          colors,
          timestamp: new Date().toISOString(),
          filename
        };
        
        const metadataPath = outputPath.replace('.svg', '.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`[${index}/${engineConfig.iterations}] Successfully generated: ${filename}`);
        resolve();
      } else {
        console.error(`[${index}/${engineConfig.iterations}] Process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  let count = engineConfig.iterations;
  
  // Handle iteration count from command line
  if (args.length > 0) {
    const parsedCount = parseInt(args[0], 10);
    if (!isNaN(parsedCount) && parsedCount > 0) {
      count = parsedCount;
    }
  }
  
  console.log(`Starting randomization engine to generate ${count} SVG files...`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(engineConfig.outputDir)) {
    fs.mkdirSync(engineConfig.outputDir, { recursive: true });
    console.log(`Created output directory: ${engineConfig.outputDir}`);
  }
  
  // Generate and execute configurations
  for (let i = 1; i <= count; i++) {
    // Randomize canvas dimensions
    const width = randomInt(engineConfig.ranges.width.min, engineConfig.ranges.width.max);
    const height = randomInt(engineConfig.ranges.height.min, engineConfig.ranges.height.max);
    
    // Generate random configuration
    const config = generateRandomConfig(i, width, height);
    const colors = generateRandomColors();
    
    try {
      // Run the growth script with this configuration
      await runGrowthScript(i, config, colors);
    } catch (error) {
      console.error(`Error generating SVG ${i}: ${error.message}`);
    }
  }
  
  console.log(`Completed generating ${count} SVG files in ${engineConfig.outputDir}/`);
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});