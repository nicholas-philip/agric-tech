import React, { useEffect } from "react";
import { View, Image, Dimensions, StatusBar } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  runOnJS
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const onAnimationComplete = async () => {
    // TEMPORARY: Forcing viewScreen to show for user review
    // const seen = await AsyncStorage.getItem('hasSeenOnboarding');
    // const isSeen = seen === 'true';
    
    setTimeout(() => {
      router.replace("/(viewScreen)");
    }, 1000); 
  };

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 1200 });
    logoScale.value = withTiming(1, { 
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    
    textOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
    translateY.value = withDelay(800, withTiming(0, { 
      duration: 1000,
      easing: Easing.out(Easing.exp)
    }, (finished) => {
      if (finished) {
        runOnJS(onAnimationComplete)();
      }
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <View className="flex-1 bg-[#031510]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={["#0a2e1f", "#031510"]}
        className="flex-1 justify-center items-center"
      >
        <Animated.View style={logoStyle} className="items-center justify-center">
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: width * 0.75, height: width * 0.4 }}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View style={textStyle} className="-mt-5">
          <Animated.Text className="text-white text-[16px] font-semibold tracking-[4px] uppercase opacity-80">
            The Future of Farming
          </Animated.Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
