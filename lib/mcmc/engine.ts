import { Task, MCMCConfig, MCMCChainState, MCMCSample } from '../types';
import { calculateObjective } from './objective';
import { proposeNewSequence, initializeRandomSequence, initializeGreedySequence } from './proposal';

/**
 * Run a single MCMC chain using Metropolis-Hastings algorithm
 */
export function runMCMCChain(
  tasks: Task[],
  config: MCMCConfig,
  chainId: number,
  onProgress?: (sample: MCMCSample) => void
): MCMCChainState {
  // Initialize sequence
  // Use greedy for chain 0, random for others to ensure diverse exploration
  let currentSequence = chainId === 0
    ? initializeGreedySequence(tasks)
    : initializeRandomSequence(tasks);

  let currentObjective = calculateObjective(currentSequence);
  let currentScore = currentObjective.score;

  const samples: Task[][] = [];
  const scores: number[] = [];
  let acceptedMoves = 0;

  // Run MCMC iterations
  for (let iter = 0; iter < config.iterations; iter++) {
    // Propose new sequence
    const proposedSequence = proposeNewSequence(currentSequence);
    const proposedObjective = calculateObjective(proposedSequence);
    const proposedScore = proposedObjective.score;

    // Metropolis-Hastings acceptance probability
    // Since we're minimizing (lower score is better), we use exp(-(proposed - current))
    const temperature = config.temperature || 1.0;
    const acceptanceProbability = Math.min(
      1,
      Math.exp(-(proposedScore - currentScore) / temperature)
    );

    // Accept or reject
    const accepted = Math.random() < acceptanceProbability;

    if (accepted) {
      currentSequence = proposedSequence;
      currentScore = proposedScore;
      acceptedMoves++;
    }

    // Store sample (after burn-in period)
    if (iter >= config.burnIn) {
      samples.push([...currentSequence]);
      scores.push(currentScore);
    }

    // Call progress callback
    if (onProgress) {
      onProgress({
        iteration: iter,
        chainId,
        sequence: currentSequence,
        score: currentScore,
        accepted,
      });
    }

    // Early stopping check for convergence
    if (config.convergenceThreshold && iter > config.burnIn + 50) {
      // Check if we've stagnated (no improvement in last 50 iterations)
      const recentScores = scores.slice(-50);
      const improvement = Math.max(...recentScores) - Math.min(...recentScores);
      if (improvement < config.convergenceThreshold) {
        break;
      }
    }
  }

  const acceptanceRate = acceptedMoves / config.iterations;

  return {
    chainId,
    currentSequence,
    currentScore,
    samples,
    scores,
    acceptanceRate,
    iterations: config.iterations,
  };
}

/**
 * Run multiple MCMC chains in sequence (for testing without Web Workers)
 */
export function runMultipleMCMCChains(
  tasks: Task[],
  config: MCMCConfig,
  onProgress?: (sample: MCMCSample) => void
): MCMCChainState[] {
  const chains: MCMCChainState[] = [];

  for (let i = 0; i < config.numChains; i++) {
    const chain = runMCMCChain(tasks, config, i, onProgress);
    chains.push(chain);
  }

  return chains;
}

/**
 * Calculate Gelman-Rubin statistic for convergence diagnosis
 * R-hat < 1.1 indicates convergence
 */
export function calculateGelmanRubin(chains: MCMCChainState[]): number {
  if (chains.length < 2) {
    return 1.0; // Cannot calculate with single chain
  }

  const m = chains.length; // number of chains
  const n = chains[0].scores.length; // number of samples per chain

  if (n === 0) {
    return Infinity;
  }

  // Calculate within-chain variance (W)
  const chainVariances = chains.map((chain) => {
    const mean = chain.scores.reduce((sum, score) => sum + score, 0) / n;
    const variance = chain.scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / (n - 1);
    return variance;
  });
  const W = chainVariances.reduce((sum, v) => sum + v, 0) / m;

  // Calculate between-chain variance (B)
  const chainMeans = chains.map((chain) => {
    return chain.scores.reduce((sum, score) => sum + score, 0) / n;
  });
  const overallMean = chainMeans.reduce((sum, mean) => sum + mean, 0) / m;
  const B = chainMeans.reduce((sum, mean) => sum + (mean - overallMean) ** 2, 0) * n / (m - 1);

  // Calculate pooled variance estimate
  const V = ((n - 1) / n) * W + (1 / n) * B;

  // Calculate R-hat
  const rHat = Math.sqrt(V / W);

  return rHat;
}

/**
 * Extract top-k best solutions from all chains
 */
export function extractTopSolutions(chains: MCMCChainState[], k: number = 5): Array<{ sequence: Task[]; score: number; chainId: number }> {
  const allSolutions: Array<{ sequence: Task[]; score: number; chainId: number }> = [];

  // Collect all samples from all chains
  chains.forEach((chain) => {
    chain.samples.forEach((sample, idx) => {
      allSolutions.push({
        sequence: sample,
        score: chain.scores[idx],
        chainId: chain.chainId,
      });
    });
  });

  // Sort by score (lower is better)
  allSolutions.sort((a, b) => a.score - b.score);

  // Return top k unique solutions
  const uniqueSolutions: Array<{ sequence: Task[]; score: number; chainId: number }> = [];
  const seenSequences = new Set<string>();

  for (const solution of allSolutions) {
    const sequenceKey = solution.sequence.map((t) => t.id).join(',');
    if (!seenSequences.has(sequenceKey)) {
      uniqueSolutions.push(solution);
      seenSequences.add(sequenceKey);

      if (uniqueSolutions.length >= k) {
        break;
      }
    }
  }

  return uniqueSolutions;
}
