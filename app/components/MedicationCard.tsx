import React from 'react';
import { View, Text, StyleSheet, Platform, NativeModules, TouchableOpacity } from 'react-native';
import { colors } from "../theme"

const MedicationCard = ({ medication, onPressEditMedication,
    onPressDeleteMedication }) => {
    const deviceLanguage =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier

    const fixedLocale = deviceLanguage ? deviceLanguage.replace('_', '-') : 'en-US'

    const renderField = (label, value) => {
        if (value !== "" && label !== "Times Taken At") {
            return (
                <>
                <Text style={styles.label}>{label}:</Text>
                <Text>{value}</Text>
                </>
            );
        } else if (value !== undefined && label === "Times Taken At") {
            return (
                <>
                <Text style={styles.label}>{label}:</Text>
                <Text>{value.map((time) => new Date(time).toLocaleString(fixedLocale, { hour: 'numeric', minute: 'numeric', hour12: true })).join(', ')}</Text>
                </>
            )
        }
        return null;
    };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>{medication.name}</Text>
        <View style={styles.columns}>
            {renderField('Dose', medication.dose)}
            {renderField('Form', medication.form)}
            {renderField('Bottle Quantity', medication.bottleQuantity)}
            {renderField('Schedule', medication.schedule)}
            {renderField('Times Taken At', medication.timesTaken)}
            {renderField('Start Date', medication.startDate)}
            {renderField('End Date', medication.endDate)}
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => onPressEditMedication(medication)}>
            <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => onPressDeleteMedication(medication)}>
            <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  columns: {
    maxHeight: "60%",
    flexDirection: 'column',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.palette.primary200,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    backgroundColor: colors.palette.primary200,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MedicationCard;