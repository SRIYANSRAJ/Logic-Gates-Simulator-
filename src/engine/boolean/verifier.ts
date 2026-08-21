/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASTNode, extractVariables } from './ast';
import { evaluateAST } from './evaluator';

export interface VerificationResult {
  isEquivalent: boolean;
  checkedStatesCount: number;
  counterExample?: {
    inputs: Record<string, 0 | 1>;
    originalOutput: 0 | 1;
    simplifiedOutput: 0 | 1;
  };
}

/**
 * Rigorously verifies if two Boolean ASTs evaluate identically across all possible input states
 */
export function verifyEquivalence(
  originalAST: ASTNode,
  simplifiedAST: ASTNode
): VerificationResult {
  const varsA = extractVariables(originalAST);
  const varsB = extractVariables(simplifiedAST);
  const allVars = Array.from(new Set([...varsA, ...varsB])).sort();

  if (allVars.length === 0) {
    const outA = evaluateAST(originalAST, {});
    const outB = evaluateAST(simplifiedAST, {});
    const match = outA === outB;
    return {
      isEquivalent: match,
      checkedStatesCount: 1,
      counterExample: match
        ? undefined
        : { inputs: {}, originalOutput: outA, simplifiedOutput: outB },
    };
  }

  const numVars = allVars.length;
  const totalCombinations = 1 << numVars;

  for (let i = 0; i < totalCombinations; i++) {
    const binStr = i.toString(2).padStart(numVars, '0');
    const inputs: Record<string, 0 | 1> = {};
    for (let v = 0; v < numVars; v++) {
      inputs[allVars[v]] = binStr[v] === '1' ? 1 : 0;
    }

    const outOriginal = evaluateAST(originalAST, inputs);
    const outSimplified = evaluateAST(simplifiedAST, inputs);

    if (outOriginal !== outSimplified) {
      return {
        isEquivalent: false,
        checkedStatesCount: i + 1,
        counterExample: {
          inputs,
          originalOutput: outOriginal,
          simplifiedOutput: outSimplified,
        },
      };
    }
  }

  return {
    isEquivalent: true,
    checkedStatesCount: totalCombinations,
  };
}
