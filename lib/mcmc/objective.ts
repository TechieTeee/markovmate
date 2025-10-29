import { Task, ObjectiveResult } from '../types';

/**
 * Calculate the objective function value for a task sequence
 * Lower scores are better (minimize total time and penalties)
 */
export function calculateObjective(sequence: Task[]): ObjectiveResult {
  let totalTime = 0;
  let dependencyViolations = 0;
  let inefficiencyPenalty = 0;

  // Track completed tasks for dependency checking
  const completedTasks = new Set<string>();

  // Calculate total time and check dependencies
  for (let i = 0; i < sequence.length; i++) {
    const task = sequence[i];
    totalTime += task.duration;

    // Check if dependencies are satisfied
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!completedTasks.has(depId)) {
          // Dependency not yet completed - heavy penalty
          dependencyViolations += 1000;
        }
      }
    }

    // Mark task as completed for future dependency checks
    completedTasks.add(task.id);

    // Check for inefficient transitions (different categories in sequence)
    // Encourage batching similar tasks together
    if (i > 0) {
      const prevTask = sequence[i - 1];
      if (prevTask.category !== task.category) {
        // Small penalty for context switching
        inefficiencyPenalty += 5;
      }

      // Bonus for matching priority sequencing (high priority earlier)
      const priorityValues = { high: 3, medium: 2, low: 1 };
      const currentPriority = priorityValues[task.priority];
      const prevPriority = priorityValues[prevTask.priority];

      if (currentPriority > prevPriority) {
        // Lower priority task followed by higher priority - penalty
        inefficiencyPenalty += 10;
      }
    }
  }

  const score = totalTime + dependencyViolations + inefficiencyPenalty;

  return {
    score,
    estimatedTime: totalTime,
    penaltyBreakdown: {
      dependencyViolations,
      inefficiency: inefficiencyPenalty,
    },
  };
}

/**
 * Check if a sequence is valid (all dependencies satisfied)
 */
export function isValidSequence(sequence: Task[]): boolean {
  const completed = new Set<string>();

  for (const task of sequence) {
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!completed.has(depId)) {
          return false;
        }
      }
    }
    completed.add(task.id);
  }

  return true;
}
