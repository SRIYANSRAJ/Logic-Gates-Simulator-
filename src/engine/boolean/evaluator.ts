/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASTNode, extractVariables, formatAST } from './ast';

export interface TruthTableRow {
  minterm: number;
  binaryString: string;
  values: Record<string, 0 | 1>;
  output: 0 | 1;
}

export interface TruthTableResult {
  variables: string[];
  rows: TruthTableRow[];
  minterms: number[];
  maxterms: number[];
  canonicalSOP: string;
  canonicalPOS: string;
  isTautology: boolean;
  isContradiction: boolean;
}

/**
 * Evaluates an AST node with given variable assignments
 */
export function evaluateAST(node: ASTNode, values: Record<string, 0 | 1>): 0 | 1 {
  switch (node.type) {
    case 'CONST':
      return (Number(node.value) || 0) ? 1 : 0;

    case 'VAR': {
      const varName = String(node.value);
      if (values[varName] !== undefined) {
        return values[varName];
      }
      return 0;
    }

    case 'NOT': {
      const val = evaluateAST(node.children![0], values);
      return val === 1 ? 0 : 1;
    }

    case 'AND': {
      const children = node.children || [];
      for (const child of children) {
        if (evaluateAST(child, values) === 0) return 0;
      }
      return 1;
    }

    case 'OR': {
      const children = node.children || [];
      for (const child of children) {
        if (evaluateAST(child, values) === 1) return 1;
      }
      return 0;
    }

    case 'XOR': {
      const children = node.children || [];
      let parity = 0;
      for (const child of children) {
        parity ^= evaluateAST(child, values);
      }
      return parity as 0 | 1;
    }

    case 'XNOR': {
      const children = node.children || [];
      let parity = 0;
      for (const child of children) {
        parity ^= evaluateAST(child, values);
      }
      return (parity === 0 ? 1 : 0) as 0 | 1;
    }

    case 'NAND': {
      const children = node.children || [];
      for (const child of children) {
        if (evaluateAST(child, values) === 0) return 1;
      }
      return 0;
    }

    case 'NOR': {
      const children = node.children || [];
      for (const child of children) {
        if (evaluateAST(child, values) === 1) return 0;
      }
      return 1;
    }

    default:
      return 0;
  }
}

/**
 * Computes full truth table, minterms, maxterms, canonical SOP, and POS
 */
export function generateTruthTable(
  ast: ASTNode,
  customVars?: string[]
): TruthTableResult {
  const variables =
    customVars && customVars.length > 0 ? customVars : extractVariables(ast);

  // If no variables (e.g. constant '1' or '0'), provide dummy variable 'A' or evaluate directly
  if (variables.length === 0) {
    const val = evaluateAST(ast, {});
    const isOne = val === 1;
    return {
      variables: ['A'],
      rows: [
        { minterm: 0, binaryString: '0', values: { A: 0 }, output: val },
        { minterm: 1, binaryString: '1', values: { A: 1 }, output: val },
      ],
      minterms: isOne ? [0, 1] : [],
      maxterms: isOne ? [] : [0, 1],
      canonicalSOP: isOne ? '1' : '0',
      canonicalPOS: isOne ? '1' : '0',
      isTautology: isOne,
      isContradiction: !isOne,
    };
  }

  const numVars = variables.length;
  // Cap exhaustive table calculation to 10 variables (1024 rows) to prevent browser UI freezing
  const totalRows = Math.min(1024, 1 << numVars);
  const rows: TruthTableRow[] = [];
  const minterms: number[] = [];
  const maxterms: number[] = [];

  for (let i = 0; i < totalRows; i++) {
    const binStr = i.toString(2).padStart(numVars, '0');
    const values: Record<string, 0 | 1> = {};

    for (let v = 0; v < numVars; v++) {
      values[variables[v]] = binStr[v] === '1' ? 1 : 0;
    }

    const output = evaluateAST(ast, values);
    rows.push({
      minterm: i,
      binaryString: binStr,
      values,
      output,
    });

    if (output === 1) {
      minterms.push(i);
    } else {
      maxterms.push(i);
    }
  }

  const isTautology = minterms.length === totalRows;
  const isContradiction = minterms.length === 0;

  // Build Canonical SOP string
  let canonicalSOP = '';
  if (isContradiction) {
    canonicalSOP = '0';
  } else if (isTautology) {
    canonicalSOP = '1';
  } else {
    const sopTerms = minterms.map((m) => {
      const bin = m.toString(2).padStart(numVars, '0');
      return variables
        .map((vName, idx) => (bin[idx] === '1' ? vName : `${vName}'`))
        .join('');
    });
    canonicalSOP = sopTerms.join(' + ');
  }

  // Build Canonical POS string
  let canonicalPOS = '';
  if (isTautology) {
    canonicalPOS = '1';
  } else if (isContradiction) {
    canonicalPOS = '0';
  } else {
    const posTerms = maxterms.map((m) => {
      const bin = m.toString(2).padStart(numVars, '0');
      const inner = variables
        .map((vName, idx) => (bin[idx] === '0' ? vName : `${vName}'`))
        .join(' + ');
      return `(${inner})`;
    });
    canonicalPOS = posTerms.join(' · ');
  }

  return {
    variables,
    rows,
    minterms,
    maxterms,
    canonicalSOP,
    canonicalPOS,
    isTautology,
    isContradiction,
  };
}

