const COLUMN_N = ROW_N = 3;
const WIDTH = HEIGHT = 1000;
const MARGIN = 50;
const BLOCK_SIZE = 300;

const BLOCK_POSITIONS = [];
for (let i = 0; i < ROW_N; i++) {
  for (let j = 0; j < COLUMN_N; j++) {
    BLOCK_POSITIONS.push([i, j]);
  }
}

const choose = (array) => array[Math.floor(Math.random() * array.length)];
const shuffle = (array) => array.sort(_ => Math.random() - 0.5);

class Block {
  constructor() {
    this.char = "";
    this.alpha = 1.0;
    this.isFading = false;
  }

  update() {
    if (this.isFading) {
      this.alpha = Math.max(0.0, this.alpha - 0.05);
    } else {
      this.alpha = Math.min(1.0, this.alpha + 0.05);
    }
  }

  draw(row, column) {
    btx.save();
    btx.font = BLOCK_SIZE + "px serif";
    btx.fillStyle = `rgb(0, 0, 0, ${this.alpha})`;
    btx.textAlign = "center";
    btx.textBaseline = "middle";
    if (player.row === row && player.column === column && player.isDragging) {
      btx.fillText(this.char, player.x, player.y);
    } else {
      const x = MARGIN + BLOCK_SIZE * 0.5 + BLOCK_SIZE * column;
      const y = MARGIN + BLOCK_SIZE * 0.5 + BLOCK_SIZE * row;
      btx.fillText(this.char, x, y);
    }
    btx.restore();
  }
}

class Board {
  constructor() {
    this.grid = [];
    for (let i = 0; i < ROW_N; i++) {
      const row = [];
      for (let j = 0; j < COLUMN_N; j++) {
        row.push(new Block());
      }
      this.grid.push(row);
    }
    this.fillGrid();

    this.isRefilling = false;
  }

  update() {
    for (let [i, j] of BLOCK_POSITIONS) {
      let block = this.grid[i][j];
      if (block.isFading && block.alpha === 0.0) {
        block.char = "";
        this.isRefilling = true;
      }
    }

    if (this.isRefilling) {
      this.fillGrid();
      for (let [i, j] of BLOCK_POSITIONS) {
        let block = this.grid[i][j];
        block.isFading = false;
      }
      this.isRefilling = false;
    }

    for (let [i, j] of BLOCK_POSITIONS) {
      board.grid[i][j].update();
    }
  }

  draw() {
    for (let [i, j] of BLOCK_POSITIONS) {
      this.grid[i][j].draw(i, j);
    }
  }

  fillGrid() {
    let newBlocks = [];
    for (let [i, j] of BLOCK_POSITIONS) {
      if (this.grid[i][j].char !== "") continue;
      newBlocks.push([i, j]);
      this.grid[i][j].char = choose(Object.keys(kanjiData));
    }

    if (this.gridIsPerfect()) return;

    const shuffledNewBlocks = shuffle(newBlocks);
    for (let [i1, j1] of shuffledNewBlocks) {
      let distantBlocks = [];
      for (let [i2, j2] of BLOCK_POSITIONS) {
        if (i1 === i2 && Math.abs(j1 - j2) <= 1) continue;
        if (Math.abs(i1 - i2) <= 1 && j1 === j2) continue;
        distantBlocks.push([i2, j2]);
      }
      let shuffledDistantBlocks = shuffle(distantBlocks);

      for (let [i2, j2] of shuffledDistantBlocks) {
        let char2 = this.grid[i2][j2].char;
        let idioms = kanjiData[char2];
        let idiom = choose(idioms);
        if (idiom[0] === char2) this.grid[i1][j1].char = idiom[1];
        if (idiom[1] === char2) this.grid[i1][j1].char = idiom[0];
        if (this.gridIsPerfect()) return;
      }
    }
  }

