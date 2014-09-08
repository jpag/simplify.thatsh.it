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

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

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

	mobileWidth : 500,

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

	// this is what helps us identify shapes, we can also use it to animate the background in
	grayScaleCanvas     : {cv : null, ctx: null, dat: null },
	// we copy grayscale canvas to this so we don't manipulate the original
	alphaFadeCanvas		: {cv : null, ctx: null, dat: null },

	// test switches
	devswitches         : {
							test : false,
							// show object deteciton mapping:
							showMapping         : false,
							// do the object detection logic.
							objectDetect        : true,
							lotsofdots          : false,
							lessdots            : false,
							animate             : true
						},


	testimglist         : window.imgList,
	testImage : 0,
	bkgdalpha : 0,

	animating : false,

	init : function() {

		this.$el = $("#"+this.id);
		this.imgsrc = document.createElement("img");

		this._super();

		this.$canvas = this.$el.find("#visible-canvas");
		this.ctx = this.$el.find("#visible-canvas")[0].getContext('2d');
		this.hiddenctx = this.$el.find("#origin-hidden-canvas")[0].getContext('2d');

	},

	bindEvents : function() {
		var self = this;
		this._super();

		$("body").bind({
			"drop" : this.handleDrop.bind(this),
			"dragover" : this.handleDragOver.bind(this)
		})

		this.$el.bind({
			"click" : function(){
				
				self.testImage++;
				
				if( self.testImage >= self.testimglist.length ){
					self.testImage = 0;
				}

				if( self.devswitches.test == true  ||
					Modernizr.touch == true ||
					app.testTouch == true
				){
					self.drawNextImage();
				}
			}
		});

		this.redraw = false;
		this.$doc.trigger(Events.dom.forceResize);

		
		this.imgsrc.addEventListener("load", function () {
			trace(' IMAGE loaded - redraw : ');
			self.redraw = true;
			self.drawOriginalImageToCanvas();
		}, false);

		if( this.devswitches.test == true ||
			Modernizr.touch == true ||
			app.testTouch == true
			){

			// test insert an image:
			setTimeout(function(){
				self.imgsrc.src = self.testimglist[ self.testImage ];
				self.$el.removeClass(Classes.empty);
			}, 750 );
		}

	},

	handleDragOver : function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.originalEvent.dataTransfer.dropEffect = 'copy';
	},

	handleDrop : function(ev) {
		trace(' --- handle the drop --- ' );
		var self = this;
		ev.stopPropagation(); // Stops some browsers from redirecting.
		ev.preventDefault();

		var file = ev.originalEvent.dataTransfer.files[0];
		var reader = new FileReader();
		reader.onload = function(event) {
			
			self.$el.removeClass(Classes.empty);
			self.imgsrc.src = event.target.result;
			// trace( event.target ); // trace( event.target.result );
		};
		reader.readAsDataURL(file);        
	},

	// test
	drawNextImage : function() {
		this.imgsrc.src = this.testimglist[ this.testImage ];
	},

	drawOriginalImageToCanvas : function() {
		// stop previous animation:
		this.animating = false;
		this.clearCanvas();
		$(".export-wrapper").removeClass("active");

		trace('\n\n---- drawOriginalImageToCanvas - draw into context :');

		var imgW = this.imgsrc.width,
		imgH = this.imgsrc.height,
		w = imgW,
		h = imgH,
		x,y;
		
		if( w > this.availW || h > this.availH ){
			trace(' img exceeds avail. resize/scale image');
			var ratio = imgH / imgW,
			w = this.availW,
			h = ratio * w;
			if( h > this.availH ){
				trace(' height too large');
				h = this.availH;
				ratio = imgW/imgH;
				w = ratio * h;
			}
			// trace( w + ' -  ' + h + ' ratio ' + ratio )
		}

		// calculate this one.
		x = (this.availW - w)/2;
		y = (this.availH - h)/2;

		this.imgOffset.x = x;
		this.imgOffset.y = y;
		this.imgOffset.w = w;
		this.imgOffset.h = h;

		this.ctx.drawImage(this.imgsrc,x,y,w,h);
		this.hiddenctx.drawImage(this.imgsrc,x,y,w ,h );
		
		trace('\n\n');
		var self = this;
		setTimeout(function(){
			self.drawEverything();
		}, 500);
	},

	drawEverything : function() {
		
		var w = this.availW;
		var h = this.availH;
		trace( 'Shape Detection '+ w + ' , ' + h );
		if( w == 0 && h == 0){
			trace(' ERRROR shape is 0x0')
			return;
		}
		var dat = this.hiddenctx.getImageData(0,0,w,h);
		trace('Shape data wxh len ' + dat.width + ' ' + dat.height + ' ' + dat.data.length + '\n----');

		//empty it!
		this.plotted = [];
		//dat = this.contrast(dat, 10);
		this.drawAvgColor(dat,this.ctx);
		
		// this.drawAvgFromDictChannels(dat,this.ctx, 15);
		// this.drawAvgFromScaleDown(dat,this.ctx);
		// find those unique colors that stand out from the background color average :
		var shapes = this.findGrayScaleShapes();

		if( this.devswitches.drawHorizon == true ){
			// almost all images have a horizon find one...?
		}

		// time to draw these shapes:
		if( this.devswitches.objectDetect == true ){
			trace('\n\n ------ Draw defined objects ' + shapes.length );
			this.drawDefinedObjects(shapes);
		}

		// the shapes drawn: this.plotted.
		// find the edges of the shapes to draw objects. and find the average color in them.
	},

	// shrink image data to a small size
	// convert to gray scale 
	// add high contrast
	// we look for the pixel chunks that stand out.
	findGrayScaleShapes : function() {

		var showMapping = this.devswitches.showMapping;
		
		var w = this.availW;
		var h = this.availH;

		// do a shrink and high contrast to find the key shapes:

		var grayScaleCanvas = {cv : null, ctx: null, dat: null };
		var downscale = .04;
		var tw = Math.ceil(w * downscale);
		var th = Math.ceil(h * downscale);
		var contrastLevel = 255/2;
		var hiddencanvas = this.$el.find("#origin-hidden-canvas")[0];

		var maxAreaPerShape =  Math.floor( (tw * 0.1) * (th * 0.1) );


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
				this.drawRect(shapes[s][0]/downscale,shapes[s][1]/downscale, {r: 222, g: 250, b: 5, a: 0.75}, this.ctx, 20, 20 );
			}
		}    

		this.grayScaleCanvas = grayScaleCanvas;

		// We got all the shapes.
		// x,y values are scaled, they start at 0,0
		// nothing to do with the first index so skip.
		for( var s = 1; s < shapes.length; s++){

			var shape = shapes[s];
			// should never happen:
			if( shape == null ){ continue; }

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

			for( var ry = ( y-rangeThreshold ); ry <= y; ry++ ){
				if( ry < 0 || 
					(ry >= (th - 1)) ){
					// reached the edge
					// no need to add this matrix threshold.
					continue;
				}
				matrix.y.push(ry);
			}
			
			// include upper right hand corner:

			// now compare every single shape previously to see if there is a match 
			// at those 8 surrounding points:
			// only do upto the current shape we are checking
			// start at the shape, and go progressively further away (left and top)
			
			for( var si = (s-1); si >= 0; si-- ){
				// increment backwards starting at (currentshape - 1)
				var compared = shapes[si];
				if( compared === null ){ continue; }
				
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
					
					// trace('  match between the two');
					var cx = compared[0] + 0;
					var cy = compared[1] + 0;
					var cw = 1;
					var ch = 1;
					var id = s + 0;

					if( compared.length >= 4 ){
						// unique width/height
						cw = compared[2] + 0;
						ch = compared[3] + 0;
						id = compared[4] + 0;
					}

					if( shapes[s][2] * shapes[s][3] > maxAreaPerShape ){
						continue;
					}

					// define width, if no width is defined before adding to it.
					if( shapes[s].length < 4 ){
						shapes[s][2] = cw;
						shapes[s][3] = cw;
					}

					if( cx < x ){
						// cx is less. so there is something to be added here:
						shapes[s][0] = cx;
						// calculate the offset between cx and x.
						var difx = x - cx + 1;
						shapes[s][2] = difx;
					}

					if( cy < y ){
						// cy less y so there is something to be added here:
						shapes[s][1] = cy;
						// cal the offset between y and cy.
						var dify = y - cy + 1;
						shapes[s][3] = dify;
					}

					shapes[s][4] = id;
					// regardless of what we did; dump the shape previous now:
					shapes[si] = null;

				}
			}// end of looping matrix to previous shapes.

		}// end of looping shapes.length


		// clean up shapes:
		// trace( shapes );
		trace('  original shapes : ' + shapes.length);

		for( var s = shapes.length-1; s >= 0; s-- ){
			if( shapes[s] == null ){
				shapes.splice(s,1);
			}else if( shapes[s].length == 2 ){
				// define default w/h?   
			}
		}

		trace('  shapes cleaned : ' + shapes.length);
		// order shapes by size (remove after 5);
		// numerically put biggest first in the index.
		shapes.sort(function(a, b){
			if( a.length >= 4 && b.length >= 4 ){
				trace('  sorting has length match ' );
				return (b[2]*b[3]) - (a[2]*a[3]);
			}else if( a.length >= 4 && b.length < 4 ){
				return -1;
			}else if( b.length >= 4 && a.length < 4 ){
				return 1;
			}else{ 
				// both meh
				return 0;
			}
		});
		
		var shapesreturn = [];
		var shapesToReturn = shapes.length; //(shapes.length < 6)? shapes.length : 6;
		// we need at least three shapes that have defined w/h to exclude just the points collected.
		var numOfShapesWithWidth = 0;
		var minDefinedShapesNeeded = 3;
		var skipshapeswithNoWidth = false;
		for( var s = 0; s< shapes.length; s++){
			if( shapes[s].length >= 4 && numOfShapesWithWidth >= minDefinedShapesNeeded){
				skipshapeswithNoWidth = true;
				numOfShapesWithWidth++;
				break;
			}
		}
		
		var maxSurfaceArea = ( this.availW * this.availH ) * .8;
		for( var s = 0; s < shapesToReturn; s++ ){
			var sx = shapes[s][0] / downscale;
			var sy = shapes[s][1] / downscale;
			var sw = 20;
			var sh = 20;
			var id = "NA";

			// interval w  interveral h
			var iw = shapes[s][2];
			var ih = shapes[s][3];

			if( shapes[s].length >= 4 ){
				sw = shapes[s][2] / downscale;
				sh = shapes[s][3] / downscale;
				id = shapes[s][4];
			} else if( skipshapeswithNoWidth == true) {
				// no width/or height skip it:
				// make sure these aren't the only shapes ?
				continue;
			}

			// trace(' id ' + id + ' - '+ sx + ','+ sy + ' w:'+ sw +' h:'+sh );
			// trace(shapes[s]);
			
			if( showMapping == true ){
				this.drawRect(sx,sy, {
					r: 250, 
					g: 240, 
					b: 255, 
					a: 0.5
				}, 
				this.ctx, sw, sh );
			}

			if( sw * sh >= maxSurfaceArea ){
				// skip it too big.
				// continue;
			}

			shapesreturn.push({x: sx, y: sy, w: sw, h: sh, iw: iw, ih: ih});
		}
		// trace( " - shapesToReturn " + shapesreturn.length );
		return shapesreturn;
	},

	drawRect : function(x,y,c,ctx,sizew, sizeh) {
		ctx.fillStyle="RGBA("+c.r+","+c.g+","+c.b+","+c.a+")";
		ctx.fillRect(x,y,sizew,sizeh);
	},

	drawAvgColor : function(dat,ctx, ran){
		var red = 0, blue = 0, green = 0;
		var alpha = 1;
		var divisible = (dat.data.length/4);

		if(typeof(ran) !== 'undefined' ){
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

				red += dat.data[i];
				green += dat.data[i+1];
				blue += dat.data[i+2];
			}
		}

		

		red = Math.round(red / divisible);
		green = Math.round(green / divisible);
		blue = Math.round(blue / divisible);

		trace( "----\n Avg Bkgd Color found: RGBA("+red+","+green+","+blue+","+alpha+") \n----\n");
		ctx.fillStyle="RGBA("+red+","+green+","+blue+","+alpha+")";
		ctx.fillRect(0,0,this.availW,this.availH);

		this.colorAvg = {r: red, g: green, b: blue, a: alpha};
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
		this.plotted = [];

		for( var s =0; s < shapes.length; s++ ){

			var shape = shapes[s];
			var x = shape.x;
			var y = shape.y;
			var r = ( (shape.w > shape.h)? shape.w : shape.h )/2;
			var alpha = 1;
			var type = 'rect'; // circle
			var maxPercent = 0.35;
			var faces = 0;
			var strokeit = (Math.random() > 0.75 )? true : false;

			// if( r > (this.availW * maxPercent) || r > (this.availH * maxPercent) ){
			// 	type = 'rect';
			// } 

			if( Math.abs(shape.iw - shape.ih) <= 1 ){
				 
				 /*if( Math.random() > 0.4 ){
				 	type = 'arc';	
				 }else{
				 	*/
				 	type = 'polygon';
				 	faces = Math.round(Math.random() * 3) + 3;
				 	
				 	if( faces == 4 ){
				 		faces--;
				 	}
				 //}
			}else if(
				(shape.ih == 1 && shape.iw >= 1) ||
				(shape.iw == 1 && shape.ih >= 1) ||
				(Math.round() > 0.75)
			){
				type = 'line';
			}

			//trace(' type ' + type + " shape.iw " + shape.iw + " shape.ih " + shape.ih );

			var edgePadding = 20;
			//color pick x,y
			var cpx,cpy;
			// determine if this is an arc or rectangle, 
			// then make sure it is in bounds.
			if( type == 'arc' || type == 'polygon' ){
				// if we do the x by radius we risk loosing the actual defined shape
				// and color pick outside of the range.
				x +=  shape.w / 2;
				y +=  shape.h / 2;
				// define point BEFORE we reposition because of the edge:
				cpx = x;
				cpy = y;

				if( x+r+edgePadding >= this.availW ){
					x = this.availW - (r + edgePadding);
				}else if( x - r <= edgePadding ) {
					x = r + edgePadding;
				}

				if( y+r+edgePadding >= this.availH ){
					y = this.availH - (r + edgePadding);
				}else if( y - r <= edgePadding ){
					y = r + edgePadding;
				}

			}else if( type == 'rect' || type == 'line' ){
				// define point BEFORE we reposition because of the edge:
				cpx = x + shape.w/2;
				cpy = y + shape.h/2;

				if( x+shape.w+edgePadding >= this.availW ){
					x = this.availW - (shape.w + edgePadding);
				}else if( x <= edgePadding ){
					x = edgePadding;
				}

				if( y+shape.h+edgePadding >= this.availH ){
					y = this.availH - (shape.h + edgePadding);
				}else if( y <= edgePadding ){
					y = edgePadding;
				}
			}else if( type == 'line' ){
				cpx = x + shape.w/2;
				cpy = y + shape.h/2;


			}

			if( this.devswitches.showMapping == true){
				alpha = 0.55;
				test = true;
			}else{
				test = false;
			}

			var colorData = this.getPixelRGB( cpx, cpy, this.hiddenctx , test);
			var cur, dest;

			var increment = Math.random() * 0.1;
			if( increment < 0.02 ){
				increment = 0.02;
			}

			if( this.devswitches.animate == false ){
				increment = 1000;	
			}else{
				if( type == 'rect' ){
					dest = [shape.w,shape.h];
					cur = [0,0];
				}else if( type == 'arc' || type == 'polygon' ){
					cur = [0,0];
					dest = [r,r];
				}else if( type == 'line' ){
					cur = [0,0];
					dest = [shape.w, shape.h];
				}
			}

			this.plotted.push({x:x,y:y, rgb: colorData, a: alpha, 
								type: type, 
								current:cur, 
								destination:dest, 
								increment: increment, 
								faces: faces,
								strokeit : strokeit,
								rotation : 0,
								rotateIncrement : (Math.random() > 0.5)? -0.01 : 0.01
							});

			trace(s + ' shape type ' + type );
		}

		if( this.devswitches.animate == true ){
			trace( " --- num to be plotted " + this.plotted.length );
			this.ctx.clearRect(0,0,this.availW, this.availH);
			//this.clearCanvas();

			this.bkgdalpha = 0;

			this.alphaFadeCanvas.cv = document.createElement('canvas');
			this.alphaFadeCanvas.cv.width = this.availW * .08; //this.grayScaleCanvas.cv.width;// this.availW;
			this.alphaFadeCanvas.cv.height = this.availH * .08; //this.grayScaleCanvas.cv.width; //this.availH;
			this.alphaFadeCanvas.ctx = this.alphaFadeCanvas.cv.getContext('2d');
			this.alphaFadeCanvas.ctx.drawImage( this.grayScaleCanvas.cv, 0,0, this.alphaFadeCanvas.cv.height, this.alphaFadeCanvas.cv.height);
			this.alphaFadeCanvas.dat = this.alphaFadeCanvas.ctx.getImageData(0,0,this.alphaFadeCanvas.cv.height,this.alphaFadeCanvas.cv.height);
			
			// this.alphaFadeCanvas = null;
			this.incrementAlpha = 0.0000001;
			this.alphaBkgd = [];

			this.animating = true;
			this.animationCycle();
		}
	},

	animationCycle : function() {
		//var incremental = 0.1;
		var numCompleted = 0;
		var snapRange = 0.5;
		var animatebkgd = false;

		if( this.animating == false ){
			return false;
		}

		if( animatebkgd == true && this.alphaFadeCanvas != null){
			numCompleted = this.pixelateBkgdToSolid();
		}else{

			this.bkgdalpha = this.bkgdalpha + (Math.abs(this.bkgdalpha - 1) * 0.03);
			if( this.bkgdalpha >= 0.99 ) {
				this.bkgdalpha = 1;
				numCompleted += 1;
			}
			this.ctx.clearRect(0,0,this.availW, this.availH);
			this.ctx.fillStyle="RGBA("+this.colorAvg.r+","+this.colorAvg.g+","+this.colorAvg.b+","+this.bkgdalpha+")";
			this.ctx.fillRect(0,0,this.availW,this.availH);
		}
		
		
		for( var p = 0; p < this.plotted.length; p++){
			var shape = this.plotted[p];
			var x = shape.x;
			var y = shape.y;
			var incremental = shape.increment;

			this.ctx.fillStyle = 'RGBA('+shape.rgb.r+','+shape.rgb.g+','+shape.rgb.b+',1)';
			
			if( shape.type == 'rect' || shape.type == 'line' ){
				var newW = shape.current[0] + Math.abs((shape.current[0] - shape.destination[0]) * incremental);
				var newH = shape.current[1] + Math.abs((shape.current[1] - shape.destination[1]) * incremental);

				if( newH >= (shape.destination[1] - snapRange) ){
					newH = shape.destination[1];
					numCompleted += 0.5;
				}

				if( newW >= (shape.destination[0] - snapRange) ){
					newW = shape.current[0];
					numCompleted += 0.5;
				}
				
				x = shape.x + (shape.destination[0] - newW)/2
				y = shape.y + (shape.destination[1] - newH)/2

				shape.current[0] = newW;
				shape.current[1] = newH;
				
				if( shape.type == 'line' ){
					
					this.ctx.moveTo(x,y);
					this.ctx.lineTo(x+newW,y+newH);
					this.ctx.lineWidth = 5;
					this.ctx.strokeStyle = 'RGBA('+shape.rgb.r+','+shape.rgb.g+','+shape.rgb.b+',1)';
					this.ctx.stroke();

				}else{
					if( shape.strokeit == true ){
						this.ctx.strokeRect(x, y, newW, newH);
					}else{
						this.ctx.fillRect(x, y, newW, newH);
					}

				}

				this.ctx.beginPath();

			}else if(shape.type == 'arc' || 
					shape.type == 'polygon' ){

				var newR = shape.current[0] + Math.abs((shape.current[0] - shape.destination[0]) * incremental);
				if( newR >= (shape.destination[0] - snapRange) ){
					newR = shape.destination[0];
					numCompleted += 1;
				}

				shape.current[0] = newR;	
				
				if( shape.type == 'polygon' ){
					
					shape.rotation = (shape.rotation + shape.rotateIncrement) * 0.97;
					this.ctx.save(); // saves the coordinate system
					this.ctx.translate(x,y); // now the position (0,0) is found at (250,50)
					this.ctx.rotate(shape.rotation); // rotate around the start point of your line

					//http://scienceprimer.com/drawing-regular-polygons-javascript-canvas
					var numberOfSides = shape.faces,
						size = newR,
						Xcenter = 0, 	//x,
						Ycenter = 0;	//y;

					this.ctx.beginPath();
					this.ctx.moveTo (Xcenter +  size * Math.cos(0), Ycenter +  size *  Math.sin(0));          

					for (var i = 1; i <= numberOfSides;i += 1) {
						var linetoX = Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides);
						var linetoY = Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides);
						this.ctx.lineTo(linetoX, linetoY);
					}

					this.ctx.restore();

				}else{
					this.ctx.arc(x, y, newR, 0, 2 * Math.PI, false);
				}

				if( shape.strokeit == true ){
					this.ctx.lineWidth = 5;
					this.ctx.strokeStyle = 'RGBA('+shape.rgb.r+','+shape.rgb.g+','+shape.rgb.b+',1)';
					this.ctx.stroke();
				}else{
					this.ctx.fillStyle = 'RGBA('+shape.rgb.r+','+shape.rgb.g+','+shape.rgb.b+',1)';
					this.ctx.fill();
				}

				this.ctx.beginPath();
				//this.ctx.restore();
			}		    
		}
	
		//trace( numCompleted + "=="+ (this.plotted.length+1) );
		if( numCompleted == (this.plotted.length+1) ){
			trace(' num Completed has maxed');
			this.showExport();
			return;
		}
		//trace(' - new frame - \n')
		window.requestAnimationFrame(this.animationCycle.bind(this));
	},


	showExport : function() {
		// http://stackoverflow.com/questions/11206955/saving-canvas-as-a-png-or-jpg
		var image = this.$canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream"); 

		$(".export-wrapper").addClass("active");
	    $('#export-btn')
		    .attr({
			    'download': 'yoursimplifiy.png',  /// set filename
			    'href'    : image              /// set data-uri
		     });
	},

	pixelateBkgdToSolid : function() {
		var numCompleted = 0;
		// we are going to individually draw the pixels by alpha of the gray scale canvas.
		this.ctx.clearRect(0,0,this.availW, this.availH);
		var increaseIncrementAlphaBy = 0.001;

		var w = this.alphaFadeCanvas.dat.width; 
		var h = this.alphaFadeCanvas.dat.height;
		var data = this.alphaFadeCanvas.dat.data;
		
		var incrementAlpha = this.incrementAlpha;
		var bkgdCompleteProcess = 0;
		var ratio = {w: this.availW / w, h: this.availH/h};
		
		for( var d = 0; d < data.length; d += 4 ){
			// assess on a scale of 0 - 255 what the opacity should be
			var px = d/4;
			var x = px % w * ratio.w;
			var y = Math.floor(px / w) * ratio.h;
			var rectSizeW = 2 * ratio.w;
			var rectSizeH = 2 * ratio.h;
			
			var maxChannel = 255 * 3;
			var channel, originChannel;
			
			if( this.alphaBkgd.length >= d ){
				channel = this.alphaBkgd[d];
				originChannel = data[d];
			}else{
				originChannel = data[d];
				channel = data[d] + 1;

				// trace(' not defined yet...' + originChannel + " chan " + channel );
			}

			var customIncrement = incrementAlpha * ((originChannel-125)/255);

			var channelAlpha = channel + Math.abs( ((channel - originChannel)) * customIncrement);
			var calcAlpha = (channelAlpha - originChannel) / (maxChannel - originChannel);
			//var calcAlpha = (channelAlpha) / (maxChannel);

			if( calcAlpha >= 0.99 ){
				calcAlpha = 1;
				bkgdCompleteProcess++;
				channelAlpha = maxChannel;
			}

			this.alphaBkgd[d] = channelAlpha;
				
			//trace(d + ' data d: '+ this.alphaFadeCanvas.dat[d+2] + ' - - ' + calcAlpha + ' alpha ' + alpha);
			//this.ctx.fillStyle="RGBA(255,100,200,0.1)";
			this.ctx.fillStyle="RGBA("+this.colorAvg.r+","+	this.colorAvg.g+","+this.colorAvg.b+","+calcAlpha+")";
			this.ctx.fillRect( (x - rectSizeW/2),( y - rectSizeH/2), rectSizeW , rectSizeH);
			
			//this.ctx.fillStyle="RGBA(25,200,100,0.4)";
			// this.ctx.arc(x, y, 300, 0, 2 * Math.PI, false);
			// this.ctx.fill();
			// this.ctx.beginPath();	

		}
		this.ctx.beginPath();
		// trace( bkgdCompleteProcess + ' / ' + (data.length / 4) );
		if( bkgdCompleteProcess/(data.length/4) == 1 ){
			numCompleted += 1;
		}
		// regardless
		// numCompleted = 1;
		this.incrementAlpha += increaseIncrementAlphaBy;

		return numCompleted;
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
		
		for( var i = 0; i < gsd.data.length; i+=4) {
			// loop time!
			px = i/4;
			y = Math.floor(px / gsd.width);
			x = px % gsd.width;
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

		w = w * .90;

		if( w > mW ){
			w = mW;
		}

		// make it a square
		h = w;

		this.availH = h;
		this.availW = w;

		this.$el.css({
			"width" : w,
			"height" : h
		});

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