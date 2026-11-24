// End-to-end verification of every reward path in the game state (the pure
// logic layer behind the UI). Run with `npm test` (compiles lib/gameState.ts
// into the git-ignored .tmp-gs/ first). Exit code 0 = every flow verified.
const gs = require('../.tmp-gs/gameState');
const fs = require('node:fs');
const path = require('node:path');

let pass = 0;
let fail = 0;
const ok = (cond, label) => {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('  FAIL:', label);
  }
};

const base = () => gs.defaultGameState();
// A Saturday at 10:00 (2026-08-22 is a Saturday)
const SAT = new Date(2026, 7, 22, 10, 0, 0);
// Fixed weekday keeps reward tests deterministic on weekends and in CI.
const NOW = new Date(2026, 7, 18, 10, 0, 0);
// September days (weekday) for economy simulations.
const D7 = (day, h = 10) => new Date(2026, 8, day, h);

console.log('== 1. Session rewards ==');
{
  const { state, result } = gs.recordSession(base(), 300, NOW); // 5 min
  ok(result.baseCoins === 30, '300s -> 30 base coins');
  ok(!result.weekendBonus, 'weekday is not weekend');
  ok(result.newRecord && result.recordBonus === 50, 'first session beats record (+50)');
  ok(result.coinsEarned === 80, 'coins = 30 + 50 record');
  ok(state.coins === 80, 'state coins 80');
  ok(state.currentStreak === 1 && state.totalSessions === 1, 'streak 1, 1 session');
  ok(state.longestSession === 300, 'longest = 300');
  ok(state.completedToday === 1, 'completedToday 1');
  ok(!result.dailyGoalReached, 'goal not reached at 1 session');
  ok(result.streakIncreased, 'streak increased on first day');

  // No record bonus when not beating the record
  const r2 = gs.recordSession(state, 120, NOW);
  ok(r2.result.recordBonus === 0 && r2.result.newRecord === false, 'no record bonus below record');
  ok(r2.result.coinsEarned === 12, '120s -> 12 coins');
  ok(r2.state.completedToday === 2, 'completedToday 2');
  ok(r2.result.dailyGoalReached === false, '2 sessions < 3 goal');

  const r3 = gs.recordSession(r2.state, 120, NOW);
  ok(!r3.result.dailyGoalReached, 'three 2-min sessions are not 15 focus minutes');
}

console.log('== 2. Weekend double points ==');
{
  const { state, result } = gs.recordSession(base(), 1500, SAT); // 25 min Saturday
  ok(result.weekendBonus === true, 'Saturday is weekend');
  ok(result.baseCoins === 150, '1500s -> 150 base');
  ok(result.coinsEarned === 300 + 50, '150 x2 + 50 record = 350');
  ok(state.coins === 350, 'state coins 350');
}

console.log('== 3. Daily goal claim ==');
{
  let s = base();
  s.minutesToday = gs.DAILY_GOAL;
  s.lastFocusDate = gs.todayKey();
  s.dailyProgressDate = gs.todayKey();
  const c1 = gs.claimDailyGoal(s);
  ok(c1.reward === gs.DAILY_GOAL_REWARD, `daily goal reward ${gs.DAILY_GOAL_REWARD}`);
  ok(c1.state.coins === gs.DAILY_GOAL_REWARD && c1.state.dailyGoalClaimed, 'coins added, claimed flag');
  const c2 = gs.claimDailyGoal(c1.state);
  ok(c2.reward === 0, 'cannot claim twice');
  let s2 = base();
  s2.minutesToday = gs.DAILY_GOAL - 1;
  s2.lastFocusDate = gs.todayKey();
  s2.dailyProgressDate = gs.todayKey();
  ok(gs.claimDailyGoal(s2).reward === 0, 'cannot claim before the goal');
}

console.log('== 4. Check-in strip D1-D7 + jackpot + escalation ==');
{
  // Walk the full cycle: streak 1..7, claim each day (one per day)
  let s = base();
  let day = 1;
  const dayNames = [10, 20, 30, 50, 80, 120, 200];
  let running = 0;
  for (const expected of dayNames) {
    s.currentStreak = day;
    s.lastFocusDate = gs.todayKey();
    // Simulate a new day: clear lastCheckinDate so the one-per-day cap resets
    s.lastCheckinDate = null;
    const c = gs.claimDayReward(s, day);
    ok(c.reward === expected, `D${day} reward = ${expected} (got ${c.reward})`);
    running += expected;
    ok(c.state.coins === running, `D${day} coins accumulate to ${running}`);
    s = c.state;
    day++;
  }
  ok(s.jackpots === 1, 'jackpot count 1 after D7');
  ok(s.claimedDays.length === 0, 'cycle resets after D7');
  ok(s.coins === 510, 'full cycle total 510 (10+20+30+50+80+120+200)');
  ok(s.lastCheckinDate === gs.todayKey(), 'lastCheckinDate set after claim');

  // Cannot claim a second time on the same day
  const sameDayBlock = gs.claimDayReward(s, 1);
  ok(sameDayBlock.reward === 0, 'cannot claim twice same day (one-per-day cap)');

  // Cannot claim beyond streak / repeat / out of range
  let s2 = base();
  s2.currentStreak = 1;
  s2.lastFocusDate = gs.todayKey();
  ok(gs.claimDayReward(s2, 2).reward === 0, 'cannot claim D2 at streak 1');
  ok(gs.claimDayReward(s2, 8).reward === 0, 'cannot claim D8');
  ok(gs.claimDayReward(s2, 0).reward === 0, 'cannot claim D0');
  const d1 = gs.claimDayReward(s2, 1);
  ok(gs.claimDayReward(d1.state, 1).reward === 0, 'cannot re-claim D1');

  // === Edge case: infinite-loop exploit (the original bug) ===
  // After D7 claimed, claimedDays resets to [] but lastCheckinDate blocks
  // same-day re-claiming of D1-D7 in a new cycle.
  let exploit = base();
  exploit.currentStreak = 7;
  exploit.lastFocusDate = gs.todayKey();
  exploit.claimedDays = [1, 2, 3, 4, 5, 6];
  const d7 = gs.claimDayReward(exploit, 7);
  ok(d7.reward > 0, 'D7 jackpot claimed');
  ok(d7.state.jackpots === 1, 'jackpot count 1');
  ok(d7.state.claimedDays.length === 0, 'claimedDays reset after D7');
  // Same day: try D1 of new cycle — must be blocked
  const exploitD1 = gs.claimDayReward(d7.state, 1);
  ok(exploitD1.reward === 0, 'cannot exploit: D1 blocked same day after D7');
  // Same day: try D7 again — also blocked
  const exploitD7 = gs.claimDayReward(d7.state, 7);
  ok(exploitD7.reward === 0, 'cannot exploit: D7 blocked same day after D7');

  // === Edge case: next day after D7 — new cycle starts ===
  // Simulate a new day by clearing lastCheckinDate
  const nextDay = { ...d7.state, lastCheckinDate: null };
  nextDay.currentStreak = 8;
  nextDay.lastFocusDate = gs.todayKey();
  const newCycleD1 = gs.claimDayReward(nextDay, 1);
  ok(newCycleD1.reward > 0, 'D1 claimable next day after D7 (new cycle)');
  ok(newCycleD1.state.jackpots === 1, 'jackpot count still 1 after D1 of cycle 2');

  // Walk real focus transitions across the cycle boundary. The check-in
  // reward strip loops to Day 1, but the consecutive focus streak must not.
  let continuous = base();
  for (let day = 1; day <= 7; day++) {
    const date = D7(day);
    continuous = gs.recordSession(continuous, 60, date).state;
    ok(continuous.currentStreak === day, `focus streak reaches ${day} on cycle day ${day}`);
    const claimDay = gs.claimableCheckinDay(continuous, date);
    ok(claimDay === day, `cycle day ${day} reward becomes claimable`);
    continuous = gs.claimDayReward(continuous, claimDay, date).state;
  }
  const eighthDay = D7(8);
  continuous = gs.recordSession(continuous, 60, eighthDay).state;
  ok(continuous.currentStreak === 8 && continuous.bestStreak === 8, 'focus streak and best streak continue to day 8');
  ok(gs.checkinProgress(continuous, eighthDay) === 0, 'new reward cycle starts at 0/7 without resetting the focus streak');
  ok(gs.claimableCheckinDay(continuous, eighthDay) === 1, 'day 8 focus can claim cycle 2, day 1');
  continuous = gs.claimDayReward(continuous, 1, eighthDay).state;
  for (let day = 9; day <= 30; day++) {
    const date = D7(day);
    continuous = gs.recordSession(continuous, 60, date).state;
    ok(continuous.currentStreak === day, `focus streak keeps counting through day ${day}`);
    const cycleDay = ((day - 1) % gs.DAY_REWARDS.length) + 1;
    const claimDay = gs.claimableCheckinDay(continuous, date);
    ok(claimDay === cycleDay, `day ${day} continues on reward cycle day ${cycleDay}`);
    continuous = gs.claimDayReward(continuous, claimDay, date).state;
  }
  ok(continuous.currentStreak === 30 && continuous.bestStreak === 30, 'streak and personal best reach day 30');
  ok(continuous.jackpots === 4, 'four weekly reward cycles complete without resetting the streak');

  // === Edge case: catch-up within cycle limited to one per day ===
  let catchup = base();
  catchup.currentStreak = 5;
  catchup.lastFocusDate = gs.todayKey();
  catchup.claimedDays = [];
  catchup.lastCheckinDate = null;
  const cu1 = gs.claimDayReward(catchup, 1);
  ok(cu1.reward > 0, 'catch-up D1 claimed');
  // Same day: try D2 — blocked by one-per-day
  const cu2 = gs.claimDayReward(cu1.state, 2);
  ok(cu2.reward === 0, 'catch-up D2 blocked same day (one-per-day)');

  // === Edge case: old save without lastCheckinDate ===
  let old = base();
  old.currentStreak = 3;
  old.lastFocusDate = gs.todayKey();
  old.lastCheckinDate = undefined; // simulates pre-fix localStorage
  const oldClaim = gs.claimDayReward(old, 1);
  ok(oldClaim.reward > 0, 'old save without lastCheckinDate can claim');

  // Escalation: cycle 2 rewards +50%
  let s3 = base();
  s3.jackpots = 1; // one completed cycle
  s3.currentStreak = 1;
  s3.lastFocusDate = gs.todayKey();
  s3.lastCheckinDate = null;
  ok(gs.claimDayReward(s3, 1).reward === 15, 'cycle 2 D1 = 10 x1.5 = 15');
  // New day for next claim
  s3.lastCheckinDate = null;
  s3.currentStreak = 7;
  s3.claimedDays = [1, 2, 3, 4, 5, 6];
  ok(gs.claimDayReward(s3, 7).reward === 300, 'cycle 2 D7 = 200 x1.5 = 300');
  // Escalation cap x4 (after 6 cycles)
  let s4 = base();
  s4.jackpots = 6;
  s4.currentStreak = 7;
  s4.lastFocusDate = gs.todayKey();
  s4.claimedDays = [1, 2, 3, 4, 5, 6];
  ok(gs.claimDayReward(s4, 7).reward === 800, 'jackpot capped at x4 = 800');
  ok(gs.checkinMultiplier(6) === 4, 'multiplier caps at 4');

  // Check-ins must be sequential and require a live streak.
  let ordered = base();
  ordered.currentStreak = 7;
  ordered.lastFocusDate = gs.todayKey();
  ok(gs.claimDayReward(ordered, 7).reward === 0, 'cannot skip directly to D7');
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 2);
  ordered.lastFocusDate = gs.todayKey(staleDate);
  ok(gs.claimDayReward(ordered, 1).reward === 0, 'cannot claim against an expired streak');
}

