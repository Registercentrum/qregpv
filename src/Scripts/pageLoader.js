(function(window, document) {
    // body
    var s;

    var pageLoader = {
        settings: {
            widgetUrl: '//localhost:3005/devapi/pages/{0}',
            containerId: 'page-container',
            defaultPageId: 1867
        },
        init: function() {
            s = this.settings;
            pageLoader.hashChange();
            if (window.addEventListener) {
                window.addEventListener(
                    'hashchange',
                    pageLoader.hashChange,
                    false
                );
            } else if (window.attachEvent) {
                window.attachEvent('onhashchange', pageLoader.hashChange);
            }
        },
        navigateToPage: function(pageId) {
            if (typeof location === 'undefined' || !location) {
                return;
            }
            location.hash = '#!page?id=' + pageId;
        },
        sidCorsCallback: function(responseText, container, id) {
            var data = Ext.decode(responseText);
            var mainContainer = Ext.get(container);
            this.purgeOrphans(mainContainer);
            mainContainer && mainContainer.setHtml(data.data.PageContent, true);
            //Overwrite standard navigation function...
            pageLoader.navigateToPage = function(id) {
                if (Ext.isNumeric(id)) {
                    window.location.hash = '#' + id;
                }
            };
        },
        loadStratumPage: function(id, container) {
            var url = Ext.String.format(
                s.widgetUrl,
                id
            );

            Ext.Ajax.request({
                url: url,
                method: 'get',
                cors: true,
                failure: function() {
                    // console.log('faaaaail');
                },
                success: function(resp, o) {
                    var data;

                    pageLoader.sidCorsCallback(resp.responseText, container, id);
                }
            });
        },
        hashChange: function() {
            var hash = window.location.hash;
            if (/^#[1-9][0-9]{3}$/.test(hash)) {
                pageLoader.loadStratumPage(hash.substring(1, 5), s.containerId);
            } else {
                pageLoader.loadStratumPage(s.defaultPageId, s.containerId);
            }
        },
        purgeOrphans: function(aContainer) {
            var cp = Ext.isElement(aContainer)
                ? aContainer
                : aContainer.isComponent ? aContainer.el.dom : aContainer.dom,
                me = this;
            if (cp.children.length > 0) {
                Ext.Array.each(cp.children, function(ce) {
                    var cc;
                    cc = Ext.ComponentManager.get(ce.id);
                    if (cc) {
                        cc.destroy();
                    }
                    //Has to come in this order in order for IE8 to destroy elements correctly
                    if (ce.children.length > 0) {
                        me.purgeOrphans(ce);
                    }
                    if (!cc) {
                        me.purgeElement(ce);
                    }
                });
            }
        },
        purgeElement: function(elem) {
            var co;
            if (elem && elem.id) {
                co = Ext.cache[elem.id];
                if (co) {
                    co.el.destroy();
                }
            }
        }
    };
    pageLoader.init();
})(window, document);
