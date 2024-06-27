import * as readline from 'readline';

const NEIGHBORS = 15;
const MINE = 16;
const REVEALED = 32;
const FLAGGED = 64;
const QUESTION = 128;

type Square = number;
type Board = Square[][];

function makeBoard(rows: number, cols: number, mines: number): Board {
  const b = Array.from({length: rows}, () => new Array(cols).fill(0));
  if (rows > 26) throw new Error('too many rows');
  if (cols > 99) throw new Error('too many columns');
  if (mines > rows * cols) throw new Error('too many mines');
  while (mines > 0) {
    const r = Math.floor(Math.random() * b.length);
    const row = b[r];
    const c = Math.floor(Math.random() * row.length);
    if (row[c] & MINE) continue;
    row[c] |= MINE;
    mines--;
  }
  for (let i = 0; i < b.length; i++) {
    for (let j = 0; j < b[i].length; j++) {
      let count = 0;
      for (const di of [-1, 0, 1]) {
        for (const dj of [-1, 0, 1]) {
          if (!di && !dj) continue;
          if (b[i + di]?.[j + dj] & MINE) count++;
        }
      }
      b[i][j] |= count;
    }
  }
  return b;
}

function showBoard(board: Board): string {
  const c = board[0].length;
  const rows = new Array(board.length + 3).fill('');
  rows[2] = ' +' + '-'.repeat(c);
  rows[0] += rows[1] += '  ';
  for (let i = 0; i < board.length; i++) {
  }
  for (let i = 0; i < c; i++) {
    rows[0] += Math.floor((i + 1) / 10);
    rows[1] += (i + 1) % 10;
    for (let j = 0; j < board.length; j++) {
      if (!i) rows[j + 3] = String.fromCharCode(0x41 + j) + '|';
      rows[j + 3] += showSquare(board[j][i]);
    }
  }
  return rows.join('\n');
}

function showSquare(s: Square): string {
  if (s & REVEALED) {
    if (s & MINE) return '*';
    const neighbors = s & NEIGHBORS;
    return neighbors ? String.fromCharCode(0x30 + neighbors) : '.';
  } else if (s & FLAGGED) {
    return '!';
  } else if (s & QUESTION) {
    return '?';
  }
  return '#';
}

function parseLabel(label: string): [number, number]|null {
  const match = /^([A-Z])([0-9]+)$/.exec(label);
  if (!match) return null;
  return [match[1].charCodeAt(0) - 0x41, Number(match[2]) - 1];
}

function reveal(b: Board, r: number, c: number) {
  let val = b[r]?.[c];
  if (val == null || val & REVEALED) return;
  val |= REVEALED;
  val &= ~(FLAGGED | QUESTION);
  b[r][c] = val;
  if (val & 15) return;
  for (const dr of [-1, 0, 1]) {
    for (const dc of [-1, 0, 1]) {
      reveal(b, r + dr, c + dc);
    }
  }
}

function check(b: Board): 'win'|'lose'|null {
  let win = true;
  for (let row of b) {
    for (let c of row) {
      const status = c & (MINE | REVEALED | FLAGGED);
      if (status === (REVEALED | MINE)) return 'lose';
      if ((status & MINE) && !(status & FLAGGED)) win = false;
    }
  }
  return win ? 'win' : null;
}

async function main() {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  const b = makeBoard(16, 16, 16);
  while (true) {
    console.log(showBoard(b));
    const i = await prompt(rl, '> ');
    if (!i) return process.exit(0);
    let label = i;
    if (i[0] === '!' || i[0] === '?') label = i.substring(1);
    const parsed = parseLabel(label);
    if (!parsed) {
      console.log('Bad command');
      continue;
    }
    const [r, c] = parsed;
    if (b[r]?.[c] == null) {
      console.log('Bad coordinate');
      continue;
    }
    if (i[0] === '!') {
      const val = b[r][c];
      if (val & REVEALED) continue;
      b[r][c] = (val & ~QUESTION) ^ FLAGGED;
    } else if (i[0] === '?') {
      const val = b[r][c];
      if (val & REVEALED) continue;
      b[r][c] = (val & ~FLAGGED) ^ QUESTION;
    } else {
      reveal(b, r, c);
    }
    switch (check(b)) {
      case 'win':
        console.log('WIN');
        return process.exit(0);
      case 'lose':
        console.log('LOSE');
        for (const row of b) {
          for (let c = 0; c < row.length; c++) {
            row[c] |= REVEALED;
          }
        }
        console.log(showBoard(b));
        return process.exit(0);
    }
  }
}

function prompt(rl: any, p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    rl.question(p, resolve);
  });
}

main();

// Time: 45m
