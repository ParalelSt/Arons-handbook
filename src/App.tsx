import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "@/lib/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PWAPrompt } from "@/components/ui/PWAPrompt";
import { LoginScreen } from "@/screens/LoginScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { WeekDetailScreen } from "@/screens/WeekDetailScreen";
import { WorkoutDetailScreen } from "@/screens/WorkoutDetailScreen";
import { AddWorkoutScreen } from "@/screens/AddWorkoutScreen";
import { ExercisesScreen } from "@/screens/ExercisesScreen";
import { TemplatesScreen } from "@/screens/TemplatesScreen";
import { AddEditTemplateScreen } from "@/screens/AddEditTemplateScreen";
import { GoalsScreen } from "@/screens/GoalsScreen";
import { AnalyticsScreen } from "@/screens/AnalyticsScreen";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-6">
              The app encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session first
    auth
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((user) => {
      setUser(user);
    });

    // Handle app visibility changes (tab/phone wake)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // App is coming back to foreground
        try {
          // Refresh auth session
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          console.error("Session refresh failed:", err);
          // User will stay logged in if session is still valid
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <PWAPrompt />
          <Routes>
            <Route
              path="/login"
              element={!user ? <LoginScreen /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={user ? <HomeScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/week/:weekStart"
              element={user ? <WeekDetailScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/workout/new"
              element={user ? <AddWorkoutScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/workout/:workoutId"
              element={
                user ? <WorkoutDetailScreen /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/exercises"
              element={user ? <ExercisesScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/templates"
              element={user ? <TemplatesScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/templates/new"
              element={
                user ? <AddEditTemplateScreen /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/templates/:templateId/edit"
              element={
                user ? <AddEditTemplateScreen /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/goals"
              element={user ? <GoalsScreen /> : <Navigate to="/login" />}
            />
            <Route
              path="/analytics"
              element={user ? <AnalyticsScreen /> : <Navigate to="/login" />}
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
