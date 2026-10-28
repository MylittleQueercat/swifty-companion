# Swifty Companion

Use this Android app to find a 42 student by login. The app shows the student's photo, contact details, cursus, skills, and projects. It has a cyberpunk interface with a light/dark switch. A local server keeps the 42 API credentials out of the app.

## Requirements

- Node.js 22 and npm
- Android SDK, Android NDK, Java 17 JDK, and an Android emulator
- A 42 API application UID and secret from [42 API settings](https://profile.intra.42.fr/oauth/applications)

## Set up the project

Run these commands in the project directory:

```sh
npm ci
cp -n .env.example .env
```

Open `.env`. Replace the two example values with your 42 API UID and secret:

```dotenv
FORTYTWO_CLIENT_ID=your_uid
FORTYTWO_CLIENT_SECRET=your_secret
```

Keep the credentials in `.env`. Do not add `EXPO_PUBLIC_` to their names. The Android app must not contain the credentials.

For an Android emulator, keep this API address in `.env`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001
```

`10.0.2.2` lets the emulator reach the server on your computer. Restart Expo after you change `.env`.

### Android SDK on this workstation

On this workstation, the environment script points `ANDROID_AVD_HOME` to an old location. Set the current AVD path in terminals that start the emulator or build the app. Android builds also need Java 17 because the system default Java lacks `javac`:

```sh
. /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
export ANDROID_AVD_HOME="$MOBILE_DEV_DIR/android-avd"
export JAVA_HOME="$GRADLE_USER_HOME/jdks/eclipse_adoptium-17-amd64-linux.2"
export PATH="$JAVA_HOME/bin:$PATH"
```

The script sets the Android SDK, Gradle cache, npm cache, and temporary directory paths. On another computer, use your own SDK, AVD, and JDK paths.

## Run the app

Open the `swifty-companion` project folder. Use a separate terminal for each step and keep the server and Metro terminals open.

1. Start the Android emulator:

   ```sh
   . /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
   export ANDROID_AVD_HOME="$MOBILE_DEV_DIR/android-avd"
   "$ANDROID_HOME/emulator/emulator" -avd Pixel_10
   ```

2. Start the API server in a second terminal:

   ```sh
   npm run server
   ```

3. If the app is already installed, start Metro in a third terminal:

   ```sh
   . /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
   npm start -- --port 8082
   ```

4. Open **Swifty Companion** in the emulator. Enter an exact 42 login, then select **Explore profile**. Use the button at the top of either screen to switch between light and dark mode. The app saves your selection.

The current Android debug build uses port **8082**. Keep Metro and the API server open while you use the app.

### Install the Android app for the first time

If the app is not on the emulator, or you updated native dependencies or the launcher icon, use these commands in place of step 3:

```sh
. /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
export ANDROID_AVD_HOME="$MOBILE_DEV_DIR/android-avd"
export JAVA_HOME="$GRADLE_USER_HOME/jdks/eclipse_adoptium-17-amd64-linux.2"
export PATH="$JAVA_HOME/bin:$PATH"
npm run android -- --port 8082
```

This command builds the debug app, installs it, and starts Metro. Start the API server in a separate terminal.

## Check the project

Run these commands in the project directory:

```sh
npm run typecheck
npm run lint
npm test
```

Open `http://127.0.0.1:3001/health` to check the local API server. A student search also needs a valid 42 API UID, a valid secret, and network access.

## If the app does not start

- **Unable to load script:** Start Metro on port `8082`. Then open the app again.
- **Cannot reach the local backend:** Start `npm run server`. Check `EXPO_PUBLIC_API_BASE_URL` in `.env`.
- **No profile photo:** Restart `npm run server` after code changes. The backend requests 42 photos with its access token and the app tries the available image sizes. If 42 has no photo for that login, the app shows the first two letters of the login.

## Project files

- `app/`: Search and profile screens.
- `src/`: API requests and profile data.
- `server/`: Local API server and 42 API client.
- `assets/`: Android launcher icon.
- `.env.example`: Example configuration. Keep real credentials in `.env`.
