/**
 * OnboardingScreen
 *
 * Shown once to new users (no workouts + no templates yet).
 * Three-step flow: Welcome → Choose path → Done.
 * Sets localStorage flag "onboarding-done" on completion so it never shows again.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/Layout";
import { Dumbbell, LayoutTemplate, Plus, ChevronRight } from "lucide-react";

const ONBOARDING_KEY = "onboarding-done";

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

type Step = "welcome" | "choose";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");

  function finish(path: string) {
    markOnboardingDone();
    navigate(path);
  }

  return (
    <Container>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {step === "welcome" && (
          <div className="max-w-sm w-full text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center">
                <Dumbbell className="w-10 h-10 text-accent" />
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-primary">
                Welcome to your Logbook
              </h1>
              <p className="text-muted text-base leading-relaxed">
                Track every lift. See your progress. Never guess a weight again.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("choose")}
              className="w-full py-3.5 px-6 bg-accent-primary hover:bg-accent text-primary font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => finish("/")}
              className="text-muted text-sm hover:text-secondary transition-colors"
            >
              Skip setup
            </button>
          </div>
        )}

        {step === "choose" && (
          <div className="max-w-sm w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary">How do you train?</h2>
              <p className="text-muted text-sm">
                Pick how you'd like to start. You can change this any time.
              </p>
            </div>

            {/* Option A — Weekly plan */}
            <button
              onClick={() => finish("/templates")}
              className="w-full text-left p-5 rounded-xl bg-accent-soft border border-accent hover:bg-elevated transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                  <LayoutTemplate className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-semibold mb-1">
                    I follow a weekly plan
                  </p>
                  <p className="text-muted text-sm leading-relaxed">
                    Build a weekly template (Push/Pull/Legs, PPL, etc.) and
                    generate each week from it.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-secondary transition-colors shrink-0 mt-0.5" />
              </div>
            </button>

            {/* Option B — Log freely */}
            <button
              onClick={() => finish("/workout/new")}
              className="w-full text-left p-5 rounded-xl bg-elevated border border-primary hover:bg-elevated transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0 mt-0.5">
                  <Plus className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-semibold mb-1">
                    I train freely
                  </p>
                  <p className="text-muted text-sm leading-relaxed">
                    Log today's workout right now. No template needed.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-secondary transition-colors shrink-0 mt-0.5" />
              </div>
            </button>

            <button
              onClick={() => finish("/")}
              className="w-full text-center text-muted text-sm hover:text-secondary transition-colors py-2"
            >
              Take me to the home screen
            </button>
          </div>
        )}
      </div>
    </Container>
  );
}
