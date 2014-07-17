define([], function() {

  return {
        
        app : {
          // pass a new state
          stateChange : 'app.stateChanged',
          // reset entire state(s) of app:
          reset       : 'app.reset'
        },
        dom : {
          resize      : 'dom.resize',
          forceResize : 'dom.forceresize',
          update      : 'dom.update',
          admin       : 'dom.adminmode'
        },
        
        composite : {
          resize      : 'composite.resize'
        },
        view : {
          resize      : 'view.resize'
        },
        
        debug : {
          show        : 'debugger.show',
          hide        : 'debugger.hide'
        },
        trace : {
          show        : 'trace.show',
          hide        : 'trace.hide'
        }
    }

});