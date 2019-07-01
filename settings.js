
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


// TODO: get controls
var inc = '';
var dec = '';
var r = '';

var increase = document.getElementById('increase');
var decrease = document.getElementById('decrease');
var reset = document.getElementById('reset');
var save = document.getElementById('save');
var _default = document.getElementById('default');

chrome.storage.sync.get(['keybind'], function (v) {
    inc = v.keybind.increase;
    dec = v.keybind.decrease;
    r = v.keybind.reset;

    increase.setAttribute('placeholder', inc);
    decrease.setAttribute('placeholder', dec);
    reset.setAttribute('placeholder', r);

    save.style.background = 'white';
    save.style.color = 'black';
    save.style.borderColor = 'white';
});

_default.addEventListener('click', function (e) {
    var keys = {
        increase: 'd',
        decrease: 's',
        reset: 'r'
    };

    chrome.storage.sync.set(
        {
            'keybind': keys
        },
        function () {
            increase.setAttribute('placeholder', 'd');
            decrease.setAttribute('placeholder', 's');
            reset.setAttribute('placeholder', 'r');

            chrome.runtime.sendMessage(
                { updateSettings: keys },
                function (resp) { }
            );
        }
    );
});

save.addEventListener('click', function (e) {

    var keys = {
        increase: inc,
        decrease: dec,
        reset: r
    };

    if (increase.value) {
        keys.increase = increase.value;
    }
    if (decrease.value) {
        keys.decrease = decrease.value;
    }
    if (reset.value) {
        keys.reset = reset.value;
    }

    chrome.storage.sync.set(
        {
            'keybind': keys
        },
        function () {
            chrome.runtime.sendMessage(
                { updateSettings: keys },
                function (resp) { }
            );
        }
    );
})


// TODO: add controls to elems as placeholders
// TODO: add listener for save button 
    //   - onClick update content script
    //   - onClick update storage