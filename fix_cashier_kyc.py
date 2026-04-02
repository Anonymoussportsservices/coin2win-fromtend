from pathlib import Path
import re

path = Path("/var/www/coin2win-ui/app/cashier/page.tsx")
text = path.read_text()
original = text

# Ensure state is inside component, not top-level
text = re.sub(
    r'^\s*const \[showKycModal, setShowKycModal\] = useState\(false\);\s*\n',
    '',
    text,
    flags=re.M
)

component_marker = """export default function CashierPage() {
  const user = getStoredUser();
"""
component_replacement = """export default function CashierPage() {
  const user = getStoredUser();
  const [showKycModal, setShowKycModal] = useState(false);
"""
if component_marker in text and 'const [showKycModal, setShowKycModal] = useState(false);' not in text:
    text = text.replace(component_marker, component_replacement, 1)

# Remove accidental KYC block anywhere outside handleWithdraw
bad_block = re.compile(
    r'\n\s*const kyc = await apiAuth\(\s*'
    r'`/kyc/me\?user_id=\$\{encodeURIComponent\(user\.user_id\)\}`,\s*'
    r'"GET"\s*\);\s*'
    r'if \(kyc\?\.\s*kyc_status !== "verified"\) \{\s*'
    r'setShowKycModal\(true\);\s*'
    r'setWithdrawLoading\(false\);\s*'
    r'return;\s*'
    r'\}\s*',
    re.S
)
text = bad_block.sub('\n', text)

# Replace handleWithdraw بالكامل
start = text.find("  async function handleWithdraw() {")
end = text.find("\n\n  const depositAddress = useMemo(() => {")
if start == -1 or end == -1 or end <= start:
    raise SystemExit("Could not find handleWithdraw block")

new_handle = """  async function handleWithdraw() {
    if (!user?.user_id) {
      setError("Please log in again.");
      return;
    }

    const userId = user.user_id;

    try {
      setWithdrawLoading(true);
      setError("");
      setMessage("");

      const kyc = await apiAuth(
        `/kyc/me?user_id=${encodeURIComponent(userId)}`,
        "GET"
      );

      if (kyc?.kyc_status !== "verified") {
        setShowKycModal(true);
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
        user_id: userId,
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

text = text[:start] + new_handle + text[end:]

# Ensure modal exists under success message
success_marker = '        {message ? <div style={successStyle}>{message}</div> : null}\n'
modal = """        {message ? <div style={successStyle}>{message}</div> : null}

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

              <div style={{ display: "grid", gap: 10 }}>
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
if "{showKycModal && (" in text:
    text = re.sub(
        r'        \{showKycModal && \([\s\S]*?\n        \)\}\n',
        '',
        text,
        count=1
    )

if success_marker in text:
    text = text.replace(success_marker, modal, 1)
else:
    raise SystemExit("Could not find success message marker")

path.write_text(text)
print("OK: cashier page fixed")
