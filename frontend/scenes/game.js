import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

const Bodies = Phaser.Physics.Matter.Matter.Bodies;
const Vector = Phaser.Physics.Matter.Matter.Vector;
const PI2 = Math.PI * 2
const [PLAYING, LOST, WON] = [0, 1, 2]

function angle(a, b) {
  return Math.abs(Math.atan2( a.x*b.y - a.y*b.x, a.x*b.x + a.y*b.y ))
}

function getPerpendicularVector(ropeVector, normalVector) {
  let { x, y } = ropeVector
  const perpVector = Vector.create(-y, x)
  const perpVectorOpposite = Vector.create(y, -x)
  return Vector.normalise(angle(perpVector, normalVector) < angle(perpVectorOpposite, normalVector)
    ? perpVector : perpVectorOpposite)
}

export class GameScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'GameScene'
    })
  }

  RIGHT_ANGLE = Math.PI / 2
  currentLevel = 0
  player = null
  rope = null
  nearest = null
  highlight
  MAX_ROPE_LENGTH_SQUARED = CONFIG.MAX_ROPE_LENGTH * CONFIG.MAX_ROPE_LENGTH
  ropeSound
  loss
  win
  level
  state // PLAYING | LOST | WON
  tutorialText

  nearestHandleTo(point) {
    const handles = Koji.config.levelEditor.levels[this.currentLevel].handles
    if (handles.length == 0)
      return
    let nearest = handles[0]

    let minDist = Phaser.Math.Distance.BetweenPointsSquared(nearest, point)
    for (let p of handles) {
      let dist = Phaser.Math.Distance.BetweenPointsSquared(p, point)
      if (dist < minDist) {
        minDist = dist
        nearest = p
      }
    }
    return minDist < this.MAX_ROPE_LENGTH_SQUARED ? nearest : null;
  }

  clearRope() {
    if (this.rope !== null) {
      this.matter.world.removeConstraint(this.rope)
      this.rope = null
    }
    const vy = this.player.body.velocity.y
    const f = 60 / this.game.loop.actualFps
    const s = CONFIG.ROPE_JUMP_SPEED * f
    this.matter.setVelocityY(this.player.body, vy - s)
    this.player.setFrame(0);
    this.tutorial(0)
  }

  createRopeTo(point) {
    if (this.rope !== null || point === null)
      return
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, point);
    this.rope = this.matter.add.worldConstraint(this.player, distance, 1, { pointA: point, damping: 0, stiffness: 1, render: { lineColor: CONFIG.ROPE_COLOR, lineThickness: 3, anchorColor: CONFIG.ROPE_COLOR, anchorSize: 3 } });
    this.player.setFrame(1)
    this.ropeSound.play()
    this.tutorial(1)
  }


  createHandles() {
    const level = this.level
    for (let p of level.handles) {
      this.add.image(p.x, p.y, 'handle')
    }
  }

  createPlatforms(group) {
    let platforms = []
    const level = this.level
    for (let p of level.platforms) {
      let rect = Bodies.rectangle(p.x, p.y, 120, 10);
      rect.collisionFilter.group = group
      let compoundBody = Phaser.Physics.Matter.Matter.Body.create({
        isStatic: true,
        parts: [rect],
        render: { visible: false },
      });
      let platform = this.matter.add.sprite(p.x, p.y, 'platform').setFrame(3)
      platform.setExistingBody(compoundBody);
      platform.body.restitution = CONFIG.BOUNCE_FACTOR
      platform.angle = p.angle
      platforms.push(platform);
    }
    return platforms
  }

  createObstacles() {
    const level = this.level
    for (let o of level.obstacles) {
      const mn = Math.min(o.width, o.height);
      const rw = o.width - mn;
      const rh = o.height - mn;
      let circle = Bodies.circle(o.x, o.y, mn / 2);
      let parts = [circle]
      if (o.width !== o.height) {
        let rect = Bodies.rectangle(o.x, o.y, rw ? rw : o.width, rh ? rh : o.height);
        let circleA = Bodies.circle(o.x - rw / 2, o.y - rh / 2, mn / 2);
        let circleB = Bodies.circle(o.x + rw / 2, o.y + rh / 2, mn / 2);
        parts = [circleA, rect, circleB]
      }
      let compoundBody = Phaser.Physics.Matter.Matter.Body.create({
        isStatic: true,
        parts,
        render: { visible: false }
      });
      let obstacleShape = this.add.rexRoundRectangle(o.x, o.y, o.width, o.height, mn / 2)
      obstacleShape.setIteration(18)
      obstacleShape.setStrokeStyle(6, 0x3f2a14)
      let obstacle = this.matter.add.gameObject(obstacleShape)
      obstacle.setExistingBody(compoundBody);
      obstacle.angle = o.angle
    }
  }


  playerPos() {
    let { x, y } = this.player
    return { x, y }
  }

  init({ level = 0 }) {
    this.currentLevel = level;
    this.level = Koji.config.levelEditor.levels[this.currentLevel]
    window.localStorage.setItem('level', this.currentLevel)
  }

  preload() {
    this.load.image('handle', Koji.config.images.handle);
    this.load.image('highlight', Koji.config.images.highlight);
    this.load.image('arrow', Koji.config.images.arrow);
    this.load.spritesheet('player', Koji.config.images.player + '?fit=clamp&w=400&h=100', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('platform', Koji.config.images.platform + '?fit=clamp&w=120&h=250', { frameWidth: 120, frameHeight: 50 });
    this.load.image('finish', Koji.config.images.finish + '?fit=clip&w=40');

    this.load.audio('loss', [Koji.config.audio.loss]);
    this.load.audio('win', [Koji.config.audio.win]);
    this.load.audio('jump', [Koji.config.audio.jump]);
    this.load.audio('rope', [Koji.config.audio.rope]);
  }

  bounceNormalWithRope(pair) {
    if (this.rope === null || this.player === null)
      return { x: 0, y: 0 }
    {
      const n = Vector.neg(pair.collision.normal)
      const p = getPerpendicularVector(Vector.sub(this.rope.pointA, this.player.body.position), n)
      return { x: p.x, y: p.y }
    }
  }

  create() {
    this.state = PLAYING

    this.ropeSound = this.sound.add('rope', { volume: 0.6 });
    this.loss = this.sound.add('loss', { volume: 2 });
    this.win = this.sound.add('win');
    let jump = this.sound.add('jump', { volume: 0.2 });

    var graphics = this.add.graphics();
    this.width = this.level.width + 60
    const [W, H] = [this.width, CONFIG.HEIGHT]

    this.add.tileSprite(this.level.width, H / 2, 40, H, 'finish');
    if (this.currentLevel === 0) {
      this.tutorialText = this.add.text(300, 150, "", { fontFamily: Koji.config.strings.font.family, fontSize: '24px', fill: Koji.config.colors.font, align: 'center' }).setOrigin(0.5, 0.5)
      this.tutorialText.setScrollFactor(0)
    }
    this.tutorial()

    graphics.fillGradientStyle(...Koji.config.colors.sky_background.map(c => c.replace("#", "0x")), 1)
    graphics.fillRect(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    this.highlight = this.add.image(0, 0, 'highlight');
    this.arrow = this.add.image(0, 0, 'arrow').setVisible(false);

    this.anims.create({
      key: 'bounce',
      frames: this.anims.generateFrameNumbers('platform', { frames: [3, 4, 3, 2, 1, 0, 2, 3] }),
      frameRate: 20
    });

    this.createObstacles();
    const platformGroup = this.matter.body.nextGroup(true)
    this.createPlatforms(platformGroup);
    this.createHandles();

    this.player = this.matter.add.sprite(50, 0, 'player', 0, { shape: { type: 'circle', radius: 25 }, scale: 1, restitution: 0, friction: 0, frictionAir: 0, frictionStatic: 0, timeScale: CONFIG.GAME_SPEED, render: { visible: false } });
    this.player.setOrigin(0.5, 0.25);
    this.player.setFrame(1)
    this.cameras.main.startFollow(this.player, true);

    this.input.on('pointerup', (pointer) => this.clearRope());
    this.input.on('pointerdown', (pointer) => this.createRopeTo(this.nearest));


    this.matter.world.on('collisionstart', (event, platformBody, playerBody) => {
      if (playerBody !== this.player.body || platformBody.collisionFilter.group !== platformGroup)
        return
      platformBody.gameObject.play("bounce", false)
      this.player.setFrame(0)
      jump.play()
    });
    this.matter.world.on('collisionend', (event, platformBody, playerBody) => {
      if (playerBody !== this.player.body || platformBody.collisionFilter.group !== platformGroup)
        return
      const pair = event.pairs[0]
      let speed = CONFIG.BASE_BOUNCE_SPEED * pair.restitution
      if (this.player.body.speed < speed) {
        speed = speed * 60 / this.game.loop.actualFps
        const n = this.bounceNormalWithRope(pair)
        const v = this.player.body.velocity
        this.matter.setVelocity(this.player, v.x + n.x * speed, v.y + n.y * speed)
      }
    })

    this.add.text(CONFIG.WIDTH / 2, 25, "Level: " + this.currentLevel, { fontFamily: Koji.config.strings.font.family, fontSize: '24px', fill: Koji.config.colors.font, align: 'center' }).setOrigin(0.5, 0.5).setScrollFactor(0)
  }

  tutorial(index = 0) {
    if (this.currentLevel === 0) {
      switch (index) {
        case 1:
          this.tutorialText.setText(Koji.config.strings.tutorial1)
          break
        default:
          this.tutorialText.setText(Koji.config.strings.tutorial0)
      }
    }
  }

  update(t, dt) {
    this.matter.step(dt)

    if (this.state === PLAYING) {
      if (this.player.y > (CONFIG.HEIGHT + 200) && this.nearest === null) {
        this.state = LOST
        this.loss.play()
        this.cameras.main.stopFollow()
        this.cameras.main.pan(0, this.level.width, CONFIG.SCENE_TRANSITION_TIME * 2, 'Elastic');
        this.time.delayedCall(CONFIG.SCENE_TRANSITION_TIME * 2, () => this.scene.restart())
      }
      else if (this.player.x > this.level.width && this.player.y > 0 && this.player.y < CONFIG.HEIGHT) {
        this.state = WON
        this.cameras.main.fade(CONFIG.SCENE_TRANSITION_TIME);
        this.win.play()
        if (this.currentLevel + 1 < Koji.config.levelEditor.levels.length) {
          this.time.delayedCall(CONFIG.SCENE_TRANSITION_TIME, () => this.scene.restart({ level: this.currentLevel + 1 }))
        } else {
          this.scene.start("EndScene")
        }
      }
    }

    const b = this.player.body
    if (!this.rope && b.speed > CONFIG.MAX_SPEED) {
      const m = Math.min(1, (CONFIG.MAX_SPEED * 60 ) / (b.speed * this.game.loop.actualFps))
      const v = b.velocity
      this.matter.setVelocity(this.player.body, v.x * m, v.y * m)
    }

    if (this.player.y < 0 || this.player.x < 0) {
      this.arrow.visible = true
      if (this.player.y < 0) {
        this.arrow.angle = 0
        this.arrow.y = 40
        this.arrow.x = this.player.x
      } else {
        this.arrow.angle = -90
        this.arrow.y = this.player.y
        this.arrow.x = 40
      }
    } else {
      this.arrow.visible = false
    }

    this.nearest = this.nearestHandleTo(this.playerPos())
    if (this.nearest === null)
      this.highlight.visible = false
    else {
      this.highlight.visible = true
      this.highlight.x = this.nearest.x
      this.highlight.y = this.nearest.y
    }

    if (this.rope !== null) {
      this.rope.bodyB.angle = Phaser.Math.Angle.BetweenPoints(this.rope.pointA, this.rope.bodyB.position) - this.RIGHT_ANGLE
      const b = this.player.body

      this.player.flipX = b.angularVelocity < 0
      if (b.angularSpeed > 0.02)
        this.player.setFrame(3)
      else if (b.angularSpeed > 0.01)
        this.player.setFrame(2)
      else
        this.player.setFrame(1)
    }
  }

}