console.log('== 5. Daily bonus ==');
{
  const s = base();
  const c = gs.claimDailyBonus(s);
  ok(c.reward >= 10 && c.reward <= 30, `daily bonus in 10..30 (got ${c.reward})`);
  ok(c.state.coins === c.reward, 'bonus added');
  ok(gs.claimDailyBonus(c.state).reward === 0, 'cannot claim twice same day');
  const v1 = gs.dailyBonusValue();
  const v2 = gs.dailyBonusValue();
  ok(v1 === v2, 'daily bonus value stable within the day');
}

console.log('== 6. Fail consolation ==');
{
  ok(gs.awardFailConsolation(base(), 300).reward === 1, '5 min survived -> 1 coin');
  ok(gs.awardFailConsolation(base(), 899).reward === 2, '899s -> 2 coins');
  ok(gs.awardFailConsolation(base(), 299).reward === 0, 'under 5 min -> 0');
  const s = gs.awardFailConsolation(base(), 600).state;
  ok(s.coins === 2, 'consolation coins added');
}

console.log('== 7. Streak repair ==');
{
  let s = base();
  s.currentStreak = 5;
  s.lastFocusDate = gs.todayKey();
  ok(!gs.canRepairStreak(s), 'not repairable same day');
  // Build a one-missed-day gap: last focus was two calendar days ago.
  const d = new Date();
  d.setDate(d.getDate() - 2);
  const twoDaysAgo = gs.todayKey(d);
  s.lastFocusDate = twoDaysAgo;
  ok(gs.canRepairStreak(s), 'repairable after one missed day');
  s.coins = gs.STREAK_REPAIR_COST;
  const r = gs.repairStreak(s);
  ok(r.repaired && r.state.coins === 0, `repair costs ${gs.STREAK_REPAIR_COST}`);
  ok(r.state.lastFocusDate === gs.yesterdayKey(), 'repair backfills yesterday');
  // next session extends the streak instead of resetting
  const next = gs.recordSession(r.state, 60, new Date());
  ok(next.result.streak === 6, 'repaired streak continues (5 -> 6)');
  // not enough coins
  let poor = base();
  poor.currentStreak = 3;
  poor.lastFocusDate = twoDaysAgo;
  poor.coins = 10;
  ok(!gs.repairStreak(poor).repaired, 'repair fails without enough coins');
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 3);
  poor.lastFocusDate = gs.todayKey(oldDate);
  poor.coins = 500;
  ok(!gs.repairStreak(poor).repaired, 'one repair cannot erase multiple missed days');
}

console.log('== 8. Streak shield: one prepaid day ==');
{
  // One shield covers one missed day. Hoarding a stock of them made the rule
  // hard to explain (freezes only paid out when they covered the *whole* gap)
  // and turned the Home screen into two competing protection cards.
  ok(gs.STREAK_FREEZE_MAX === 1, `one shield max (got ${gs.STREAK_FREEZE_MAX})`);

  let s = { ...base(), currentStreak: 3, bestStreak: 3, lastFocusDate: gs.todayKey(), coins: 999 };
  ok(gs.canBuyStreakFreeze(s), 'a live streak can buy a shield');
  const b1 = gs.buyStreakFreeze(s);
  ok(b1.ok && b1.state.streakFreezes === 1 && b1.state.coins === 999 - gs.STREAK_FREEZE_COST, `shield bought for ${gs.STREAK_FREEZE_COST}`);
  ok(!gs.buyStreakFreeze(b1.state).ok, 'cannot hold two shields');
  ok(!gs.canBuyStreakFreeze({ ...s, currentStreak: 0 }), 'nothing to protect without a streak');
  ok(!gs.buyStreakFreeze({ ...s, coins: 0 }).ok, 'cannot buy without coins');

  const twoAgo = new Date();
  twoAgo.setDate(twoAgo.getDate() - 2);
  ok(!gs.canBuyStreakFreeze({ ...s, lastFocusDate: gs.todayKey(twoAgo) }), 'a shield cannot be bought once the day is already missed');

  // Consumed exactly once, bridging one missed day.
  const f = { ...base(), currentStreak: 2, bestStreak: 2, streakFreezes: 1, lastFocusDate: gs.todayKey(twoAgo) };
  const fs = gs.recordSession(f, 60, new Date());
  ok(fs.result.streak === 3, 'shield saves a one-day gap (2 -> 3)');
  ok(fs.result.freezeUsed === 1 && fs.state.streakFreezes === 0, 'shield consumed');

  // A two-day gap is beyond one shield: streak restarts, shield is kept.
  const threeAgo = new Date();
  threeAgo.setDate(threeAgo.getDate() - 3);
  const g = { ...base(), currentStreak: 2, bestStreak: 2, streakFreezes: 1, lastFocusDate: gs.todayKey(threeAgo) };
  const gs2 = gs.recordSession(g, 60, new Date());
  ok(gs2.result.streak === 1, 'one shield cannot bridge two missed days');
  ok(gs2.result.freezeUsed === 0 && gs2.state.streakFreezes === 1, 'shield kept when it cannot save the streak');

  // Legacy saves holding 2+ shields are clamped and refunded for the extras so
  // nobody loses coins to the new one-shield rule.
  const saved = global.localStorage;
  global.localStorage = {
    getItem: () => JSON.stringify({ currentStreak: 4, streakFreezes: 3, coins: 0 }),
    setItem: () => {},
  };
  const migrated = gs.loadGameState();
  global.localStorage = saved;
  ok(migrated.streakFreezes === gs.STREAK_FREEZE_MAX, 'legacy shield stock clamps to one');
  ok(migrated.coins === 2 * gs.STREAK_FREEZE_COST, 'extra legacy shields are refunded');
}

console.log('== 9. Forest removed: saves migrate without losing progress ==');
{
  // Focused minutes still count toward lifetime focus (the pet collection
  // measures it) — no session may silently lose time now the forest is gone.
  const { state } = gs.recordSession(base(), 1500, NOW);
  ok(state.focusSeconds === 1500, '25 focus minutes tracked (in seconds)');
  ok(state.trees === undefined, 'no tree fields on new state');
  ok(state.forestDonated === undefined, 'no donation counter on new state');

  // Coins donated to the removed forest are refunded exactly once.
  const savedLocalStorage = global.localStorage;
  const load = value => {
    global.localStorage = { getItem: () => value, setItem: () => {} };
    return gs.loadGameState();
  };
  const legacy = JSON.stringify({
    coins: 100,
    forestDonated: 250,
    trees: 3,
    treeProgress: 40,
    ownedMascots: ['bear'],
  });
  const migrated = load(legacy);
  ok(migrated.coins === 350, 'donated coins refunded on first load');
  ok(migrated.trees === undefined && migrated.forestDonated === undefined, 'legacy tree fields dropped');

  // Loading the already-migrated save must not refund a second time.
  gs.saveGameState(migrated);
  const again = gs.loadGameState();
  ok(again.coins === 350, 'refund is idempotent across reloads');

  // A save with no donation history is untouched.
  const clean = load(JSON.stringify({ coins: 100, ownedMascots: ['bear'] }));
  ok(clean.coins === 100, 'no refund when nothing was donated');
  global.localStorage = savedLocalStorage;
}

