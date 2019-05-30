
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

console.log('getting popup elements...');

var popupElem = {
    currentPBR: document.getElementById('currentPBR'),
    increment: document.getElementById('increment'),
    default: document.getElementById('default'),
    rememberPage: document.getElementById('rememberPage'),
    rememberSite: document.getElementById('rememberSite'),
    update: document.getElementById('update'),
    reset: document.getElementById('reset')
};

console.log('popup-elements:', popupElem);

var currentTab = null;
var currentPBR = 1;
var domain = '';
var url = '';
var _type = 'domain';
var increment = 0;
var _default = 1;


console.log('connect to extension...');

var port = chrome.runtime.connect(
    { name: 'update_pref' }
);

console.log('port:', port);

port.onMessage.addListener(
    function (msg) {

        if (msg.updateDisp) {
            currentPBR = msg.updateDisp.PBR;

            if (popupElem.currentPBR.value) {
                popupElem.currentPBR.value = null;
            }

            popupElem.currentPBR.setAttribute('placeholder', String(currentPBR));



            if (msg.updateDisp.increment) {
                increment = msg.updateDisp.increment;

                popupElem.increment.value = null;
                popupElem.increment.setAttribute('placeholder', String(increment));
            }

            if (msg.updateDisp.default) {
                _default = msg.updateDisp.default;

                popupElem.default.value = null;
                popupElem.default.setAttribute('placeholder', String(_default));
            }

            if (msg.updateDisp.rememberSite) {
                popupElem.rememberPage.checked = false;
                popupElem.rememberSite.checked = true;
            }

            if (msg.updateDisp.rememberPage) {
                popupElem.rememberPage.checked = true;
                popupElem.rememberSite.checked = false;
            }
        }

        console.log('port-msg:', msg);
    }
);



console.log('setting initial prefs...');

chrome.runtime.sendMessage({ getPref: true }, function (resp) {
    console.log('getPref-resp:', resp);

    increment = resp.increment;
    _default = resp.default;

    if (_default == 1) {
        popupElem.default.setAttribute('placeholder', '1.00');
    } else {
        popupElem.default.setAttribute('placeholder', String(_default));
    }

    if (increment == 1) {
        popupElem.increment.setAttribute('placeholder', '1.00');
    } else {
        popupElem.increment.setAttribute('placeholder', String(increment));
    }

    popupElem.rememberPage.addEventListener('click', function (e) {
        var target = popupElem.rememberSite;

        if (e.target.checked) {
            target.checked = false;
        } else {
            target.checked = true;
        }
    });

    popupElem.rememberSite.addEventListener('click', function (e) {
        var target = popupElem.rememberPage;

        if (e.target.checked) {
            target.checked = false;
        } else {
            target.checked = true;
        }
    });



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
                                console.log('tab-msg:', resp);

                                currentPBR = resp.PBR;
                                _type = resp.type;

                                popupElem.currentPBR.setAttribute('placeholder', String(currentPBR));

                                if (_type == 'page') {
                                    popupElem.rememberPage.click();
                                    popupElem.rememberPage.checked = true;
                                } else {
                                    popupElem.rememberSite.click();
                                    popupElem.rememberSite.checked = true;
                                }
                                console.log('rememberPage:', popupElem.rememberPage.checked);
                                console.log('rememberSite:', popupElem.rememberSite.checked);

                                domain = resp.site;
                                url = resp.url;

                                popupElem.update.style.background = 'white';
                                popupElem.update.style.color = 'black';
                                popupElem.update.style.borderColor = 'white';

                                /* add event listeners */
                                popupElem.update.addEventListener('click', function (e) {
                                    var prefs = {};

                                    if (popupElem.currentPBR.value) {
                                        prefs.PBR = Number(
                                            parseFloat(popupElem.currentPBR.value).toFixed(5)
                                        );
                                    } else {
                                        prefs.PBR = currentPBR;
                                    }

                                    if (popupElem.rememberPage.checked) {
                                        prefs.rememberPage = true;
                                    }

                                    if (popupElem.rememberSite.checked) {
                                        prefs.rememberSite = true;
                                    }

                                    if (Object.keys(prefs).length) {
                                        var obj = {};
                                        obj.update_pref = prefs;
                                        /* var key = '';
                                        var type = ''; */

                                        if (popupElem.rememberPage.checked) {
                                            obj.key = url;
                                            obj.update_pref.type = 'page';
                                            obj.update_pref.page = url;
                                        } else {
                                            obj.key = domain;
                                            obj.old = url;
                                            obj.update_pref.type = 'domain';
                                            obj.update_pref.domain = domain;
                                        }

                                        if (popupElem.increment.value) {
                                            obj.increment = Number(
                                                parseFloat(popupElem.increment.value).toFixed(5)
                                            );
                                        } else {
                                            obj.increment = increment;
                                        }

                                        if (popupElem.default.value) {
                                            obj.default = Number(
                                                parseFloat(popupElem.default.value).toFixed(5)
                                            );
                                        } else {
                                            obj.default = _default;
                                        }

                                        console.log('update_pref:', obj);
                                        port.postMessage(obj);
                                    }

                                    var pref_PBR = Number(
                                        parseFloat(popupElem.currentPBR.value).toFixed(5)
                                    );

                                    if (pref_PBR != currentPBR) {
                                        try {
                                            console.log('update_PBR:', pref_PBR);
                                            chrome.tabs.sendMessage(
                                                currentTab.id, { update_PBR: pref_PBR },
                                                function (resp) {
                                                    console.log('tab-msg:', resp);
                                                }
                                            );
                                        } catch (err) {
                                            console.log(err);
                                        }

                                        currentPBR = pref_PBR;
                                    }
                                });

                                popupElem.reset.addEventListener('click', function (e) {
                                    obj = {
                                        key: domain,
                                        old: url,
                                        increment: 0.005,
                                        default: 1,
                                        update_pref: {
                                            PBR: 1,
                                            rememberSite: true,
                                            type: 'domain',
                                            domain: domain
                                        }
                                    }
                                    port.postMessage(obj);
                                });
                            }
                        );
                    } catch (err) {
                        console.log(err);
                    }
                }
            );
        }
    );
});