"use client";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            MarkovMate
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI-Powered Task Optimizer
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            Welcome to MarkovMate
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Optimize your daily tasks using Markov chains and AI-powered suggestions.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Get started by adding your tasks and let MarkovMate find the most efficient sequence and parallel processing opportunities.
          </p>
        </div>
      </div>
    </main>
  );
}