console.log('== 10. Mascot / accessory / theme shops ==');
{
  // Accessory: buy auto-equips, re-buy fails, equip/remove works
  let s = base();
  s.coins = 400;
  const ab = gs.buyAccessory(s, 'scarf');
  ok(ab.ok && ab.cost === 150 && ab.state.coins === 250, 'scarf bought for 150');
  ok(ab.state.ownedAccessories.includes('scarf') && ab.state.equippedAccessory === 'scarf', 'auto-equipped');
  ok(!gs.buyAccessory(ab.state, 'scarf').ok, 'cannot re-buy');
  const f = gs.buyAccessory(ab.state, 'flower');
  ok(f.ok && f.state.equippedAccessory === 'flower', 'flower bought + equipped');
  const eq = gs.equipAccessory(f.state, 'scarf');
  ok(eq.ok && eq.state.equippedAccessory === 'scarf', 'swap to scarf');
  ok(!gs.equipAccessory(f.state, 'crown').ok, 'cannot equip unowned');
  const rem = gs.equipAccessory(eq.state, null);
  ok(rem.ok && rem.state.equippedAccessory === null, 'remove accessory');
  ok(!gs.equipAccessory(rem.state, null).ok, 'no-op remove');

  // Every catalog item must be purchasable at its listed price, auto-equip,
  // and remain selectable/removable after purchase.
  for (const item of gs.ACCESSORY_CATALOG) {
    const affordable = { ...base(), coins: item.price };
    const bought = gs.buyAccessory(affordable, item.id);
    ok(bought.ok && bought.cost === item.price, `${item.id} buys at catalog price`);
    ok(bought.state.coins === 0, `${item.id} deducts exact price`);
    ok(bought.state.ownedAccessories.includes(item.id), `${item.id} is owned after purchase`);
    ok(bought.state.equippedAccessory === item.id, `${item.id} auto-equips`);
    ok(!gs.buyAccessory(bought.state, item.id).ok, `${item.id} cannot be bought twice`);
    const removed = gs.equipAccessory(bought.state, null);
    ok(removed.ok && removed.state.equippedAccessory === null, `${item.id} can be removed`);
    const worn = gs.equipAccessory(removed.state, item.id);
    ok(worn.ok && worn.state.equippedAccessory === item.id, `${item.id} can be re-equipped`);
    const short = gs.buyAccessory({ ...base(), coins: Math.max(0, item.price - 1) }, item.id);
    ok(!short.ok && !short.state.ownedAccessories.includes(item.id), `${item.id} stays locked when unaffordable`);
  }

  // Theme: buy + equip
  let t = base();
  t.coins = 500;
  const tb = gs.buyTheme({ ...t, coins: 900 }, 'pink');
  ok(tb.ok && tb.cost === 600 && tb.state.coins === 300, 'pink theme for 600');
  ok(tb.state.activeTheme === 'pink' && tb.state.ownedThemes.includes('pink'), 'theme applied');
  ok(!gs.buyTheme(tb.state, 'pink').ok, 'cannot re-buy theme');
  ok(!gs.buyTheme(base(), 'emerald').ok, 'cannot buy theme with 0 coins');
  const te = gs.equipTheme(tb.state, 'blue');
  ok(te.ok && te.state.activeTheme === 'blue', 'equip blue back');
  ok(!gs.equipTheme(tb.state, 'purple').ok, 'cannot equip unowned theme');

  // Exercise each paid theme through purchase, persistence fields, and swaps.
  for (const item of gs.THEME_CATALOG.filter(theme => theme.price > 0)) {
    const affordable = { ...base(), coins: item.price };
    const bought = gs.buyTheme(affordable, item.id);
    ok(bought.ok && bought.cost === item.price, `${item.id} theme buys at catalog price`);
    ok(bought.state.coins === 0, `${item.id} theme deducts exact price`);
    ok(bought.state.ownedThemes.includes(item.id), `${item.id} theme is owned after purchase`);
    ok(bought.state.activeTheme === item.id, `${item.id} theme auto-applies`);
    ok(!gs.buyTheme(bought.state, item.id).ok, `${item.id} theme cannot be bought twice`);
    const reverted = gs.equipTheme(bought.state, 'blue');
    ok(reverted.ok && reverted.state.activeTheme === 'blue', `${item.id} can switch back to blue`);
    const reapplied = gs.equipTheme(reverted.state, item.id);
    ok(reapplied.ok && reapplied.state.activeTheme === item.id, `${item.id} can be re-applied`);
    const short = gs.buyTheme({ ...base(), coins: item.price - 1 }, item.id);
    ok(!short.ok && !short.state.ownedThemes.includes(item.id), `${item.id} stays locked when unaffordable`);
  }
  ok(!gs.buyTheme({ ...base(), coins: 1 }, 'blue').ok, 'free default blue theme is not bought twice');
  ok(!gs.isAccessoryId('bow') && !gs.isAccessoryId('cap'), 'retired accessory ids are no longer in the shop');

  // Pets: earned (never bought), equip is free
  let m = base();
  ok(typeof gs.buyMascot === 'undefined', 'pets cannot be bought');
  ok(!gs.equipMascot(m, 'panda').ok, 'cannot equip a locked pet');
  m = gs.unlockEarnedPets({ ...m, totalSessions: 1 }).state;
  const me = gs.equipMascot(m, 'bear');
  ok(me.ok && me.state.activeMascot === 'bear' && me.state.coins === 0, 'equip earned bear for free');
  ok(!gs.equipMascot(me.state, 'bear').ok, 'no-op equip of active pet');
}

console.log('== 11. Achievements ==');
{
  const stats = (o) => ({ totalSessions: 0, bestStreak: 0, petsOwned: 0, focusSeconds: 0, longestSession: 0, jackpots: 0, ...o });
  const total = gs.ACHIEVEMENTS.length;
  ok(gs.unlockedCount(stats({})) === 0, `0/${total} at fresh state`);
  ok(gs.unlockedCount(stats({ totalSessions: 1 })) === 1, 'First Focus at 1 session');
  ok(gs.unlockedCount(stats({ totalSessions: 10 })) === 2, '+ Double Digits at 10 sessions');
  ok(gs.unlockedCount(stats({ totalSessions: 50 })) === 3, '+ Focus Machine at 50');
  ok(gs.unlockedCount(stats({ bestStreak: 3 })) === 1, 'On a Roll at 3-day');
  ok(gs.unlockedCount(stats({ bestStreak: 7 })) === 2, '+ Week Warrior at 7-day');
  ok(gs.unlockedCount(stats({ bestStreak: 14 })) === 3, '+ Fortnight');
  ok(gs.unlockedCount(stats({ bestStreak: 30 })) === 4, '+ Month Master');
  ok(gs.unlockedCount(stats({ longestSession: 1500 })) === 1, 'Record Breaker at 25 min');
  ok(gs.unlockedCount(stats({ longestSession: 2700 })) === 2, '+ Deep Work at 45 min');
  ok(gs.unlockedCount(stats({ longestSession: 5400 })) === 4, '+ Ultra Focus at 90 min (4: record+deep+marathon+ultra)');
  ok(gs.unlockedCount(stats({ longestSession: 3600 })) >= 2, 'Marathoner unlocks at 60 min');
  ok(gs.unlockedCount(stats({ jackpots: 1 })) === 1, 'Jackpot at 1');
  ok(gs.unlockedCount(stats({ jackpots: 3 })) === 2, '+ Jackpot Master at 3');
  ok(gs.unlockedCount(stats({ jackpots: 5 })) === 3, '+ Jackpot Legend at 5');

  // The collection replaced the forest as the progression spine.
  ok(gs.unlockedCount(stats({ petsOwned: 5 })) === 1, 'Growing Family at 5 friends');
  ok(gs.unlockedCount(stats({ petsOwned: 11 })) === 2, '+ Half the Crew at 11');
  ok(gs.unlockedCount(stats({ petsOwned: 22 })) === 3, '+ Complete Collection at 22');
  ok(gs.unlockedCount(stats({ focusSeconds: 36000 })) === 1, 'Ten Hours In at 10h');

  // No achievement may mention the removed forest.
  ok(!gs.ACHIEVEMENTS.some(a => /tree|forest/i.test(a.name + a.desc)), 'no tree/forest achievements remain');
  ok(gs.ACHIEVEMENTS.every(a => typeof a.icon === 'string' && !a.emoji), 'every achievement uses an icon key, never an emoji');

  // Full house
  const full = stats({
    totalSessions: 50, bestStreak: 30, petsOwned: 22,
    focusSeconds: 36000, longestSession: 5400, jackpots: 5,
  });
  ok(gs.unlockedCount(full) === total, `all ${total} unlock at max stats`);
}

