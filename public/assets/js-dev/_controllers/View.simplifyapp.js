/*
 *  manages drag and drop and reading of image data.
 *  references
 *  http://html5demos.com/file-api#view-source
 *  http://robertnyman.com/2011/03/10/using-html5-canvas-drag-and-drop-and-file-api-to-offer-the-cure/
 *  http://www.html5rocks.com/en/tutorials/dnd/basics/
 */

 define([
    'jQuery',
    'BaseView',
    'GlobalConfig',
    'GlobalClasses',
    'GlobalEvents',
    'Hammer',
    'Paper'
  ], function(
    $,
    BaseView,
    Config,
    Classes,
    Events,
    Hammer
  ){
    
  return BaseView.extend({
    _Name       : "Simplify app logic",   
    _Model      : {

    },
    _Template   : null,
    id          : 'simplifyapp',

    hiddenctx   : null,
    ctx         : null,
    imgsrc      : null,

    availW      : 0,
    availH      : 0,

    // once the image is dropped if it is offset from the top left corner of the canvas
    imgOffset   : {
        x : 0,
        y : 0
    },

    // paper controlled raster layer.
    raster              : null,
    maxNumOfCircles     : 20,
    minNumOfCircles     : 5,
    maxNumOfRects       : 7,
    minNumOfRects       : 3,

    init : function() {

        this.$el = $("#"+this.id);
        this.imgsrc = document.createElement("img");

        this._super();

        this.$canvas = this.$el.find("#visible-canvas");

        this.ctx = this.$el.find("#visible-canvas")[0].getContext('2d');
        this.hiddenctx = this.$el.find("#origin-hidden-canvas")[0].getContext('2d');

        paper.setup(this.$canvas[0])
    },

    bindEvents : function() {
        trace(' bind Simplify events ');
        var self = this;

        this._super();

        this.$el.bind({
            "drop" : this.handleDrop.bind(this),
            "dragover" : this.handleDragOver.bind(this),
            "click" : function(){
                self.drawOriginalImageToCanvas();
            }
        });

        this.$doc.trigger(Events.dom.forceResize);


        
        this.imgsrc.addEventListener("load", function () {
            self.drawOriginalImageToCanvas();
        }, false);

    },

    handleDragOver : function(e) {
        trace(' drag over');
        e.stopPropagation();
        e.preventDefault();

        e.originalEvent.dataTransfer.dropEffect = 'copy';

    },

    handleDrop : function(ev) {
        trace(' --- handle the drop --- ' );
        var self = this;

        ev.stopPropagation(); // Stops some browsers from redirecting.
        ev.preventDefault();

        // read first file only if there are multiple
        // TODO: add super impose of multiple images?
        var file = ev.originalEvent.dataTransfer.files[0];
        
        
        var reader = new FileReader();

        reader.onload = function(event) {
            self.imgsrc.src = event.target.result;
            // trace( event.target );
            // trace( event.target.result );
        };
        reader.readAsDataURL(file);        
    },

    drawOriginalImageToCanvas : function() {
        this.clearCanvas();
        
        trace(' draw into context :');
        
        var imgW = this.imgsrc.width,
            imgH = this.imgsrc.height,
            w = imgW,
            h = imgH,
            x,y;
            

        if( w > this.availW || h > this.availH ){
            trace(' ------ img exceeds avail. resize/scale image ------- ');
            var ratio = imgH / imgW,
                w = this.availW,
                h = ratio * w;
            trace( w + ' -  ' + h + ' ratio ' + ratio )
            if( h > this.availH ){
                trace(' height too large');
                h = this.availH;
                ratio = imgW/imgH;
                w = ratio * h;

                trace( w + ' -  ' + h + ' ratio ' + ratio )
            }
        }

        // calculate this one.
        x = (this.availW - w)/2;
        y = (this.availH - h)/2;

        this.imgOffset.x = x;
        this.imgOffset.y = y;
        this.imgOffset.w = w;
        this.imgOffset.h = h;
        //this.ctx.drawImage(this.imgsrc,x,y,w,h);
        this.hiddenctx.drawImage(this.imgsrc,x,y,w,h);
        //trace( imgDat );
        //trace( this.ctx.getImageData(0,0,this.availW,this.availH) )
        
        var self = this;
        setTimeout(function(){
            trace("raster --- ");
            // paper has some problems with the default data.
            // http://greenethumb.com/article/1429/user-friendly-image-saving-from-the-canvas/
            
            //var dat = self.$canvas[0].toDataURL("image/png");
            var dat = self.$el.find("#origin-hidden-canvas")[0].toDataURL("image/png");

            self.raster = new paper.Raster({
                source: dat
            });

            var bounds = paper.view.bounds;
            var path = new paper.Path.Rectangle({
                point: {x:0,y:0},
                size: {width: self.availW, height: self.availH}
            });
            path.fillColor = self.raster.getAverageColor(path);

            trace(' randomlyGeneratePoints --- ')
            self.randomlyGeneratePoints();

        }, 100);
        
    },

    randomlyGeneratePoints : function() {

        trace(' --- generate points');
        
        if( this.availW == 0 && this.availH == 0 || this.raster == null){
            return;
        }

        var overallAvg = this.raster.getAverageColor(new paper.Path.Rectangle(0,0,this.availW,this.availH));
        var strokeColor = overallAvg;
        if( strokeColor == null ){
            strokeColor = paper.Color(0,0,0,0);
            return;
        }else{
            strokeColor.alpha = 1;
        }

        var rects = Math.max( Math.ceil(Math.random() * this.maxNumOfRects) , this.minNumOfRects);
        trace(' num of rects ' + rects );
        

        for(var r = 0; r < rects; r++ ){
            var x = Math.floor( Math.random() * (this.imgOffset.w) );
            var y = 0;  //Math.floor( Math.random() * (this.imgOffset.h) );
            var w = Math.floor( Math.random() * (this.imgOffset.w) );
            var h = this.imgOffset.h; //Math.floor( Math.random() * (this.imgOffset.h) );

            var rect = new paper.Path.Rectangle(
                new paper.Point(x,y),
                new paper.Size(w,h)
            );

            var colorPicker = new paper.Path.Rectangle(
                new paper.Point(x,y),
                new paper.Size(1,1)
            );

            var color = this.raster.getAverageColor(colorPicker);
            rect.fillColor = color;
            rect.strokeColor = strokeColor;
        }

        // circles:
        var circles = Math.max( Math.ceil(Math.random() * this.maxNumOfCircles) , this.minNumOfCircles);
        trace(' num of circles ' + circles );

        for( var c =0; c < circles; c++){
            
            var x = Math.random() * (this.imgOffset.w);
            var y = Math.random() * (this.imgOffset.h);
            var w = Math.random() * (this.imgOffset.w * .20);

            var path = new paper.Path.Circle(
                new paper.Point(x,y),
                w
            );
            
            var rect = new paper.Rectangle(
                new paper.Point(x,y),
                new paper.Size(1,1)
            );

            //var path = new paper.Path.Ellipse(elliprect);

            var color = this.raster.getAverageColor(rect);
            if( color != null ){
                path.fillColor = color;
                //path.fillColor.alpha = .75;
                path.strokeColor = strokeColor
            }
        }
    },

    clearCanvas : function() {
        trace(' - clear canvas - ');
        this.ctx.clearRect(0,0,this.availW, this.availH);
    },

    redrawCanvas : function() {
        this.clearCanvas();

        this.drawOriginalImageToCanvas();
        //.... ?

    },


    getPixelRGB : function(x, y, test) {
        var pxData = this.ctx.getImageData(x,y,1,1);
        var R = pxData.data[0];
        var G = pxData.data[1];
        var B = pxData.data[2];

        // test it works...:
        if( test == true ){
            this.ctx.fillStyle="red";
            this.ctx.fillRect(x-5,y-5,10,10);
        }

        return({red:R, green:G, blue:B});    
    },

    resize : function(e,w,h){
        
        var mW = Config.canvas.maxW,
            mH = Config.canvas.maxH;


        if( w > mW ){
            w = mW;
        }

        if( h > mH ){
            h = mH;
        }

        this.availH = h;
        this.availW = w;

        // just resize all canvas:
        this.$el.find("canvas")
            .attr("width" , w)
            .attr("height" , h);

        // TODO : and SVG? 


        this.redrawCanvas();
    }
    
    });
});