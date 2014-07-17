/*
 * 
 * 
 */

 define([
    'jQuery',
    'BaseClass',
    'GlobalConfig',
    'GlobalClasses',
    'GlobalEvents',
    'Handlebars',
    'text'
  ], function(
    $,
    BaseClass,
    Config,
    Classes,
    Events,
    Handlebars
  ){

  return BaseClass.extend({
    id         : undefined,
    _Name      : "Base Class", // just a reference for debugging.
    _Model     :  { title:'base view', description: 'model can also be a string value require will look for' },
    _Template  :  'handlebars',
    _AppendTo  :  null, // AppendTo this selector
    _PrependTo :  null, // Or PrependTo this selector
    _ExtraPartialModels : {},
    type : null,

    init : function() {              
      this.renderTemplate();
    },

    renderTemplate : function() {
        // Debug.trace(' - Loading template Model ' + this.settings._Model ); 
        if( typeof this._Template === 'undefined' ||
            this._Template.length < 1 ){
            trace(' NO TEMPLATE DEFINED ABORT!');
            return;
        }

        var view = this,
            requireArray = [
                            'text!../templates/'+this._Template
                            ];

        /*
         * Do we need to load a model as well?
         * The model will hold all the variables that are to be displayed in the html template
         * _Model can be either a string (path to a config file)
         * or can be an object without the need to load anything else.                                 
         */
        if( typeof this._Model == 'string' ){
          requireArray.push(this._Model);
        };

        require( 
            requireArray,
        function(
            Template,
            Model
        ){

            if( typeof Model === 'undefined' ){
              // this/view._Model was an object not a url string for require:
              Model = view._Model;
            }else{
              view._Model = Model;
            }

            if(typeof view.id !== 'undefined' ){
              Model.id = view.id;
            }

            // inject extra partial models that might be needed for the handlebars template and partials
            for( var key in view._ExtraPartialModels) {
              view._Model[key] = view._ExtraPartialModels[key];
            }

            var handlebar = Handlebars.compile(Template);
            view.$el = $( handlebar(Model) );

            // otay... now add it somewhere:
            if( typeof view._AppendTo === 'string' ){
              $(view._AppendTo).append(view.$el);
            }else if( typeof view._PrependTo === 'string' ){
              $(view._PrependTo).prepend(view.$el);
            }

            // what for the call stack to be complete:
            setTimeout(function(){view.didInsertElement();}, 0);
            // or do it imediately?
            //view.didInsertElement();
        });
    },

    didInsertElement : function() {
      // this.$el is now created and inserted into the DOM.
      this.bindEvents();
    },

    bindEvents : function() {
      this.$doc.on(Events.app.stateChange, this.stateChange.bind(this));
      this.$doc.on(Events.view.resize, this.resize.bind(this));
    },

    stateChange : function(e, coords, type, pt ) {

    },
     
    resize : function(e, w, h){
      var ww = $(window).width();

      this.type = 'lrg';
      if( ww <= Config.bkptMed ){
        if( ww <= Config.bkptSml ){
            this.type = 'sml';
        }else{
            this.type = 'med';
        }
      }  

    }

  })

});