import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findWinningLine, type Cell } from './game-logic.ts';

/** Builds a row-major board from rows of characters; '.' and ' ' mean empty. */
function board(rows: string[]): Cell[] {
  return rows.flatMap(row =>
    [...row].map(char => (char === 'X' || char === 'O' ? char : undefined)),
  );
}

test('3x3: three in a row wins', () => {
  const line = findWinningLine(board(['XXX', 'OO.', '...']), 3, 3);
  assert.deepEqual(line, { symbol: 'X', indices: [0, 1, 2] });
});

test('3x3: three in a column wins', () => {
  const line = findWinningLine(board(['XO.', 'XO.', 'X..']), 3, 3);
  assert.deepEqual(line, { symbol: 'X', indices: [0, 3, 6] });
});

test('5x5: only three in a row does not win', () => {
  const line = findWinningLine(board(['XXX..', 'OO.O.', '.....', '.....', '.....']), 5, 4);
  assert.equal(line, null);
});

test('5x5: four in a row wins, including against the right edge', () => {
  const line = findWinningLine(board(['.....', '..XXX', '.....', '.....', '.....']), 5, 4);
  assert.equal(line, null, 'a run of 3 must not win');

  const edge = findWinningLine(board(['.....', '.XXXX', '.....', '.....', '.....']), 5, 4);
  assert.deepEqual(edge, { symbol: 'X', indices: [6, 7, 8, 9] });
});

test('5x5: four in a column wins', () => {
  const line = findWinningLine(board(['.....', '.X...', '.XOO.', '.X...', '.X...']), 5, 4);
  assert.deepEqual(line, { symbol: 'X', indices: [6, 11, 16, 21] });
});

test('5x5: four on the main diagonal wins', () => {
  const line = findWinningLine(board(['O....', '.O...', '...X.', '....X', '.....']), 5, 4);
  // Only three X on the diagonal -> no win.
  assert.equal(line, null);

  const full = findWinningLine(board(['X....', '.X...', '..X..', '...X.', '.....']), 5, 4);
  assert.deepEqual(full, { symbol: 'X', indices: [0, 6, 12, 18] });
});

test('5x5: four on the anti-diagonal wins', () => {
  const line = findWinningLine(board(['...X.', '..X..', '.X...', 'X....', '.....']), 5, 4);
  assert.deepEqual(line, { symbol: 'X', indices: [3, 7, 11, 15] });
});

test('8x8: four in the bottom-right corner does not win', () => {
  const rows = Array.from({ length: 8 }, () => '........');
  rows[7] = '....XXXX';
  assert.equal(findWinningLine(board(rows), 8, 6), null);
});

test('8x8: exactly six in a row wins, ending in the bottom-right corner', () => {
  const rows = Array.from({ length: 8 }, () => '........');
  rows[7] = '..XXXXXX';
  const line = findWinningLine(board(rows), 8, 6);
  assert.deepEqual(line, { symbol: 'X', indices: [58, 59, 60, 61, 62, 63] });
});

test('8x8: six in the bottom-right column wins', () => {
  const rows = Array.from({ length: 8 }, (_, row) => (row >= 2 ? '.......X' : '........'));
  const line = findWinningLine(board(rows), 8, 6);
  assert.deepEqual(line, { symbol: 'X', indices: [23, 31, 39, 47, 55, 63] });
});

test('8x8: only five in a row does not win', () => {
  const rows = Array.from({ length: 8 }, () => '........');
  rows[7] = '...XXXXX';
  assert.equal(findWinningLine(board(rows), 8, 6), null);
});

test('runs longer than winLength highlight the whole line', () => {
  const line = findWinningLine(board(['XXXXX', '.....', '.....', '.....', '.....']), 5, 4);
  assert.deepEqual(line, { symbol: 'X', indices: [0, 1, 2, 3, 4] });
});

test('a full board without a line is a draw', () => {
  const draw = board(['XOX', 'XOO', 'OXX']);
  assert.equal(findWinningLine(draw, 3, 3), null);
});

test('invalid board sizes are rejected', () => {
  assert.equal(findWinningLine([], 0, 3), null);
  assert.equal(findWinningLine([undefined, undefined, undefined], 3, 3), null);
});
