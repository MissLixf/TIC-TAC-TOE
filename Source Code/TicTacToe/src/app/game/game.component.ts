/**
 * Project Title: Tic-Tac-Toe
 * File: game.component.ts
 * Description: Core game engine and state controller. Manages reactivity via Angular Signals,
 *              handles turn-based logic, evaluates win conditions, and orchestrates 
 *              tactile post-game sequences.
 *
 * Authors:
 *   - Amey Thakur — https://github.com/Amey-Thakur
 *   - Mega Satish — https://github.com/msatmod
 *
 * Repository:
 *   https://github.com/Amey-Thakur/TIC-TAC-TOE
 *
 * Live Application:
 *   https://amey-thakur.github.io/TIC-TAC-TOE/
 *
 * Video Demo:
 *   https://youtu.be/zCKgLImSjeo
 *
 * Release Date:
 *   June 13, 2022
 *
 * License:
 *   MIT License
 *
 * Copyright (c) 2022 Amey Thakur & Mega Satish
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import html2canvas from 'html2canvas';
import { DecimalPipe } from '@angular/common';
import { BoardComponent } from '../board/board.component';
import { SoundService } from '../sound.service';

export type Difficulty = 'low' | 'medium' | 'high';

/**
 * @interface DifficultyConfig
 * @description Board geometry and victory threshold for each difficulty tier.
 */
export interface DifficultyConfig {
  readonly size: number;
  readonly winLength: number;
  readonly label: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  low: { size: 3, winLength: 3, label: '低难度' },
  medium: { size: 5, winLength: 4, label: '中难度' },
  high: { size: 8, winLength: 6, label: '高难度' }
};

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [BoardComponent, DecimalPipe]
})
/**
 * @class GameComponent
 * @description State-driven component leveraging Angular's fine-grained reactivity.
 * Implements a size/win-length configurable grid with automatic resolution for
 * victory/draw states across the low, medium and high difficulty tiers.
 */
export class GameComponent implements OnInit {
  readonly difficultyOptions = (Object.keys(DIFFICULTIES) as Difficulty[]).map(id => ({
    id,
    ...DIFFICULTIES[id]
  }));

  difficulty = signal<Difficulty>('low');
  /** Board edge length derived from the selected difficulty (3 / 5 / 8). */
  boardSize = computed(() => DIFFICULTIES[this.difficulty()].size);
  /** Number of consecutive marks required to win (3 / 4 / 6). */
  winLength = computed(() => DIFFICULTIES[this.difficulty()].winLength);
  difficultyLabel = computed(() => DIFFICULTIES[this.difficulty()].label);
  /** Total cells on the current board; used for the draw condition. */
  totalCells = computed(() => this.boardSize() * this.boardSize());

  squares = signal<('X' | 'O' | undefined)[]>(Array(9).fill(undefined));
  xIsNext = signal<boolean>(true);
  winner = signal<'X' | 'O' | null>(null);
  counter = signal<number>(0);
  isDraw = signal<boolean>(false);
  freshPage = signal<boolean>(true);
  loading = signal<boolean>(true);
  loadingProgress = signal<number>(0);
  showCard = signal<boolean>(false);
  winningIndices = signal<number[]>([]);
  gameConcluding = signal<boolean>(false); // NEW: Controls the cinematic pause

  /**
   * @property player
   * @description Computed signal that derives the current active player symbol.
   * Ensures data consistency between turns.
   */
  player = computed(() => (this.xIsNext() ? 'X' : 'O') as 'X' | 'O');

  constructor(private soundService: SoundService) { }

  ngOnInit(): void {
    this.simulateLoading();
  }

