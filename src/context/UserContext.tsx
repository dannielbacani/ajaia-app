"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface UserContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const DEFAULT_USERS: User[] = [
  {
    id: "user_danniel",
    name: "Danniel Bacani",
    email: "danniel@ajaia.io",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Danniel",
  },
  {
    id: "user_bob",
    name: "Bob Smith",
    email: "bob@ajaia.io",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "user_charlie",
    name: "Charlie Davis",
    email: "charlie@ajaia.io",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUserState] = useState<User | null>(DEFAULT_USERS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data: User[] = await res.json();
          if (data.length > 0) {
            setUsers(data);
            const savedId = localStorage.getItem("ajaia_user_id");
            const matched = data.find((u) => u.id === savedId);
            setCurrentUserState(matched || data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem("ajaia_user_id", user.id);
  };

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
}
