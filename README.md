# Fungal Growth Simulation

This project simulates fungal hyphae growth patterns and exports them as SVG files.

## Features

- Simulates fungal hyphae growth with branching, attraction points, and septa formation
- Highly configurable parameters for growth behavior
- Exports SVG visualizations with color customization
- Includes a randomization engine to generate thousands of varied outputs

## Scripts

### index.js

The main simulation script that generates a single SVG based on configuration parameters.

#### Usage

```bash
node index.js [options]
```

#### Options

- `--config <json>`: JSON string with configuration parameters
- `--colors <json>`: JSON string with color parameters
- `--output <path>`: Output SVG file path (default: fungal_hyphae.svg)

#### Example

```bash
node index.js --config '{"width":1000,"height":800,"iterations":400}' --output custom_growth.svg
```

### randomization-engine.js

A script to generate multiple SVG exports with randomized parameters.

#### Usage

```bash
node randomization-engine.js [count]
```

- `count`: Number of SVG files to generate (default: 10)

#### Configuration

Edit the `engineConfig` object in the script to customize:

- Number of iterations
- Output directory
- Parameter ranges for randomization

## Configuration Parameters

The growth simulation accepts the following configuration parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| width | SVG canvas width | 800 |
| height | SVG canvas height | 600 |
| initialHyphae | Number of starting hyphae | 3 |
| iterations | Number of growth iterations | 300 |
| growthSpeed | How far each hypha grows per iteration | 2 |
| branchProbability | Chance of branching per iteration | 0.03 |
| maxBranchAngle | Maximum angle of branching (radians) | Math.PI / 4 |
| maxBranchAngleDegrees | Alternative way to specify maxBranchAngle in degrees | - |
| septaSpacing | Distance between septa (cross-walls) | 30 |
| maxHyphae | Maximum number of hyphae to generate | 500 |
| attractionPoints | Array of points that influence growth direction | See code |

## Color Parameters

The following color parameters can be customized:

| Parameter | Description | Default |
|-----------|-------------|---------|
| background | Background color | '#f8f8f8' |
| hypha | Main hypha color | '#436b31' |
| septa | Septa (cross-walls) color | '#547a3e' |
| tip | Hyphal tip color | '#7aa364' |
| spitzenkorper | Spitzenkörper (growth organelle) color | '#d98032' |

## Generated Output

The randomization engine creates:
- SVG files in the specified output directory
- JSON metadata files with the corresponding parameters

## Example

To generate 1000 random SVG files:

```bash
node randomization-engine.js 1000
```

The files will be saved in the `generated/` directory by default.