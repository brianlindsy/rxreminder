import { Instance, SnapshotOut, flow, types } from "mobx-state-tree"
import { api } from "../services/api"
import { Medication, MedicationModel } from "./Medication"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const MedicationStoreModel = types
  .model("MedicationStore")
  .props({
    medications: types.array(MedicationModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    fetchMedications: flow(function* fetchMedications() {
      const response = yield api.getMedications()
      if (response.kind === "ok") {
        store.setProp("medications", response.medications)
      } else {
        console.tron.error(`Error fetching medications: ${JSON.stringify(response)}`, [])
      }
    }),
    saveMedication: flow(function* saveMedication(medication: Medication) {
      const response = yield api.saveMedication(medication)
      if (response?.kind === "ok") {
        store.medications.push(medication)
      } else {
        console.tron.error(`Error saving medications: ${JSON.stringify(response)}`, [])
      }
    }),
    deleteMedication: flow(function* deleteMedication(medication: Medication) {
      const response = yield api.deleteMedication(medication)
      if (response?.kind === "ok") {
        store.medications.remove(medication)
      } else {
        console.tron.error(`Error deleting medications: ${JSON.stringify(response)}`, [])
      }
    }),
    deleteAllMedications: flow(function* deleteAllMedications() {
      const response = yield api.deleteAllMedications()
      if (response?.kind === "ok") {
        store.medications.clear()
      } else {
        console.tron.error(`Error deleting medications: ${JSON.stringify(response)}`, [])
      }
    }),
    updateMedication: flow(function* updateMedication(medication: Medication) {
      const response = yield api.updateMedication(medication)
      if (response?.kind === "ok") {
        var currIndex = store.medications.findIndex((m) => m.guid === medication.guid)
        store.medications[currIndex] = medication
      } else {
        console.tron.error(`Error updating medications: ${JSON.stringify(response)}`, [])
      }
    }),
  }))
  .views((store) => ({
    get medicationsForList() {
      return store.medications
    },
  }))

export interface MedicationStore extends Instance<typeof MedicationStoreModel> {}
export interface MedicationStoreSnapshot extends SnapshotOut<typeof MedicationStoreModel> {}

// @demo remove-file
