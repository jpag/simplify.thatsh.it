({
    
    appDir  : '../public/assets/js-dev',
    baseUrl : '.',
    dir     : '../public/assets/js',

    optimize            : 'uglify',
    skipDirOptimize     : true,
    normalizeDirDefines : 'skip',

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

    },

    shim: {

    },

    modules: [
        {
            name    : 'App'
        }
    ]
})