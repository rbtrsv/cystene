/**
 * Nudgio Admin Settings Page JavaScript
 *
 * Handles "Test Connection" and "Sync Data" AJAX buttons on the
 * Settings → Nudgio Technologies admin page.
 *
 * Dynamic data (nonces, i18n strings, ajaxurl) is passed via
 * wp_localize_script() as the global `nudgioAdmin` object.
 */
(function() {

    // ==========================================
    // Test Connection
    // ==========================================

    var testBtn = document.getElementById('nudgio-test-connection');
    var testResult = document.getElementById('nudgio-test-result');

    if (testBtn) {
        testBtn.addEventListener('click', function() {
            testBtn.disabled = true;
            testBtn.textContent = nudgioAdmin.i18n.testing;
            testResult.textContent = '';
            testResult.style.color = '';

            var data = new FormData();
            data.append('action', 'nudgio_test_connection');
            data.append('nonce', nudgioAdmin.testNonce);

            fetch(nudgioAdmin.ajaxurl, {
                method: 'POST',
                body: data,
                credentials: 'same-origin',
            })
            .then(function(response) { return response.json(); })
            .then(function(json) {
                if (json.success) {
                    testResult.textContent = json.data;
                    testResult.style.color = '#00a32a';
                } else {
                    testResult.textContent = json.data;
                    testResult.style.color = '#d63638';
                }
            })
            .catch(function() {
                testResult.textContent = nudgioAdmin.i18n.requestFailed;
                testResult.style.color = '#d63638';
            })
            .finally(function() {
                testBtn.disabled = false;
                testBtn.textContent = nudgioAdmin.i18n.testConnection;
            });
        });
    }

    // ==========================================
    // Sync Data
    // ==========================================

    var syncBtn = document.getElementById('nudgio-sync-data');
    var syncResult = document.getElementById('nudgio-sync-result');

    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            syncBtn.disabled = true;
            syncBtn.textContent = nudgioAdmin.i18n.syncing;
            syncResult.textContent = '';
            syncResult.style.color = '';

            var data = new FormData();
            data.append('action', 'nudgio_sync_data');
            data.append('nonce', nudgioAdmin.syncNonce);

            fetch(nudgioAdmin.ajaxurl, {
                method: 'POST',
                body: data,
                credentials: 'same-origin',
            })
            .then(function(response) { return response.json(); })
            .then(function(json) {
                if (json.success) {
                    syncResult.textContent = json.data;
                    syncResult.style.color = '#00a32a';
                } else {
                    syncResult.textContent = json.data;
                    syncResult.style.color = '#d63638';
                }
            })
            .catch(function() {
                syncResult.textContent = nudgioAdmin.i18n.requestFailed;
                syncResult.style.color = '#d63638';
            })
            .finally(function() {
                syncBtn.disabled = false;
                syncBtn.textContent = nudgioAdmin.i18n.syncData;
            });
        });
    }

})();
