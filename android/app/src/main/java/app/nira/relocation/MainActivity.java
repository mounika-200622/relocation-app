package app.nira.relocation;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** How long the first page may take before the bundled "can't connect" page is shown. */
    private static final long FIRST_LOAD_TIMEOUT_MS = 15_000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // On mobile data a laptop's Wi-Fi address (192.168.x.x) is silently dropped: the WebView
        // never receives an error, so Capacitor's errorPath never fires and the screen stays blank.
        // If the first page still hasn't finished loading after the timeout, show offline.html.
        new Handler(Looper.getMainLooper()).postDelayed(this::showErrorPageIfStuck, FIRST_LOAD_TIMEOUT_MS);
    }

    private void showErrorPageIfStuck() {
        if (bridge == null || isFinishing()) return;
        WebView webView = bridge.getWebView();
        String errorUrl = bridge.getErrorUrl();
        if (webView == null || errorUrl == null) return;
        String current = webView.getUrl();
        if (errorUrl.equals(current)) return;
        if (webView.getProgress() < 100) {
            webView.stopLoading();
            webView.loadUrl(errorUrl);
        }
    }
}
