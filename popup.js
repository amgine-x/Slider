
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



console.log('getting popup elements...');

var popupElem = {
    currentPBR: document.getElementById('currentPBR'),
    increment: document.getElementById('increment'),
    default: document.getElementById('default'),
    rememberPage: document.getElementById('rememberPage'),
    rememberSite: document.getElementById('rememberSite'),
    update: document.getElementById('update')
};

console.log('popup-elems:', popupElem);

console.log('connect to extension...');

var port = chrome.runtime.connect(
    { name: 'update_pref' }
);

console.log('port:', port);

port.onMessage.addListener(
    function (msg) {
        console.log('port-msg:', msg);
    }
);

var currentTab = null;
var currentPBR = 1;

console.log('getting currently active tab(s)...');

chrome.tabs.query(
    { active: true, currentWindow: true },
    function (tabs) {

        console.log('tabs:', tabs);

        currentTab = tabs[0];

        addForeach(tabs);

        this.debug = tabs;
        console.log('debug:', tabs);

        tabs.foreach(
            function (t) {
                try {
                    chrome.tabs.sendMessage(
                        t.id, { getPBR: true },
                        function (resp) {
                            console.log('tab-msg:', resp.PBR);

                            currentPBR = resp.PBR;

                            popupElem.currentPBR.setAttribute('placeholder', String(currentPBR));
                        }
                    );
                } catch (err) {
                    console.error(err);
                }
            }
        );

        popupElem.update.addEventListener('click', function (e) {
            var prefs = {
                increment: popupElem.increment.value,
                default: popupElem.default.value
            };

            if (popupElem.rememberPage.checked) {
                prefs[rememberPage] = true;
            }

            if (popupElem.rememberSite.checked) {
                prefs[rememberSite] = true;
            }

            port.postMessage({
                updatePrefs: prefs
            });

            var elemPBR = parseFloat(popupElem.currentPBR).toFixed(5);
            
            if (elemPBR != currentPBR) {
                try {
                    chrome.tabs.sendMessage(
                        currentTab.id, { update_PBR: elemPBR },
                        function (resp) {
                            console.log('tab-msg:', resp);
                        }
                    );
                } catch (err) {
                    console.error(err);
                }
            }

            currentPBR = elemPBR;
        });
    }
);