/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import {
  ApiResponse, // @demo remove-current-line
  ApisauceInstance,
  create,
} from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem" // @demo remove-current-line
import type {
  ApiConfig,
  ApiFeedResponse, // @demo remove-current-line
} from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode" // @demo remove-current-line
import { MedicationSnapshotIn } from "app/models"
import { db, auth } from "../../../firebaseConfig"
import { collection, doc, addDoc, getDocs, query, where, deleteDoc, getDoc, updateDoc } from "firebase/firestore"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  // @demo remove-block-start
  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] = rawData.items.map((raw) => ({
        ...raw,
      }))

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__) {
        console.tron.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a list of medications for the logged in user.
   */
  async getMedications(): Promise<{ kind: "ok"; medications: MedicationSnapshotIn[] } | GeneralApiProblem> {
    
    const userId = auth?.currentUser?.uid;

    if (!userId) return { kind: "not-found" }

    const q = query(collection(db, "medication-reminders"), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.size === 0) return {kind: "not-found"}

    let medications: MedicationSnapshotIn[] = []

    querySnapshot.forEach((doc) => {
      medications.push({...doc.data()})
    })

    return { kind: "ok", medications }
  }

  /**
   * Gets a list of medications for the logged in user.
   */
  async saveMedication(medicationToSave: MedicationSnapshotIn): Promise<{ kind: "ok" } | GeneralApiProblem> {

    const returnVal = await addDoc(collection(db, "medication-reminders"), medicationToSave);

    return { kind: "ok"}
  }

  /**
   * Deletes a medication for the logged in user.
   */
  async deleteMedication(medicationToDelete: MedicationSnapshotIn): Promise<{ kind: "ok" } | GeneralApiProblem> {

    const q = await query(collection(db, "medication-reminders"), where("guid", "==", medicationToDelete.guid))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.size !== 0) {
      deleteDoc(querySnapshot.docs[0].ref)
    } else {
      return { kind: "not-found"}
    }

    return { kind: "ok"}
  }

  /**
   * Deletes all medications for the user.
   */
  async deleteAllMedications(): Promise<{ kind: "ok" } | GeneralApiProblem> {

    const q = await query(collection(db, "medication-reminders"), where("userId", "==", auth?.currentUser?.uid))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.size !== 0) {
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref)
      })
    } else {
      return { kind: "not-found"}
    }

    return { kind: "ok"}
  }

  /**
   * Gets a list of medications for the logged in user.
   */
  async updateMedication(medicationToUpdate: MedicationSnapshotIn): Promise<{ kind: "ok" } | GeneralApiProblem> {

    const q = await query(collection(db, "medication-reminders"), where("guid", "==", medicationToUpdate.guid))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.size !== 0) {
      updateDoc(querySnapshot.docs[0].ref, medicationToUpdate)
    } else {
      return { kind: "not-found"}
    }

    return { kind: "ok"}
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