console.log('== 12. Streak edge cases (missed day resets) ==');
{
  let s = base();
  s.currentStreak = 2;
  s.bestStreak = 2;
  const d = new Date();
  d.setDate(d.getDate() - 3); // missed 2+ days, no freeze
  s.lastFocusDate = gs.todayKey(d);
  const r = gs.recordSession(s, 60, new Date());
  ok(r.result.streak === 1, 'missed day without freeze resets to 1');
  ok(r.state.bestStreak === 2, 'best streak preserved');
  s.claimedDays = [1, 2];
  const resetCheckins = gs.recordSession(s, 60, new Date());
  ok(resetCheckins.state.claimedDays.length === 0, 'broken streak resets check-in progress');
  // same-day second session does not bump streak
  const t = gs.todayKey();
  let s2 = base();
  s2.currentStreak = 4;
  s2.lastFocusDate = t;
  const r2 = gs.recordSession(s2, 60, new Date());
  ok(r2.result.streak === 4 && !r2.result.streakIncreased, 'same-day session keeps streak');
}

console.log('== 13. Daily rollover is independent from streak repair ==');
{
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  let s = base();
  s.lastFocusDate = gs.todayKey(yesterday);
  s.dailyProgressDate = gs.todayKey(yesterday);
  s.completedToday = 3;
  s.dailyGoalClaimed = true;
  const normalized = gs.normalizeForToday(s);
  ok(normalized.completedToday === 0 && !normalized.dailyGoalClaimed, 'daily counters reset on a new day');
  ok(normalized.lastFocusDate === s.lastFocusDate, 'daily rollover does not rewrite streak history');

  normalized.currentStreak = 4;
  normalized.coins = 500;
  const older = new Date();
  older.setDate(older.getDate() - 2);
  normalized.lastFocusDate = gs.todayKey(older);
  normalized.completedToday = 2;
  const repaired = gs.repairStreak(normalized);
  ok(repaired.repaired, 'streak repair succeeds for one missed day');
  ok(repaired.state.completedToday === 2, 'streak repair does not erase current daily progress');
}

console.log('== 13b. Streak expiry, repair window, and advance freezes ==');
{
  const now = new Date(2026, 7, 20, 12);
  const missed = { ...base(), currentStreak: 5, bestStreak: 5,
    lastFocusDate: '2026-08-18', dailyProgressDate: '2026-08-18',
    claimedDays: [1, 2, 3, 4, 5], coins: 200 };
  const rolled = gs.normalizeForToday(missed, now);
  ok(gs.activeStreak(rolled, now) === 5, 'a one-day gap is still recoverable, so the streak stays visible');
  ok(rolled.currentStreak === 5 && gs.canRepairStreak(rolled, now), 'old streak retained only for repair window');
  ok(rolled.bestStreak === 5, 'personal best retained after miss');
  // The store validates the same rule against the actual current date.
  const realYesterday = new Date(); realYesterday.setDate(realYesterday.getDate() - 2);
  const repairWindow = { ...missed, lastFocusDate: gs.todayKey(realYesterday) };
  ok(!gs.buyStreakFreeze(repairWindow).ok, 'cannot buy freeze after missed day');
  const uncovered = gs.recordSession(rolled, 60, now);
  ok(uncovered.state.currentStreak === 1 && uncovered.state.claimedDays.length === 0, 'unprotected session restarts streak and check-ins');
  const protectedState = { ...missed, streakFreezes: 1 };
  const frozen = gs.recordSession(protectedState, 60, now);
  ok(gs.activeStreak(protectedState, now) === 5 && frozen.state.currentStreak === 6 && frozen.result.freezeUsed === 1, 'pre-owned freeze protects and is consumed');
  ok(!gs.canRepairStreak(protectedState, now) && !gs.repairStreak(protectedState, now).repaired, 'covered gap cannot charge for an unnecessary repair');
  const late = gs.normalizeForToday(missed, new Date(2026, 7, 23, 12));
  ok(late.currentStreak === 0 && late.claimedDays.length === 0 && late.bestStreak === 5, 'unrepairable streak and check-ins expire on rollover');
  ok(gs.recordSession(late, 60, new Date(2026, 7, 23, 12)).state.currentStreak === 1, 'first later session starts a fresh streak');
}

console.log('== 14. Clock rollback protection ==');
{
  const day1 = new Date(2026, 8, 18, 10, 0, 0);
  const day2 = new Date(2026, 8, 19, 10, 0, 0);
  const prior = new Date(2026, 8, 17, 10, 0, 0);
  let s = base();
  s.currentStreak = 2;
  s.lastFocusDate = gs.todayKey(day1);
  const first = gs.claimDayReward(s, 1, day1);
  ok(first.reward > 0, 'fixed-date D1 claim succeeds');
  ok(gs.claimDayReward(first.state, 2, prior).reward === 0, 'clock rollback cannot advance check-ins');
  ok(gs.claimDayReward(first.state, 2, day2).reward === 0, 'check-in requires a focus session today');
  const focused = gs.recordSession(first.state, 60, day2);
  const second = gs.claimDayReward(focused.state, 2, day2);
  ok(second.reward > 0, 'next calendar day advances check-ins after focusing');

  const bonus = gs.claimDailyBonus(base(), day1);
  ok(bonus.reward > 0, 'fixed-date daily bonus succeeds');
  ok(gs.claimDailyBonus(bonus.state, prior).reward === 0, 'clock rollback cannot repeat daily bonus');
  ok(gs.claimDailyBonus(bonus.state, day2).reward > 0, 'daily bonus returns on a later day');

  let future = base();
  future.lastFocusDate = gs.todayKey(day2);
  future.dailyProgressDate = gs.todayKey(day2);
  const blocked = gs.recordSession(future, 60, day1);
  ok(blocked.result.coinsEarned === 0 && blocked.state.totalSessions === 0, 'clock rollback cannot record sessions before saved progress');
}

console.log('== 15. Invalid transition inputs ==');
{
  for (const seconds of [0, -1, 1.5, NaN, Infinity, gs.MAX_SESSION_SECONDS + 1]) {
    const result = gs.recordSession(base(), seconds, NOW);
    ok(result.result.coinsEarned === 0 && result.state.totalSessions === 0, `invalid session rejected: ${seconds}`);
  }
  for (const seconds of [-1, NaN, Infinity]) {
    const result = gs.awardFailConsolation(base(), seconds);
    ok(result.reward === 0 && result.state.coins === 0, `invalid consolation rejected: ${seconds}`);
  }
  const capped = gs.awardFailConsolation(base(), 999999999);
  ok(capped.reward === gs.MAX_SESSION_SECONDS / 300, 'consolation is capped to maximum session');
}

console.log('== 16. Malformed save recovery ==');
{
  const savedLocalStorage = global.localStorage;
  const load = value => {
    global.localStorage = { getItem: () => value, setItem: () => {} };
    return gs.loadGameState();
  };
  const malformed = load(JSON.stringify({
    coins: '100',
    currentStreak: -4,
    completedToday: Infinity,
    dailyGoalClaimed: 'false',
    claimedDays: [1, 3, 2, 2, 99],
    trees: -2,
    streakFreezes: 99,
    lastFocusDate: '2026-02-30',
    ownedMascots: ['cat', 'bear', 'cat', 'invalid'],
    ownedAccessories: ['flower', 'bow', 'cap', 'bow', 'invalid'],
    equippedAccessory: 'cap',
    ownedThemes: ['pink', 'pink', 'invalid'],
  }));
  ok(malformed.coins === 0 && malformed.currentStreak === 0, 'invalid numeric save fields are sanitized');
  ok(malformed.streakFreezes === gs.STREAK_FREEZE_MAX, 'freeze count is clamped');
  ok(malformed.lastFocusDate === null && malformed.dailyGoalClaimed === false, 'invalid dates and booleans are sanitized');
  ok(malformed.claimedDays.join(',') === '1,2,3', 'check-in save is canonicalized to a prefix');
  ok(malformed.ownedMascots.join(',') === 'cat,bear', 'mascot ownership is valid and deduplicated');
  ok(malformed.ownedAccessories.includes('flower') && malformed.ownedAccessories.includes('scarf') && malformed.ownedAccessories.includes('halo'), 'legacy accessory ownership maps to new designs');
  ok(malformed.ownedAccessories.filter(id => id === 'scarf').length === 1, 'accessory migration deduplicates replacements');
  ok(malformed.equippedAccessory === 'halo', 'equipped legacy cap maps to the halo');
  ok(malformed.ownedThemes.join(',') === 'blue,pink', 'theme ownership is valid and deduplicated');
  ok(load('null').coins === 0 && load('[]').coins === 0, 'non-object saves recover to defaults');

  // Legacy forest fields of any shape are ignored rather than crashing the load.
  const legacy = load(JSON.stringify({
    trees: 2,
    totalSessions: 5,
    treePlantedDay: ['bad', 1],
    treePlantedSession: [99, -1],
    forestDonated: 'nope',
  }));
  ok(legacy.trees === undefined && legacy.forestDonated === undefined, 'legacy forest fields dropped cleanly');
  ok(legacy.coins === 0, 'a malformed donation total refunds nothing');
  global.localStorage = savedLocalStorage;
}

