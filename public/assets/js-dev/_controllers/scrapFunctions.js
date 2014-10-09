// look for shapes
//this.shapes(dat,w,h, 200, 0.5, 0.3, false, 'fullrect');
if( this.devswitches.lessdots ){
    this.shapes(dat,w,h, 10, 0.2, 0.15, false, 'arc');
    this.shapes(dat,w,h, 5, 0.3, 0.25, false, 'arc');
}
//this.shapes(dat,w,h, 200, 0.01, 0.5, false, 'rect');
//dat = this.contrast(dat, 100);


// tiny dots:
if( this.devswitches.lotsofdots ){
    this.shapes(dat,w,h, 5, 0.01, 0.012, false, 'arc');
    this.shapes(dat,w,h, 220, 0.005, 0.005, false, 'arc');
}

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




    drawAvgFromScaleDown : function(dat,ctx){
        var shrinkCan = {}
        var tw = 1; //this.availW * 0.01;
        var th = 1; //this.availH * 0.01;
        var hiddencanvas = this.$el.find("#origin-canvas")[0];
        shrinkCan.cv = document.createElement('canvas');
        shrinkCan.cv.width = tw;
        shrinkCan.cv.height = th;
        shrinkCan.ctx = shrinkCan.cv.getContext('2d');
        
        shrinkCan.ctx.drawImage(hiddencanvas, 0, 0, tw, th);
        //shrinkCan.ctx.putImageData(hiddencanvas,0,0);
        shrinkCan.dat = shrinkCan.ctx.getImageData(0,0,tw,th);

        trace( shrinkCan.dat );
        // take a middle point?
        var red = shrinkCan.dat.data[0];
        var green = shrinkCan.dat.data[1];
        var blue = shrinkCan.dat.data[1];
        var alpha = 1;

        ctx.fillStyle= "RGBA("+red+","+green+","+blue+","+alpha+")";
        ctx.fillRect(0,0,this.availW,this.availH);

        this.colorAvg = {r: red, g: green, b: blue, a: alpha};
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


    // pulls an avg color based off of 
    // longest/biggest group in one of the RGB color ranges
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
        
        // collect the color into groups for each channel
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
                colors[ci][ indexes[ci] ].push( obj );
            }
        }

        trace( colors );

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
        // try to find if there is a color closer to the ideal dif
        var rollingDif = rangeInGroup;
        for( var l = 0; l < longest.length; l++){
            var col = longest[l];
            var tot = col.red + col.green + col.blue;

            var dif = Math.abs( idealDif - tot);
            if( dif <= rollingDif ){
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
    

    randomlyGeneratePoints : function() {
        trace(' randomlyGeneratePoints --- ')
            
        // paper has some problems with the default data.
        // http://greenethumb.com/article/1429/user-friendly-image-saving-from-the-canvas/
        var dat = this.$el.find("#origin-canvas")[0].toDataURL("image/png");
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

        var colorData = this.getPixelRGB(x,y,this.originctx,false);

        this.ctx.fillStyle = 'RGB('+colorData.r+','+colorData.g+','+colorData.b+')';
        this.ctx.fill();
        // resets path info.
        this.ctx.beginPath();
    },
