import { useState, useEffect } from "react";
import {
	useAuthRequest,
	makeRedirectUri,
	ResponseType,
} from "expo-auth-session";

// Google OAuth2 config
const CLIENT_ID = "your-client-id.apps.googleusercontent.com";
const SCOPES = [
	"https://www.googleapis.com/auth/drive.file",
	"profile",
	"email",
];

const REDIRECT_URI = makeRedirectUri();

const discovery = {
	authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
	tokenEndpoint: "https://oauth2.googleapis.com/token",
	revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const useGoogleDriveBackup = () => {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [request, response, promptAsync] = useAuthRequest(
		{
			clientId: CLIENT_ID,
			scopes: SCOPES,
			redirectUri: REDIRECT_URI,
			responseType: ResponseType.Token,
		},
		discovery
	);

	useEffect(() => {
		if (response?.type === "success" && response.params?.access_token) {
			setAccessToken(response.params.access_token);
		} else if (response?.type === "error") {
			setError("Google authentication failed.");
		}
	}, [response]);

	// Authenticate with Google and get access token
	const authenticate = async () => {
		setError(null);
		try {
			await promptAsync();
		} catch (e: any) {
			setError(e.message || "Google authentication error.");
		}
	};

	// Restore logic: search for and download backup file from Drive
	const BACKUP_FILENAME = "kounta-backup.sqlite";

	const restoreFromDrive = async () => {
		if (!accessToken) throw new Error("No Google Drive access token");
		// 1. Search for the backup file by name
		const searchRes = await fetch(
			`https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id,name)&spaces=drive`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);
		const searchJson = await searchRes.json();
		const file = searchJson.files?.[0];
		if (!file?.id) throw new Error("Backup file not found in Google Drive");
		// 2. Download the file
		const downloadRes = await fetch(
			`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);
		if (!downloadRes.ok) throw new Error("Failed to download backup file");
		const fileData = await downloadRes.arrayBuffer();
		return fileData;
	};

	return {
		accessToken,
		authenticating: !request,
		error,
		authenticate,
		restoreFromDrive,
	};
};
