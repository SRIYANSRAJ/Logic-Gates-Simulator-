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
  // Normalize symbols:
  // ·, *, & -> AND
  // +, | -> OR
  // ', !, ~, ¬ -> NOT
  // ⊕, ^ -> XOR
  // ⊙ -> XNOR
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

    if (ch === '\'' || ch === '’') {
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

    if (ch === '*' || ch === '·' || ch === '&') {
      tokens.push('AND');
      i++;
      continue;
    }

    if (ch === '^' || ch === '⊕') {
      tokens.push('XOR');
      i++;
      continue;
    }

    if (ch === '⊙') {
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

  // Insert implicit AND tokens for juxtaposed variables/parentheses (e.g. "AB" -> "A AND B", "(A+B)(C+D)" -> "(A+B) AND (C+D)")
  const expanded: string[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    const next = tokens[j + 1];
    expanded.push(cur);

    if (next) {
      const isCurOperand = cur === ')' || cur === '\'' || (!['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', '('].includes(cur));
      const isNextOperand = next === '(' || next === 'NOT' || (!['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', ')', '\''].includes(next));
      if (isCurOperand && isNextOperand) {
        expanded.push('AND');
      }
    }
  }

  return expanded;
}

/**
 * Recursive Descent Parser for Boolean Expressions into AST
 * Grammar:
 * Expression -> OrExpr
 * OrExpr     -> XorExpr ( ('OR' | 'NOR') XorExpr )*
 * XorExpr    -> AndExpr ( ('XOR' | 'XNOR') AndExpr )*
 * AndExpr    -> NotExpr ( ('AND' | 'NAND') NotExpr )*
 * NotExpr    -> 'NOT' NotExpr | PostfixNot
 * PostfixNot -> Primary ('\'')*
 * Primary    -> '(' Expression ')' | VARIABLE | CONSTANT
 */
export function parseBooleanExpression(expr: string): ASTNode {
  // Strip optional "Y = " or "F(A,B) = "
  let cleaned = expr;
  if (cleaned.includes('=')) {
    cleaned = cleaned.split('=')[1];
  }

  const tokens = tokenizeBooleanExpression(cleaned);
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

    throw new Error(`Unexpected token: ${token}`);
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
    throw new Error(`Unexpected extra token: ${tokens[pos]}`);
  }
  return root;
}

/**
 * Automatically synthesizes an interactive circuit from a parsed Boolean AST
 */