  findFormingIdioms() {
    const blocks = [];
    for (let [i, j] of BLOCK_POSITIONS) {
      let idioms = kanjiData[this.grid[i][j].char];
      if (idioms === undefined) continue;
      if (i > 0 && idioms.includes(this.grid[i - 1][j].char + this.grid[i][j].char)) blocks.push([i - 1, j], [i, j]);
      if (i < 2 && idioms.includes(this.grid[i][j].char + this.grid[i + 1][j].char)) blocks.push([i, j], [i + 1, j]);
      if (j > 0 && idioms.includes(this.grid[i][j - 1].char + this.grid[i][j].char)) blocks.push([i, j - 1], [i, j]);
      if (j < 2 && idioms.includes(this.grid[i][j].char + this.grid[i][j + 1].char)) blocks.push([i, j], [i, j + 1]);
    }
    return [...new Set(blocks)];
  }

  findPossibleIdioms() {
    const idioms = [];
    for (let blockPos1 of BLOCK_POSITIONS) {
      for (let blockPos2 of BLOCK_POSITIONS) {
        let [i1, j1] = blockPos1;
        let [i2, j2] = blockPos2;
        if (i1 == i2 && j1 == j2) continue;
        let char1 = this.grid[i1][j1].char;
        let char2 = this.grid[i2][j2].char;
        let couple = char1 + char2;
        let idioms1 = kanjiData[char1];
        let idioms2 = kanjiData[char2];
        if (idioms1 !== undefined) idioms.push(...kanjiData[char1].filter(idiom => idiom === couple));
        if (idioms2 !== undefined) idioms.push(...kanjiData[char2].filter(idiom => idiom === couple));
      }
    }
    return [...new Set(idioms)];
  }

  gridIsPerfect() {
    return this.findPossibleIdioms().length > 0 &&
      this.findFormingIdioms().length === 0;
  }
}

class Player {
  constructor() {
    this.x;
    this.y;
    this.column;
    this.row;
    this.isDragging = false;
  }

  update(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = isMobile ? e.touches[0].clientX : e.clientX;
    const clientY = isMobile ? e.touches[0].clientY : e.clientY;
    this.x = (clientX - rect.left) / canvas.width * buffer.width;
    this.y = (clientY - rect.top) / canvas.width * buffer.width;
  }
}

const onTouchStart = (e) => {
  player.isDragging = true;
  player.update(e);
  const column = Math.floor((player.x - MARGIN) / BLOCK_SIZE);
  const row = Math.floor((player.y - MARGIN) / BLOCK_SIZE);

  if (row < 0 || 2 < row || column < 0 || 2 < column) return;

  player.column = column;
  player.row = row;
}

const onTouchEnd = (e) => {
  player.isDragging = false;
  const blocks = board.findFormingIdioms();
  for (let [i, j] of blocks) {
    board.grid[i][j].isFading = true;
  }
}

const onTouchMove = (e) => {
  player.update(e);
  if (!player.isDragging) return;

  const column = Math.floor((player.x - MARGIN) / BLOCK_SIZE);
  const row = Math.floor((player.y - MARGIN) / BLOCK_SIZE);

  if (row < 0 || 2 < row || column < 0 || 2 < column) return;
  if (player.column === column && player.row === row) return;

  if (player.column === undefined || player.row === undefined) return;
  [
    board.grid[row][column],
    board.grid[player.row][player.column]
  ] = [
    board.grid[player.row][player.column],
    board.grid[row][column]
  ];
  player.column = column;
  player.row = row;
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const resize = () => {
  const aspect = 1;
  if (window.innerWidth / aspect < window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth / aspect;
  } else {
    canvas.width = window.innerHeight * aspect;
    canvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resize, false);
resize();

const buffer = document.createElement("canvas");
const btx = buffer.getContext("2d");
buffer.width = WIDTH;
buffer.height = HEIGHT;

const isMobile = "ontouchstart" in window;

const board = new Board();
const player = new Player();

const update = () => {
  board.update();
}

const draw = () => {
  btx.fillStyle = "gray";
  btx.fillRect(0, 0, buffer.width, buffer.height);

  board.draw();
}

const render = () => {
  update();
  draw();

  ctx.drawImage(
    buffer,
    0, 0, buffer.width, buffer.height,
    0, 0, canvas.width, canvas.height
  );

  window.requestAnimationFrame(render);
}

window.onload = render;

if (isMobile) {
  window.ontouchstart = onTouchStart;
  window.ontouchend = onTouchEnd;
  window.ontouchmove = onTouchMove;
} else {
  window.onmousedown = onTouchStart;
  window.onmouseup = onTouchEnd;
  window.onmousemove = onTouchMove;
}
