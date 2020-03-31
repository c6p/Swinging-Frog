import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

export class UIScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'UIScene'
    })
  }

  preload() { }
  
  create() {
    this.unmute = this.add.image(CONFIG.WIDTH - CONFIG.UI_ICON_SIZE - CONFIG.UI_ICON_PADDING, CONFIG.UI_ICON_PADDING, 'unmute').setOrigin(1,0).setInteractive().on('pointerdown', this.toggleMute, this);
    this.mute = this.add.image(CONFIG.WIDTH - CONFIG.UI_ICON_SIZE - CONFIG.UI_ICON_PADDING, CONFIG.UI_ICON_PADDING, 'mute').setOrigin(1,0).setInteractive().on('pointerdown', this.toggleMute, this).setTint(Koji.config.colors.button.replace("#", "0x"));

    this.game.sound.mute = true
    if (this.game.sound.mute) {
      this.unmute.setAlpha(0);
    } else {
      this.mute.setAlpha(0);
    }
  }

  update() { }

  toggleMute() {
    this.game.sound.mute = !this.game.sound.mute
    if (this.game.sound.mute) {
      this.mute.setAlpha(0);
      this.unmute.setAlpha(1);
    } else {
      this.unmute.setAlpha(0);
      this.mute.setAlpha(1);
    }
  }
}