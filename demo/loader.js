requirejs.config({
    "baseUrl": "lib",
    "urlArgs" : "bustCache=" + (new Date()).getTime(),
    "paths": {
        "demo": "../demo",
        "arcmenu" : "../src/jquery.ui.arcmenu",
        "modernizr" : "modernizr.css.transitions"
    },
    "shim" : {
        // are non AMD scripts
        "jquery-ui" : {
            "deps" : ["jquery"],
            "exports" : "jquery-ui"
        },
        "arcmenu" : {
            "deps" : ["jquery-ui", "modernizr"],
            "exports" : "arcmenu"
        }
    }
});

// Load the main app module to start the app
requirejs(["demo/app"]);