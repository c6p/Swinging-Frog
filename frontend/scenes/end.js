import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

export class EndScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'EndScene'
    })
  }

  preload() { }

  create() {
    if (Koji.config.images.logo) {
      this.add.image(CONFIG.WIDTH / 2, 200, 'logo');
    } else if (Koji.config.strings.title) {
      this.add.text(CONFIG.WIDTH / 2, 200, Koji.config.strings.title, { fontFamily: Koji.config.strings.font.family, fontSize: '30px', fill: Koji.config.colors.font }).setOrigin(0.5, 0.5);
    }
    this.add.text(CONFIG.WIDTH / 2, 400, Koji.config.strings.win, { fontFamily: Koji.config.strings.font.family, fontSize: '60px', fill: Koji.config.colors.font }).setOrigin(0.5, 0.5);

    this.add.text(CONFIG.WIDTH / 2, 600, Koji.config.strings.credits, { fontFamily: Koji.config.strings.font.family, fontSize: '16px', fill: Koji.config.colors.font, fixedWidth: 500 }).setOrigin(0.5, 0);

    if (Koji.config.strings.again_button) {
      this.graphics = this.add.graphics();
      this.graphics.fillStyle(Koji.config.colors.button.replace("#", "0x"), 1.0);
      this.graphics.fillRoundedRect(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+325,CONFIG.WIDTH/2,50)
        .setInteractive(new Phaser.Geom.Rectangle(CONFIG.WIDTH/4, CONFIG.HEIGHT/2+325,CONFIG.WIDTH/2,50), Phaser.Geom.Rectangle.Contains)
        .on('pointerdown', this.start_again, this);
      this.startText = this.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2+350, Koji.config.strings.again_button, { fontFamily: Koji.config.strings.font.family, fontSize: '30px', fill: Koji.config.colors.button_font });
      this.startText.setOrigin(0.5,0.5);
      this.startText.setInteractive().on('pointerdown', this.start_again, this);
    }
    window.localStorage.setItem('level', 0)
  }

  update() { }

  start_again() {
    this.scene.start("MenuScene")
  }
}