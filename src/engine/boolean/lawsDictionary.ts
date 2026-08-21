/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BooleanLawInfo {
  id: string;
  name: string;
  category: string;
  primalEquation: string;
  dualEquation: string;
  description: string;
  example: string;
  dualityExplanation: string;
}

export const BOOLEAN_LAWS_DICTIONARY: Record<string, BooleanLawInfo> = {
  distributive: {
    id: 'distributive',
    name: 'Distributive Law',
    category: 'Expansion & Factoring',
    primalEquation: 'A · (B + C) = AB + AC',
    dualEquation: 'A + BC = (A + B)(A + C)',
    description:
      'Multiplication distributes over addition, and by the Principle of Duality, addition ALSO distributes over multiplication.',
    example:
      'Given: (A + B)(A + C)\nBy Dual Distributive Law: (A + B)(A + C) = A + BC\n\nExample 2: (A + B + C)(A + B + C\')\nLet X = (A + B)\n(X + C)(X + C\') = X + CC\' = (A + B) + 0 = A + B',
    dualityExplanation:
      'Interchanging (·) and (+) transforms A(B+C) = AB+AC directly into A + BC = (A+B)(A+C).',
  },
  absorption: {
    id: 'absorption',
    name: 'Absorption Law',
    category: 'Redundancy Elimination',
    primalEquation: 'A + AB = A   |   A + A\'B = A + B',
    dualEquation: 'A · (A + B) = A   |   A · (A\' + B) = AB',
    description:
      'A term "absorbs" redundant terms that contain it. If a term is already TRUE (or FALSE in dual form), the larger expression is dominated by A.',
    example:
      'Given: A(A + B)\nSince A is common in both factors: A(A + B) = A · A + AB = A + AB = A.\n\nGiven: A + A\'B\nUsing Distributive: (A + A\')(A + B) = 1 · (A + B) = A + B.',
    dualityExplanation:
      'By swapping (+) and (·), A + AB = A converts to the dual relation A(A + B) = A.',
  },
  properties_0_1: {
    id: 'properties_0_1',
    name: 'Properties of 0 and 1 (Identity & Dominance)',
    category: 'Constants & Bounds',
    primalEquation: 'A + 0 = A (Identity)   |   A + 1 = 1 (Dominance)',
    dualEquation: 'A · 1 = A (Identity)   |   A · 0 = 0 (Dominance)',
    description:
      '0 is the identity for OR, and 1 is the identity for AND. 1 dominates OR (null element), while 0 dominates AND.',
    example:
      'Given: (A + B) · 1\nResult: A + B (Identity)\n\nGiven: (A + B) · 0\nResult: 0 (Dominance)',
    dualityExplanation:
      'Interchanging 0 with 1, and (+) with (·) maps A + 0 = A to A · 1 = A, and A + 1 = 1 to A · 0 = 0.',
  },
  complementary: {
    id: 'complementary',
    name: 'Complementary Law',
    category: 'Inverses',
    primalEquation: 'A + A\' = 1',
    dualEquation: 'A · A\' = 0',
    description:
      'A variable OR-ed with its inverse is always 1 (Tautology). A variable AND-ed with its inverse is always 0 (Contradiction).',
    example:
      'Given: AB + AB\'\nFactor out A: A · (B + B\')\nSince B + B\' = 1: A · 1 = A.',
    dualityExplanation:
      'Replacing (+) with (·) and 1 with 0 gives the exact dual property: A · A\' = 0.',
  },
  idempotent: {
    id: 'idempotent',
    name: 'Idempotent Law',
    category: 'Duplication',
    primalEquation: 'A + A = A',
    dualEquation: 'A · A = A',
    description:
      'Combining identical inputs into an OR or AND gate produces that same value without duplication.',
    example:
      'Given: A + B + A\nGroup identicals: (A + A) + B = A + B.\n\nGiven: A · B · A\nGroup identicals: (A · A) · B = AB.',
    dualityExplanation:
      'The dual of A + A = A is A · A = A.',
  },
  involution: {
    id: 'involution',
    name: 'Involution Law (Double Negation)',
    category: 'Negation',
    primalEquation: '(A\')\' = A',
    dualEquation: '(A\')\' = A (Self-Dual)',
    description:
      'Two consecutive inversions cancel each other out. Inverting a signal twice returns the original signal.',
    example:
      'Given: ((A + B)\')\'\nApplying Involution Law: A + B.',
    dualityExplanation:
      'Because involution involves only negation, it is self-dual.',
  },
  demorgan: {
    id: 'demorgan',
    name: 'De Morgan\'s Laws',
    category: 'Negation of Compounds',
    primalEquation: '(A + B)\' = A\' · B\'',
    dualEquation: '(A · B)\' = A\' + B\'',
    description:
      'The complement of a sum of variables is the product of their complements, and the complement of a product of variables is the sum of their complements.',
    example:
      'Given: !(A + B · C)\nStep 1: A\' · (B · C)\'\nStep 2: A\' · (B\' + C\') = A\'B\' + A\'C\'.',
    dualityExplanation:
      'De Morgan\'s two equations are mutual duals with inverted literals.',
  },
  commutative: {
    id: 'commutative',
    name: 'Commutative Law',
    category: 'Ordering',
    primalEquation: 'A + B = B + A',
    dualEquation: 'A · B = B · A',
    description:
      'The order of inputs in an OR or AND operation does not change the truth value.',
    example:
      'B + A = A + B\nB · A = A · B',
    dualityExplanation:
      'Swapping (+) with (·) yields the dual commutative property.',
  },
  associative: {
    id: 'associative',
    name: 'Associative Law',
    category: 'Grouping',
    primalEquation: '(A + B) + C = A + (B + C)',
    dualEquation: '(A · B) · C = A · (B · C)',
    description:
      'The grouping of operands in multiple OR or AND operations does not affect the output.',
    example:
      '(A + B) + C = A + B + C\n(AB)C = ABC',
    dualityExplanation:
      'Grouping holds equally for addition and multiplication.',
  },
  duality: {
    id: 'duality',
    name: 'Principle of Duality',
    category: 'Foundational Theorem',
    primalEquation: 'Replace (+) with (·)',
    dualEquation: 'Replace 0 with 1 (and vice-versa)',
    description:
      'Any true Boolean algebraic identity remains valid if AND and OR operators are interchanged, and 0 and 1 elements are interchanged (while keeping variable complements unchanged).',
    example:
      'Identity: A + 0 = A\nDual: A · 1 = A\n\nIdentity: A + A\' = 1\nDual: A · A\' = 0\n\nIdentity: A(B + C) = AB + AC\nDual: A + BC = (A + B)(A + C)',
    dualityExplanation:
      'Duality allows every Boolean theorem to generate two complementary theorems simultaneously.',
  },
};

export function getLawInfoByNameOrTag(nameOrTag: string): BooleanLawInfo {
  const lower = nameOrTag.toLowerCase();
  if (lower.includes('distributive') || lower.includes('factor')) return BOOLEAN_LAWS_DICTIONARY.distributive;
  if (lower.includes('absorption')) return BOOLEAN_LAWS_DICTIONARY.absorption;
  if (lower.includes('0') || lower.includes('1') || lower.includes('identity') || lower.includes('dominance'))
    return BOOLEAN_LAWS_DICTIONARY.properties_0_1;
  if (lower.includes('complement')) return BOOLEAN_LAWS_DICTIONARY.complementary;
  if (lower.includes('idempotent')) return BOOLEAN_LAWS_DICTIONARY.idempotent;
  if (lower.includes('involution') || lower.includes('double negation')) return BOOLEAN_LAWS_DICTIONARY.involution;
  if (lower.includes('morgan')) return BOOLEAN_LAWS_DICTIONARY.demorgan;
  if (lower.includes('commutative')) return BOOLEAN_LAWS_DICTIONARY.commutative;
  if (lower.includes('associative')) return BOOLEAN_LAWS_DICTIONARY.associative;
  return BOOLEAN_LAWS_DICTIONARY.duality;
}
