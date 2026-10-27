# Swifty Companion

Use this Android app to find a 42 student by login. The app shows the student's profile, cursus, skills, and projects. A local server keeps the 42 API credentials out of the app.

## Requirements

- Node.js 22 and npm
- Android SDK, Android NDK, and an Android emulator
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

Run this command in each terminal that starts Expo, the emulator, or an Android build:

```sh
. /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
```

This script sets the Android SDK, emulator, Gradle cache, npm cache, and temporary directory paths. On another computer, set `ANDROID_HOME` and `ANDROID_AVD_HOME` for your own Android installation.

## Run the app

1. Start the Android emulator. On this workstation, run:

   ```sh
   . /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
   "$ANDROID_HOME/emulator/emulator" -avd Pixel_10
   ```

2. Start the API server in a second terminal. Run this command in the project directory:

   ```sh
   npm run server
   ```

3. Start Metro in a third terminal. Run these commands in the project directory:

   ```sh
   . /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
   npm start -- --port 8082
   ```

4. Open **Swifty Companion** in the emulator. Enter an exact 42 login. Then select **Explore profile**.

The current Android debug build uses port **8082**. Keep Metro and the API server open while you use the app.

### Install the Android app for the first time

If the app is not on the emulator, use these commands in place of step 3:

```sh
. /home/hguo/sgoinfre/hguo/mobile-dev/env.sh
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
- **No profile photo:** The 42 image server can reject the photo request. The app then shows the first two letters of the login.

## Project files

- `app/`: Search and profile screens.
- `src/`: API requests and profile data.
- `server/`: Local API server and 42 API client.
- `.env.example`: Example configuration. Keep real credentials in `.env`.
