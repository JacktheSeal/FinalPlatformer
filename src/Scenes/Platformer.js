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


        //double jump check
        this.doubleJumpUsed = false;

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}, vfx: {}};

    }

    create() {



        // Create a new tilemap game object which uses 16x16 pixel tiles, and is
        // 80 tiles wide and 25 tiles tall.
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

        //puzzle requirements
        this.flowersCollected = 0;
        this.flowersNeeded = this.flowers.length;

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

        this.deathbox = this.map.createFromObjects("Objects", {
            name: "deathbox"
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
        this.physics.world.enable(this.deathbox, Phaser.Physics.Arcade.STATIC_BODY);
        //this.physics.world.enable(this.jumpmen, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.endpointGroup = this.add.group(this.endpoint);
        this.flowerGroup = this.add.group(this.flowers);
        this.deathboxGroup = this.add.group(this.deathbox);
        // this.jumpmenGroup = this.add.group(this.jumpmen);


        this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('tilemap_sheet', { start: 32, end: 33 }),
            frameRate: 2,
            repeat: -1
        })
        for (let flower of this.flowerGroup.getChildren()) {
            flower.anims.play('spin');
        }

        // set up player avatar
        this.my.sprite.player = this.physics.add.sprite(this.spawnpoint[0].x, this.spawnpoint[0].y, "platformer_characters", "tile_0000.png");
        this.my.sprite.player.setSize(10,20);
        this.my.sprite.player.setCollideWorldBounds(false);

        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        );


        // collide with left/right/top only
        this.my.sprite.player.setCollideWorldBounds(true);

        // disable collision on bottom world bound
        this.physics.world.setBoundsCollision(true, true, true, false);

        

        // Enable collision handling
        this.physics.add.collider(this.my.sprite.player, this.groundLayer);

        // TODO: Add flower collision handler
        // Handle collision detection with flowers
        this.pickupCounter = 0;
        this.physics.add.overlap(this.my.sprite.player, this.flowerGroup, (obj1, obj2) => {

            this.flowersCollected++;

            const index = this.pickupCounter % 4;
            console.log(index);

            if (index == 0) {
                this.pickupSFX.play()
            } else if (index == 1) {
                this.pickup2SFX.play();
            } else if (index == 2) {
                this.pickup3SFX.play();
            } else {
                this.pickup4SFX.play();
            }
            obj2.destroy(); // remove flower on overlap

            this.pickupCounter++;
        });

        // Handle collision detection with endpoint
        this.isPlaying = false; // flag to prevent multiple overlaps from triggering multiple scene transitions
        this.physics.add.overlap(this.my.sprite.player, this.endpointGroup, (obj1, obj2) => {
            if (!this.isPlaying && this.flowersCollected == this.flowersNeeded) {
                this.isPlaying = true;
                const text = this.add.text(
                    1120,
                    150,
                    "LEVEL COMPLETE",
                    {
                        fontSize: "28px",
                        color: "#81c74c",
                        stroke: "#000",
                        strokeThickness: 4
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
            else if (!this.isPlaying && this.flowersCollected != this.flowersNeeded) {
                this.isPlaying = true;
                const text = this.add.text(
                    1120,
                    150,
                    "Collect all flowers to proceed!",
                    {
                        fontSize: "12px",
                        color: "#81c74c",
                        stroke: "#000",
                        strokeThickness: 4
                    }
                ).setOrigin(0.5);
        
                text.setScale(0.2);
        
                this.tweens.add({
                    targets: text,
                    scale: 1.2,
                    duration: 600,
                    ease: "Back.Out",
                    onComplete: () => {
                        this.time.delayedCall(1000, () => {
                            text.destroy();
                        });
                    }
                });
            }
        });

        this.physics.add.overlap(this.my.sprite.player, this.deathboxGroup, (obj1, obj2) => {
            if(!this.isPlaying) {
                this.isPlaying = true;
                this.deathSFX.play();

                this.time.delayedCall(400, () => {
                    this.my.sprite.player.setVelocityY(0);
                    this.my.sprite.player.setPosition(this.spawnpoint[0].x, this.spawnpoint[0].y);
                    this.isPlaying = false;
                    this.cameras.main.pan(this.my.sprite.player.x, this.my.sprite.player.y, 300, "Power2", true);
                    
                    this.cameras.main.centerOn(this.my.sprite.player.x, this.my.sprite.player.y);
                })
            }
        })

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx

        this.my.vfx.walking = this.add.particles(0, 5, "white_pixel",  {
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -10,
            alpha: {start: 1, end: 0.1}, 
        });

        this.my.vfx.walking.stop();

        this.my.vfx.jump = this.add.particles(0, 5, "grey_pixel", {
            speed: {min: 50, max: 150},
            angle: {min: 60, max: 120},
            scale: {start: 0.12, end: 0},
            lifespan: 200,
            gravityY: 100,

        });

        this.my.vfx.dashLeft = this.add.particles(5, 5, "white_pixel", {
            speed: {min: 100, max: 250},
            angle: {min: 330, max: 390},
            scale: {start: 0.12, end: 0},
            lifespan: 200,
            gravityY: 200,

        });

        this.my.vfx.dashRight = this.add.particles(-5, 5, "white_pixel", {
            speed: {min: 100, max: 250},
            angle: {min: 150, max: 210},
            scale: {start: 0.12, end: 0},
            lifespan: 200,
            gravityY: 200,

        });

        this.my.vfx.walking.stop();


        //create camera group
        this.cameraZones = this.map.createFromObjects("CameraZones", {
            name: "zone"
        });

        this.cameraZones.forEach(zone => {
            zone.setVisible(false);
        });

        console.log(this.cameraZones);

        this.cameraZoneGroup = this.add.group(this.cameraZones);

        this.physics.world.enable(this.cameraZoneGroup, Phaser.Physics.Arcade.STATIC_BODY);

        console.log(this.cameraZoneGroup);

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        //this.cameras.main.startFollow(this.my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        //this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        //this.cameras.main.setScroll(0,0);

        //create camera movement
        this.cameraTransitioning = false;
        this.currentZone = null;

        // this.physics.add.overlap(
        //     this.my.sprite.player,
        //     this.cameraZoneGroup,
        //     (player, zone) => {
        //         console.log("collided!");
        //         const cam = this.cameras.main;

        //         const targetX = zone.getData("cameraX");
        //         const targetY = zone.getData("cameraY");

        //         cam.pan(targetX, targetY, 500, "Power2");
        //     }
        // )

        this.physics.add.overlap(
            this.my.sprite.player,
            this.cameraZoneGroup,
            (player, zone) => {

                // prevent spam / multi-zone conflicts
                if (this.cameraTransitioning) return;

                // prevent re-triggering same zone
                if (this.currentZone === zone) return;

                this.cameraTransitioning = true;
                this.currentZone = zone;

                const cam = this.cameras.main;

                const targetX = zone.getData("cameraX");
                const targetY = zone.getData("cameraY");

                cam.pan(targetX, targetY, 300, "Power2", true, (cam, progress) => {
                    if (progress === 1) {
                        this.cameraTransitioning = false;
                    }
                });
            }
        );


        

        //make audio work good i guess
        this.soundLocked = true;
        this.audioReady = false;
        
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        //to make sure you dont crash the game before playing
        this.spacePressed = false;
        //overengineered because I was trying to make it work with right move. 
        this.unlockAudio = () => {
            this.spacePressed = true;
            console.log("state:", this.sound.context.state);

            if (!this.soundLocked) return;

            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume().then(() => {
                    console.log("made it into resume?");
                    this.soundLocked = false;
                    this.audioReady = true;

                    console.log("Audio unlocked");

                    this.createAudio();
                });
            } else {
                // already running → don't wait on resume
                console.log("Audio already running");
                this.soundLocked = false;
                this.audioReady = true;
                this.createAudio();
            }
        };

        this.input.keyboard.once('keydown-SPACE', this.unlockAudio);

        

        
        this.cameras.main.centerOn(this.my.sprite.player.x, this.my.sprite.player.y);


    }

    update() {

        if (!this.spacePressed) {
            return;
        }

        
        //reset double jump
        if (this.my.sprite.player.body.blocked.down) {
            this.doubleJumpUsed = false;
        }


        const onGround = this.my.sprite.player.body.blocked.down;
        //kinda just didnt use these but it feels nice to play so not gonna use em :P
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
            if (this.audioReady && this.walkLeftSFX && this.my.sprite.player.body.blocked.down) {
                if(this.walkRightSFX) {
                    if(this.walkRightSFX.isPlaying) {
                        this.walkRightSFX.stop();
                    }
                }
                if (!this.walkLeftSFX.isPlaying) {
                    this.walkLeftSFX.play();
                }
            }

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
            if (this.audioReady && this.walkRightSFX && this.my.sprite.player.body.blocked.down) {
                if(this.walkLeftSFX) {
                    if(this.walkLeftSFX.isPlaying) {
                        this.walkLeftSFX.stop();
                    }
                }
                if (!this.walkRightSFX.isPlaying) {
                    this.walkRightSFX.play();
                }
            }
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

            //have walking sfx stop
            if(this.walkLeftSFX) {
                if(this.walkLeftSFX.isPlaying) {
                    this.walkLeftSFX.stop();
                }
            }

            if(this.walkRightSFX) {
                if(this.walkRightSFX.isPlaying) {
                    this.walkRightSFX.stop();
                }
            }
        }


        //player walljump
        if(this.my.sprite.player.body.blocked.right && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.doubleJumpSFX.play();
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.my.sprite.player.body.setVelocityX(-150);
            this.my.vfx.jump.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);

            //we wall jumpin
        }
        else if(this.my.sprite.player.body.blocked.left && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.doubleJumpSFX.play();
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.my.sprite.player.body.setVelocityX(150);
            this.my.vfx.jump.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);
        }



        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!this.my.sprite.player.body.blocked.down) {
            this.my.sprite.player.anims.play('jump');
            this.my.vfx.walking.stop();
            this.walkLeftSFX?.stop();
            this.walkRightSFX?.stop();
        }
        if(this.my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jumpSFX.play();
            this.my.vfx.jump.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        //double jump
        if(!this.my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up) && !this.doubleJumpUsed) {
            this.doubleJumpSFX.play();
            this.my.vfx.jump.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.doubleJumpUsed = true;
        }

        //dash
        this.isDashing = false;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.shift) && !this.isDashing) {
            this.dashSFX.play();
            this.isDashing = true;
            console.log("shift pressed");

            // pause vertical movement
            this.my.sprite.player.setVelocityY(0);

            // temporary gravity disable
            this.my.sprite.player.body.allowGravity = false;

            // dash direction
            if (this.my.sprite.player.flipX) {
                // facing right
                this.my.sprite.player.setVelocityX(700);
                console.log("dashing left");
                this.my.vfx.dashRight.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);
            } else {
                // facing left
                this.my.sprite.player.setVelocityX(-700);
                console.log("dashing right");
                this.my.vfx.dashLeft.explode(20, this.my.sprite.player.x, this.my.sprite.player.y);
            }

            // dash squash/stretch effect
            this.tweens.add({
                targets: this.my.sprite.player,
                scaleX: 1.4,
                scaleY: 0.8,
                duration: 80,
                yoyo: true
            });

            // restore gravity after dash
            this.time.delayedCall(150, () => {
                this.my.sprite.player.body.allowGravity = true;

                this.my.sprite.player.body.velocity.x = this.my.sprite.player.body.velocity.x * 0.35; // stop horizontal movement after dash
                this.isDashing = false;
            });
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        
        
    }

    createAudio() {
        this.walkLeftSFX = this.sound.add("walkLeftSFX", { loop: true, volume: 0.05 });
        this.walkRightSFX = this.sound.add("walkRightSFX", { loop: true, volume: 0.05 });
        this.pickupSFX = this.sound.add("pickupSFX", { volume: 0.2 });
        this.pickup2SFX = this.sound.add("pickup2SFX", { volume: 0.2 });
        this.pickup3SFX = this.sound.add("pickup3SFX", { volume: 0.2 });
        this.pickup4SFX = this.sound.add("pickup4SFX", { volume: 0.2 });
        this.dashSFX = this.sound.add("dashSFX", { volume: 0.2 });
        this.jumpSFX = this.sound.add("jumpSFX", { volume: 0.2 });
        this.doubleJumpSFX = this.sound.add("doubleJumpSFX", { volume: 0.2 });
        this.deathSFX = this.sound.add("deathSFX", { volume: 0.2 });
    }
}


