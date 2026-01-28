import { useEffect, useState, type FormEvent } from "react";
import type { CubeProfile } from "@/components/cubespace/cubeProfiles";

type Props = {
  open: boolean;
  profile?: CubeProfile | null;
  authConfigured: boolean;
  authStatus?: { status: "idle" | "loading" | "error"; message?: string };
  error?: string | null;
  onDismiss?: () => void;
  onConnectLinkedIn?: () => void;
  onSaveName?: (data: { firstName: string; lastName: string; linkedinUrl?: string }) => void;
};

export const CubeOwnerCard = ({
  open,
  profile,
  authConfigured,
  authStatus,
  error,
  onDismiss,
  onConnectLinkedIn,
  onSaveName,
}: Props) => {
  const [showNameForm, setShowNameForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const isConnecting = authStatus?.status === "loading";
  const connectError = authStatus?.status === "error" ? authStatus.message : null;
  const hasProfile = Boolean(profile?.fullName);
  const isLinkedInConnected = Boolean(profile?.verified);
  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`
      : profile?.fullName?.slice(0, 2)?.toUpperCase();

  useEffect(() => {
    if (!open) return;
    setShowNameForm(false);
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setLinkedinUrl(profile?.linkedinUrl ?? "");
  }, [open, profile]);

  if (!open) return null;

  const formValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) return;
    onSaveName?.({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      linkedinUrl: linkedinUrl.trim() || undefined,
    });
  };

  return (
    <div
      className="w-[320px] rounded-2xl border px-4 py-4 shadow-2xl"
      style={{
        backdropFilter: "blur(18px)",
        background: "hsl(var(--background) / 0.4)",
        borderColor: "hsl(var(--foreground) / 0.08)",
        width: "min(320px, 80vw)",
      }}
    >
      <div className="text-sm font-semibold text-foreground/95">This cube is yours.</div>
      <p className="mt-1 text-xs text-muted-foreground/70">Add your name and photo?</p>

      {hasProfile && (
        <div className="mt-3 flex items-center gap-3">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile?.fullName ?? "Profile photo"}
              className="h-9 w-9 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[11px] font-semibold text-foreground/70">
              {initials ?? "ME"}
            </div>
          )}
          <div className="text-xs">
            <div className="flex items-center gap-2 text-foreground/90">
              <span className="font-medium">{profile?.fullName}</span>
              {profile?.verified && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />}
            </div>
            {profile?.linkedinUrl && (
              <div className="text-[11px] text-muted-foreground/70">LinkedIn connected</div>
            )}
          </div>
        </div>
      )}

      {showNameForm ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmitName}>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground/70">
              First name
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-foreground/90"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground/70">
              Last name
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-foreground/90"
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground/70">
            LinkedIn link (optional)
            <input
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-foreground/90"
              placeholder="https://www.linkedin.com/in/..."
            />
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowNameForm(false)}
              className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!formValid}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-foreground/90 transition disabled:opacity-50"
              style={{ background: "hsl(var(--primary) / 0.18)" }}
            >
              Save name
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={onConnectLinkedIn}
            disabled={!authConfigured || isConnecting || isLinkedInConnected}
            className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition disabled:opacity-50"
            style={{
              borderColor: "hsl(210 60% 70% / 0.4)",
              background: "hsl(210 60% 60% / 0.15)",
              color: "hsl(210 60% 85% / 0.95)",
            }}
          >
            {isLinkedInConnected ? "LinkedIn connected" : isConnecting ? "Connecting..." : "Connect LinkedIn"}
          </button>
          <p className="text-[11px] text-muted-foreground/70">
            We only use your public name and photo.
          </p>
          {!authConfigured && (
            <p className="text-[11px] text-muted-foreground/60">
              Auth0 config is missing in this build.
            </p>
          )}
          <button
            onClick={() => setShowNameForm(true)}
            className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold text-foreground/80 transition hover:text-foreground"
          >
            Add name
          </button>
        </div>
      )}

      {(error || connectError) && (
        <div className="mt-2 text-[11px] text-rose-200/80">{error ?? connectError}</div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground/70">
        <button onClick={onDismiss} className="hover:text-muted-foreground">
          Not now
        </button>
        {hasProfile && !showNameForm && (
          <button onClick={onDismiss} className="hover:text-foreground">
            Done
          </button>
        )}
      </div>
    </div>
  );
};
