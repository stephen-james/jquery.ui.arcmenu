var ArcMenu = ArcMenu || {

    menuStates : (function(){
        // uses a closure/immediately-invoking-function pattern to create store for relationships between menu states.
        // this was primarily to avoid knowledge of states in the rest of the code and allow manipulation
        // using next(), nextTransitory() or opposite() methods.
        var self = this,
            open = { name : "open", isOpenOrOpening : true },
            closed = { name : "closed", isOpenOrOpening : false },
            opening = { name : "opening", isOpenOrOpening : true },
            closing = { name : "closing", isOpenOrOpening : false };

        open.next = function() { return self.ArcMenu.menuStates.closing; };
        open.opposite = function() { return self.ArcMenu.menuStates.closed; };
        open.nextTransitoryState = function() { return self.ArcMenu.menuStates.closing; }

        closed.next = function() { return self.ArcMenu.menuStates.opening; };
        closed.opposite = function() { return self.ArcMenu.menuStates.open; };
        closed.nextTransitoryState = function() { return self.ArcMenu.menuStates.opening; }

        opening.next = function() { return self.ArcMenu.menuStates.open; };
        opening.opposite = function() { return self.ArcMenu.menuStates.closing; };
        opening.nextTransitoryState = function() { return self.ArcMenu.menuStates.closing; }

        closing.next = function() { return self.ArcMenu.menuStates.closed; };
        closing.opposite = function() { return self.ArcMenu.menuStates.opening; };
        closing.nextTransitoryState = function() { return self.ArcMenu.menuStates.opening; }

        return {
            open : open,
            closed : closed,
            opening : opening,
            closing : closing,

            isValidStateName : function(stateName) {
                return this.hasOwnProperty(stateName);
            }
        }
    })()

}

