import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * Model description here for TypeScript hints.
 */
export const MedicationModel = types
  .model("Medication")
  .props({
    guid: types.identifier,
    userId: "",
    name: "",
    dose: "",
    form: "",
    bottleQuantity: "",
    schedule: "",
    timesTaken: types.array(types.string),
    notificationIdentifiers: types.array(types.string),
    startDate: "",
    endDate: "",
  })
  .actions(withSetPropAction)
  .views((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions((self) => ({
    addNotificationIdentifier(notificationIdentifier: string) {
      self.notificationIdentifiers.push(notificationIdentifier)
    }
  })) // eslint-disable-line @typescript-eslint/no-unused-vars

export interface Medication extends Instance<typeof MedicationModel> {}
export interface MedicationSnapshotOut extends SnapshotOut<typeof MedicationModel> {}
export interface MedicationSnapshotIn extends SnapshotIn<typeof MedicationModel> {}
export const createMedicationDefaultModel = () => types.optional(MedicationModel, {})
