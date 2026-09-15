import React, { useRef, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SavingsGoalCard from "../../src/components/SavingsGoalCard";
import EmptyState from "../../src/components/EmptyState";
import FAB from "../../src/components/FAB";
import AddSavingsGoalSheet from "../../src/components/AddSavingsGoalSheet";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  subscribeToSavings,
  getSavingsList,
} from "../../src/services/savingsService";
import { useAuthContext } from "../../src/context/AuthContext";

export default function SavingsGoals() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const [goals, setGoals] = React.useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef(null);

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSavings(setGoals);
    return unsub;
  }, [user?.uid]);

  // Goals already stay live via subscribeToSavings above; this gives the
  // pull gesture a real round-trip via the existing getSavingsList() service.
  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await getSavingsList();
      setGoals(data);
    } catch (e) {
      // no-op - the live subscription above will keep things in sync regardless
    } finally {
      setRefreshing(false);
    }
  };

  const isEmpty = goals.length === 0;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View className="flex-row items-center px-5 pt-2 pb-3">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-xl font-bold ml-2" style={{ color: colors.text }}>
          Savings Goals
        </Text>
      </View>
      <ScrollView
        className="px-5"
        contentContainerStyle={
          isEmpty ? { flexGrow: 1, paddingBottom: 140 } : { paddingBottom: 140 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        {isEmpty ? (
          <EmptyState
            icon="rocket-outline"
            title="No savings goals yet"
            subtitle={t("savings.noGoalsSubtitle")}
          />
        ) : (
          goals.map((g) => <SavingsGoalCard key={g.id} goal={g} />)
        )}
      </ScrollView>

      <FAB onPress={() => sheetRef.current?.open()} />
      <AddSavingsGoalSheet ref={sheetRef} />
    </SafeAreaView>
  );
}
