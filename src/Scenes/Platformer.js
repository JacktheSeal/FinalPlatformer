import End from "./End.js";
export default class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}, vfx: {}};
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("main_level", 16, 16, 80, 20);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_pixel_tilemap_packed", "tilemap_tiles");

        // Create layers
        this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0);
        this.cloudLayer = this.map.createLayer("Clouds", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.foregroundLayer = this.map.createLayer("Foreground", this.tileset, 0, 0);


        // Add collisions
        this.groundLayer.setCollisionByProperty({
            collides: true
        });



        //Add objects
        this.flowers = this.map.createFromObjects("Objects", {
            name: "flower",
            key: "tilemap_sheet",
            frame: 33
        });

        this.spawnpoint = this.map.createFromObjects("Objects", {
            name: "spawnpoint",
            key: "tilemap_sheet",
            frame: 31
        })

        this.endpoint = this.map.createFromObjects("Objects", {
            name: "endpoint",
            key: "tilemap_sheet",
            frame: 30
        })

        // this.jumpmen = this.map.createFromObjects("Objects", {
        //     name: "jumpman",
        //     key: "tilemap_sheet",
        //     frame: 145
        // })

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.flowers, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.endpoint, Phaser.Physics.Arcade.STATIC_BODY);
        //this.physics.world.enable(this.jumpmen, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.endpointGroup = this.add.group(this.endpoint);
        this.flowerGroup = this.add.group(this.flowers);
        // this.jumpmenGroup = this.add.group(this.jumpmen);


        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('tilemap_sheet', { start: 32, end: 33 }),
            frameRate: 6,
            repeat: -1
        })
        for (let flower of this.flowerGroup.getChildren()) {
            flower.anims.play('spin');
        }

        // set up player avatar
        this.my.sprite.player = this.physics.add.sprite(this.spawnpoint[0].x, this.spawnpoint[0].y, "platformer_characters", "tile_0000.png");
        this.my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(this.my.sprite.player, this.groundLayer);

        // TODO: Add flower collision handler
        // Handle collision detection with flowers
        this.physics.add.overlap(this.my.sprite.player, this.flowerGroup, (obj1, obj2) => {
            obj2.destroy(); // remove flower on overlap
        });

        // Handle collision detection with endpoint
        this.isPlaying = false; // flag to prevent multiple overlaps from triggering multiple scene transitions
        this.physics.add.overlap(this.my.sprite.player, this.endpointGroup, (obj1, obj2) => {
            if (!this.isPlaying) {
                this.isPlaying = true;
                const text = this.add.text(
                    this.game.config.width / 2,
                    this.game.config.height / 2,
                    "LEVEL COMPLETE",
                    {
                        fontSize: "32px",
                        color: "#dfdf3e",
                        stroke: "#000",
                        strokeThickness: 8
                    }
                ).setOrigin(0.5);
        
                text.setScale(0.2);
        
                this.tweens.add({
                    targets: text,
                    scale: 1.2,
                    duration: 600,
                    ease: "Back.Out"
                });
        
                this.time.delayedCall(2500, () => {
                    this.scene.start("End");
                });
            }
        });


        // this.physics.add.overlap(this.my.sprite.player, this.jumpmenGroup, (obj1, obj2) => {
        //     obj2.destroy(); // remove jumpman on overlap
        //     this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY * 1.5); // extra jump boost
        // });

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        this.my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        this.my.vfx.walking.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        const onGround = this.my.sprite.player.body.blocked.down;
        let accel;
        let drag;

        if (onGround) {
            accel = this.ACCELERATION;
            drag = this.DRAG;
        } else {
            accel = this.ACCELERATION * 0.6;
            drag = 50;
        }
        if(this.cursors.left.isDown) {
            this.my.sprite.player.setAccelerationX(-this.ACCELERATION);
            this.my.sprite.player.resetFlip();
            this.my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            this.my.vfx.walking.startFollow(this.my.sprite.player, this.my.sprite.player.displayWidth/2-10, this.my.sprite.player.displayHeight/2-5, false);

            this.my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (this.my.sprite.player.body.blocked.down) {

                this.my.vfx.walking.start();

            }

        } else if(this.cursors.right.isDown) {
            this.my.sprite.player.setAccelerationX(this.ACCELERATION);
            this.my.sprite.player.setFlip(true, false);
            this.my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            this.my.vfx.walking.startFollow(this.my.sprite.player, this.my.sprite.player.displayWidth/2-10, this.my.sprite.player.displayHeight/2-5, false);

            this.my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (this.my.sprite.player.body.blocked.down) {

                this.my.vfx.walking.start();

            }
            

        } else {
            // Set acceleration to 0 and have DRAG take over
            this.my.sprite.player.setAccelerationX(0);
            this.my.sprite.player.setDragX(this.DRAG);
            this.my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            this.my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!this.my.sprite.player.body.blocked.down) {
            this.my.sprite.player.anims.play('jump');
        }
        if(this.my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.shift)) {

            console.log("shift pressed");

            // pause vertical movement
            this.my.sprite.player.setVelocityY(0);

            // temporary gravity disable
            this.my.sprite.player.body.allowGravity = false;

            // dash direction
            if (this.my.sprite.player.flipX) {
                // facing left
                this.my.sprite.player.setVelocityX(700);
            } else {
                // facing right
                this.my.sprite.player.setVelocityX(-700);
            }

            // dash squash/stretch effect
            this.tweens.add({
                targets: this.my.sprite.player,
                scaleX: 1.4,
                scaleY: 0.8,
                duration: 100,
                yoyo: true
            });

            // restore gravity after dash
            this.time.delayedCall(150, () => {
                this.my.sprite.player.body.allowGravity = true;
                this.my.sprite.player.body.velocity.x * 0.35; // stop horizontal movement after dash
            });
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}