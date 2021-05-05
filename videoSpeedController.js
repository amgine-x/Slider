alert('hello world!');

function addForeach(o) {
    o.foreach = function (cb) {
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
var _type = 'domain';
var url = document.location.href;

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

            if (__vid) {
                if (__vid.playbackRate != _default) {
                    __vid.playbackRate = _default;
                }
            }

            _main.setPBRs(vids, currentPBR);
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
        console.log('tr-rt-resp:', resp);
        sendResp(resp);
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
    }
);


function main() {
    document.body.click();


    if (vids.length > 0) {
        console.log('aMgine-x says: "Hello Friend!"');
        console.log('tr-video-coll:', vids);
    }

    this.d = function d() {
        pbr = parseFloat((parseFloat(currentPBR) + parseFloat(increment)).toFixed(PBR_width));
        this.setPBRs(vids, pbr);
        currentPBR = pbr;
    };

    this.s = function s() {
        pbr = parseFloat((parseFloat(currentPBR) - parseFloat(increment)).toFixed(PBR_width));
        this.setPBRs(vids, pbr);
        currentPBR = pbr;
    };

    this.setPBRs = function setPBRs(coll, PBR) {
        addForeach(coll);

        coll.foreach(function (vid) {
            vid.playbackRate = PBR;
            currentPBR = PBR;
        });
    };

    document.addEventListener(
        'keydown',
        function (e) {
            e.key = String(e.key).toLowerCase;

            if (e.key == 'd') {
                _main.setPBRs(vids, currentPBR);
                _main.d();
            }

            if (e.key == 's') {
                _main.setPBRs(vids, currentPBR);
                _main.s();
            }

            if (e.key == 'r') {
                _main.setPBRs(vids, currentPBR);
                _main.setPBRs(vids, _default);
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
