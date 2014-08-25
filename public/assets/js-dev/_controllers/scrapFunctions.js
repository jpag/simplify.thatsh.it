
    drawAvgFromScaleDown : function(dat,ctx){
        var shrinkCan = {}
        var tw = 1; //this.availW * 0.01;
        var th = 1; //this.availH * 0.01;
        var hiddencanvas = this.$el.find("#origin-hidden-canvas")[0];
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

    