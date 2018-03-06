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

const pipe1 = PIXI.Sprite.fromImage("/images/pipe_three.png");
const pipe1_correct = PIXI.Sprite.fromImage("/images/pipe_three_correct.png");
const pipe2 = PIXI.Sprite.fromImage("/images/single_pipe.png");
const pipe2_correct = PIXI.Sprite.fromImage("images/single_pipe_correct.png");
const pipe3 = PIXI.Sprite.fromImage("/images/single_pipe.png");
const pipe3_correct = PIXI.Sprite.fromImage("images/single_pipe_correct.png");
const pipe4 = PIXI.Sprite.fromImage("/images/pipe_left.png");
const pipe4_correct = PIXI.Sprite.fromImage("/images/pipe_left_correct.png");
const pipe5 = PIXI.Sprite.fromImage("/images/pipe_left.png");
const pipe5_correct = PIXI.Sprite.fromImage("/images/pipe_left_correct.png");
const pipe6 = PIXI.Sprite.fromImage("/images/single_pipe.png");
const pipe6_correct = PIXI.Sprite.fromImage("images/single_pipe_correct.png");
const pipe7 = PIXI.Sprite.fromImage("/images/single_pipe.png");
const pipe7_correct = PIXI.Sprite.fromImage("images/single_pipe_correct.png");

pipe1.interactive = true;
pipe1.anchor.set(0.5);
pipe1.scale.x = 0.1;
pipe1.scale.y = 0.1;
pipe1.x = app.renderer.view.width * 0.15;
pipe1.y = app.renderer.view.height * 0.2;

pipe1_correct.interactive = true;
pipe1_correct.anchor.set(0.5);
pipe1_correct.scale.x = 0.1;
pipe1_correct.scale.y = 0.1;
pipe1_correct.x = app.renderer.view.width * 0.15;
pipe1_correct.y = app.renderer.view.height * 0.2;
pipe1_correct.visible = false;

pipe2.scale.x = 0.1;
pipe2.scale.y = 0.8;
pipe2.x = app.renderer.view.width * 0.11;
pipe2.y = app.renderer.view.height * 0.30;

pipe2_correct.scale.x = 0.1;
pipe2_correct.scale.y = 0.8;
pipe2_correct.x = app.renderer.view.width * 0.11;
pipe2_correct.y = app.renderer.view.height * 0.30;
pipe2_correct.visible = false;

pipe3.scale.x = 13;
pipe3.scale.y = 0.01;
pipe3.x = app.renderer.view.width * 0.2;
pipe3.y = app.renderer.view.height * 0.2;

pipe3_correct.scale.x = 13;
pipe3_correct.scale.y = 0.01;
pipe3_correct.x = app.renderer.view.width * 0.2;
pipe3_correct.y = app.renderer.view.height * 0.2;
pipe3_correct.visible = false;

pipe4.interactive = true;
pipe4.anchor.set(0.5);
pipe4.scale.x = 0.1;
pipe4.scale.y = 0.1;
pipe4.x = app.renderer.view.width * 0.73;
pipe4.y = app.renderer.view.height * 0.25;

pipe4_correct.interactive = true;
pipe4_correct.anchor.set(0.5);
pipe4_correct.scale.x = 0.1;
pipe4_correct.scale.y = 0.1;
pipe4_correct.x = app.renderer.view.width * 0.73;
pipe4_correct.y = app.renderer.view.height * 0.25;
pipe4_correct.visible = false;

pipe5.interactive = true;
pipe5.anchor.set(0.5);
pipe5.scale.x = 0.1;
pipe5.scale.y = 0.1;
pipe5.x = app.renderer.view.width * 0.15;
pipe5.y = app.renderer.view.height * 0.85;

pipe5_correct.interactive = true;
pipe5_correct.anchor.set(0.5);
pipe5_correct.scale.x = 0.1;
pipe5_correct.scale.y = 0.1;
pipe5_correct.x = app.renderer.view.width * 0.15;
pipe5_correct.y = app.renderer.view.height * 0.85;
pipe5_correct.visible = false;

pipe6.scale.x = 13;
pipe6.scale.y = 0.01;
pipe6.x = app.renderer.view.width * 0.2;
pipe6.y = app.renderer.view.height * 0.89;

pipe6_correct.scale.x = 13;
pipe6_correct.scale.y = 0.01;
pipe6_correct.x = app.renderer.view.width * 0.2;
pipe6_correct.y = app.renderer.view.height * 0.89;
pipe6_correct.visible = false;

pipe7.scale.x = 0.1;
pipe7.scale.y = 0.8;
pipe7.x = app.renderer.view.width * 0.76;
pipe7.y = app.renderer.view.height * 0.32;

