import { Camera } from "./helpers_oblig1/Camera.js";
import { WebGLCanvas } from "./helpers_oblig1/WebGLCanvas.js";
import { Shader, LocationType, DataType } from "./helpers_oblig1/WebGLShader.js";
import { handleTime, initKeyPress } from "./lib_oblig1/utility-functions.js";
import { Coords } from "./shapes_oblig1/coord.js";
import { FpsInfo } from "./helpers_oblig1/fpsInfo.js";
import { Cube } from "./shapes_oblig1/cube.js";
import { RenderMatrices } from "./helpers_oblig1/renderMatrices.js";
import { Color } from "./helpers_oblig1/color.js";
import { XZPlane } from "./shapes_oblig1/xzPlane.js";
import { Disc } from "./shapes_oblig1/disc.js";
import { Sphere } from "./shapes_oblig1/sphere.js";
import { Cylinder } from "./shapes_oblig1/cylinder.js";
import { Square } from "./shapes_oblig1/square.js";
import { Triangle } from "./shapes_oblig1/triangle.js";

const baseFragShader = document.getElementById("base-frag-shader").innerHTML;
const baseVertShader = document.getElementById("base-vert-shader").innerHTML;

const coordVertShader = document.getElementById("coord-vert-shader").innerHTML;
const coordFragShader = document.getElementById("coord-frag-shader").innerHTML;

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
const baseShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f
  },
  {
    name: "aVertexColor",
    locationType: LocationType.IN,
    dataType: DataType.VEC4f
  },
  {
    name: "uModelViewMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
  {
    name: "uProjectionMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
]

/**@type {{name: string; locationType: LocationType, dataType: DataType}[]} */
const coordShaderVariables = [
  {
    name: "aVertexPosition",
    locationType: LocationType.IN,
    dataType: DataType.VEC3f
  },
  {
    name: "uColor",
    locationType: LocationType.UNIFORM,
    dataType: DataType.VEC4f
  },
  {
    name: "uModelViewMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
  {
    name: "uProjectionMatrix",
    locationType: LocationType.UNIFORM,
    dataType: DataType.MAT4f
  },
]

let cubeColor = new Color([0.8, 0.8, 0.0, 1.0]);
let colorChannelMain = new Color([0.9, 0.9, 0.9, 1.0]);
let colorGray = new Color([0.3, 0.3, 0.3, 1.0]);
let colorGreen = new Color([0.1, 0.6, 0.1, 1.0]);

const HOUSEHEIGHT = 6;
const FLOORHEIGHT = 2.4;
const WALLTHICKNESS = 0.2;

const HOUSEDIMENTIONS = {
  x: 8,
  y: HOUSEHEIGHT,
  z: 6,
  walls: { thickness: WALLTHICKNESS, y: FLOORHEIGHT },
  door: { thickness: WALLTHICKNESS / 2, x: 0.8, y: FLOORHEIGHT },
  windows: { thickness: 0.01, x: 0.8, y: 0.8 },
}

// ------------------------

export const main = () => {
  const canvas = new WebGLCanvas("canvas", 720, 720);
  const aspectRatio = canvas.aspectRatio;
  const gl = canvas.gl;

  // SHADERS --------------------------

  const baseShader = new Shader(gl, baseVertShader, baseFragShader);
  baseShader.findLocations(baseShaderVariables);

  const coordShader = new Shader(gl, coordVertShader, coordFragShader);
  coordShader.findLocations(coordShaderVariables);

  // OBJECTS AND CAMERA ---------------

  const camera = new Camera(
    {
      // projectionOptions
      fov: 30,
      aspectRatio: aspectRatio,
      near: 0.1,
      far: 10000,
    },
  );

  const coords = new Coords(gl, baseShader, camera, 80);
  coords.bindBuffers();

  const square = new Square(gl, coordShader, camera);
  square.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...square._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(colorGray.raw) } },
    ]
  });
  square.bindBuffers();

  const triangle = new Triangle(gl, coordShader, camera);
  triangle.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...triangle._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(cubeColor.raw) } },
    ]
  });
  triangle.bindBuffers();

  const disc = new Disc(gl, coordShader, camera, 20);
  disc.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...disc._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(colorChannelMain.raw) } },
    ]
  });
  disc.bindBuffers();

  const sphere = new Sphere(gl, coordShader, camera);
  sphere.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...sphere._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(colorGreen.raw) } },
    ]
  });
  sphere.bindBuffers();

  const cylinder = new Cylinder(gl, coordShader, camera, 20);
  cylinder.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...cylinder._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(colorChannelMain.raw) } },
    ]
  });
  cylinder.bindBuffers();

  const xzPlane = new XZPlane(gl, coordShader, camera, { amount: 100, spacing: 1, length: 50 });
  xzPlane.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...xzPlane._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(colorChannelMain.raw) } },
    ]
  });
  xzPlane.bindBuffers();

  const cube = new Cube(gl, baseShader, camera);

  cube.swapShader(coordShader);
  cube.setShaderRelationship({
    attributes: [
      { name: "aVertexPosition", getBuffer: (self) => { return self.positionBuffer } },
    ],
    uniforms: [
      ...cube._uniformBindings,
      { name: "uColor", getValue: () => { return new Float32Array(cubeColor.raw) } },
    ]
  });
  cube.bindBuffers();

  // RENDERINFO -----------------------

  /**
    * @type {{
    *   gl: WebGL2RenderingContext,
    *   canvas: WebGLCanvas;
    *   camera: Camera,
    *   matrices: RenderMatrices;
    *   coords: Coords;
    *   xzPlane: XZPlane,
    *   square: Square;
    *   triangle: Triangle;
    *   disc: Disc;
    *   sphere: Sphere;
    *   cylinder: Cylinder;
    *   cube: Cube;
    *   fpsInfo: FpsInfo;
    *   keysPressed: Record<string, boolean>;
    *   animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}}
  */
  const renderInfo = {
    gl: gl,
    canvas: canvas,
    camera: camera,
    coords: coords,
    xzPlane: xzPlane,
    square: square,
    triangle: triangle,
    disc: disc,
    sphere: sphere,
    cylinder: cylinder,
    cube: cube,
    matrices: new RenderMatrices(),
    fpsInfo: new FpsInfo("fps"),
    keysPressed: [],
    animations: { clockRotationHour: 0, clockRotationMinute: 0, doorRotationY: 45 }
  }
  
  initKeyPress(renderInfo.keysPressed);
  animate(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 */
function animate(renderInfo) {
  const fps = renderInfo.fpsInfo;

  window.requestAnimationFrame((currentTime) => {
    fps.updateFps(currentTime);
    animate(renderInfo);
  })

  fps.showFps();
  
  renderInfo.camera.handleKeys(renderInfo.keysPressed, fps.dt);
  handleDoorKeys(renderInfo.keysPressed, renderInfo.animations, fps.dt);

  handleTime(renderInfo.animations);
  
  renderInfo.canvas.clear({ r: 0.8, g: 0.8, b: 0.8, a: 1.0 });

  drawMain(renderInfo);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 */
function drawMain(renderInfo) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  // COORDS
  modelMatrix.setIdentity();
  renderInfo.coords.draw(matrices);

  colorChannelMain.set([0.0, 0.0, 0.4, 1.0]);

  // XZPLANE
  modelMatrix.setIdentity();
  renderInfo.xzPlane.draw(matrices);

  colorChannelMain.set([0.9, 0.9, 0.9, 1.0]);
  cubeColor.set([0.8, 0.8, 0.0, 1.0]);
  colorGray.set([0.3, 0.3, 0.3, 1.0]);

  // GROUND FLOOR
  drawFlooring(renderInfo, {
    x: 0,
    y: 0.015,
    z: 0
    }, {
    x: HOUSEDIMENTIONS.x,
    y:0.1,
    z: HOUSEDIMENTIONS.z
  });

  colorGray.set([0.2, 0.2, 0.2, 1.0])

  // FRONT WALL WHERE DOOR IS
  drawWallWithWindowHole(renderInfo, {
    x: (HOUSEDIMENTIONS.x + (HOUSEDIMENTIONS.door.x / 2)) / 2,
    y: 0,
    z: (HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness)
  });
  drawWallWithWindowHole(renderInfo, {
    x: -(HOUSEDIMENTIONS.x + (HOUSEDIMENTIONS.door.x / 2)) / 2,
    y: 0,
    z: (HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness)
  });

  cubeColor.set([0.6, 0.6, 0.0, 1.0]);
  
  // BACKWALL
  drawBackWall(renderInfo, {
    x: 0,
    y: 0,
    z: -HOUSEDIMENTIONS.z + HOUSEDIMENTIONS.walls.thickness,
  })

  cubeColor.set([0.7, 0.7, 0.0, 1.0]);

  // SIDEWALLS
  drawSideWall(renderInfo, {
    x: HOUSEDIMENTIONS.x - HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: 0
  });

  drawSideWall(renderInfo, {
    x: -HOUSEDIMENTIONS.x + HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: 0
  });
  
  // 2ND FLOOR 
  drawFlooring(renderInfo, {
    x: HOUSEDIMENTIONS.x / 6,
    y: 0.015 + HOUSEDIMENTIONS.walls.y * 2,
    z: 0
    }, {
    x: HOUSEDIMENTIONS.x - HOUSEDIMENTIONS.x / 6,
    y:0.1,
    z: HOUSEDIMENTIONS.z
  });
  drawFlooring(renderInfo, {
    x: -HOUSEDIMENTIONS.x + HOUSEDIMENTIONS.x / 6,
    y: 0.015 + HOUSEDIMENTIONS.walls.y * 2,
    z: +HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.z / 1.5
    }, {
    x: HOUSEDIMENTIONS.x / 6,
    y:0.1,
    z: HOUSEDIMENTIONS.z / 1.5
  });
  
  // ROOF
  drawRoofPiece(renderInfo, {
    x: 0,
    y: HOUSEDIMENTIONS.walls.y * 1.8 + Math.sqrt( HOUSEDIMENTIONS.z^2 + HOUSEDIMENTIONS.y^2 ),
    z: -Math.sqrt( HOUSEDIMENTIONS.z^2 + HOUSEDIMENTIONS.y^2 ) + HOUSEDIMENTIONS.walls.thickness
  }, 45)
  drawRoofPiece(renderInfo, {
    x: 0,
    y: HOUSEDIMENTIONS.walls.y * 1.8 + Math.sqrt( HOUSEDIMENTIONS.z^2 + HOUSEDIMENTIONS.y^2 ),
    z: Math.sqrt( HOUSEDIMENTIONS.z^2 + HOUSEDIMENTIONS.y^2 ) - HOUSEDIMENTIONS.walls.thickness
  }, -45)

  cubeColor.set([0.6, 0.6, 0.0, 1.0]);

  // WALLS ON 2ND FLOOR
  drawWalls2ndFloor(renderInfo, {
    x: HOUSEDIMENTIONS.x,
    y: HOUSEDIMENTIONS.y + 1.8,
    z: 0
  })
  drawWalls2ndFloor(renderInfo, {
    x: -HOUSEDIMENTIONS.x,
    y: HOUSEDIMENTIONS.y + 1.8,
    z: 0
  })

  cubeColor.set([0.2, 0.2, 0.2, 1.0]);

  // CORNER PIECES
  drawCorner(renderInfo, {
    x: -HOUSEDIMENTIONS.x + HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: -HOUSEDIMENTIONS.z + HOUSEDIMENTIONS.walls.thickness
  });
  drawCorner(renderInfo, {
    x: +HOUSEDIMENTIONS.x - HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: -HOUSEDIMENTIONS.z + HOUSEDIMENTIONS.walls.thickness
  });
  drawCorner(renderInfo, {
    x: +HOUSEDIMENTIONS.x - HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: +HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness
  });
  drawCorner(renderInfo, {
    x: -HOUSEDIMENTIONS.x + HOUSEDIMENTIONS.walls.thickness,
    y: 0,
    z: +HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness
  });

  cubeColor.set([0.2, 0.4, 0.2, 1.0]);

  // DOOR
  drawDoor(renderInfo, {
    x: 0,
    y: 0,
    z: HOUSEDIMENTIONS.z - 0.015
  })

  colorGray.set([0.0, 0.1, 0.7, 0.3])

  // CLOCK
  drawClock(renderInfo, {
    x: HOUSEDIMENTIONS.x / 5,
    y: HOUSEDIMENTIONS.walls.y,
    z: HOUSEDIMENTIONS.z - 0.05 + HOUSEDIMENTIONS.walls.thickness / 2
  });

  cubeColor.set([0.59, 0.29, 0.0, 1.0]);
  colorChannelMain.set([0.59, 0.29, 0.0, 1.0])

  // CHIMNEY
  drawChimney(renderInfo, {
    x: HOUSEDIMENTIONS.x / 2,
    y: HOUSEDIMENTIONS.y * 0.9,
    z: -HOUSEDIMENTIONS.z + HOUSEDIMENTIONS.walls.thickness * 6
  })

  // TREES
  drawTree(renderInfo,
    { x: 10, y: 0, z: 10 },
    { x: 1, y: 5, z: 1 }
  );

  drawTree(renderInfo,
    { x: -10, y: 0, z: 10 },
    { x: 0.6, y: 3, z: 0.6 }
  );

  drawTree(renderInfo,
    { x: -5, y: 0, z: 13 },
    { x: 0.8, y: 6, z: 0.8 }
  );

  drawTree(renderInfo,
    { x: 5, y: 0, z: 13 },
    { x: 0.7, y: 4, z: 0.7 }
  );

  // WINDOWS
  drawWindow(renderInfo, {
    x: (HOUSEDIMENTIONS.x + (HOUSEDIMENTIONS.door.x / 2)) / 2,
    y: 0,
    z: (HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness)
  })
  drawWindow(renderInfo, {
    x: -(HOUSEDIMENTIONS.x + (HOUSEDIMENTIONS.door.x / 2)) / 2,
    y: 0,
    z: (HOUSEDIMENTIONS.z - HOUSEDIMENTIONS.walls.thickness)
  })
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawWallWithWindowHole(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  const wideShortPartHeight = (HOUSEDIMENTIONS.walls.y - HOUSEDIMENTIONS.windows.y) / 2;
  const wideShortPartWidth = HOUSEDIMENTIONS.x / 2 - HOUSEDIMENTIONS.door.x / 1.4;

  const slimTallPartHeight = HOUSEDIMENTIONS.windows.y;
  const slimTallPartWidth = wideShortPartWidth / 2 - HOUSEDIMENTIONS.windows.x;

  // Lower part of wall
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + wideShortPartHeight,
    worldPos.z
  );
  modelMatrix.scale(
    wideShortPartWidth,
    wideShortPartHeight,
    HOUSEDIMENTIONS.walls.thickness
  );
  renderInfo.cube.draw(matrices);

  // Top part of wall
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + wideShortPartHeight * 3 + slimTallPartHeight * 2,
    worldPos.z
  );
  modelMatrix.scale(
    wideShortPartWidth,
    wideShortPartHeight,
    HOUSEDIMENTIONS.walls.thickness
  );
  renderInfo.cube.draw(matrices);

  // RIGHT MIDDLE PART OF WALL
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x + slimTallPartWidth + HOUSEDIMENTIONS.windows.x + 0.8,
    worldPos.y + wideShortPartHeight + slimTallPartHeight * 2,
    worldPos.z
  );
  modelMatrix.scale(
    slimTallPartWidth,
    slimTallPartHeight,
    HOUSEDIMENTIONS.walls.thickness
  );
  renderInfo.cube.draw(matrices);

  // LEFT MIDDLE PART OF WALL
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x - (slimTallPartWidth + HOUSEDIMENTIONS.windows.x + 0.8),
    worldPos.y + wideShortPartHeight + slimTallPartHeight * 2,
    worldPos.z
  );
  modelMatrix.scale(
    slimTallPartWidth,
    slimTallPartHeight,
    HOUSEDIMENTIONS.walls.thickness
  );
  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 * @param {{x: number, y: number, z: number}} scale 
 */
