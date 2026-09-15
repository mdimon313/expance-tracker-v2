import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Card from "../../src/components/Card";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useAuthContext } from "../../src/context/AuthContext";
import {
  logout,
  enableBiometricLogin,
  disableBiometricLogin,
  isBiometricLoginEnabled,
  getBiometricCapabilities,
} from "../../src/services/authService";
import { pickAndUploadProfilePhoto } from "../../src/services/storageService";
import { SUPPORTED_LANGUAGES } from "../../src/i18n";
import { CURRENCIES } from "../../src/constants/categories";

function Row({ icon, label, value, onPress, right }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3.5">
      <Ionicons name={icon} size={20} color="#10B981" style={{ width: 28 }} />
      <Text className="flex-1 text-base" style={{ color: colors.text }}>
        {label}
      </Text>
      {right ||
        (value ? <Text className="text-gray-400 text-sm">{value}</Text> : null)}
    </Pressable>
  );
}

export default function Settings() {
  const { colors, preference, setThemePreference } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const { currency, changeCurrency } = useCurrency();
  const { profile, user, refreshProfile } = useAuthContext();
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSettingsState = useCallback(async () => {
    const [bio, caps, location] = await Promise.all([
      isBiometricLoginEnabled(),
      getBiometricCapabilities(),
      Location.getForegroundPermissionsAsync(),
    ]);
    setBioEnabled(bio);
    setBioSupported(caps.hasHardware && caps.isEnrolled);
    setLocationStatus(location.status);
  }, []);

  useEffect(() => {
    loadSettingsState();
  }, [loadSettingsState]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSettingsState(), refreshProfile()]);
    } finally {
      setRefreshing(false);
    }
  };

  /* const toggleBiometric = async (val) => {
    try {
      if (val) await enableBiometricLogin();
      else await disableBiometricLogin();
      setBioEnabled(val);
    } catch (e) {
      setBioEnabled(false);
    }
  }; */

  const handlePhoto = async () => {
    try {
      await pickAndUploadProfilePhoto();
      await refreshProfile();
    } catch (e) {}
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const cycleTheme = () => {
    const order = ["system", "light", "dark"];
    const next = order[(order.indexOf(preference) + 1) % order.length];
    setThemePreference(next);
  };

  const cycleCurrency = () => {
    const next =
      CURRENCIES[(CURRENCIES.indexOf(currency) + 1) % CURRENCIES.length];
    changeCurrency(next);
  };

  const cycleLanguage = () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    const next = codes[(codes.indexOf(language) + 1) % codes.length];
    changeLanguage(next);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <ScrollView
        className="px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        <Text
          className="text-2xl font-bold mb-4"
          style={{ color: colors.text }}
        >
          {t("settings.title")}
        </Text>

        <Card className="mb-4 items-center py-6">
          <Pressable onPress={handlePhoto}>
            {profile?.photoURL ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
                <Ionicons name="person" size={36} color="#10B981" />
              </View>
            )}
          </Pressable>
          <Text
            className="font-semibold text-lg mt-3"
            style={{ color: colors.text }}
          >
            {profile?.name || user?.displayName}
          </Text>
          <Text className="text-gray-400 text-sm">
            {profile?.email || user?.email}
          </Text>
        </Card>

        <Card className="mb-4">
          <Row
            icon="color-palette-outline"
            label={t("settings.appearance")}
            value={t(`settings.${preference}`)}
            onPress={cycleTheme}
          />
          <Row
            icon="language-outline"
            label={t("settings.language")}
            value={SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
            onPress={cycleLanguage}
          />
          <Row
            icon="cash-outline"
            label={t("settings.currency")}
            value={currency}
            onPress={cycleCurrency}
          />
          {/* <Row
            icon="finger-print-outline"
            label={t("settings.biometricLoginToggle")}
            right={
              <Switch
                value={bioEnabled}
                onValueChange={toggleBiometric}
                disabled={!bioSupported}
                trackColor={{ true: "#10B981" }}
              />
            }
          /> */}

          {/* <Row
            icon="location-outline"
            label={t("settings.locationPermission")}
            value={
              locationStatus === "granted"
                ? t("settings.allowed")
                : t("settings.denied")
            }
          /> */}
        </Card>

        {/* <Card className="mb-4">
          <Row
            icon="download-outline"
            label={t("settings.exportData")}
            onPress={() => {}}
            right={
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            }
          />
          <Row
            icon="notifications-outline"
            label={t("settings.notifications")}
            onPress={() => {}}
            right={
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            }
          />
        </Card> */}

        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center py-4"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-expense font-semibold ml-2">
            {t("settings.logout")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
