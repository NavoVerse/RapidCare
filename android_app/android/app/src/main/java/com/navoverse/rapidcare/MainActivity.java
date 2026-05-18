package com.navoverse.rapidcare;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SwipeRefreshLayout swipeRefreshLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Find the WebView and set up SwipeRefreshLayout
        WebView webView = bridge.getWebView();
        if (webView != null && webView.getParent() != null) {
            // Check if we already added it to avoid duplicates
            if (!(webView.getParent() instanceof SwipeRefreshLayout)) {
                swipeRefreshLayout = new SwipeRefreshLayout(this);
                android.view.ViewGroup parent = (android.view.ViewGroup) webView.getParent();
                int index = parent.indexOfChild(webView);
                parent.removeView(webView);
                swipeRefreshLayout.addView(webView, new android.view.ViewGroup.LayoutParams(
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT));
                parent.addView(swipeRefreshLayout, index);

                swipeRefreshLayout.setOnRefreshListener(() -> {
                    webView.reload();
                });

                // Disable swipe refresh when not at the top
                webView.getViewTreeObserver().addOnScrollChangedListener(() -> {
                    swipeRefreshLayout.setEnabled(webView.getScrollY() == 0);
                });
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (swipeRefreshLayout != null) {
            // Stop the spinning animation if it was running
            swipeRefreshLayout.setRefreshing(false);
        }
    }
}
