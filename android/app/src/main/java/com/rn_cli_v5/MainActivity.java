package com.rn_cli_v5;
/**PATCH*/
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import android.content.Intent;
import android.os.Bundle;
import com.amazonaws.amplify.pushnotification.modules.RNPushNotificationJsDelivery;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "rn_cli_v5";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
   * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
   * (Paper).
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new MainActivityDelegate(this, getMainComponentName());
  }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
      return reactRootView;
    }

    @Override
    protected boolean isConcurrentRootEnabled() {
      // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
      // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }
  }

  /**
   * React navigation - https://reactnavigation.org/docs/getting-started/
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
    // handles cold starts
    handleNotificationOnIntent(getIntent());
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);

    setIntent(intent);

    // handles warm starts
    handleNotificationOnIntent(intent);
  }

  private void handleNotificationOnIntent(Intent intent) {
    if (intent == null) {
      return;
    }
    Bundle notification = intent.getBundleExtra("notification");
    if (notification != null) {
      // send the message to device emitter
      // Construct and load our normal React JS code bundle
      ReactApplication applicationContext = (ReactApplication) getApplicationContext();
      ReactInstanceManager mReactInstanceManager = applicationContext.getReactNativeHost().getReactInstanceManager();
      ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
      if (reactContext != null) {
        RNPushNotificationJsDelivery jsDelivery =
                new RNPushNotificationJsDelivery((ReactApplicationContext)reactContext);
        jsDelivery.emitNotificationOpened(notification);
      }
    }
  }
}