console.log('== 17. Calendar date arithmetic ==');
{
  ok(gs.daysBetween('2024-03-09', '2024-03-11') === 2, 'calendar days ignore DST-length differences');
  ok(gs.daysBetween('2024-02-28', '2024-03-01') === 2, 'leap day is counted');
  ok(gs.daysBetween('2026-02-30', '2026-03-01') === Infinity, 'invalid calendar date is rejected');
  ok(gs.daysBetween('bad', '2026-03-01') === Infinity, 'malformed date is rejected');
}

console.log('== 18. Interrupted session recovery ==');
{
  const savedLocalStorage = global.localStorage;
  const items = new Map();
  global.localStorage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: key => items.delete(key),
  };
  gs.markSessionRunning();
  ok(gs.consumeInterruptedSession(), 'reload detects an interrupted running session');
  ok(!gs.consumeInterruptedSession(), 'interruption is reported only once');
  gs.markSessionRunning();
  gs.clearSessionRunning();
  ok(!gs.consumeInterruptedSession(), 'completed or failed session leaves no interruption');
  ok(items.size === 0, 'interruption marker is not stored in game rewards');
  global.localStorage = savedLocalStorage;
}

console.log('== 19. Custom duration picker stays within rewardable range ==');
{
  // The picker allows up to 240 min + 59 s. Anything it produces must be a
  // session recordSession accepts, or the user focuses for nothing.
  const max = gs.clampCustomDuration(240, 59);
  ok(max === gs.MAX_SESSION_SECONDS, `picker max clamps to 4 h (got ${max})`);
  const r = gs.recordSession(base(), max, NOW);
  ok(r.state.totalSessions === 1 && r.result.coinsEarned > 0, 'max picker session is rewarded');
  ok(gs.clampCustomDuration(0, 9) === null, 'below minimum is rejected');
  ok(gs.clampCustomDuration(0, 10) === gs.MIN_SESSION_SECONDS, 'minimum accepted');
  ok(gs.clampCustomDuration(45, 0) === 2700, '45 min -> 2700 s');
  ok(gs.clampCustomDuration(1.7, 30.9) === 90, 'fractional input truncates');
  ok(gs.clampCustomDuration(NaN, 75) === 59, 'NaN minutes -> 0, seconds capped at 59');
  ok(gs.clampCustomDuration(-5, -5) === null, 'negatives clamp to 0 -> rejected');
}

console.log('== 20. Check-in claimability + cycle progress (single source of truth) ==');
{
  const day1 = new Date(2026, 8, 18, 10);
  const t = gs.todayKey(day1);
  const live = { ...base(), currentStreak: 3, lastFocusDate: t, dailyProgressDate: t };
  ok(gs.claimableCheckinDay(live, day1) === 1, 'D1 claimable when focused today');
  ok(gs.claimableCheckinDay({ ...live, lastFocusDate: '2026-09-17' }, day1) === null, 'not claimable before focusing today');
  ok(gs.claimableCheckinDay({ ...live, lastCheckinDate: t }, day1) === null, 'not claimable twice in one day');
  ok(gs.claimableCheckinDay({ ...live, claimedDays: [1, 2, 3] }, day1) === null, 'next day cannot exceed streak');
  ok(gs.claimableCheckinDay({ ...live, currentStreak: 9, claimedDays: [1, 2, 3, 4, 5, 6] }, day1) === 7, 'jackpot day claimable');
  // The claim transition must agree with the predicate for every day.
  for (let d = 0; d <= 8; d++) {
    const expected = gs.claimableCheckinDay(live, day1) === d;
    ok((gs.claimDayReward(live, d, day1).reward > 0) === expected, `claimDayReward agrees with predicate for D${d}`);
  }

  ok(gs.checkinProgress({ ...base(), claimedDays: [1, 2, 3] }, day1) === 3, 'progress counts claimed days');
  const jackpotToday = gs.claimDayReward({ ...live, currentStreak: 7, claimedDays: [1, 2, 3, 4, 5, 6] }, 7, day1).state;
  ok(gs.checkinProgress(jackpotToday, day1) === 7, 'shows 7/7 on the jackpot day');
  ok(gs.checkinProgress(jackpotToday, new Date(2026, 8, 19, 10)) === 0, 'new cycle starts at 0 the next day');
  ok(gs.checkinProgress({ ...base(), currentStreak: 40 }, day1) === 0, 'long streak alone does not fill the bar');
}

console.log('== 21. Focus history log ==');
{
  const d1 = new Date(2026, 8, 14, 10); // Mon
  let s = gs.recordSession(base(), 300, d1).state;
  s = gs.recordSession(s, 120, new Date(2026, 8, 14, 15)).state;
  s = gs.recordSession(s, 600, new Date(2026, 8, 16, 9)).state;
  ok(s.focusLog.length === 2, 'one log entry per focused day');
  ok(s.focusLog[0].date === '2026-09-14' && s.focusLog[0].sessions === 2 && s.focusLog[0].seconds === 420, 'same-day sessions aggregate');
  const week = gs.recentFocusDays(s, 7, new Date(2026, 8, 16, 20));
  ok(week.length === 7 && week[6].date === '2026-09-16' && week[0].date === '2026-09-10', '7 days ending today, oldest first');
  ok(week[4].seconds === 420 && week[5].seconds === 0 && week[6].seconds === 600, 'missing days are zero-filled');
  // Rejected sessions never log.
  ok(gs.recordSession(base(), 5, d1).state.focusLog.length === 0, 'invalid session is not logged');
  // Cap: only the most recent FOCUS_LOG_DAYS days are kept.
  let long = base();
  for (let i = 0; i < gs.FOCUS_LOG_DAYS + 10; i++) long = gs.recordSession(long, 60, new Date(2026, 0, 1 + i, 10)).state;
  ok(long.focusLog.length === gs.FOCUS_LOG_DAYS, `log capped at ${gs.FOCUS_LOG_DAYS} days`);
  // Malformed saves are sanitized.
  const saved = global.localStorage;
  global.localStorage = { getItem: () => JSON.stringify({ focusLog: [
    { date: '2026-09-02', sessions: 1, seconds: 60 },
    { date: 'bad', sessions: 1, seconds: 60 },
    { date: '2026-09-01', sessions: -1, seconds: 'x' },
    { date: '2026-09-02', sessions: 9, seconds: 9 },
    null,
  ] }), setItem: () => {} };
  const loaded = gs.loadGameState();
  global.localStorage = saved;
  ok(loaded.focusLog.map(e => e.date).join(',') === '2026-09-02', 'invalid/duplicate log entries dropped');
  global.localStorage = { getItem: () => JSON.stringify({ coins: 5 }), setItem: () => {} };
  ok(Array.isArray(gs.loadGameState().focusLog) && gs.loadGameState().focusLog.length === 0, 'old saves get an empty log');
  global.localStorage = saved;
}

console.log('== 22. Streak reminder plan ==');
{
  const at = (d, h, m = 0) => new Date(2026, 8, d, h, m);
  const s = (o) => ({ ...base(), ...o });
  // Focused today -> remind tomorrow evening to keep it.
  let p = gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-14' }), at(14, 10));
  ok(p && p.kind === 'keep' && p.streak === 5 && p.at.getTime() === at(15, 20).getTime(), 'focused today -> tomorrow 20:00 keep');
  // Focused yesterday, morning -> tonight.
  p = gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-13' }), at(14, 10));
  ok(p && p.kind === 'keep' && p.at.getTime() === at(14, 20).getTime(), 'not yet today -> tonight 20:00');
  // Focused yesterday but already past 20:00 -> tomorrow is the repair window.
  p = gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-13' }), at(14, 21));
  ok(p && p.kind === 'repair' && p.at.getTime() === at(15, 20).getTime(), 'late evening -> tomorrow repair reminder');
  // ...unless a freeze already covers it.
  p = gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-13', streakFreezes: 1 }), at(14, 21));
  ok(p && p.kind === 'keep', 'freeze-covered gap -> keep reminder');
  // In the repair window -> tonight repair reminder.
  p = gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-12' }), at(14, 9));
  ok(p && p.kind === 'repair' && p.streak === 5, 'repair window -> repair reminder');
  // No streak -> no nagging.
  ok(gs.streakReminderPlan(base(), at(14, 9)) === null, 'no streak -> no reminder');
  ok(gs.streakReminderPlan(s({ currentStreak: 5, lastFocusDate: '2026-09-01' }), at(14, 9)) === null, 'lost streak -> no reminder');
}

console.log('== 23. Fail consolation rolls the day like every other transition ==');
{
  const stale = { ...base(), dailyProgressDate: '2026-09-13', minutesToday: 20 };
  const r = gs.awardFailConsolation(stale, 1200, new Date(2026, 8, 14, 0, 1));
  ok(r.reward === 4 && r.state.dailyProgressDate === '2026-09-14' && r.state.minutesToday === 0, 'consolation after midnight resets yesterday\'s counters');
}

