/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASTNode } from './ast';

export interface Token {
  type:
    | 'VAR'
    | 'CONST'
    | 'OP_NOT_PREFIX'
    | 'OP_NOT_POSTFIX'
    | 'OP_AND'
    | 'OP_OR'
    | 'OP_XOR'
    | 'OP_XNOR'
    | 'OP_NAND'
    | 'OP_NOR'
    | 'LPAREN'
    | 'RPAREN';
  value: string;
  pos: number;
}

export class ParseError extends Error {
  position?: number;
  constructor(message: string, position?: number) {
    super(message);
    this.name = 'ParseError';
    this.position = position;
  }
}

/**
 * Tokenize a raw Boolean expression string with character positions
 */
export function tokenize(expr: string): Token[] {
  const rawTokens: Token[] = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];

    // Whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      rawTokens.push({ type: 'LPAREN', value: '(', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      rawTokens.push({ type: 'RPAREN', value: ')', pos: i });
      i++;
      continue;
    }

    // Postfix Complement ticks: ' , ’, `
    if (ch === '\'' || ch === '’' || ch === '`') {
      rawTokens.push({ type: 'OP_NOT_POSTFIX', value: '\'', pos: i });
      i++;
      continue;
    }

    // Prefix NOT symbols: !, ~, ¬
    if (ch === '!' || ch === '~' || ch === '¬') {
      rawTokens.push({ type: 'OP_NOT_PREFIX', value: 'NOT', pos: i });
      i++;
      continue;
    }

    // OR symbols: +, |
    if (ch === '+' || ch === '|') {
      // Check for ||
      if (ch === '|' && expr[i + 1] === '|') {
        rawTokens.push({ type: 'OP_OR', value: 'OR', pos: i });
        i += 2;
        continue;
      }
      rawTokens.push({ type: 'OP_OR', value: 'OR', pos: i });
      i++;
      continue;
    }

    // AND symbols: *, ·, &, •
    if (ch === '*' || ch === '·' || ch === '&' || ch === '•' || ch === '⋅') {
      // Check for &&
      if (ch === '&' && expr[i + 1] === '&') {
        rawTokens.push({ type: 'OP_AND', value: 'AND', pos: i });
        i += 2;
        continue;
      }
      rawTokens.push({ type: 'OP_AND', value: 'AND', pos: i });
      i++;
      continue;
    }

    // XOR symbols: ^, ⊕
    if (ch === '^' || ch === '⊕') {
      rawTokens.push({ type: 'OP_XOR', value: 'XOR', pos: i });
      i++;
      continue;
    }

    // XNOR symbols: ⊙, ≡
    if (ch === '⊙' || ch === '≡') {
      rawTokens.push({ type: 'OP_XNOR', value: 'XNOR', pos: i });
      i++;
      continue;
    }

    // Constants 0 / 1
    if (ch === '0' || ch === '1') {
      // Check if this 0 or 1 is part of an identifier like A0 or just a constant
      const prev = rawTokens[rawTokens.length - 1];
      rawTokens.push({ type: 'CONST', value: ch, pos: i });
      i++;
      continue;
    }

    // Words / Identifiers (Variables, Constants, or Keyword Operators)
    if (/[a-zA-Z_]/.test(ch)) {
      const startPos = i;
      let word = '';
      while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
        word += expr[i];
        i++;
      }

      const upper = word.toUpperCase();
      const KNOWN_MULTI_VARS = new Set(['CIN', 'COUT', 'CLK', 'CLOCK', 'SEL', 'RST', 'RESET', 'EN', 'ENABLE']);
      const isIndexedVar = /^[a-zA-Z][0-9]+$/.test(word) || /^(IN|OUT)[0-9]+$/i.test(word);

      if (upper === 'AND') {
        rawTokens.push({ type: 'OP_AND', value: 'AND', pos: startPos });
      } else if (upper === 'OR') {
        rawTokens.push({ type: 'OP_OR', value: 'OR', pos: startPos });
      } else if (upper === 'NOT') {
        rawTokens.push({ type: 'OP_NOT_PREFIX', value: 'NOT', pos: startPos });
      } else if (upper === 'XOR') {
        rawTokens.push({ type: 'OP_XOR', value: 'XOR', pos: startPos });
      } else if (upper === 'XNOR') {
        rawTokens.push({ type: 'OP_XNOR', value: 'XNOR', pos: startPos });
      } else if (upper === 'NAND') {
        rawTokens.push({ type: 'OP_NAND', value: 'NAND', pos: startPos });
      } else if (upper === 'NOR') {
        rawTokens.push({ type: 'OP_NOR', value: 'NOR', pos: startPos });
      } else if (upper === 'TRUE' || upper === 'HIGH') {
        rawTokens.push({ type: 'CONST', value: '1', pos: startPos });
      } else if (upper === 'FALSE' || upper === 'LOW') {
        rawTokens.push({ type: 'CONST', value: '0', pos: startPos });
      } else if (KNOWN_MULTI_VARS.has(upper) || isIndexedVar || word.length === 1) {
        rawTokens.push({ type: 'VAR', value: word, pos: startPos });
      } else {
        // Multi-character variable sequence without explicit operator, e.g. "YZ", "XZ", "ABC", "XY"
        // Split into individual single-letter variables so juxtaposition creates implicit AND
        for (let charIdx = 0; charIdx < word.length; charIdx++) {
          rawTokens.push({
            type: 'VAR',
            value: word[charIdx],
            pos: startPos + charIdx,
          });
        }
      }
      continue;
    }

    throw new ParseError(`Unrecognized character '${ch}' at index ${i + 1}`, i);
  }

  // Insert Implicit AND tokens where juxtaposition occurs
  // Patterns:
  // 1. VAR / CONST / RPAREN / OP_NOT_POSTFIX  followed by  VAR / CONST / LPAREN / OP_NOT_PREFIX
  // Examples:
  // - "AB" -> A AND B
  // - "A(B+C)" -> A AND (B+C)
  // - "(A+B)(C+D)" -> (A+B) AND (C+D)
  // - "A'B" -> A' AND B
  // - "A !B" -> A AND NOT B
  const tokensWithImplicitAnd: Token[] = [];
  for (let j = 0; j < rawTokens.length; j++) {
    const cur = rawTokens[j];
    const next = rawTokens[j + 1];
    tokensWithImplicitAnd.push(cur);

    if (next) {
      const isCurOperandEnd =
        cur.type === 'VAR' ||
        cur.type === 'CONST' ||
        cur.type === 'RPAREN' ||
        cur.type === 'OP_NOT_POSTFIX';

      const isNextOperandStart =
        next.type === 'VAR' ||
        next.type === 'CONST' ||
        next.type === 'LPAREN' ||
        next.type === 'OP_NOT_PREFIX';

      if (isCurOperandEnd && isNextOperandStart) {
        tokensWithImplicitAnd.push({
          type: 'OP_AND',
          value: 'AND',
          pos: cur.pos + (cur.value ? cur.value.length : 1),
        });
      }
    }
  }

  return tokensWithImplicitAnd;
}

