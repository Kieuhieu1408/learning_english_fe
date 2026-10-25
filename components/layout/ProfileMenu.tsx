"use client";

import React, { useEffect, useRef } from "react";

import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  Layers,
  LogIn,
  LogOut,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
} from "lucide-react";

import type { NavView, UserDto } from "~/types";

import { Button } from "~/components/ui";

export type { NavView };

export function ProfileMenu({
  accountOpen,
  setAccountOpen,
  user,
  currentView,
  onNavigate,
  dueCount = 0,
  dark,
  onToggleDark,
  onOpenAiSettings,
  onOpenSync,
  onOpenAuth,
  onLogout,
}: {
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
  user: UserDto | null;
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  dueCount?: number;
  dark: boolean;
  onToggleDark: () => void;
  onOpenAiSettings: () => void;
  onOpenSync?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountOpen, setAccountOpen]);

  // Compute initials
  const displayName = user?.name || user?.email?.split("@")[0] || "Reader";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="sidebar-bottom" ref={containerRef}>
      <Button
        className={`profile ${accountOpen ? "profile-open" : ""}`}
        onClick={() => setAccountOpen(!accountOpen)}
        aria-expanded={accountOpen}
        aria-controls="profile-submenu"
      >
        <div className="avatar">{initials}</div>
        <span>{displayName}</span>
        <ChevronDown size={16} />
      </Button>

      {accountOpen && (
        <div
          className="account-menu"
          id="profile-submenu"
          aria-label="Profile and learning tools"
          style={{ maxWidth: "260px", overflowX: "hidden" }}
        >
          {user && (
            <div className="mb-1 border-b border-[var(--border)] px-3 py-2">
              <div className="truncate text-xs font-medium text-[var(--ink)]">
                {user.name || user.username}
              </div>
              {user.email && (
                <div className="truncate text-[11px] text-[var(--muted)]">
                  {user.email}
                </div>
              )}
            </div>
          )}

          <div className="account-menu-label">YOUR LEARNING</div>

          {(
            [
              { name: "Review", icon: Layers },
              { name: "Vocabulary", icon: BookOpen },
              { name: "Progress", icon: ChartNoAxesCombined },
            ] as const
          ).map(({ name, icon: Icon }) => (
            <Button
              key={name}
              className={currentView === name ? "menu-active" : ""}
              onClick={() => {
                onNavigate(name);
                setAccountOpen(false);
              }}
            >
              <Icon size={16} />
              {name}
              {name === "Review" && dueCount > 0 && (
                <span className="menu-due">{dueCount} due</span>
              )}
            </Button>
          ))}

          <div className="account-menu-divider" />

          <Button
            onClick={() => {
              onOpenAiSettings();
              setAccountOpen(false);
            }}
          >
            <Sparkles size={15} />
            AI Settings
          </Button>

          {onOpenSync && (
            <Button
              onClick={() => {
                onOpenSync();
                setAccountOpen(false);
              }}
            >
              <RefreshCw size={15} />
              Cloud Sync
            </Button>
          )}

          <Button onClick={onToggleDark}>
            {dark ?
              <Sun size={15} />
            : <Moon size={15} />}
            {dark ? "Light mode" : "Dark mode"}
          </Button>

          <div className="account-menu-divider" />

          {user && user.role !== "ROLE_GUEST" ?
            <Button
              onClick={() => {
                onLogout();
                setAccountOpen(false);
              }}
            >
              <LogOut size={15} />
              Sign out
            </Button>
          : <>
              <Button
                onClick={() => {
                  onOpenAuth();
                  setAccountOpen(false);
                }}
              >
                <LogIn size={15} />
                Sign in / Register
              </Button>
              {user?.role === "ROLE_GUEST" && (
                <Button
                  onClick={() => {
                    onLogout();
                    setAccountOpen(false);
                  }}
                >
                  <LogOut size={15} />
                  Exit guest mode
                </Button>
              )}
            </>
          }
        </div>
      )}
    </div>
  );
}
