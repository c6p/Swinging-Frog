import Koji from '@withkoji/vcc';
import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from 'config';
import { MenuScene } from 'scenes/menu';
import { GameScene } from 'scenes/game';
import { UIScene } from 'scenes/ui';

var config = {
  scale: {
        mode: Phaser.Scale.FIT,
        width: CONFIG.WIDTH,
        height: CONFIG.HEIGHT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH
    },
  disableContextMenu: true,
  physics: {
    default: 'matter',
    matter: {
      debug: true
    }
  },
  scene: [
    GameScene,
    MenuScene,
    UIScene
  ],
  transparent: true
}

var WebFont = require('webfontloader');

if (Koji.config.strings.font) {
  WebFont.load({
    google: {
      families: [Koji.config.strings.font.family]
    },
    active: () => {
      
      const style = `url("${Koji.config.images.background}") center center / cover no-repeat fixed`;
      document.body.style.background = style;

      document.getElementById('loading').remove();
      var game = new Phaser.Game(config)
    
    }
  });
}

