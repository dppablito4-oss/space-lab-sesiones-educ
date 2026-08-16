/* Sanitización centralizada para contenido editable y respuestas de IA. */
;(function () {
    'use strict';

    const SESSION_TAGS = new Set([
        'ARTICLE', 'B', 'BLOCKQUOTE', 'BR', 'CAPTION', 'CODE', 'COL', 'COLGROUP',
        'DIV', 'EM', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'H1', 'H2', 'H3',
        'H4', 'H5', 'H6', 'HEADER', 'HR', 'I', 'IMG', 'LI', 'MAIN', 'MARK', 'OL',
        'P', 'PRE', 'SECTION', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP',
        'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL'
    ]);
    const FRAGMENT_TAGS = new Set([
        'B', 'BR', 'CODE', 'EM', 'I', 'LI', 'MARK', 'OL', 'P', 'SMALL',
        'SPAN', 'STRONG', 'SUB', 'SUP', 'U', 'UL'
    ]);
    const DROP_WITH_CONTENT = new Set([
        'BASE', 'EMBED', 'FORM', 'IFRAME', 'LINK', 'META', 'NOSCRIPT',
        'OBJECT', 'SCRIPT', 'STYLE', 'TEMPLATE'
    ]);
    const SAFE_ATTRIBUTES = new Set([
        'alt', 'aria-label', 'class', 'colspan', 'contenteditable', 'data-key',
        'draggable', 'height', 'id', 'role', 'rowspan', 'scope', 'src', 'style',
        'title', 'width'
    ]);
    const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i;

    function isSafeImageUrl(value) {
        const url = String(value || '').trim();
        if (SAFE_DATA_IMAGE.test(url)) return true;
        try {
            const parsed = new URL(url, window.location.href);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    function sanitizeStyle(value) {
        const raw = String(value || '');
        if (/(?:expression\s*\(|javascript\s*:|@import|-moz-binding|behavior\s*:|url\s*\()/i.test(raw)) return '';
        const probe = document.createElement('span');
        probe.style.cssText = raw;
        return probe.style.cssText;
    }

    function sanitizeCssValue(value, fallback) {
        const clean = String(value || '').trim();
        if (!clean || /[<>"'`;{}]|(?:url|expression|javascript)\s*[:(]/i.test(clean)) return fallback;
        return clean.slice(0, 120);
    }

    function cleanNode(node, allowedTags) {
        if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        const tag = node.tagName;
        if (DROP_WITH_CONTENT.has(tag)) return null;
        if (!allowedTags.has(tag)) {
            const fragment = document.createDocumentFragment();
            Array.from(node.childNodes).forEach(child => {
                const clean = cleanNode(child, allowedTags);
                if (clean) fragment.appendChild(clean);
            });
            return fragment;
        }

        const target = document.createElement(tag.toLowerCase());
        Array.from(node.attributes).forEach(attribute => {
            const name = attribute.name.toLowerCase();
            if (name.startsWith('on') || !SAFE_ATTRIBUTES.has(name)) return;
            if (name === 'src') {
                if (tag === 'IMG' && isSafeImageUrl(attribute.value)) target.setAttribute('src', attribute.value);
                return;
            }
            if (name === 'style') {
                const style = sanitizeStyle(attribute.value);
                if (style) target.setAttribute('style', style);
                return;
            }
            if (name === 'contenteditable') {
                target.setAttribute('contenteditable', attribute.value === 'false' ? 'false' : 'true');
                return;
            }
            target.setAttribute(name, attribute.value.slice(0, 500));
        });
        Array.from(node.childNodes).forEach(child => {
            const clean = cleanNode(child, allowedTags);
            if (clean) target.appendChild(clean);
        });
        return target;
    }

    function sanitize(html, allowedTags) {
        const template = document.createElement('template');
        template.innerHTML = String(html || '');
        const output = document.createElement('div');
        Array.from(template.content.childNodes).forEach(node => {
            const clean = cleanNode(node, allowedTags);
            if (clean) output.appendChild(clean);
        });
        return output.innerHTML;
    }

    function sanitizeSessionHTML(html) { return sanitize(html, SESSION_TAGS); }
    function sanitizeFragment(html) { return sanitize(html, FRAGMENT_TAGS); }

    function sanitizeCriteria(html) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = sanitizeFragment(html);
        const items = Array.from(wrapper.querySelectorAll('li'));
        const values = items.length
            ? items.map(item => item.textContent.trim()).filter(Boolean)
            : String(wrapper.textContent || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean);
        return values.slice(0, 5).map(value => {
            const li = document.createElement('li');
            li.textContent = value;
            return li.outerHTML;
        }).join('');
    }

    window.SpaceLabSanitizer = Object.freeze({
        sanitizeCriteria, sanitizeCssValue, sanitizeFragment, sanitizeSessionHTML, sanitizeStyle
    });
})();
