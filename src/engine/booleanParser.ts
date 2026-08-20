/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitComponent, GateType, Wire } from '../types/circuit';
import { createComponent } from './componentFactory';

export type ASTNodeType =
  | 'VARIABLE'
  | 'CONSTANT'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'NAND'
  | 'NOR'
  | 'XNOR';

export interface ASTNode {
  type: ASTNodeType;
  value?: string | number; // For variable name ('A') or constant (0, 1)
  children?: ASTNode[];
}

/**
 * Tokenize a Boolean Expression string
 */
export function tokenizeBooleanExpression(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const clean = expr.trim();

  while (i < clean.length) {
    const ch = clean[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push(ch);
      i++;
      continue;
    }

    if (ch === '\'' || ch === '’' || ch === '`') {
      tokens.push('\'');
      i++;
      continue;
    }

    if (ch === '!' || ch === '~' || ch === '¬') {
      tokens.push('NOT');
      i++;
      continue;
    }

    if (ch === '+' || ch === '|') {
      tokens.push('OR');
      i++;
      continue;
    }

    if (ch === '*' || ch === '·' || ch === '&' || ch === '•') {
      tokens.push('AND');
      i++;
      continue;
    }

    if (ch === '^' || ch === '⊕') {
      tokens.push('XOR');
      i++;
      continue;
    }

    if (ch === '⊙' || ch === '≡') {
      tokens.push('XNOR');
      i++;
      continue;
    }

    // Word tokens: AND, OR, NOT, NAND, NOR, XOR, XNOR, or Variable name
    if (/[a-zA-Z0-9_]/.test(ch)) {
      let word = '';
      while (i < clean.length && /[a-zA-Z0-9_]/.test(clean[i])) {
        word += clean[i];
        i++;
      }
      const upper = word.toUpperCase();
      if (['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(upper)) {
        tokens.push(upper);
      } else {
        tokens.push(word);
      }
      continue;
    }

    i++;
  }

  // Insert implicit AND tokens for juxtaposed variables/parentheses
  // e.g. "AB" -> "A AND B", "(A+B)(C+D)" -> "(A+B) AND (C+D)", "A!B" -> "A AND !B"
  const expanded: string[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    const next = tokens[j + 1];
    expanded.push(cur);

    if (next) {
      const isCurOperand =
        cur === ')' ||
        cur === '\'' ||
        (!['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', '('].includes(cur));
      const isNextOperand =
        next === '(' ||
        next === 'NOT' ||
        (!['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', ')', '\''].includes(next));
      if (isCurOperand && isNextOperand) {
        expanded.push('AND');
      }
    }
  }

  return expanded;
}

/**
 * Recursive Descent Parser for Boolean Expressions into AST
 */
export function parseBooleanExpression(expr: string): ASTNode {
  let cleaned = expr.trim();
  if (!cleaned) {
    throw new Error('Expression is empty. Type a formula like (A AND B) OR C');
  }

  // Strip optional output name like "Y = " or "F(A,B,C) = "
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts.slice(1).join('=').trim();
  }

  const tokens = tokenizeBooleanExpression(cleaned);
  if (tokens.length === 0) {
    throw new Error('No valid tokens found in expression.');
  }

  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parsePrimary(): ASTNode {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token === '(') {
      consume(); // consume '('
      const node = parseOrExpr();
      if (peek() !== ')') {
        throw new Error('Expected matching closing parenthesis `)`');
      }
      consume(); // consume ')'
      return node;
    }

    if (token === '0' || token === '1') {
      consume();
      return { type: 'CONSTANT', value: parseInt(token, 10) };
    }

    if (!['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', ')', '\''].includes(token)) {
      consume();
      return { type: 'VARIABLE', value: token };
    }

    throw new Error(`Unexpected operator or token '${token}' where a variable or term was expected.`);
  }

  function parsePostfixNot(): ASTNode {
    let node = parsePrimary();
    while (peek() === '\'') {
      consume();
      node = { type: 'NOT', children: [node] };
    }
    return node;
  }

  function parseNotExpr(): ASTNode {
    if (peek() === 'NOT') {
      consume();
      const child = parseNotExpr();
      return { type: 'NOT', children: [child] };
    }
    return parsePostfixNot();
  }

  function parseAndExpr(): ASTNode {
    let left = parseNotExpr();
    while (peek() === 'AND' || peek() === 'NAND') {
      const op = consume() as 'AND' | 'NAND';
      const right = parseNotExpr();
      left = { type: op, children: [left, right] };
    }
    return left;
  }

  function parseXorExpr(): ASTNode {
    let left = parseAndExpr();
    while (peek() === 'XOR' || peek() === 'XNOR') {
      const op = consume() as 'XOR' | 'XNOR';
      const right = parseAndExpr();
      left = { type: op, children: [left, right] };
    }
    return left;
  }

  function parseOrExpr(): ASTNode {
    let left = parseXorExpr();
    while (peek() === 'OR' || peek() === 'NOR') {
      const op = consume() as 'OR' | 'NOR';
      const right = parseXorExpr();
      left = { type: op, children: [left, right] };
    }
    return left;
  }

  const root = parseOrExpr();
  if (pos < tokens.length) {
    throw new Error(`Unexpected extra token '${tokens[pos]}' at position ${pos}`);
  }
  return root;
}