console.log('== 24. Pet collection: earn by focusing ==');
{
  const cat = gs.MASCOT_CATALOG;
  ok(cat.length === 22, `22 pets in the collection (got ${cat.length})`);
  ok(new Set(cat.map(p => p.id)).size === cat.length, 'pet ids are unique');
  for (const pet of cat) {
    ok(fs.existsSync(path.join(__dirname, '..', 'public', 'pets', `${pet.id}.webp`)), `${pet.id} has portrait art`);
  }
  ok(cat[0].id === 'cat' && cat[0].unlock.kind === 'starter', 'cat is the starter');
  ok(cat[1].id === 'bear' && cat[1].unlock.kind === 'sessions' && cat[1].unlock.value === 1, 'bear unlocks after one session');
  ok(cat.filter(p => p.unlock.kind === 'starter').length === 1, 'exactly one starter');
  for (const p of cat) {
    if (p.unlock.kind !== 'starter') ok(Number.isSafeInteger(p.unlock.value) && p.unlock.value > 0, `${p.id} has a positive goal`);
  }
  for (const id of ['panda', 'cat', 'dog', 'frog', 'fish', 'rabbit', 'mouse']) ok(gs.isMascotId(id), `${id} exists`);

  // Fresh player owns only the cat.
  ok(base().ownedMascots.join(',') === 'cat', 'new player starts with the cat');

  // First completed session unlocks the bear.
  const first = gs.recordSession(base(), 60, NOW);
  ok(first.result.newPets.join(',') === 'bear', 'first session unlocks the bear');
  ok(first.state.ownedMascots.includes('bear') && first.state.activeMascot === 'cat', 'unlocked, not auto-equipped');
  const second = gs.recordSession(first.state, 60, NOW);
  ok(second.result.newPets.length === 0, 'no repeat unlock');

  // 15 lifetime focused minutes unlocks the chick (accumulates across sessions).
  let s = base();
  s = gs.recordSession(s, 600, NOW).state; // 10 min
  ok(!s.ownedMascots.includes('chick'), 'chick still locked at 10 min');
  const r = gs.recordSession(s, 300, NOW); // +5 = 15 min
  ok(r.result.newPets.includes('chick'), 'chick unlocks at 15 lifetime minutes');

  // One long session can unlock several at once.
  const big = gs.recordSession(base(), 3600, NOW);
  ok(['bear', 'chick', 'frog', 'rabbit'].every(id => big.result.newPets.includes(id)), '1 h session unlocks bear, chick, frog, rabbit');

  // Streak-based pet.
  const streaky = gs.recordSession({ ...base(), currentStreak: 2, bestStreak: 2, lastFocusDate: '2026-08-17' }, 60, NOW);
  ok(streaky.result.newPets.includes('fish'), '3-day streak unlocks the fish');

  // Failed / rejected sessions unlock nothing.
  ok(gs.recordSession(base(), 5, NOW).result.newPets.length === 0, 'invalid session unlocks nothing');
  ok(gs.awardFailConsolation(base(), 900).state.ownedMascots.join(',') === 'cat', 'failed session unlocks nothing');

  // Progress + goal text.
  const pp = gs.petProgress({ focusSeconds: 45 * 60, totalSessions: 3, bestStreak: 1 }, cat.find(p => p.id === 'rabbit'));
  ok(pp.current === 45 && pp.target === 60 && !pp.earned, 'rabbit progress 45/60');
  ok(gs.petGoalText(cat.find(p => p.id === 'dog')) === 'Focus 2 h in total', 'goal text in hours');
  ok(gs.petGoalText(cat.find(p => p.id === 'cat')) === 'Your first friend', 'starter goal text');
  ok(gs.petGoalText(cat.find(p => p.id === 'bear')) === 'Finish your first session', 'first-session goal text');
  ok(gs.petRemainingText({ focusSeconds: 45 * 60, totalSessions: 0, bestStreak: 0 }, cat.find(p => p.id === 'rabbit')) === '15 min to go', 'remaining text');

  // Next goal = closest locked pet.
  const near = gs.unlockEarnedPets({ ...base(), focusSeconds: 55 * 60, totalSessions: 1 }).state;
  ok(gs.nextPetGoal(near).id === 'rabbit', 'next goal is the closest locked pet (rabbit at 55/60)');
  const all = gs.unlockEarnedPets({ ...base(), focusSeconds: 999999 * 60, totalSessions: 999, bestStreak: 999 }).state;
  ok(all.ownedMascots.length === cat.length && gs.nextPetGoal(all) === null, 'full collection -> no next goal');
  ok(all.ownedMascots.join(',') === cat.map(p => p.id).join(','), 'collection kept in catalog order');
}

console.log('== 25. Pet migration from coin-shop saves ==');
{
  const saved = global.localStorage;
  const load = obj => {
    global.localStorage = { getItem: () => JSON.stringify(obj), setItem: () => {} };
    const s = gs.loadGameState();
    global.localStorage = saved;
    return s;
  };
  // Bought the panda with coins long ago but has little focus time: keeps it.
  const legacy = load({ ownedMascots: ['bear', 'panda'], activeMascot: 'panda', totalSessions: 2, focusSeconds: 20 * 60 });
  ok(legacy.ownedMascots.includes('panda') && legacy.activeMascot === 'panda', 'bought pets are kept and stay active');
  ok(legacy.ownedMascots.includes('cat') && legacy.ownedMascots.includes('chick'), 'stats already earned are credited on load');
  ok(!legacy.ownedMascots.includes('frog'), 'unearned pets stay locked');
  const unknown = load({ ownedMascots: ['bear', 'griffin'], activeMascot: 'griffin' });
  ok(unknown.activeMascot === 'cat' && !unknown.ownedMascots.includes('griffin'), 'unknown pet ids are dropped');
}

console.log('== 26. Daily goal measures focus minutes, not session count ==');
{
  const now = new Date(2026, 8, 18, 10);
  ok(gs.DAILY_GOAL === 15, `daily goal is 15 focus minutes (got ${gs.DAILY_GOAL})`);
  let s = base();
  for (let i = 0; i < 10; i++) s = gs.recordSession(s, 60, now).state; // 10 x 1 min
  ok(s.minutesToday === 10, '10 x 60s = 10 focused minutes');
  ok(!gs.claimDailyGoal(s, now).reward, 'ten 1-minute sessions do not earn the daily goal');
  const r = gs.recordSession(s, 300, now); // +5 min
  ok(r.state.minutesToday === 15 && r.result.dailyGoalReached, 'reaching 15 min completes the goal');
  ok(gs.claimDailyGoal(r.state, now).reward === gs.DAILY_GOAL_REWARD, 'goal claimable after 15 min');
  // Ten 30-second sessions are only five minutes: the classic farming path.
  let short = base();
  for (let i = 0; i < 10; i++) short = gs.recordSession(short, 30, now).state;
  ok(short.minutesToday === 0 && !short.dailyGoalReached, '30 s sessions never add up to the goal');
  // Sub-minute focus does not round up.
  const cross = gs.recordSession({ ...base(), minutesToday: 14, dailyProgressDate: gs.todayKey(now) }, 59, now);
  ok(cross.state.minutesToday === 14 && !cross.result.dailyGoalReached, 'sub-minute focus does not round up to a goal');
}

console.log('== 27. Lifetime focus time counts real seconds ==');
{
  const r = gs.recordSession(base(), 90, NOW);
  ok(r.state.focusSeconds === 90, '90 s session adds 90 s (not 1 minute)');
  ok(gs.focusMinutes(r.state) === 1, 'pet unlock progress uses floored minutes');
  let s = base();
  for (let i = 0; i < 40; i++) s = gs.recordSession(s, 90, NOW).state; // 1 hour of 90s sessions
  ok(s.focusSeconds === 3600 && s.forestFocusMinutes === undefined, 'old saves: 40 x 90 s no longer under-counts focus time');
  ok(gs.focusMinutes(s) === 60, 'an hour of short sessions counts as an hour');
}

console.log('== 28. Fail consolation can never beat finishing ==');
{
  const start = base();
  for (const dur of [60, 300, 1500, 14400]) {
    const failed = gs.awardFailConsolation(start, dur - 1).reward;
    const done = gs.recordSession(start, dur, NOW).result;
    ok(failed < done.coinsEarned, `${dur}s goal: failing at ${dur - 1}s (${failed}) pays less than finishing (${done.coinsEarned})`);
  }
  ok(gs.awardFailConsolation(base(), 1500).reward < 150, 'failing a 25-min session pays far less than finishing');
}

console.log('== 29. Long sessions keep their full value toward pets ==');
{
  let s = base();
  s = gs.recordSession(s, 14400, D7(1)).state; // 4 h (the longest allowed session)
  ok(s.focusSeconds === 14400, '4 h counted in full');
  ok(gs.focusMinutes(s) === 240, '240 min toward pet unlocks');
}

