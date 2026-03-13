import "./global.css";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Switch,
  Dimensions,
  AppState,
  Animated,
  Easing,
  Linking,
  StatusBar as RNStatusBar,
  FlatList,
  KeyboardAvoidingView as KAV2,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { activateLicense } from "./utils/activateLicense";
import { saveLicenseKey, getLicenseKey, removeLicenseKey, getDeviceId } from "./utils/licenseStorage";
import { saveSettings, loadSettings } from "./utils/settingsStorage";
import { sendToGroq, GroqMessage } from "./utils/groqChat";
import { MarkdownText } from "./components/MarkdownText";
import { TypewriterText } from "./components/TypewriterText";

import * as Device from "expo-device";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_900Black 
} from "@expo-google-fonts/outfit";

const ModernToggle = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => {
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      onValueChange(!value);
      setIsLoading(false);
    }, 1200);
  };

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1e293b", "#e2e8f0"] // darker slate to brand-accent
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22] // Thumb slide range
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} disabled={isLoading}>
      <Animated.View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor, justifyContent: "center" }}>
        {isLoading ? (
          <ActivityIndicator size={12} color={value ? "#0a0a0f" : "#94a3b8"} style={{ position: 'absolute', alignSelf: 'center' }} />
        ) : (
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: value ? "#0a0a0f" : "#94a3b8", // high contrast thumb
              transform: [{ translateX }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ==================== ChatJilly AI Response Engine ====================
type ChatMessage = { role: "user" | "bot"; text: string };

const CHATJILLY_GREETING = "Hey! I'm ChatJilly \u{1F916} — your Free Fire optimization assistant.\n\nI know everything about JillyX tools. Ask me about sensitivities, recoil, FPS, DPI, resolution, or any feature!\n\n\u{1F4A1} Tip: Type 'analyze' to scan your device and get personalized settings!";

function getChatJillyResponse(input: string): string {
  const q = input.toLowerCase().trim();

  // Sensitivities
  if (q.match(/sens|sensitivity|sensitivit/)) {
    return "\u{1F3AF} Sensitivities:\nImproves your aiming accuracy and enables better drag headshots.\n\n\u2022 Enable in Contents tab\n\u2022 Works by optimizing your aim response curve\n\u2022 Combine with Fine Tuning sliders for precision control\n\u2022 Best paired with HeadTracking for maximum accuracy";
  }

  // Methods
  if (q.match(/method|layer|inject/)) {
    return "\u{1F52B} Methods:\nProvides additional aiming techniques and layered sensitivity adjustments.\n\n\u2022 Enable in Contents tab\n\u2022 Adds multiple aim-layers for smoother crosshair control\n\u2022 Improves consistency across different weapons\n\u2022 Works best when combined with Sensitivities toggle";
  }

  // Memory Head Sensitivity (specific)
  if (q.match(/memory\s*head|head\s*sens/)) {
    return "\u{1F9E0} Memory Head Sensitivity:\nImproves headshot tracking stability.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Stabilizes your aim when tracking enemy heads\n\u2022 Reduces aim drift during fast movements\n\u2022 Essential for consistent drag headshots";
  }

  // Reduce Recoil Animation
  if (q.match(/reduce\s*recoil|recoil\s*anim/)) {
    return "\u{1F4A5} Reduce Recoil Animation:\nReduces visual recoil for smoother shooting.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Makes spray patterns easier to control\n\u2022 Less screen shake = better target tracking\n\u2022 Great for AK, M4A1, Groza and Thompson";
  }

  // Fix Memory Cache
  if (q.match(/fix\s*memory|memory\s*cache/)) {
    return "\u{1F9F9} Fix Memory Cache:\nClears game memory cache to reduce lag spikes.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Frees up RAM used by old game data\n\u2022 Reduces micro-stutters and frame drops\n\u2022 Recommended for devices with 4GB RAM or less";
  }

  // Optimize Device
  if (q.match(/optimize\s*dev|device\s*optim/)) {
    return "\u{1F4F1} Optimize Device:\nImproves overall device performance for gaming.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Clears background processes eating your RAM\n\u2022 Prioritizes CPU/GPU for Free Fire\n\u2022 Noticeable FPS boost on mid to low-end devices";
  }

  // Optimize Code
  if (q.match(/optimize\s*code|code\s*optim/)) {
    return "\u{1F4BB} Optimize Code:\nApplies internal optimizations to game processes.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Re-optimizes shader compilation for your GPU\n\u2022 Reduces processing overhead during gameplay\n\u2022 Helps maintain stable FPS during intense fights";
  }

  // Clear Cache & Cookies
  if (q.match(/clear\s*cache|cache\s*cook|cookies/)) {
    return "\u{1F5D1}\uFE0F Clear Cache & Cookies:\nRemoves temporary files that affect performance.\n\n\u2022 Enable in Advanced section (Contents tab)\n\u2022 Deletes old cached data slowing down your game\n\u2022 Frees storage and memory\n\u2022 Use before ranked matches for optimal performance";
  }

  // Advanced (general)
  if (q.match(/advanced/)) {
    return "\u26A1 Advanced Tools:\n6 powerful optimizations in the Contents tab:\n\n\u2022 Memory Head Sensitivity — headshot tracking stability\n\u2022 Reduce Recoil Animation — smoother shooting\n\u2022 Fix Memory Cache — reduce lag spikes\n\u2022 Optimize Device — boost device performance\n\u2022 Optimize Code — optimize game processes\n\u2022 Clear Cache & Cookies — remove temp files\n\nEnable all 6 for maximum performance!";
  }

  // Fine Tuning / Adjust
  if (q.match(/tune|tuning|fine|adjust|slider/)) {
    return "\u{1F39B}\uFE0F Fine Tuning:\nAdjust parameters for optimal gameplay:\n\n\u2022 Sensitivity slider — controls aim response speed\n\u2022 Recoil Control — adjusts spray stability\n\u2022 Touch Speed — controls touch input responsiveness\n\nRecommended:\n\u2022 Sens: 60-75% for balanced aim\n\u2022 Recoil: 70-85% for spray weapons\n\u2022 Touch: 50-65% for smooth drag\n\nHit 'Apply Tuning' after adjusting!";
  }

  // HeadTracking
  if (q.match(/head\s*track|headtrack/)) {
    return "\u{1F3AF} HeadTracking:\nCalibrates player focus and aiming precision.\n\n\u2022 Enable in Hardware tab\n\u2022 Locks your aim calibration to head-level\n\u2022 Improves crosshair placement consistency\n\u2022 Combine with Sensitivities for deadly accuracy\n\u2022 Works at all ranges, best at close-medium";
  }

  // SuperTouch
  if (q.match(/super\s*touch|touch\s*respon/)) {
    return "\u{1F4F1} SuperTouch:\nImproves touch responsiveness.\n\n\u2022 Enable in Hardware tab\n\u2022 Reduces input delay between tap and action\n\u2022 Makes firing, scoping - all actions faster\n\u2022 Essential for quick-scope & fast-peek plays\n\u2022 Pair with Touch Speed slider in Fine Tuning";
  }

  // ButtonTrick
  if (q.match(/button\s*trick|button\s*layout|overlay\s*shoot/)) {
    return "\u{1F579}\uFE0F ButtonTrick:\nOverlay shooting button optimization.\n\n\u2022 Enable in Hardware tab\n\u2022 Optimizes fire button hitboxes for faster response\n\u2022 Improves accuracy of rapid-fire taps\n\u2022 Great for 3-4 finger claw players\n\u2022 Place fire button near your aim joystick";
  }

  // DPI Calculator
  if (q.match(/dpi|calc/)) {
    return "\u{1F4CA} DPI Calculator:\nCalculates best DPI settings based on your device screen.\n\n\u2022 Enable in Hardware tab\n\u2022 Analyzes your screen size and density\n\u2022 Recommends optimal DPI for 1:1 aim precision\n\u2022 Higher DPI = lower in-game sens needed\n\u2022 Helps find your perfect drag headshot ratio";
  }

  // Resolution Spoofer
  if (q.match(/resol|spoof|display/)) {
    return "\u{1F4FA} Resolution Spoofer:\nAdjusts screen resolution to improve FPS stability.\n\n\u2022 Available in Hardware tab\n\u2022 Choose from Samsung, ROG, iPhone profiles\n\u2022 Lower resolution = higher FPS\n\u2022 720p for max FPS on low-end devices\n\u2022 1080p for balanced quality on mid-range\n\u2022 Restart game after applying!";
  }

  // FPS / Lag (Troubleshooting)
  if (q.match(/fps|frame|lag|stutter|smooth|patah/)) {
    return `🚀 Troubleshooting: FPS Drop & Lag

🔍 Kemungkinan Penyebab:
• Resolusi tinggi membebani GPU
• Aplikasi background memakan RAM
• Cache game menumpuk

🎛️ Rekomendasi JillyX:
• Resolusi: 720p (Performa Maksimal)
• Recoil Control: 75% (kalkulasi lebih ringan)
• Tab Contents: Aktifkan 'Fix Memory Cache', 'Optimize Device', 'Optimize Code', 'Clear Cache & Cookies'

Tekan 'Apply Tuning' dan restart Free Fire!`;
  }


  // Recoil (Troubleshooting)
  if (q.match(/recoil|spray|control|kheker|goyang/)) {
    return `🔫 Troubleshooting: Recoil Liar / Berat

🔍 Kemungkinan Penyebab:
• Rasio sensitivity & drag tidak sesuai
• Menembak brutal tanpa mereduksi animasi recoil

🎛️ Rekomendasi JillyX:
• Recoil Control: Ubah ke 85%
• Touch Speed: Turunkan ke 50-60% untuk drag mulus
• Tab Contents: Aktifkan 'Reduce Recoil Animation'
• Tab Hardware: Aktifkan 'HeadTracking' (mengunci bidikan vertikal)

Tekan 'Apply Tuning' untuk mengaktifkan!`;
  }


  // Drag headshot / Headshot difficulty (Troubleshooting)
  if (q.match(/drag|headshot|head\s*shot|snipe|miss|hard|susah|kepala/)) {
    return `🎯 Troubleshooting: Susah Headshot (Drag Aim)

🔍 Kemungkinan Penyebab:
• Sensitivity aim terlalu lambat
• DPI kurang memaksimalkan kalibrasi drag
• Tracking kepala memori tidak stabil

🎛️ Rekomendasi JillyX:
• Sensitivity: Naikkan ke 90-100%
• Touch Speed: Ubah ke 65%
• DPI Tracker: Nyalakan pengaturan ini
• Tab Contents: Aktifkan 'Sensitivities', 'Methods', 'Memory Head Sensitivity'
• Tab Hardware: Aktifkan 'HeadTracking'

Atur slider, aktifkan fitur, lalu tekan 'Apply Tuning'!`;
  }

  // Crosshair shaking (Troubleshooting)
  if (q.match(/shake|shaking|tremble|unstable|crosshair|bergetar/)) {
    return `🎯 Troubleshooting: Crosshair Bergetar / Tremor

🔍 Kemungkinan Penyebab:
• Sensitivity terlalu ekstrim / tinggi
• Sampling rate sentuhan tidak sinkron
• Konflik DPI bawaan hp

🎛️ Rekomendasi JillyX:
• Sensitivity: Turunkan ke 65-75%
• Touch Speed: Turunkan ke 50%
• DPI Tracker: Matikan jika sedang menyala
• Tab Contents: Aktifkan 'Methods' (kontrol crosshair presisi)
• Tab Hardware: Matikan 'SuperTouch' sementara

Tekan 'Apply Tuning' untuk aim yang lebih stabil!`;
  }

  // Touch Delay (Troubleshooting)
  if (q.match(/delay|touch|slow|response|lemot/)) {
    return `📱 Troubleshooting: Touch Delay / Layar Kurang Responsif

🔍 Kemungkinan Penyebab:
• Suhu hp panas (thermal throttling)
• Touch sampling rate tertahan
• Beban resolusi terlalu berat untuk GPU

🎛️ Rekomendasi JillyX:
• Touch Speed: Maksimalkan hingga 100%
• Resolusi: 900p (meringankan render GPU)
• Tab Hardware: Aktifkan 'SuperTouch' dan 'Performance Monitor'
• Tab Contents: Aktifkan 'Optimize Device' & 'Clear Cache & Cookies'

Tekan 'Apply Tuning' untuk mematikan input lag!`;
  }

  // Greetings
  if (q.match(/^(hi|hello|hey|halo|yo|sup|what's up)/)) {
    return "Hey there! \u{1F44B} I'm ChatJilly.\n\nI can help you optimize your Free Fire gameplay. Ask me about:\n\u2022 Sensitivity & drag headshot setup\n\u2022 FPS optimization\n\u2022 Recoil control\n\u2022 Device performance\n\u2022 Any JillyX feature\n\n\u{1F4A1} Type 'analyze' for a full device scan!";
  }

  // Help / Features
  if (q.match(/help|what can|feature|menu|list/)) {
    return "\u{1F4CB} JillyX Features I can explain:\n\n\u{1F3AF} Sensitivities — aim accuracy\n\u{1F52B} Methods — layered aim techniques\n\u{1F9E0} Memory Head Sens — headshot stability\n\u{1F4A5} Reduce Recoil — smoother spray\n\u{1F9F9} Fix Memory Cache — reduce lag\n\u{1F4F1} Optimize Device — boost performance\n\u{1F4BB} Optimize Code — game optimization\n\u{1F5D1}\uFE0F Clear Cache — remove temp files\n\u{1F39B}\uFE0F Fine Tuning — adjust parameters\n\u{1F3AF} HeadTracking — aim calibration\n\u{1F4F1} SuperTouch — touch response\n\u{1F579}\uFE0F ButtonTrick — overlay buttons\n\u{1F4CA} DPI Calculator — best DPI\n\u{1F4FA} Resolution Spoofer — FPS boost\n\n\u{1F50D} Type 'analyze' for personalized device settings!";
  }

  // Thanks
  if (q.match(/thank|thx|makasih|terima/)) {
    return "You're welcome! \u{1F4AA} Good luck dominating your matches. Hit me up anytime you need help optimizing!";
  }

  // Best settings / recommend
  if (q.match(/best|recommend|setup|config|pro/)) {
    return "\u{1F3C6} Pro Recommended Setup:\n\n\u2022 Contents: Sensitivities + Methods ON\n\u2022 Advanced: All 6 toggles ON\n\u2022 Fine Tuning: Sens 70%, Recoil 80%, Touch 60%\n\u2022 Hardware: HeadTracking + SuperTouch ON\n\u2022 ButtonTrick: ON for claw players\n\u2022 DPI Calculator: Enable for your device\n\u2022 Resolution: Match your device tier\n\nApply all changes and restart game!";
  }

  // Device / phone
  if (q.match(/device|phone|low.end|mid.range|high.end|ram/)) {
    return "\u{1F4F1} Device-Based Recommendations:\n\nLow-end (2-3GB RAM):\n\u2022 All Advanced toggles ON\n\u2022 Resolution: 720p\n\u2022 Touch Speed: 50%\n\nMid-range (4-6GB RAM):\n\u2022 All Advanced toggles ON\n\u2022 Resolution: 1080p\n\u2022 Touch Speed: 60%\n\nHigh-end (8GB+ RAM):\n\u2022 All Advanced toggles ON\n\u2022 Resolution: Native or 1440p\n\u2022 Touch Speed: 65%";
  }

  // Weapon specific
  if (q.match(/ak|m4|groza|thompson|mp40|ump|scar|weapon|gun/)) {
    return "\u{1F52B} Weapon-Specific Tips:\n\nAK/Groza (high recoil):\n\u2022 Recoil Control: 80-90%\n\u2022 Reduce Recoil Animation: ON\n\nM4/SCAR (medium recoil):\n\u2022 Recoil Control: 65-75%\n\nMP40/Thompson/UMP (SMGs):\n\u2022 Recoil Control: 50-60%\n\u2022 Touch Speed: 65% for spray\n\nAll weapons: HeadTracking ON!";
  }

  // Default fallback
  return "\u{1F914} I'm not sure about that. Try asking about:\n\u2022 Sensitivities or DPI\n\u2022 FPS optimization\n\u2022 Recoil control\n\u2022 HeadTracking or SuperTouch\n\u2022 Resolution Spoofer\n\u2022 Best settings\n\u2022 Type 'analyze' for device analysis!\n\u2022 Or type 'help' for all features!";
}

// ==================== Device Analysis Flow ====================
type AnalysisStep = "idle" | "device" | "ram" | "processor" | "refreshRate" | "fps" | "playstyle" | "done";

type DeviceAnalysis = {
  step: AnalysisStep;
  device: string;
  ram: string;
  processor: string;
  refreshRate: string;
  fps: string;
  playstyle: string;
};

const ANALYSIS_INITIAL: DeviceAnalysis = {
  step: "idle", device: "", ram: "", processor: "", refreshRate: "", fps: "", playstyle: ""
};

function getAnalysisQuestion(step: AnalysisStep): string {
  switch (step) {
    case "device":
      return "\u{1F4F1} Step 1/6 \u2014 Device Model\n\nHp apa yang kamu pakai?\n(cth: Samsung A12, Redmi Note 11, iPhone 13, ROG Phone 7)";
    case "ram":
      return "\u{1F4CA} Step 2/6 \u2014 RAM Size\n\nBerapa ukuran RAM hp kamu?\n(cth: 2GB, 3GB, 4GB, 6GB, 8GB, 12GB)";
    case "processor":
      return "\u2699\uFE0F Step 3/6 \u2014 Processor\n\nApa prosesor hp kamu? (jika tahu)\n(cth: Snapdragon 680, Helio G99, A16 Bionic)\n\nKetik 'skip' jika tidak tahu.";
    case "refreshRate":
      return "\u{1F504} Step 4/6 \u2014 Refresh Rate\n\nBerapa refresh rate layar hp kamu?\n\n\u2022 60Hz (Standar)\n\u2022 90Hz (Mulus)\n\u2022 120Hz (Sangat Mulus)\n\nKetik 'skip' jika tidak tahu.";
    case "fps":
      return "\u{1F3AE} Step 5/6 \u2014 FPS Stability\n\nBagaimana kondisi FPS saat main Free Fire?\n\n\u2022 Mulus (60 FPS stabil)\n\u2022 Sedang (40-50 FPS, kadang drop)\n\u2022 Patah-patah (di bawah 30 FPS, sering lag)";
    case "playstyle":
      return "\u{1F3AF} Step 6/6 \u2014 Play Style\n\nApa gaya bermain (playstyle) favoritmu?\n\n\u2022 Rusher \u2014 pertempuran jarak dekat yang agresif\n\u2022 Sniper \u2014 akurasi jarak jauh\n\u2022 Balanced \u2014 kombinasi keduanya";
    default:
      return "";
  }
}

function classifyDevice(analysis: DeviceAnalysis): { tier: string; recommendations: string } {
  const ramNum = parseInt(analysis.ram.replace(/[^0-9]/g, '')) || 0;
  const fpsLower = analysis.fps.toLowerCase();
  const styleLower = analysis.playstyle.toLowerCase();
  const refreshRateLower = analysis.refreshRate.toLowerCase();

  // Classify tier
  let tier: string;
  if (ramNum <= 3 || fpsLower.includes('lag') || fpsLower.includes('patah')) {
    tier = "Low-end";
  } else if (ramNum >= 8 || refreshRateLower.includes('120') || fpsLower.includes('smooth') || fpsLower.includes('mulus')) {
    tier = "High-end";
  } else {
    tier = "Mid-range";
  }

  const isRush = styleLower.includes('rush');
  const isSniper = styleLower.includes('snip');

  // ===== Compute exact numerical settings =====
  let sens: number, recoil: number, touchSpeed: number, dpi: number;
  let resolution: string;

  if (tier === "Low-end") {
    // Range: Sens 75-85, Recoil 85-95, Touch 50-60
    sens = 80;
    recoil = 90;
    touchSpeed = 55;
    dpi = 220;
    resolution = "720p";
  } else if (tier === "High-end") {
    // Range: Sens 90-100, Recoil 70-80, Touch 70-80
    sens = 95;
    recoil = 75;
    touchSpeed = 75;
    dpi = 380;
    resolution = "1440p";
  } else {
    // Mid-range: Sens 80-90, Recoil 80-90, Touch 60-70
    sens = 85;
    recoil = 85;
    touchSpeed = 65;
    dpi = 300;
    resolution = "900p";
  }

  // Adjust values based on play style
  if (isRush) {
    sens += 5;
  } else if (isSniper) {
    sens -= 5;
  }


  // ===== Compute tool recommendations =====
  let tools: string[] = [];

  // Always recommend
  tools.push("✅ Enable Sensitivities");
  tools.push("✅ Enable Methods");

  // Advanced tools - always all on
  tools.push("✅ Enable Memory Head Sensitivity");
  tools.push("✅ Enable Reduce Recoil Animation");
  tools.push("✅ Enable Fix Memory Cache");
  tools.push("✅ Enable Optimize Device");
  tools.push("✅ Enable Optimize Code");
  tools.push("✅ Enable Clear Cache & Cookies");

  // Hardware - based on style
  tools.push("✅ Enable HeadTracking");
  if (isRush || !isSniper) {
    tools.push("✅ Enable SuperTouch");
    tools.push("✅ Enable ButtonTrick");
  }
  if (isSniper) {
    tools.push("✅ Enable SuperTouch");
  }

  tools.push("✅ Enable DPI Calculator");
  tools.push(`✅ Use Resolution Spoofer ${resolution}`);

  // Low-end extra tips
  if (tier === "Low-end") {
    tools.push("⚠️ Close ALL background apps before playing");
    tools.push("⚠️ Clear Cache before every session");
  }

  // Tier emoji
  const tierEmoji = tier === "Low-end" ? "🔴" : tier === "High-end" ? "🟢" : "🟡";
  const tierLabel = tier.toUpperCase();
  const styleLabel = isRush ? "Rush" : isSniper ? "Sniper" : "Balanced";
  const refreshText = analysis.refreshRate.toLowerCase() === "skip" ? "60Hz (Asumsi)" : analysis.refreshRate;

  const result = `📋 INFO DEVICE & REKOMENDASI JILLYX

📱 Device: ${analysis.device}
📊 RAM: ${analysis.ram}
⚙️ Processor: ${analysis.processor || 'Unknown'}
🔄 Refresh Rate: ${refreshText}
🎮 Kondisi FPS: ${analysis.fps}
🎯 Playstyle: ${styleLabel}

${tierEmoji} Kategori Device: ${tierLabel}

────────────────────

🎛️ Target Konfigurasi:
• Sensitivity: ${sens}%
• Recoil Control: ${recoil}%
• Touch Speed: ${touchSpeed}%
• DPI Tracker: ${dpi}
• Resolusi: ${resolution}

────────────────────

🛠️ Fitur Rekomendasi:
${tools.join('\n')}

────────────────────

🏆 Semua fitur di atas siap diaktifkan! Cukup klik tombol "Terapkan Konfigurasi" di bawah chat ini, dan ChatBot akan mengingat profil HP kamu untuk ke depannya.`;

  return { tier, recommendations: result };
}

export function parseChatSettings(text: string) {
  let hasSettings = false;
  const payload: any = { adjustments: {}, advanced: {}, contents: {}, hardware: {}, resolution: null };

  const sensMatch = text.match(/Sensitivity.*?(\d+)/i);
  if (sensMatch) { payload.adjustments.sensitivity = parseInt(sensMatch[1], 10); hasSettings = true; }
  
  const recoilMatch = text.match(/Recoil.*?(\d+)/i);
  if (recoilMatch) { payload.adjustments.recoil = parseInt(recoilMatch[1], 10); hasSettings = true; }

  const touchMatch = text.match(/Touch.*?(\d+)/i);
  if (touchMatch) { payload.adjustments.touchSpeed = parseInt(touchMatch[1], 10); hasSettings = true; }

  if (text.match(/Memory Head Sensitivity.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.memoryHeadSens = true; hasSettings = true; }
  if (text.match(/Reduce Recoil Animation.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.reduceRecoilAnim = true; hasSettings = true; }
  if (text.match(/Fix Memory Cache.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.fixMemoryCache = true; hasSettings = true; }
  if (text.match(/Optimize Device.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.optimizeDevice = true; hasSettings = true; }
  if (text.match(/Optimize Code.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.optimizeCode = true; hasSettings = true; }
  if (text.match(/Clear Cache.*(ON|Enable|Aktif|\u2705)/i)) { payload.advanced.clearCacheCookies = true; hasSettings = true; }

  if (text.match(/Sensitivities.*(ON|Enable|Aktif|\u2705)/i)) { payload.contents.sensitivities = true; hasSettings = true; }
  if (text.match(/Methods.*(ON|Enable|Aktif|\u2705)/i)) { payload.contents.methods = true; hasSettings = true; }

  if (text.match(/HeadTracking.*(ON|Enable|Aktif|\u2705)/i)) { payload.hardware.headTracking = true; hasSettings = true; }
  if (text.match(/SuperTouch.*(ON|Enable|Aktif|\u2705)/i)) { payload.hardware.superTouch = true; hasSettings = true; }
  if (text.match(/ButtonTrick.*(ON|Enable|Aktif|\u2705)/i)) { payload.hardware.buttonTrick = true; hasSettings = true; }
  if (text.match(/DPI Calculator.*(ON|Enable|Aktif|\u2705)/i)) { payload.hardware.dpiCalculator = true; hasSettings = true; }

  const resMatch = text.match(/Resolution.*?([0-9]+[xp]?[0-9]*|Native)/i);
  if (resMatch) {
    const resString = resMatch[1].toLowerCase();
    if (resString.includes('720')) payload.resolution = '720x1600';
    else if (resString.includes('900') || resString.includes('1080')) payload.resolution = '1080x2400';
    else if (resString.includes('1440') || resString.includes('native')) payload.resolution = 'Native Device';
    if (payload.resolution) hasSettings = true;
  }

  return hasSettings ? payload : null;
}

function HomeScreen({ onLicenseExpired }: { onLicenseExpired?: () => void }) {
  const [deviceModel, setDeviceModel] = useState("Unknown Device");

  // Adjustments state for the new tab
  const [adjustments, setAdjustments] = useState({
    sensitivity: 50,
    recoil: 50,
    touchSpeed: 50
  });

  const [appliedAdjustments, setAppliedAdjustments] = useState({
    sensitivity: 50,
    recoil: 50,
    touchSpeed: 50
  });

  useEffect(() => {
    if (Device.brand && Device.modelName) {
      setDeviceModel(`${Device.brand}, ${Device.modelName}`);
    } else if (Platform.OS === "web") {
      setDeviceModel("Web Browser");
    }
  }, []);

  const [advanced, setAdvanced] = useState({
    memoryHeadSens: false,
    reduceRecoilAnim: false,
    fixMemoryCache: false,
    optimizeDevice: false,
    optimizeCode: false,
    clearCacheCookies: false,
  });

  const [contents, setContents] = useState({
    sensitivities: false,
    methods: false,
  });

  const [hardware, setHardware] = useState({
    headTracking: false,
    superTouch: false,
    chatBot: false,
    buttonTrick: false,
    dpiCalculator: false,
  });

  // Resolution state
  const HIGH_END_DEVICES = [
    // Samsung Galaxy S Series
    { label: "Galaxy S21", res: "1080x2400" },
    { label: "Galaxy S21 Ultra", res: "1440x3200" },
    { label: "Galaxy S22", res: "1080x2340" },
    { label: "Galaxy S22 Ultra", res: "1440x3088" },
    { label: "Galaxy S23", res: "1080x2340" },
    { label: "Galaxy S23 Ultra", res: "1440x3088" },
    { label: "Galaxy S24", res: "1080x2340" },
    { label: "Galaxy S24 Ultra", res: "1440x3120" },
    { label: "Galaxy S25", res: "1080x2340" },
    { label: "Galaxy S25 Ultra", res: "1440x3120" },
    { label: "Galaxy S26", res: "1080x2400" },
    { label: "Galaxy S26 Ultra", res: "1440x3200" },
    // ROG Phone Series
    { label: "ROG Phone 7", res: "1080x2448" },
    { label: "ROG Phone 7 Ultimate", res: "1080x2448" },
    { label: "ROG Phone 8", res: "1080x2400" },
    { label: "ROG Phone 8 Pro", res: "1080x2400" },
    { label: "ROG Phone 9", res: "1080x2400" },
    { label: "ROG Phone 9 Pro", res: "1080x2400" },
    // iPhone Series
    { label: "iPhone 15", res: "1179x2556" },
    { label: "iPhone 15 Pro", res: "1179x2556" },
    { label: "iPhone 15 Pro Max", res: "1290x2796" },
    { label: "iPhone 16", res: "1179x2556" },
    { label: "iPhone 16 Pro", res: "1206x2622" },
    { label: "iPhone 16 Pro Max", res: "1320x2868" },
    { label: "iPhone 17", res: "1206x2622" },
    { label: "iPhone 17 Pro", res: "1290x2796" },
    { label: "iPhone 17 Pro Max", res: "1320x2868" },
  ];

  const [selectedResolution, setSelectedResolution] = useState("Native Device");
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [activatingResolution, setActivatingResolution] = useState<string | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      if (saved.advanced) setAdvanced(prev => ({ ...prev, ...saved.advanced }));
      if (saved.contents) setContents(prev => ({ ...prev, ...saved.contents }));
      if (saved.hardware) setHardware(prev => ({ ...prev, ...saved.hardware }));
      if (saved.selectedResolution) setSelectedResolution(saved.selectedResolution);
      if (saved.adjustments) {
        setAdjustments(prev => ({ ...prev, ...saved.adjustments }));
        setAppliedAdjustments(prev => ({ ...prev, ...saved.adjustments }));
      }
    }
  }, []);

  // Persist settings whenever they change
  useEffect(() => {
    saveSettings({ advanced, contents, hardware, selectedResolution, adjustments });
  }, [advanced, contents, hardware, selectedResolution, adjustments]);

  const toggleAdvanced = (key: keyof typeof advanced) => {
    setAdvanced((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleContent = (key: keyof typeof contents) => {
    setContents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleHardware = (key: keyof typeof hardware) => {
    setHardware((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyResolution = (deviceLabel: string) => {
    setActivatingResolution(deviceLabel);
    setTimeout(() => {
      setSelectedResolution(deviceLabel);
      setActivatingResolution(null);
      setShowResolutionPicker(false);
    }, 800);
  };

  const applyAutoSettings = (payload: any) => {
    if (!payload) return;
    setIsAutoApplying(true);
    setTimeout(() => {
      if (Object.keys(payload.adjustments).length > 0) {
        setAdjustments(prev => ({ ...prev, ...payload.adjustments }));
      }
      if (Object.keys(payload.advanced).length > 0) {
        setAdvanced(prev => ({ ...prev, ...payload.advanced }));
      }
      if (Object.keys(payload.contents).length > 0) {
        setContents(prev => ({ ...prev, ...payload.contents }));
      }
      if (Object.keys(payload.hardware).length > 0) {
        setHardware(prev => ({ ...prev, ...payload.hardware }));
      }
      if (payload.resolution) {
        setSelectedResolution(payload.resolution);
      }
      if (Object.keys(payload.adjustments).length > 0) {
        setAppliedAdjustments(prev => ({ ...prev, ...payload.adjustments }));
      }
      setIsAutoApplying(false);
      Alert.alert("Konfigurasi Diterapkan \u2705", "Semua pengaturan telah disinkronkan ke JillyX.");
    }, 2500);
  };

  const [activeTab, setActiveTab] = useState<"contents" | "hardware" | "adjust">("contents");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isApplyingTuning, setIsApplyingTuning] = useState(false);
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [analysisState, setAnalysisState] = useState<DeviceAnalysis>(ANALYSIS_INITIAL);
  const chatListRef = React.useRef<FlatList>(null);
  const lastAnimatedMsgIndex = React.useRef<number>(-1);

  // Centralized chat send handler
  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    const userMsg: ChatMessage = { role: "user", text };
    
    // Add user message immediately
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Check if we're in device analysis flow
    if (analysisState.step !== "idle" && analysisState.step !== "done") {
      let nextState = { ...analysisState };
      let botText = "";

      switch (analysisState.step) {
        case "device":
          nextState.device = text;
          nextState.step = "ram";
          botText = `Got it — ${text}! \u2705\n\n` + getAnalysisQuestion("ram");
          break;
        case "ram":
          nextState.ram = text;
          nextState.step = "processor";
          botText = `${text} RAM noted! \u2705\n\n` + getAnalysisQuestion("processor");
          break;
        case "processor":
          nextState.processor = text.toLowerCase() === "skip" ? "Unknown" : text;
          nextState.step = "refreshRate";
          botText = `${nextState.processor === "Unknown" ? "Oke, dilewati!" : nextState.processor + " dicatat!"} \u2705\n\n` + getAnalysisQuestion("refreshRate");
          break;
        case "refreshRate":
          nextState.refreshRate = text.toLowerCase() === "skip" ? "Unknown" : text;
          nextState.step = "fps";
          botText = `${nextState.refreshRate === "Unknown" ? "Refresh rate dilewati!" : nextState.refreshRate + " dicatat!"} \u2705\n\n` + getAnalysisQuestion("fps");
          break;
        case "fps":
          nextState.fps = text;
          nextState.step = "playstyle";
          botText = `FPS status noted! \u2705\n\n` + getAnalysisQuestion("playstyle");
          break;
        case "playstyle":
          nextState.playstyle = text;
          nextState.step = "done";
          const result = classifyDevice(nextState);
          botText = result.recommendations;
          break;
      }

      setAnalysisState(nextState);
      const botMsg: ChatMessage = { role: "bot", text: botText };
      setChatMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    // Check for analysis trigger
    const q = text.toLowerCase();
    if (q.match(/^analy|device\s*analy|scan\s*my|check\s*my\s*device|^analisa/)) {
      setAnalysisState({ ...ANALYSIS_INITIAL, step: "device" });
      const botMsg: ChatMessage = { role: "bot", text: "\u{1F50D} Memulai Analisis Device...\n\nSaya akan menanyakan 6 pertanyaan singkat untuk menemukan pengaturan JillyX yang paling optimal untuk hp kamu.\n\n" + getAnalysisQuestion("device") };
      setChatMessages(prev => [...prev, botMsg]); // User msg already added
      return;
    }

    // Call Groq API
    setIsChatLoading(true);
    try {
      // Map existing messages to Groq format.
      // We only filter out the intermediate analysis questions to save tokens, but KEEP the final analysis result!
      const groqHistory: GroqMessage[] = chatMessages
        .filter(m => !m.text.includes("Starting Device Analysis") && !m.text.includes("Step "))
        .map(m => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text
        }));
      
      // Append current user message
      groqHistory.push({ role: "user", content: text });

      const replyText = await sendToGroq(groqHistory);
      const botReply: ChatMessage = { role: "bot", text: replyText };
      setChatMessages(prev => [...prev, botReply]);
    } catch (err) {
      const errorReply: ChatMessage = { role: "bot", text: "\u26A0\uFE0F Sorry, I'm having connection issues. Try again." };
      setChatMessages(prev => [...prev, errorReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    setLicenseKey(getLicenseKey() || "Unknown");
    setDeviceId(getDeviceId());
  }, []);

  return (
    <View className="flex-1 bg-brand-main">
      <StatusBar style="light" hidden={true} />

      {/* Styled Header - Fuchsia colored with rounded bottom */}
      <View className="bg-brand-primary pb-4 px-5 rounded-b-[24px] shadow-md shadow-black/50" style={{ paddingTop: (RNStatusBar.currentHeight || 24) + 8 }}>
        <View className="flex-row items-center justify-between z-50">
          <View className="flex-1 items-start justify-center relative z-50">
            <TouchableOpacity 
              className="p-2 -ml-2" 
              activeOpacity={0.6}
              onPress={() => setShowDropdownMenu(!showDropdownMenu)}
            >
              <MaterialCommunityIcons name="dots-vertical" size={26} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-[28px] font-outfit-black italic tracking-widest flex-2 text-center">
            Jilly<Text className="text-white">X</Text>
          </Text>
          <View className="flex-1 items-end justify-center">
            <Text className="text-white text-[11px] font-outfit-bold text-right" numberOfLines={2}>
              {deviceModel}
            </Text>
          </View>
        </View>
      </View>

      {/* Quote */}
      <View className="pt-6 pb-4 px-6 items-center">
        <Text className="text-white text-[13px] font-outfit-bold text-center tracking-wide">
          "The real pure ones are the JillyX"
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === "contents" ? (
          <>
            {/* Sensitivities Toggle Card */}
            <View className="rounded-[12px] p-4 mb-3 border border-brand-accent bg-brand-main">
              <View className="flex-row items-center">
                <View className="items-center justify-center mr-4 w-6">
                  <MaterialCommunityIcons name="cursor-default-click" size={24} color="#e2e8f0" />
                </View>
                <View className="flex-1 pr-3">
                  <Text className="text-brand-accent text-[14px] font-outfit-bold mb-0.5 tracking-wide">Sensitivities</Text>
                  <Text className="text-white text-[10px] font-outfit-medium leading-tight">
                    An improved sensitivities with and without DPI
                  </Text>
                </View>
                <ModernToggle
                  value={contents.sensitivities}
                  onValueChange={() => toggleContent("sensitivities")}
                />
              </View>
            </View>

            {/* Methods Toggle Card */}
            <View className="rounded-[12px] p-4 mb-3 border border-brand-accent bg-brand-main">
              <View className="flex-row items-center">
                <View className="items-center justify-center mr-4 w-6">
                  <MaterialCommunityIcons name="pistol" size={24} color="#e2e8f0" style={{ transform: [{ scaleX: -1 }] }} />
                </View>
                <View className="flex-1 pr-3">
                  <Text className="text-brand-accent text-[14px] font-outfit-bold mb-0.5 tracking-wide">Methods</Text>
                  <Text className="text-white text-[10px] font-outfit-medium leading-tight">
                    Methods to give more layer
                  </Text>
                </View>
                <ModernToggle
                  value={contents.methods}
                  onValueChange={() => toggleContent("methods")}
                />
              </View>
            </View>

            {/* Advanced Section - Toggle Container */}
            <View className="rounded-[12px] border border-brand-accent bg-brand-main mb-3 p-4">
              <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="rocket-launch-outline" size={20} color="#e2e8f0" className="mr-3" />
                <Text className="text-brand-accent text-[14px] font-outfit-bold tracking-wide">Advanced</Text>
              </View>

              {[
                { key: "memoryHeadSens" as const, label: "Memory Head Sensitivity", icon: "head-cog-outline" },
                { key: "reduceRecoilAnim" as const, label: "Reduce Recoil Animation", icon: "animation-outline" },
                { key: "fixMemoryCache" as const, label: "Fix Memory Cache", icon: "memory" },
                { key: "optimizeDevice" as const, label: "Optimize Device", icon: "cellphone-cog" },
                { key: "optimizeCode" as const, label: "Optimize Code", icon: "code-braces" },
                { key: "clearCacheCookies" as const, label: "Clear Cache & Cookies", icon: "delete-sweep-outline" },
              ].map((item) => (
                <View
                  key={item.key}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center ml-1">
                    <MaterialCommunityIcons name={item.icon as any} size={18} color="white" className="mr-4" />
                    <Text className="text-[11px] font-outfit-bold tracking-wide text-white ml-2">
                      {item.label}
                    </Text>
                  </View>
                  <ModernToggle
                    value={advanced[item.key]}
                    onValueChange={() => toggleAdvanced(item.key)}
                  />
                </View>
              ))}
            </View>

          </>
        ) : activeTab === "adjust" ? (
          <>
            <View className="rounded-[12px] border border-brand-accent bg-brand-main mb-3 p-5">
              <View className="flex-row items-center mb-6">
                <MaterialCommunityIcons name="tune" size={24} color="#e2e8f0" className="mr-3" />
                <View>
                  <Text className="text-brand-accent text-[16px] font-outfit-bold tracking-wide">Fine Tuning</Text>
                  <Text className="text-white text-[10px] font-outfit-medium leading-tight opacity-70">
                    Adjust parameters for optimal performance
                  </Text>
                </View>
              </View>

              {/* Sensitivity Slider */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white text-[13px] font-outfit-bold">Sensitivity</Text>
                  <Text className="text-brand-accent text-[13px] font-outfit-black">{Math.round(adjustments.sensitivity)}%</Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={adjustments.sensitivity}
                  onValueChange={(val) => setAdjustments(prev => ({ ...prev, sensitivity: val }))}
                  minimumTrackTintColor="#e2e8f0"
                  maximumTrackTintColor="#334155"
                  thumbTintColor="#ffffff"
                />
              </View>

              {/* Recoil Slider */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white text-[13px] font-outfit-bold">Recoil Control</Text>
                  <Text className="text-brand-accent text-[13px] font-outfit-black">{Math.round(adjustments.recoil)}%</Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={adjustments.recoil}
                  onValueChange={(val) => setAdjustments(prev => ({ ...prev, recoil: val }))}
                  minimumTrackTintColor="#e2e8f0"
                  maximumTrackTintColor="#334155"
                  thumbTintColor="#ffffff"
                />
              </View>

              {/* Touch Speed Slider */}
              <View className="mb-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white text-[13px] font-outfit-bold">Touch Speed</Text>
                  <Text className="text-brand-accent text-[13px] font-outfit-black">{Math.round(adjustments.touchSpeed)}%</Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={adjustments.touchSpeed}
                  onValueChange={(val) => setAdjustments(prev => ({ ...prev, touchSpeed: val }))}
                  minimumTrackTintColor="#e2e8f0"
                  maximumTrackTintColor="#334155"
                  thumbTintColor="#ffffff"
                />
              </View>

              {/* Apply Button */}
              {(() => {
                const hasChanged = adjustments.sensitivity !== appliedAdjustments.sensitivity || adjustments.recoil !== appliedAdjustments.recoil || adjustments.touchSpeed !== appliedAdjustments.touchSpeed;
                return (
                  <TouchableOpacity
                    className={`py-3.5 rounded-[12px] flex-row items-center justify-center mt-4 border shadow-lg ${
                      !hasChanged
                        ? "bg-[#0a0a0f] border-white/5 opacity-50"
                        : isApplyingTuning 
                          ? "bg-[#1e293b] border-white/10 shadow-black/20" 
                          : "bg-brand-secondary border-brand-accent/30 shadow-brand-accent/20"
                    }`}
                    activeOpacity={0.8}
                    disabled={!hasChanged || isApplyingTuning}
                    onPress={() => {
                      setIsApplyingTuning(true);
                      setTimeout(() => {
                        setIsApplyingTuning(false);
                        setAppliedAdjustments(adjustments);
                        Alert.alert("Success \u2705", "Tuning configurations applied successfully and saved to device memory.");
                      }, 2000);
                    }}
                  >
                    {isApplyingTuning ? (
                      <>
                        <ActivityIndicator size="small" color="#a78bfa" />
                        <Text className="text-[#a78bfa] text-[13px] font-outfit-bold ml-2">Applying...</Text>
                      </>
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={hasChanged ? "white" : "#64748b"} />
                        <Text className={`text-[13px] font-outfit-bold ml-2 ${hasChanged ? "text-white" : "text-[#64748b]"}`}>
                          {hasChanged ? "Apply Tuning" : "Tuning Saved"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })()}
            </View>
          </>
        ) : (
          <>
            {/* Hardware Tab Content */}
            <View className="rounded-[12px] border border-brand-accent bg-brand-main mb-3 p-4">
              {[
                { key: "headTracking" as const, label: "HeadTracking", desc: "Features to calibrate your gaze", icon: "pen" },
                { key: "superTouch" as const, label: "SuperTouch", desc: "Melt or touch the fabric", icon: "gesture-tap" },
                { key: "buttonTrick" as const, label: "Performance Monitor", desc: "Monitoring performance device", icon: "chart-line" },
                { key: "dpiCalculator" as const, label: "DPI Calculator", desc: selectedResolution, icon: "calculator-variant-outline" },
              ].map((item) => (
                <View
                  key={item.key}
                  className="flex-row items-center justify-between py-2.5"
                >
                  <View className="flex-row items-center flex-1 pr-4">
                    <View className="mr-4 w-6 items-center">
                      <MaterialCommunityIcons name={item.icon as any} size={18} color="white" />
                    </View>
                    <View className="flex-1 justify-center">
                      <Text className="text-brand-accent text-[12px] font-outfit-bold mb-0.5 tracking-wide">
                        {item.label}
                      </Text>
                      <Text className="text-white text-[10px] leading-tight font-outfit-medium">
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                  <ModernToggle
                    value={hardware[item.key]}
                    onValueChange={() => toggleHardware(item.key)}
                  />
                </View>
              ))}
            </View>

            {/* Resolution Section */}
            <TouchableOpacity
              className="rounded-[12px] border border-brand-accent bg-brand-main mb-3 p-4"
              activeOpacity={0.8}
              onPress={() => setShowResolutionPicker(!showResolutionPicker)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-4 w-6 items-center">
                    <MaterialCommunityIcons name="monitor-cellphone" size={20} color="#e2e8f0" />
                  </View>
                  <View>
                    <Text className="text-brand-accent text-[14px] font-outfit-bold mb-0.5 tracking-wide">Resolution Spoofer</Text>
                    <Text className="text-white text-[10px] font-outfit-medium leading-tight">
                      Current: {selectedResolution}
                    </Text>
                  </View>
                </View>
                <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                  <MaterialCommunityIcons
                    name={showResolutionPicker ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#475569"
                  />
                </View>
              </View>
            </TouchableOpacity>

            {showResolutionPicker && (
              <View className="rounded-[12px] border border-brand-accent bg-brand-main mb-3 p-3">
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {HIGH_END_DEVICES.map((res) => {
                    const isActive = selectedResolution === res.label;
                    const isActivating = activatingResolution === res.label;
                    
                    return (
                      <TouchableOpacity
                        key={res.label}
                        className={`rounded-[10px] px-3 py-3 border flex-1 ${
                          isActive
                            ? "border-brand-accent bg-slate-800/60"
                            : "border-white/10 bg-brand-surface"
                        }`}
                        activeOpacity={0.7}
                        onPress={() => applyResolution(res.label)}
                        disabled={activatingResolution !== null}
                        style={{ minWidth: "45%" }}
                      >
                        {isActivating ? (
                          <View className="flex-row justify-center items-center">
                            <ActivityIndicator size="small" color="#e2e8f0" />
                            <Text className="text-[11px] font-outfit-bold text-brand-accent ml-2">
                              Injecting...
                            </Text>
                          </View>
                        ) : (
                          <>
                            <Text
                              className={`text-[12px] font-outfit-bold text-center ${
                                isActive ? "text-brand-accent" : "text-white"
                              }`}
                            >
                              {res.label}
                            </Text>
                            <Text
                              className={`text-[9.5px] font-outfit-medium text-center mt-1 ${
                                isActive ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              {res.res}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        <View className="h-40" />
      </ScrollView>

      {/* ChatJilly FAB */}
      <View className="absolute bottom-[88px] right-5 z-20">
        <TouchableOpacity
          className="flex-row items-center bg-[#1e293b] rounded-full pl-3 pr-4 py-2.5 shadow-lg shadow-black/50 border border-white/10"
          activeOpacity={0.8}
          onPress={() => {
            if (chatMessages.length === 0) {
              setChatMessages([{ role: "bot", text: CHATJILLY_GREETING }]);
            }
            setShowChatBot(true);
          }}
        >
          <MaterialCommunityIcons name="robot-outline" size={20} color="#e2e8f0" />
          <Text className="text-[#e2e8f0] text-[11px] font-outfit-black ml-1.5 tracking-wide">ChatJilly</Text>
        </TouchableOpacity>
      </View>

      {/* Standard Bottom Navigation - Modernized */}
      <View className="absolute bottom-0 left-0 w-full bg-brand-main border-t border-white/5 pt-3 pb-6 px-6 z-10">
        <View className="flex-row justify-between items-center bg-brand-nav rounded-full px-2 py-2">
          {/* contents Tab */}
          <TouchableOpacity
            className={`flex-row items-center justify-center flex-1 py-1.5 rounded-full transition-all ${activeTab === "contents" ? "bg-white/10" : ""}`}
            onPress={() => setActiveTab("contents")}
            activeOpacity={0.8}
          >
             <MaterialCommunityIcons 
               name={activeTab === "contents" ? "file-document" : "file-document-outline"} 
               size={20} 
               color={activeTab === "contents" ? "#e2e8f0" : "#cbd5e1"} 
             />
             {activeTab === "contents" && (
               <Text className="text-[11px] font-outfit-black text-brand-accent ml-1.5 tracking-wide">
                 Contents
               </Text>
             )}
          </TouchableOpacity>

          {/* Adjust Tab */}
          <TouchableOpacity
            className={`flex-row items-center justify-center flex-1 py-1.5 rounded-full transition-all ${activeTab === "adjust" ? "bg-white/10" : ""}`}
            onPress={() => setActiveTab("adjust")}
            activeOpacity={0.8}
          >
             <MaterialCommunityIcons 
               name="tune" 
               size={20} 
               color={activeTab === "adjust" ? "#e2e8f0" : "#cbd5e1"} 
             />
             {activeTab === "adjust" && (
               <Text className="text-[11px] font-outfit-black text-brand-accent ml-1.5 tracking-wide">
                 Adjust
               </Text>
             )}
          </TouchableOpacity>

          {/* Hardware Tab */}
          <TouchableOpacity
            className={`flex-row items-center justify-center flex-1 py-1.5 rounded-full transition-all ${activeTab === "hardware" ? "bg-white/10" : ""}`}
            onPress={() => setActiveTab("hardware")}
            activeOpacity={0.8}
          >
             <MaterialCommunityIcons 
               name="hammer-wrench" 
               size={20} 
               color={activeTab === "hardware" ? "#e2e8f0" : "#cbd5e1"} 
             />
             {activeTab === "hardware" && (
               <Text className="text-[11px] font-outfit-black text-brand-accent ml-1.5 tracking-wide">
                 Hardware
               </Text>
             )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Dropdown Overlay */}
      {showDropdownMenu && (
        <TouchableOpacity 
          className="absolute top-0 left-0 right-0 bottom-0 z-[100]"
          activeOpacity={1}
          onPress={() => setShowDropdownMenu(false)}
        >
          <View className="absolute top-[85px] left-5 bg-brand-main border border-brand-accent rounded-xl shadow-2xl shadow-black min-w-[170px] overflow-hidden">
            
            {/* User Profile */}
            <TouchableOpacity 
              className="flex-row items-center px-4 py-3 border-b border-white/5"
              activeOpacity={0.7}
              onPress={() => {
                setShowDropdownMenu(false);
                setShowProfileMenu(true);
              }}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={18} color="#e2e8f0" />
              <Text className="text-white text-[13px] font-outfit-bold ml-3">User Profile</Text>
            </TouchableOpacity>

            {/* Reset Settings */}
            <TouchableOpacity 
              className="flex-row items-center px-4 py-3 border-b border-white/5"
              activeOpacity={0.7}
              onPress={() => {
                setShowDropdownMenu(false);
                Alert.alert("Reset Settings", "Are you sure you want to restore default settings?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Reset", style: "destructive", onPress: () => {
                    const defaultAdv = { memoryHeadSens: false, reduceRecoilAnim: false, fixMemoryCache: false, optimizeDevice: false, optimizeCode: false, clearCacheCookies: false };
                    const defaultCon = { sensitivities: false, methods: false };
                    const defaultHw = { headTracking: false, superTouch: false, chatBot: false, buttonTrick: false, dpiCalculator: false };
                    const defaultAdj = { sensitivity: 50, recoil: 50, touchSpeed: 50 };
                    setAdvanced(defaultAdv);
                    setContents(defaultCon);
                    setHardware(defaultHw);
                    setAdjustments(defaultAdj);
                    setAppliedAdjustments(defaultAdj);
                    setSelectedResolution("Native Device");
                    saveSettings({ advanced: defaultAdv, contents: defaultCon, hardware: defaultHw, adjustments: defaultAdj, selectedResolution: "Native Device" });
                    Alert.alert("\u2705 Success", "All settings have been restored to factory defaults.");
                  }}
                ]);
              }}
            >
              <MaterialCommunityIcons name="restore" size={18} color="#cbd5e1" />
              <Text className="text-white text-[13px] font-outfit-bold ml-3">Reset Settings</Text>
            </TouchableOpacity>

            {/* Contact Admin */}
            <TouchableOpacity 
              className="flex-row items-center px-4 py-3 border-b border-white/5"
              activeOpacity={0.7}
              onPress={() => {
                setShowDropdownMenu(false);
                Alert.alert(
                  "Contact Admin",
                  "Hubungi admin JillyX melalui:",
                  [
                    { text: "WhatsApp", onPress: () => Linking.openURL("https://wa.me/6281234567890?text=Halo%20Admin%20JillyX") },
                    { text: "Telegram", onPress: () => Linking.openURL("https://t.me/JillyXAdmin") },
                    { text: "Batal", style: "cancel" },
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="headset" size={18} color="#cbd5e1" />
              <Text className="text-white text-[13px] font-outfit-bold ml-3">Contact Admin</Text>
            </TouchableOpacity>

            {/* App Version Info (Disabled) */}
            <View className="flex-row items-center px-4 py-3 bg-white/5">
              <MaterialCommunityIcons name="information-outline" size={18} color="#64748b" />
              <View className="ml-3">
                <Text className="text-slate-400 text-[11px] font-outfit-bold">JillyX Engine</Text>
                <Text className="text-slate-500 text-[9px] font-outfit-medium">Version 2.0.4 (Stable)</Text>
              </View>
            </View>

          </View>
        </TouchableOpacity>
      )}

      {/* Full Screen Profile Modal/Overlay */}
      {showProfileMenu && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-50 justify-center items-center px-5">
          <View className="w-full bg-brand-surface border-[1.5px] border-brand-accent rounded-[24px] p-6 shadow-2xl shadow-black/40">
            <View className="flex-row justify-between items-start mb-2">
              <View className="w-16 h-16 rounded-full bg-brand-main border-[2px] border-brand-accent items-center justify-center">
                <MaterialCommunityIcons name="account" size={32} color="#e2e8f0" />
              </View>
              <TouchableOpacity 
                activeOpacity={0.7} 
                className="bg-brand-main p-2 rounded-full border border-white/10"
                onPress={() => setShowProfileMenu(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View className="mt-2 mb-6">
              <Text className="text-white text-[22px] font-outfit-black tracking-widest">JillyX Member</Text>
              <Text className="text-brand-accent text-[12px] font-outfit-bold tracking-widest uppercase mt-1">Lifetime Access</Text>
            </View>

            <View className="mb-6">
              <View>
                <Text className="text-slate-400 text-[10px] font-outfit-bold uppercase tracking-wider mb-1">License Key</Text>
                <Text className="text-white text-[13px] font-outfit-bold bg-brand-main py-3 px-4 rounded-xl border border-white/5">{licenseKey}</Text>
              </View>
              <View className="mt-4">
                <Text className="text-slate-400 text-[10px] font-outfit-bold uppercase tracking-wider mb-1">Device ID</Text>
                <Text className="text-white text-[13px] font-outfit-bold bg-brand-main py-3 px-4 rounded-xl border border-white/5">{deviceId}</Text>
              </View>
              <View className="mt-4">
                <Text className="text-slate-400 text-[10px] font-outfit-bold uppercase tracking-wider mb-1">Device Model</Text>
                <Text className="text-white text-[13px] font-outfit-bold bg-brand-main py-3 px-4 rounded-xl border border-white/5">{deviceModel}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/30 rounded-xl py-3.5 flex-row justify-center items-center"
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert("Logout Account", "Are you sure you want to logout your account from this device?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: () => {
                      setShowProfileMenu(false);
                      if (onLicenseExpired) onLicenseExpired();
                  }}
                ]);
              }}
            >
              <MaterialCommunityIcons name="logout" size={18} color="#f87171" />
              <Text className="text-red-400 text-sm font-outfit-bold ml-2">Logout Akun</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ==================== ChatJilly Chat Modal ==================== */}
      {showChatBot && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-[#060608] z-[200]" style={{ elevation: 999 }}>
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            {/* Chat Header */}
            <View className="bg-[#0e0e13] pb-4 px-5 border-b border-white/5 flex-row items-center justify-between" style={{ paddingTop: (RNStatusBar.currentHeight || 24) + 8 }}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-[#141419] items-center justify-center mr-3 border border-white/10 shadow-md">
                  <MaterialCommunityIcons name="robot-outline" size={24} color="#e2e8f0" />
                </View>
                <View>
                  <Text className="text-white text-[18px] font-outfit-black tracking-wide">ChatBot</Text>
                  <Text className="text-[#94a3b8] text-[10px] font-outfit-bold tracking-widest uppercase mt-0.5">{"\u2022"} AI Optimizer</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="p-2 rounded-full bg-white/5 mr-2"
                  activeOpacity={0.7}
                  onPress={() => {
                    setChatMessages([]);
                    setAnalysisState(ANALYSIS_INITIAL);
                    lastAnimatedMsgIndex.current = -1;
                  }}
                >
                  <MaterialCommunityIcons name="broom" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="p-2 rounded-full bg-white/5"
                  activeOpacity={0.7}
                  onPress={() => setShowChatBot(false)}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Chat Messages */}
            <FlatList
              ref={chatListRef}
              data={chatMessages}
              keyExtractor={(_, i) => String(i)}
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item, index }) => {
                const parsedSettings = item.role === "bot" ? parseChatSettings(item.text) : null;
                const shouldAnimate = item.role === "bot" && index === chatMessages.length - 1 && !isChatLoading && index > lastAnimatedMsgIndex.current;
                if (shouldAnimate) lastAnimatedMsgIndex.current = index;

                return (
                  <View className={`mb-4 flex-col ${item.role === "user" ? "items-end" : "items-start"}`}>
                    <View className={`flex-row ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                      {item.role === "bot" && (
                        <View className="w-8 h-8 rounded-full bg-[#141419] items-center justify-center mr-2 mt-auto mb-1 border border-white/5 shadow-sm">
                          <MaterialCommunityIcons name="robot-outline" size={16} color="#e2e8f0" />
                        </View>
                      )}
                      <View
                        className={`rounded-[20px] px-4 py-3.5 max-w-[78%] shadow-sm ${
                          item.role === "user"
                            ? "bg-[#e2e8f0] rounded-br-[4px]"
                            : "bg-[#16161c] border border-white/10 rounded-tl-[4px]"
                        }`}
                      >
                        {item.role === "user" ? (
                          <Text className="text-[13px] font-outfit-medium leading-6 text-[#0a0a0f]">
                            {item.text}
                          </Text>
                        ) : (
                          <TypewriterText
                            text={item.text}
                            enabled={shouldAnimate}
                            delay={10}
                            style={{ color: "#f1f5f9", fontSize: 13, fontFamily: "Outfit-Medium", lineHeight: 22 }}
                          />
                        )}
                      </View>
                    </View>
                    

                  </View>
                );
              }}
              ListFooterComponent={() => 
                isChatLoading ? (
                  <View className="mb-4 flex-row justify-start">
                    <View className="w-8 h-8 rounded-full bg-[#141419] items-center justify-center mr-2 mt-auto mb-1 border border-white/5">
                      <MaterialCommunityIcons name="robot-outline" size={16} color="#e2e8f0" />
                    </View>
                    <View className="bg-[#16161c] border border-white/10 rounded-[20px] rounded-tl-[4px] px-5 py-4 flex-row items-center shadow-sm">
                      <ActivityIndicator size="small" color="#94a3b8" />
                      <Text className="text-[#94a3b8] text-xs font-outfit-medium ml-2">Thinking...</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Chat Input */}
            <View className="bg-[#0e0e13] px-4 py-4 pb-8 border-t border-white/5">
              <View className="flex-row items-end bg-[#1a1a24] rounded-[24px] border border-white/10 px-4 py-2 shadow-lg">
                <TextInput
                  className="flex-1 text-white text-[14px] font-outfit-medium py-2 max-h-24"
                  placeholder="Tanya ChatBot..."
                  placeholderTextColor="#64748b"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleChatSend}
                  returnKeyType="send"
                  multiline
                  textAlignVertical="center"
                />
                <TouchableOpacity
                  className={`ml-3 mb-1 w-9 h-9 rounded-full items-center justify-center ${
                    chatInput.trim() ? "bg-[#e2e8f0]" : "bg-[#242433]"
                  }`}
                  activeOpacity={0.7}
                  onPress={handleChatSend}
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  <MaterialCommunityIcons 
                    name="send" 
                    size={16} 
                    color={chatInput.trim() ? "#0a0a0f" : "#64748b"} 
                    style={{ marginLeft: 3 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

function ActivationScreen({ onActivated }: { onActivated: () => void }) {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a valid license key.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const result = await activateLicense(licenseKey.trim(), deviceId);

      if (result.success) {
        saveLicenseKey(licenseKey.trim());
        Alert.alert("Success", result.message);
        onActivated();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-main"
    >
      <StatusBar style="light" />
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo / Icon */}
        {/* <View className="w-24 h-24 rounded-[32px] bg-brand-secondary items-center justify-center mb-6 shadow-xl shadow-fuchsia-900/50">
          <MaterialCommunityIcons name="shield-key" size={48} color="white" />
        </View> */}

        {/* Title */}
        <Text className="text-white text-[32px] font-outfit-black italic tracking-widest mb-2 shadow-sm">
          Jilly<Text className="text-white">X</Text>
        </Text>
        <Text className="text-pink-100/80 text-sm mb-10 text-center font-outfit-medium">
          Enter your license key to continue
        </Text>

        {/* Card */}
        <View className="w-full bg-brand-main rounded-[16px] p-6 border-[1.5px] border-brand-accent shadow-lg shadow-black/40">
          {/* Label */}
          <Text className="text-brand-accent text-xs font-outfit-black mb-2 tracking-wider uppercase">
            License Key
          </Text>

          {/* Input */}
          <TextInput
            className={`w-full bg-brand-surface text-white text-base font-outfit-medium px-4 py-3.5 rounded-xl border ${
              error ? "border-red-500" : "border-white/10"
            } mb-1`}
            placeholder="jilly-android-XXXXX"
            placeholderTextColor="#cbd5e1"
            value={licenseKey}
            onChangeText={(text) => {
              setLicenseKey(text);
              if (error) setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Error */}
          {error ? (
            <Text className="text-red-400 text-sm mt-1 mb-3 font-outfit-bold">{error}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center shadow-md ${
              loading ? "bg-brand-secondary/70" : "bg-brand-primary active:bg-brand-secondary"
            }`}
            onPress={handleActivate}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-[15px] font-outfit-black tracking-widest uppercase">
                Activate
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer hint */}
        <Text className="text-pink-100/40 text-xs mt-8 text-center font-outfit-bold">
          Need a license key? Contact your administrator.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_900Black
  });

  // Core validation function — always checks with the server
  const validateLicense = async (): Promise<boolean> => {
    const key = getLicenseKey();
    if (!key) return false;

    try {
      const deviceId = getDeviceId();
      const result = await activateLicense(key, deviceId);

      if (result.success) {
        return true;
      } else {
        removeLicenseKey();
        return false;
      }
    } catch (err) {
      console.error("License validation error:", err);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const valid = await validateLicense();
      setIsLicensed(valid);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLicensed) return;

    const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const intervalId = setInterval(async () => {
      const valid = await validateLicense();
      if (!valid) {
        setIsLicensed(false);
        Alert.alert(
          "License Expired",
          "Your license has expired or been revoked. Please re-activate.",
          [{ text: "OK" }]
        );
      }
    }, RECHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isLicensed]);

  useEffect(() => {
    if (!isLicensed) return;

    const handleAppState = async (nextAppState: string) => {
      if (nextAppState === "active") {
        const valid = await validateLicense();
        if (!valid) {
          setIsLicensed(false);
          Alert.alert(
            "License Expired",
            "Your license has expired or been revoked. Please re-activate.",
            [{ text: "OK" }]
          );
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [isLicensed]);

  if (isLicensed === null || !fontsLoaded) {
    return (
      <View className="flex-1 bg-brand-main justify-center items-center">
        <ActivityIndicator size="large" color="#e2e8f0" />
        <Text className="text-slate-400 text-xs mt-4" style={{ fontFamily: 'Outfit_500Medium' }}>
          JillyX is loading...
        </Text>
      </View>
    );
  }

  if (isLicensed) {
    return (
      <HomeScreen
        onLicenseExpired={() => {
          removeLicenseKey();
          setIsLicensed(false);
        }}
      />
    );
  }

  return <ActivationScreen onActivated={() => setIsLicensed(true)} />;
}

