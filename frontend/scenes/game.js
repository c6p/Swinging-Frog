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
      this.add.circle(p.x, p.y, 10, 0xCCCCCC);
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
    this.load.image('highlight', Koji.config.images.highlight);
    this.load.image('arrow', Koji.config.images.arrow);
    this.load.spritesheet('player', Koji.config.images.player, { frameWidth: 80, frameHeight: 80 });
  }
  
  create() {
    this.cameras.main.setBounds(0, 0, CONFIG.WIDTH*2, CONFIG.HEIGHT);
	  this.matter.world.update30Hz();
    this.highlight = this.add.image(0, 0, 'highlight');
    this.arrow = this.add.image(0, 0, 'arrow').setVisible(false);

    //const gameOver = this.matter.add.gameObject(this.add.rectangle(-CONFIG.WIDTH, CONFIG.HEIGHT+CONFIG.MAX_ROPE_LENGTH, CONFIG.WIDTH*4, 100), { shape: 'rect'})
    //gameOver.setOnCollide(()=>this.restart());

    //this.matter.world.setBounds();
    this.createHandles();
    //var ballA = this.matter.add.gameObject(this.add.rectangle(50, 50, 16, 64, 0xCCCCCC), { shape: 'rectangle', friction: 0.005, restitution: 0.6 });
    //var ballB = this.matter.add.gameObject(this.add.circle(50, 50, 10, 0xCCCCCC), { shape: 'circle', friction: 0.005, restitution: 0.6 });

    //let rect = this.add.circle(50, 0, 20, 0xCCCCCC); //.setOrigin(0);
    //Phaser.Geom.Rectangle.Offset(rect, 0, -24);
    //let ball = this.add.image(50, 0, 'ball');
    this.player = this.matter.add.sprite(50, 0, 'player', 0, { friction: 0, frictionAir: 0, timeScale: 0.5, render: { visible: false }});
    this.player.setOrigin(0.5,0.25);
    this.player.setMass(1);
    this.player.setFrame(1)
    //this.player.setAngularVelocity(0.1);
    this.cameras.main.startFollow(this.player, true);
    //console.log(CONFIG.MAX_ROPE_LENGTH, this.MAX_ROPE_LENGTH_SQUARED, this.player)
    //this.createRopeTo({x:300, y:50});

    this.input.on('pointerup', (pointer) => this.clearRope());
    this.input.on('pointerdown', (pointer) => this.createRopeTo(this.nearest));


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
        console.log(this.arrow)
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
    }

    //this.clearRope()
    //this.createRopeTo(nearest)
  }

}