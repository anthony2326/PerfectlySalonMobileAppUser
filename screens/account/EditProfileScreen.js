import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../utils/supabase";

export default function EditProfileScreen({ navigation, route }) {
  const { userData } = route.params;
  const [name, setName] = useState(userData.name);
  const [contact, setContact] = useState(userData.contact_number);
  const [age, setAge] = useState(String(userData.age));

  const handleSave = async () => {
    if (!name || !contact || !age) return Alert.alert("Error", "All fields are required");

    const { error } = await supabase
      .from("users")
      .update({ name, contact_number: contact, age: parseInt(age) })
      .eq("id", userData.id);

    if (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile");
    } else {
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Contact Number" value={contact} onChangeText={setContact} />
        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "600", marginLeft: 10 },
  form: { gap: 16 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saveButton: {
    backgroundColor: "#e91e63",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
