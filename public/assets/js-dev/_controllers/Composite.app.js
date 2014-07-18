/*
 *  App home page controller/composite
 * 
 */

 define([
    'jQuery',
    'BaseComposite',
    'GlobalConfig',
    'GlobalClasses',
    'GlobalEvents',
    'Hammer',
    'SimplifyView'
  ], function(
    $,
    BaseComposite,
    Config,
    Classes,
    Events,
    Hammer,
    SimplifyView

  ){
    
  return BaseComposite.extend({
    _Name       : "App Composite",   
    _Model      : null,
    _Template   : null,
    _AppendTo   : null,
    _PrependTo  : null,
    simplifyView : null,

    init : function() {

        this.$el = $(".app");
        this._super();

        this.simplifyView = new SimplifyView();
    },


    resize : function(e,w,h){
        // do stuff FIRST then dispatch the composite.resize:
        this._super(e,w,h);
    }
    
    });
});