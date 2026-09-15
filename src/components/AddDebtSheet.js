import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import AmountInput from "./AmountInput";
import Button from "./Button";
import { createDebt } from "../services/debtService";

// Due-date is a quick-pick of common windows rather than a full date
// picker, matching the app's existing chip-based selection pattern and
// avoiding a new date-picker dependency.
const DUE_DATE_OPTIONS = [
  { days: 7, key: "debt.days7" },
  { days: 15, key: "debt.days15" },
  { days: 30, key: "debt.days30" },
  { days: 60, key: "debt.days60" },
];

// Opened from the Debt & Lend screen's FAB. New entries always start
// pending with remainingAmount equal to the full amount.
const AddDebtSheet = forwardRef((props, ref) => {
  const sheetRef = useRef(null);
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [direction, setDirection] = useState("borrow"); // "borrow" | "lend"
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const snapPoints = useMemo(() => ["72%"], []);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
    close: () => sheetRef.current?.dismiss(),
  }));

  const reset = () => {
    setDirection("borrow");
    setPerson("");
    setAmount("");
    setDueDays(30);
  };

  const handleSave = async () => {
    if (!person.trim() || !amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await createDebt({
        person: person.trim(),
        direction,
        amount: Number(amount),
        remainingAmount: Number(amount),
        dueDate: dayjs().add(dueDays, "day").toISOString(),
        status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      sheetRef.current?.dismiss();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const renderBackdrop = useCallback(
    (p) => (
      <BottomSheetBackdrop {...p} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );
  const accentColor = direction === "lend" ? "#10B981" : "#EF4444";

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: "#94A3B8" }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
          {t("debt.addDebt")}
        </Text>

        <View
          className="flex-row rounded-2xl p-1 mb-2"
          style={{ backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }}
        >
          {["borrow", "lend"].map((k) => (
            <Pressable
              key={k}
              onPress={() => setDirection(k)}
              className={`flex-1 py-2.5 rounded-xl items-center ${direction === k ? (k === "lend" ? "bg-primary" : "bg-expense") : ""}`}
            >
              <Text className={direction === k ? "text-white font-semibold" : "text-gray-400 font-medium"}>
                {t(`debt.${k}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <AmountInput value={amount} onChangeText={setAmount} color={accentColor} />

        <TextInput
          value={person}
          onChangeText={setPerson}
          placeholder={t("debt.person")}
          placeholderTextColor="#94A3B8"
          className="rounded-2xl px-4 py-3 mb-4"
          style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9", color: colors.text }}
        />

        <Text className="text-xs font-medium text-gray-400 mb-2 ml-0.5">{t("debt.dueDate")}</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {DUE_DATE_OPTIONS.map((opt) => {
            const active = dueDays === opt.days;
            return (
              <Pressable
                key={opt.days}
                onPress={() => setDueDays(opt.days)}
                className={`px-4 py-2.5 rounded-2xl ${active ? "bg-primary" : ""}`}
                style={!active ? { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" } : null}
              >
                <Text style={{ color: active ? "#fff" : colors.text }} className="font-medium text-sm">
                  {t(opt.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={t("common.save")}
          onPress={handleSave}
          loading={saving}
          disabled={!person.trim() || !amount}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default AddDebtSheet;
