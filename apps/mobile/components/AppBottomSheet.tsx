import React, { useRef, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import BottomSheet, {
	BottomSheetScrollView,
	BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

interface AppBottomSheetProps {
	isVisible: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
	isVisible,
	onClose,
	children,
}) => {
	const theme = useTheme();
	const bottomSheetRef = useRef<BottomSheet>(null);

	const snapPoints = useMemo(() => ["25%", "50%", "75%"], []);

	const handleSheetChanges = useCallback(
		(index: number) => {
			if (index === -1) {
				onClose();
			}
		},
		[onClose]
	);

	React.useEffect(() => {
		if (isVisible) {
			bottomSheetRef.current?.expand();
		} else {
			bottomSheetRef.current?.close();
		}
	}, [isVisible]);

	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				onPress={onClose}
			/>
		),
		[onClose]
	);

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={-1}
			snapPoints={snapPoints}
			onChange={handleSheetChanges}
			enablePanDownToClose={true}
			backgroundStyle={{ backgroundColor: theme.colors.surfaceVariant }}
			handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
			backdropComponent={renderBackdrop}
		>
			<BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
				{children}
			</BottomSheetScrollView>
		</BottomSheet>
	);
};

const styles = StyleSheet.create({
	contentContainer: {
		padding: 20,
	},
});

export default AppBottomSheet;
