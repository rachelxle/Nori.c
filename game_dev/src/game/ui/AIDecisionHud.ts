/**
 * On-screen display of the current boss AI decision (mode, attack, reason).
 * Judge-friendly for demos.
 */

import type { BossDecision } from '../ai/BossDirector';
import { Palette } from '../art/Palette';

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export class AIDecisionHud {
  private container: Phaser.GameObjects.Container;
  private modeText: Phaser.GameObjects.Text;
  private attackText: Phaser.GameObjects.Text;
  private reasonText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.modeText = scene.add.text(0, 0, 'Mode: —', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    });
    this.attackText = scene.add.text(0, 16, 'Next: —', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
    });
    this.reasonText = scene.add.text(0, 32, 'Reason: —', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: hex(Palette.darkOutline),
      wordWrap: { width: 220 },
    });
    this.container.add([this.modeText, this.attackText, this.reasonText]);
    this.container.setScrollFactor(0);
    this.container.setDepth(12);
  }

  update(decision: BossDecision | null): void {
    if (!decision) {
      this.modeText.setText('Mode: —');
      this.attackText.setText('Next: —');
      this.reasonText.setText('Reason: —');
      return;
    }
    this.modeText.setText(`Mode: ${decision.mode}`);
    this.attackText.setText(`Next: ${decision.nextAttack}`);
    this.reasonText.setText(`Reason: ${decision.reason}`);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
