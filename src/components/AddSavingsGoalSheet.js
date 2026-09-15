import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, TextInput } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import AmountInput from "./AmountInput";
import Button from "./Button";
import { createSavings } from "../services/savingsService";

// Opened from the Savings Goals screen's FAB. New goals always start at
// currentAmount 0 - "add money" against a goal is a separate action.
const AddSavingsGoalSheet = forwardRef((props, ref) => {
  const sheetRef = useRef(null);
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const snapPoints = useMemo(() => ["55%"], []);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
    close: () => sheetRef.current?.dismiss(),
  }));

  const reset = () => {
    setName("");
    setAmount("");
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await createSavings({
        name: name.trim(),
        targetAmount: Number(amount),
        currentAmount: 0,
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
          {t("savings.addGoal")}
        </Text>

        <AmountInput value={amount} onChangeText={setAmount} autoFocus color="#10B981" />

        <Text className="text-xs font-medium text-gray-400 mb-2 ml-0.5">
          {t("savings.goalName")}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("savings.goalNamePlaceholder")}
          placeholderTextColor="#94A3B8"
          className="rounded-2xl px-4 py-3 mb-6"
          style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9", color: colors.text }}
        />

        <Button
          title={t("common.save")}
          onPress={handleSave}
          loading={saving}
          disabled={!amount || !name.trim()}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default AddSavingsGoalSheet;
