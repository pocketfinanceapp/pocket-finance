"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Pencil, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { ProfileAvatarWithRing } from "@/components/ProfileAvatarWithRing";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";
import {
  PF_AVATAR_CHANGED_EVENT,
  compressAvatarFile,
  loadProfileAvatar,
  saveProfileAvatar,
} from "@/lib/profileStorage";
import type { LevelState } from "@/lib/progression";

interface ProfileIdentitySectionProps {
  user: User;
  displayName: string;
  initials: string;
  email?: string | null;
  joined: string | null;
  progression: LevelState;
  totalXP: number;
  animateIn?: boolean;
  editable?: boolean;
}

export function ProfileIdentitySection({
  user,
  displayName,
  initials,
  email,
  joined,
  progression,
  totalXP,
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

  const isMaxLevel = progression.level === 7;
  const xpToNext = progression.nextLevelXP - progression.currentLevelXP;

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
      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 pb-5 pt-6"
      style={tabEnterStyle(animateIn, 0)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <ProfileAvatarWithRing
            initials={initials}
            imageUrl={avatarUrl}
            progression={progression}
            animateIn={animateIn}
          />
          {editable && (
            <>
              <button
                type="button"
                data-no-drag
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#12131a] text-white shadow-lg active:scale-95"
                aria-label="Change profile photo"
              >
                <Camera className="h-3.5 w-3.5 text-zinc-300" />
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
                className="w-full rounded-xl border border-white/[0.12] bg-black/40 px-3 py-2.5 text-center text-[17px] font-semibold text-white outline-none focus:border-[#5B8EF0]/50"
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
                  className="inline-flex items-center gap-1 rounded-full bg-[#00C6C6] px-3.5 py-1.5 text-[12px] font-semibold text-black active:opacity-80 disabled:opacity-50"
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
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-3.5 py-1.5 text-[12px] font-semibold text-zinc-400 active:opacity-80"
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
              <h2 className="truncate text-[20px] font-bold text-white">
                {displayName}
              </h2>
              {editable && (
                <Pencil className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-active:text-zinc-400" />
              )}
            </button>
          )}
        </div>

        {email && (
          <p className="mt-1 max-w-full truncate text-[13px] text-zinc-500">{email}</p>
        )}

        <p className="mt-2 text-[13px] font-medium text-[#9DA8FF]">
          {progression.title} · Level {progression.level}
        </p>

        {!isMaxLevel ? (
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Progress to Level {progression.level + 1}</span>
              <span className="tabular-nums">
                {progression.progressXP.toLocaleString()} / {xpToNext.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C6CF8] via-[#5B8EF0] to-[#00C6C6] transition-all duration-700"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-[12px] tabular-nums text-zinc-500">
            {totalXP.toLocaleString()} lifetime XP
          </p>
        )}

        {joined && (
          <p className="mt-3 text-[11px] text-zinc-600">Member since {joined}</p>
        )}

        {editable && avatarUrl && (
          <button
            type="button"
            data-no-drag
            onClick={() => {
              saveProfileAvatar(user.id, null);
              setAvatarUrl(null);
            }}
            className="mt-3 text-[11px] font-medium text-zinc-600 active:text-zinc-400"
          >
            Remove photo
          </button>
        )}
      </div>
    </section>
  );
}