function drawFlooring(renderInfo, worldPos, scale) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z
  );
  modelMatrix.scale(
    scale.x,
    scale.y,
    scale.z
  );

  renderInfo.square.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawSideWall(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + HOUSEDIMENTIONS.walls.y,
    worldPos.z
  );
  
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.scale(
    HOUSEDIMENTIONS.z,
    HOUSEDIMENTIONS.walls.y,
    HOUSEDIMENTIONS.walls.thickness
  );
  
  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawBackWall(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + HOUSEDIMENTIONS.walls.y,
    worldPos.z
  );
  modelMatrix.scale(
    HOUSEDIMENTIONS.x,
    HOUSEDIMENTIONS.walls.y,
    HOUSEDIMENTIONS.walls.thickness
  )

  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 * @param {number} rotation 
 */
function drawRoofPiece(renderInfo, worldPos, rotation) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  const roofLength = Math.sqrt(HOUSEDIMENTIONS.z ^ 2 + HOUSEDIMENTIONS.y ^ 2);

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z
  );

  modelMatrix.rotate(rotation, 1, 0, 0);
  modelMatrix.scale(
    HOUSEDIMENTIONS.x * 1.2,
    roofLength + HOUSEDIMENTIONS.walls.thickness + 1,
    HOUSEDIMENTIONS.walls.thickness
  )

  renderInfo.cube.draw(matrices);
  
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawCorner(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + HOUSEDIMENTIONS.walls.y + 0.05,
    worldPos.z
  );
  modelMatrix.scale(
    HOUSEDIMENTIONS.walls.thickness * 2,
    HOUSEDIMENTIONS.walls.y + 0.1,
    HOUSEDIMENTIONS.walls.thickness * 2
  )

  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawDoor(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x - HOUSEDIMENTIONS.door.x,
    worldPos.y + HOUSEDIMENTIONS.walls.y,
    worldPos.z
  );

  modelMatrix.rotate(renderInfo.animations.doorRotationY, 0, 1, 0);

  modelMatrix.translate(HOUSEDIMENTIONS.door.x, 0, 0);
  
  modelMatrix.scale(
    HOUSEDIMENTIONS.door.x,
    HOUSEDIMENTIONS.door.y,
    HOUSEDIMENTIONS.door.thickness
  )

  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawWalls2ndFloor(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z
  );

  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(HOUSEDIMENTIONS.z / 2, 1, HOUSEDIMENTIONS.z);

  renderInfo.triangle.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawWindow(renderInfo, worldPos) {
  const gl = renderInfo.gl;
  
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  const wideShortPartHeight = (HOUSEDIMENTIONS.walls.y - HOUSEDIMENTIONS.windows.y) / 2;
  const slimTallPartHeight = HOUSEDIMENTIONS.windows.y;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + wideShortPartHeight + slimTallPartHeight * 2,
    worldPos.z 
  );

  modelMatrix.rotate(90, 1, 0, 0);
  
  modelMatrix.scale(
    HOUSEDIMENTIONS.windows.x * 2,
    HOUSEDIMENTIONS.windows.y,
    1,
  );
  renderInfo.square.draw(matrices, gl.TRIANGLES, true);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawClock(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  // DISC
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z 
  );

  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(0.7, 0.7, 0.7);

  renderInfo.disc.draw(matrices);

  // MINUTE
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z + 0.05 
  );

  modelMatrix.rotate(-renderInfo.animations.clockRotationMinute, 0, 0, 1);

  modelMatrix.translate(0, 0.3, 0)
  
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.rotate(90, 0, 1, 0);
  
  
  modelMatrix.scale(0.3, 1, 0.1);
  
  renderInfo.triangle.draw(matrices);

  // HOUR
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z + 0.05 
  );

  modelMatrix.rotate(-renderInfo.animations.clockRotationHour, 0, 0, 1);

  modelMatrix.translate(0, 0.2, 0)
  
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.rotate(90, 0, 1, 0);
  
  modelMatrix.scale(0.2, 1, 0.1);
  
  renderInfo.triangle.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 */
