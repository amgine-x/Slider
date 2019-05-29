
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
 * TODO: add documentation
 * 
 * */

var vids = document.getElementsByTagName('video');
var currentPBR = 1;
var __vid = vids[0];
var updateSite = false;
var updatePage = false;

main = new main;

chrome.runtime.onMessage.addListener(
    function (req, send, sendResp) {
        console.log(req);
        sendResp(
            // TODO: constraints for message type
            {
                site: document.location.hostname,
                url: document.location.href
            }
        );
    }
);

chrome.runtime.sendMessage(
    {
        site: document.location.hostname,
        url: document.location.href
    },
    function (resp) {
        if (resp.PBR) {
            currentPBR = resp.PBR;
            /* TODO: debug */
            main.setPBRs(vids, currentPBR);
            console.log('trPBR for ' + resp.domain + ':', resp.PBR);
        }

        if (resp.type == 'domain') {
            updateSite = true;
        }

        if (resp.type == 'page') {
            updatePage = true;
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
    /* TODO */
        console.log(msg);
    }
);

function main() {
    document.body.click();

    if (vids.length > 0) {
        console.log('aMgine-x says: "Hello Friend!"');
        console.log('tr-video-coll:', vids);
    }

    this.d = function d() {
        pbr = parseFloat((parseFloat(currentPBR) + parseFloat(0.005)).toFixed(5))
        this.setPBRs(vids, pbr);
        currentPBR = pbr;
    };

    this. s = function s() {
        pbr = parseFloat((parseFloat(currentPBR) - parseFloat(0.005)).toFixed(5))
        this.setPBRs(vids, pbr);
        currentPBR = pbr;
    };

    this.setPBRs = function setPBRs(coll, PBR) {
        addForeach(coll);

        coll.foreach(function (vid) {
            vid.playbackRate = PBR;
        });
    };

    document.addEventListener(
        'keydown',
        function (e) {
            /*maintenance*/
            e.key = String(e.key).toLowerCase;

            if (e.key == 'd') {
                main.setPBRs(vids, currentPBR);
                main.d();
            }

            if (e.key == 's') {
                main.setPBRs(vids, currentPBR);
                main.s();
            }

            if (e.key == 'r') {
                main.setPBRs(vids, currentPBR);
                main.setPBRs(vids, 1);
                currentPBR = 1;
            }

            console.log('tr-currentPBR:', currentPBR);

            if (updateSite || updatePage) {
                var msg = {
                    PBR: currentPBR
                };

                if (updateSite) {
                    msg.type = 'domain';
                    msg.domain = document.location.hostname;
                } else {
                    msg.type = 'page';
                    msg.page = document.location.href;
                }

                port.postMessage(msg);
            }
        }
    );
}