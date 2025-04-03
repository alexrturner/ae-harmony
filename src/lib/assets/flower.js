const GRID_SIZE = 32
const PIXEL_SIZE = 2
const CANVAS_SIZE = GRID_SIZE * PIXEL_SIZE

// Color pairs for flowers (flower color, stem/leaf color)
const COLOR_PAIRS = [
  ['#FF69B4', '#228B22'], // Pink flower, green stem
  ['#FFD700', '#228B22'], // Yellow flower, green stem
  ['#FF4500', '#228B22'], // Orange flower, green stem
  ['#9370DB', '#228B22'], // Purple flower, green stem
  ['#FF0000', '#228B22'], // Red flower, green stem
  ['#FFFFFF', '#228B22'], // White flower, green stem
]

// Flower part templates (1 represents a pixel, 0 represents empty space)
const FLOWER_TEMPLATES = {
  petals: [
    // Basic round flower
    [
      [0, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [0, 1, 1, 0],
    ],
    // Star-shaped flower
    [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ],
    // Cross flower
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  ],
  leaves: [
    // Basic leaf
    [
      [0, 1],
      [1, 0],
    ],
    // Pointed leaf
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
  ],
}

// Compact representation for storing flower data
class FlowerData {
  constructor() {
    this.petalType = Math.floor(Math.random() * FLOWER_TEMPLATES.petals.length)
    this.leafType = Math.floor(Math.random() * FLOWER_TEMPLATES.leaves.length)
    this.colorPair = Math.floor(Math.random() * COLOR_PAIRS.length)
    this.stemHeight = 8 + Math.floor(Math.random() * 8) // 8-15 pixels
    this.leafPositions = [
      4 + Math.floor(Math.random() * 4),
      8 + Math.floor(Math.random() * 4),
    ]
  }

  toJSON() {
    return {
      p: this.petalType,
      l: this.leafType,
      c: this.colorPair,
      s: this.stemHeight,
      lp: this.leafPositions,
    }
  }
}

function drawFlower(ctx, flowerData) {
  const [flowerColor, stemColor] = COLOR_PAIRS[flowerData.colorPair]
  const petalTemplate = FLOWER_TEMPLATES.petals[flowerData.petalType]
  const leafTemplate = FLOWER_TEMPLATES.leaves[flowerData.leafType]

  // Clear canvas
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // Draw stem
  ctx.fillStyle = stemColor
  const stemX = GRID_SIZE / 2
  const stemBottom = GRID_SIZE - 5
  const stemTop = stemBottom - flowerData.stemHeight

  for (let y = stemTop; y <= stemBottom; y++) {
    ctx.fillRect(stemX * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
  }

  // Draw leaves
  flowerData.leafPositions.forEach((y) => {
    const leafY = stemBottom - y
    drawTemplate(
      ctx,
      leafTemplate,
      stemX + (y % 2 ? 1 : -leafTemplate[0].length),
      leafY,
      stemColor,
    )
  })

  // Draw flower
  const flowerX = Math.floor(stemX - petalTemplate[0].length / 2)
  const flowerY = stemTop - petalTemplate.length
  drawTemplate(ctx, petalTemplate, flowerX, flowerY, flowerColor)
}

function drawTemplate(ctx, template, startX, startY, color) {
  ctx.fillStyle = color
  for (let y = 0; y < template.length; y++) {
    for (let x = 0; x < template[y].length; x++) {
      if (template[y][x]) {
        ctx.fillRect(
          (startX + x) * PIXEL_SIZE,
          (startY + y) * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE,
        )
      }
    }
  }
}

function createCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  canvas.style.width = CANVAS_SIZE * 4 + 'px'
  canvas.style.height = CANVAS_SIZE * 4 + 'px'
  return canvas
}

let currentFlowers = []

function generateNewFlowers() {
  const grid = document.getElementById('flowerGrid')
  grid.innerHTML = ''
  currentFlowers = []

  for (let i = 0; i < 12; i++) {
    const flowerData = new FlowerData()
    currentFlowers.push(flowerData)

    const canvas = createCanvas()
    const ctx = canvas.getContext('2d')
    drawFlower(ctx, flowerData)
    grid.appendChild(canvas)
  }

  document.getElementById('jsonOutput').style.display = 'none'
}

function showJSON() {
  const jsonOutput = document.getElementById('jsonOutput')
  jsonOutput.style.display = 'block'
  jsonOutput.textContent = JSON.stringify(
    currentFlowers.map((f) => f.toJSON()),
    null,
    2,
  )
}

// Generate initial flowers
generateNewFlowers()