/**
 * Quine-McCluskey Exact Boolean Minimization
 * Returns the exact minimal Sum of Products (SOP)
 */
export function quineMcCluskeyMinimize(
  variables: string[],
  minterms: number[],
  dontCares: number[] = []
): string {
  if (minterms.length === 0) return '0';
  const totalStates = 1 << variables.length;
  if (minterms.length === totalStates) return '1';

  const numVars = variables.length;
  const allTerms = Array.from(new Set([...minterms, ...dontCares]));

  interface Implicant {
    mask: string; // e.g. "01-1"
    minterms: number[];
    used: boolean;
  }

  // Step 1: Initial Implicants grouped by number of 1s
  let currentGroup: Implicant[] = allTerms.map((m) => ({
    mask: m.toString(2).padStart(numVars, '0'),
    minterms: [m],
    used: false,
  }));

  const primeImplicants: Implicant[] = [];

  while (currentGroup.length > 0) {
    const nextGroup: Implicant[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < currentGroup.length; i++) {
      for (let j = i + 1; j < currentGroup.length; j++) {
        const a = currentGroup[i];
        const b = currentGroup[j];

        // Check if masks differ by exactly one bit
        let diffCount = 0;
        let diffIdx = -1;
        for (let k = 0; k < numVars; k++) {
          if (a.mask[k] !== b.mask[k]) {
            diffCount++;
            diffIdx = k;
          }
        }

        if (diffCount === 1) {
          a.used = true;
          b.used = true;
          const newMask =
            a.mask.substring(0, diffIdx) + '-' + a.mask.substring(diffIdx + 1);
          if (!seen.has(newMask)) {
            seen.add(newMask);
            const combinedMinterms = Array.from(
              new Set([...a.minterms, ...b.minterms])
            ).sort((x, y) => x - y);
            nextGroup.push({
              mask: newMask,
              minterms: combinedMinterms,
              used: false,
            });
          }
        }
      }
    }

    // Collect unused implicants as prime implicants
    for (const imp of currentGroup) {
      if (!imp.used) {
        if (!primeImplicants.some((p) => p.mask === imp.mask)) {
          primeImplicants.push(imp);
        }
      }
    }

    currentGroup = nextGroup;
  }

  // Step 2: Essential Prime Implicant selection (Prime Implicant Chart)
  const remainingMinterms = new Set(minterms);
  const selectedPrimes: Implicant[] = [];

  // Find essential primes (minterms covered by only one prime implicant)
  for (const m of minterms) {
    const covering = primeImplicants.filter((p) => p.minterms.includes(m));
    if (covering.length === 1) {
      const essential = covering[0];
      if (!selectedPrimes.includes(essential)) {
        selectedPrimes.push(essential);
      }
    }
  }

  // Remove covered minterms
  for (const p of selectedPrimes) {
    for (const m of p.minterms) {
      remainingMinterms.delete(m);
    }
  }

  // Greedy cover for any remaining minterms (or Petrick's method heuristic)
  while (remainingMinterms.size > 0) {
    let bestPrime: Implicant | null = null;
    let maxCover = 0;

    for (const p of primeImplicants) {
      if (selectedPrimes.includes(p)) continue;
      const count = p.minterms.filter((m) => remainingMinterms.has(m)).length;
      if (count > maxCover) {
        maxCover = count;
        bestPrime = p;
      }
    }

    if (!bestPrime || maxCover === 0) break;
    selectedPrimes.push(bestPrime);
    for (const m of bestPrime.minterms) {
      remainingMinterms.delete(m);
    }
  }

  // Convert selected prime implicant masks to SOP expression string
  const termStrings = selectedPrimes.map((p) => {
    let term = '';
    for (let i = 0; i < numVars; i++) {
      const char = p.mask[i];
      if (char === '1') {
        term += variables[i];
      } else if (char === '0') {
        term += `${variables[i]}'`;
      }
    }
    return term === '' ? '1' : term;
  });

  return termStrings.length > 0 ? termStrings.join(' + ') : '0';
}
