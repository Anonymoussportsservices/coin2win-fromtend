type ContactNotesCardProps = {
  fullNameInput: string;
  setFullNameInput: (value: string) => void;
  telegramInput: string;
  setTelegramInput: (value: string) => void;
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  notesInput: string;
  setNotesInput: (value: string) => void;
  savingContact: boolean;
  onSave: () => void;
};

export default function ContactNotesCard({
  fullNameInput,
  setFullNameInput,
  telegramInput,
  setTelegramInput,
  phoneInput,
  setPhoneInput,
  notesInput,
  setNotesInput,
  savingContact,
  onSave,
}: ContactNotesCardProps) {
  return (
    <div className="mb-5 rounded-3xl border border-white/5 bg-[#1a2c38] p-5">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-black">Contact & Notes</h2>
          <p className="mt-1 text-sm text-slate-400">Edit operator-facing player metadata.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Full Name</label>
            <input
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Telegram</label>
            <input
              value={telegramInput}
              onChange={(e) => setTelegramInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Phone</label>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="+1..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Notes</label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
              placeholder="VIP, slow payer, risk notes, preferences..."
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={onSave}
            disabled={savingContact}
            className="rounded-2xl bg-sky-500 px-4 py-3 font-black text-white disabled:opacity-60"
          >
            {savingContact ? "Saving..." : "Save Contact Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
