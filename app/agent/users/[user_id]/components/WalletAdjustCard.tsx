type WalletAdjustCardProps = {
  walletAdjustAmount: string;
  setWalletAdjustAmount: (value: string) => void;
  walletAdjustReasonPreset: string;
  setWalletAdjustReasonPreset: (value: string) => void;
  walletAdjustReasonCustom: string;
  setWalletAdjustReasonCustom: (value: string) => void;
  walletAdjustLoading: boolean;
  onCredit: () => void;
  onDebit: () => void;
};

export default function WalletAdjustCard({
  walletAdjustAmount,
  setWalletAdjustAmount,
  walletAdjustReasonPreset,
  setWalletAdjustReasonPreset,
  walletAdjustReasonCustom,
  setWalletAdjustReasonCustom,
  walletAdjustLoading,
  onCredit,
  onDebit,
}: WalletAdjustCardProps) {
  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-black">Wallet Adjust</h2>
          <p className="mt-1 text-sm text-slate-400">Credit or debit player balance directly from profile.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Amount</label>
            <input
              value={walletAdjustAmount}
              onChange={(e) => setWalletAdjustAmount(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="10"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Reason</label>
            <select
              value={walletAdjustReasonPreset}
              onChange={(e) => setWalletAdjustReasonPreset(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
            >
              <option value="bonus_manual">bonus_manual</option>
              <option value="agent_credit">agent_credit</option>
              <option value="settlement_adjustment">settlement_adjustment</option>
              <option value="vip_comp">vip_comp</option>
              <option value="fraud_reversal">fraud_reversal</option>
              <option value="deposit_correction">deposit_correction</option>
              <option value="withdrawal_correction">withdrawal_correction</option>
              <option value="promo_credit">promo_credit</option>
              <option value="loss_rebate">loss_rebate</option>
              <option value="balance_fix">balance_fix</option>
              <option value="test_credit">test_credit</option>
              <option value="test_debit">test_debit</option>
              <option value="custom">custom</option>
            </select>

            {walletAdjustReasonPreset === "custom" ? (
              <input
                value={walletAdjustReasonCustom}
                onChange={(e) => setWalletAdjustReasonCustom(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                placeholder="manual_profile_adjustment"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCredit}
            disabled={walletAdjustLoading}
            className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white disabled:opacity-60"
          >
            {walletAdjustLoading ? "Processing..." : "Credit Balance"}
          </button>

          <button
            type="button"
            onClick={onDebit}
            disabled={walletAdjustLoading}
            className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white disabled:opacity-60"
          >
            {walletAdjustLoading ? "Processing..." : "Debit Balance"}
          </button>
        </div>
      </div>
    </div>
  );
}
