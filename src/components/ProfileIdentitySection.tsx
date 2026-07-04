"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Pencil, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import {
  PF_AVATAR_CHANGED_EVENT,
  compressAvatarFile,
  loadProfileAvatar,
  saveProfileAvatar,
} from "@/lib/profileStorage";

interface ProfileIdentitySectionProps {
  user: User;
  displayName: string;
  initials: string;
  email?: string | null;
  joined: string | null;
  animateIn?: boolean;
  editable?: boolean;
}

export function ProfileIdentitySection({
  user,
  displayName,
  initials,
  email,
  joined,
  animateIn = true,
  editable = true,
}: ProfileIdentitySectionProps) {
  const { updateDisplayName } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(!animateIn);

  const refreshAvatar = useCallback(() => {
    setAvatarUrl(loadProfileAvatar(user.id));
  }, [user.id]);

  useEffect(() => {
    refreshAvatar();
    const onAvatarChange = () => refreshAvatar();
    window.addEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
    return () => window.removeEventListener(PF_AVATAR_CHANGED_EVENT, onAvatarChange);
  }, [refreshAvatar]);

  useEffect(() => {
    if (!animateIn) {
      setRevealed(true);
      return;
    }
    const t = window.setTimeout(() => setRevealed(true), 40);
    return () => window.clearTimeout(t);
  }, [animateIn]);

  useEffect(() => {
    if (!editingName) setNameDraft(displayName);
  }, [displayName, editingName]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleAvatarPick = async (file: File | undefined) => {
    if (!file || !editable) return;
    try {
      const dataUrl = await compressAvatarFile(file);
      saveProfileAvatar(user.id, dataUrl);
      setAvatarUrl(dataUrl);
    } catch {
      /* ignore invalid uploads */
    }
  };

  const handleSaveName = async () => {
    if (!editable) return;
    setSavingName(true);
    setNameError(null);
    const { error } = await updateDisplayName(nameDraft);
    setSavingName(false);
    if (error) {
      setNameError(error);
      return;
    }
    setEditingName(false);
  };

  return (
    <section
      className="pf-card-surface px-5 pb-5 pt-6"
      style={tabEnterStyle(animateIn, 0)}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="relative pf-avatar-plain-enter"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "scale(1)" : "scale(0.9)",
          }}
        >
          <div
            className="h-[72px] w-[72px] overflow-hidden rounded-full"
            style={{
              background: avatarUrl
                ? undefined
                : "linear-gradient(145deg, rgba(59,110,245,0.82) 0%, rgba(0,198,198,0.52) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[26px] font-black text-white">
                {initials}
              </span>
            )}
          </div>
          {editable && (
            <>
              <button
                type="button"
                data-no-drag
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pocket-border)] bg-pocket-elevated text-pocket-text shadow-lg active:scale-95"
                aria-label="Change profile photo"
              >
                <Camera className="h-3.5 w-3.5 text-pocket-muted" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleAvatarPick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        <div className="mt-4 w-full max-w-[280px]">
          {editingName ? (
            <div className="space-y-2">
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={32}
                className="w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-3 py-2.5 text-center text-[18px] font-bold text-pocket-text outline-none focus:border-[#5B8EF0]/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveName();
                  if (e.key === "Escape") {
                    setNameDraft(displayName);
                    setEditingName(false);
                    setNameError(null);
                  }
                }}
              />
              {nameError && (
                <p className="text-[11px] text-red-400">{nameError}</p>
              )}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  data-no-drag
                  disabled={savingName}
                  onClick={() => void handleSaveName()}
                  className="inline-flex items-center gap-1 rounded-full bg-[#00C6C6] px-3.5 py-1.5 text-[13px] font-bold text-black active:opacity-80 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Save
                </button>
                <button
                  type="button"
                  data-no-drag
                  onClick={() => {
                    setNameDraft(displayName);
                    setEditingName(false);
                    setNameError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--pocket-border)] px-3.5 py-1.5 text-[13px] font-bold text-pocket-muted active:opacity-80"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-no-drag
              disabled={!editable}
              onClick={() => editable && setEditingName(true)}
              className="group mx-auto flex max-w-full items-center justify-center gap-2 disabled:cursor-default"
            >
              <h2 className="truncate text-[24px] font-black tracking-tight text-pocket-text">
                {displayName}
              </h2>
              {editable && (
                <Pencil className="h-4 w-4 shrink-0 text-pocket-muted transition-colors group-active:text-pocket-text" />
              )}
            </button>
          )}
        </div>

        {email && (
          <p className="mt-1 max-w-full truncate text-[14px] font-medium text-pocket-muted">
            {email}
          </p>
        )}

        {joined && (
          <p className="mt-3 text-[12px] font-semibold text-pocket-muted">
            Member since {joined}
          </p>
        )}

        {editable && avatarUrl && (
          <button
            type="button"
            data-no-drag
            onClick={() => {
              saveProfileAvatar(user.id, null);
              setAvatarUrl(null);
            }}
            className="mt-3 text-[12px] font-semibold text-pocket-muted active:text-pocket-text"
          >
            Remove photo
          </button>
        )}
      </div>
    </section>
  );
}