pipe7_correct.scale.x = 0.1;
pipe7_correct.scale.y = 0.8;
pipe7_correct.x = app.renderer.view.width * 0.76;
pipe7_correct.y = app.renderer.view.height * 0.32;
pipe7_correct.visible = false;

app.stage.addChild(pipe1);
app.stage.addChild(pipe1_correct);
app.stage.addChild(pipe2);
app.stage.addChild(pipe2_correct);
app.stage.addChild(pipe3);
app.stage.addChild(pipe3_correct);
app.stage.addChild(pipe4);
app.stage.addChild(pipe4_correct);
app.stage.addChild(pipe5);
app.stage.addChild(pipe5_correct);
app.stage.addChild(pipe6);
app.stage.addChild(pipe6_correct);
app.stage.addChild(pipe7);
app.stage.addChild(pipe7_correct);

function update_pipe_2(){
    if (pipe2.visible){
        pipe2.visible = false;
        pipe2_correct.visible = true;
    }
    else{
        pipe2.visible = true;
        pipe2_correct.visible = false;
    }
}

function update_pipe_3(){
    if (pipe3.visible){
        pipe3.visible = false;
        pipe3_correct.visible = true;
    }
    else{
        pipe3.visible = true;
        pipe3_correct.visible = false;
    }
}

function update_pipe_4(){
    if (Math.round((pipe4.rotation * 360) / (Math.PI * 2) % 360) === 270 && pipe1_correct.visible) {
        pipe4.visible = false;
        pipe4_correct.visible = true;
    }
    else {
        pipe4.visible = true;
        pipe4_correct.visible = false;
    }
}

function update_pipe_5(){
    if (Math.round((pipe5.rotation * 360) / (Math.PI * 2) % 360) === 90 && pipe1_correct.visible) {
        pipe5.visible = false;
        pipe5_correct.visible = true;
        update_pipe_6();
    }
    else {
        pipe5.visible = true;
        pipe5_correct.visible = false;
        update_pipe_6();
    }
}

function update_pipe_6(){
    if (pipe6.visible && pipe5_correct.visible){
        pipe6.visible = false;
        pipe6_correct.visible = true;
    }
    else {
        pipe6.visible = true;
        pipe6_correct.visible = false
    }
}

function update_pipe_7(){
    if (pipe7.visible && pipe4_correct.visible){
        pipe7.visible = false;
        pipe7_correct.visible = true;
    }
    else {
        pipe7.visible = true;
        pipe7_correct.visible = false
    }
}

pipe1.on('click', () => {
    pipe1.rotation += (Math.PI / 2);
    if (Math.round((pipe1.rotation * 360) / (Math.PI * 2) % 360) === 90) {
        pipe1_correct.rotation = pipe1.rotation;
        pipe1_correct.visible = true;
        pipe1.visible = false;
        update_pipe_2();
        update_pipe_3();
        update_pipe_4();
        update_pipe_5();
    }
});

pipe1_correct.on('click', () => {
    pipe1_correct.rotation += (Math.PI / 2);
    pipe1.rotation = pipe1_correct.rotation;
    pipe1.visible = true;
    pipe1_correct.visible = false;
    update_pipe_2();
    update_pipe_3();
    update_pipe_4();
    update_pipe_5();
});

pipe4.on('click', () => {
    pipe4.rotation += (Math.PI / 2);
    if (Math.round((pipe4.rotation * 360) / (Math.PI * 2) % 360) === 270 && pipe3_correct.visible) {
        pipe4_correct.rotation = pipe4.rotation;
        pipe4_correct.visible = true;
        pipe4.visible = false;
        update_pipe_7();
    }
});

pipe4_correct.on('click', () => {
    pipe4_correct.rotation += (Math.PI / 2);
    pipe4.rotation = pipe4_correct.rotation;
    pipe4.visible = true;
    pipe4_correct.visible = false;
    update_pipe_7();
});

pipe5.on('click', () => {
    pipe5.rotation += (Math.PI / 2);
    if (Math.round((pipe5.rotation * 360) / (Math.PI * 2) % 360) === 90 && pipe2_correct.visible) {
        pipe5_correct.rotation = pipe5.rotation;
        pipe5_correct.visible = true;
        pipe5.visible = false;
        update_pipe_6();
    }
});

pipe5_correct.on('click', () => {
    pipe5_correct.rotation += (Math.PI / 2);
    pipe5.rotation = pipe5_correct.rotation;
    pipe5.visible = true;
    pipe5_correct.visible = false;
    update_pipe_6();
});

