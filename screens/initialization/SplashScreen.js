import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SplashScreen({ isReady }) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current; // fade-in for brand text

  // ✅ Animate logo scale-in
  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 8,
      tension: 35,
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

  // ✅ Fade-in brand text
  useEffect(() => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [textOpacity]);

  // ✅ Loading bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={["#c85878", "#d96b8c", "#c85878"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo + Brand */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            {/* ✅ Custom font (with safe fallback) */}
            <Animated.Text
              style={[
                styles.brandText,
                {
                  opacity: textOpacity,
                  fontFamily:
                    Platform.OS === "android"
                      ? "LobsterTwo-Italic"
                      : "LobsterTwo-Italic",
                },
              ]}
            >
              Perfectly Salon
            </Animated.Text>

            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/logo-salon.jpg")}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          {/* ✅ Loading bar */}
          <View style={styles.loadingSection}>
            <View style={styles.loadingBarContainer}>
              <View style={styles.loadingBarBackground}>
                <Animated.View
                  style={[styles.loadingBarFill, { width: barWidth }]}
                />
              </View>

              {/* ✅ Custom font (with safe fallback) */}
              <Text
                style={[
                  styles.loadingText,
                  {
                    fontFamily:
                      Platform.OS === "android"
                        ? "Inter-Variable"
                        : "Inter-Variable",
                  },
                ]}
              >
                {isReady ? "Ready!" : "Loading..."}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  brandText: {
    fontSize: 36,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    paddingBottom: 12,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.7)",
  },
  logoImage: {
    width: 94,
    height: 94,
    borderRadius: 50,
  },
  loadingSection: {
    width: "100%",
    alignItems: "center",
  },
  loadingBarContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  loadingBarBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
