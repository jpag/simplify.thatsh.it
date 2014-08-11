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

    colorAvg            : {r:127, g:127, b:127},
    redraw              : true,
    plotted: [],


    // test switches
    test                : false,
    lotsofdots          : true,
    lessdots            : false,

    testimglist         : [
        "/testimg.jpg",  // 0
        "/testimg2.jpg", // 1
        "/testimg3.jpg", // 2
        "/testimg4.jpg", // 3
        "/125901215.jpg" // 4
    ],

    testImage : 2,


    init : function() {

        this.$el = $("#"+this.id);
        this.imgsrc = document.createElement("img");

        this._super();

        this.$canvas = this.$el.find("#visible-canvas");

        this.ctx = this.$el.find("#visible-canvas")[0].getContext('2d');
        this.hiddenctx = this.$el.find("#origin-hidden-canvas")[0].getContext('2d');

        // paper.setup(this.$canvas[0])

    },

    bindEvents : function() {
        var self = this;
        this._super();
        this.$el.bind({
            "drop" : this.handleDrop.bind(this),
            "dragover" : this.handleDragOver.bind(this),
            "click" : function(){
                self.drawOriginalImageToCanvas();
            }
        });

        this.redraw = false;
        this.$doc.trigger(Events.dom.forceResize);

        this.imgsrc.addEventListener("load", function () {
            trace(' IMAGE loaded - redraw : ');
            self.redraw = true;
            self.drawOriginalImageToCanvas();
        }, false);


        // test insert an image:
        this.imgsrc.src = this.testimglist[ this.testImage ];

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

        trace('\n\n ---- drawOriginalImageToCanvas - draw into context :');

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
        this.hiddenctx.drawImage(this.imgsrc,x,y,w ,h );
        
        var self = this;
        setTimeout(function(){
            trace("raster --- ");
            
            //self.randomlyGeneratePoints();
            self.drawEverything();

        }, 0);
    },

    drawEverything : function() {
        
        var w = this.availW;
        var h = this.availH;
        trace( ' shape detection '+ w + ' , ' + h );
        
        var dat = this.hiddenctx.getImageData(0,0,w,h);
        trace(dat.width + ' ' + dat.height + ' ' + dat.data.length);
        

        //dat = this.contrast(dat, 10);
        //this.drawAvgColor(dat,this.ctx,10);
        
        this.drawAvgFromDictChannels(dat,this.ctx, 15);
        
        // find those unique colors that stand out from the background color average :
        var shapes = this.findGrayScaleShapes();

        // time to draw these shapes:
        if( !this.test && !this.lotsofdots && !this.lessdots ){
            this.drawDefinedObjects(shapes);
        }


        // high contrast it:
        //dat = this.contrast(dat, 10);
        //this.ctx.putImageData(dat,0,0);
        
        // look for shapes
        //this.shapes(dat,w,h, 200, 0.5, 0.3, false, 'fullrect');
        if( this.lessdots ){
            this.shapes(dat,w,h, 10, 0.2, 0.15, false, 'arc');
            this.shapes(dat,w,h, 5, 0.3, 0.25, false, 'arc');
        }
        //this.shapes(dat,w,h, 200, 0.01, 0.5, false, 'rect');
        //dat = this.contrast(dat, 100);

        
        // tiny dots:
        if( this.lotsofdots ){
            this.shapes(dat,w,h, 5, 0.01, 0.012, false, 'arc');
            this.shapes(dat,w,h, 220, 0.005, 0.005, false, 'arc');

        }


        //this.shapes(dat,w,h, 150, 0.33, 0.20, false, 'arc');


        // draw the shapes:
        trace(' draw shapes ' + this.plotted.length );
        // the shapes drawn: this.plotted.
        // find the edges of the shapes to draw objects. and find the average color in them.

    },

    // shrink image data to a small size
    // convert to gray scale 
    // add high contrast
    // we look for the pixel chunks that stand out.
    findGrayScaleShapes : function() {

        var showMapping = this.test;
        
        var w = this.availW;
        var h = this.availH;

        // do a shrink and high contrast to find the key shapes:
        var grayScaleCanvas = {cv : null };
        var downscale = .04;
        var tw = Math.ceil(w * downscale);
        var th = Math.ceil(h * downscale);
        var contrastLevel = 255/2;
        var hiddencanvas = this.$el.find("#origin-hidden-canvas")[0];

        grayScaleCanvas.cv = document.createElement('canvas');
        grayScaleCanvas.cv.width = tw;
        grayScaleCanvas.cv.height = th;
        grayScaleCanvas.ctx = grayScaleCanvas.cv.getContext('2d');

        grayScaleCanvas.ctx.drawImage(hiddencanvas, 0, 0, tw, th);
        grayScaleCanvas.dat = this.contrast( grayScaleCanvas.ctx.getImageData(0,0,tw,th), contrastLevel);
        grayScaleCanvas.ctx.putImageData(grayScaleCanvas.dat,0,0);
        grayScaleCanvas.dat = grayScaleCanvas.ctx.getImageData(0,0,tw,th);

        for(var i = 0; i < grayScaleCanvas.dat.data.length; i += 4) {
          var brightness = 0.34 * grayScaleCanvas.dat.data[i] + 0.5 * grayScaleCanvas.dat.data[i + 1] + 0.16 * grayScaleCanvas.dat.data[i + 2];
          // red
          grayScaleCanvas.dat.data[i] = brightness;
          // green
          grayScaleCanvas.dat.data[i + 1] = brightness;
          // blue
          grayScaleCanvas.dat.data[i + 2] = brightness;
        }
        grayScaleCanvas.ctx.putImageData(grayScaleCanvas.dat,0,0);

        if( showMapping == true ){
            this.ctx.drawImage( grayScaleCanvas.cv, 0,0, w, h);

            // grayScaleCanvas.ctx.drawImage( this.$canvas[0], 0,0, w, h);
            // grayScaleCanvas.dat = grayScaleCanvas.ctx.getImageData(0,0,w,h);
        }
        
        var shapes = this.findHighContrastShapes(grayScaleCanvas);

        // IF there are more pixels found then not found invert:
        var gsd = grayScaleCanvas.dat
        trace( shapes.length );
        if( shapes.length >= (gsd.data.length/4)/2 ){
            grayScaleCanvas.dat = this.contrast( grayScaleCanvas.ctx.getImageData(0,0,tw,th), (contrastLevel + 255) );
            grayScaleCanvas.ctx.putImageData(grayScaleCanvas.dat,0,0);
            //this.ctx.drawImage( grayScaleCanvas.cv, 0,0, w, h);
            shapes = this.findHighContrastShapes(grayScaleCanvas);
        }
        
        if( showMapping == true ){
            for( var s = 0; s < shapes.length ; s++){
                this.drawRect(shapes[s][0]/downscale,shapes[s][1]/downscale, {r: 240, g: 155, b: 25, a: 0.95}, this.ctx, 20, 20 );
            }
        }    

        // We got all the shapes.
        // x,y values are scaled, they start at 0,0
        // nothing to do with the first index so skip.
        for( var s = 1; s < shapes.length; s++){

            var shape = shapes[s];
            var x = shape[0] + 0;
            var y = shape[1] + 0;
            var rangeThreshold = 1; 

            // number of pixels to define the square range to look
            // i.e. 1 would search the X's below from '.' point:
            //
            //   X X _
            //   X . _
            //   _ _ _
            //

            var matrix = {
                x : [],
                y : []
            };
            
            // create matrix array relative to THIS X,Y point
            // +1 to include the x value in the top right (from previous row.)
            for( var rx = (x-rangeThreshold); rx <= (x); rx++ ){
                //trace( rx );
                if( rx < 0 || 
                    (rx >= (tw - 1)) ){
                    // reached the edge
                    // no need to add this matrix threshold.
                    continue;
                }
                matrix.x.push(rx);
            }

            for( var ry = ( y - rangeThreshold ); ry <= y; ry++ ){
                if( ry < 0 || 
                    (ry >= (th - 1)) ){
                    // reached the edge
                    // no need to add this matrix threshold.
                    continue;
                }
                matrix.y.push(ry);
            }
            
            // now compare every single shape to see if there is a match 
            // at those 8 surrounding points:
            // only do upto the current shape we are checking
            // start at the shape, and go progressively further away (left and top)
            for( var si = (s-1); si >= 0; si-- ){
                // increment backwards starting at (currentshape - 1)
                var compared = shapes[si];
                
                if( compared == null ){ continue; }

                // has to match both x,y:
                var match = [false,false];
                for( var mx = 0; mx < matrix.x.length; mx++ ){
                    if( compared[0] == matrix.x[mx] ){
                        match[0] = true;
                    }else if( compared.length >= 4 ){
                        // matrix val is >= to x and <= to width
                        if( matrix.x[mx] >= compared[0] && 
                            matrix.x[mx] <= (compared[0]+compared[2]) ){
                            // trace(' found x match between x and w');
                            // is inbetween x and width;
                            match[0] = true;
                        }
                    }
                }

                for( var my = 0; my < matrix.y.length; my++ ){
                    if( compared[1] == matrix.y[my] ){
                        match[1] = true;
                    }else if( compared.length >= 4 ){
                        // matrix val is >= to y and <= to height
                        if( matrix.y[my] >= compared[1] && 
                            matrix.y[my] <= (compared[1]+compared[3]) ){
                            // trace(' found y match between y and h');
                            // is inbetween y and height;
                            match[1] = true;
                        }
                    }
                }

                if( match[0] == true && match[1] == true ){
                    
                    var cx = shapes[si][0] + 0;
                    var cy = shapes[si][1] + 0;
                    
                    // expand the shape size:
                    // cut out of the shape list, and expand the existing one:

                    // shift the current SHAPE so x,y will become this compared coord.
                    // and the end point will be the current x,y of it.

                    var nw = Math.abs(x - cx + 1);
                    var nh = Math.abs(y - cy + 1);

                    // because we are looking at previous values only
                    // always assign x,y to the lowest value
                    if( shapes[s][0] < cx ){
                        cx = shapes[s][0];
                        
                        // x is already further. so leave it there and leave the width:
                        if( shapes[s].length >= 4 ){
                            nw = shapes[s][2] + 1;
                        }
                    }

                    if( shapes[s][1] < cy ){
                        cy = shapes[s][1];

                        if( shapes[s].length >= 4 ){
                            nh = shapes[s][3] + 1;
                        }
                    }

                    var id = s;
                    if( shapes[si].length == 5 ) {
                        // we are removing an item that already has an id keep 
                        // so we keep track of it's growth before removal/nullify
                        id = shapes[si][4];
                    }
                    
                    if( id == 5 ){
                        
                        trace(id + ' ' + s + ' Match: shape x,y = ' + x + ','+y+' new x:' + cx +','+cy  );
                        trace(' --- dimensions ' + nw + ','+nh+'\n\n');
                    
                    }

                    shapes[s] = [cx, cy, nw, nh, id];
                    if( id == 5 ){
                        trace( shapes[s] );
                    }
                    
                    // we need the length to maintain but clear out that val:
                    shapes[si] = null;


                }
            }// end of looping matrix to previous shapes.
        }


        // clean up shapes:
        trace(' original shapes : ' + shapes.length);
        for( var s = shapes.length-1; s >= 0; s-- ){
            if( shapes[s] == null ){
                shapes.splice(s,1);
            }else if( shapes[s].length == 2 ){
                // define default w/h?   
            }
        }

        trace(' shapes cleaned : ' + shapes.length);
        trace( shapes );
        // order shapes by size (remove after 5);
        // numerically and descending
        shapes.sort(function(a, b){
            if( a.length >= 4 && b.length >= 4 ){
                return (b[2]*b[3]) - (a[2]*a[3]);
            }else if( a.length >= 4 ){
                // only a 
                return -1;
            }else{
                // both meh..?
                return 0;
            }
        });
        shapes.reverse();

        var shapesreturn = [];
        var shapesToReturn = shapes.length; //(shapes.length < 6)? shapes.length : 6;

        for( var s = 0; s < shapesToReturn; s++ ){
            var sx = shapes[s][0] / downscale;
            var sy = shapes[s][1] / downscale;
            var sw = 20;
            var sh = 20;
            if( shapes[s].length >= 4 ){
                sw = shapes[s][2] / downscale;
                sh = shapes[s][3] / downscale;
            }
            //trace( sx + ','+ sy + ' w:'+ sw +' h:'+sh );
            
            if( showMapping == true ){
                this.drawRect(sx,sy, {r: 240, g: 155, b: 225, a: 0.75}, this.ctx, sw, sh );
            }

            shapesreturn.push({x: sx, y: sy, w: sw, h: sh});
        }

        return shapesreturn;
    },

    findHighContrastShapes : function(grayScaleCanvas) {
         // everything is pixelated. so just look for rectangles, 
        // we can determine to draw recs or circles later.
        var w = this.availW;
        var h = this.availH;

        var grayThreshold = 100;
        var px,x,y,sx,sy,pixel;
        var gsd = grayScaleCanvas.dat
        var shapes = [];
        
        for( var i = 0; i < gsd.data.length; i+=4){
            // loop time!
            px = i/4

            y = Math.floor(px / gsd.width)
            x = px % gsd.width
            // scaled x,y
            sy = y / (gsd.width/w);
            sx = x / (gsd.width/w);
            
            var pixel = {r: gsd.data[i], g: gsd.data[i+1], b: gsd.data[i+2] , a: gsd.data[i+3] };
            if( pixel.a != 255 ){
                continue;
            }

            if( pixel.r < grayThreshold ){
                shapes.push([x,y]);
            }
        }
        return shapes;
    },

    drawRect : function(x,y,c,ctx,sizew, sizeh) {
        ctx.fillStyle="RGBA("+c.r+","+c.g+","+c.b+","+c.a+")";
        ctx.fillRect(x,y,sizew,sizeh);
    },

    // pulls an avg color based off of most popular color range out of grps
    drawAvgFromDict : function(dat,ctx,grps) {
        var colors = []; // an array of colors stored
        var numOfGrps = grps;
        // the range will be the combined difference of RGB
        var maxcolor = 255*3; // 765
        var rangeInGroup = Math.round( (maxcolor) / grps );

        for( var b = 0; b < numOfGrps; b++){
            colors.push([]);
        }

        for( var i = 0; i < dat.data.length; i+=4) {

            var obj = {r: dat.data[i], g: dat.data[i+1], b: dat.data[i+2] };
            var tots = obj.r + obj.g + obj.b;

            //var dif = maxcolor - tots;
            var percent = (tots / maxcolor);
            var cr = Math.floor( percent * (numOfGrps - 1) );

            if( cr > colors.length ){
                cr = colors.length;
            }
            // push into the color range it best fits into:
            colors[cr].push(obj);
        }

        var longest = [];
        var longestIndex = 0;
        for( var r = 0; r < colors.length; r++){
            if( colors[r].length > longest.length ){
                longest = colors[r];
                longestIndex = r;
            }
            if( colors[r].length == 0 ){
                // trace( '   - color array has no length ' + r );
            }else{
                // trace( '   - color array ' + r + ' color: r' + colors[r][0].r + ' g'+ colors[r][0].g + ' b'+ colors[r][0].b + ' length of '+ colors[r].length )
            }
        }

        if( longestIndex == 0 ){
            longestIndex++;
            longest = colors[longestIndex]
        }else if( longestIndex == (colors.length - 1)) {
            longestIndex--;
            longest = colors[longestIndex]
        }

        var index = Math.round(longest.length/2);
        trace(' num of color arrays ' + colors.length + ' longest length was : ' + longest.length );

        var red = longest[index].r;
        var green = longest[index].g;
        var blue = longest[index].b;
        var alpha = 1;

        // we got the longest, find the a color that represents the middle of this specific range:
        var idealDif = ((longestIndex * 1.5) / numOfGrps ) * maxcolor;
        
        if( longestIndex == 0 ){
            idealDif = ((1 * 0.5) / numOfGrps ) * maxcolor;
        }

        trace( idealDif );
        var rollingDif = rangeInGroup;
        for( var l = 0; l < longest.length; l++){
            var col = longest[l];
            var tot = col.r + col.g + col.b;

            var dif = Math.abs( idealDif - tot);
            if( dif < rollingDif ){
                rollingDif = dif;
                red = col.r;
                green = col.g;
                blue = col.b;

                trace(' updated dif... '+ rollingDif );
            }
        }

        trace( "RGBA("+red+","+green+","+blue+","+alpha+")" );
        ctx. fillStyle= "RGBA("+red+","+green+","+blue+","+alpha+")";
        ctx.fillRect(0,0,this.availW,this.availH);
    },

    // pulls an avg color based off of most popular color range 
    // in a SPECIFIC RGB channel out of grps
    drawAvgFromDictChannels : function(dat,ctx,grps) {
        
        trace(' ----- DRAW AVG from d channels -----');
        var colorsRed = []; // an array of colors stored
        var colorsGreen = []; // an array of colors stored
        var colorsBlue = []; // an array of colors stored
        var numOfGrps = grps;
        // the range will be the combined difference of RGB
        var maxcolor = 255; // 765
        var rangeInGroup = Math.round( (maxcolor) / grps );

        for( var b = 0; b < numOfGrps; b++){
            colorsRed.push([]);
            colorsGreen.push([]);
            colorsBlue.push([]);
        }
        //created an empty array of colors:
        var colors = [colorsRed, colorsGreen, colorsBlue ]
        
        trace( colors );

        for( var i = 0; i < dat.data.length; i+=4) {

            var obj = {r: dat.data[i], g: dat.data[i+1], b: dat.data[i+2] };
            
            var percents = { 
                            r: obj.r / maxcolor, 
                            g: obj.g / maxcolor, 
                            b: obj.b / maxcolor 
                        };

            // trace( percents );
            var indexes = [
                            Math.floor( percents.r * (numOfGrps - 1) ), 
                            Math.floor( percents.g * (numOfGrps - 1) ),
                            Math.floor( percents.b * (numOfGrps - 1) ) 
                        ];

            for( var ci = 0; ci < colors.length; ci++){

                // if( indexes[ci] >= colors[ci].length ){
                //     indexes[ci] = colors[ci].length - 1;
                // }

                // trace(' num of groups in color: ' + colors[ci].length );
                // trace( ci );
                // trace( indexes[ ci ] );

                colors[ci][ indexes[ci] ].push( obj );
            }
        }

        var longest = [];
        var longestChannel = 0;
        var longestIndex = 0;
        for( var ch = 0; ch < colors.length; ch++ ){
            var colorChannel = colors[ch];

            for( var r = 0; r < colorChannel.length; r++){
                if( colorChannel[r].length > longest.length ){
                    longest = colorChannel[r];
                    longestIndex = r;
                    longestChannel = ch;
                }

                if( colorChannel[r].length == 0 ){
                    // trace( '   - color array has no length ' + r );
                }else{
                    // trace( '   - color array ' + r + ' color: r' + colorChannel[r][0].r + ' g'+ colorChannel[r][0].g + ' b'+ colorChannel[r][0].b + ' length of '+ colorChannel[r].length )
                }
            }
        }


        if( longestIndex == 0 ){
            longestIndex++;
            longest = colors[longestChannel][longestIndex]
        }else if( longestIndex == (colors[longestChannel].length - 1)) {
            longestIndex--;
            longest = colors[longestChannel][longestIndex]
        }

        var index = Math.round(longest.length * .1); //Math.round(longest.length/2);
        trace(' longest length was : ' + longest.length + ' found in color channel ' + longestChannel + ' at index of' + longestIndex + ' out of ' + numOfGrps);

        var red = longest[index].r;
        var green = longest[index].g;
        var blue = longest[index].b;
        var alpha = 1;

        // we got the longest, find the a color that represents the middle of this specific range:
        var idealDif = ((longestIndex * 1.5) / numOfGrps ) * maxcolor;
        
        if( longestIndex == 0 ){
            idealDif = ((1 * 0.5) / numOfGrps ) * maxcolor;
        }

        trace( idealDif );
        var rollingDif = rangeInGroup;
        for( var l = 0; l < longest.length; l++){
            var col = longest[l];
            var tot = col.red + col.green + col.blue;

            var dif = Math.abs( idealDif - tot);
            if( dif < rollingDif ){
                rollingDif = dif;
                red = col.red;
                green = col.green;
                blue = col.blue;

                trace(' updated dif... '+ rollingDif );
            }
        }

        trace( "RGBA("+red+","+green+","+blue+","+alpha+")" );
        ctx.fillStyle= "RGBA("+red+","+green+","+blue+","+alpha+")";
        ctx.fillRect(0,0,this.availW,this.availH);


        this.colorAvg = {r: red, g: green, b: blue, a: alpha};
        trace("\n\n");
    },

    drawAvgColor : function(dat,ctx, ran){
        //var red = 255/2, blue = 255/2, green = 255/2;

        var red = 0, blue = 0, green = 0;
        var alpha = 1;
        var divisible = (dat.data.length/4);

        if(typeof(ran) !== 'undefined' ){
            trace(" RANDOM!!!!!")
            var range = dat.width * dat.height;
            divisible = ran;

            for( var i=0; i < ran; i++){
                var r = Math.round( Math.random() * range ) * 4;

                red += dat.data[r];
                green += dat.data[r+1];
                blue += dat.data[r+2];

            }
        }else{

            for( var i=0; i < dat.data.length; i+=4){
                
                if( dat.data[i+3] != 255 ){
                    continue;
                }

                // red = Math.round((dat.data[i] + red)/2);
                // green = Math.round((dat.data[i+1] + green)/2);
                // blue = Math.round((dat.data[i+2] + blue)/2);

                red += dat.data[i];
                green += dat.data[i+1];
                blue += dat.data[i+2];
            }
        }

        

        red = Math.round(red / divisible);
        green = Math.round(green / divisible);
        blue = Math.round(blue / divisible);

        trace( "RGBA("+red+","+green+","+blue+","+alpha+")" );
        ctx.fillStyle="RGBA("+red+","+green+","+blue+","+alpha+")";
        ctx.fillRect(0,0,this.availW,this.availH);
    },

    contrast : function(dat, contrast){
        // http://stackoverflow.com/questions/10521978/html5-canvas-image-contrast
        var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for(var i=0;i<dat.data.length;i+=4){
            dat.data[i] = factor * (dat.data[i] - 128) + 128;
            dat.data[i+1] = factor * (dat.data[i+1] - 128) + 128;
            dat.data[i+2] = factor * (dat.data[i+2] - 128) + 128;
        }

        return dat;
    },

    drawDefinedObjects : function(shapes) {
        for( var s =0; s < shapes.length; s++ ){
            var shape = shapes[s];
            var x = shape.x;
            var y = shape.y;
            var r = (shape.w > shape.h)? shape.w : shape.h;
            var colorData = this.getPixelRGB( x + r/2, y + r/2, this.hiddenctx );
            var alpha = 1;

            this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')';
            this.ctx.fill();
            // resets path info.
            this.ctx.beginPath();


            this.plotted.push({x:x,y:y, rgb: colorData, a: alpha});
        }

    },

    shapes : function(dat,w,h, threshold, incremental, radius, alpharan, shapetype) {
        // determine the radius by w/h
        var index, pixel,left, top, right, bottom = undefined;
        var x = 0;
        var y = 0;
        var incrementy = Math.round(dat.width * incremental);
        var incrementx = Math.round(dat.height * incremental);
        
        trace(dat.width + ' ' + dat.height + ' ' + dat.data.length );
        trace('incrementx '+ incrementy + ', incrementx '+ incrementx);

        //return;
        var r = Math.floor(dat.width * radius) / 2;
        var rh = Math.floor(dat.height * radius) / 2;
        if( r > rh ){
            r = rh;
        }

        

        for(y=0; y<dat.height; (y+=incrementy)){

            for(x=0; x<dat.width; (x+=incrementx)){
                //trace( 'x '+ x + ' , y ' + y );
                
                index = (x + y * dat.width) * 4;
                
                // get the RGB's of pixel's data
                pixel = {
                            r     : dat.data[index], 
                            g   : dat.data[index+1], 
                            b    : dat.data[index+2],
                            a   : dat.data[index+3] 
                        };

                if( pixel.a != 255 ){
                   continue;
                }
                
                // Get the values of the surrounding pixels
                // Color data is stored [r,g,b,a,r,g,b,a]
                
                left = {
                            r   :dat.data[index-4], 
                            g   :dat.data[index-3], 
                            b   :dat.data[index-2] 
                        };
                
                right = {
                            r   :dat.data[index+4], 
                            g   :dat.data[index+5],
                            b   :dat.data[index+6] 
                        };

                topindex = index-(dat.width*4);

                top = {
                            r   : dat.data[topindex],
                            g   : dat.data[topindex+1],
                            b   : dat.data[topindex+2]
                        };
                                
                bottomindex = index+(dat.width*4);

                bottom = {
                            r   : dat.data[bottomindex],
                            g   : dat.data[bottomindex+1],
                            b   : dat.data[bottomindex+2]
                        };

                //Compare it all.
                if(this.comparepx(pixel,left,threshold)){
                    
                }else if(this.comparepx(pixel,right,threshold)){
                    
                }else if(this.comparepx(pixel,top,threshold)){
                    
                }else if(this.comparepx(pixel,bottom,threshold)){
                    
                }else{
                    continue;
                }
                
                if( shapetype == 'arc' ){
                    this.plotPixel(x,y, pixel, r, alpharan);
                }else if( shapetype == 'fullrect'){
                    this.plotFullLengthRect(x,y, pixel, r, alpharan);
                }else if(shapetype == 'rect' ){
                    this.plotRect(x,y, pixel, r, alpharan);
                }
            }
        }
    },

    comparepx   : function(px,px2, threshold){
        var minRGB = (255 * 3) * .15;
        var maxRGB = (255 * 3) * .85;

        if( px.r + px.g + px.b >= maxRGB ){
            return false;
        }else if( px.r + px.g + px.b <= minRGB ){
            return false;
        /*}else if( 
            (px2.red > px.red-threshold) &&
            (px2.green > px.green-threshold) &&
            (px2.blue > px.blue-threshold) &&
            (px2.red < px.red+threshold) &&
            (px2.green > px.green+threshold) &&
            (px2.blue > px.blue+threshold)
        ){
            return true;*/
        }else if(
            (px2.r > px.r-threshold) &&
            (px2.r < px.r+threshold)
        ){
            // draw red
            return true;
        }else if(
            (px2.g > px.g-threshold) &&
            (px2.g < px.g+threshold)
        ){
            // draw green
            return true;
        }else if(
            (px2.b > px.b-threshold) &&
            (px2.b < px.b+threshold)
        ){
            // draw blue
            return true;
        }else{
            return false;
        }
    },


    plotRect  : function(x,y,pixel,r,alpharan) {
        // either draw full width or horizontal
        this.ctx.beginPath();
        
        var levelOfRandom = 0.05;
        var offsetx = this.availW * levelOfRandom;
        var offsety = this.availH * levelOfRandom;
        var w,h;

        w = r*0.5*Math.random();
        h = r*0.5*Math.random();
        x += (Math.random() * offsetx) - (offsetx*2);
        y += (Math.random() * offsety) - (offsety*2);

        var paddingFromEdge = 25;

        if( (x + w + paddingFromEdge) > this.availW ){
            x = this.availW - (w + paddingFromEdge)
        }else if( x < paddingFromEdge ){
            x = paddingFromEdge;
        }

        if( (y + h + paddingFromEdge) > this.availH ){
            y = this.availH - (h + paddingFromEdge)
        }else if( y < paddingFromEdge ){
            y = paddingFromEdge;
        }


        var colorData = pixel;
        var alpha = 1;
        if( alpharan ){
            alpha = Math.random();
        }
        
        //trace('x '+x+',y '+y+' w '+ w + ' h ' + h + 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')' );

        this.ctx.rect(x,y,w,h);
        this.ctx.fillStyle = 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')';
        this.ctx.fill();
        
        
        // resets path info.
        this.ctx.beginPath();
        this.plotted.push({x:x,y:y, rgb: colorData, a: alpha});
    },

    plotFullLengthRect  : function(x,y,pixel,r,alpharan) {
        // either draw full width or horizontal
        this.ctx.beginPath();
        
        var levelOfRandom = 0.05;
        var offsetx = this.availW * levelOfRandom;
        var offsety = this.availH * levelOfRandom;
        var w,h;

        w = h = r*2.5*Math.random();



        var horizon = true; //(Math.random() < 0.5 )? true : false;
        if (horizon){
            x = 0;
            y += (Math.random() * offsety) - (offsety*2);
            w = this.availW;
        }else{
            y = 0;
            x += (Math.random() * offsetx) - (offsetx*2);
            h = this.availH;
        }

        var colorData = pixel;
        var alpha = 1;
        if( alpharan ){
            alpha = Math.random();
        }
        
        trace('x '+x+',y '+y+' w '+ w + ' h ' + h + 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')' );

        this.ctx.rect(x,y,w,h);
        this.ctx.fillStyle = 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')';
        this.ctx.fill();
        
        
        // resets path info.
        this.ctx.beginPath();
        this.plotted.push({x:x,y:y, rgb: colorData, a: alpha});
    },

    plotPixel  : function(x,y,pixel,r,alpharan) {
        this.ctx.beginPath();
        
        var levelOfRandom = 0.2;
        var offsetx = this.availW * levelOfRandom;
        var offsety = this.availH * levelOfRandom;
        var radius = r*2.5*Math.random();

        x += (Math.random() * offsetx) - (offsetx/2);
        y += (Math.random() * offsety) - (offsety/2);


        var paddingFromEdge = 25;

        if( (x + radius + paddingFromEdge) > this.availW ){
            x = this.availW - (radius + paddingFromEdge)
        }else if( (x - radius) < paddingFromEdge ){
            x = paddingFromEdge + radius;
        }

        if( (y + radius + paddingFromEdge) > this.availH ){
            y = this.availH - (radius + paddingFromEdge)
        }else if( (y - radius) < paddingFromEdge ){
            y = paddingFromEdge + radius;
        }



        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        //this.ctx.arc(x, y, r*Math.random(), 0, 2 * Math.PI, false);

        var colorData = pixel;
        var alpha = 1;
        if( alpharan ){
            alpha = Math.random();
        }
        

        this.ctx.fillStyle = 'RGBA('+colorData.r+','+colorData.g+','+colorData.b+','+alpha+')';
        this.ctx.fill();
        
        // resets path info.
        this.ctx.beginPath();
        this.plotted.push({x:x,y:y, rgb: colorData, a: alpha});
    },

    plotPoint  : function(x,y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI, false);

        var colorData = this.getPixelRGB(x,y,this.hiddenctx,false);

        this.ctx.fillStyle = 'RGB('+colorData.r+','+colorData.g+','+colorData.b+')';
        this.ctx.fill();
        // resets path info.
        this.ctx.beginPath();

        // Copy onto the raw canvas
        // this is probably the most useful application of this,
        // as you would then have raw data of the edges that can be used.

        // this.rawctx.beginPath();
        // this.rawctx.arc(x, y, 0.5, 0, 2 * Math.PI, false);
        // this.rawctx.fillStyle = 'green';
        // this.rawctx.fill();
        // this.rawctx.beginPath();

        // this.plotted++;
    },

    randomlyGeneratePoints : function() {
        trace(' randomlyGeneratePoints --- ')
            
        // paper has some problems with the default data.
        // http://greenethumb.com/article/1429/user-friendly-image-saving-from-the-canvas/
        var dat = this.$el.find("#origin-hidden-canvas")[0].toDataURL("image/png");
        this.raster = new paper.Raster({
            source: dat
        });
        var bounds = paper.view.bounds;
        var path = new paper.Path.Rectangle({
            point: {x:0,y:0},
            size: {width: this.availW, height: this.availH}
        });
        path.fillColor = this.raster.getAverageColor(path);


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
        trace(' ---- clear canvas - ');

        this.ctx.clearRect(0,0,this.availW, this.availH);
        this.hiddenctx.clearRect(0,0,this.availW,this.availH);
    },

    redrawCanvas : function() {
        if( this.redraw == true ){
            this.drawOriginalImageToCanvas();
        }else{

        }        
    },

    getPixelRGB : function(x, y, ctx, test) {
        var pxData = ctx.getImageData(x,y,1,1);
        var R = pxData.data[0];
        var G = pxData.data[1];
        var B = pxData.data[2];

        // test it works...:
        if( test == true ){
            ctx.fillStyle="red";
            ctx.fillRect(x-5,y-5,10,10);
        }

        return({r:R, g:G, b:B});    
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
            .attr("height" , h)
            .css({
                "width" : w,
                "height" : h
            })

        // TODO : and SVG? 
        this.redrawCanvas();
    }
    
    });
});