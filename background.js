console.log('');

chrome.runtime.onMessage.addListener(
    function (req, send, sendResp) {
        var debugObj = [req, send, sendResp];
        console.log('trDebug:', debugObj);

        if (req.site && req.url) {
        /* returns domain or page PBR */

            /*
             * value schema
             * {
             *      www.example.com: {
             *          type: 'domain' or 'page',
             *          updateSite: true,
             *          updatePage: true,
             *          PBR: 1.00
             *      }
             * }
             **/
            chrome.storage.sync.get([req.url], function (value) {

                if (value[req.site]) {
                    cb(value, sendResp, req);
                } else {
                    chrome.storage.sync.get([req.site], function (v) {
                        cb(v, sendResp, req);
                    });
                }
            });
        }

        return true;
    }
);

function cb(value, sendResp, req) {
    console.log('trPBR-' + req.site + ':', value);

    var msg = {};

    if (value[req.site]) {

        if (value[req.site].type) {
            msg.type = value[req.site].type;

            if (msg.type == 'page') {
                msg.url = req.url;
            } else {
                msg.domain = req.site;
            }
        } else {
            msg.type = 'domain';
            msg.domain = req.site;
        }

        msg.PBR = value[req.site].PBR;
    } else {
        msg.type = 'domain';
        msg.domain = req.site;
        msg.PBR = null;
    }

    sendResp(msg);
}

chrome.runtime.onConnect.addListener(
    function (port) {
        console.log('trDebug:', port);

        port.onMessage.addListener(
            function (msg) {
                if (msg.PBR) {
                /* TODO: update site PBR */
                    obj = {};
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
                    obj[key].PBR = msg.PBR;

                    chrome.storage.sync.set(
                        obj, function () { }
                    );
                }
            }
        );
    }
);