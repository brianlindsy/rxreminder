import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { TextStyle, TouchableOpacity, View, ViewStyle, Alert } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackScreenProps } from "app/navigators"
import { Screen, Text } from "app/components"
import { useStores } from "app/models/helpers/useStores"
import { useHeader } from "app/utils/useHeader"
import { getAuth } from "firebase/auth"
import { colors } from "../theme"
import * as Notifications from 'expo-notifications'
import Toast from 'react-native-root-toast'

interface SettingsScreenProps extends NativeStackScreenProps<AppStackScreenProps<"Settings">> {}

export const SettingsScreen: FC<SettingsScreenProps> = observer(function SettingsScreen() {
  
  const { authenticationStore: { logout }, medicationStore } = useStores()

  const auth = getAuth()

  const user = auth.currentUser;

  const logoutPressed = () => {
    logout()
  }

  const deleteNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync()
    notifications.forEach(async (notification) => {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier)
    })
  }

  const createTwoButtonAlert = () =>
    Alert.alert('Account and Data Deletion', 'Are you absolutely sure you want to ' +
    'delete all of your medication and account data? This is irreversible.', [
      {
        text: 'Cancel',
      },
      {text: 'Yes', onPress: () => onPressDeleteAccountAndData},
    ]);

  useHeader(
    {
      rightTx: "common.logOut",
      onRightPress: logoutPressed,
    },
    [logoutPressed],
  )

  const onPressDeleteAccountAndData = () => {
    deleteNotifications()
    medicationStore.deleteAllMedications()
    user.delete().then(() => {
      Toast.show('Account deleted.', {
        duration: Toast.durations.LONG,
      });
    }).catch((error) => {
      Toast.show('Account deletion error: ' + error, {
        duration: Toast.durations.LONG,
      });
    });
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={$screenContentContainer}>
      <TouchableOpacity style={button} onPress={createTwoButtonAlert}>
        <Text style={buttonText}>Delete My Account and All Data</Text>
      </TouchableOpacity>
      <View style={container}>
        <Text style={username}>Username: { user.email }</Text>
      </View>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 22,
}

const container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const username: TextStyle = {
  fontSize: 16,
  marginBottom: 16,
}

const button: ViewStyle = {
  backgroundColor: colors.palette.primary200,
  borderRadius: 4,
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginLeft: 8,
}

const buttonText: TextStyle = {
  color: '#FFFFFF',
  fontWeight: 'bold',
}