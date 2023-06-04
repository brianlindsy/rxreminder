import React, { FC, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackScreenProps } from "app/navigators"
import { Screen, Text } from "app/components"
import { Medication } from "app/models/Medication"
import { useStores } from "app/models/helpers/useStores"
import { spacing } from "../theme"
import { delay } from "app/utils/delay"
import { FloatingAction } from "react-native-floating-action"
import { Ionicons } from '@expo/vector-icons'
import { AddMedicationModalScreen } from "./AddMedicationModalScreen"
import * as Notifications from 'expo-notifications'
import { colors } from "../theme"
import MedicationCard from "../components/MedicationCard"
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry"

const actions = [
  {
    text: "Add Medication",
    icon: (<Ionicons name="medical-outline" size={24} color="white" />),
    name: "bt_add_medication",
    position: 1,
    color: colors.palette.secondary200,
  },
];

interface MedicationsListScreenProps extends NativeStackScreenProps<AppStackScreenProps<"MedicationsList">> {}

export const MedicationsListScreen: FC<MedicationsListScreenProps> = observer(function MedicationsListScreen(_props) {
  const { medicationStore, authenticationStore: { isAuthenticated }, } = useStores()
  const [refreshing, setRefreshing] = React.useState(false)
  const [showAddMedicationModal, setShowAddMedicationModal] = React.useState(false)
  const [modalScreenType, setModalScreenType] = React.useState("add")
  const [medicationToEdit, setMedicationToEdit] = React.useState(undefined)

  const fetchData = async () => {
    setRefreshing(true)
    isAuthenticated && medicationStore.fetchMedications()
    console.log(await Notifications.getAllScheduledNotificationsAsync())
    setRefreshing(false)
  }

  const deleteScheduledNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync()
    deleteNotifications(notifications.map(notification => notification.identifier))
    console.log(notifications)
  }

  const deleteNotifications = (notificationIdentifiers) => {
    notificationIdentifiers.forEach(async (notificationIdentifier) => {
      await Notifications.cancelScheduledNotificationAsync(notificationIdentifier)
    })
  }

  const Header = () => {
    return (
      <View style={headerContainer}>
        <Text style={headerTitle}>Your Medications</Text>
      </View>
    );
  };

  useEffect( () => {
    isAuthenticated && fetchData()
  }, [medicationStore.medications])

  async function manualRefresh() {
    setRefreshing(true)
    isAuthenticated && await Promise.all([medicationStore.fetchMedications(), delay(750)])
    setRefreshing(false)
  }

  const handleAddMedicationPressed = () => {
    setMedicationToEdit(undefined)
    setModalScreenType("add")
    setShowAddMedicationModal(true)
  }

  const onPressDeleteMedication = async (medication: Medication) => {
    setRefreshing(true)
    deleteNotifications(medication.notificationIdentifiers)
    await medicationStore.deleteMedication(medication)
    setRefreshing(false)
  }

  const onPressEditMedication = (medication: Medication) => {
    setModalScreenType("edit")
    setMedicationToEdit(medication)
    setShowAddMedicationModal(true)
  }
  
  return (
    <Screen 
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={$screenContentContainer}>
      <Header />
      <FlatList<Medication>
          data={medicationStore.medications}
          extraData={refreshing}
          contentContainerStyle={$flatListContentContainer}
          refreshing={refreshing}
          onRefresh={manualRefresh}
          renderItem={({ item }) => (
            <MedicationCard
              key={item.guid}
              medication={item}
              onPressEditMedication={onPressEditMedication}
              onPressDeleteMedication={onPressDeleteMedication}
            />
          )}
        />
      <View>
        <FloatingAction
          actions={actions}
          color={colors.palette.secondary200}
          onPressItem={() => handleAddMedicationPressed() }
        />
      </View>
      { showAddMedicationModal && (
        <AddMedicationModalScreen
          isVisible={showAddMedicationModal}
          setShowAddMedicationModal={setShowAddMedicationModal}
          initMedication={medicationToEdit}
          screenType={modalScreenType}
          setMedicationToEdit={setMedicationToEdit}
          setRefreshing={setRefreshing}
          deleteNotifications={(ids) => deleteNotifications(ids)}
        />
      )}
    </Screen>
  )
})

// #region Styles
const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $flatListContentContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
  paddingTop: spacing.large,
  paddingBottom: spacing.large,
}

const $item: ViewStyle = {
  padding: spacing.medium,
  marginTop: spacing.medium,
  minHeight: 120,
}

const title: TextStyle = {
    fontWeight: 'bold',
    fontSize: 20
}

const container: ViewStyle = {
    margin: 5,
    padding: spacing.tiny,
    backgroundColor: '#F8F8F8'
}

const detailsContainer: ViewStyle = {
    flexDirection: 'column'
}

const detailRow: ViewStyle = {
    flexDirection: 'row',
    paddingBottom: spacing.tiny
}

const label: TextStyle = {
    fontWeight: 'bold'
}

const value: ViewStyle = {
    paddingHorizontal: 10
}

const headerContainer: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: colors.palette.primary200,
  paddingVertical: 20,
  paddingHorizontal: 10,
}

const headerTitle: TextStyle = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
}

const $medicationIcons: ViewStyle = {
  flexDirection: "row",
  gap: 50,
}