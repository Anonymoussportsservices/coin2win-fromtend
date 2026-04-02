from pathlib import Path
import sys

path = Path("/var/www/coin2win-ui/app/cashier/page.tsx")
text = path.read_text()

original = text

# 1) Add state inside component
component_marker = "export default function CashierPage() {\n  const user = getStoredUser();\n"
component_replacement = """export default function CashierPage() {
  const user = getStoredUser();
  const [showKycModal, setShowKycModal] = useState(false);
"""

if 'const [showKycModal, setShowKycModal] = useState(false);' not in text:
    if component_marker in text:
        text = text.replace(component_marker, component_replacement, 1)
    else:
        print("ERROR: Could not find CashierPage component marker.")
        sys.exit(1)

# 2) Replace handleWithdraw بالكامل
start_marker = "  async function handleWithdraw() {"
end_marker = "\n\n  const depositAddress = useMemo(() => {"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
    print("ERROR: Could not find handleWithdraw block.")
    sys.exit(1)

new_handle_withdraw = """  async function handleWithdraw() {
    if (!user?.user_id) {
      setError("Please log in again.");
      return;
    }

    try {
      setWithdrawLoading(true);
      setError("");
      setMessage("");

      const kyc = await apiAuth(
        `/kyc/me?user_id=${encodeURIComponent(user.user_id)}`,
        "GET"
      );

      if (kyc?.kyc_status !== "verified") {
        setShowKycModal(true);
        setWithdrawLoading(false);
        return;
      }

      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid withdrawal amount.");
      }

      if (!withdrawAddress.trim()) {
        throw new Error("Enter a wallet address.");
      }

      await apiAuth("/withdraw/create", "POST", {
        user_id: user.user_id,
        amount_usd: amount,
        payout_currency: withdrawCurrency,
        payout_address: withdrawAddress.trim(),
      });

      setMessage("Withdrawal request submitted.");
      setWithdrawAmount("");
      setWithdrawAddress("");
      notifyWalletChanged();
      await loadWallet();
      await loadTransactions();
    } catch (e: any) {
      setError(e?.message || "Failed to request withdrawal.");
    } finally {
      setWithdrawLoading(false);
    }
  }"""

text = text[:start_idx] + new_handle_withdraw + text[end_idx:]

# 3) Insert modal below success message
success_marker = '        {message ? <div style={successStyle}>{message}</div> : null}\n'
modal_block = """        {message ? <div style={successStyle}>{message}</div> : null}

        {showKycModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              style={{
                background: "#1a2c38",
                padding: 24,
                borderRadius: 16,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 800 }}>
                Verify your identity
              </h3>

              <p style={{ margin: "0 0 20px 0", color: "#b1bad3", lineHeight: 1.5 }}>
                Complete KYC verification to unlock withdrawals.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => (window.location.href = "/kyc")}
                  style={{
                    background: "#00e701",
                    color: "#071824",
                    border: "none",
                    borderRadius: 12,
                    minHeight: 44,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Verify now
                </button>

                <button
                  onClick={() => setShowKycModal(false)}
                  style={{
                    background: "#213743",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    minHeight: 44,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
"""

if "{showKycModal && (" not in text:
    if success_marker in text:
        text = text.replace(success_marker, modal_block, 1)
    else:
        print("ERROR: Could not find success message marker for modal insertion.")
        sys.exit(1)

if text == original:
    print("No changes were needed.")
else:
    backup = path.with_name(path.name + ".bak_kyc_modal")
    backup.write_text(original)
    path.write_text(text)
    print(f"OK: patched {path}")
    print(f"Backup saved to {backup}")
