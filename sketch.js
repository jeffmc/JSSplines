// https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Catmull%E2%80%93Rom_spline

// "WASD" to move selected point
// "QE" to select next,prev points
// "R" to move points by randomized step
// "L" toggles linear lines, "P" toggles point boxes, "T" toggles tangents

const ptCt = 10;
const startTheta = 0;
let points = [];
let ptIdx = 0;

let tangents = [];
let tangentsInvalid = true;

let accel = [false, false, false, false]; // left, up, right, down
const speed = 2;
let accels = null; // defined in setup;

const randMag = 10;

const tanMag = 15;

let pointsEnabled = true,
  linearEnabled = false,
  tangentsEnabled = false;

let tensionSlider,
  lastValue = -1;
let curveTimestepSlider;

function setup() {
  createCanvas(500, 500);
  tensionSlider = createSlider(0, 1, 0.5, 0.05);
  curveTimestepSlider = createSlider(0.001, 0.05, 0.01, 0.001);
  accels = [
    createVector(-speed, 0),
    createVector(0, -speed),
    createVector(speed, 0),
    createVector(0, speed),
  ];
  const arc = (2 * PI) / ptCt;
  const rad = 150;
  const cx = width / 2,
    cy = height / 2;
  for (let i = 0; i < ptCt; i++) {
    let theta = i * arc + startTheta;
    points.push(createVector(cx + cos(theta) * rad, cy + sin(theta) * rad));
  }
}

function draw() {
  background(40);
  movePoint();
  if (tensionSlider.value() != lastValue) tangentsInvalid = true;
  if (tangentsInvalid) {
    lastValue = tensionSlider.value();
    calcTangents(1 - lastValue);
    tangentsInvalid = false;
  }
  if (pointsEnabled) {
    drawPoints();
  } else {
    drawSelectedPoint();
  }
  if (linearEnabled) drawLinear();
  if (tangentsEnabled) drawTangents();
  drawCurve();
}

function movePoint() {
  let point = points[ptIdx];
  for (let i = 0; i < 4; i++)
    if (accel[i]) {
      point.add(accels[i]);
      tangentsInvalid = true;
    }
}

function drawPoints() {
  noFill();
  const rad = 5,
    dia = rad * 2;
  for (let i = 0; i < points.length; i++) {
    stroke(40, 220, 220);
    let pt = points[i];
    if (i == ptIdx) stroke(220, 40, 40);
    rect(pt.x - rad, pt.y - rad, dia, dia);
  }
}

function drawSelectedPoint() {
  const rad = 5,
    dia = rad * 2;
  noFill();
  stroke(220, 40, 40);
  let pt = points[ptIdx];
  rect(pt.x - rad, pt.y - rad, dia, dia);
}

function drawLinear() {
  stroke(220);
  let last = points[points.length - 1];
  for (const pt of points) {
    line(pt.x, pt.y, last.x, last.y);
    last = pt;
  }
}

function drawTangents() {
  stroke(220, 40, 220);
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const t = tangents[i];
    line(pt.x, pt.y, pt.x + t.x, pt.y + t.y);
  }
}

function calcTangents(tension) {
  for (let i = 0; i < points.length; i++) {
    const pt = points[i],
      last = points[getIndex(i - 1)],
      next = points[getIndex(i + 1)];
    // tangents[i] = pt.copy().sub(last).add(next.copy().sub(pt)).setMag(tanMag);
    tangents[i] = next.copy().sub(last).mult(tension);
  }
}

function drawCurve() {
  stroke(240, 240, 40);
  const timestep = curveTimestepSlider.value();
  for (let idx = 0; idx < points.length; idx++) {
    let nextIdx = getIndex(idx + 1);
    for (let t = 0; t <= 1; t += timestep) {
      drawPt(idx, nextIdx, t);
    }
  }
}
function drawPt(i0, i1, t) {
  const p0 = points[i0],
    m0 = tangents[i0],
    p1 = points[i1],
    m1 = tangents[i1];
  const tt = t * t,
    ttt = tt * t;
  const fp0 = 2 * ttt - 3 * tt + 1,
    fm0 = ttt - 2 * tt + t,
    fp1 = -2 * ttt + 3 * tt,
    fm1 = ttt - tt;

  point(
    fp0 * p0.x + fm0 * m0.x + fp1 * p1.x + fm1 * m1.x,
    fp0 * p0.y + fm0 * m0.y + fp1 * p1.y + fm1 * m1.y
  );
}

function keyPressed() {
  switch (keyCode) {
    case LEFT_ARROW:
      accel[0] = true;
      break;
    case UP_ARROW:
      accel[1] = true;
      break;
    case RIGHT_ARROW:
      accel[2] = true;
      break;
    case DOWN_ARROW:
      accel[3] = true;
      break;
  }
}

function keyReleased() {
  switch (keyCode) {
    case LEFT_ARROW:
      accel[0] = false;
      break;
    case UP_ARROW:
      accel[1] = false;
      break;
    case RIGHT_ARROW:
      accel[2] = false;
      break;
    case DOWN_ARROW:
      accel[3] = false;
      break;
  }
}

function keyTyped() {
  switch (key) {
    case "q":
      ptIdx--;
      validateIndex();
      break;
    case "e":
      ptIdx++;
      validateIndex();
      break;
    case "r":
      for (const pt of points) pt.add(p5.Vector.random2D().mult(randMag));
      tangentsInvalid = true;
      break;
    case "p":
      pointsEnabled = !pointsEnabled;
      break;
    case "l":
      linearEnabled = !linearEnabled;
      break;
    case "t":
      tangentsEnabled = !tangentsEnabled;
      break;
  }
}

function validateIndex() {
  ptIdx = getIndex(ptIdx);
}

function getIndex(idx) {
  while (idx < 0) idx += points.length;
  return idx % points.length;
}
