"use strict"

window.addEventListener("load", function() {
    document.body.style.height = window.innerHeight;

}, false);

PIXI.utils.sayHello();

const app = new PIXI.Application({
    height: window.innerHeight * 0.95,
    width: window.innerWidth * 0.95,
    backgroundColor: 0x404142
});

document.getElementById("display").appendChild(app.view);

var textOptions = {
    fontFamily: "Arial", // Set  style, size and font
    fontSize: "64px",
    fontSylte: "bold",
    fill: '#222323', // Set fill color to blue
    align: 'center', // Center align the text, since it's multiline
    stroke: '#e2e2e2', // Set stroke color to a dark blue gray color
    strokeThickness: 5, // Set stroke thickness to 20
    lineJoin: 'round' // Set the lineJoin to round
}

var center_text = new PIXI.Text(">_Terminal Ready", textOptions);

center_text.anchor.set(0.5);
center_text.x = app.view.width * 0.5;
center_text.y = app.view.height * 0.5;

app.stage.addChild(center_text);

function poll()