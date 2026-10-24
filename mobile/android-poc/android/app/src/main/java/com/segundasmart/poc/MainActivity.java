package com.segundasmart.poc;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CookieManager.getInstance().setAcceptThirdPartyCookies(bridge.getWebView(), false);
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                Uri origin = Uri.parse(bridge.getServerUrl());
                boolean sameOrigin = "https".equals(target.getScheme())
                    && origin.getHost().equals(target.getHost())
                    && port(origin) == port(target)
                    && target.getUserInfo() == null;
                if (sameOrigin) return super.shouldOverrideUrlLoading(view, request);
                // Never load external documents or arbitrary intent/data URLs in
                // the bridge-enabled WebView. Sharing HTTPS links uses a browser.
                if (request.isForMainFrame() && "https".equals(target.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, target).addCategory(Intent.CATEGORY_BROWSABLE));
                    } catch (ActivityNotFoundException ignored) {
                        // A device without a browser stays on the current page.
                    }
                }
                return true;
            }
        });
    }

    private static int port(Uri uri) {
        return uri.getPort() == -1 ? 443 : uri.getPort();
    }

    @Override
    public void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }
}
