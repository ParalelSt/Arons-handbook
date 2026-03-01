import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button } from "@/components/ui/Layout";
import { Input } from "@/components/ui/Form";
import { auth } from "@/lib/auth";

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await auth.signUp(email, password);
        alert("Account created! Please check your email to verify.");
      } else {
        await auth.signIn(email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-primary">
            Gym LogBook
          </h1>
          <p className="text-sm sm:text-base text-muted">
            Track your training progress
          </p>
        </div>

        <div className="bg-floating rounded-2xl border border-primary p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-surface border border-danger rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-accent hover:text-primary transition-colors text-xs sm:text-sm"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}
