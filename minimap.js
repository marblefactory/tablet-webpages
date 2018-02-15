window.onload = function() {
    // var div = document.createElement("div");
    // var div_text = document.createTextNode("HelloWorld");
    // div.appendChild(div_text);
    // document.body.appendChild(div);
    //load();
}

var Board = function(){
    this.canvas = document.createElement("canvas");

    this.loadCanvas = function(){
        document.body.appendChild(this.canvas);
        this.context = canvas.getContext("2d");
        loadMap("map.jpg");
    }

    this.loadMap = function(imgstr){
        var image = document.createElement("img");
        image.src = imgstr;
        this.context.drawImage(image);
    }

    this.drawPoint = function(x, y){
        ctx.strokeStyle = "red";
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.stroke();
        ctx.strokeStyle = "black";
    }
};

var update = function(board){
    
}

window.onkeydown = function(event){
    switch(event.keyCode()){
        case 37:

        case 38:

        case 39:

        case 40:

    }
}

var load = function(){
    var board = new Board();
    board.loadCanvas();
    window.setInterval(update(board));
}