/**
 * Parses a Boolean expression string into an ASTNode.
 * Strips equation assignment prefix if present (e.g. "Y = AB + C" -> "AB + C").
 */
export function parseExpression(expr: string): ASTNode {
  let cleaned = expr.trim();
  if (!cleaned) {
    throw new ParseError('Please enter a Boolean expression (e.g. A(B + C\') + AB\').');
  }

  // Strip assignment prefix like "Y = ", "F(A,B,C) = ", "Output = "
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts.slice(1).join('=').trim();
    if (!cleaned) {
      throw new ParseError('Expression after "=" is empty. Please provide a formula.');
    }
  }

  const tokens = tokenize(cleaned);
  if (tokens.length === 0) {
    throw new ParseError('No valid Boolean terms found in input.');
  }

  let index = 0;

  const peek = (): Token | undefined => tokens[index];
  const consume = (expectedType?: Token['type']): Token => {
    const token = tokens[index++];
    if (!token) {
      throw new ParseError('Unexpected end of expression.');
    }
    if (expectedType && token.type !== expectedType) {
      throw new ParseError(
        `Expected ${expectedType} but found '${token.value}' near position ${token.pos + 1}`,
        token.pos
      );
    }
    return token;
  };

  /**
   * Primary: Variable, Constant, or Parenthesized Sub-expression
   */
  function parsePrimary(): ASTNode {
    const token = peek();
    if (!token) {
      throw new ParseError('Expected a variable or sub-expression, but reached end of line.');
    }

    if (token.type === 'LPAREN') {
      consume('LPAREN');
      const node = parseOr();
      const closing = peek();
      if (!closing || closing.type !== 'RPAREN') {
        throw new ParseError(
          'Missing matching closing parenthesis ")". Check that all opened "(" brackets are closed.',
          token.pos
        );
      }
      consume('RPAREN');
      return node;
    }

    if (token.type === 'CONST') {
      consume();
      return { type: 'CONST', value: parseInt(token.value, 10) };
    }

    if (token.type === 'VAR') {
      consume();
      return { type: 'VAR', value: token.value };
    }

    if (token.type === 'RPAREN') {
      throw new ParseError(`Unexpected closing parenthesis ")" without matching "(" at position ${token.pos + 1}`, token.pos);
    }

    throw new ParseError(
      `Unexpected operator '${token.value}' near position ${token.pos + 1}. A variable or term was expected.`,
      token.pos
    );
  }

  /**
   * Postfix NOT: A', (A + B)'', etc.
   */
  function parsePostfixNot(): ASTNode {
    let node = parsePrimary();
    while (peek() && peek()!.type === 'OP_NOT_POSTFIX') {
      consume('OP_NOT_POSTFIX');
      node = { type: 'NOT', children: [node] };
    }
    return node;
  }

  /**
   * Prefix NOT: !A, NOT (A + B), ~A
   */
  function parseNot(): ASTNode {
    if (peek() && peek()!.type === 'OP_NOT_PREFIX') {
      consume('OP_NOT_PREFIX');
      const child = parseNot();
      return { type: 'NOT', children: [child] };
    }
    return parsePostfixNot();
  }

  /**
   * AND, NAND
   */
  function parseAnd(): ASTNode {
    let left = parseNot();
    while (peek() && (peek()!.type === 'OP_AND' || peek()!.type === 'OP_NAND')) {
      const opToken = consume();
      const right = parseNot();
      if (opToken.type === 'OP_NAND') {
        left = { type: 'NAND', children: [left, right] };
      } else {
        // Flatten multiple associative ANDs: A AND B AND C
        if (left.type === 'AND' && left.children) {
          left.children.push(right);
        } else {
          left = { type: 'AND', children: [left, right] };
        }
      }
    }
    return left;
  }

  /**
   * XOR, XNOR
   */
  function parseXor(): ASTNode {
    let left = parseAnd();
    while (peek() && (peek()!.type === 'OP_XOR' || peek()!.type === 'OP_XNOR')) {
      const opToken = consume();
      const right = parseAnd();
      const nodeType = opToken.type === 'OP_XNOR' ? 'XNOR' : 'XOR';
      left = { type: nodeType, children: [left, right] };
    }
    return left;
  }

  /**
   * OR, NOR
   */
  function parseOr(): ASTNode {
    let left = parseXor();
    while (peek() && (peek()!.type === 'OP_OR' || peek()!.type === 'OP_NOR')) {
      const opToken = consume();
      const right = parseXor();
      if (opToken.type === 'OP_NOR') {
        left = { type: 'NOR', children: [left, right] };
      } else {
        // Flatten multiple associative ORs: A + B + C
        if (left.type === 'OR' && left.children) {
          left.children.push(right);
        } else {
          left = { type: 'OR', children: [left, right] };
        }
      }
    }
    return left;
  }

  const root = parseOr();

  if (index < tokens.length) {
    const extra = tokens[index];
    throw new ParseError(
      `Unexpected extra token '${extra.value}' at position ${extra.pos + 1}.`,
      extra.pos
    );
  }

  return root;
}
