"use strict"

window.addEventListener("load", function() {
    document.body.style.height = window.innerHeight;
}, false);

PIXI.utils.sayHello();

const app = new PIXI.Application({
    height: 1536 * 0.9,
    width: 2048 * 0.9,
    backgroundColor: 0x9D9D9D
});


document.getElementById("display").appendChild(app.view);

const background = PIXI.Sprite.fromImage("/images/background_texture.png");
app.stage.addChild(background);

const pipe1 = PIXI.Sprite.fromImage("/images/pipe1.png");

pipe1.interactive = true;
pipe1.anchor.set(0.5);
pipe1.scale.x = 0.1;
pipe1.scale.y = 0.1;
pipe1.x = app.renderer.view.width / 4;
pipe1.y = app.renderer.view.height / 2;

app.stage.addChild(pipe1);

pipe1.on('pointerdown', () => {
    pipe1.rotation += (Math.PI / 2);
    console.log("rotation is happening");
});