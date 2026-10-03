import * as Haptics from "expo-haptics";

/** Fire-and-forget haptic feedback; failures (e.g. unsupported device) are ignored. */
export const haptics = {
	selection: () => {
		Haptics.selectionAsync().catch(() => {});
	},
	light: () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
	},
	success: () => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
			() => {}
		);
	},
	warning: () => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
			() => {}
		);
	},
	error: () => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
			() => {}
		);
	},
};