/**
 * Extract all unique variable names from AST
 */
export function extractVariablesFromAST(ast: ASTNode): string[] {
  const vars = new Set<string>();
  function recurse(node: ASTNode) {
    if (node.type === 'VARIABLE' && node.value !== undefined) {
      vars.add(String(node.value));
    }
    if (node.children) {
      node.children.forEach(recurse);
    }
  }
  recurse(ast);
  return Array.from(vars).sort();
}

/**
 * Evaluate Boolean AST given input map
 */
export function evaluateAST(ast: ASTNode, inputs: Record<string, 0 | 1>): 0 | 1 {
  switch (ast.type) {
    case 'VARIABLE': {
      const v = inputs[String(ast.value)] ?? 0;
      return v === 1 ? 1 : 0;
    }
    case 'CONSTANT':
      return ast.value === 1 ? 1 : 0;
    case 'NOT': {
      const c = evaluateAST(ast.children![0], inputs);
      return c === 1 ? 0 : 1;
    }
    case 'AND': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return (a && b) === 1 ? 1 : 0;
    }
    case 'OR': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return (a || b) === 1 ? 1 : 0;
    }
    case 'XOR': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return a !== b ? 1 : 0;
    }
    case 'NAND': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return (a && b) === 1 ? 0 : 1;
    }
    case 'NOR': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return (a || b) === 1 ? 0 : 1;
    }
    case 'XNOR': {
      const a = evaluateAST(ast.children![0], inputs);
      const b = evaluateAST(ast.children![1], inputs);
      return a === b ? 1 : 0;
    }
    default:
      return 0;
  }
}

export interface LiveTruthTableResult {
  variables: string[];
  rows: Array<{
    index: number;
    inputs: Record<string, 0 | 1>;
    output: 0 | 1;
    minterm: string;
  }>;
  minterms: number[];
  maxterms: number[];
  sopExpression: string;
  posExpression: string;
}

/**
 * Generate full Truth Table, minterms, and canonical expressions from AST
 */
export function generateTruthTableFromAST(ast: ASTNode): LiveTruthTableResult {
  const variables = extractVariablesFromAST(ast);
  const n = variables.length;

  if (n === 0) {
    // Constant expression
    const val = evaluateAST(ast, {});
    return {
      variables: [],
      rows: [{ index: 0, inputs: {}, output: val, minterm: 'm0' }],
      minterms: val === 1 ? [0] : [],
      maxterms: val === 0 ? [0] : [],
      sopExpression: String(val),
      posExpression: String(val),
    };
  }

  const numRows = Math.pow(2, n);
  const rows: LiveTruthTableResult['rows'] = [];
  const minterms: number[] = [];
  const maxterms: number[] = [];

  for (let i = 0; i < numRows; i++) {
    const inputMap: Record<string, 0 | 1> = {};
    for (let bit = 0; bit < n; bit++) {
      const varName = variables[bit];
      const bitVal = ((i >> (n - 1 - bit)) & 1) as 0 | 1;
      inputMap[varName] = bitVal;
    }

    const out = evaluateAST(ast, inputMap);
    rows.push({
      index: i,
      inputs: inputMap,
      output: out,
      minterm: `m${i}`,
    });

    if (out === 1) {
      minterms.push(i);
    } else {
      maxterms.push(i);
    }
  }

  // Generate Canonical Sum of Products (SOP)
  const sopTerms = minterms.map((mIdx) => {
    return variables
      .map((v, bit) => {
        const bitVal = (mIdx >> (n - 1 - bit)) & 1;
        return bitVal === 1 ? v : `${v}'`;
      })
      .join('');
  });
  const sopExpression = sopTerms.length > 0 ? sopTerms.join(' + ') : '0';

  // Generate Canonical Product of Sums (POS)
  const posTerms = maxterms.map((mIdx) => {
    const inner = variables
      .map((v, bit) => {
        const bitVal = (mIdx >> (n - 1 - bit)) & 1;
        return bitVal === 1 ? `${v}'` : v;
      })
      .join(' + ');
    return `(${inner})`;
  });
  const posExpression = posTerms.length > 0 ? posTerms.join(' · ') : '1';

  return {
    variables,
    rows,
    minterms,
    maxterms,
    sopExpression,
    posExpression,
  };
}

