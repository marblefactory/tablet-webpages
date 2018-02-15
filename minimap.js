
function Minimap(canvas) {
    this.ctx = canvas.getContext('2d');
}

Minimap.prototype = {
    width: function() {
        return this.ctx.canvas.width;
    },

    height: function() {
        return this.ctx.canvas.height;
    },

    /**
     * Resizes the canvas to fit to fullscreen.
     */
    fullscreen: function() {
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
    },

    /**
     * Draws the background map.
     */
    draw_background: function() {
        // var image = document.getElementById('map_background');
        var background = new Image();
        background.src = "map.jpg";

        // Make sure the image is loaded first otherwise nothing will draw.
        var _this = this;
        background.onload = function() {
            _this.ctx.drawImage(background, 0, 0, _this.width(), _this.height());
        }
    }
};

window.onload = function() {
    var canvas = document.getElementById('minimap');
    var minimap = new Minimap(canvas);
    minimap.fullscreen();
    minimap.draw_background();

    // var background = new Image();
    // background.src = "map.jpg";
    //
    // var canvas = document.getElementById("minimap");
    // var ctx = canvas.getContext("2d");
    //
    //
    //
    // // // Make sure the image is loaded first otherwise nothing will draw.
    // background.onload = function(){
    //     ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    // }
}

// window.onload = function() {
//     var div = document.createElement("div");
//     var div_text = document.createTextNode("HelloWorld");
//     div.appendChild(div_text);
//     document.body.appendChild(div);
//     //load();
// }
//
// var Board = function() {
//     this.canvas = document.createElement("canvas");
//
//     this.loadCanvas = function(){
//         document.body.appendChild(this.canvas);
//         this.context = canvas.getContext("2d");
//         loadMap("map.jpg");
//     }
//
//     this.loadMap = function(imgstr){
//         var image = document.createElement("img");
//         image.src = imgstr;
//         this.context.drawImage(image);
//     }
//
//     this.drawPoint = function(x, y){
//         ctx.strokeStyle = "red";
//         this.context.beginPath();
//         this.context.moveTo(x, y);
//         this.context.stroke();
//         ctx.strokeStyle = "black";
//     }
// };
//
// var update = function(board){
//
// }
//
// window.onkeydown = function(event){
//     switch(event.keyCode()){
//         case 37:
//
//         case 38:
//
//         case 39:
//
//         case 40:
//
//     }
// }
//
// var load = function(){
//     var board = new Board();
//     board.loadCanvas();
//     window.setInterval(update(board));
// }
