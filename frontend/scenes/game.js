import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';

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
  platform

  nearestHandleTo(point) {
      const level = Koji.config.levelEditor.levels[this.currentLevel]
      if (level.length == 0)
        return
      let nearest = level[0]
      
      let minDist = Phaser.Math.Distance.BetweenPointsSquared(nearest, point)
      for (let p of level) {
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
    this.matter.setVelocityY(this.player, this.player.body.velocity.y-2);
    this.player.setFrame(0);
  }

  createRopeTo(point) {
    if (point === null)
      return
    const distance = Phaser.Math.Distance.BetweenPoints(this.player, point) ;
    this.rope = this.matter.add.worldConstraint(this.player, distance, 1, {pointA: point, render: {lineColor: 0xf8615a, anchorColor: 0xf8615a, anchorSize: 2} });
    //console.log(this.rope)
    this.player.setFrame(1)
  }

  createHandles() {
    const level = Koji.config.levelEditor.levels[this.currentLevel]
    for (let p of level) {
      //console.log(p)
      //this.add.circle(p.x, p.y, 10, 0xCCCCCC);
      this.add.image(p.x, p.y, 'handle')
    }
  }s


  playerPos() {
    let {x,y} = this.player
    return {x, y}
  }

  init({level=0}) { 
    this.currentLevel = level;
  }

  preload() { 
    this.load.image('handle', Koji.config.images.handle);
    this.load.image('highlight', Koji.config.images.highlight);
    this.load.image('arrow', Koji.config.images.arrow);
    this.load.spritesheet('player', Koji.config.images.player, { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet('platform', Koji.config.images.platform, { frameWidth: 120, frameHeight: 50 });
  }
  
  create() {
    var graphics = this.add.graphics();
    const [W, H] = [CONFIG.WIDTH*2, CONFIG.HEIGHT]

    graphics.fillGradientStyle(0x2980B9, 0x6DD5FA, 0x0082c8, 0x667db6, 1);
    graphics.fillRect(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    //this.matter.world.update30Hz();
    this.highlight = this.add.image(0, 0, 'highlight');
    this.arrow = this.add.image(0, 0, 'arrow').setVisible(false);

    this.anims.create({
        key: 'bounce',
        frames: this.anims.generateFrameNumbers('platform', { frames: [ 3,4,3,2,1,0,2,3 ] }),
        frameRate: 20
    });
    this.platform = this.matter.add.sprite(50, 1150, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform = this.matter.add.sprite(200, 1150, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform = this.matter.add.sprite(350, 1150, 'platform', 0, { isStatic: true, shape: {type: 'rectangle', width: 100, height: 10}, render: {visible: false} }).setFrame(3)
    //this.platform.setBody({type: 'rectangle', width: 100, height: 20})


    //const gameOver = this.matter.add.gameObject(this.add.rectangle(-CONFIG.WIDTH, CONFIG.HEIGHT+CONFIG.MAX_ROPE_LENGTH, CONFIG.WIDTH*4, 100), { shape: 'rect'})
    //gameOver.setOnCollide(()=>this.restart());

    //this.matter.world.setBounds();
    this.createHandles();
    //var ballA = this.matter.add.gameObject(this.add.rectangle(50, 50, 16, 64, 0xCCCCCC), { shape: 'rectangle', friction: 0.005, restitution: 0.6 });
    //var ballB = this.matter.add.gameObject(this.add.circle(50, 50, 10, 0xCCCCCC), { shape: 'circle', friction: 0.005, restitution: 0.6 });

    //let rect = this.add.circle(50, 0, 20, 0xCCCCCC); //.setOrigin(0);
    //Phaser.Geom.Rectangle.Offset(rect, 0, -24);
    //let ball = this.add.image(50, 0, 'ball');
    this.player = this.matter.add.sprite(50, 0, 'player', 0, {shape: {type:'circle', radius:25}, scale: 0.5, friction: 0, frictionAir: 0, timeScale: 0.5, render: { visible: false }});
    //this.player.setBody({type: 'circle', radius: 20})
    this.player.setOrigin(0.5,0.25);
    this.player.setMass(1);
    this.player.setFrame(1)
    //this.player.setAngularVelocity(0.1);
    this.cameras.main.startFollow(this.player, true);
    //console.log(CONFIG.MAX_ROPE_LENGTH, this.MAX_ROPE_LENGTH_SQUARED, this.player)
    //this.createRopeTo({x:300, y:50});

    this.input.on('pointerup', (pointer) => this.clearRope());
    this.input.on('pointerdown', (pointer) => this.createRopeTo(this.nearest));

this.matterCollision.addOnCollideStart({
  objectA: this.platform,
  objectB: this.player,
  callback: ({gameObjectA, gameObjectB}) => {
    gameObjectA.play("bounce", false)
    gameObjectB.setVelocityY(-this.player.body.velocity.y)
    console.log(gameObjectA)
  }
});

    /*this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        console.log(bodyA, bodyB, gameOver)
        if (bodyA == gameOver || bodyB == gameOver) {
            this.restart()
        }
    });*/
    //this.matter.add.constraint(ballA, ballB, 200, 1, {pointA: {x:0, y:-24}});

    //this.matter.add.mouseSpring();
  }

  update(t,dt) {
    if (this.player.y > (CONFIG.HEIGHT + CONFIG.MAX_ROPE_LENGTH))
        this.scene.restart()

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
    } else
      this.arrow.visible = false

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

    //this.clearRope()
    //this.createRopeTo(nearest)
  }

}