"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser, User } from "@/context/UserContext";
import { FileText, ChevronDown, Check, Users, Sparkles } from "lucide-react";

export function Navbar() {
  const { users, currentUser, setCurrentUser } = useCurrentUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPersonaRole = (email: string) => {
    if (email.includes("danniel")) return "Product Lead";
    if (email.includes("bob")) return "Senior Engineer";
    return "Design Partner";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Ajaia Docs</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                AI-Native
              </span>
            </div>
          </Link>
        </div>

        {/* Persona Switcher for Quick Reviewer Evaluation */}
        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white shadow-2xs hover:bg-gray-50 transition cursor-pointer text-left"
              title="Switch user to evaluate document sharing"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase border border-blue-200">
                {currentUser?.name.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {currentUser?.name || "Select User"}
                </p>
                <p className="text-[11px] text-gray-500 leading-none">
                  {currentUser ? getPersonaRole(currentUser.email) : ""}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reviewer Persona Switcher</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Switch between seeded users to test real-time sharing & permissions.
                  </p>
                </div>

                <div className="p-1 space-y-0.5">
                  {users.map((user) => {
                    const isSelected = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUser(user);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium leading-tight">{user.name}</p>
                            <p className="text-[11px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