function drawChimney(renderInfo, worldPos) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + 0.05,
    worldPos.z
  );

  modelMatrix.scale(0.5, worldPos.y, 0.5);

  renderInfo.cube.draw(matrices);
}

/**
 * @param {{
 *  gl: WebGL2RenderingContext,
 *  canvas: WebGLCanvas;
 *  camera: Camera;
 *  matrices: RenderMatrices;
 *  coords: Coords;
 *  xzPlane: XZPlane;
 *  square: Square;
 *  triangle: Triangle;
 *  disc: Disc;
 *  sphere: Sphere;
 *  cylinder: Cylinder;
 *  cube: Cube;
 *  fpsInfo: FpsInfo;
 *  keysPressed: Record<string, boolean>;
 *  animations: { doorRotationY: number; clockRotationHour: number, clockRotationMinute: number }}} renderInfo
 * @param {{x: number; y: number; z: number;}} worldPos 
 * @param {{x: number, y: number, z: number}} scale 
 */
function drawTree(renderInfo, worldPos, scale) {
  const matrices = renderInfo.matrices;
  const modelMatrix = matrices.modelMatrix;

  // TREE STEM
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y,
    worldPos.z
  );
  modelMatrix.scale(
    scale.x,
    scale.y,
    scale.z
  );

  renderInfo.cylinder.draw(matrices);

  const scaleFactor = Math.min(scale.x, scale.y, scale.z) * 2;

  // TOP PART OF TREE
  modelMatrix.setIdentity();
  modelMatrix.translate(
    worldPos.x,
    worldPos.y + scale.y,
    worldPos.z
  );
  modelMatrix.scale(
    scaleFactor,
    scaleFactor,
    scaleFactor
  );

  renderInfo.sphere.draw(matrices, renderInfo.gl.TRIANGLES);
}

/**
 * @param {Record<string, boolean>} keysPressed 
 * @param {{ doorRotationY: number; clockRotationHour: number }} animations 
 * @param {number} dt 
 */
function handleDoorKeys(keysPressed, animations, dt) {
  if (keysPressed['KeyJ']) {
    if (animations.doorRotationY > 90) {
      animations.doorRotationY = 90;
    } else if (animations.doorRotationY < 0) {
      animations.doorRotationY = 0;
    } else {
      animations.doorRotationY += 100 * dt;
    }
  }

  if (keysPressed['KeyK']) {
    if (animations.doorRotationY > 90) {
      animations.doorRotationY = 90;
    } else if (animations.doorRotationY < 0) {
      animations.doorRotationY = 0;
    } else {
      animations.doorRotationY -= 100 * dt;
    }
  }
}
