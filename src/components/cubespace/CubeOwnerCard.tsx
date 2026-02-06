import { useEffect, useState, type FormEvent } from "react";
import type { CubeProfile } from "@/components/cubespace/cubeProfiles";

type Props = {
  open: boolean;
  profile?: CubeProfile | null;
  authConfigured: boolean;
  authStatus?: { status: "idle" | "loading" | "error"; message?: string };
  error?: string | null;
  saving?: boolean;
  onDismiss?: () => void;
  onConnectLinkedIn?: () => void;
  onSaveName?: (data: {
    firstName: string;
    lastName: string;
    linkedinUrl?: string;
  }) => void;
};

/* ─── Shared hook for form state ──────────────────────────────── */
function useOwnerForm(open: boolean, profile?: CubeProfile | null) {
  const [showNameForm, setShowNameForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setShowNameForm(false);
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setLinkedinUrl(profile?.linkedinUrl ?? "");
  }, [open, profile]);

  const formValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`
      : profile?.fullName?.slice(0, 2)?.toUpperCase();

  const hasProfile = Boolean(profile?.fullName);
  const isLinkedInConnected = Boolean(profile?.verified);

  return {
    showNameForm,
    setShowNameForm,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    linkedinUrl,
    setLinkedinUrl,
    formValid,
    initials,
    hasProfile,
    isLinkedInConnected,
  };
}

export const CubeOwnerCard = ({
  open,
  profile,
  authConfigured,
  authStatus,
  error,
  saving = false,
  onDismiss,
  onConnectLinkedIn,
  onSaveName,
}: Props) => {
  const form = useOwnerForm(open, profile);
  const isConnecting = authStatus?.status === "loading";
  const connectError =
    authStatus?.status === "error" ? authStatus.message : null;

  if (!open) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.formValid) return;
    onSaveName?.({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      linkedinUrl: form.linkedinUrl.trim() || undefined,
    });
  };

  return (
    <div
      className="w-[320px] overflow-hidden rounded-2xl"
      style={{
        width: "min(320px, 82vw)",
        background:
          "linear-gradient(165deg, hsl(220 20% 10% / 0.85), hsl(220 20% 6% / 0.75))",
        backdropFilter: "blur(24px)",
        border: "1px solid hsl(210 20% 92% / 0.06)",
        boxShadow:
          "0 12px 48px hsl(220 20% 4% / 0.6), inset 0 1px 0 hsl(210 20% 92% / 0.04)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[2px] w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(185 50% 55% / 0.5), transparent)",
        }}
      />

      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold tracking-wider"
            style={{
              background:
                "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.08))",
              border: "1px solid hsl(185 50% 55% / 0.25)",
              color: "hsl(185 50% 70%)",
            }}
          >
            {form.initials ?? "✦"}
          </div>
          <div>
            <div
              className="text-[13px] font-semibold"
              style={{ color: "hsl(210 20% 92% / 0.95)" }}
            >
              Your cube is placed
            </div>
            <div className="text-[11px]" style={{ color: "hsl(215 15% 55%)" }}>
              Personalize it with your name
            </div>
          </div>
        </div>

        {/* Profile preview if exists */}
        {form.hasProfile && (
          <div
            className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: "hsl(220 20% 8% / 0.5)",
              border: "1px solid hsl(210 20% 92% / 0.04)",
            }}
          >
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName ?? ""}
                className="h-8 w-8 rounded-full object-cover"
                style={{ border: "1px solid hsl(185 50% 55% / 0.2)" }}
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{
                  background: "hsl(185 50% 55% / 0.12)",
                  color: "hsl(185 50% 70%)",
                  border: "1px solid hsl(185 50% 55% / 0.2)",
                }}
              >
                {form.initials}
              </div>
            )}
            <div>
              <div
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "hsl(210 20% 92% / 0.9)" }}
              >
                {profile?.fullName}
                {profile?.verified && (
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "hsl(164 55% 58% / 0.7)" }}
                  />
                )}
              </div>
              {profile?.linkedinUrl && (
                <div
                  className="text-[10px]"
                  style={{ color: "hsl(215 15% 55%)" }}
                >
                  LinkedIn verified
                </div>
              )}
            </div>
          </div>
        )}

        {/* Name form */}
        {form.showNameForm ? (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "First name",
                  value: form.firstName,
                  set: form.setFirstName,
                },
                {
                  label: "Last name",
                  value: form.lastName,
                  set: form.setLastName,
                },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex flex-col gap-1">
                  <span
                    className="text-[10px] font-medium tracking-wide"
                    style={{ color: "hsl(215 15% 55%)" }}
                  >
                    {label}
                  </span>
                  <input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    disabled={saving}
                    required
                    className="h-8 rounded-lg bg-transparent px-2.5 text-[12px] outline-none transition focus:ring-1"
                    style={{
                      border: "1px solid hsl(210 20% 92% / 0.08)",
                      color: "hsl(210 20% 92% / 0.9)",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": "hsl(185 50% 55% / 0.3)",
                    }}
                  />
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-1">
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: "hsl(215 15% 55%)" }}
              >
                LinkedIn{" "}
                <span style={{ color: "hsl(215 15% 40%)" }}>(optional)</span>
              </span>
              <input
                value={form.linkedinUrl}
                onChange={(e) => form.setLinkedinUrl(e.target.value)}
                disabled={saving}
                placeholder="linkedin.com/in/..."
                className="h-8 rounded-lg bg-transparent px-2.5 text-[12px] outline-none transition focus:ring-1"
                style={{
                  border: "1px solid hsl(210 20% 92% / 0.08)",
                  color: "hsl(210 20% 92% / 0.9)",
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": "hsl(185 50% 55% / 0.3)",
                }}
              />
            </label>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => form.setShowNameForm(false)}
                disabled={saving}
                className="text-[11px] transition hover:opacity-80"
                style={{ color: "hsl(215 15% 55%)" }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={!form.formValid || saving}
                className="rounded-lg px-4 py-1.5 text-[11px] font-semibold transition disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(185 50% 55% / 0.25), hsl(185 40% 45% / 0.15))",
                  border: "1px solid hsl(185 50% 55% / 0.3)",
                  color: "hsl(185 50% 80%)",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-2">
            {/* Primary CTA — Add Name */}
            <button
              onClick={() => form.setShowNameForm(true)}
              disabled={saving}
              className="w-full rounded-xl py-2.5 text-[12px] font-semibold tracking-wide transition hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.1))",
                border: "1px solid hsl(185 50% 55% / 0.25)",
                color: "hsl(185 50% 80%)",
              }}
            >
              ✏️ Add your name
            </button>

            {/* Secondary — LinkedIn */}
            <button
              onClick={onConnectLinkedIn}
              disabled={
                !authConfigured ||
                isConnecting ||
                form.isLinkedInConnected ||
                saving
              }
              className="w-full rounded-xl py-2 text-[11px] font-medium tracking-wide transition disabled:opacity-40"
              style={{
                background: "hsl(210 60% 60% / 0.08)",
                border: "1px solid hsl(210 60% 70% / 0.15)",
                color: "hsl(210 60% 80% / 0.8)",
              }}
            >
              {form.isLinkedInConnected
                ? "✓ LinkedIn connected"
                : isConnecting
                  ? "Connecting…"
                  : "Connect LinkedIn"}
            </button>

            {!authConfigured && (
              <p
                className="text-center text-[10px]"
                style={{ color: "hsl(215 15% 40%)" }}
              >
                Auth0 not configured in this build
              </p>
            )}
          </div>
        )}

        {/* Errors */}
        {(error || connectError) && (
          <div
            className="mt-2 rounded-lg px-3 py-1.5 text-[11px]"
            style={{
              background: "hsl(0 60% 50% / 0.1)",
              border: "1px solid hsl(0 60% 50% / 0.15)",
              color: "hsl(0 60% 75%)",
            }}
          >
            {error ?? connectError}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onDismiss}
            disabled={saving}
            className="text-[11px] transition hover:opacity-80"
            style={{ color: "hsl(215 15% 45%)" }}
          >
            Skip for now
          </button>
          {form.hasProfile && !form.showNameForm && (
            <button
              onClick={onDismiss}
              disabled={saving}
              className="rounded-lg px-3 py-1 text-[11px] font-medium transition"
              style={{
                background: "hsl(185 50% 55% / 0.1)",
                color: "hsl(185 50% 70%)",
              }}
            >
              Done ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