  simulateLoading() {
    const duration = 2500;
    const intervalTime = 50;
    const increment = (100 / (duration / intervalTime));

    const progressInterval = setInterval(() => {
      this.loadingProgress.update(p => {
        const next = p + increment;
        if (next >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => this.loading.set(false), 500);
          return 100;
        }
        return next;
      });
    }, intervalTime);
  }



  toggleShareCard() {
    this.soundService.playClick();
    this.showCard.update(s => !s);
  }

  async copyResult() {
    const resText = this.winner() ? 'Player ' + this.winner() + ' Won!' : 'It was a Draw!';
    const text = `🎮 Tic-Tac-Toe (${this.difficultyLabel()} · ${this.boardSize()}×${this.boardSize()})\n\n🏆 Result: ${resText} \n🔥 Unbeatable Match!\n\n🔴 Play Live: https://amey-thakur.github.io/TIC-TAC-TOE/\n\nCreated by Amey Thakur & Mega Satish`;
    try {
      this.soundService.playClick();
      await navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  async shareResult() {
    const resText = this.winner() ? 'Player ' + this.winner() + ' Won!' : 'It was a Draw!';
    const data = {
      title: 'Tic-Tac-Toe Result',
      text: `🎮 Tic-Tac-Toe (${this.difficultyLabel()} · ${this.boardSize()}×${this.boardSize()})\n\n🏆 Result: ${resText} \n🔥 Unbeatable Match!\n\nCreated by Amey Thakur & Mega Satish`,
      url: 'https://amey-thakur.github.io/TIC-TAC-TOE/'
    };

    if (navigator.share) {
      try {
        this.soundService.playClick();
        await navigator.share(data);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      this.copyResult();
    }
  }

  downloadCard() {
    this.soundService.playClick();
    const element = document.querySelector('.share-card') as HTMLElement;
    if (element) {
      // Temporarily hide buttons for the screenshot
      const buttons = element.querySelector('.action-buttons') as HTMLElement;
      const hint = element.querySelector('.close-hint') as HTMLElement;

      if (buttons) buttons.style.display = 'none';
      if (hint) hint.style.display = 'none';

      html2canvas(element, { backgroundColor: null, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `tic-tac-toe-result-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Restore visibility
        if (buttons) buttons.style.display = 'flex';
        if (hint) hint.style.display = 'block';
      });
    }
  }


  // Signals handle reactivity automatically

  /**
   * @method makeMove
   * @description Central event handler for user interaction. 
   * Orchestrates move validation, state updates, sound triggers, and game resolution status.
   * @param idx - The index of the square being targeted, within the active board.
   */
  makeMove(idx: number) {
    if (this.winner() || this.isDraw() || this.gameConcluding()) return;
    if (idx < 0 || idx >= this.totalCells()) return;
    if (!this.squares()[idx]) {
      const currentPlayer = this.player();
      this.squares.update(s => {
        const newSquares = [...s];
        newSquares[idx] = currentPlayer;
        return newSquares;
      });

      if (currentPlayer === 'X') {
        this.soundService.playMoveX();
      } else {
        this.soundService.playMoveO();
      }

      this.xIsNext.update(x => !x);
      this.counter.update(c => c + 1);
    }

    const win = this.calculateWinner();
    this.winner.set(win);

    if (win || this.counter() === this.totalCells()) {
      this.gameConcluding.set(true); // Trigger animations

      if (win) {
        this.soundService.playWin();
      } else {
        this.isDraw.set(true);
        this.soundService.playDraw();
      }

      // Cinematic pause before showing the post-game UI
      setTimeout(() => {
        this.gameConcluding.set(false);
      }, 1500);
    }
  }

  /**
   * @method calculateWinner
   * @description Generalised win-condition evaluation. Scans every cell along the four
   * axis directions (horizontal, vertical, both diagonals) and reports a victory once a
   * run of `winLength` identical marks is found. Supports any square board size.
   * @returns The winning symbol ('X' or 'O') or null if no winner exists.
   */
  calculateWinner(): 'X' | 'O' | null {
    const size = this.boardSize();
    const need = this.winLength();
    const squares = this.squares();
    const directions: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const symbol = squares[row * size + col];
        if (!symbol) continue;

        for (const [dRow, dCol] of directions) {
          const path: number[] = [];
          let r = row;
          let c = col;

          while (
            path.length < need &&
            r >= 0 && r < size && c >= 0 && c < size &&
            squares[r * size + c] === symbol
          ) {
            path.push(r * size + c);
            r += dRow;
            c += dCol;
          }

          if (path.length === need) {
            this.winningIndices.set(path);
            return symbol;
          }
        }
      }
    }

    this.winningIndices.set([]);
    return null;
  }

  /**
   * @method selectDifficulty
   * @description Switches the board geometry/win threshold and immediately starts a
   * fresh match at that difficulty.
   * @param level - The chosen difficulty tier.
   */
  selectDifficulty(level: Difficulty) {
    this.soundService.playClick();
    this.difficulty.set(level);
    this.startNewGame();
  }

  /** Restarts the match keeping the currently selected difficulty. */
  newGame() {
    this.soundService.playClick();
    this.startNewGame();
  }

  /** Returns to the difficulty chooser and clears the board. */
  changeDifficulty() {
    this.soundService.playClick();
    this.resetBoard();
    this.freshPage.set(true);
  }

  private startNewGame() {
    this.resetBoard();
    this.freshPage.set(false);
  }

  private resetBoard() {
    this.squares.set(Array(this.totalCells()).fill(undefined));
    this.xIsNext.set(true);
    this.winner.set(null);
    this.isDraw.set(false);
    this.counter.set(0);
    this.showCard.set(false);
    this.winningIndices.set([]);
    this.gameConcluding.set(false);
  }
}