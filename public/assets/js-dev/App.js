/*
 * CONFIG settings for REQUIRE JS
 * PATHS etc refs to all libs.
 */

requirejs.config({

	baseUrl: getRequirePath(),

	/*
	 * Define aliases for the paths used.
	 * If you edit this section, make sure the analog edit goes into
	 * build.js as well. These need to stay in sync.
	 */

	paths: {
		// Libraries :
		jQuery                      : '_wrappers/jquery.wrapper',
		TweenLite                   : '_lib/tweenlite/TweenMax.min',
		ScrollToPlugin              : '_lib/tweenlite/plugins/ScrollToPlugin.min',
		text                        : '_lib/text',
		Hammer                      : '_lib/hammer.min',
		FastClick                   : '_lib/fastclick',
		Handlebars                  : '_lib/handlebars-1.0.0',
		Modernizr                   : '_lib/modernizr',
		Paper                       : '_lib/paper/paper-core.min',
		
		// Configurations :
		GlobalConfig                : '_models/Global.config',
		GlobalClasses               : '_models/Global.classes',
		GlobalEvents                : '_models/Global.events',
		GlobalStates                : '_models/Global.states',

		// Base elements
		BaseClass                   : '_controllers/_BaseClass',
		BaseView                    : '_controllers/_BaseView',
		BaseComposite               : '_controllers/_BaseComposite',
		
		// Composites
		AppComposite                : '_controllers/Composite.app',
		SimplifyView                : '_controllers/View.simplifyapp'

		// Models
		
		// Views
		
		// Controllers
		
		
	},

	priority: ['jQuery'],
	shim: {
		"Handlebars":{
			deps    :["jQuery"],
			exports : "Handlebars"
		},

		"FastClick" : {
			deps    : ["jQuery"],
			exports : "FastClick"
		},

		"BaseView" : {
			deps    : ["jQuery","Hammer","FastClick","Handlebars","Modernizr"],
			exports : "BaseView"
		}
	}
});

/* -----------------------------------
 * ----- Let us start up the APP -----
 * -----------------------------------
 */

require([
	'jQuery',
	'TweenLite',
	'GlobalConfig',
	'BaseClass',
	'GlobalEvents', 
	'AppComposite',
	'SimplifyView',
	'FastClick',
	'Modernizr',
	'text'
], function(
	$,
	TweenLite,
	Config,
	BaseClass,
	Events,
	_composite,
	_simplifyView,
	FastClick
) {
	
	var App = BaseClass.extend({
		trace : true,
		
		resizeThrottle : null,
		
		comp : null,
		
		testerror : false,
		testTouch : false,
			
		//composites : [],

		init : function() {

			this._super();
			
			this.$el = $("body");

			// run checks for support:

			if( !Modernizr.draganddrop || 
				!Modernizr.svg ||
				!Modernizr.canvas ||
				this.testerror == true
			  ){

			  // TODO : add a proper fail message
			  alert('Your browser is missing compatibility features required to view this.');
			  $("#simplifyapp").addClass('nosupport');
			  return;

			}else if( Modernizr.touch == true || this.testTouch == true ) {
				$("#simplifyapp").addClass('touchdevice');
				// will not support drag and drop file uploading etc.
				$("body").addClass('touchdevice');

				$(".cta-ok.btn").bind({
					"click" : this.closeModial.bind(this)
				})
			}

			//require(['AppComposite'],function(_composite){
			 this.comp = new _composite();
			//});

			this.bindEvents();
		},

		bindEvents : function(){
			this._super();
			$(window).resize(this.windowResizeDispatcher.bind(this));
			this.$doc.on(Events.dom.forceResize, this.windowResizeDispatcher.bind(this));
		},

		closeModial : function(e) {
			$(".overlay").addClass("close");
		},

		/*
		 * resizing will first run through THIS function 
		 * to calculate certain ratios etc needed
		 */
		windowResizeDispatcher : function(e){
		  var ww  =   $(window).width(),
			  wh    =   $(window).height(),
			  w     =   ww,
			  h     =   wh,
			  maxH  =   Config.maxH,
			  minW  =   Config.minW,
			  ratio =   Config.ratio;

			// now dispatch to the views listening:
			if( this.resizeThrottle != null ){
				clearTimeout( this.resizeThrottle );
			}
			var self = this;
			this.resizeThrottle = setTimeout( function() {
				self.$doc.trigger(Events.composite.resize, [ww,wh]);
			}, 150 );

		}
	});

	FastClick.attach(document.body);
	window.app = new App();

});
