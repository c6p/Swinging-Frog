import Koji from '@withkoji/vcc';
import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from 'config';
import { MenuScene } from 'scenes/menu';
import { GameScene } from 'scenes/game';
import { UIScene } from 'scenes/ui';
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import RoundRectanglePlugin from 'phaser3-rex-plugins/plugins/roundrectangle-plugin.js';

var config = {
  scale: {
    mode: Phaser.Scale.FIT,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH
  },
  render: {
    powerPreference: 'high-performance',
  },
  fps: 30,
  disableContextMenu: true,
  physics: {
    default: 'matter',
    matter: {
      debug: true
    }
  },
  plugins: {
    global: [{
      key: 'rexRoundRectanglePlugin',
      plugin: RoundRectanglePlugin,
      start: true
    }],
    scene: [{
      plugin: PhaserMatterCollisionPlugin,
      key: "matterCollision",
      mapping: "matterCollision"
    }]
  },
  scene: [
    MenuScene,
    GameScene,
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

