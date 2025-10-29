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

// Optimized task sequence (single solution)
export interface OptimizedSequence {
  tasks: Task[];
  estimatedTime: number; // total time in minutes
  parallelGroups: ParallelGroup[];
  timeSavings: number; // potential time saved in minutes
  qualityScore: number; // objective function value
  chainId?: number; // which MCMC chain generated this
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
  optimizedSequences?: OptimizedSequence[]; // Multiple solutions from MCMC
  isOptimizing: boolean;
  history: TaskHistory[];
  mcmcState?: MCMCState;
}

// MCMC-specific types

// MCMC Chain State
export interface MCMCChainState {
  chainId: number;
  currentSequence: Task[];
  currentScore: number;
  samples: Task[][]; // collected samples
  scores: number[]; // scores for each sample
  acceptanceRate: number;
  iterations: number;
}

// MCMC Configuration
export interface MCMCConfig {
  numChains: number; // number of parallel chains (2-8)
  iterations: number; // iterations per chain
  burnIn: number; // burn-in period to discard
  temperature?: number; // for simulated annealing
  convergenceThreshold?: number; // for early stopping
}

// MCMC State (overall optimization state)
export interface MCMCState {
  chains: MCMCChainState[];
  isConverged: boolean;
  convergenceMetric?: number; // Gelman-Rubin statistic
  bestSolutions: OptimizedSequence[]; // top-k solutions
  startTime: number;
  elapsedTime: number;
}

// Objective function result
export interface ObjectiveResult {
  score: number; // lower is better (total time)
  estimatedTime: number;
  penaltyBreakdown?: {
    dependencyViolations: number;
    inefficiency: number;
  };
}

// MCMC Sample for convergence analysis
export interface MCMCSample {
  iteration: number;
  chainId: number;
  sequence: Task[];
  score: number;
  accepted: boolean;
}