export function synthesizeCircuitFromAST(
  ast: ASTNode,
  outputLabel: string = 'Y',
  baseX: number = 100,
  baseY: number = 100
): { components: CircuitComponent[]; wires: Wire[] } {
  const components: CircuitComponent[] = [];
  const wires: Wire[] = [];

  // Extract all unique variables
  const variables = new Set<string>();
  function findVars(node: ASTNode) {
    if (node.type === 'VARIABLE' && node.value) {
      variables.add(String(node.value));
    }
    if (node.children) {
      node.children.forEach(findVars);
    }
  }
  findVars(ast);

  const varList = Array.from(variables).sort();
  const inputCompMap = new Map<string, CircuitComponent>();

  // Place input switches in column 0
  const inputSpacing = 90;
  varList.forEach((varName, idx) => {
    const switchComp = createComponent('SWITCH', baseX, baseY + idx * inputSpacing, {
      name: `Switch ${varName}`,
      label: varName,
    });
    components.push(switchComp);
    inputCompMap.set(varName, switchComp);
  });

  let gateCol = 1;
  const colWidth = 140;

  // Recursive circuit generator: returns { component, outputPortId }
  function buildNode(node: ASTNode, col: number, rowOffset: number): { comp: CircuitComponent; portId: string; height: number } {
    if (node.type === 'VARIABLE') {
      const switchComp = inputCompMap.get(String(node.value))!;
      return { comp: switchComp, portId: 'out', height: 1 };
    }

    if (node.type === 'CONSTANT') {
      const constType: GateType = node.value === 1 ? 'CONST_1' : 'CONST_0';
      const constComp = createComponent(constType, baseX + col * colWidth, baseY + rowOffset * inputSpacing);
      components.push(constComp);
      return { comp: constComp, portId: 'out', height: 1 };
    }

    if (node.type === 'NOT') {
      const child = buildNode(node.children![0], col, rowOffset);
      const notComp = createComponent('NOT', baseX + (col + 1) * colWidth, child.comp.y);
      components.push(notComp);

      wires.push({
        id: `wire_${child.comp.id}_${notComp.id}_${Date.now()}_${Math.random()}`,
        fromComponentId: child.comp.id,
        fromPortId: child.portId,
        toComponentId: notComp.id,
        toPortId: 'in_0',
      });

      return { comp: notComp, portId: 'out', height: child.height };
    }

    // Binary / Multi-input gate: AND, OR, XOR, NAND, NOR, XNOR
    const gateType = node.type as GateType;
    const leftChild = buildNode(node.children![0], col, rowOffset);
    const rightChild = buildNode(node.children![1], col, rowOffset + leftChild.height);

    const midY = (leftChild.comp.y + rightChild.comp.y) / 2;
    const nextCol = Math.max(leftChild.comp.x, rightChild.comp.x) + colWidth;

    const gateComp = createComponent(gateType, nextCol, midY, { inputCount: 2 });
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

    return { comp: gateComp, portId: 'out', height: leftChild.height + rightChild.height };
  }

  const finalOutput = buildNode(ast, 1, 0);

  // Place final LED / Probe Output
  const probeComp = createComponent('PROBE', finalOutput.comp.x + colWidth, finalOutput.comp.y, {
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
 * Reverse Derivation: Extracts Boolean Algebraic Expression from a Circuit Output Component
 */
export function deriveBooleanExpressionFromCircuit(
  outputComponentId: string,
  components: CircuitComponent[],
  wires: Wire[]
): string {
  const compMap = new Map(components.map((c) => [c.id, c]));
  const wireToTarget = new Map<string, Wire>();
  wires.forEach((w) => {
    wireToTarget.set(`${w.toComponentId}:${w.toPortId}`, w);
  });

  function trace(compId: string, visited: Set<string>): string {
    if (visited.has(compId)) return 'LOOP';
    visited.add(compId);

    const comp = compMap.get(compId);
    if (!comp) return '?';

    if (comp.type === 'SWITCH' || comp.type === 'BUTTON') {
      return comp.label || comp.name || 'In';
    }

    if (comp.type === 'CONST_0') return '0';
    if (comp.type === 'CONST_1') return '1';

    if (comp.type === 'LED' || comp.type === 'PROBE') {
      const inWire = wireToTarget.get(`${comp.id}:in_0`);
      if (!inWire) return '0';
      return trace(inWire.fromComponentId, new Set(visited));
    }

    if (comp.type === 'NOT') {
      const inWire = wireToTarget.get(`${comp.id}:in_0`);
      if (!inWire) return "1";
      const inner = trace(inWire.fromComponentId, new Set(visited));
      return inner.length === 1 ? `${inner}'` : `(${inner})'`;
    }

    if (comp.type === 'BUFFER') {
      const inWire = wireToTarget.get(`${comp.id}:in_0`);
      if (!inWire) return '0';
      return trace(inWire.fromComponentId, new Set(visited));
    }

    // Binary / Multi-input gates
    const inputs: string[] = [];
    for (let i = 0; i < comp.inputCount; i++) {
      const inWire = wireToTarget.get(`${comp.id}:in_${i}`);
      if (inWire) {
        inputs.push(trace(inWire.fromComponentId, new Set(visited)));
      } else {
        inputs.push('0');
      }
    }

    if (comp.type === 'AND') {
      return inputs.map((inp) => (inp.includes('+') || inp.includes('⊕') ? `(${inp})` : inp)).join(' · ');
    }
    if (comp.type === 'OR') {
      return inputs.join(' + ');
    }
    if (comp.type === 'NAND') {
      const andInner = inputs.map((inp) => (inp.includes('+') || inp.includes('⊕') ? `(${inp})` : inp)).join(' · ');
      return `(${andInner})'`;
    }
    if (comp.type === 'NOR') {
      return `(${inputs.join(' + ')})'`;
    }
    if (comp.type === 'XOR') {
      return inputs.map((inp) => (inp.includes('+') ? `(${inp})` : inp)).join(' ⊕ ');
    }
    if (comp.type === 'XNOR') {
      return `(${inputs.join(' ⊕ ')})'`;
    }

    return comp.label || comp.name || 'X';
  }

  return trace(outputComponentId, new Set());
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
} {
  const steps: SimplificationStep[] = [];
  let current = rawExpr.trim();

  // Basic step recorder
  const recordStep = (rule: string, expr: string, explanation: string) => {
    if (expr !== current) {
      current = expr;
      steps.push({ rule, expression: current, explanation });
    }
  };

  steps.push({
    rule: 'Initial Expression',
    expression: current,
    explanation: 'Original unsimplified Boolean expression.',
  });

  // 1. Double Negation Law: (A'') -> A, A'''' -> A
  let step1 = current.replace(/([A-Za-z0-9_]+)''/g, '$1');
  step1 = step1.replace(/\(\(([^\(\)]+)\)'\)'/g, '$1');
  if (step1 !== current) {
    recordStep('Double Negation Law (A\'\' = A)', step1, 'Eliminating redundant complementary double inversions.');
  }

  // 2. Annihilation / Identity Laws: A · 1 -> A, A · 0 -> 0, A + 0 -> A, A + 1 -> 1
  let step2 = current
    .replace(/([A-Za-z0-9_]+)\s*·\s*1/g, '$1')
    .replace(/1\s*·\s*([A-Za-z0-9_]+)/g, '$1')
    .replace(/([A-Za-z0-9_]+)\s*·\s*0/g, '0')
    .replace(/0\s*·\s*([A-Za-z0-9_]+)/g, '0')
    .replace(/([A-Za-z0-9_]+)\s*\+\s*0/g, '$1')
    .replace(/0\s*\+\s*([A-Za-z0-9_]+)/g, '$1')
    .replace(/([A-Za-z0-9_]+)\s*\+\s*1/g, '1')
    .replace(/1\s*\+\s*([A-Za-z0-9_]+)/g, '1');
  if (step2 !== current) {
    recordStep('Identity & Null Laws (A·1=A, A+1=1, A·0=0, A+0=A)', step2, 'Applying fundamental boolean constant properties.');
  }

  // 3. Idempotent Law: A · A -> A, A + A -> A
  let step3 = current
    .replace(/([A-Za-z0-9_]+)\s*·\s*\1\b/g, '$1')
    .replace(/([A-Za-z0-9_]+)\s*\+\s*\1\b/g, '$1');
  if (step3 !== current) {
    recordStep('Idempotent Law (A + A = A, A · A = A)', step3, 'Combining duplicate matching terms.');
  }

  // 4. Complement Law: A · A' -> 0, A + A' -> 1
  let step4 = current
    .replace(/([A-Za-z0-9_]+)\s*·\s*\1'/g, '0')
    .replace(/([A-Za-z0-9_]+)'\s*·\s*\1\b/g, '0')
    .replace(/([A-Za-z0-9_]+)\s*\+\s*\1'/g, '1')
    .replace(/([A-Za-z0-9_]+)'\s*\+\s*\1\b/g, '1');
  if (step4 !== current) {
    recordStep('Complement Law (A · A\' = 0, A + A\' = 1)', step4, 'Resolving mutually exclusive complementary terms.');
  }

  // 5. Absorption Law: A + A · B -> A, A · (A + B) -> A
  let step5 = current.replace(/([A-Za-z0-9_]+)\s*\+\s*\1\s*·\s*([A-Za-z0-9_]+)/g, '$1');
  if (step5 !== current) {
    recordStep('Absorption Law (A + AB = A)', step5, 'Absorbing subordinate product terms.');
  }

  // 6. De Morgan's Law explanation step (if applicable)
  if (current.includes(")'")) {
    steps.push({
      rule: 'De Morgan\'s Law [(A·B)\' = A\'+B\', (A+B)\' = A\'·B\']',
      expression: current,
      explanation: 'Duality transformation converting inverted sum/products.',
    });
  }

  return {
    original: rawExpr,
    simplified: current,
    steps,
  };
}
