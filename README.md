# 🐾 Focus Tracker — Strict Focus Sessions With Your Pet

> "Set the phone down. I'll keep you company." — your pet

## 🎯 What Is This?

A strict, pet-powered focus timer. Choose a goal, press Start, then put your
phone down and stay in the app until time is up. A touch after a session starts,
switching away from the app, reloading, or detected phone movement ends the
attempt. You can start another session whenever you're ready.

Completed sessions earn coins and build long-term progress. The 22 pets unlock
at milestones for focused minutes, completed sessions, and streaks. A session
that crosses a milestone can unlock one or more new friends; pet unlocks are
milestone-based, not random rewards after every session. Interrupted attempts
do not advance pet progress and may earn only a small consolation reward.

## ✨ Features

- **Strict focus sessions**: Touching the screen, leaving or reloading the app, or detected
  movement interrupts a running session.
- **Flexible timer**: Choose 30 seconds, 1, 5, or 25 minutes, or set a custom goal from
  10 seconds up to 4 hours.
- **Pet collection**: Meet 22 pets by reaching focused-minute, completed-session, and
  streak milestones.
- **Focus coins**: Completed sessions earn coins based on time focused; the base coin
  reward doubles on weekends.
- **Daily focus goal**: Reach 15 focused minutes in a day to claim 60 coins.
- **Streak check-in**: Complete a focus session today to unlock one check-in reward.
  Build through a 7-day cycle, then start an escalating cycle.
- **Daily gift**: Collect a separate free coin gift once per day, even without
  completing a focus session.
- **Streak shield and repair**: Buy one shield for 120 coins to cover a missed day,
  or repair a missed day for 160 coins.
- **Gentle reminders**: Choose whether to allow an evening reminder when your streak
  needs attention.
- **This week**: See your focus time across the last seven days.
- **Shops**: Unlock accessories and app themes with coins.
- **Private by design**: No account, ads, or tracking. Progress stays on your device,
  with a native backup for app data.

## 🛠 Tech Stack

- **Next.js 14** (React, static export)
- **Capacitor 5** (iOS + Android native)
- **Tailwind CSS**
- **Ionic Components**
- **Capacitor Plugins**: App, Haptics, StatusBar, Preferences, Local Notifications

## 🚀 Getting Started

### Web (Development)

```bash
npm install
npm run dev
```

### Tests

```bash
npm test   # game-logic suite (rewards, streaks, check-ins, pets, history, reminders)
npm run lint

# Visual check of every pet in every mood (writes .tmp-gallery/gallery.html)
npx tsc -p tests/gallery/tsconfig.json && node tests/gallery/render.js
```

### Android

```bash
npm run build
npx cap sync
cd android
```

On Windows, build the debug APK with:

```powershell
.\gradlew.bat assembleDebug
```

On macOS or Linux, use `./gradlew assembleDebug`. The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`.

For a signed release APK and Play Store bundle, configure your local,
git-ignored `android/keystore.properties`, then run:

```powershell
.\gradlew.bat assembleRelease bundleRelease
```

The release APK and AAB are written under `android/app/build/outputs/apk/release`
and `android/app/build/outputs/bundle/release`.

### iOS

```bash
npm run build
npx cap sync
open ios/App/App.xcworkspace
```

Then hit **Run** in Xcode.

> Always run `npm run build && npx cap sync` before a native release so the
> apps ship the current web build.

## 🎭 Meet Your Pets

Every pet is **earned by focusing**, never bought. Lifetime focus time,
completed sessions, and your best streak all unlock new friends, and you can
switch between the pets you've met at any time (Rewards → Pet Collection).

| Pet | How to unlock |
|-----|---------------|
| 🐻 Bear | Your first friend |
| 🐱 Cat | Finish your first session |
| 🐥 Chick | Focus 15 min in total |
| 🐸 Frog | Focus 30 min in total |
| 🐰 Rabbit | Focus 1 h in total |
| 🐟 Fish | Reach a 3-day streak |
| 🐶 Dog | Focus 2 h in total |
| 🐹 Hamster | Finish 10 sessions |
| 🐭 Mouse | Focus 3 h in total |
| 🐧 Penguin | Focus 5 h in total |
| 🦊 Fox | Reach a 7-day streak |
| 🐨 Koala | Focus 8 h in total |
| 🐼 Panda | Focus 12 h in total |
| 🐷 Piglet | Finish 25 sessions |
| 🦉 Owl | Focus 16 h in total |
| 🐢 Turtle | Reach a 14-day streak |
| 🐯 Tiger | Focus 24 h in total |
| 🦁 Lion | Focus 36 h in total |
| 🐵 Monkey | Finish 50 sessions |
| 🦄 Unicorn | Focus 50 h in total |
| 🐙 Octopus | Reach a 30-day streak |
| 🐲 Dragon | Focus 100 h in total |

## 🏆 Achievement Examples

- **First Focus**: Complete your first session 🌱
- **On a Roll / Week Warrior / Fortnight / Month Master**: 3, 7, 14, and 30-day streaks
- **Growing Family → Complete Collection**: Meet 5, 11, and all 22 friends
- **Record Breaker → Ultra Focus**: 25, 45, 60, and 90-minute sessions
- **Jackpot → Jackpot Legend**: Claim the Day-7 check-in jackpot 1, 3, and 5 times
- **Double Digits / Focus Machine**: 10 and 50 sessions

---

*Built with love, coffee ☕, and a lot of haptic feedback.*
