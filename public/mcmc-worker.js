// MCMC Web Worker for parallel chain execution
// This worker runs independently in its own thread

// Import type definitions are not available in workers, so we'll work with plain objects

/**
 * Calculate objective function (copied from objective.ts)
 */
function calculateObjective(sequence) {
  let totalTime = 0;
  let dependencyViolations = 0;
  let inefficiencyPenalty = 0;
  const completedTasks = new Set();

  for (let i = 0; i < sequence.length; i++) {
    const task = sequence[i];
    totalTime += task.duration;

    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!completedTasks.has(depId)) {
          dependencyViolations += 1000;
        }
      }
    }

    completedTasks.add(task.id);

    if (i > 0) {
      const prevTask = sequence[i - 1];
      if (prevTask.category !== task.category) {
        inefficiencyPenalty += 5;
      }

      const priorityValues = { high: 3, medium: 2, low: 1 };
      const currentPriority = priorityValues[task.priority];
      const prevPriority = priorityValues[prevTask.priority];

      if (currentPriority > prevPriority) {
        inefficiencyPenalty += 10;
      }
    }
  }

  const score = totalTime + dependencyViolations + inefficiencyPenalty;
  return { score, estimatedTime: totalTime };
}

/**
 * Propose new sequence (copied from proposal.ts)
 */
function proposeNewSequence(currentSequence) {
  const newSequence = [...currentSequence];

  if (newSequence.length < 2) {
    return newSequence;
  }

  const strategy = Math.random();

  if (strategy < 0.5) {
    swapAdjacentTasks(newSequence);
  } else if (strategy < 0.8) {
    swapRandomTasks(newSequence);
  } else {
    moveTaskToRandomPosition(newSequence);
  }

  return newSequence;
}

function swapAdjacentTasks(sequence) {
  const maxIndex = sequence.length - 2;
  if (maxIndex < 0) return;
  const index = Math.floor(Math.random() * (maxIndex + 1));
  [sequence[index], sequence[index + 1]] = [sequence[index + 1], sequence[index]];
}

function swapRandomTasks(sequence) {
  const len = sequence.length;
  const i = Math.floor(Math.random() * len);
  let j = Math.floor(Math.random() * len);
  while (j === i && len > 1) {
    j = Math.floor(Math.random() * len);
  }
  [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
}

function moveTaskToRandomPosition(sequence) {
  const len = sequence.length;
  const fromIndex = Math.floor(Math.random() * len);
  const toIndex = Math.floor(Math.random() * len);
  if (fromIndex === toIndex) return;
  const task = sequence.splice(fromIndex, 1)[0];
  sequence.splice(toIndex, 0, task);
}

function initializeRandomSequence(tasks) {
  const sequence = [...tasks];
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

function initializeGreedySequence(tasks) {
  const sequence = [];
  const remaining = new Set(tasks);
  const completed = new Set();
  const priorityValues = { high: 3, medium: 2, low: 1 };

  while (remaining.size > 0) {
    const available = Array.from(remaining).filter((task) => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      return task.dependencies.every((depId) => completed.has(depId));
    });

    if (available.length === 0) {
      sequence.push(...Array.from(remaining));
      break;
    }

    available.sort((a, b) => {
      const priorityDiff = priorityValues[b.priority] - priorityValues[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.duration - b.duration;
    });

    const nextTask = available[0];
    sequence.push(nextTask);
    remaining.delete(nextTask);
    completed.add(nextTask.id);
  }

  return sequence;
}

/**
 * Run MCMC chain
 */
function runMCMCChain(tasks, config, chainId) {
  let currentSequence = chainId === 0
    ? initializeGreedySequence(tasks)
    : initializeRandomSequence(tasks);

  let currentObjective = calculateObjective(currentSequence);
  let currentScore = currentObjective.score;

  const samples = [];
  const scores = [];
  let acceptedMoves = 0;

  const temperature = config.temperature || 1.0;
  const reportInterval = 10; // Report progress every 10 iterations

  for (let iter = 0; iter < config.iterations; iter++) {
    const proposedSequence = proposeNewSequence(currentSequence);
    const proposedObjective = calculateObjective(proposedSequence);
    const proposedScore = proposedObjective.score;

    const acceptanceProbability = Math.min(
      1,
      Math.exp(-(proposedScore - currentScore) / temperature)
    );

    const accepted = Math.random() < acceptanceProbability;

    if (accepted) {
      currentSequence = proposedSequence;
      currentScore = proposedScore;
      acceptedMoves++;
    }

    if (iter >= config.burnIn) {
      samples.push([...currentSequence]);
      scores.push(currentScore);
    }

    // Send progress updates periodically
    if (iter % reportInterval === 0) {
      self.postMessage({
        type: 'progress',
        chainId,
        iteration: iter,
        currentScore,
        acceptanceRate: acceptedMoves / (iter + 1),
      });
    }

    // Early stopping
    if (config.convergenceThreshold && iter > config.burnIn + 50) {
      const recentScores = scores.slice(-50);
      if (recentScores.length > 0) {
        const improvement = Math.max(...recentScores) - Math.min(...recentScores);
        if (improvement < config.convergenceThreshold) {
          break;
        }
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
 * Message handler
 */
self.onmessage = function (e) {
  const { type, tasks, config, chainId } = e.data;

  if (type === 'start') {
    try {
      const result = runMCMCChain(tasks, config, chainId);
      self.postMessage({
        type: 'complete',
        result,
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message,
      });
    }
  }
};
