type PasswordResetCardProps = {
  resetPassword: string;
  setResetPassword: (value: string) => void;
  resetPasswordConfirm: string;
  setResetPasswordConfirm: (value: string) => void;
  resetPasswordLoading: boolean;
  onSubmit: () => void;
};

export default function PasswordResetCard({
  resetPassword,
  setResetPassword,
  resetPasswordConfirm,
  setResetPasswordConfirm,
  resetPasswordLoading,
  onSubmit,
}: PasswordResetCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f1c24] p-5">
      <h2 className="text-xl font-black">Password Reset</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="password"
          value={resetPassword}
          onChange={(e) => setResetPassword(e.target.value)}
          placeholder="New Password"
          className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-white outline-none placeholder:text-slate-500"
        />
        <input
          type="password"
          value={resetPasswordConfirm}
          onChange={(e) => setResetPasswordConfirm(e.target.value)}
          placeholder="Confirm New Password"
          className="rounded-2xl border border-white/10 bg-[#13232d] px-4 py-3 text-white outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onSubmit}
          disabled={resetPasswordLoading}
          className="rounded-2xl bg-amber-500 px-4 py-2 font-black text-white disabled:opacity-60"
        >
          {resetPasswordLoading ? "Resetting..." : "Reset Password"}
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        This works for both player and agent accounts, as long as the auth account exists in c2w_users.
      </div>
    </div>
  );
}
