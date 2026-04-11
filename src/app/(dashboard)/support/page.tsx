"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heart, Coffee, Github } from "lucide-react";

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Support" />

      <div className="px-4 md:px-6 space-y-5">
        <Card className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--accent-primary)", opacity: 0.15 }}
          >
            <Heart size={28} style={{ color: "var(--accent-primary)" }} />
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">Support the Project</h2>
          <p className="text-sm text-secondary max-w-sm mx-auto mb-6">
            This app is built and maintained by a solo developer. If you find it useful,
            consider buying me a coffee to keep development going!
          </p>
          <a href="https://ko-fi.com/aronm" target="_blank" rel="noopener noreferrer">
            <Button size="lg">
              <Coffee size={18} /> Buy Me a Coffee
            </Button>
          </a>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-primary mb-3">About</h3>
          <div className="space-y-3 text-sm text-secondary">
            <p>
              Gym Logbook is a free workout tracking app focused on simplicity and
              progression. Track your sets, monitor PRs, and reach your goals.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted">Version 2.0</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-primary mb-3">Feedback</h3>
          <p className="text-sm text-secondary mb-4">
            Found a bug or have a feature request? Let me know!
          </p>
          <a href="mailto:support@gymlogbook.app">
            <Button variant="secondary" size="sm">Send Feedback</Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
