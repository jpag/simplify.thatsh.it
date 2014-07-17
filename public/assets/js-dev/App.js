/*
 * CONFIG settings for REQUIRE JS
 * PATHS etc refs to all libs.
 */

requirejs.config({

    baseUrl: 'assets/js-dev/',

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
        CompositeHome               : '_controllers/composite.home'

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
            deps    : ["jQuery","Hammer","FastClick","Handlebars"],
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
    'FastClick',
    'text'
], function(
    $,
    TweenLite,
    Config,
    BaseClass,
    Events,
    FastClick
) {
    
    var App = BaseClass.extend({
        trace : true,
        
        init : function() {

            this._super();
            
            this.$el = $("body");
            var url = window.location.pathname.toLowerCase(),
                // Default page is : 
                PAGE = 'CompositeHome',
                self = this,
                callback = self.loaded.bind(this),
                data = {} ;

            // ROUTER:
            if( url.search('/blah') > -1 ){
              PAGE = 'CompositeBlah';
              data = {};
            }

            // create scene:
            require([PAGE],function(_PAGE){
              window.app.page = new _PAGE(data);
              callback();
            });

        },

        loaded : function() {
          var self = this;

          setTimeout( function(){
              self.windowResizeDispatcher(null) 
            }, 0);
        },

        bindEvents : function(){
            this._super();
            $(window).resize(this.windowResizeDispatcher.bind(this));
            this.$doc.on(Events.dom.forceResize, this.windowResizeDispatcher.bind(this));
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
          this.$doc.trigger(Events.composite.resize, [ww,wh]);
        }
    });

    FastClick.attach(document.body);
    window.app = new App();

});
