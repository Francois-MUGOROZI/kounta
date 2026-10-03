import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Keyboard, Platform, StyleSheet, TextInput, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetFooter,
	BottomSheetFooterProps,
	BottomSheetModal,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardEvents } from "react-native-keyboard-controller";
import { radius, spacing, useKTheme } from "../../theme/theme";

interface SheetProps {
	visible: boolean;
	onDismiss: () => void;
	title?: string;
	subtitle?: string;
	children: React.ReactNode;
	/** Sticky actions pinned above the keyboard / navigation bar. */
	footer?: React.ReactNode;
	/** Fixed content height ratio (0..1). Omit to size to content. */
	heightRatio?: number;
	/** Rendered instead of the default scroll container (e.g. a list). */
	scrollable?: boolean;
}

const FOOTER_HEIGHT = 80;

/**
 * Modal bottom sheet used for every form and picker. Controlled with
 * `visible`; dismisses on swipe, backdrop tap or the close button.
 */
const Sheet: React.FC<SheetProps> = ({
	visible,
	onDismiss,
	title,
	subtitle,
	children,
	footer,
	heightRatio,
	scrollable = true,
}) => {
	const theme = useKTheme();
	const insets = useSafeAreaInsets();
	const ref = useRef<BottomSheetModal>(null);

	useEffect(() => {
		if (visible) {
			ref.current?.present();
		} else {
			ref.current?.dismiss();
		}
	}, [visible]);

	// Android back closes the top-most sheet (listeners run newest-first).
	useEffect(() => {
		if (!visible) return;
		const sub = BackHandler.addEventListener("hardwareBackPress", () => {
			ref.current?.dismiss();
			return true;
		});
		return () => sub.remove();
	}, [visible]);

	// Android (edge-to-edge) no longer resizes the window for the keyboard, and the
	// sheet library's own pan handling leaves the sheet stranded mid-screen after the
	// keyboard closes. Instead, pad the content by the keyboard height: the sheet
	// sizes to its content, so it rises above the keyboard and settles back after.
	// keyboard-controller reports the final height as the keyboard *starts* moving,
	// so the sheet animates alongside it rather than after it.
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	useEffect(() => {
		if (Platform.OS !== "android" || !visible) return;
		const show = KeyboardEvents.addListener("keyboardWillShow", (e) => setKeyboardHeight(e.height));
		const hide = KeyboardEvents.addListener("keyboardWillHide", () => {
			setKeyboardHeight(0);
			// Back-button dismissal doesn't blur the field; do it so focus state is accurate.
			const focused = TextInput.State.currentlyFocusedInput();
			if (focused) TextInput.State.blurTextInput(focused);
		});
		return () => {
			show.remove();
			hide.remove();
			setKeyboardHeight(0);
		};
	}, [visible]);

	const handleDismiss = useCallback(() => {
		Keyboard.dismiss();
		onDismiss();
	}, [onDismiss]);

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				opacity={0.45}
				pressBehavior="close"
			/>
		),
		[]
	);

	const renderFooter = useCallback(
		(props: BottomSheetFooterProps) => (
			<BottomSheetFooter {...props}>
				<View
					style={[
						styles.footer,
						{
							backgroundColor: theme.colors.surface,
							borderTopColor: theme.colors.outlineVariant,
							paddingBottom: Math.max(insets.bottom, spacing.md),
						},
					]}
				>
					{footer}
				</View>
			</BottomSheetFooter>
		),
		[footer, theme, insets.bottom]
	);

	const header = title ? (
		<View style={styles.header}>
			<View style={styles.headerText}>
				<Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
					{title}
				</Text>
				{subtitle ? (
					<Text
						variant="bodyMedium"
						style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
					>
						{subtitle}
					</Text>
				) : null}
			</View>
			<IconButton
				icon="close"
				size={22}
				onPress={() => ref.current?.dismiss()}
				accessibilityLabel="Close"
				style={styles.close}
			/>
		</View>
	) : null;

	const restingSpace = footer
		? FOOTER_HEIGHT + Math.max(insets.bottom, spacing.md)
		: Math.max(insets.bottom, spacing.lg) + spacing.sm;
	const bottomSpace = keyboardHeight > 0 ? keyboardHeight + spacing.lg : restingSpace;

	return (
		<BottomSheetModal
			ref={ref}
			onDismiss={handleDismiss}
			enableDynamicSizing={!heightRatio}
			snapPoints={heightRatio ? [`${Math.round(heightRatio * 100)}%`] : undefined}
			topInset={insets.top + spacing.lg}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			// "adjustResize" makes the library ignore the keyboard on Android;
			// the keyboard padding above handles it (iOS uses keyboardBehavior).
			android_keyboardInputMode="adjustResize"
			enablePanDownToClose
			stackBehavior="push"
			backdropComponent={renderBackdrop}
			footerComponent={footer ? renderFooter : undefined}
			backgroundStyle={{
				backgroundColor: theme.colors.surface,
				borderTopLeftRadius: radius.xxl,
				borderTopRightRadius: radius.xxl,
			}}
			handleIndicatorStyle={{
				backgroundColor: theme.colors.outline,
				width: 36,
			}}
		>
			{scrollable ? (
				<BottomSheetScrollView
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: bottomSpace },
					]}
				>
					{header}
					{children}
				</BottomSheetScrollView>
			) : (
				<View style={[styles.flex, { paddingBottom: footer ? bottomSpace : 0 }]}>
					<View style={styles.content}>{header}</View>
					{children}
				</View>
			)}
		</BottomSheetModal>
	);
};

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.xl,
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: spacing.lg,
		marginTop: spacing.xs,
	},
	headerText: {
		flex: 1,
		paddingTop: spacing.xs,
	},
	close: {
		margin: 0,
		marginRight: -spacing.sm,
	},
	footer: {
		flexDirection: "row",
		gap: spacing.md,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
});

export default Sheet;