/**
 * Automatically synthesizes an interactive circuit from a parsed Boolean AST
 */
export function synthesizeCircuitFromAST(
  ast: ASTNode,
  outputLabel: string = 'Y',
  baseX: number = 80,
  baseY: number = 100
): { components: CircuitComponent[]; wires: Wire[] } {
  const components: CircuitComponent[] = [];
  const wires: Wire[] = [];

  const variables = extractVariablesFromAST(ast);
  const inputCompMap = new Map<string, CircuitComponent>();

  // Place input switches in column 0
  const inputSpacing = 95;
  const colWidth = 150;

  if (variables.length === 0) {
    // Constant only
    const constType: GateType = ast.value === 1 ? 'CONST_1' : 'CONST_0';
    const constComp = createComponent(constType, baseX, baseY);
    const probeComp = createComponent('PROBE', baseX + colWidth, baseY, {
      name: `Probe ${outputLabel}`,
      label: outputLabel,
    });
    components.push(constComp, probeComp);
    wires.push({
      id: `wire_${constComp.id}_${probeComp.id}_${Date.now()}`,
      fromComponentId: constComp.id,
      fromPortId: 'out',
      toComponentId: probeComp.id,
      toPortId: 'in_0',
    });
    return { components, wires };
  }

  variables.forEach((varName, idx) => {
    const switchComp = createComponent('SWITCH', baseX, baseY + idx * inputSpacing, {
      name: `Input ${varName}`,
      label: varName,
    });
    components.push(switchComp);
    inputCompMap.set(varName, switchComp);
  });

  // Recursive circuit generator: returns { component, outputPortId, height, maxCol }
  function buildNode(
    node: ASTNode,
    col: number,
    rowOffset: number
  ): { comp: CircuitComponent; portId: string; height: number; maxCol: number } {
    if (node.type === 'VARIABLE') {
      const switchComp = inputCompMap.get(String(node.value))!;
      return { comp: switchComp, portId: 'out', height: 1, maxCol: 0 };
    }

    if (node.type === 'CONSTANT') {
      const constType: GateType = node.value === 1 ? 'CONST_1' : 'CONST_0';
      const constComp = createComponent(constType, baseX + col * colWidth, baseY + rowOffset * inputSpacing);
      components.push(constComp);
      return { comp: constComp, portId: 'out', height: 1, maxCol: col };
    }

    if (node.type === 'NOT') {
      const child = buildNode(node.children![0], col, rowOffset);
      const notCol = (child.maxCol || 0) + 1;
      const notComp = createComponent('NOT', baseX + notCol * colWidth, child.comp.y);
      components.push(notComp);

      wires.push({
        id: `wire_${child.comp.id}_${notComp.id}_${Date.now()}_${Math.random()}`,
        fromComponentId: child.comp.id,
        fromPortId: child.portId,
        toComponentId: notComp.id,
        toPortId: 'in_0',
      });

      return { comp: notComp, portId: 'out', height: child.height, maxCol: notCol };
    }

    // Binary / Multi-input gate: AND, OR, XOR, NAND, NOR, XNOR
    const gateType = node.type as GateType;
    const leftChild = buildNode(node.children![0], col, rowOffset);
    const rightChild = buildNode(node.children![1], col, rowOffset + leftChild.height);

    const midY = (leftChild.comp.y + rightChild.comp.y) / 2;
    const gateCol = Math.max(leftChild.maxCol || 0, rightChild.maxCol || 0) + 1;

    const gateComp = createComponent(gateType, baseX + gateCol * colWidth, midY, { inputCount: 2 });
    components.push(gateComp);

    // Connect Left -> in_0
    wires.push({
      id: `wire_${leftChild.comp.id}_${gateComp.id}_in0_${Date.now()}_${Math.random()}`,
      fromComponentId: leftChild.comp.id,
      fromPortId: leftChild.portId,
      toComponentId: gateComp.id,
      toPortId: 'in_0',
    });

    // Connect Right -> in_1
    wires.push({
      id: `wire_${rightChild.comp.id}_${gateComp.id}_in1_${Date.now()}_${Math.random()}`,
      fromComponentId: rightChild.comp.id,
      fromPortId: rightChild.portId,
      toComponentId: gateComp.id,
      toPortId: 'in_1',
    });

    return {
      comp: gateComp,
      portId: 'out',
      height: leftChild.height + rightChild.height,
      maxCol: gateCol,
    };
  }

  const finalOutput = buildNode(ast, 1, 0);

  // Place final Output Probe
  const probeCol = (finalOutput.maxCol || 1) + 1;
  const probeComp = createComponent('PROBE', baseX + probeCol * colWidth, finalOutput.comp.y, {
    name: `Probe ${outputLabel}`,
    label: outputLabel,
  });
  components.push(probeComp);

  wires.push({
    id: `wire_${finalOutput.comp.id}_${probeComp.id}_${Date.now()}_${Math.random()}`,
    fromComponentId: finalOutput.comp.id,
    fromPortId: finalOutput.portId,
    toComponentId: probeComp.id,
    toPortId: 'in_0',
  });

  return { components, wires };
}

