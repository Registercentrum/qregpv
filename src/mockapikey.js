(function() {
    var oldAjaxRequest = Ext.clone(Ext.Ajax.request);
    // delete Ext.Ajax.request;
    Ext.Ajax.request = function(options) {
        // if (!options.localCall && !(options.scope && options.scope.localCall)) {
            Ext.merge(options, {
                params: {
                    // ContextID: 91479083 //demo
                    // ContextID: 31093 //prod
                    APIKey: 'Hoe8m0raiO4='
                }
            });
            if (options.url.indexOf('stratum') === -1) {
                options.url = '//stratum.registercentrum.se' + options.url;
            }
        // }
        oldAjaxRequest.call(this, options);
    };

}());