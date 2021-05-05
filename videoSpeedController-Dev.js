alert('hello world');

function addForeach(o) {
    o.forEach = function (cb) {
        var keys = Object.keys(this)

        if (keys.length) {
            for (i = 0; i < keys.length; i++) {
                cb(this[keys[i]]);
            }
        }
    }
}

console.log('tr-location:', document.location.href);

/*
* value schema
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
**/

var vids = document.getElementsByTagName('video');
var auds = document.getElementsByTagName('audio');
var currentPBR = 1;
var increment = 0.005;
var PBR_width = 10;
var _default = 1;
var __vid = vids[0];
var __aud = auds[0];
var _type = 'domain';
var url = document.location.href;

//controls
var inc = 'd';
var dec = 's';
var reset = 'r';

// TODO: debug
chrome.runtime.sendMessage(
    {
        getControls: true
    },
    function (resp) {
        try {
            inc = resp.increase;
            dec = resp.decrease;
            reset = resp.reset;
        } catch (err) { }
    }
);

var _main = new main;


chrome.runtime.sendMessage(
    {
        site: document.location.hostname,
        url: document.location.href
    },
    function (resp) {
        if (resp.PBR) {
            currentPBR = resp.PBR;
            increment = resp.increment;
            _default = resp.default;

            coll = [vids, auds];

            coll.forEach(function (c) {
                addForeach(c);

                c.forEach(function (elem) {
                    if (elem.playbackRate != _default) {
                        elem.playbackRate = _default;
                    }
                });
            });

            _main.setPBRs([vids, auds], currentPBR);
            console.log('trPBR for ' + resp.domain + ':', currentPBR);
        }

        if (resp.type == 'page') {
            _type = 'page';
        } else {
            _type = 'domain';
        }
    }
);


chrome.runtime.onMessage.addListener(
    function (req, send, sendResp) {
        console.log('tr-rt-msg:', req);

        if (req.update_PBR) {

            currentPBR = req.update_PBR;
            var resp = {
                update_status: 'done'
            };
            console.log('tr-rt-resp:', resp);
            sendResp(resp);
            return;
        }

        var resp = {
            site: document.location.hostname,
            url: document.location.href,
            PBR: currentPBR,
            type: _type
        };

        if (req.getPBR && req.url == document.location.href) {
            console.log('tr-rt-resp:', resp);
            sendResp(resp);
            return;
        }
    }
);



var port = chrome.runtime.connect(
    {
        name: "update"
    }
);

port.onMessage.addListener(
    function (msg) {
        console.log('update-msg:', msg);

        if (msg.update) {
            var valid = false;

            if (msg.update.url.includes(url)) {
                valid = true;
            }

            if (msg.update.old.includes(url)) {
                valid = true;
            }

            if (valid) {
                if (msg.update.increment) {
                    increment = msg.update.increment;
                }

                if (msg.update.default) {
                    _default = msg.update.default;
                }

                if (msg.update.type) {
                    _type = msg.update.type;
                }

                if (msg.update.PBR) {
                    currentPBR = msg.update.PBR;
                    _main.setPBRs(vids, currentPBR);
                }
            }
        }

        // TODO: debug
        if (msg.updateC) {
            inc = msg.updateC.increase;
            dec = msg.updateC.decrease;
            reset = msg.updateC.reset;
        }
    }
);


function main() {
    if (vids.length > 0 || auds.length > 0) {
        if (vids.length > 0) {
            console.log('aMgine-x says: "Hello Friend!"');
            console.log('tr-video-coll:', vids);
        }

        if (auds.length > 0) {
            console.log('aMgine-x says: "Hello Friend!"');
            console.log('tr-audio-coll:', auds);
        }
    }

    this.inc = function inc() {
        pbr = parseFloat((parseFloat(currentPBR) + parseFloat(increment)).toFixed(PBR_width));
        this.setPBRs([vids, auds], pbr);
        currentPBR = pbr;
    };

    this.dec = function dec() {
        pbr = parseFloat((parseFloat(currentPBR) - parseFloat(increment)).toFixed(PBR_width));
        this.setPBRs([vids, auds], pbr);
        currentPBR = pbr;
    };

    this.setPBRs = function setPBRs(colls, PBR) {
        colls.forEach(function (coll) {
            addForeach(coll);

            coll.forEach(function (elem) {
                try {
                    elem.playbackRate = PBR;
                    currentPBR = PBR;
                } catch (err) { }
            });
        });
    };

    this.controls = [
        inc, dec, reset
    ];

    document.addEventListener(
        'keydown',
        function (e) {
            e.key = String(e.key).toLowerCase;

            _main.controls.forEach(function (k) {
                if (e.key == k) {
                    _main.setPBRs([vids, auds], currentPBR);
                }
            });

            if (e.key == inc) {
                _main.inc();
            }

            if (e.key == dec) {
                _main.dec();
            }

            if (e.key == reset) {
                _main.setPBRs([vids, auds], _default);
                currentPBR = _default;
            }


            console.log('tr-currentPBR:', currentPBR);


            var msg = {
                PBR: currentPBR
            };

            msg.type = _type;

            if (msg.type == 'domain') {
                msg.domain = document.location.hostname;
                msg.rememberSite = true;
            } else {
                msg.page = document.location.href;
                msg.rememberPage = true;
            }

            try {
                port.postMessage(msg);
            } catch (err) {

            }
        }
    );
}
