import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
  Image, Dimensions, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { authApi } from "../../service/api";

const { width, height } = Dimensions.get("window");

// ─── Roles (The "Perfect" Part) ───────────────────────────────────────────────
const ROLES = [
  {
    key: "farmer",
    label: "Farmer",
    image: require("../../assets/images/roles/farmer.png"),
    desc: "Map farms, log activities & build your credit profile",
    color: "#16a34a",
    gradientColors: ["#052e16", "#16a34a"],
    lightBg: "#f0fdf4",
    border: "#86efac",
    textColor: "#15803d",
  },
  {
    key: "investor",
    label: "Investor",
    image: require("../../assets/images/roles/investor.png"),
    desc: "Discover verified farmers and invest with confidence",
    color: "#2563eb",
    gradientColors: ["#1e3a8a", "#2563eb"],
    lightBg: "#eff6ff",
    border: "#93c5fd",
    textColor: "#1d4ed8",
  },
  {
    key: "agronomist",
    label: "Agronomist",
    image: require("../../assets/images/roles/agronomist.png"),
    desc: "Provide expert crop and soil recommendations",
    color: "#0891b2",
    gradientColors: ["#0c4a6e", "#0891b2"],
    lightBg: "#ecfeff",
    border: "#67e8f9",
    textColor: "#0e7490",
  },
  {
    key: "agrodealer",
    label: "Agro-Dealer",
    image: require("../../assets/images/roles/agrodealer.png"),
    desc: "Sell agricultural inputs and track farmer purchases",
    color: "#d97706",
    gradientColors: ["#78350f", "#d97706"],
    lightBg: "#fffbeb",
    border: "#fcd34d",
    textColor: "#b45309",
  },
  {
    key: "agent",
    label: "Field Agent",
    image: require("../../assets/images/roles/agent.png"),
    desc: "Log farm activities on behalf of registered farmers",
    color: "#7c3aed",
    gradientColors: ["#4c1d95", "#7c3aed"],
    lightBg: "#f5f3ff",
    border: "#c4b5fd",
    textColor: "#6d28d9",
  },
];

