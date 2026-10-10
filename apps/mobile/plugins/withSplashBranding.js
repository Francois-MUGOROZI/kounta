const fs = require("fs");
const path = require("path");
const { withAndroidStyles, withDangerousMod } = require("expo/config-plugins");

const DRAWABLE = "splashscreen_branding";
const ATTRIBUTE = "android:windowSplashScreenBrandingImage";

// Android 12+ splash "branding image": the app name near the bottom of the
// splash, under the centred icon. expo-splash-screen doesn't expose it, so this
// adds the image (light and night, drawn for a 200x80dp box at xxxhdpi) and
// points the splash theme at it. Older Android versions ignore it. List it
// before expo-splash-screen in app.json: mods run last-listed first, and that
// plugin rewrites the splash theme.
module.exports = function withSplashBranding(config, { image, darkImage }) {
	config = withDangerousMod(config, [
		"android",
		async (cfg) => {
			const res = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res");
			for (const [source, folder] of [
				[image, "drawable-xxxhdpi"],
				[darkImage, "drawable-night-xxxhdpi"],
			]) {
				fs.mkdirSync(path.join(res, folder), { recursive: true });
				fs.copyFileSync(
					path.join(cfg.modRequest.projectRoot, source),
					path.join(res, folder, `${DRAWABLE}.png`)
				);
			}
			return cfg;
		},
	]);

	return withAndroidStyles(config, (cfg) => {
		const style = cfg.modResults.resources.style?.find((s) => s.$.name === "Theme.App.SplashScreen");
		if (!style) {
			throw new Error("withSplashBranding: Theme.App.SplashScreen not found; list it before expo-splash-screen");
		}
		style.item = (style.item ?? []).filter((item) => item.$.name !== ATTRIBUTE);
		style.item.push({ $: { name: ATTRIBUTE, "tools:targetApi": "31" }, _: `@drawable/${DRAWABLE}` });
		return cfg;
	});
};
