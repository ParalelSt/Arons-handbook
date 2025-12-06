import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Modal, Input } from "@/components/ui/Form";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { templateApi } from "@/lib/templates";
import type { WorkoutTemplateWithExercises } from "@/types";
import { Plus, Copy, Edit, Trash2, Play } from "lucide-react";
import { format } from "date-fns";

export function TemplatesScreen() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplateWithExercises[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkoutTemplateWithExercises | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyName, setCopyName] = useState("");
  const [showUseModal, setShowUseModal] = useState(false);
  const [workoutDate, setWorkoutDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Failed to load templates. Make sure you've run the templates migration in Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!selectedTemplate || !copyName.trim()) return;

    try {
      setError("");
      await templateApi.copy(selectedTemplate.id, copyName.trim());
      setShowCopyModal(false);
      setCopyName("");
      setSelectedTemplate(null);
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to copy template");
    }
  }

  async function handleDelete(template: WorkoutTemplateWithExercises) {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      setError("");
      await templateApi.delete(template.id);
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete template");
    }
  }

  async function handleUseTemplate() {
    if (!selectedTemplate) return;

    try {
      setError("");
      const workoutId = await templateApi.createWorkoutFromTemplate(
        selectedTemplate.id,
        workoutDate
      );
      navigate(`/workout/${workoutId}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          "Failed to create workout from template. Make sure the templates migration is run in Supabase."
      );
    }
  }

  return (
    <Container>
      <Header
        title="Workout Templates"
        onBack={() => navigate("/")}
        action={
          <Button onClick={() => navigate("/templates/new")}>
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Templates" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading templates...</div>
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl text-white mb-2">No Templates Yet</h2>
            <p className="text-slate-400 mb-6">
              Create templates for your regular workouts
            </p>
            <Button onClick={() => navigate("/templates/new")}>
              <Plus className="w-5 h-5 inline mr-2" />
              Create Template
            </Button>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-slate-400 text-sm mb-2">
                        {template.description}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs">
                      {template.template_exercises.length} exercise
                      {template.template_exercises.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Exercise list */}
                <div className="space-y-1 mb-4 pl-3 border-l-2 border-slate-700">
                  {template.template_exercises.map((te) => (
                    <div key={te.id} className="text-sm">
                      <span className="text-slate-300">
                        {te.exercise?.name}
                      </span>
                      <span className="text-slate-600 ml-2">
                        {te.target_sets} sets
                        {te.target_reps && ` × ${te.target_reps} reps`}
                        {te.target_weight && ` × ${te.target_weight}kg`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowUseModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Use
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setCopyName(`${template.name} (Copy)`);
                      setShowCopyModal(true);
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Copy Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setSelectedTemplate(null);
          setCopyName("");
        }}
        title="Copy Template"
      >
        <div className="space-y-4">
          <Input
            label="New Template Name"
            value={copyName}
            onChange={setCopyName}
            placeholder="e.g., Push Day v2"
            required
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCopyModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!copyName.trim()}
              className="flex-1"
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Use Template Modal */}
      <Modal
        isOpen={showUseModal}
        onClose={() => {
          setShowUseModal(false);
          setSelectedTemplate(null);
        }}
        title="Start Workout"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Create a new workout from "{selectedTemplate?.name}"
          </p>
          <Input
            label="Workout Date"
            type="date"
            value={workoutDate}
            onChange={setWorkoutDate}
            required
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowUseModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} className="flex-1">
              Start Workout
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
}
