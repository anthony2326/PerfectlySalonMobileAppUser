import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Animated, StyleSheet, View, Easing, ActivityIndicator, BackHandler, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { UserProvider } from "./screens/user context/UserContext";
import LoginScreen from "./screens/login/LoginScreen";
import SignupScreen from "./screens/signup/SignupScreen";
import ForgotPasswordScreen from "./screens/login/ForgotPasswordScreen";
import DashboardScreen from "./screens/dashboard/DashboardScreen";
import ServicesScreen from "./screens/services/ServicesScreen";
import ServiceBookingScreen from "./screens/services/ServiceBookingScreen";
import NotificationScreen from "./screens/notif/NotificationScreen";
import AnnouncementsScreen from "./screens/notif/AnnoucementsScreen";
import TermsConditionsScreen from "./screens/terms/TermsConditionsScreen";
import BookingStatusScreen from "./booking/BookingStatusScreen";
import AccountScreen from "./screens/account/AccountScreen";
import SplashScreen from "./screens/initialization/SplashScreen";
import EditProfileScreen from "./screens/account/EditProfileScreen";
import ChangePasswordScreen from "./screens/account/ChangePasswordScreen";

const GRADIENT_COLORS = ["#c85878", "#d96b8c", "#c85878"];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };
const MIN_SPLASH_TIME = 2000;

function AppContent() {
  const [navigationStack, setNavigationStack] = useState([{ screen: "login", params: {} }]);
  const [userData, setUserData] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    "LobsterTwo-Italic": require("./assets/fonts/LobsterTwo-Italic.ttf"),
    "Poppins-SemiBold": require("./assets/fonts/Poppins-SemiBold.ttf"),
    "Inter-Variable": require("./assets/fonts/Inter-VariableFont_opsz,wght.ttf"),
  });

  // Get current screen info
  const currentRoute = navigationStack[navigationStack.length - 1];
  const currentScreen = currentRoute?.screen || "login";
  const screenParams = currentRoute?.params || {};

  // Hardware back button handler
  useEffect(() => {
    const backAction = () => {
      // If on dashboard, show exit confirmation
      if (currentScreen === "dashboard") {
        Alert.alert("Exit App", "Do you want to exit?", [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel"
          },
          {
            text: "YES",
            onPress: () => BackHandler.exitApp()
          }
        ]);
        return true;
      }

      // If on login/signup/forgotpassword, exit app
      if (currentScreen === "login" || currentScreen === "signup" || currentScreen === "forgotpassword") {
        BackHandler.exitApp();
        return true;
      }

      // For all other screens, go back in stack
      if (navigationStack.length > 1) {
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen, navigationStack]);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_TIME));
      } catch (error) {
        console.error("App initialization error:", error);
      } finally {
        setAppReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 100);

    return () => clearTimeout(timer);
  }, [appReady, fadeAnim]);

  const handleLoginSuccess = useCallback(user => {
    setUserData(user);
    setNavigationStack([{ screen: "dashboard", params: {} }]);
  }, []);

  const handleSignupSuccess = useCallback(user => {
    setUserData(user);
    setNavigationStack([{ screen: "dashboard", params: {} }]);
  }, []);

  const logout = useCallback(() => {
    setUserData(null);
    setNavigationStack([{ screen: "login", params: {} }]);
  }, []);

  const navigation = useMemo(
    () => ({
      navigate: (screen, params = {}) => {
        const routes = {
          Services: "services",
          Dashboard: "dashboard",
          ServiceBooking: "servicebookingscreen",
          ServiceBookingScreen: "servicebookingscreen",
          Notifications: "notifications",
          Announcements: "announcements",
          TermsConditions: "terms",
          BookingStatus: "bookingstatus",
          Account: "account",
          EditProfile: "editprofile",
          ChangePassword: "changepassword",
          Login: "login",
          ForgotPassword: "forgotpassword",
        };

        const route = routes[screen];
        if (!route) {
          console.warn(`Unknown route: ${screen}`);
          return;
        }

        // Add new screen to stack
        setNavigationStack(prev => [...prev, { screen: route, params }]);
      },

      goBack: () => {
        // Remove current screen from stack
        setNavigationStack(prev => {
          if (prev.length > 1) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      },

      canGoBack: () => {
        return navigationStack.length > 1;
      },

      reset: config => {
        if (config.routes?.[0]?.name === "Login") {
          setNavigationStack([{ screen: "login", params: {} }]);
        }
      },
    }),
    [navigationStack]
  );

  const screenComponents = useMemo(
    () => ({
      login: (
        <LoginScreen
          onNavigateToSignup={() => setNavigationStack([{ screen: "signup", params: {} }])}
          onNavigateToForgotPassword={() => setNavigationStack([{ screen: "forgotpassword", params: {} }])}
          onLoginSuccess={handleLoginSuccess}
        />
      ),
      signup: (
        <SignupScreen
          onNavigateToLogin={() => setNavigationStack([{ screen: "login", params: {} }])}
          onSignupSuccess={handleSignupSuccess}
        />
      ),
      forgotpassword: (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setNavigationStack([{ screen: "login", params: {} }])}
        />
      ),
      dashboard:
        userData && (
          <DashboardScreen
            onLogout={logout}
            navigation={navigation}
            userData={userData}
          />
        ),
      services:
        userData && (
          <ServicesScreen navigation={navigation} userData={userData} />
        ),
      servicebookingscreen:
        userData && (
          <ServiceBookingScreen
            route={{ params: screenParams }}
            navigation={navigation}
            userData={userData}
          />
        ),
      bookingstatus:
        userData && (
          <BookingStatusScreen navigation={navigation} userData={userData} />
        ),
      account:
        userData && (
          <AccountScreen navigation={navigation} userData={userData} />
        ),
      editprofile:
        userData && (
          <EditProfileScreen
            navigation={navigation}
            route={{ params: screenParams }}
          />
        ),
      changepassword:
        userData && (
          <ChangePasswordScreen
            navigation={navigation}
            route={{ params: screenParams }}
          />
        ),
      notifications:
        userData && (
          <NotificationScreen navigation={navigation} userData={userData} />
        ),
      announcements:
        userData && (
          <AnnouncementsScreen navigation={navigation} userData={userData} />
        ),
      terms: <TermsConditionsScreen navigation={navigation} />,
    }),
    [navigation, userData, screenParams, handleLoginSuccess, handleSignupSuccess, logout]
  );

  const currentScreenComponent =
    screenComponents[currentScreen] || screenComponents.login;

  const getStatusBarStyle = () => {
    if (showSplash) return "light";
    return ["login", "signup", "forgotpassword"].includes(currentScreen) ? "light" : "dark";
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c85878" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        style={getStatusBarStyle()}
        translucent
        backgroundColor="transparent"
      />

      <View
        style={styles.content}
        pointerEvents={showSplash ? "none" : "auto"}
      >
        {["login", "signup", "forgotpassword"].includes(currentScreen) ? (
          <LinearGradient
            colors={GRADIENT_COLORS}
            style={styles.gradient}
            start={GRADIENT_START}
            end={GRADIENT_END}
          >
            {currentScreenComponent}
          </LinearGradient>
        ) : (
          currentScreenComponent
        )}
      </View>

      {showSplash && (
        <Animated.View style={[styles.splash, { opacity: fadeAnim }]}>
          <SplashScreen isReady={appReady} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1 },
  gradient: { flex: 1 },
  splash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}