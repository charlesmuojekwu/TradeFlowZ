import type { CopyActivity, CopySettings, CopyTraderProfile } from "@/types";

export interface CopyTradingProvider {
  listTraders(): Promise<CopyTraderProfile[]>;
  getTraderProfile(traderId: string): Promise<CopyTraderProfile>;
  followTrader(traderId: string, settings: CopySettings): Promise<CopySettings>;
  unfollowTrader(traderId: string): Promise<void>;
  getCopySettings(traderId: string): Promise<CopySettings | undefined>;
  updateCopySettings(traderId: string, settings: CopySettings): Promise<CopySettings>;
  getCopyActivity(): Promise<CopyActivity[]>;
}
