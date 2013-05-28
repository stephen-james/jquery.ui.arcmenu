module("[css_support.js] CSS Transitions - Element Position", {

    setup : function(){
    },

    teardown : function(){
    }
});


test("CSS Transition", function(){
    var elementToMove = $("<div id='elementToMove'></div>");
    $("#qunit-fixture").append(elementToMove);

    elementToMove.css({
        "position" : "absolute",
        "top" : 0,
        "left" : 0,
        "-webkit-transition-property" : "left, top",
        "-moz-transition-property" : "left, top",
        "transition-property" : "left, top",
        "-webkit-transition-duration" : "1s, 1s",
        "-moz-transition-duration" : "1s, 1s",
        "transition-duration" : "1s, 1s"
    });



});