$(function() {
    $.widget("custom.arcmenu", {
        options : {
            arcDegrees : 90,
            size : "auto",
            target : "#target",
            trigger : "click",
            close : "#close",
            closeTrigger : "click",
            openAsModal : true,
            autoCloseWithTimer : true,
            autoCloseTimeoutInMillis : 3000,
            itemClickHandler : undefined,
            menuClosedHandler : undefined,
            menuClosingHandler : undefined,
            menuOpeningHandler : undefined
        },

        // caller that initiated the arcmenu
        caller : undefined,

        // the timer used for auto collapse
        timer : undefined,

        // size (in one dimension because widget is square)
        size : undefined,

        menuStates : ArcMenu.menuStates,

        eventHandlers : {
            itemClicked : function(item, context) {
                // wire up your similarly signed event function
                console.info("arcmenu", "default itemClicked event handler");
            },

            menuClosed : function() {
                // wire up your similarly signed event function
                console.info("arcmenu", "default menuClosed event handler");
            },

            menuClosing : function() {
                // wire up your similarly signed event function
                console.info("arcmenu", "default menuClosing event handler");
            },

            menuOpened : function() {
                // wire up your similarly signed event function
                console.info("arcmenu", "default menuOpened event handler");
            },

            menuOpening : function() {
                // wire up your similarly signed event function
                console.info("arcmenu", "default menuOpening event handler");
            }
        },

        _create : function() {
            var self = this,
                options = self.options,
                menu = self.element,
                menuItems = menu.children();

            // decorate the dom elements
            menu
                .addClass("ui-arcmenu")
                .wrap("<div class='ui-arcmenu-container'></div>");

            menuItems
                .addClass("ui-arcmenu-item");

            // determine sizes
            self.size = (options.size === "auto") ? menu.outerWidth() : options.size;

            self._placeMenuItemsInStartPosition(menuItems);
            self._setState("closed");

            self._bindEvents();
        },

        _placeMenuItemsInStartPosition : function(menuItems) {
            var self = this;

            menuItems.each(function(){
                $(this).css({
                    "left" : 0,
                    "top" : self.size - $(this).outerHeight() + "px"
                });
            });
        },

        _bindEvents : function() {
            var self = this,
                options = self.options,
                menu = self.element,
                menuItems = menu.children();

            // Bind Menu open and close triggers
            $(options.target).on(options.trigger, function(){
                // keep track of the element that triggered this event
                self.caller = this;
                // apply to keep the context of this to being the widget for this anonymous call
                self.openMenu.apply(self);
            });

            $(options.close).on(options.closeTrigger, function(){
                self.closeMenu.apply(self);
            });

            // Bind Menu Item events
            menuItems
                .click(function(){
                    if(self.eventHandlers.itemClicked) {
                        self.eventHandlers.itemClicked(this, self.caller);
                    }
                })
                .hover(
                    function onHover(){
                        clearInterval(self.timer);
                    },
                    function onHoverOut() {
                        self._setAutoCollapseTimeout();
                    }
                );

            // assign handler for when an arc menu item is clicked
            if (options.itemClickHandler) {
                self.eventHandlers.itemClicked = options.itemClickHandler;
            }
            if (options.menuClosedHandler) {
                self.eventHandlers.menuClosed = options.menuClosedHandler
            }
            if (options.menuClosingHandler) {
                self.eventHandlers.menuClosing = options.menuClosingHandler
            }
            if (options.menuOpeningHandler) {
                self.eventHandlers.menuOpening = options.menuOpeningHandler
            }

        },

        openMenu : function() {
            var self = this,
                menu = self.element,
                menuItems = menu.children(),
                menuItemsCount = menuItems.length,
                options = self.options;

            if (self._getState().isOpenOrOpening) {
                // can't open already open
                return;
            }

            // handle the state change to open
            self._handleStateTransition();

            menuItems
                .each(function(){
                    var menuItem = $(this),
                        ordinal = menuItem.index(),
                        itemPosition = self._calculateItemPositionOnArc(menuItem, ordinal);

                    menuItem
                        .addClass("ui-arcmenu-open-easing")
                        .removeClass("ui-arcmenu-close-easing");

                    self._setOrdinalBasedDelayOnItem(menuItem, ordinal, menuItemsCount, false);

                    menuItem
                        .css({
                            "top" : itemPosition.top,
                            "left" : itemPosition.left
                        });
                });

            if (options.openAsModal) {
                var modalPanel = $("<div class='ui-arcmenu-modal-panel'></div>");
                $("body").append(modalPanel);

                modalPanel.click(function(){
                   self.closeMenu();
                });
            }

            self._setAutoCollapseTimeout();
        },

        closeMenu : function() {
            var self = this,
                menu = self.element,
                menuItems = menu.children(),
                menuItemsCount = menuItems.length;

            if (!self._getState().isOpenOrOpening) {
                // can't close already closed
                return;
            }


            // handle the state change to closed
            self._handleStateTransition();

            menuItems
                .each(function(){
                    var menuItem = $(this),
                        ordinal = menuItem.index();

                    menuItem
                        .addClass("ui-arcmenu-close-easing")
                        .removeClass("ui-arcmenu-open-easing");

                    self._setOrdinalBasedDelayOnItem(menuItem, ordinal, menuItemsCount, true);
                });


            self._placeMenuItemsInStartPosition(menuItems);

            if (self.options.openAsModal) {
                $(".ui-arcmenu-modal-panel").remove();
            }

        },



        _getState : function() {
            var self = this;

            return self.menuStates[self.element.data("transition-state")];
        },

        _setState : function(state) {
            var self = this;

            if (!ArcMenu.menuStates.isValidStateName(state)) {
                throw {
                    name : "IllegalStateError",
                    message : "Arcmenu cannot be set to the provided unrecognised state."
                }
            }

            // set state information
            self.element.data("transition-state", state);

            // call events
            switch (state) {
                case "closing" :
                    self.eventHandlers.menuClosing();
                    break;
                case "closed" :
                    self.eventHandlers.menuClosed();
                    break;
                case "opening"  :
                    self.eventHandlers.menuOpening();
                    break;
                case "open"  :
                    self.eventHandlers.menuOpened();
                    break;
            }
        },

        _handleStateTransition :  function() {
            var self = this,
                menu = self.element,
                menuItems =  menu.children(),
                currentState = self._getState();

            // mark the menu as in a transitionary state
            self._setState(currentState.nextTransitoryState().name);

            // if browser supports transitions, menu should enter the new state only once transitions complete
            if (self._transitionsSupported()) {
                // we have 2x the number of items as steps, because we are considering top AND left transitions here except for the edge elements
                self.element.data("transition-step-counter", menuItems.length * 2 - 2);

                menuItems
                    .on(self._getTransitionEventString(), function(event){

                        if (event.originalEvent.propertyName === "left" || event.originalEvent.propertyName === "top") {
                            // reduce the transition steps remaining by one
                            var transitionStepsRemaining = $(this).parent().data("transition-step-counter");

                            transitionStepsRemaining--;

                            $(this).parent().data("transition-step-counter", transitionStepsRemaining);

                            // if there are no transition steps remaining, we have completed the transition, fire the closed event
                            if (transitionStepsRemaining === 0) {
                                self._finaliseMenuState();
                            }
                        }
                    });
            }
            else {
                self._finaliseMenuState();
            }
        },

        _finaliseMenuState : function() {
            var self = this,
                menu = self.element,
                menuItems =  menu.children(),
                menuState = self._getState();

            // remove all transition events
            menuItems.off(self._getTransitionEventString());
            self._setState(menuState.next().name);
        },

        _calculateItemPositionOnArc : function(item, index) {
            var self = this,
                menu = self.element,
                menuItems =  menu.children(),
                angleFromOrigin = 90 - (self.options.arcDegrees / (menuItems.length - 1) * index),
                radiansFromOrigin = self._radiansFromDegrees(angleFromOrigin),
                itemSize = item.outerWidth(),
                radius = self.size - itemSize,
                x = Math.round(Math.cos(radiansFromOrigin) * radius),
                y = Math.round(radius - Math.sin(radiansFromOrigin) * radius);

            return {
                top : y,
                left: x
            }
        },

        _setAutoCollapseTimeout : function(){
            var self = this,
                options = self.options;

            if (options.autoCloseWithTimer) {
                clearInterval(self.timer);
                self.timer = setTimeout(function(){ self.closeMenu.apply(self); }, options.autoCloseTimeoutInMillis);
            }
        },

        _setOrdinalBasedDelayOnItem : function(item, ordinal, siblingsCount, reverse) {
            var ordinalBasedDelay = ((reverse) ? (siblingsCount - ordinal)  * 0.05 : ordinal  * 0.05) + 0.2,
                transitionDelay = item.css("transition-delay");

            if (transitionDelay) {
                var transformDelay = transitionDelay.split(",")[2];
            }

            ordinalBasedDelay = Math.round(ordinalBasedDelay * 100) / 100;
            item.css("transition-delay", ordinalBasedDelay + "s, " + ordinalBasedDelay + "s, " + transformDelay);
        },

        _radiansFromDegrees : function(degrees) {
            return Math.PI * degrees / 180;
        },

        _transitionsSupported : function() {
            var modernizr = window.Modernizr;

            if (!modernizr || modernizr.csstransitions === undefined) {
                console.error("arcmenu requires Modernizr csstransitions to detect transition support");
                return;
            }

            return modernizr.csstransitions;
        },

        _getTransitionEventString : function() {
            return "webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend";
        }

    });
});