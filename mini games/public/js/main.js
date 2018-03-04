"use strict"

window.addEventListener("load", function() {
    document.body.style.height = window.innerHeight;
}, false);

PIXI.utils.sayHello();

const app = new PIXI.Application({
    height: window.innerHeight * 0.9,
    width: window.innerWidth * 0.5,
    backgroundColor: 0x9D9D9D
});


document.getElementById("display").appendChild(app.view);

const background = PIXI.Sprite.fromImage("/images/background_texture.png");
app.stage.addChild(background);

const cat = PIXI.Sprite.fromImage("/images/cat.png");
cat.anchor.set(0.5);
cat.interactive = true;
cat.x = app.renderer.view.width / 2;
cat.y = app.renderer.view.height / 2;

app.stage.addChild(cat);


const onDragStart = event => {
    cat.data = event.data;
    cat.dragging = true;
};

const onDragMove = event => {
    if (cat.dragging) {
        const newPosition = cat.data.getLocalPosition(cat.parent);
        cat.x = newPosition.x;
        cat.y = newPosition.y;
    }
}

const onDragStop = event => {
    delete cat.data;
    cat.dragging = false;
}

cat.on('pointerdown', onDragStart)
    .on('pointerup', onDragStop)
    .on('pointermove', onDragMove)
    .on('pointerupoutside', onDragStop);