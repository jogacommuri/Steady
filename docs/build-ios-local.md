# Running Steady as a standalone app (free, local Xcode build)

Expo Go (what you've been using via `npm start`) is a **development tool** —
it needs your Mac's dev server running and your phone on the same
network/tunnel. Close the dev server, and the app stops working.

This doc builds a real, standalone `.app` and installs it directly on your
iPhone via Xcode, using your free Apple ID (no $99/year Apple Developer
Program). The tradeoff: Apple's free signing certificate expires after about
7 days, so you'll re-run the install step roughly weekly — see
[Re-signing when it expires](#re-signing-when-it-expires) below. It's also
what unlocks native modules Expo Go can't host (e.g. HealthKit, parked for a
future phase).

**Requires a Mac** with Xcode installed (App Store, free) — this can't be
done from a Linux/Windows machine or this remote session.

---

## 1. One-time Xcode setup

1. Open **Xcode → Settings → Accounts** → add your Apple ID (the same one
   you use on your iPhone) if it's not already there. No paid account needed.
2. Make sure Xcode's Command Line Tools are installed:
   ```bash
   xcode-select --install
   ```
3. Install CocoaPods, if you don't already have it:
   ```bash
   sudo gem install cocoapods
   ```

## 2. Generate the native iOS project

From the repo root:

```bash
npm install
npm run prebuild:ios
```

This runs `expo prebuild --platform ios`, which reads `app.json` (bundle
identifier `com.steady.app`, the `expo-image-picker` permission strings,
etc.) and generates an `ios/` folder with a real Xcode project. `ios/` is
gitignored on purpose — it's regenerated from `app.json`, not hand-edited or
committed. Re-run this command any time `app.json` or a native dependency
changes.

## 3. Open it in Xcode and sign it

```bash
open ios/Steady.xcworkspace
```

(Open the **`.xcworkspace`**, not `.xcodeproj` — CocoaPods needs the
workspace.)

1. In the project navigator, select the **Steady** project → the **Steady**
   target → **Signing & Capabilities** tab.
2. Check **Automatically manage signing**.
3. **Team** → select your personal Apple ID (shown as "*Your Name* (Personal
   Team)").
4. If Xcode shows a signing error about the bundle identifier, it just means
   `com.steady.app` collided with someone else's personal-team app — change
   it to something unique like `com.yourname.steady` in this screen (Xcode
   updates `Info.plist` for you; no need to touch `app.json` for a personal
   build).

## 4. Connect your iPhone and run it

1. Plug your iPhone into your Mac via cable.
2. On the iPhone, if prompted, tap **Trust This Computer**.
3. In Xcode's toolbar, pick your iPhone as the run destination (next to the
   scheme selector, top left).
4. Press **Run** (▶). Xcode builds, signs, installs, and launches the app on
   your phone.
5. **First install only:** on the iPhone, go to **Settings → General → VPN &
   Device Management**, find your Apple ID under "Developer App", and tap
   **Trust**. Until you do this, the app icon exists but refuses to open.

### Debug vs. Release — which one keeps the app on?

By default Xcode's **Debug** scheme still talks to a Metro dev server for
the JS bundle (like Expo Go does) — convenient while developing, but the app
still needs `npm start` running on your Mac.

To get an app that runs fully on its own, with **no dev server needed**,
switch to a **Release** build before installing:

1. **Product menu → Scheme → Edit Scheme…**
2. Select **Run** on the left → **Info** tab → **Build Configuration** →
   **Release**.
3. Press **Run** (▶) again with the phone connected.

A Release build bundles the JS directly into the app at build time — close
Xcode, unplug your phone, turn off your Mac, and the app keeps working.

## Re-signing when it expires

Apple's free (non-Developer-Program) signing certificate is valid for about
7 days. After that, the app on your phone stops launching (usually a silent
failure or an "Untrusted Developer" prompt). To renew it:

1. Connect your iPhone to your Mac.
2. Open `ios/Steady.xcworkspace` in Xcode (or just re-open the project if
   it's already open).
3. Press **Run** (▶) again — same as step 4 above. This re-signs and
   re-installs in place; your data isn't affected (see below).

There's no way around the 7-day limit without the paid Apple Developer
Program — this is an Apple policy on free/personal-team signing, not
something the app or Expo can work around.

## Your data is safe across rebuilds

Local SQLite data and Supabase sync are untouched by rebuilding/re-signing —
same app bundle identifier, same on-device database file. This is a
different (and safer) situation than the Expo Go storage-sandboxing issue
you hit earlier: a standalone build has one stable identity, so switching
between Debug/Release or re-signing doesn't reset local storage.

## Later, if you ever want to skip the 7-day step

If re-signing weekly becomes annoying, or you want to install over the air
without a cable, or ship to the App Store: that needs the paid **Apple
Developer Program** ($99/year) and **EAS Build**
(`npx eas-cli build --platform ios`, from Expo — cloud builds, no Xcode
required). Not set up in this repo yet; ask if you want it added later.
