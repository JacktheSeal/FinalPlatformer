export default class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("gray_pixel", "gray_pixel.png");
        this.load.image("white_pixel", "white_pixel.png");
        this.load.image("tilemap_tiles", "kenney_pixel-line-platformer/Tilemap/tilemap_packed.png");                         // Packed tilemap
        this.load.tilemapTiledJSON("main_level", "main_level.tmj");   // Tilemap in JSON

        //Load sound effects
        this.load.audio("walkLeftSFX", 'Sounds/move-a.ogg');
        this.load.audio("walkRightSFX", 'Sounds/move-b.ogg');
        this.load.audio("pickupSFX", 'Sounds/coin-a.ogg');
        this.load.audio("pickup2SFX", 'Sounds/coin-b.ogg');
        this.load.audio("pickup3SFX", 'Sounds/coin-c.ogg');
        this.load.audio("pickup4SFX", 'Sounds/coin-d.ogg');
        this.load.audio("dashSFX", 'Sounds/shoot-g.ogg');
        this.load.audio("jumpSFX", 'Sounds/jump-a.ogg');
        this.load.audio("doubleJumpSFX", 'Sounds/jump-b.ogg');


        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "kenney_pixel-line-platformer/Tilemap/tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}