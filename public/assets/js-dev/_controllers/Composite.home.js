/*
 * 
 * 
 */

 define([
    'jQuery',
    'BaseComposite',
    'GlobalConfig',
    'GlobalClasses',
    'GlobalEvents',
    'Hammer'
  ], function(
    $,
    BaseComposite,
    Config,
    Classes,
    Events,
    Hammer
  ){
    
  return BaseComposite.extend({
    _Name      : "Home Page",   
    _Model     : '_models/Composites.home',
    _Template  : 'composites/home.handlebars',


    init : function() {
        this._super();

    },


    resize : function(e,w,h){
        // do stuff FIRST then dispatch the composite.resize:
        
        this._super(e,w,h);
    }
    
    });
});