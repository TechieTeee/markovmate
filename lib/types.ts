// Task priority levels
export type Priority = 'high' | 'medium' | 'low';

// Task category types
export type Category = 'work' | 'personal' | 'errands' | 'health' | 'learning' | 'other';

// Core Task interface
export interface Task {
  id: string;
  name: string;
  duration: number; // in minutes
  category: Category;
  priority: Priority;
  dependencies?: string[]; // IDs of tasks that must be completed first
  createdAt: Date;
  completedAt?: Date;
}

// Optimized task sequence
export interface OptimizedSequence {
  tasks: Task[];
  estimatedTime: number; // total time in minutes
  parallelGroups: ParallelGroup[];
  timeSavings: number; // potential time saved in minutes
}

// Parallel task group
export interface ParallelGroup {
  tasks: Task[];
  reason: string; // AI-generated explanation
  estimatedTime: number; // time for the group (max of individual tasks)
}

// Markov chain transition probabilities
export interface TransitionProbability {
  fromCategory: Category;
  toCategory: Category;
  probability: number;
}

// User history for learning
export interface TaskHistory {
  taskId: string;
  previousTaskId?: string;
  timestamp: Date;
  duration: number; // actual time taken
}

// LLM suggestion response
export interface LLMSuggestion {
  parallelCombos: ParallelGroup[];
  sequenceRecommendations: string[];
  tips: string[];
}

// App state
export interface AppState {
  tasks: Task[];
  optimizedSequence?: OptimizedSequence;
  isOptimizing: boolean;
  history: TaskHistory[];
}
