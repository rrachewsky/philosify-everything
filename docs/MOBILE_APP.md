# Philosify Mobile App

## App Identity

| Property       | Value                 |
| -------------- | --------------------- |
| App Name       | Philosify             |
| Bundle ID      | org.philosify         |
| Web Directory  | dist                  |
| Production URL | https://philosify.org |

## Accounts Required

| Account               | Cost         | Status      | URL                                         |
| --------------------- | ------------ | ----------- | ------------------------------------------- |
| Apple Developer       | $99/year     | Not created | https://developer.apple.com/programs/enroll |
| Google Play Developer | $25 one-time | Not created | https://play.google.com/console/signup      |
| Codemagic (CI/CD)     | Free tier    | Not created | https://codemagic.io                        |

## Build Requirements

### Mac Access

Not available locally. Use **Codemagic** free tier for iOS builds in the cloud.

### Logo/Icons

Source: `site/public/logo.png` (3.9MB) — needs to be resized to 1024x1024 PNG, then generate all platform sizes using `@capacitor/assets`.

## Technology

- **Framework**: Capacitor
- **Platforms**: iOS, Android
- **Build tool**: Vite -> Capacitor sync

## Implementation Steps

1. Sign up for Google Play Developer ($25)
2. Sign up for Apple Developer ($99) — 1-2 day approval
3. Sign up for Codemagic (free)
4. Install Capacitor in project
5. Generate app icons from logo
6. Configure Capacitor
7. Build and submit to stores

## Capacitor Plugins (Planned)

| Plugin                        | Purpose                            |
| ----------------------------- | ---------------------------------- |
| @capacitor/splash-screen      | Native splash screen               |
| @capacitor/status-bar         | Theme-matching status bar          |
| @capacitor/push-notifications | Native push (more reliable on iOS) |
| @capacitor/share              | Native share sheet                 |

## Estimated Timeline

| Phase                    | Duration                  |
| ------------------------ | ------------------------- |
| Account setup            | 1-2 days (Apple approval) |
| Capacitor implementation | 1 day                     |
| App Store submission     | 1-2 hours each            |
| Store review             | 1-7 days                  |
