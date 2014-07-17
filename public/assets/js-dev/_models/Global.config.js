define([], function() {
    var scrollBarWidth = 16;

    return {
      
      // breakpoints :
      bkptEnd   : 1600,
      bkptMax   : 1600, //980,
      bkptMed   : 992 - scrollBarWidth,  //767,
      bkptSml   : 767 - scrollBarWidth,   //480

      tweenTime : {
        quick : 1/4,
        med   : 1/2,
        slow  : 3/4,
        lng   : 1,
        vlng  : 2,
        navOpenCollapse : 3/4
      }

    }
});
