import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { radius, useKTheme } from "../../theme/theme";

interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

/** `const ok = await confirm({...})` — resolves true when the user confirms. */
export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const theme = useKTheme();
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolver = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback<ConfirmFn>((next) => {
		resolver.current?.(false);
		setOptions(next);
		return new Promise<boolean>((resolve) => {
			resolver.current = resolve;
		});
	}, []);

	const close = (result: boolean) => {
		resolver.current?.(result);
		resolver.current = null;
		setOptions(null);
	};

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			<Portal>
				<Dialog
					visible={!!options}
					onDismiss={() => close(false)}
					style={{ borderRadius: radius.xxl, backgroundColor: theme.colors.surface }}
				>
					<Dialog.Title>{options?.title}</Dialog.Title>
					{options?.message ? (
						<Dialog.Content>
							<Text
								variant="bodyMedium"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								{options.message}
							</Text>
						</Dialog.Content>
					) : null}
					<Dialog.Actions>
						<Button onPress={() => close(false)}>
							{options?.cancelLabel ?? "Cancel"}
						</Button>
						<Button
							mode="contained"
							buttonColor={options?.destructive ? theme.colors.error : undefined}
							textColor={options?.destructive ? theme.colors.onError : undefined}
							onPress={() => close(true)}
							style={{ paddingHorizontal: 8 }}
						>
							{options?.confirmLabel ?? "Confirm"}
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</ConfirmContext.Provider>
	);
};
