import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

const Bodies = Phaser.Physics.Matter.Matter.Bodies;

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
  //platforms = []
  //obstacles = []
  ropeSound
  loss
  win
  level

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
    this.matter.setVelocityY(this.player, this.player.body.velocity.y - 4);
    this.player.setFrame(0);
    this.tutorial(0)
  }

  createRopeTo(point) {
    if (this.rope !== null || point === null)
      return
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, point);
    this.rope = this.matter.add.worldConstraint(this.player, distance, 1, { pointA: point, damping: 0, stiffness: 0.01, render: { lineColor: 0xf8615a, lineThickness: 3, anchorColor: 0xf8615a, anchorSize: 3 } });
    //console.log(this.rope)
    this.player.setFrame(1)
    this.ropeSound.play()
    this.tutorial(1)
  }


  createHandles() {
    const level = Koji.config.levelEditor.levels[this.currentLevel]
    for (let p of level.handles) {
      //console.log(p)
      //this.add.circle(p.x, p.y, 10, 0xCCCCCC);
      this.add.image(p.x, p.y, 'handle')
    }
  }

  createPlatforms(group) {
    let platforms = []
    //const level = Koji.config.levelEditor.levels[this.currentLevel]
    const level = this.level
    for (let p of level.platforms) {
      let rect = Bodies.rectangle(p.x, p.y, 120, 10);
      rect.collisionFilter.group = group
      //let circleA = Bodies.circle(p.x - 55, p.y, 5);
      //let circleB = Bodies.circle(p.x + 55, p.y, 5);
      let compoundBody = Phaser.Physics.Matter.Matter.Body.create({
        isStatic: true,
        parts: [rect], // [rect, circleA, circleB],
        render: { visible: false },
      });
      //let platform = this.matter.add.sprite(p.x, p.y, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 110, height: 10}, render: {visible: false} }).setFrame(3)
      let platform = this.matter.add.sprite(p.x, p.y, 'platform').setFrame(3)
      platform.setExistingBody(compoundBody);
      //platform.setBounce(1.2)
      platform.body.restitution = 1.2
      platform.angle = p.angle
      //platform.body.collisionFilter.group = group
      platforms.push(platform);
    }
    return platforms
  }

  createObstacles() {
    //const level = Koji.config.levelEditor.levels[this.currentLevel]
    const level = this.level
    for (let o of level.obstacles) {
      const mx = Math.max(o.width, o.height);
      const mn = Math.min(o.width, o.height);
      const rw = o.width === mx ? mx - mn : o.width;
      const rh = o.height === mx ? mx - mn : o.height;
      const xOffset = (o.width-rw)/2
      const yOffset = (o.height-rh)/2
      let rect = Bodies.rectangle(o.x, o.y, rw, rh);
      let circleA = Bodies.circle(o.x - xOffset, o.y - yOffset, mn / 2);
      let circleB = Bodies.circle(o.x + xOffset, o.y + yOffset, mn / 2);
      //console.log(o.x, o.y, rw, rh)
      //console.log(o.x - xOffset, o.y - yOffset, mn / 2);
      //console.log(o.x + xOffset, o.y + yOffset, mn / 2);
      let compoundBody = Phaser.Physics.Matter.Matter.Body.create({
        isStatic: true,
        parts: o.width === o.height ? [circleA] : [rect, circleA, circleB],
        render: { visible: false }
      });
      let obstacleShape = this.add.rexRoundRectangle(o.x, o.y, o.width, o.height, mn / 2)
      obstacleShape.setStrokeStyle(6, 0x3f2a14)
      let obstacle = this.matter.add.gameObject(obstacleShape)
      obstacle.setExistingBody(compoundBody);
      obstacle.angle = o.angle
      //obstacle.body.collisionFilter.group = group
      //this.obstacles.push(obstacle);
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
    this.load.spritesheet('player', Koji.config.images.player, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('platform', Koji.config.images.platform, { frameWidth: 120, frameHeight: 50 });
    this.load.image('finish', Koji.config.images.finish);

    this.load.audio('loss', [ Koji.config.audio.loss ]);
    this.load.audio('win', [ Koji.config.audio.win ]);
    this.load.audio('jump', [ Koji.config.audio.jump ]);
    this.load.audio('rope', [ Koji.config.audio.rope ]);
  }

  create() {

    this.ropeSound = this.sound.add('rope', {volume: 0.6});
    this.loss = this.sound.add('loss');
    this.win = this.sound.add('win');
    let jump = this.sound.add('jump', {volume: 0.2});

    //this.matter.world.update30Hz();
    var graphics = this.add.graphics();
    this.width = this.level.width + 60
    const [W, H] = [this.width, CONFIG.HEIGHT]
    
    this.add.tileSprite(this.level.width, H/2, 40, H, 'finish');
    if (this.currentLevel === 0) {
      this.tutorialText = this.add.text(300, 150, "", { fontFamily: Koji.config.strings.font.family, fontSize: '24px', fill: Koji.config.colors.font, align: 'center' }).setOrigin(0.5,0.5)
      this.tutorialText.setScrollFactor(0)
    }
    this.tutorial()

    graphics.fillGradientStyle(0x2980B9, 0x6DD5FA, 0x0082c8, 0x667db6, 1);
    graphics.fillRect(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    this.highlight = this.add.image(0, 0, 'highlight');
    this.arrow = this.add.image(0, 0, 'arrow').setVisible(false);

    this.anims.create({
      key: 'bounce',
      frames: this.anims.generateFrameNumbers('platform', { frames: [3, 4, 3, 2, 1, 0, 2, 3] }),
      frameRate: 20
    });
    //this.platform = this.matter.add.sprite(50, 1050, 'platform', 0, { isStatic: true, restitiution: 1, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform.angle = 20
    //this.platform = this.matter.add.sprite(200, 1150, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform = this.matter.add.sprite(350, 1150, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform.setBody({type: 'rectangle', width: 100, height: 20})


    //const gameOver = this.matter.add.gameObject(this.add.rectangle(-CONFIG.WIDTH, CONFIG.HEIGHT+CONFIG.MAX_ROPE_LENGTH, CONFIG.WIDTH*4, 100), { shape: 'rect'})
    //gameOver.setOnCollide(()=>this.restart());

    //this.matter.world.setBounds();
    this.createObstacles();
    const platformGroup = this.matter.body.nextGroup(true)
    let platforms = this.createPlatforms(platformGroup);
    this.createHandles();
    //var ballA = this.matter.add.gameObject(this.add.rectangle(50, 50, 16, 64, 0xCCCCCC), { shape: 'rectangle', friction: 0.005, restitution: 0.6 });
    //var ballB = this.matter.add.gameObject(this.add.circle(50, 50, 10, 0xCCCCCC), { shape: 'circle', friction: 0.005, restitution: 0.6 });

    this.player = this.matter.add.sprite(50, 0, 'player', 0, { shape: { type: 'circle', radius: 25 }, scale: 1, restitution: 0, friction: 0, frictionAir: 0, frictionStatic: 0, timeScale: 1, inertia: Infinity, render: { visible: false } });
    //let rect = this.add.circle(50, 0, 20, 0xCCCCCC); //.setOrigin(0);
    //Phaser.Geom.Rectangle.Offset(rect, 0, -24);
    //let ball = this.add.image(50, 0, 'ball');
    //this.player.setBody({type: 'circle', radius: 20})
    this.player.setOrigin(0.5, 0.25);
    //this.player.setMass(1);
    this.player.setFrame(1)
    //this.player.setAngularVelocity(0.1);
    this.cameras.main.startFollow(this.player, true);
    //console.log(CONFIG.MAX_ROPE_LENGTH, this.MAX_ROPE_LENGTH_SQUARED, this.player)
    //this.createRopeTo({x:300, y:50});

    this.input.on('pointerup', (pointer) => this.clearRope());
    this.input.on('pointerdown', (pointer) => this.createRopeTo(this.nearest));


    /*this.matterCollision.addOnCollideStart({
      objectA: platforms,
      objectB: this.player,
      callback: ({ gameObjectA, gameObjectB }) => {
        gameObjectA.play("bounce", false)
        gameObjectB.setFrame(0)
        //gameObjectB.setVelocityY(-this.player.body.velocity.y)
        //console.log(gameObjectA)
      }
    });*/
    //this.player.setOnCollide({})
    this.matter.world.on('collisionstart', (event, platformBody, playerBody) => {
      if (playerBody === this.player.body && platformBody.collisionFilter.group === platformGroup) {
        platformBody.gameObject.play("bounce", false)
        this.player.setFrame(0)
        jump.play()
        if (this.rope !== null) {
          const n = event.pairs[0].collision.normal
          const v = this.player.body.velocity
          const r = event.pairs[0].restitution
          const m = CONFIG.BOUNCE_SPEED
          const s = Math.min(m, this.player.body.speed * r)
          this.matter.setVelocity(this.player, v.x * s, v.y * s)
        }
        //this.matter.body.applyForce(playerBody, playerBody.position, event.pairs[0].normal.mult(1))
      }
  });
    this.matter.world.on('collisionactive', (event, platformBody, playerBody) => {
      if (playerBody === this.player.body && platformBody.collisionFilter.group === platformGroup) {
        //this.matter.body.applyForce(playerBody, playerBody.position, this.matter.vector.mult(event.pairs[0].collision.normal, 50))
        const n = event.pairs[0].collision.normal
        const r = event.pairs[0].restitution
        const v = this.player.body.velocity
        const m = CONFIG.BOUNCE_SPEED
        const s = Math.min(m, this.player.body.speed * r)
        console.log(event.pairs[0].collision, playerBody, s, r)
        //playerBody.force = this.matter.vector.mult(event.pairs[0].collision.normal, 50)
        //this.player.setVelocity(this.matter.vector.mult(event.pairs[0].collision.normal, -1))
        //this.matter.setVelocity(this.player, v.x - n.x*v.x*r, v.y - n.y*v.y*r)
        this.matter.setVelocity(this.player, v.x - n.x*s, v.y - n.y*s)
      }

  });

    //this.RAF.start(this.update3.bind(this), true, 60)

    /*this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        console.log(bodyA, bodyB, gameOver)
        if (bodyA == gameOver || bodyB == gameOver) {
            this.restart()
        }
    });*/
    //this.matter.add.constraint(ballA, ballB, 200, 1, {pointA: {x:0, y:-24}});

    //this.matter.add.mouseSpring();
  }

  tutorial(index=0) {
    if (this.currentLevel === 0) {
      switch(index) {
        case 1:
          this.tutorialText.setText("Release 'Touch' to move FROG right\nOnwards to Finish & Glory")
          break
        default:
          this.tutorialText.setText("To cling to highlighted handle\nTouch & Hold")
      }
    }
  }

  update(t, dt) {
    this.matter.step(dt)

  //update3() {
    if (this.player.y > (CONFIG.HEIGHT + CONFIG.MAX_ROPE_LENGTH)) {
      this.scene.restart()
      this.loss.play()
    }
    if (this.player.x > this.level.width) {
      if (this.currentLevel+1 < Koji.config.levelEditor.levels.length) {
        this.scene.restart({level: this.currentLevel+1})
        this.win.play()
      } else {
        this.win.play()
        this.scene.start("EndScene");
      }
    }

    const b = this.player.body
    if (b.speed > CONFIG.MAX_SPEED) {
      const m = CONFIG.MAX_SPEED / b.speed
      const v = b.velocity
      this.matter.setVelocity(this.player, v.x * m, v.y * m)
    }

    if (this.player.y < 0 || this.player.x < 0) {
      this.arrow.visible = true
      if (this.player.y < 0) {
        this.arrow.angle = 0
        this.arrow.y = 40
        this.arrow.x = this.player.x
      } else {
        //console.log(this.arrow)
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
      //console.log(b.angularVelocity)
      this.player.flipX = b.angularVelocity < 0
      if (b.angularSpeed > 0.02)
        this.player.setFrame(3)
      else if (b.angularSpeed > 0.01)
        this.player.setFrame(2)
      else
        this.player.setFrame(1)
    }
  }

    //this.clearRope()
    //this.createRopeTo(nearest)

}