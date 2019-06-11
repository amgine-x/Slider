
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


var port = chrome.runtime.connect(
    { name: 'update_pref' }
);

port.onMessage.addListener(
    function (msg) {
        console.log(msg);
    }
);

function main() {
    currentTab = null;

    chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
            currentTab = tabs[0];

            console.log(tabs);

            tabs.foreach(
                function (t) {
                    chrome.tabs.sendMessage(
                        t.id, { data: tabs },
                        function (resp) {
                            console.log(resp);
                        }
                    );
                }
            );

            /* TODO: debug */
            port.postMessage(tabs);
        }
    );

    currentPBR = document.getElementById('currentPBR');
    increment = document.getElementById('increment');
    rememberPage = document.getElementById('rememberPage');
    rememberSite = document.getElementById('rememberSite');
    update = document.getElementById('update');

    /* if (currentPBR) {
        port.postMessage(
            {
                TODO: 'get document url'
            }
        );
    } */
}