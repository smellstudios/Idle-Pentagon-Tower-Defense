/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AnalyticsEventMap {
  coins_awarded: {
    amount: number;
    wave: number;
    prestigeLevel: number;
  };
  upgrade_unlock_attempt: {
    upgradeId: string;
    success: boolean;
    coinsBefore: number;
    coinsAfter: number;
  };
  upgrade_unlocked: {
    upgradeId: string;
    coinsSpent: number;
  };
  death_summary_view: {
    coinsEarned: number;
  };
}

class AnalyticsTracker {
  private log<K extends keyof AnalyticsEventMap>(eventName: K, data: AnalyticsEventMap[K]) {
    console.log(`%c[Analytics: ${eventName}]`, 'color: #f59e0b; font-weight: bold;', data);
    
    // Dispatch custom event for telemetry or external subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`game_analytics_${eventName}`, { detail: data }));
    }
  }

  public trackCoinsAwarded(amount: number, wave: number, prestigeLevel: number) {
    this.log('coins_awarded', {
      amount,
      wave,
      prestigeLevel,
    });
  }

  public trackUpgradeUnlockAttempt(
    upgradeId: string,
    success: boolean,
    coinsBefore: number,
    coinsAfter: number
  ) {
    this.log('upgrade_unlock_attempt', {
      upgradeId,
      success,
      coinsBefore,
      coinsAfter,
    });
  }

  public trackUpgradeUnlocked(upgradeId: string, coinsSpent: number) {
    this.log('upgrade_unlocked', {
      upgradeId,
      coinsSpent,
    });
  }

  public trackDeathSummaryView(coinsEarned: number) {
    this.log('death_summary_view', {
      coinsEarned,
    });
  }
}

export const analytics = new AnalyticsTracker();
