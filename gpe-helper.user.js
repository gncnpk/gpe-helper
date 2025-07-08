// ==UserScript==
// @name         GPE Helper
// @namespace    https://github.com/gncnpk/GPE-Helper
// @version      0.0.2
// @description  Adds quality-of-life features for Google Product Experts.
// @author       Gavin Canon-Phratsachack (https://github.com/gncnpk)
// @match        https://support.google.com/*/thread/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=productexperts.withgoogle.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let templateResponses = {
        "Find Navigation History": `If you want more detailed information such as times/start/end locations, you can find it in your navigation history:\n\n1. In Waze, tap on the top left corner with the three lines (looks like a hamburger)\n2. Tap on Settings\n3. Scroll down to Privacy\n4. Under the Activity section, tap on "Navigation history"\n`,
        "Allow Auto Dim": `If you want the screen to turn off automatically, you can enable auto-locking/dimming of the screen:\n\n1. In the Waze app, tap on the three lines in the top left corner\n2. Tap on Settings\n3. Tap on General\n4. Uncheck "Prevent auto-lock"\n`
    };

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

    function createTemplatePanel() {
        const panel = document.createElement('div');
        panel.id = 'gpe-template-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 300px;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            font-size: 14px;
            color: #333;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>GPE Helper</span>
            <span id="gpe-toggle-arrow" style="font-size: 12px; transition: transform 0.2s;">▼</span>
        `;

        const content = document.createElement('div');
        content.id = 'gpe-template-content';
        content.style.cssText = `
            padding: 8px;
            display: block;
        `;

        // Create buttons for each template
        Object.keys(templateResponses).forEach(templateName => {
            const button = document.createElement('button');
            button.textContent = templateName;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 8px 12px;
                margin: 4px 0;
                background: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#3367d6';
            });

            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#4285f4';
            });

            button.addEventListener('click', () => {
                appendTemplateToEditor(templateResponses[templateName]);
            });

            content.appendChild(button);
        });

        // Add toggle functionality
        let isCollapsed = false;
        header.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            content.style.display = isCollapsed ? 'none' : 'block';
            document.getElementById('gpe-toggle-arrow').style.transform =
                isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        });

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
    }

    function textToHtml(text) {
        // Convert plain text with \n to HTML with <br> tags
        return text.split('\n').map(line => {
            if (line.trim() === '') {
                return '<br>';
            }
            return line;
        }).join('<br>');
    }

    function insertHtmlAtCursor(element, htmlText) {
        const selection = window.getSelection();

        // If no selection or selection is not in our editor, append at end
        if (!selection.rangeCount || !element.contains(selection.anchorNode)) {
            element.focus();
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        const range = selection.getRangeAt(0);

        // Delete any selected content first
        range.deleteContents();

        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;

        // Collect all nodes first to preserve order
        const nodes = Array.from(tempDiv.childNodes);

        // Insert nodes in correct order
        nodes.forEach(node => {
            range.insertNode(node);
            range.setStartAfter(node);
        });

        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function needsSpacingBefore(editor) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;

        const range = selection.getRangeAt(0);
        const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || '';

        // Check if we need spacing (content exists and doesn't end with whitespace)
        return textBefore.trim() && !textBefore.match(/\s{2,}$/);
    }

    function appendTemplateToEditor(templateText) {
        const editor = document.getElementsByClassName(
            'scTailwindSharedRichtexteditoreditor'
        )[0];

        if (editor) {
            // Focus the editor first
            editor.focus();

            // Convert template text to HTML
            let htmlToInsert = textToHtml(templateText);

            // Add spacing before template if needed
            if (needsSpacingBefore(editor)) {
                htmlToInsert = '<br><br>' + htmlToInsert;
            }

            insertHtmlAtCursor(editor, htmlToInsert);

            // Trigger input event to ensure the content is recognized
            const event = new Event('input', { bubbles: true });
            editor.dispatchEvent(event);
        }
    }

    async function init() {
        await waitForElm('.scTailwindSharedRichtexteditoreditor', document);
        prefillResponse();
        createTemplatePanel();
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

        editor.innerText = `Good ${timeOfDay} ${username},\n\n[Response here]\n\nIf there's anything else I can assist you with, please let me know!\n\nI'm not affiliated with either Waze or Google; I'm a volunteer product expert providing answers about Google Maps and Waze.`;
    }

    init();
})();
