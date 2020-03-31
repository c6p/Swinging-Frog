import Koji from '@withkoji/vcc';
import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from 'config';
import { MenuScene } from 'scenes/menu';
import { GameScene } from 'scenes/game';
import { UIScene } from 'scenes/ui';
import { EndScene } from 'scenes/end';
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
  fps: {
    target: 60
  },
  disableContextMenu: true,
  physics: {
    default: 'matter',
    matter: {
      autoUpdate: false,
      enableSleeping: true,
      restingThresh: 0.0001,
      restingThreshTangent: 0.0001,
      //constraintIterations: 10,
      velocityIterations: 10,
      //positionIterations: 100,
      debug: true,
      //runner: {
      //  fps: 60
      //}
    }
  },
  plugins: {
    global: [{
      key: 'rexRoundRectanglePlugin',
      plugin: RoundRectanglePlugin,
      start: true
    }]
  },
  scene: [
    MenuScene,
    GameScene,
    UIScene,
    EndScene,
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