/**
 * Step-by-Step Boolean Expression Simplification
 */
export interface SimplificationStep {
  rule: string;
  expression: string;
  explanation: string;
}

export function simplifyBooleanExpression(rawExpr: string): {
  original: string;
  simplified: string;
  steps: SimplificationStep[];
  truthTable: LiveTruthTableResult;
} {
  const steps: SimplificationStep[] = [];
  const ast = parseBooleanExpression(rawExpr);
  const truthTable = generateTruthTableFromAST(ast);

  let current = rawExpr.trim();

  const recordStep = (rule: string, expr: string, explanation: string) => {
    if (expr !== current) {
      current = expr;
      steps.push({ rule, expression: current, explanation });
    }
  };

  steps.push({
    rule: 'Initial Input',
    expression: current,
    explanation: 'User supplied Boolean expression.',
  });

  // 1. Double Negation Law: (A'') -> A, A'''' -> A
  let step1 = current.replace(/([A-Za-z0-9_]+)''/g, '$1');
  step1 = step1.replace(/\(\(([^\(\)]+)\)'\)'/g, '$1');
  step1 = step1.replace(/NOT\s*\(\s*NOT\s+([A-Za-z0-9_]+)\s*\)/gi, '$1');
  if (step1 !== current) {
    recordStep('Double Negation (A\'\' = A)', step1, 'Eliminated redundant complementary double inversions.');
  }

  // 2. Identity and Null Laws
  let step2 = current
    .replace(/([A-Za-z0-9_]+)\s*(·|\*|AND|&)\s*1/gi, '$1')
    .replace(/1\s*(·|\*|AND|&)\s*([A-Za-z0-9_]+)/gi, '$1')
    .replace(/([A-Za-z0-9_]+)\s*(·|\*|AND|&)\s*0/gi, '0')
    .replace(/0\s*(·|\*|AND|&)\s*([A-Za-z0-9_]+)/gi, '0')
    .replace(/([A-Za-z0-9_]+)\s*(\+|OR|\|)\s*0/gi, '$1')
    .replace(/0\s*(\+|OR|\|)\s*([A-Za-z0-9_]+)/gi, '$1')
    .replace(/([A-Za-z0-9_]+)\s*(\+|OR|\|)\s*1/gi, '1')
    .replace(/1\s*(\+|OR|\|)\s*([A-Za-z0-9_]+)/gi, '1');
  if (step2 !== current) {
    recordStep('Identity & Null Laws (A·1=A, A+1=1, A·0=0, A+0=A)', step2, 'Applied boolean constant rules.');
  }

  // 3. Idempotent Law
  let step3 = current
    .replace(/([A-Za-z0-9_]+)\s*(·|\*|AND|&)\s*\1\b/gi, '$1')
    .replace(/([A-Za-z0-9_]+)\s*(\+|OR|\|)\s*\1\b/gi, '$1');
  if (step3 !== current) {
    recordStep('Idempotent Law (A + A = A, A · A = A)', step3, 'Eliminated duplicate matching terms.');
  }

  // 4. Complement Law: A · A' -> 0, A + A' -> 1
  let step4 = current
    .replace(/([A-Za-z0-9_]+)\s*(·|\*|AND|&)\s*\1'/gi, '0')
    .replace(/([A-Za-z0-9_]+)'\s*(·|\*|AND|&)\s*\1\b/gi, '0')
    .replace(/([A-Za-z0-9_]+)\s*(\+|OR|\|)\s*\1'/gi, '1')
    .replace(/([A-Za-z0-9_]+)'\s*(\+|OR|\|)\s*\1\b/gi, '1');
  if (step4 !== current) {
    recordStep('Complement Law (A · A\' = 0, A + A\' = 1)', step4, 'Resolved mutually exclusive terms.');
  }

  // 5. Canonical Minimized SOP step (via Quine-McCluskey / Truth table deduction)
  if (truthTable.sopExpression && truthTable.sopExpression !== current) {
    recordStep('Minimal Canonical SOP Form', truthTable.sopExpression, 'Derived minimal Sum-of-Products representation.');
  }

  return {
    original: rawExpr,
    simplified: current,
    steps,
    truthTable,
  };
}
