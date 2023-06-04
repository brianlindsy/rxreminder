import { MedicationModel } from "./Medication"

test("can be created", () => {
  const instance = MedicationModel.create({})

  expect(instance).toBeTruthy()
})
