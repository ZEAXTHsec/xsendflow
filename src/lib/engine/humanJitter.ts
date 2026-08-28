import { SenderAccount } from '@/components/tabs/SendersTab';

/**
 * Generates natural randomized delay intervals following a Box-Muller Gaussian bell curve.
 * Prevents detection by Google/Yahoo/Outlook bot-fingerprinting heuristics.
 *
 * @param baseSeconds Target average delay (e.g. 45 seconds)
 * @param jitterPercent Variance ratio (default 0.35 = ±35%)
 * @returns Randomized delay in milliseconds
 */
export function calculateHumanDelay(baseSeconds = 45, jitterPercent = 0.35): number {
  const u1 = Math.max(0.0001, Math.random());
  const u2 = Math.random();

  // Box-Muller transform for standard normal distribution N(0, 1)
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  const standardDeviation = (baseSeconds * jitterPercent) / 2;
  const randomizedSeconds = Math.round(baseSeconds + randStdNormal * standardDeviation);

  // Safety floor: At least 10s between sends
  const finalSeconds = Math.max(10, randomizedSeconds);
  return finalSeconds * 1000;
}

/**
 * Health-aware sender account selector with automatic load-balancing and failover.
 */
export function selectHealthySender(
  senders: SenderAccount[],
  failedSenderIds: Set<string> = new Set()
): SenderAccount | null {
  if (!senders.length) return null;

  // Filter inboxes that have not hit daily limit and have not failed in current batch
  const eligible = senders.filter(s => {
    const isUnderLimit = s.dailySentCount < s.dailyLimit;
    const isNotFailed = !failedSenderIds.has(s.id);
    return isUnderLimit && isNotFailed;
  });

  if (!eligible.length) {
    // Fallback to any sender that is under daily limit
    const fallback = senders.filter(s => s.dailySentCount < s.dailyLimit);
    return fallback.length > 0 ? fallback[0] : senders[0];
  }

  // Pick sender with lowest capacity utilization ratio (least burned account)
  return eligible.sort((a, b) => (a.dailySentCount / a.dailyLimit) - (b.dailySentCount / b.dailyLimit))[0];
}
