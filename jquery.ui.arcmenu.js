$(function() {
    $.widget("custom.arcmenu", {
        options : {
            arcDegrees : 90,
            size : "auto",
            itemSize : "auto",
            target : "#target",
            trigger : "click",
            close : "#close",
            closeTrigger : "click",
            openAsModal : true,
            autoCloseWithTimer : true,
            autoCloseTimeoutInMillis : 3000,
            context : undefined,
            itemClickHandler : undefined
        },

        _create : function() {
            var self = this,
                options = self.options,
                menu = self.element,
                menuItems = menu.children(),
                menuItemsCount = menuItems.length;

            // decorate the dom elements
            menu
                .addClass("ui-arcmenu")
                .addClass("ui-arcmenu-closed")
                .wrap("<div class='ui-arcmenu-container'></div>");

            menuItems
                .addClass("ui-arcmenu-item");

            // determine sizes
            if (options.size == "auto") {
                options.size = menu.outerWidth();
            }

            if (options.itemSize == "auto" && menuItems.length > 0) {
                options.itemSize = $(menuItems[0]).outerWidth();
            }

            menuItems
                .css({
                        "left" : 0,
                        "top" : options.size - options.itemSize + "px"
                    })
                .click(function(){
                    if(self.itemClicked) { self.itemClicked(this, self.caller); }
                });

           // bind events
            $(options.target).on(options.trigger, function(){
                // keep track of the element that triggered this event
                self.caller = this;
                // apply to keep the context of this to being the widget for this anonymous call
                self.openMenu.apply(self);
            });

            $(options.close).on(options.closeTrigger, function(){
                self.closeMenu.apply(self);
            });

            if (options.itemClickHandler) {
                self.itemClicked = options.itemClickHandler;
            }
        },

        openMenu : function() {
            var self = this,
                menu = self.element,
                menuItems = menu.children(),
                menuItemsCount = menuItems.length,
                options = self.options;

            menuItems
                .each(function(){
                    var menuItem = $(this),
                        ordinal = menuItem.index(),
                        itemPosition = self.calculateItemPositionOnArc({
                            ordinal : ordinal,
                            siblingsCount : menuItemsCount,
                            element : this
                        });

                    menuItem
                        .addClass("ui-arcmenu-open-easing")
                        .removeClass("ui-arcmenu-close-easing");

                    self.setOrdinalBasedDelayOnItem(menuItem, ordinal, menuItemsCount, false);

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

            menu
                .removeClass("ui-arcmenu-closed")
                .addClass("ui-arcmenu-open");

            if (options.autoCloseWithTimer) {
                var match = self.autoTimerEventStillValidMatcher;
                setTimeout(function(){ if (self.autoTimerEventStillValidMatcher == match) { self.closeMenu.apply(self); } }, options.autoCloseTimeoutInMillis);
            }
        },

        closeMenu : function() {
            var self = this,
                menu = self.element,
                menuItems = menu.children(),
                menuItemsCount = menuItems.length;

            self.autoTimerEventStillValidMatcher++;

            menuItems
                .each(function(){
                    var menuItem = $(this),
                        ordinal = menuItem.index();

                    menuItem
                        .addClass("ui-arcmenu-close-easing")
                        .removeClass("ui-arcmenu-open-easing");

                    self.setOrdinalBasedDelayOnItem(menuItem, ordinal, menuItemsCount, true);

                    menuItem
                        .css({
                            "top" : self.options.size - self.options.itemSize + "px",
                            "left" : 0
                        });
                });

            menu
                .removeClass("ui-arcmenu-open")
                .addClass("ui-arcmenu-closed");

            if (self.options.openAsModal) {
                $(".ui-arcmenu-modal-panel").remove();
            }

        },

        calculateItemPositionOnArc : function(item) {
            var self = this,
                angleFromOrigin = 90 - ((item.ordinal == 0) ? 0 : self.options.arcDegrees / (item.siblingsCount - 1) * item.ordinal),
                radiansFromOrigin = self.radiansFromDegrees(angleFromOrigin),
                itemSize = $(item.element).outerWidth(),
                radius = self.options.size - itemSize,
                x = Math.round(Math.cos(radiansFromOrigin) * radius),
                y = Math.round(radius - Math.sin(radiansFromOrigin) * radius);

            return {
                top : y,
                left: x
            }
        },

        setOrdinalBasedDelayOnItem : function(item, ordinal, siblingsCount, reverse) {
            var ordinalBasedDelay = ((reverse) ? (siblingsCount - ordinal)  * 0.05 : ordinal  * 0.05) + 0.2,
                transitionDelay = item.css("transition-delay");

            if (transitionDelay) {
                var transformDelay = transitionDelay.split(",")[2];
            }

            ordinalBasedDelay = Math.round(ordinalBasedDelay * 100) / 100;
            item.css("transition-delay", ordinalBasedDelay + "s, " + ordinalBasedDelay + "s, " + transformDelay);
        },

        radiansFromDegrees : function(degrees) {
            return Math.PI * degrees / 180;
        },

        autoTimerEventStillValidMatcher : 1,

        caller : undefined,

        itemClicked : function(item, context) {
            // wire up your similarly signed event function
        }

    });
});