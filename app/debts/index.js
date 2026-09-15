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
import DebtCard from "../../src/components/DebtCard";
import EmptyState from "../../src/components/EmptyState";
import FAB from "../../src/components/FAB";
import AddDebtSheet from "../../src/components/AddDebtSheet";
import { useTheme } from "../../src/context/ThemeContext";
import { subscribeToDebt, getDebtList } from "../../src/services/debtService";
import { useAuthContext } from "../../src/context/AuthContext";

export default function DebtLend() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const [debts, setDebts] = React.useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const sheetRef = useRef(null);

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDebt(setDebts);
    return unsub;
  }, [user?.uid]);

  // Debts already stay live via subscribeToDebt above; this gives the
  // pull gesture a real round-trip via the existing getDebtList() service.
  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await getDebtList();
      setDebts(data);
    } catch (e) {
      // no-op - the live subscription above will keep things in sync regardless
    } finally {
      setRefreshing(false);
    }
  };

  const isEmpty = debts.length === 0;

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
          Debt & Lend
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
            icon="people-outline"
            title="No debts or loans yet"
            subtitle="Track money you borrow or lend to others."
          />
        ) : (
          debts.map((d) => <DebtCard key={d.id} debt={d} />)
        )}
      </ScrollView>

      <FAB onPress={() => sheetRef.current?.open()} />
      <AddDebtSheet ref={sheetRef} />
    </SafeAreaView>
  );
}