console.log('== 30. The shield is spent only when it saves the streak ==');
{
  // A shield in the repair window should cover the gap itself.
  const now = new Date(2026, 8, 20, 10);
  const inWindow = { ...base(), currentStreak: 5, bestStreak: 5, lastFocusDate: '2026-09-18', streakFreezes: 1 };
  ok(gs.activeStreak(inWindow, now) === 5, 'a missed day stays on screen during the one-day window');
  ok(gs.activeStreak({ ...inWindow, streakFreezes: 0 }, now) === 5, 'the streak shows even without a shield (it is repairable)');
  ok(gs.activeStreak({ ...inWindow, lastFocusDate: '2026-09-17', streakFreezes: 0 }, now) === 0, 'a two-day gap without a shield is gone');
  ok(!gs.canRepairStreak(inWindow, now), 'no paid repair needed when a shield covers the day');

  // One shield bridges exactly one missed day.
  const repairable = { ...base(), currentStreak: 5, bestStreak: 5, lastFocusDate: '2026-09-18', streakFreezes: 1 };
  const r = gs.recordSession(repairable, 60, now);
  ok(r.state.currentStreak === 6 && r.result.freezeUsed === 1, 'the shield bridges the missed day (6, 1 used)');
  ok(r.state.streakFreezes === 0, 'and is spent');
  // Two missed days are beyond one shield: it stays in stock.
  const gap5 = { ...base(), currentStreak: 5, bestStreak: 5, lastFocusDate: '2026-09-17', streakFreezes: 1 };
  const kept = gs.recordSession(gap5, 60, now);
  ok(kept.state.currentStreak === 1 && kept.state.streakFreezes === 1, 'the shield stays in stock when it cannot bridge the gap');

  // Repair is a one-day make-up for a lapsed streak (used before you focus).
  const lastMonth = new Date(2026, 7, 20, 10);
  const lapsedStreak = { ...base(), currentStreak: 4, bestStreak: 4, lastFocusDate: '2026-08-18', coins: 500 };
  ok(gs.canRepairStreak(lapsedStreak, lastMonth), 'a lapsed streak can be repaired');
  const rich = gs.repairStreak(lapsedStreak, lastMonth);
  ok(rich.repaired && rich.state.coins === 500 - gs.STREAK_REPAIR_COST, 'repair charges the repair price');
  // Once today's session is banked there is nothing left to repair.
  const alreadyToday = { ...lapsedStreak, lastFocusDate: gs.todayKey(lastMonth) };
  ok(!gs.canRepairStreak(alreadyToday, lastMonth) && !gs.repairStreak(alreadyToday, lastMonth).repaired, 'nothing to repair after focusing today');
}

console.log('== 31. Failing costs the streak of the day you fail on ==');
{
  const now = new Date(2026, 8, 20, 10);
  // Focused yesterday, no session yet today: the streak is still alive.
  const yesterday = { ...base(), currentStreak: 6, bestStreak: 6, lastFocusDate: '2026-09-19' };
  const okFail = gs.recordFailedAttempt(yesterday, now);
  ok(okFail.state.currentStreak === 6 && !okFail.lostStreak, 'a failed attempt does not cost yesterday\'s streak');
  // Already focused today, then failed again: the day is still banked.
  const banked = { ...base(), currentStreak: 6, bestStreak: 6, lastFocusDate: gs.todayKey(now) };
  ok(!gs.recordFailedAttempt(banked, now).lostStreak, 'a failed attempt after finishing today keeps the streak');
  // Missed yesterday too, and now failed again.
  const lapsed = { ...base(), currentStreak: 6, bestStreak: 6, lastFocusDate: '2026-09-17' };
  const lost = gs.recordFailedAttempt(lapsed, now, 1);
  ok(lost.lostStreak && lost.state.currentStreak === 0, 'a failed attempt that leaves no chance resets the streak');
  ok(lost.state.bestStreak === 6, 'best streak is kept');
}

console.log('== 33. The record bonus cannot be farmed by creeping the record ==');
{
  // The record bonus is a flat +RECORD_BONUS every time a session is one
  // second longer than the stored record. Before this fix, nudging the goal up
  // a second at a time paid the 50-coin bonus on every single session: 111
  // short sessions earned more than ten times the honest rate for the same
  // two hours of focus. A record bonus is now paid at most once per day.
  let s = base();
  let farmed = 0;
  for (let sec = 10; sec <= 120; sec += 1) {
    const r = gs.recordSession(s, sec, NOW);
    s = r.state;
    farmed += r.result.recordBonus;
  }
  ok(farmed === gs.RECORD_BONUS, `${farmed} bonus coins from 111 creeping sessions (was 5550)`);
  // The record itself still tracks the true best session.
  ok(s.longestSession === 120, 'longest session still records the real best');

  // The next day the bonus is available again, once.
  const tomorrow = new Date(2026, 7, 19, 10, 0, 0);
  const r1 = gs.recordSession(s, 300, tomorrow);
  ok(r1.result.recordBonus === gs.RECORD_BONUS, 'a new day can pay the record bonus again');
  const r2 = gs.recordSession(r1.state, 301, tomorrow);
  ok(r2.result.recordBonus === 0, 'but only once per day');
  ok(r2.state.coins - r1.state.coins === Math.round(301 / 10), 'the session itself still pays in full');
}

console.log('== 34. Daily goal has one rule for the UI and the payout ==');
{
  // The UI used to test completedToday >= DAILY_GOAL while the engine paid on
  // minutesToday >= DAILY_GOAL, so a single 25-minute session was payable but
  // never offered, and fifteen 1-minute sessions were offered but never paid.
  const now = new Date(2026, 8, 18, 10);

  const one = gs.recordSession(base(), 1500, now).state;
  const oneStatus = gs.dailyGoalStatus(one, now);
  ok(oneStatus.reached && oneStatus.claimable, 'one 25-min session is claimable in the UI');
  ok(gs.claimDailyGoal(one, now).reward === gs.DAILY_GOAL_REWARD, 'and the engine pays it');

  let fifteen = base();
  for (let i = 0; i < 15; i++) fifteen = gs.recordSession(fifteen, 60, now).state;
  ok(fifteen.completedToday === 15 && fifteen.minutesToday === 15, '15 x 1 min = 15 sessions and 15 minutes');
  ok(gs.dailyGoalStatus(fifteen, now).claimable, '15 one-minute sessions reach the 15-minute goal');
  ok(gs.claimDailyGoal(fifteen, now).reward === gs.DAILY_GOAL_REWARD, 'and the engine pays it too');

  // The status must agree with the payout on every state, not just these two.
  const states = [
    base(),
    gs.recordSession(base(), 300, now).state,
    gs.recordSession(base(), 1500, now).state,
    { ...base(), minutesToday: gs.DAILY_GOAL, dailyProgressDate: gs.todayKey(now), lastFocusDate: gs.todayKey(now) },
    { ...base(), minutesToday: gs.DAILY_GOAL - 1, dailyProgressDate: gs.todayKey(now), lastFocusDate: gs.todayKey(now) },
    { ...base(), minutesToday: gs.DAILY_GOAL + 5, dailyGoalClaimed: true, dailyProgressDate: gs.todayKey(now) },
    { ...base(), minutesToday: gs.DAILY_GOAL, dailyProgressDate: '2026-09-17' },
  ];
  for (const st of states) {
    const status = gs.dailyGoalStatus(st, now);
    const paid = gs.claimDailyGoal(st, now).reward > 0;
    ok(status.claimable === paid, `status.claimable (${status.claimable}) matches payout (${paid})`);
  }
  // Yesterday's progress never leaks into today.
  ok(!gs.dailyGoalStatus({ ...base(), minutesToday: 99, dailyProgressDate: '2026-09-17' }, now).reached, 'stale progress does not count as today');
  ok(gs.dailyGoalStatus({ ...base(), minutesToday: 99, dailyProgressDate: '2026-09-17' }, now).minutes === 0, 'stale progress reads 0 minutes today');
}

