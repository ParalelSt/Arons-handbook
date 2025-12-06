import { cn } from "@/lib/utils";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1
            className={cn(
              "text-4xl font-bold text-white mb-2",
              "bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            )}
          >
            Gym LogBook
          </h1>
          <p className="text-slate-400">Track your exercises and progress</p>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-slate-700">
          <div className="text-center py-12">
            <h2 className="text-2xl text-white mb-4">
              Ready to start tracking!
            </h2>
            <p className="text-slate-400">
              Setup complete. Now let's build your logbook features.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
