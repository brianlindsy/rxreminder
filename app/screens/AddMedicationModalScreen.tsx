import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { TextStyle, View, ViewStyle, Modal, ScrollView, Platform, NativeModules } from "react-native"
import { Button, TextField, Text } from "app/components"
import { Medication, MedicationModel, useStores } from "app/models"
import uuid from 'react-native-uuid'
import DateTimePicker, {DateTimePickerEvent, DateTimePickerAndroid} from '@react-native-community/datetimepicker'
import DropDownPicker from "react-native-dropdown-picker"
import {colors, spacing} from "../theme"
import { auth } from "../../firebaseConfig"
import * as Notifications from 'expo-notifications'

interface AddMedicationModalScreenProps {
  isVisible?: boolean
  setShowAddMedicationModal: Function
  screenType: String
  initMedication?: Medication
  setMedicationToEdit?: Function
  setRefreshing?: Function
  deleteNotifications?: Function
}

export const AddMedicationModalScreen: FC<AddMedicationModalScreenProps> = observer(function AddMedicationModalScreen(_props) {

  const { deleteNotifications, setRefreshing, setShowAddMedicationModal, isVisible, screenType, initMedication, setMedicationToEdit } = _props

  const deviceLanguage =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier

  const fixedLocale = deviceLanguage ? deviceLanguage.replace('_', '-') : 'en-US'

  const [name, setName] = React.useState(initMedication?.name || "")
  const [dose, setDose] = React.useState(initMedication?.dose || "")
  const [form, setForm] = React.useState(initMedication?.form || "")
  const [bottleQuantity, setBottleQuantity] = React.useState(initMedication?.bottleQuantity || "")
  const [schedule, setSchedule] = React.useState(initMedication?.schedule || "")
  const [startDate, setStartDate] = React.useState(initMedication?.startDate 
    ? new Date(initMedication.startDate) : new Date(Date.now()))
  const [endDate, setEndDate] = React.useState(initMedication?.endDate 
    ? new Date(initMedication.endDate) : new Date(Date.now()))
  const [showStartDatePicker, setShowStartDatePicker] = React.useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = React.useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false)
  const [isQuantityOpen, setIsQuantityOpen] = React.useState(false)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [timesTakenIsOpen, setTimesTakenIsOpen] = React.useState(false)
  const [timePickerIndex, setTimePickerIndex] = React.useState(0)
  const timePickersToShow = schedule === "Once a day" ? 1
    : schedule === "Twice a day" ? 2
    : schedule === "Three times a day" ? 3
    : schedule === "Four times a day" ? 4
    : 1
  const [timesTaken, setTimesTaken] = React.useState(initMedication?.timesTaken 
    || Array(timePickersToShow).fill(new Date(Date.now())))
  const isTimesADay = schedule === "Once a day" 
    || schedule === "Twice a day" 
    || schedule === "Three times a day" 
    || schedule === "Four times a day"
  
  const isIosDevice = Platform.OS === 'ios'

  const showTimePickers = schedule && schedule !== "As needed"

  const { medicationStore } = useStores()

  const onChangeStartDate = (event: DateTimePickerEvent, date: Date) => {
    setStartDate(date)
    setShowStartDatePicker(false)
  }

  const onChangeEndDate = (event: DateTimePickerEvent, date: Date) => {
    setEndDate(date)
    setShowEndDatePicker(false)
  }

  const createNotifications = async (medication: Medication) => {
    medication !== undefined && medication.setProp("notificationIdentifiers", [])

    const isTakenMultipleADay = schedule === "Once a day"
    || schedule === "Twice a day"
    || schedule === "Three times a day"
    || schedule === "Four times a day"

    if (isTakenMultipleADay) {
      if (isIosDevice) {
        console.log("iOS")
        const ids = []
        for (let timeInDay of timesTaken) {
          const date = new Date(timeInDay)
          const hours = date.getHours()
          const minutes = date.getMinutes()

          const notification = {
            content: {
              title: "Hi there, time to take your medication.",
              body: `${name} - ${dose} ${form}`,
              data: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }
            },
            ios: {
              sound: true,
              _displayInForeground: true,
            },
            trigger: {
              hour: hours,
              minute: minutes,
              repeats: true,
            },
          }
          const notificationId = await Notifications.scheduleNotificationAsync(notification)
          ids.push(notificationId)
          return ids
        }
      } else {
        let ids = []
        for (let timeInDay of timesTaken) {
          const date = new Date(timeInDay)
          const hours = date.getHours()
          const minutes = date.getMinutes()

          const content: Notifications.NotificationContentInput = {
            title: "Hi there, time to take your medication.",
            body: `${name} - ${dose} ${form}`,
            data: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }
          }

          const input: Notifications.NotificationRequestInput = {
            content: content,
            trigger: {
              hour: hours,
              minute: minutes,
              repeats: true
            },
          }
          const notificationId = await Notifications.scheduleNotificationAsync(input)
          ids.push(notificationId)
        }
        return ids
      }
    }
    return []
  }
  
  const saveMedication = async () => {
    setRefreshing(true)
    const isAddScreen = screenType === "add"

    if (isAddScreen) {
      const random = uuid.v4().toString()

      const userId = auth?.currentUser?.uid

      if(!userId) {
        console.log("User is not logged in")
        return
      }

      let toSave: Medication = MedicationModel.create({
        guid: random,
        name: name,
        dose: dose,
        form: form,
        bottleQuantity: bottleQuantity,
        schedule: schedule,
        timesTaken: timesTaken.map(time => time.toString()),
        userId: userId,
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
      })

      let ids = await createNotifications(toSave)

      toSave.setProp("notificationIdentifiers", ids)

      medicationStore.saveMedication(toSave)
    } else {
      const timeInDayChanged = initMedication.timesTaken !== timesTaken

      let toUpdate: Medication = initMedication

      if (timeInDayChanged) {
        deleteNotifications(toUpdate.notificationIdentifiers)
        let ids = await createNotifications(toUpdate)

        toUpdate.setProp("notificationIdentifiers", ids)
        toUpdate.setProp("name", name)
        toUpdate.setProp("dose", dose)
        toUpdate.setProp("form", form)
        toUpdate.setProp("bottleQuantity", bottleQuantity)
        toUpdate.setProp("schedule", schedule)
        toUpdate.setProp("timesTaken", timesTaken.map(time => time.toString()))
        toUpdate.setProp("startDate", startDate.toDateString())
        toUpdate.setProp("endDate", endDate.toDateString())
      } else {
        toUpdate.setProp("name", name)
        toUpdate.setProp("dose", dose)
        toUpdate.setProp("form", form)
        toUpdate.setProp("bottleQuantity", bottleQuantity)
        toUpdate.setProp("schedule", schedule)
        toUpdate.setProp("startDate", startDate.toDateString())
        toUpdate.setProp("endDate", endDate.toDateString())
      }

      medicationStore.updateMedication(toUpdate)
    }
    setShowAddMedicationModal(false)
    setRefreshing(false)
  }

  const cancelEdit = () => {
    setRefreshing(true)
    setShowAddMedicationModal(false)
    setMedicationToEdit(undefined)
    setRefreshing(false)
  }

  const schedules = [
    {label: "Once a day", value: "Once a day"},
    {label: "Twice a day", value: "Twice a day"},
    {label: "Three times a day", value: "Three times a day"},
    {label: "Four times a day", value: "Four times a day"},
    {label: "Every other day", value: "Every other day"},
    {label: "Every three days", value: "Every three days"},
    {label: "Every week", value: "Every week"},
    {label: "Every month", value: "Every month"},
    {label: "Every year", value: "Every year"},
    {label: "As needed", value: "As needed"},
  ]

  const medicationFormOptions = [
    {label: "Tablet", value: "Tablet"},
    {label: "Capsule", value: "Capsule"},
    {label: "Liquid", value: "Liquid"},
    {label: "Injection", value: "Injection"},
    {label: "Inhaler", value: "Inhaler"},
    {label: "Patch", value: "Patch"},
    {label: "Suppository", value: "Suppository"},
    {label: "Cream", value: "Cre"},
    {label: "Ointment", value: "Ointment"},
    {label: "Drops", value: "Drops"},
    {label: "Spray", value: "Spray"},
    {label: "Other", value: "Other"},
  ]

  // Generate options for the bottle quantity dropdown from 1 to 100
  const bottleQuantityOptions = []
  for (let i = 1; i <= 100; i++) {
    bottleQuantityOptions.push({label: i.toString(), value: i.toString()})
  }

  // Generate a component that is a dropdown of all the medication schedules
  // based on the react-native-dropdown-picker library
  const ScheduleDropdown = () => {
    return (
      <DropDownPicker
        items={schedules}
        value={schedule}
        open={isScheduleOpen}
        setOpen={setIsScheduleOpen}
        setValue={setSchedule}
        onChangeValue={() => setSchedule}
        zIndex={1000}
        zIndexInverse={3000}
        listMode="MODAL"
        style={{
          backgroundColor: colors.palette.neutral200,
          borderColor: colors.palette.neutral400,
        }}
      />
    )
  }

  // Generate a component that is a dropdown for 
  // determining how many doses are in the bottle
  const BottleQuantityDropdown = () => {
    return (
      <DropDownPicker
        items={bottleQuantityOptions}
        value={bottleQuantity}
        open={isQuantityOpen}
        setOpen={setIsQuantityOpen}
        setValue={setBottleQuantity}
        zIndex={2000}
        zIndexInverse={2000}
        listMode="MODAL"
        style={{
          backgroundColor: colors.palette.neutral200,
          borderColor: colors.palette.neutral400,
        }}
      />
    )
  }

  // Generate a component that is a dropdown for
  // determining the form of the medication
  const MedicationFormDropdown = () => {
    return (
      <DropDownPicker
        items={medicationFormOptions}
        value={form}
        open={isFormOpen}
        setOpen={setIsFormOpen}
        setValue={setForm}
        zIndex={3000}
        zIndexInverse={1000}
        listMode="MODAL"
        style={{
          backgroundColor: colors.palette.neutral200,
          borderColor: colors.palette.neutral400,
        }}
      />
    )
  }

  const onChangeTimeAtIndex = (selectedTime, index) => {
    setTimesTakenIsOpen(Platform.OS === 'ios')
    let newTimesTaken = [...timesTaken]
    newTimesTaken[index] = selectedTime
    setTimesTaken(newTimesTaken)
    setTimesTakenIsOpen(false)
  }

  const onPressTimeAtIndex = (index) => {
    setTimesTakenIsOpen(true)
    setTimePickerIndex(index)
  }

  const timePickers = [...Array(timePickersToShow).keys()].map((number: number) =>
    <Button
      key={"time-picker-opacity" + number}
      onPress={() => onPressTimeAtIndex(number)}>
      { !(showTimePickers && timesTakenIsOpen) && <Text>Time taken { number + 1}:{"  "}
      { timesTaken[number] &&
       new Date(timesTaken[number]).toLocaleString(fixedLocale, { hour: 'numeric', minute: 'numeric', hour12: true }) }
      </Text> }
      { showTimePickers && timesTakenIsOpen && <DateTimePicker
        key={"time-picker-" + number}
        mode="time"
        style={{padding: spacing.small}}
        value={timesTaken[number] ? timesTaken[number] : new Date()}
        onTouchCancel={() => setTimesTakenIsOpen(false)}
        onChange={(event, selectedTime) => onChangeTimeAtIndex(selectedTime, timePickerIndex)}
      /> }
    </Button>
  )

  return (
    <View style={$centeredView}>
      <Modal
        visible={isVisible}
        >
          <View style={$centeredView}>
            <View>
              <ScrollView style={$modalView}
                contentContainerStyle={{alignItems: "center"}}
                nestedScrollEnabled={true}
                >
                <TextField
                  autoCorrect={false}
                  keyboardType="default"
                  label="What is the name of this medication?"
                  value={name}
                  onChangeText={setName}
                />
                <TextField
                  autoCorrect={false}
                  keyboardType="default"
                  label="What is the dose of this medication?"
                  value={dose}
                  onChangeText={setDose}
                />
                <Text style={$labelStyle} text="What form is this medication?" />
                <MedicationFormDropdown />
                <Text style={$labelStyle} text="How many doses are in the bottle?" />
                <BottleQuantityDropdown />
                <Text style={$labelStyle} text="How often do you take this medication?" />
                <ScheduleDropdown></ScheduleDropdown>
                { showTimePickers && isTimesADay && <Text style={$labelStyle} text="At what times during the day do you take this medication?" /> }
                { showTimePickers && !isTimesADay &&  <Text style={$labelStyle} text="When will be the first time you take this medication" /> }
                { showTimePickers && timePickers }
                <Text style={$labelStyle} text="When do you start this medication?" />
                <Text onPress={() => setShowStartDatePicker(true)} style={{color: colors.palette.neutral600}} text={startDate.toDateString()} />
                {showStartDatePicker && <DateTimePicker
                  value={startDate}
                  onChange={onChangeStartDate}
                />}
                <Text style={$labelStyle} text="When do you stop taking this medication" />
                <Text onPress={() => setShowEndDatePicker(true)} style={{color: colors.palette.neutral600}} text={endDate.toDateString()} />
                {showEndDatePicker && <DateTimePicker
                  value={endDate}
                  onChange={onChangeEndDate}
                />}
                <View style={$modalButtons}>
                  <Button onPress={() => cancelEdit()}>
                    Cancel
                  </Button>
                  <Button onPress={() => saveMedication()}>
                    Submit
                  </Button>
                </View>
              </ScrollView>
            </View>
          </View>
      </Modal>
    </View>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

const $labelStyle: TextStyle = {
  marginBottom: spacing.extraSmall,
  fontWeight: "bold",
}

const $centeredView: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 22,
}

const $modalView: ViewStyle = {
  margin: 20,
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 35,
  //alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  marginBottom: spacing.medium,
}

const $modalButtons: ViewStyle = {
  flexDirection: "row",
  padding: spacing.medium,
  marginTop: spacing.medium,
}