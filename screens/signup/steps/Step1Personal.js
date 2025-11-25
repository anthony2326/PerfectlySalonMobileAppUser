import { View, Text, TextInput, TouchableOpacity } from "react-native"
import { step1Styles as styles } from "../styles/step1.styles"
import { PHONE_LENGTH } from "../utils/constants"

export const Step1Personal = ({ name, setName, age, setAge, contactNumber, setContactNumber, onNext, loading }) => {
  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          placeholderTextColor="#999"
          autoCapitalize="words"
          editable={!loading}
          maxLength={100}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Enter your age"
          placeholderTextColor="#999"
          keyboardType="numeric"
          editable={!loading}
          maxLength={3}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={contactNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "")
            if (cleaned.length <= PHONE_LENGTH) {
              setContactNumber(cleaned)
            }
          }}
          placeholder="09123456789"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          editable={!loading}
          maxLength={PHONE_LENGTH}
        />
      </View>
      <TouchableOpacity
        style={[styles.nextButton, loading && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </>
  )
}
