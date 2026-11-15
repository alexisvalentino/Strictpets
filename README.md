# 🐾 Focus Tracker — Focus Together With Your Pet

> "Set the phone down. I'll keep you company." — your pet

## 🎯 What Is This?

A friendly focus buddy. Pick a goal, put your phone down, and your pet focuses
alongside you. Finish the session and you both grow: coins, streaks, a growing
collection of friends, and a wardrobe of accessories. If a tap or a bump ends a
session early, that's okay — your pet is always ready for another round.

## ✨ Features

- **Focus Timer**: 30 seconds, 1, 5, or 25 minutes, or any custom goal up to 4 hours
- **Pet Collection**: 22 cute pets to meet — each one unlocks as you focus
- **Coin Economy**: Earn focus coins per 10 seconds focused; cosmetics are long-term goals
- **Daily Goal**: 15 focused minutes a day earns a bonus (minutes, not taps)
- **Streaks & Check-ins**: Focus daily to grow your streak and climb the 7-day check-in jackpot
- **Streak Shield & Repair**: One shield covers one missed day (120 🪙, buy before you
  miss), or repair a missed day (160 🪙) if you would rather pay afterwards
- **Gentle Reminders**: One evening notification if your streak is waiting (you choose to allow it)
- **This Week**: A 7-day view of how much you focused
- **Shops**: Accessories and app themes to unlock with coins
- **Weekend Double Points**: Saturdays and Sundays earn ×2 coins
- **Safe by design**: No accounts, no ads, no tracking — progress stays on your device
  (with a native backup so the OS clearing web storage doesn't erase it)

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
./gradlew assembleDebug
```

APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS

```bash
npm run build
npx cap sync
cd ios
open App.xcworkspace
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
