/**
 * Project Title: Tic-Tac-Toe
 * File: game-logic.ts
 * Description: Pure helpers for board geometry and victory detection. Keeping this
 *              logic free of Angular primitives means it can be reasoned about (and
 *              unit tested) independently of the component lifecycle.
 *
 * License:
 *   MIT License
 */

export type Mark = 'X' | 'O';
export type Cell = Mark | undefined;

/**
 * @function createBoard
 * @description Builds an empty square board for the given edge size.
 * @param size - Number of cells per row/column.
 */
export function createBoard(size: number): Cell[] {
  return Array<Cell>(size * size).fill(undefined);
}

/**
 * @function findWinningLine
 * @description Scans every cell in four directions (horizontal, vertical and both
 * diagonals) and returns the indices of the first run of `winLength` identical
 * marks. Works for any square board size, which is what makes 3x3 / 5x5 / 8x8
 * share a single victory evaluator.
 * @param squares - Flattened row-major board.
 * @param size - Number of cells per row/column.
 * @param winLength - Consecutive marks required to win.
 * @returns The winning indices, or null when no line has been completed.
 */
export function findWinningLine(
  squares: readonly Cell[],
  size: number,
  winLength: number
): number[] | null {
  const directions: ReadonlyArray<readonly [number, number]> = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal down-right
    [1, -1]  // diagonal down-left
  ];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const mark = squares[row * size + col];
      if (!mark) continue;

      for (const [rowStep, colStep] of directions) {
        const line: number[] = [];
        let r = row;
        let c = col;

        while (
          line.length < winLength &&
          r >= 0 && r < size && c >= 0 && c < size &&
          squares[r * size + c] === mark
        ) {
          line.push(r * size + c);
          r += rowStep;
          c += colStep;
        }

        if (line.length === winLength) {
          return line;
        }
      }
    }
  }

  return null;
}
