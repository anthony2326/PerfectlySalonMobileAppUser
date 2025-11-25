import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BackHandler } from "react-native";
import supabase from "../../utils/supabase";

export default function AccountScreen({ navigation, userData }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
   

  useEffect(() => {
    loadUserProfile();

    const channel = supabase
      .channel(`user-verification-${userData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userData.id}`,
        },
        (payload) => {
          setUserProfile(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userData.id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ DELETE ACCOUNT FUNCTION (uses delete_user_account SQL function)
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc(
                "delete_user_account",
                { p_user_id: userData.id }
              );

              if (error) {
                console.error("Error deleting account:", error);
                Alert.alert("Error", "Failed to delete account.");
                return;
              }

              if (data && data[0]?.success) {
                Alert.alert("Deleted", "Your account has been permanently removed.");
                await supabase.auth.signOut();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              } else {
                Alert.alert("Error", data[0]?.message || "Could not delete account.");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Unexpected issue deleting account.");
            }
          },
        },
      ]
    );
  };

  if (loading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Dashboard")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity onPress={loadUserProfile} style={styles.backButton}>
          <Ionicons name="refresh" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <Text style={styles.userName}>{userProfile?.name}</Text>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.infoCard}>
              {/* Full Name */}
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="id-card-outline" size={20} color="#6b7280" />
                  <Text style={styles.infoLabelText}>Full Name</Text>
                </View>
                <Text style={styles.infoValue}>{userProfile?.name || "N/A"}</Text>
              </View>

              <View style={styles.divider} />

              {/* Username */}
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                  <Text style={styles.infoLabelText}>Username</Text>
                </View>
                <Text style={styles.infoValue}>{userProfile?.username || "N/A"}</Text>
              </View>

              <View style={styles.divider} />

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                  <Text style={styles.infoLabelText}>Email</Text>
                </View>
                <Text style={styles.infoValue}>{userProfile?.email || "N/A"}</Text>
              </View>

              <View style={styles.divider} />

              {/* Contact */}
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="call-outline" size={20} color="#6b7280" />
                  <Text style={styles.infoLabelText}>Contact Number</Text>
                </View>
                <Text style={styles.infoValue}>
                  {userProfile?.contact_number || "N/A"}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Age */}
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text style={styles.infoLabelText}>Age</Text>
                </View>
                <Text style={styles.infoValue}>{userProfile?.age || "N/A"}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditProfile", { userData })}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="create-outline" size={22} color="#e91e63" />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("ChangePassword", { userData })}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="lock-closed-outline" size={22} color="#e91e63" />
                <Text style={styles.actionButtonText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#fee2e2" }]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="trash-outline" size={22} color="#dc2626" />
                <Text style={[styles.actionButtonText, { color: "#dc2626" }]}>
                  Delete Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "600", color: "#ffffff" },
  userName: { fontSize: 24, fontWeight: "700", color: "#1f2937", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937", marginBottom: 12 },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabelText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#1f2937", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f3f4f6" },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionButtonContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionButtonText: { fontSize: 16, color: "#1f2937", fontWeight: "500" },
  loadingText: { textAlign: "center", marginTop: 10, color: "#6b7280" },
});
