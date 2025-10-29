import { Task } from '../types';

/**
 * Generate a new candidate sequence by randomly modifying the current sequence
 * Uses various proposal strategies
 */
export function proposeNewSequence(currentSequence: Task[]): Task[] {
  // Clone the sequence
  const newSequence = [...currentSequence];

  if (newSequence.length < 2) {
    return newSequence;
  }

  // Randomly choose a proposal strategy
  const strategy = Math.random();

  if (strategy < 0.5) {
    // Strategy 1: Swap two random adjacent tasks (50% probability)
    swapAdjacentTasks(newSequence);
  } else if (strategy < 0.8) {
    // Strategy 2: Swap two random tasks (30% probability)
    swapRandomTasks(newSequence);
  } else {
    // Strategy 3: Move a task to a random position (20% probability)
    moveTaskToRandomPosition(newSequence);
  }

  return newSequence;
}

/**
 * Swap two adjacent tasks in the sequence
 */
function swapAdjacentTasks(sequence: Task[]): void {
  const maxIndex = sequence.length - 2;
  if (maxIndex < 0) return;

  const index = Math.floor(Math.random() * (maxIndex + 1));
  [sequence[index], sequence[index + 1]] = [sequence[index + 1], sequence[index]];
}

/**
 * Swap two random tasks in the sequence
 */
function swapRandomTasks(sequence: Task[]): void {
  const len = sequence.length;
  const i = Math.floor(Math.random() * len);
  let j = Math.floor(Math.random() * len);

  // Ensure i and j are different
  while (j === i && len > 1) {
    j = Math.floor(Math.random() * len);
  }

  [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
}

/**
 * Move a task from one position to another
 */
function moveTaskToRandomPosition(sequence: Task[]): void {
  const len = sequence.length;
  const fromIndex = Math.floor(Math.random() * len);
  const toIndex = Math.floor(Math.random() * len);

  if (fromIndex === toIndex) return;

  const task = sequence.splice(fromIndex, 1)[0];
  sequence.splice(toIndex, 0, task);
}

/**
 * Initialize a random sequence from a list of tasks
 * This is used to initialize MCMC chains with different starting points
 */
export function initializeRandomSequence(tasks: Task[]): Task[] {
  const sequence = [...tasks];

  // Fisher-Yates shuffle
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  return sequence;
}

/**
 * Initialize a greedy sequence based on priority and dependencies
 * This can provide a good starting point for some chains
 */
export function initializeGreedySequence(tasks: Task[]): Task[] {
  const sequence: Task[] = [];
  const remaining = new Set(tasks);
  const completed = new Set<string>();

  // Priority values for sorting
  const priorityValues = { high: 3, medium: 2, low: 1 };

  while (remaining.size > 0) {
    // Find tasks whose dependencies are satisfied
    const available = Array.from(remaining).filter((task) => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      return task.dependencies.every((depId) => completed.has(depId));
    });

    if (available.length === 0) {
      // No available tasks (circular dependency or error)
      // Just add remaining tasks randomly
      sequence.push(...Array.from(remaining));
      break;
    }

    // Sort available tasks by priority (high first) then by duration (short first)
    available.sort((a, b) => {
      const priorityDiff = priorityValues[b.priority] - priorityValues[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.duration - b.duration;
    });

    // Add the highest priority task
    const nextTask = available[0];
    sequence.push(nextTask);
    remaining.delete(nextTask);
    completed.add(nextTask.id);
  }

  return sequence;
}
