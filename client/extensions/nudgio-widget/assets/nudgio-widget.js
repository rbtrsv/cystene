/**
 * Nudgio Widget — Iframe Auto-Resize
 *
 * Listens for iframe load events and auto-resizes the iframe height
 * to fit content. Works because the App Proxy returns content on the
 * merchant's domain (same-origin), so we can access contentDocument.
 */
(function () {
  "use strict";

  /**
   * Resize iframe to match its content height.
   * Falls back gracefully if cross-origin restrictions apply.
   */
  function resizeIframe(iframe) {
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc && doc.body) {
        var height = doc.body.scrollHeight;
        if (height > 0) {
          iframe.style.height = height + "px";
        }
      }
    } catch {
      // Cross-origin — cannot access contentDocument, keep min-height fallback
    }
  }

  /**
   * Attach load listener to all Nudgio widget iframes.
   * Uses MutationObserver to handle dynamically inserted iframes.
   */
  function initWidgets() {
    var iframes = document.querySelectorAll(
      ".nudgio-recommendations iframe"
    );
    iframes.forEach(function (iframe) {
      if (iframe.dataset.nudgioInit) return;
      iframe.dataset.nudgioInit = "true";

      iframe.addEventListener("load", function () {
        resizeIframe(iframe);

        // Re-check height after images load inside the widget
        try {
          var doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc) {
            var images = doc.querySelectorAll("img");
            images.forEach(function (img) {
              img.addEventListener("load", function () {
                resizeIframe(iframe);
              });
            });
          }
        } catch {
          // Cross-origin fallback
        }

        // Delayed fallback — catches Tailwind CDN late processing
        setTimeout(function () { resizeIframe(iframe); }, 500);
        setTimeout(function () { resizeIframe(iframe); }, 1500);
      });

      // If already loaded (cached), resize immediately
      if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
        resizeIframe(iframe);
      }
    });
  }

  // Run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidgets);
  } else {
    initWidgets();
  }

  // Observe for dynamically added widgets (e.g., Shopify sections rendering)
  var observer = new MutationObserver(function () {
    initWidgets();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for postMessage from iframe content (fallback for cross-origin + additional strategy)
  // Backend HTML sends nudgio-resize messages with content height
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "nudgio-resize" && e.data.height > 0) {
      var iframes = document.querySelectorAll(".nudgio-recommendations iframe");
      iframes.forEach(function (iframe) {
        try {
          if (iframe.contentWindow === e.source) {
            iframe.style.height = e.data.height + "px";
          }
        } catch {
          // Cross-origin — cannot compare contentWindow
        }
      });
    }
  });
})();