const ROLE_EXTRA = {
  farmer: [
    { key: "yearsOfExperience", label: "Farming Experience", placeholder: "e.g. 5 Years", keyboard: "numeric", icon: "time-outline" },
    { key: "cropsGrown", label: "Primary Crops", placeholder: "e.g. Maize, Cassava", icon: "leaf-outline" },
  ],
  agrodealer: [
    { key: "businessName", label: "Shop Name", placeholder: "e.g. Green Inputs", icon: "storefront-outline" },
  ],
  agronomist: [
    { key: "specialization", label: "Specialization", placeholder: "e.g. Soil Science", icon: "school-outline" },
  ],
};

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState("role"); // "role" | "auth"
  const [isLogin, setIsLogin] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "",
    yearsOfExperience: "", cropsGrown: "",
    businessName: "", specializations: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "1036812190563-05cei91visu2mjbtqu9bfsfhndf31isv.apps.googleusercontent.com",
    });
  }, []);

  const handleRoleSelect = (role) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRole(role);
  };

  const goStep = (next) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(next);
  };

  const validate = () => {
    if (!/\S+@\S+\.\S+/.test(form.email)) { Alert.alert("Invalid Email", "Enter a valid email."); return false; }
    if (form.password.length < 6) { Alert.alert("Weak Password", "At least 6 characters required."); return false; }
    return true;
  };

  const buildExtras = () => {
    const extras = { role: selectedRole?.key || "farmer" };
    if (!isLogin) {
      extras.name = form.name;
      extras.phone = form.phone;
      if (selectedRole?.key === "farmer") {
        extras.yearsOfExperience = form.yearsOfExperience;
        extras.cropsGrown = form.cropsGrown;
      }
    }
    return extras;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let cred;
      if (isLogin) {
        cred = await auth().signInWithEmailAndPassword(form.email, form.password);
      } else {
        cred = await auth().createUserWithEmailAndPassword(form.email, form.password);
      }
      const idToken = await cred.user.getIdToken();
      await authApi.firebaseLogin(idToken, buildExtras());
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) throw new Error("No ID token found");

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      await authApi.firebaseLogin(idToken, buildExtras());
      router.replace("/(tabs)");
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled, safely ignore
      } else {
        Alert.alert("Google Sign-In Error", err.message);
      }
    } finally { 
      setLoading(false); 
    }
  };

  const activeRole = selectedRole || ROLES[0];

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground
        source={require("../../assets/images/auth_bg.png")}
        style={{ width, height: height * 0.5 }}
        className="absolute top-0 opacity-80"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)", "black"]}
          className="flex-1"
        />
      </ImageBackground>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {step === "role" ? (
             <Animated.View 
              key="role-step"
              entering={FadeIn.duration(400)}
              exiting={SlideOutLeft.duration(300)}
              className="flex-1 px-6 pt-6"
            >
              <View className="items-center mb-6">
                <Image source={require("../../assets/images/logo.png")} style={{ width: 120, height: 50 }} resizeMode="contain" />
                <Text className="text-white text-3xl font-black mt-2">Agrynx</Text>
              </View>

              <View className="flex-1 bg-white/10 rounded-[40px] border border-white/20 p-6 backdrop-blur-md">
                <Text className="text-white text-2xl font-black mb-1">Welcome</Text>
                <Text className="text-white/60 text-sm mb-6">Choose your role to continue</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {ROLES.map((r, i) => (
                    <RoleCard 
                      key={r.key}
                      role={r} 
                      selected={selectedRole?.key === r.key} 
                      onPress={() => handleRoleSelect(r)}
                      index={i}
                    />
                  ))}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => {
                    if (!selectedRole) { Alert.alert("Select Role", "Please pick a role to continue."); return; }
                    goStep("auth");
                  }}
                  activeOpacity={0.8}
                  className="mt-6 py-4 rounded-2xl items-center bg-[#b5e48c] shadow-lg"
                >
                  <Text className="text-[#052e16] font-black text-base uppercase tracking-widest">CONTINUE</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={() => { setSelectedRole(ROLES[0]); setIsLogin(true); goStep("auth"); }}
                   className="mt-4 self-center"
                >
                  <Text className="text-white/60 text-sm">
                    Already have an account? <Text className="text-[#b5e48c] font-black">LOG IN</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View 
              key="auth-step"
              entering={SlideInRight.duration(400)}
              className="flex-1 px-6 pt-6"
            >
               <TouchableOpacity onPress={() => goStep("role")} className="flex-row items-center gap-2 mb-6 ml-1">
                  <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                    <Ionicons name="chevron-back" size={18} color="#fff" />
                  </View>
                  <Text className="text-white font-black text-xs uppercase tracking-widest">Go Back</Text>
               </TouchableOpacity>

               <View className="flex-1 bg-white/10 rounded-[40px] border border-white/20 p-8 backdrop-blur-md shadow-2xl">
                  <Text className="text-white text-3xl font-black mb-1">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </Text>
                  <Text className="text-white/50 text-xs font-bold uppercase tracking-[2px] mb-8">
                    You chose {activeRole.label}
                  </Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {!isLogin && (
                      <Animated.View entering={FadeInUp}>
                        <FInput 
                          label="Full Name" 
                          icon="person-outline" 
                          placeholder="Your Full Name" 
                          value={form.name} 
                          onChangeText={v => set("name", v)} 
                        />
                        <FInput 
                          label="Phone Number" 
                          icon="call-outline" 
                          placeholder="Your phone number" 
                          value={form.phone} 
                          onChangeText={v => set("phone", v)} 
                          keyboardType="phone-pad"
                        />
                        
                        {(ROLE_EXTRA[activeRole.key] || []).map(field => (
                          <FInput 
                            key={field.key}
                            label={field.label}
                            icon={field.icon}
                            placeholder={field.placeholder}
                            value={form[field.key]}
                            onChangeText={v => set(field.key, v)}
                            keyboardType={field.keyboard || "default"}
                          />
                        ))}
                      </Animated.View>
                    )}

                    <FInput 
                      label="Email Address" 
                      icon="mail-outline" 
                      placeholder="email@example.com" 
                      value={form.email} 
                      onChangeText={v => set("email", v)} 
                      keyboardType="email-address"
                    />

                    <FInput 
                      label="Password" 
                      icon="lock-closed-outline" 
                      placeholder="••••••••" 
                      value={form.password} 
                      onChangeText={v => set("password", v)} 
                      secureTextEntry={!showPw}
                      rightIcon={showPw ? "eye-off-outline" : "eye-outline"}
                      onRightPress={() => setShowPw(!showPw)}
                    />

                    {isLogin && (
                       <TouchableOpacity className="self-end mb-6 -mt-2">
                        <Text className="text-[#b5e48c] font-black text-[10px] uppercase tracking-wider">FORGOT PASSWORD?</Text>
                       </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={handleAuth}
                      disabled={loading}
                      activeOpacity={0.8}
                      className="py-5 rounded-2xl items-center bg-[#b5e48c] mt-4 mb-6 shadow-xl"
                    >
                      {loading ? <ActivityIndicator color="#052e16" /> : (
                        <Text className="text-[#052e16] font-black text-base uppercase tracking-[3px]">
                          {isLogin ? "SIGN IN" : "SIGN UP"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <View className="flex-row items-center mb-8">
                      <View className="flex-1 h-[1px] bg-white/10" />
                      <Text className="mx-4 text-white/30 font-black text-[10px] uppercase tracking-widest">OR</Text>
                      <View className="flex-1 h-[1px] bg-white/10" />
                    </View>

                    <TouchableOpacity
                      onPress={handleGoogleAuth}
                      disabled={loading}
                      activeOpacity={0.8}
                      className="flex-row items-center justify-center bg-white/5 border border-white/10 py-4 rounded-2xl mb-10"
                    >
                      <Ionicons name="logo-google" size={20} color="#fff" />
                      <Text className="ml-3 font-black text-white text-xs uppercase tracking-widest">Sign in with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="self-center pb-12">
                      <Text className="text-white/40 font-medium text-xs uppercase tracking-wider">
                        {isLogin ? "Need an account? " : "Already have an account? "}
                        <Text className="text-[#b5e48c] font-black">{isLogin ? "SIGN UP" : "LOG IN"}</Text>
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
               </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleCard({ role, selected, onPress, index }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  return (
    <Animated.View 
      entering={FadeInUp.delay(300 + index * 100)}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={() => (scale.value = 0.97)}
        onPressOut={() => (scale.value = 1)}
        className={`flex-row items-center p-4 rounded-3xl mb-3 border-2 ${
          selected ? "border-[#b5e48c] bg-white/10" : "border-white/5 bg-white/5"
        }`}
      >
        <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${
          selected ? "bg-[#b5e48c]" : "bg-white/10"
        }`}>
          <Image 
            source={role.image} 
            style={{ width: 40, height: 40 }} 
            resizeMode="contain" 
          />
        </View>
        <View className="flex-1">
          <Text className={`text-lg font-black ${selected ? "text-[#b5e48c]" : "text-white"}`}>{role.label}</Text>
          <Text className="text-white/40 text-xs" numberOfLines={1}>{role.desc}</Text>
        </View>
        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected ? "border-[#b5e48c]" : "border-white/20"
        }`}>
          {selected && <View className="w-3 h-3 rounded-full bg-[#b5e48c]" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function FInput({ label, icon, placeholder, value, onChangeText, keyboardType, secureTextEntry, rightIcon, onRightPress }) {
  return (
    <View className="mb-5">
      <Text className="text-white/50 text-[10px] font-black uppercase tracking-[2px] mb-2 ml-1">{label}</Text>
      <View className="flex-row items-center bg-white/5 rounded-2xl px-4 border border-white/10">
        <Ionicons name={icon} size={20} color="#b5e48c" />
        <TextInput
          className="flex-1 h-14 ml-3 text-white font-bold"
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress}>
            <Ionicons name={rightIcon} size={20} color="#b5e48c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}