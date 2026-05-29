import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: "admin" | "restaurant" | null;
  restaurantId: string | null;
  userName: string | null;
  userEmail: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: SignUpMeta) => Promise<{ error: string | null; restaurantId?: string }>;
  signOut: () => Promise<void>;
}

interface SignUpMeta {
  fullName: string;
  company: string;
  role?: "admin" | "restaurant";
}

interface LocalUser {
  email: string;
  passwordHash: string;
  fullName: string;
  company: string;
  role: "admin" | "restaurant";
  restaurantId: string;
}

// Check if Supabase keys are configured and are not placeholders
const isSupabaseConfigured = (() => {
  if (typeof window === "undefined") return false;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder")) return false;
  if (key === "placeholder-key") return false;
  // Accept both legacy JWT (eyJ...) and new publishable key (sb_publishable_...) formats
  const isValidKey = key.startsWith("eyJ") || key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
  return isValidKey;
})();

// Helper to save simulated users locally in case Supabase is absent or throws schema errors
function saveLocalUser(user: LocalUser) {
  if (typeof window === "undefined") return;
  try {
    const users = JSON.parse(localStorage.getItem("rasoi_local_users") || "[]") as LocalUser[];
    const filtered = users.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
    filtered.push(user);
    localStorage.setItem("rasoi_local_users", JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to save local user:", err);
  }
}

// Helper to find simulated users locally
function findLocalUser(email: string): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const users = JSON.parse(localStorage.getItem("rasoi_local_users") || "[]") as LocalUser[];
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived from user metadata or sessionStorage fallback
  const userRole = (user?.user_metadata?.role as "admin" | "restaurant") 
    ?? (typeof window !== "undefined" ? sessionStorage.getItem("userRole") as any : null);
  const restaurantId = (user?.user_metadata?.restaurant_id as string) 
    ?? (typeof window !== "undefined" ? sessionStorage.getItem("restaurantId") : null) 
    ?? "c1";
  const userName = (user?.user_metadata?.full_name as string) 
    ?? (typeof window !== "undefined" ? sessionStorage.getItem("userName") : null);
  const userEmail = user?.email 
    ?? (typeof window !== "undefined" ? sessionStorage.getItem("userEmail") : null);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (mounted && existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
        }
      } catch (err) {
        console.warn("Supabase session check failed (may be using non-standard key):", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Subscribe to auth changes if Supabase is configured
    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Sync to sessionStorage for components that still read from there
          if (newSession?.user) {
            const meta = newSession.user.user_metadata;
            sessionStorage.setItem("userRole", meta?.role || "restaurant");
            sessionStorage.setItem("userEmail", newSession.user.email || "");
            sessionStorage.setItem("userName", meta?.full_name || "");
            sessionStorage.setItem("restaurantId", meta?.restaurant_id || "c1");
          }
        }
      });
      subscription = sub;
    }

    // Check if we have a local session even if Supabase auth isn't available
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("userRole");
      if (storedRole) {
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    // If Supabase keys are placeholders or not configured, bypass completely
    if (!isSupabaseConfigured) {
      return fallbackLocalAuth(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Intercept Supabase login failure
        // First try to check if credentials match our local fallback accounts or local storage registry
        const localResult = fallbackLocalAuth(email, password);
        if (!localResult.error) {
          return { error: null }; // Logged in successfully locally!
        }
        
        // If it's a connectivity/API key error or schema error, return the local auth outcome
        if (
          error.message?.includes("fetch") || 
          error.message?.includes("network") || 
          error.message?.includes("API key") ||
          error.status === 0 ||
          error.status === 400 ||
          error.status === 401 ||
          email === "demo@rasoi.in" ||
          email === "admin@gmail.com"
        ) {
          return localResult;
        }
        
        return { error: error.message };
      }

      if (data.user) {
        const meta = data.user.user_metadata;
        sessionStorage.setItem("userRole", meta?.role || "restaurant");
        sessionStorage.setItem("userEmail", data.user.email || "");
        sessionStorage.setItem("userName", meta?.full_name || "");
        sessionStorage.setItem("restaurantId", meta?.restaurant_id || "c1");
      }
      
      return { error: null };
    } catch (err: any) {
      console.warn("Supabase signIn failed, trying local fallback:", err);
      return fallbackLocalAuth(email, password);
    }
  }, []);

  const signUp = useCallback(async (
    email: string, password: string, meta: SignUpMeta
  ): Promise<{ error: string | null; restaurantId?: string }> => {
    // If Supabase keys are placeholders or not configured, bypass completely
    if (!isSupabaseConfigured) {
      return fallbackLocalSignUp(email, meta, password);
    }

    try {
      const role = meta.role || "restaurant";
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: meta.fullName,
            company: meta.company,
            role,
          },
        },
      });

      if (error) {
        console.warn("Supabase signUp failed with error, falling back locally:", error.message);
        return fallbackLocalSignUp(email, meta, password);
      }

      let newRestaurantId = "c1";

      // Try to create a restaurant row in Supabase
      if (data.user && role === "restaurant") {
        try {
          const { data: restaurant, error: insertError } = await supabase
            .from("restaurants")
            .insert({
              name: meta.company || meta.fullName + "'s Restaurant",
              email: email,
              type: "Restaurant",
              location: "",
              city: "",
              capacity: 0,
              icon: "🍽️",
              owner_id: data.user.id,
            })
            .select("id")
            .single();

          if (restaurant && !insertError) {
            newRestaurantId = restaurant.id;
            // Update user metadata with restaurant_id
            await supabase.auth.updateUser({
              data: { restaurant_id: newRestaurantId },
            });
          }
        } catch (dbErr) {
          console.warn("Could not create restaurant row in Supabase:", dbErr);
        }
      }

      // Sync to sessionStorage
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("userName", meta.fullName);
      sessionStorage.setItem("restaurantId", newRestaurantId);

      // Save locally as well, so they can log back in locally if needed
      const localUser: LocalUser = {
        email,
        passwordHash: password,
        fullName: meta.fullName,
        company: meta.company,
        role,
        restaurantId: newRestaurantId
      };
      saveLocalUser(localUser);

      return { error: null, restaurantId: newRestaurantId };
    } catch (err: any) {
      console.warn("Supabase signUp exception, falling back locally:", err);
      return fallbackLocalSignUp(email, meta, password);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    }
    sessionStorage.clear();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, userRole, restaurantId, userName, userEmail, loading,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Local fallback auth (for when Supabase isn't fully configured or queries fail) ---

function fallbackLocalAuth(email: string, password: string): { error: string | null } {
  // 1. Check hardcoded accounts
  if (email === "admin@gmail.com" && password === "admin@123") {
    sessionStorage.setItem("userRole", "admin");
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userName", "System Admin");
    sessionStorage.setItem("restaurantId", "");
    return { error: null };
  }
  if (email === "demo@rasoi.in" && password === "demo1234") {
    sessionStorage.setItem("userRole", "restaurant");
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userName", "Saffron Lounge");
    sessionStorage.setItem("restaurantId", "c1");
    return { error: null };
  }
  
  // 2. Check local database
  const localUser = findLocalUser(email);
  if (localUser && localUser.passwordHash === password) {
    sessionStorage.setItem("userRole", localUser.role);
    sessionStorage.setItem("userEmail", localUser.email);
    sessionStorage.setItem("userName", localUser.fullName);
    sessionStorage.setItem("restaurantId", localUser.restaurantId);
    return { error: null };
  }
  
  return { error: "Invalid credentials. Try admin@gmail.com / admin@123, demo@rasoi.in / demo1234, or register a new account." };
}

function fallbackLocalSignUp(email: string, meta: SignUpMeta, password?: string): { error: string | null; restaurantId?: string } {
  const role = meta.role || "restaurant";
  const newRestaurantId = "c_" + Math.random().toString(36).substr(2, 9);
  
  const localUser: LocalUser = {
    email,
    passwordHash: password || "",
    fullName: meta.fullName,
    company: meta.company,
    role,
    restaurantId: newRestaurantId
  };
  
  saveLocalUser(localUser);

  sessionStorage.setItem("userRole", role);
  sessionStorage.setItem("userEmail", email);
  sessionStorage.setItem("userName", meta.fullName);
  sessionStorage.setItem("restaurantId", newRestaurantId);
  
  return { error: null, restaurantId: newRestaurantId };
}
