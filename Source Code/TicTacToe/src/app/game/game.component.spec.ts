/**
 * @file game.component.spec.ts
 * @description Unit tests for the difficulty-aware win detection and board reset logic.
 * The winning-run scan replaced the original eight hard-coded 3x3 lines, so it is
 * covered here across every supported geometry (3x3 / 5x5 / 8x8).
 */

import { GameComponent, Difficulty } from './game.component';
import { SoundService } from '../sound.service';

type Mark = 'A' | 'B' | undefined;

const soundServiceStub = {
  playClick: () => { },
  playMoveA: () => { },
  playMoveB: () => { },
  playWin: () => { },
  playDraw: () => { }
} as unknown as SoundService;

function createComponent(difficulty?: Difficulty): GameComponent {
  const component = new GameComponent(soundServiceStub);
  if (difficulty) {
    component.selectDifficulty(difficulty);
  }
  return component;
}

function emptyBoard(size: number): Mark[] {
  return Array<Mark>(size).fill(undefined);
}

function place(board: Mark[], indices: number[], mark: Mark): Mark[] {
  indices.forEach(i => board[i] = mark);
  return board;
}

describe('GameComponent', () => {
  describe('calculateWinner - 3x3 (easy)', () => {
    const lines: number[][] = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    lines.forEach(line => {
      it(`detects a win on line [${line.join(', ')}]`, () => {
        const component = createComponent();
        component.squares.set(place(emptyBoard(9), line, 'A'));

        expect(component.calculateWinner()).toBe('A');
        expect(component.winningIndices()).toEqual(line);
      });
    });

    it('does not report a winner for two in a row', () => {
      const component = createComponent();
      component.squares.set(place(emptyBoard(9), [0, 1], 'A'));

      expect(component.calculateWinner()).toBeNull();
    });
  });

  describe('calculateWinner - 5x5 (medium)', () => {
    it('detects exactly four in a row', () => {
      const component = createComponent('medium');
      component.squares.set(place(emptyBoard(25), [0, 1, 2, 3], 'B'));

      expect(component.calculateWinner()).toBe('B');
    });

    it('does not report a winner for three in a row', () => {
      const component = createComponent('medium');
      component.squares.set(place(emptyBoard(25), [0, 1, 2], 'A'));

      expect(component.calculateWinner()).toBeNull();
    });

    it('detects four in a column', () => {
      const component = createComponent('medium');
      component.squares.set(place(emptyBoard(25), [1, 6, 11, 16], 'A'));

      expect(component.calculateWinner()).toBe('A');
    });
  });

  describe('calculateWinner - 8x8 (hard)', () => {
    it('detects six on the main diagonal', () => {
      const component = createComponent('hard');
      component.squares.set(place(emptyBoard(64), [0, 9, 18, 27, 36, 45], 'A'));

      expect(component.calculateWinner()).toBe('A');
    });

    it('detects six on the anti-diagonal', () => {
      const component = createComponent('hard');
      component.squares.set(place(emptyBoard(64), [7, 14, 21, 28, 35, 42], 'B'));

      expect(component.calculateWinner()).toBe('B');
    });

    it('does not join a run across row boundaries', () => {
      const component = createComponent('hard');
      // Last five cells of row 0 plus the first cell of row 1 are contiguous in the
      // flat array but must not be treated as a six-in-a-row.
      component.squares.set(place(emptyBoard(64), [3, 4, 5, 6, 7, 8], 'A'));

      expect(component.calculateWinner()).toBeNull();
    });

    it('does not join a run across column boundaries', () => {
      const component = createComponent('hard');
      // (0,7) and (1,0) are adjacent in the flat array but not on the board.
      component.squares.set(place(emptyBoard(64), [7, 8, 9, 10, 11, 12], 'B'));

      expect(component.calculateWinner()).toBeNull();
    });

    it('stops scanning at the board edge', () => {
      const component = createComponent('hard');
      component.squares.set(place(emptyBoard(64), [59, 60, 61, 62, 63], 'A'));

      expect(component.calculateWinner()).toBeNull();
    });
  });

  describe('draw detection', () => {
    it('reports a draw when the board is full with no winning run', () => {
      const component = createComponent();
      // A B A
      // A B B
      // B A A
      const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
      moves.forEach(index => component.makeMove(index));

      expect(component.winner()).toBeNull();
      expect(component.isDraw()).toBeTrue();
    });
  });

  describe('difficulty switching', () => {
    (['easy', 'medium', 'hard'] as Difficulty[]).forEach(difficulty => {
      it(`keeps squares in sync with the ${difficulty} board size`, () => {
        const component = createComponent(difficulty);

        expect(component.squares().length).toBe(component.boardSize() ** 2);
      });
    });

    it('rebuilds the board when the difficulty changes', () => {
      const component = createComponent();
      component.squares.set(place(emptyBoard(9), [0, 1, 2], 'A'));
      component.calculateWinner();

      component.selectDifficulty('hard');

      expect(component.boardSize()).toBe(8);
      expect(component.squares().length).toBe(64);
      expect(component.squares().every(cell => cell === undefined)).toBeTrue();
      expect(component.winner()).toBeNull();
      expect(component.winningIndices()).toEqual([]);
    });

    it('resets the first player to A on a new game', () => {
      const component = createComponent();
      for (let i = 0; i < 5; i++) {
        component.makeMove([0, 1, 2, 4, 3][i]);
      }
      // A has played five times, so B would be next before the reset.
      expect(component.aIsNext()).toBeFalse();

      component.selectDifficulty('medium');

      expect(component.aIsNext()).toBeTrue();
      expect(component.player()).toBe('A');
    });
  });
});
