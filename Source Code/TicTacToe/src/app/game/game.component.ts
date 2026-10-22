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

/**
 * @type Difficulty
 * @description Identifier of the selectable board configurations.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * @interface DifficultyOption
 * @description Board geometry associated with a difficulty level.
 */
export interface DifficultyOption {
  value: Difficulty;
  label: string;
  size: number;
  winLength: number;
}

/**
 * @constant DIFFICULTY_OPTIONS
 * @description Single source of truth for the supported difficulty levels.
 * The order is also the order rendered in the difficulty selector.
 */
export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', size: 3, winLength: 3 },
  { value: 'medium', label: 'Medium', size: 5, winLength: 4 },
  { value: 'hard', label: 'Hard', size: 8, winLength: 6 }
] as const satisfies readonly DifficultyOption[];

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [BoardComponent, DecimalPipe]
})
/**
 * @class GameComponent
 * @description State-driven component leveraging Angular's fine-grained reactivity.
 * Supports selectable board geometries (3x3 / 5x5 / 8x8) with configurable winning runs.
 */
export class GameComponent implements OnInit {
  readonly difficultyOptions = DIFFICULTY_OPTIONS;

  /**
   * @property difficulty
   * @description Currently selected difficulty level. Changing it rebuilds the board.
   */
  difficulty = signal<Difficulty>('easy');

  /**
   * @property difficultyConfig
   * @description Geometry (board size + winning run length) for the active difficulty.
   */
  difficultyConfig = computed<DifficultyOption>(
    () => DIFFICULTY_OPTIONS.find(o => o.value === this.difficulty()) ?? DIFFICULTY_OPTIONS[0]
  );

  boardSize = computed(() => this.difficultyConfig().size);
  winLength = computed(() => this.difficultyConfig().winLength);

  squares = signal<('X' | 'O' | undefined)[]>(Array(this.boardSize() ** 2).fill(undefined));
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
    const text = `🎮 Tic-Tac-Toe\n\n🏆 Result: ${resText} \n🔥 Unbeatable Match!\n\n🔴 Play Live: https://amey-thakur.github.io/TIC-TAC-TOE/\n\nCreated by Amey Thakur & Mega Satish`;
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
      text: `🎮 Tic-Tac-Toe\n\n🏆 Result: ${resText} \n🔥 Unbeatable Match!\n\nCreated by Amey Thakur & Mega Satish`,
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
   * @param idx - The index of the square being targeted (0 ~ boardSize² - 1).
   */
  makeMove(idx: number) {
    if (this.winner() || this.isDraw() || this.gameConcluding()) return;
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

    if (win || this.counter() === this.squares().length) {
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
   * @description Implementation of the core win-condition evaluation strategy.
   * Scans every cell along the four axis-aligned directions looking for a run of
   * `winLength` identical marks, so the same logic works for 3x3, 5x5 and 8x8 boards.
   * @returns The winning symbol ('X' or 'O') or null if no winner exists.
   */
  calculateWinner() {
    const size = this.boardSize();
    const needed = this.winLength();
    const squares = this.squares();
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const mark = squares[row * size + col];
        if (!mark) continue;

        for (const [dRow, dCol] of directions) {
          const indices: number[] = [];
          for (let step = 0; step < needed; step++) {
            const r = row + dRow * step;
            const c = col + dCol * step;
            if (r < 0 || r >= size || c < 0 || c >= size) break;
            if (squares[r * size + c] !== mark) break;
            indices.push(r * size + c);
          }
          if (indices.length === needed) {
            this.winningIndices.set(indices);
            return mark;
          }
        }
      }
    }
    return null;
  }

  /**
   * @method selectDifficulty
   * @description Applies a difficulty level and rebuilds the board with its geometry.
   * @param value - Target difficulty level.
   */
  selectDifficulty(value: Difficulty) {
    if (value === this.difficulty()) return;
    this.soundService.playClick();
    this.difficulty.set(value);
    this.resetBoard();
  }

  /**
   * @method changeDifficulty
   * @description Returns to the landing screen so the player can pick another level.
   */
  changeDifficulty() {
    this.soundService.playClick();
    this.resetBoard();
    this.freshPage.set(true);
  }

  newGame() {
    this.soundService.playClick();
    this.resetBoard();
    this.freshPage.set(false);
  }

  /**
   * @method resetBoard
   * @description Restores the board to an empty state for the active difficulty.
   */
  private resetBoard() {
    this.squares.set(Array(this.boardSize() ** 2).fill(undefined));
    this.xIsNext.set(true); // New games always start with X; not alternating by design.
    this.winner.set(null);
    this.isDraw.set(false);
    this.counter.set(0);
    this.showCard.set(false);
    this.winningIndices.set([]);
    this.gameConcluding.set(false);
  }
}