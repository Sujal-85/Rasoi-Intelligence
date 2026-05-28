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

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
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

    // Also check if we have a sessionStorage fallback (for when Supabase key is non-standard)
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("userRole");
      if (storedRole) {
        // We have a local session even if Supabase auth isn't available
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Supabase auth failed — check if it's a connectivity/key issue vs wrong credentials
        if (error.message?.includes("fetch") || error.message?.includes("network") || error.status === 0) {
          // Network or key issue — fall back to local demo auth
          return fallbackLocalAuth(email, password);
        }
        
        // For "Invalid login credentials" type errors, try local fallback too
        // since the Supabase project may not have these users
        const localResult = fallbackLocalAuth(email, password);
        if (!localResult.error) return localResult;
        
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
        // If Supabase signup fails (key issue, etc.), use local fallback
        if (error.message?.includes("fetch") || error.message?.includes("network")) {
          return fallbackLocalSignUp(email, meta);
        }
        return { error: error.message };
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
          console.warn("Could not create restaurant row:", dbErr);
        }
      }

      // Sync to sessionStorage
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("userName", meta.fullName);
      sessionStorage.setItem("restaurantId", newRestaurantId);

      return { error: null, restaurantId: newRestaurantId };
    } catch (err: any) {
      console.warn("Supabase signUp failed, using local fallback:", err);
      return fallbackLocalSignUp(email, meta);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore — may fail if Supabase isn't fully configured
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

// --- Local fallback auth (for when Supabase isn't fully configured) ---

function fallbackLocalAuth(email: string, password: string): { error: string | null } {
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
  return { error: "Invalid email or password. Try admin@gmail.com / admin@123 or demo@rasoi.in / demo1234" };
}

function fallbackLocalSignUp(email: string, meta: SignUpMeta): { error: string | null; restaurantId?: string } {
  // For local mode, just create a session
  sessionStorage.setItem("userRole", meta.role || "restaurant");
  sessionStorage.setItem("userEmail", email);
  sessionStorage.setItem("userName", meta.fullName);
  sessionStorage.setItem("restaurantId", "c1");
  return { error: null, restaurantId: "c1" };
}
