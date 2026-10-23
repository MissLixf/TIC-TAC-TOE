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
 * @description Difficulty presets. Each preset defines the board dimensions and
 * the number of consecutive marks required to win.
 */
export type DifficultyKey = 'easy' | 'medium' | 'hard';

export interface DifficultyPreset {
  key: DifficultyKey;
  label: string;
  size: number;
  winLength: number;
}

export const DIFFICULTIES: readonly DifficultyPreset[] = [
  { key: 'easy', label: '低难度', size: 3, winLength: 3 },
  { key: 'medium', label: '中难度', size: 5, winLength: 4 },
  { key: 'hard', label: '高难度', size: 8, winLength: 6 }
];

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [BoardComponent, DecimalPipe]
})
/**
 * @class GameComponent
 * @description State-driven component leveraging Angular's fine-grained reactivity.
 * Implements configurable grid logic (3x3 / 5x5 / 8x8) with automatic resolution
 * for victory/draw states.
 */
export class GameComponent implements OnInit {
  readonly difficulties = DIFFICULTIES;
  difficulty = signal<DifficultyKey>('easy');
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

  /**
   * @property preset
   * @description Active difficulty configuration (board size + winning run length).
   */
  preset = computed(() => DIFFICULTIES.find(d => d.key === this.difficulty()) ?? DIFFICULTIES[0]);

  boardSize = computed(() => this.preset().size);

  winLength = computed(() => this.preset().winLength);

  /**
   * @property snapshotCell
   * @description Cell size (px) used by the share-card snapshot, scaled so a
   * larger board still fits the fixed-width card.
   */
  snapshotCell = computed(() => {
    const size = this.boardSize();
    return size <= 3 ? 45 : size <= 5 ? 30 : 20;
  });

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
   * @param idx - The index of the square being targeted (0-8).
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

    if (win || this.counter() === this.boardSize() * this.boardSize()) {
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
   * Scans every cell along the four axis directions (horizontal, vertical and
   * both diagonals) and reports the first run of `winLength` identical marks.
   * @returns The winning symbol ('X' or 'O') or null if no winner exists.
   */
  calculateWinner() {
    const size = this.boardSize();
    const need = this.winLength();
    const squares = this.squares();
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal ↘
      [1, -1]   // diagonal ↙
    ];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const mark = squares[row * size + col];
        if (!mark) continue;

        for (const [dr, dc] of directions) {
          const run: number[] = [row * size + col];

          for (let step = 1; step < need; step++) {
            const r = row + dr * step;
            const c = col + dc * step;
            if (r < 0 || r >= size || c < 0 || c >= size) break;
            if (squares[r * size + c] !== mark) break;
            run.push(r * size + c);
          }

          if (run.length === need) {
            this.winningIndices.set(run);
            return mark;
          }
        }
      }
    }

    return null;
  }

  /**
   * @method selectDifficulty
   * @description Applies a difficulty preset, clearing any in-flight round so the
   * board is recreated with the new dimensions and win condition.
   */
  selectDifficulty(key: DifficultyKey) {
    if (this.difficulty() === key) return;
    this.soundService.playClick();
    this.difficulty.set(key);
    this.resetBoard();
    this.freshPage.set(true);
  }

  /**
   * @method changeDifficulty
   * @description Returns to the difficulty selection screen after a match.
   */
  changeDifficulty() {
    this.soundService.playClick();
    this.resetBoard();
    this.freshPage.set(true);
  }

  /**
   * @method resetBoard
   * @description Clears all round-scoped state and allocates a board that matches
   * the active difficulty preset.
   */
  private resetBoard() {
    const size = this.boardSize();
    this.squares.set(Array(size * size).fill(undefined));
    this.xIsNext.set(true);
    this.winner.set(null);
    this.isDraw.set(false);
    this.counter.set(0);
    this.showCard.set(false);
    this.winningIndices.set([]);
    this.gameConcluding.set(false);
  }

  newGame() {
    this.soundService.playClick();
    this.resetBoard();
    this.freshPage.set(false);
  }
}