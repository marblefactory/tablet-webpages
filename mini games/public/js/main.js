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

const pipe1 = PIXI.Sprite.fromImage("/images/pipe_left.png");
const pipe1_correct = PIXI.Sprite.fromImage("/images/pipe_left_correct.png");

pipe1.interactive = true;
pipe1.anchor.set(0.5);
pipe1.scale.x = 0.1;
pipe1.scale.y = 0.1;
pipe1.x = app.renderer.view.width / 4;
pipe1.y = app.renderer.view.height / 2;

pipe1_correct.interactive = true;
pipe1_correct.anchor.set(0.5);
pipe1_correct.scale.x = 0.1;
pipe1_correct.scale.y = 0.1;
pipe1_correct.x = app.renderer.view.width / 4;
pipe1_correct.y = app.renderer.view.height / 2;
pipe1_correct.visible = false;

app.stage.addChild(pipe1);
app.stage.addChild(pipe1_correct);

pipe1.on('click', () => {
    pipe1.rotation += (Math.PI / 2);
    if (Math.round((pipe1.rotation * 360) / (Math.PI * 2) % 360) === 90) {
        pipe1_correct.rotation = pipe1.rotation;
        pipe1_correct.visible = true;
        pipe1.visible = false;
    }
});

pipe1_correct.on('click', () => {
    pipe1_correct.rotation += (Math.PI / 2);
    pipe1.rotation = pipe1_correct.rotation;
    pipe1.visible = true;
    pipe1_correct.visible = false;
});