import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ONBOARDING_STEPS = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2000&auto=format&fit=crop",
    title: "Precision\nAgriculture",
    subtitle: "DATADRIVEN GROWTH",
    description: "Leverage satellite data and AI to optimize your soil health and maximize every acre.",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop",
    title: "Connected\nEcosystem",
    subtitle: "DIRECT ACCESS",
    description: "Connect with certified agronomists and investors through our secure marketplace.",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1595665593673-bf1ad72905c0?q=80&w=2000&auto=format&fit=crop",
    title: "Market\nIntelligence",
    subtitle: "REAL-TIME INSIGHTS",
    description: "Stay ahead with live market prices and localized climate alerts tailored to your crops.",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=2000&auto=format&fit=crop",
    title: "Expert\nGuidance",
    subtitle: "KNOWLEDGE SHARING",
    description: "Receive personalized recommendations from industry leaders to improve your farm management.",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=2000&auto=format&fit=crop",
    title: "Financial\nFreedom",
    subtitle: "SECURE CAPITAL",
    description: "Build a verified credit passport based on your actual farm performance and history.",
  },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

const OnboardingItem = ({ item, scrollX, index }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [1.1, 1, 1.1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={{ width, height }} className="bg-black">
      <Animated.Image
        source={{ uri: item.image }}
        className="absolute w-full h-full"
        style={animatedStyle}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
        className="absolute bottom-0 left-0 right-0 h-[70%]"
      />
      
      <SafeAreaView className="flex-1 justify-end px-8 pb-32">
        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
          <Text className="text-green-400 font-black tracking-[4px] uppercase text-xs mb-4">
            {item.subtitle}
          </Text>
          <Text className="text-white text-5xl font-black leading-[54px] tracking-tight">
            {item.title}
          </Text>
          <Text className="text-gray-300 text-lg mt-6 leading-7">
            {item.description}
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = useCallback(async () => {
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/login");
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/login");
  }, [router]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <AnimatedFlatList
        ref={flatListRef}
        data={ONBOARDING_STEPS}
        renderItem={({ item, index }) => (
          <OnboardingItem item={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />

      {/* Floating Header */}
      <View className="absolute top-0 left-0 right-0 z-50">
        <SafeAreaView className="flex-row justify-end items-center px-8 pt-4">
          <TouchableOpacity onPress={handleSkip} className="bg-white/10 px-5 py-2 rounded-full backdrop-blur-xl border border-white/20">
            <Text className="text-white font-bold tracking-widest text-[10px] uppercase">Skip</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Bottom Controls */}
      <View className="absolute bottom-12 left-0 right-0 px-8 flex-row items-center justify-between">
        {/* Indicators */}
        <View className="flex-row">
          {ONBOARDING_STEPS.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const width = interpolate(
                scrollX.value,
                [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                [8, 24, 8],
                Extrapolate.CLAMP
              );
              const opacity = interpolate(
                scrollX.value,
                [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                [0.3, 1, 0.3],
                Extrapolate.CLAMP
              );
              return { width, opacity };
            });
            return (
              <Animated.View
                key={index}
                style={dotStyle}
                className="h-2 bg-green-500 rounded-full mr-2"
              />
            );
          })}
        </View>

        {/* Circular Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="bg-green-600 w-20 h-20 rounded-full items-center justify-center shadow-2xl shadow-green-500/50 border-[6px] border-white/10"
        >
          {currentIndex === ONBOARDING_STEPS.length - 1 ? (
            <Ionicons name="checkmark" size={32} color="white" />
          ) : (
            <Ionicons name="arrow-forward" size={32} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}