
/*
 * url schema
 * {
 *      www.example.com: {
 *          type: 'domain' or 'page',
 *          PBR: 1.00,
 *          rememberPage: true,
 *          rememberSite: false,
 *          page: 'www.example.com',
 *          domain: 'www.example.com'
 *      }
 * }
 * 
 * persistent schema
 * {
 *      example-variable: {
 *          value: 'some data'
 *      }
 * }
 * 
 **/


// TODO: set persistent variables onInstalled

var prefs = {
    increment: 0.005,
    default: 1,
    type: 'domain'
};
var update_pref = null;
var update = null;


chrome.runtime.onInstalled.addListener(function (details) {
    chrome.storage.sync.set(
        {
            increment: { value: prefs.increment }
        },
        function () { }
    );

    chrome.storage.sync.set(
        {
            default: { value: prefs.default }
        },
        function () { }
    );
});


var domain = '';
var url = '';

chrome.runtime.onMessage.addListener(
    function (req, send, sendResp) {
        chrome.storage.sync.get(['increment'], function (v) {
            if (!v.increment) {
                prefs.increment = 0.005;

                chrome.storage.sync.set(
                    {
                        increment: { value: prefs.increment }
                    },
                    function () { }
                );
            } else {
                prefs.increment = v.increment.value;
            }

            chrome.storage.sync.get(['default'], function (v) {
                if (!v.default) {
                    prefs.default = 1.00;

                    chrome.storage.sync.set(
                        {
                            default: { value: prefs.default }
                        },
                        function () { }
                    );
                } else {
                    prefs.default = v.default.value;
                }
            });
        });

        if (req.site && req.url) {
            /* returns domain or page PBR */

            chrome.storage.sync.get([req.url], function (value) {

                if (value[req.url]) {
                    req.type = 'page';
                    cb(value, sendResp, req);
                } else {
                    chrome.storage.sync.get([req.site], function (v) {
                        req.type = 'domain';
                        cb(v, sendResp, req);
                    });
                }
            });
        } else {
            // default
            console.log('tr-rt-msg:', req);
        }

        if (req.getPref) {
            sendResp(prefs);
        }

        return true;
    }
);

function cb(value, sendResp, req) {
    console.log('trPref-' + req.site + ':', value);

    var msg = {};
    var key = '';

    msg.type = req.type;

    if (msg.type == 'domain') {
        key = req.site;
        msg.domain = req.site;
    }

    if (msg.type == 'page') {
        key = req.url;
        msg.url = req.url;
    }

    if (value[key]) {
        if (value[key].PBR) {
            msg.PBR = value[key].PBR;
        } else {
            msg.PBR = prefs.default;
        }

        if (value[key].rememberPage || req.type == 'page') {
            msg.rememberPage = true;
        }

        if (value[key].rememberSite || req.type == 'domain') {
            msg.rememberSite = true;
        }
    } else {
        msg.PBR = prefs.default;
        msg.rememberSite = true;
    }

    msg.increment = prefs.increment;
    msg.default = prefs.default;

    sendResp(msg);
}

chrome.runtime.onConnect.addListener(
    function (port) {
        if (port.name == 'update_pref') {
            console.log('popup.js connected!');
            update_pref = port;

            update_pref.onMessage.addListener(
                function (msg) {

                    if (msg.update_pref) {

                        if (msg.hasOwnProperty('old')) {
                            chrome.storage.sync.remove(msg.old, function () {
                                console.log(msg.old, 'removed from storage!');
                            });
                        }

                        if (msg.hasOwnProperty('default')) {
                            chrome.storage.sync.set(
                                {
                                    default: {
                                        value: msg.default
                                    }
                                },
                                function () { }
                            );
                        }

                        if (msg.hasOwnProperty('increment')) {
                            chrome.storage.sync.set(
                                {
                                    increment: {
                                        value: msg.increment
                                    }
                                },
                                function () { }
                            );
                        }

                        var obj = {};
                        obj[msg.key] = msg.update_pref;

                        chrome.storage.sync.set(
                            obj, function () { }
                        );

                        var updateMsg = {
                            update: {}
                        };

                        if (msg.increment) {
                            updateMsg.update.increment = msg.increment;
                        }

                        if (msg.default) {
                            updateMsg.update.default = msg.default;
                        }

                        if (msg.update_pref.type) {
                            updateMsg.update.type = msg.update_pref.type;
                        }

                        if (msg.key) {
                            updateMsg.update.url = msg.key;
                        }

                        if (msg.update_pref.PBR) {
                            updateMsg.update.PBR = msg.update_pref.PBR;
                        }

                        if (msg.old) {
                            updateMsg.update.old = msg.old;
                        } else {
                            updateMsg.update.old = msg.key;
                        }

                        if (msg.update_pref.rememberSite) {
                            updateMsg.update.rememberSite = true;
                        } else {
                            updateMsg.update.rememberPage = true;
                        }

                        update.postMessage(updateMsg);

                        try {
                            update_pref.postMessage({ updateDisp: updateMsg.update });
                        } catch (err) {

                        }
                    } else {
                        // default
                        console.log('tr-port-msg:', msg);
                    }
                }
            );
        }

        if (port.name == 'update') {
            console.log('videoSpeedController.js connected!');
            update = port;

            update.onMessage.addListener(
                function (msg) {
                    
                    if (msg.PBR) {
                        var obj = {};
                        key = '';

                        if (msg.domain) {
                            key = msg.domain;
                            obj[key] = {};
                            obj[key].domain = msg.domain;
                        } else {
                            key = msg.page;
                            obj[key] = {};
                            obj[key].page = msg.page;
                        }

                        obj[key].type = msg.type;

                        if (!isNaN(msg.PBR)) {
                            obj[key].PBR = msg.PBR;
                        }

                        if (msg.rememberSite) {
                            obj[key].rememberSite = true;
                        }

                        if (msg.rememberPage) {
                            obj[key].rememberPage = true;
                        }

                        if (obj[key].PBR) {
                            chrome.storage.sync.set(
                                obj, function () { }
                            );

                            try {
                                update_pref.postMessage({
                                    updateDisp: obj[key]
                                });
                            } catch (err) {

                            }
                        }
                    } else {
                        // default
                        console.log('tr-port-msg:', msg);
                    }
                }
            );
        }

        console.log('adding msg listener to port...');
        port.postMessage({ data: 'port connected!' });
    }
);