console.log('== 32. Coin economy audit: permanent cosmetics last beyond the first month ==');
{
  // Include every payout a steady player can claim, not just session coins.
  let s = base();
  let firstCatalogDay = null;
  const coreCatalogue = gs.ACCESSORY_CATALOG.reduce((n, a) => n + a.price, 0) + gs.THEME_CATALOG.reduce((n, t) => n + t.price, 0);
  const sceneCatalogue = gs.PET_SCENE_SHOP_CATALOG.reduce((n, scene) => n + scene.price, 0);
  const featuredSceneCatalogue = gs.PET_SCENE_SHOP_CATALOG.reduce((n, scene) => n + (scene.price > 0 ? Math.round(scene.price * 0.75) : 0), 0);
  const catalogue = coreCatalogue + sceneCatalogue;
  const bestPriceCatalogue = coreCatalogue + featuredSceneCatalogue;
  for (let d = 1; d <= 30; d++) {
    const now = D7(d);
    s = gs.recordSession(s, 1500, now).state;
    s = gs.claimDailyGoal(s, now).state;
    s = gs.claimDailyBonus(s, now).state;
    const due = gs.claimableCheckinDay(s, now);
    if (due !== null) s = gs.claimDayReward(s, due, now).state;
    if (firstCatalogDay === null && s.coins >= coreCatalogue) firstCatalogDay = d;
  }
  ok(coreCatalogue === 3880, `all accessories and themes cost ${coreCatalogue} coins`);
  ok(sceneCatalogue === 12 * gs.PET_SCENE_PRICE, `12 curated pet scenes cost ${sceneCatalogue} coins`);
  ok(featuredSceneCatalogue === 12 * Math.round(gs.PET_SCENE_PRICE * 0.75), `all curated scenes cost ${featuredSceneCatalogue} coins at featured prices`);
  ok(catalogue === 14680, `all available permanent cosmetics cost ${catalogue} coins`);
  ok(firstCatalogDay === 12, `full daily payouts make core cosmetics affordable by day ${firstCatalogDay}`);
  ok(s.coins > coreCatalogue, `30 days of full daily payouts leave ${s.coins} coins after core cosmetics (${coreCatalogue})`);
  ok(s.coins >= coreCatalogue + gs.PET_SCENE_PRICE * 8, 'a steady month can still buy eight scenes after the starter collection');
  ok(s.coins < bestPriceCatalogue, `the full cosmetic set takes longer than one steady month even at featured prices (${bestPriceCatalogue} total)`);

  // The shield is still a conditional repeatable spend, capped at one until
  // the player uses it to protect a missed day.
  const shield = gs.buyStreakFreeze(s, D7(30));
  ok(shield.ok, 'the shield remains a conditional coin sink');
  ok(!gs.buyStreakFreeze(shield.state, D7(30)).ok, 'a held shield caps that remaining sink');
  s = shield.state;
  for (const item of gs.ACCESSORY_CATALOG) s = gs.buyAccessory(s, item.id).state;
  for (const item of gs.THEME_CATALOG) {
    if (item.price > 0) s = gs.buyTheme(s, item.id).state;
  }
  ok(s.ownedAccessories.length === gs.ACCESSORY_CATALOG.length, 'all accessories can be cleared');
  ok(s.ownedThemes.length === gs.THEME_CATALOG.length, 'all paid themes can be cleared');

  // Freezes cost about a day's earnings: protection is a real trade-off.
  const day = gs.recordSession(base(), 1500, NOW).result.coinsEarned;
  ok(gs.STREAK_FREEZE_COST > day / 2, `a freeze (${gs.STREAK_FREEZE_COST}) costs more than half a good day (${day})`);
  // Short sessions must not out-earn long ones per minute.
  const longPerMin = gs.recordSession(base(), 1500, NOW).result.baseCoins / 25;
  const shortPerMin = gs.recordSession(base(), 300, NOW).result.baseCoins / 5;
  ok(shortPerMin <= longPerMin, 'short sessions never beat long ones per minute');
}

console.log('== 33. Pet scene shop rotates safely and keeps purchases ==');
{
  const catalog = gs.PET_SCENE_CATALOG ?? [];
  ok(catalog.length === 31, `scene catalog preserves the free starter and 30 historical scene IDs (${catalog.length})`);
  const shopCatalog = gs.PET_SCENE_SHOP_CATALOG ?? [];
  ok(shopCatalog.length === 13, `the current shop offers a starter and 12 curated scenes (${shopCatalog.length})`);
  ok(base().ownedPetScenes?.join(',') === 'classic', 'new players own the classic scene');
  ok(base().equippedPetScene === 'classic', 'classic scene is equipped by default');

  const monday = week => new Date(2026, 8, 7 + week * 7, 10);
  const offersFor = gs.featuredPetScenes;
  ok(typeof offersFor === 'function', 'scene shop exposes its current featured offers');
  ok(typeof gs.buyPetScene === 'function', 'scene purchase has a guarded state transition');
  ok(typeof gs.equipPetScene === 'function', 'scene equip has a guarded state transition');
  if (typeof offersFor === 'function') {
    const firstWeek = offersFor(monday(0));
    const nextWeek = offersFor(monday(1));
    ok(firstWeek.length === 3, 'exactly three scenes are featured at once');
    ok(new Set(firstWeek.map(item => item.id)).size === 3, 'a weekly offer has no duplicate scenes');
    ok(firstWeek.every(item => item.price > 0), 'the free starter is not sold again');
    ok(firstWeek.map(item => item.id).join(',') !== nextWeek.map(item => item.id).join(','), 'weekly offers rotate');

    const cycle = new Set();
    for (let week = 0; week < 10; week++) {
      for (const item of offersFor(monday(week))) cycle.add(item.id);
    }
    ok(cycle.size === 12, 'all 12 curated paid scenes return within the rotation');

    const offer = firstWeek[0];
    const featuredPrice = gs.petScenePrice(offer.id, monday(0));
    const regular = shopCatalog.find(item => item.price > 0 && !firstWeek.some(featured => featured.id === item.id));
    ok(offer && gs.petScenePrice(offer.id, monday(0)) === Math.round(gs.PET_SCENE_PRICE * 0.75), 'featured scenes receive a 25% discount');
    ok(regular && gs.petScenePrice(regular.id, monday(0)) === gs.PET_SCENE_PRICE, 'every scene remains available at its regular price');
    const poor = gs.buyPetScene?.({ ...base(), coins: featuredPrice - 1 }, offer.id, monday(0));
    ok(poor && !poor.ok && !poor.state.ownedPetScenes?.includes(offer.id), 'an unaffordable scene remains locked');
    const bought = gs.buyPetScene?.({ ...base(), coins: featuredPrice }, offer.id, monday(0));
    ok(bought?.ok && bought.cost === featuredPrice && bought.state.coins === 0, 'a featured scene costs exactly its discounted price');
    ok(bought?.state.equippedPetScene === offer.id, 'a bought scene is equipped immediately');
    ok(bought?.state.ownedPetScenes?.includes(offer.id), 'a bought scene remains in the collection');
    ok(bought && !gs.buyPetScene(bought.state, offer.id, monday(0)).ok, 'a scene cannot be purchased twice');
    const lockedEquip = gs.equipPetScene?.(base(), offer.id);
    ok(!lockedEquip?.ok, 'a locked scene cannot be equipped');
    ok(offersFor(monday(0)).some(item => item.id === offer.id), 'featured items stay predictable for the full week');
    const switched = gs.equipPetScene?.(bought.state, 'classic');
    ok(switched?.ok && switched.state.equippedPetScene === 'classic', 'owned scenes can be switched back to');
    const boughtRegular = regular && gs.buyPetScene?.({ ...base(), coins: gs.PET_SCENE_PRICE }, regular.id, monday(0));
    ok(boughtRegular?.ok && boughtRegular.cost === gs.PET_SCENE_PRICE, 'a non-featured scene can be bought at its full price');

    const allSceneCost = shopCatalog.reduce((sum, scene) => sum + gs.petScenePrice(scene.id, monday(0)), 0);
    let fullCollection = { ...base(), coins: allSceneCost };
    for (const scene of shopCatalog.filter(item => item.price > 0)) {
      fullCollection = gs.buyPetScene(fullCollection, scene.id, monday(0)).state;
    }
    ok(fullCollection.coins === 0, 'the complete scene collection charges the exact purchase total');
    ok(fullCollection.ownedPetScenes.length === shopCatalog.length, 'all currently offered scenes can be collected and retained');
    ok(fullCollection.equippedPetScene === shopCatalog[shopCatalog.length - 1].id, 'the last purchase becomes the active scene');
  }

  const oldStorage = global.localStorage;
  global.localStorage = { getItem: () => JSON.stringify({ coins: 42 }), setItem: () => {} };
  const olderSave = gs.loadGameState();
  ok(olderSave.ownedPetScenes.join(',') === 'classic' && olderSave.equippedPetScene === 'classic', 'older saves receive the safe classic scene');
  let raw = JSON.stringify({
    ownedPetScenes: ['classic', 'clouds-peach', 'invalid', 'clouds-peach'],
    equippedPetScene: 'clouds-peach',
  });
  global.localStorage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
  const migrated = gs.loadGameState();
  ok(migrated.ownedPetScenes?.filter(id => id === 'clouds-peach').length === 1, 'scene migration drops invalid and duplicate ids');
  ok(migrated.equippedPetScene === 'clouds-peach', 'a valid owned scene stays equipped after loading');
  gs.saveGameState(migrated);
  ok(JSON.parse(raw).ownedPetScenes?.includes('clouds-peach') === true, 'scene ownership persists in the save');
  global.localStorage = { getItem: () => JSON.stringify({ ownedPetScenes: ['classic'], equippedPetScene: 'clouds-peach' }), setItem: () => {} };
  ok(gs.loadGameState().equippedPetScene === 'classic', 'a save cannot equip a scene the player does not own');
  global.localStorage = oldStorage;
}

console.log('== 34. Appearance mode defaults and migrates ==');
{
  ok(base().appearanceMode === 'system', 'new saves follow the device appearance');
  const saved = global.localStorage;
  const load = value => {
    global.localStorage = { getItem: () => value, setItem: () => {} };
    return gs.loadGameState();
  };
  ok(load(JSON.stringify({ activeTheme: 'pink' })).appearanceMode === 'system', 'older saves default to system appearance');
  ok(load(JSON.stringify({ appearanceMode: 'dark' })).appearanceMode === 'dark', 'saved dark appearance is restored');
  ok(load(JSON.stringify({ appearanceMode: 'sepia' })).appearanceMode === 'system', 'invalid appearance recovers to system');
  const dark = gs.setAppearanceMode(base(), 'dark');
  ok(dark.appearanceMode === 'dark' && dark.activeTheme === 'blue', 'dark mode does not replace the accent theme');
  ok(gs.setAppearanceMode(dark, 'system').appearanceMode === 'system', 'appearance can return to device setting');
  global.localStorage = saved;
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
