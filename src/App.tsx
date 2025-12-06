import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "@/lib/auth";
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

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
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
          element={user ? <WorkoutDetailScreen /> : <Navigate to="/login" />}
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
          element={user ? <AddEditTemplateScreen /> : <Navigate to="/login" />}
        />
        <Route
          path="/templates/:templateId/edit"
          element={user ? <AddEditTemplateScreen /> : <Navigate to="/login" />}
        />
        <Route
          path="/goals"
          element={user ? <GoalsScreen /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
