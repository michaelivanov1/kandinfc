//import UIKit
//import React
//import React_RCTAppDelegate
//import ReactAppDependencyProvider
//
//@main
//class AppDelegate: UIResponder, UIApplicationDelegate {
//  var window: UIWindow?
//
//  var reactNativeDelegate: ReactNativeDelegate?
//  var reactNativeFactory: RCTReactNativeFactory?
//
//  func application(
//    _ application: UIApplication,
//    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
//  ) -> Bool {
//
//    // check if GoogleService-Info.plist is bundled
//    if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") {
//      print("✅ GoogleService-Info.plist found at: \(path)")
//    } else {
//      print("❌ GoogleService-Info.plist NOT found!")
//    }
//
//    let delegate = ReactNativeDelegate()
//    let factory = RCTReactNativeFactory(delegate: delegate)
//    delegate.dependencyProvider = RCTAppDependencyProvider()
//
//    reactNativeDelegate = delegate
//    reactNativeFactory = factory
//
//    window = UIWindow(frame: UIScreen.main.bounds)
//
//    factory.startReactNative(
//      withModuleName: "kandinfc",
//      in: window,
//      launchOptions: launchOptions
//    )
//
//    return true
//  }
//}
//
//class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
//  override func sourceURL(for bridge: RCTBridge) -> URL? {
//    self.bundleURL()
//  }
//
//  override func bundleURL() -> URL? {
//#if DEBUG
//    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
//#else
//    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
//#endif
//  }
//}
//


import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore // ✅ Add Firebase import

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // check if GoogleService-Info.plist is bundled
    if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") {
      print("✅ GoogleService-Info.plist found at: \(path)")
    } else {
      print("❌ GoogleService-Info.plist NOT found!")
    }

    // ✅ Initialize Firebase
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
      print("✅ Firebase initialized in Swift")
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "kandinfc",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
