// ==UserScript==
// @name         GPE Helper
// @namespace    https://github.com/gncnpk/GPE-Helper
// @version      0.0.1
// @description  Adds quality-of-life features for Google Product Experts.
// @author       Gavin Canon-Phratsachack (https://github.com/gncnpk)
// @match        https://support.google.com/*/thread/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=productexperts.withgoogle.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    function waitForElm(selector, doc) {
        return new Promise(resolve => {
            if (doc.querySelector(selector)) {
                return resolve(doc.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (doc.querySelector(selector)) {
                    observer.disconnect();
                    resolve(doc.querySelector(selector));
                }
            });

            // If you get "parameter 1 is not of type 'Node'" error, see
            // https://stackoverflow.com/a/77855838/492336
            try {
                observer.observe(doc.body, {
                    childList: true,
                    subtree: true
                });
            } catch {
                observer.observe(doc, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    function getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }

    async function init() {
        await waitForElm('.scTailwindSharedRichtexteditoreditor', document);
        prefillResponse();
    }

    function prefillResponse() {
        const timeOfDay = getTimeOfDay();
        const userElem = document.querySelector(
            '.scTailwindThreadPost_headerUserinfoname'
        );
        const username = userElem ? userElem.innerText.trim() : '';

        const editor = document.getElementsByClassName(
            'scTailwindSharedRichtexteditoreditor'
        )[0];

        editor.innerText = `Good ${timeOfDay} ${username},\n\n[Response here]\n\nIf there’s anything else I can assist you with, please let me know!\n\nI’m not affiliated with either Waze or Google; I’m a volunteer product expert providing answers about Google Maps and Waze.`;
    }

    init();
})();
