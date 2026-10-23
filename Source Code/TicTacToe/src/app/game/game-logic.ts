/**
 * Project Title: Tic-Tac-Toe
 * File: game-logic.ts
 * Description: Framework-independent game rules. The win-condition scan lives here
 *              as a pure function so it can be unit tested without Angular.
 *
 * License:
 *   MIT License
 */

export type Cell = 'X' | 'O' | undefined;

export interface WinningLine {
  symbol: 'X' | 'O';
  /** Every board index belonging to the winning run, in board order. */
  indices: number[];
}

type Direction = readonly [dRow: number, dCol: number];

/** Horizontal, vertical and the two diagonals. */
const DIRECTIONS: readonly Direction[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * @function findWinningLine
 * @description Scans the board in four directions and returns the first run of at
 * least `winLength` matching symbols. The returned indices contain the complete
 * run (not just the first `winLength` cells) so a longer line is highlighted whole.
 * @param squares Row-major board state.
 * @param size Board edge length.
 * @param winLength Number of connected symbols required to win.
 * @returns The winning symbol with its indices, or null when nobody has won.
 */
export function findWinningLine(
  squares: readonly Cell[],
  size: number,
  winLength: number,
): WinningLine | null {
  if (size <= 0 || winLength <= 0 || squares.length < size * size) {
    return null;
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const symbol = squares[row * size + col];
      if (!symbol) {
        continue;
      }

      for (const [dRow, dCol] of DIRECTIONS) {
        // Only start from the first cell of a run. Starting mid-run would return a
        // partial line, and the leading cells would stay unhighlighted.
        const prevRow = row - dRow;
        const prevCol = col - dCol;
        const hasPreviousCell =
          prevRow >= 0 && prevRow < size && prevCol >= 0 && prevCol < size;
        if (hasPreviousCell && squares[prevRow * size + prevCol] === symbol) {
          continue;
        }

        const indices: number[] = [];
        let r = row;
        let c = col;

        while (
          r >= 0 &&
          r < size &&
          c >= 0 &&
          c < size &&
          squares[r * size + c] === symbol
        ) {
          indices.push(r * size + c);
          r += dRow;
          c += dCol;
        }

        if (indices.length >= winLength) {
          return { symbol, indices };
        }
      }
    }
  }

  return null;
}
