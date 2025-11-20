import { DeviceEventEmitter, EmitterSubscription } from "react-native";

/**
 * Global Event Emitter for data synchronization.
 * This system is used to trigger app-wide updates when data changes in the database.
 * Since we are using raw SQLite queries without a reactive layer (like WatermelonDB),
 * we need to manually notify components to refresh their data.
 */

export const EVENTS = {
	/**
	 * Emitted whenever any data is created, updated, or deleted in any repository.
	 * Listeners should re-fetch their data when this event is fired.
	 */
	DATA_CHANGED: "DATA_CHANGED",
};

/**
 * Emits a global event.
 * @param eventName The name of the event to emit (from EVENTS object).
 * @param data Optional data to pass with the event.
 */
export const emitEvent = (eventName: string, data?: any) => {
	DeviceEventEmitter.emit(eventName, data);
};

/**
 * Subscribes to a global event.
 * @param eventName The name of the event to listen for.
 * @param callback The function to call when the event is emitted.
 * @returns An EmitterSubscription that should be removed when the component unmounts.
 */
export const addEventListener = (
	eventName: string,
	callback: (data?: any) => void
): EmitterSubscription => {
	return DeviceEventEmitter.addListener(eventName, callback);
};
