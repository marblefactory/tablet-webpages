class Cat extends PIXI.Sprite {
    constructor(app) {
        super(PIXI.Texture.fromImage("/images/cat.png"));
        this.anchor = 0.5;
        this.interactive = true;
        this.x = app.renderer.view.width / 2;
        this.y = app.renderer.view.height / 2;
    }
}