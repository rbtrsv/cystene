/**
 * Nudgio Iframe Auto-Resize
 *
 * Listens for postMessage events from Nudgio recommendation iframes
 * and adjusts the iframe height to match the content.
 *
 * The iframe content sends: { type: 'nudgio-resize', height: <number> }
 * We match the source window against all .nudgio-frame iframes on the page.
 *
 * Handles multiple shortcodes/blocks on the same page — each iframe
 * is identified by its contentWindow (e.source), not by ID.
 */
(function() {
    window.addEventListener('message', function(e) {
        if (!e.data || e.data.type !== 'nudgio-resize') {
            return;
        }
        var frames = document.querySelectorAll('.nudgio-frame');
        for (var i = 0; i < frames.length; i++) {
            if (frames[i].contentWindow === e.source) {
                frames[i].style.height = e.data.height + 'px';
                break;
            }
        }
    });
})();
