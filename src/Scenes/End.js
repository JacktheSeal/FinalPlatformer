import Platformer from "./Platformer.js";
export default class End extends Phaser.Scene {
    constructor() {
        super("End");

        console.log("i made it to end");
    }

    preload() {

    }

    create() {
        this.add.text(this.game.config.width / 2 - 100, this.game.config.height / 2 - 100, "You Win! Press space to play again.", {
            fontFamily: 'GameFont',
            fontSize: '32px',
            wordWrap: {
                width: 200
            },
            color: "#ffffff"
        });

        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            this.scene.start("platformerScene");
        }
    }
}