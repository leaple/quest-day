# QUEST DAY — Android Release AAB

This workflow compiles an **unsigned** release Android App Bundle for validation only.

## Run
1. Merge the reviewed workflow into main.
2. GitHub Actions → `QUEST DAY - Android release AAB (unsigned)` → Run workflow.
3. Check tests, Gradle `bundleRelease`, artifact existence and SHA-256.
4. The resulting AAB is **not suitable for Google Play upload** until properly signed with a release upload key.

## Production signing
- Confirm final Android application ID and versionCode/versionName before first release.
- Create and securely retain an upload signing key using the official Android Studio/Play Console workflow.
- Keep keystore, passwords, certificates with private keys and credentials out of git and public CI logs.
- Prefer a controlled local Android Studio signed bundle build or a separately reviewed secure signing workflow using encrypted secrets.
- Configure Play App Signing and verify the upload certificate fingerprint against the intended key.
- Do not overwrite or lose an existing app's signing identity.
- Upload to Play Console internal testing first; then follow applicable closed-testing and review requirements.

## iOS
Use macOS/Xcode with an authorized Apple Developer team to configure signing, archive the app and upload to TestFlight. The existing simulator CI does not produce a signed distribution build.

No existing user data or production settings are modified by this workflow.
