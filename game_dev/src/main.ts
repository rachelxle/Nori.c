/**
 * SillyCon - Cat Runner & Arena Boss
 * Entry point: Phaser 3 + TypeScript + Vite
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './game/config';
import { BootScene } from './game/scenes/BootScene';
import { StoryIntroScene } from './game/scenes/StoryIntroScene';
import { MainMenuScene } from './game/scenes/MainMenuScene';
import { RunnerScene } from './game/scenes/RunnerScene';
import { ArenaScene } from './game/scenes/ArenaScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { VictoryScene } from './game/scenes/VictoryScene';
import { KeyboardInput } from './input/KeyboardInput';

// Shared input provider (optional - can create per-scene)
const inputProvider = new KeyboardInput();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#8FD3FF',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, StoryIntroScene, MainMenuScene, RunnerScene, ArenaScene, GameOverScene, VictoryScene],
};

const game = new Phaser.Game(config);

// Store input provider in game registry for scenes to use
game.registry.set('inputProvider', inputProvider);
