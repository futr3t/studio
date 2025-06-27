import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, type Session, type User, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Safely access environment variables with fallbacks
const supabaseUrl = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  : process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; role?: 'admin' | 'staff' }) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  createUser: (username: string, password: string, userData: { name: string; role: 'admin' | 'staff' }) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
            className: "bg-accent text-accent-foreground"
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);


  const signIn = async (username: string, password: string) => {
    try {
      const email = `${username}@chefcheck.local`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Sign in failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      return { error: authError };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (updates: { name?: string; role?: 'admin' | 'staff' }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        className: "bg-accent text-accent-foreground"
      });

      return { error: null };
    } catch (error) {
      const updateError = error as Error;
      toast({
        title: "Profile update failed",
        description: updateError.message,
        variant: "destructive"
      });
      return { error: updateError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
        className: "bg-accent text-accent-foreground"
      });

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Password update failed",
        description: authError.message,
        variant: "destructive"
      });
      return { error: authError };
    }
  };

  const createUser = async (username: string, password: string, userData: { name: string; role: 'admin' | 'staff' }) => {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          userData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast({
        title: "User created",
        description: `User ${userData.name} has been successfully created.`,
        className: "bg-accent text-accent-foreground"
      });

      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "User creation failed",
        description: authError.message,
        variant: "destructive"
      });
      return { error: authError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    createUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};