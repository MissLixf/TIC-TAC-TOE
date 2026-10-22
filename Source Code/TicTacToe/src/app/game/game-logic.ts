/**
 * Project Title: Tic-Tac-Toe
 * File: game-logic.ts
 * Description: Board geometry and win-condition evaluation for the 5x5 /
 *              four-in-a-row variant. Free of Angular and DOM dependencies so the
 *              rules can be reasoned about in isolation from the component.
 *
 * License:
 *   MIT License
 */

export const BOARD_SIZE = 5;
export const WIN_LENGTH = 4;

export type Cell = 'X' | 'O' | undefined;

/**
 * @description Creates an empty 5x5 board. A flat array keeps indexing cheap:
 * square (row, col) lives at `row * BOARD_SIZE + col`.
 */
export function createEmptyBoard(): Cell[] {
  return Array<Cell>(BOARD_SIZE * BOARD_SIZE).fill(undefined);
}

/**
 * @description Every straight run of WIN_LENGTH cells — horizontal, vertical and
 * both diagonals. Computed once because the geometry never changes.
 */
export const WINNING_LINES: readonly number[][] = buildWinningLines();

function buildWinningLines(): number[][] {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1]   // diagonal down-left
  ];
  const lines: number[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const [rowStep, colStep] of directions) {
        const endRow = row + (WIN_LENGTH - 1) * rowStep;
        const endCol = col + (WIN_LENGTH - 1) * colStep;
        if (endRow < 0 || endRow >= BOARD_SIZE || endCol < 0 || endCol >= BOARD_SIZE) {
          continue;
        }

        const line: number[] = [];
        for (let step = 0; step < WIN_LENGTH; step++) {
          line.push((row + step * rowStep) * BOARD_SIZE + (col + step * colStep));
        }
        lines.push(line);
      }
    }
  }

  return lines;
}

/**
 * @description Returns the winning player and the cells forming the first
 * four-in-a-row run, or null when nobody has won yet.
 */
export function findWinningLine(squares: readonly Cell[]): { player: 'X' | 'O'; indices: number[] } | null {
  for (const line of WINNING_LINES) {
    const player = squares[line[0]];
    if (player && line.every(index => squares[index] === player)) {
      return { player, indices: line };
    }
  }
  return null;
}
