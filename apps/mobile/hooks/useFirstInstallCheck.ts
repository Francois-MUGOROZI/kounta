import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useFirstInstallCheck = () => {
	const [isFirstInstall, setIsFirstInstall] = useState<boolean | null>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		const checkFirstInstall = async () => {
			try {
				const flag = await AsyncStorage.getItem("hasInitialized");
				setIsFirstInstall(!flag);
			} finally {
				setChecking(false);
			}
		};
		checkFirstInstall();
	}, []);

	const markInitialized = async () => {
		await AsyncStorage.setItem("hasInitialized", "true");
		setIsFirstInstall(false);
	};

	return { isFirstInstall, checking, markInitialized };
};
