/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ASTNodeType =
  | 'VAR'
  | 'CONST'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'XNOR'
  | 'NAND'
  | 'NOR';

export interface ASTNode {
  type: ASTNodeType;
  value?: string | number; // For VAR: variable name ('A', 'B', 'X1'), CONST: 0 or 1
  children?: ASTNode[];
}

export type BooleanFormatStyle = 'standard' | 'formal' | 'words';

/**
 * Checks if two AST nodes are structurally identical
 */
export function areASTNodesEqual(a: ASTNode, b: ASTNode): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'VAR' || a.type === 'CONST') {
    return a.value === b.value;
  }
  if (a.type === 'NOT') {
    return areASTNodesEqual(a.children![0], b.children![0]);
  }
  const aChildren = a.children || [];
  const bChildren = b.children || [];
  if (aChildren.length !== bChildren.length) return false;
  return aChildren.every((child, idx) => areASTNodesEqual(child, bChildren[idx]));
}

/**
 * Deep clones an ASTNode
 */
export function cloneAST(node: ASTNode): ASTNode {
  if (node.type === 'VAR' || node.type === 'CONST') {
    return { type: node.type, value: node.value };
  }
  return {
    type: node.type,
    value: node.value,
    children: (node.children || []).map(cloneAST),
  };
}

/**
 * Operator Precedence Table (higher number = tighter binding)
 * NOT: 4
 * AND / NAND: 3
 * XOR / XNOR: 2
 * OR / NOR: 1
 */
export function getOperatorPrecedence(type: ASTNodeType): number {
  switch (type) {
    case 'VAR':
    case 'CONST':
      return 5;
    case 'NOT':
      return 4;
    case 'AND':
    case 'NAND':
      return 3;
    case 'XOR':
    case 'XNOR':
      return 2;
    case 'OR':
    case 'NOR':
      return 1;
    default:
      return 0;
  }
}

/**
 * Formats an ASTNode into a clean, human-readable Boolean expression string.
 */
export function formatAST(
  node: ASTNode,
  style: BooleanFormatStyle = 'standard',
  parentPrec: number = 0
): string {
  if (node.type === 'CONST') {
    return String(node.value);
  }

  if (node.type === 'VAR') {
    return String(node.value);
  }

  if (node.type === 'NOT') {
    const child = node.children![0];
    // If child is a single variable, we can render A' in standard/formal
    if (child.type === 'VAR' || child.type === 'CONST') {
      if (style === 'words') {
        return `NOT ${formatAST(child, style, 4)}`;
      }
      return `${formatAST(child, style, 4)}'`;
    }
    // If child is already NOT, e.g. (A')'
    if (child.type === 'NOT') {
      const inner = formatAST(child, style, 4);
      return style === 'words' ? `NOT (${inner})` : `(${inner})'`;
    }
    // Complex compound child: (A + B)' or NOT (A OR B)
    const formattedChild = formatAST(child, style, 0);
    if (style === 'words') {
      return `NOT (${formattedChild})`;
    }
    return `(${formattedChild})'`;
  }

  const currentPrec = getOperatorPrecedence(node.type);
  const children = node.children || [];

  if (children.length === 0) {
    return '';
  }

  let formattedChildren: string[] = [];

  if (node.type === 'AND') {
    formattedChildren = children.map((c) => {
      // Need parens if child precedence is lower than AND (e.g. OR, XOR)
      const needParens = getOperatorPrecedence(c.type) < currentPrec;
      const s = formatAST(c, style, currentPrec);
      return needParens ? `(${s})` : s;
    });

    let res = '';
    if (style === 'words') {
      res = formattedChildren.join(' AND ');
    } else if (style === 'formal') {
      res = formattedChildren.join(' · ');
    } else {
      // Standard: Juxtaposition where clean, e.g., AB or A(B+C)
      let out = '';
      for (let i = 0; i < formattedChildren.length; i++) {
        const item = formattedChildren[i];
        if (i > 0) {
          const prev = formattedChildren[i - 1];
          const prevIsConst = prev === '0' || prev === '1';
          const currIsConst = item === '0' || item === '1';
          const prevIsMulti = prev.length > 2 && !prev.endsWith(')');
          const currIsMulti = item.length > 2 && !item.startsWith('(');
          if (prevIsConst || currIsConst || prevIsMulti || currIsMulti || (/\d$/.test(prev) && /^\d/.test(item))) {
            out += ' · ';
          }
        }
        out += item;
      }
      res = out;
    }

    if (currentPrec < parentPrec) {
      return res.startsWith('(') && res.endsWith(')') ? res : `(${res})`;
    }
    return res;
  }

  if (node.type === 'OR') {
    formattedChildren = children.map((c) => {
      const needParens = getOperatorPrecedence(c.type) < currentPrec;
      const s = formatAST(c, style, currentPrec);
      return needParens ? (s.startsWith('(') && s.endsWith(')') ? s : `(${s})`) : s;
    });

    const sep = style === 'words' ? ' OR ' : ' + ';
    const res = formattedChildren.join(sep);
    if (currentPrec < parentPrec) {
      return res.startsWith('(') && res.endsWith(')') ? res : `(${res})`;
    }
    return res;
  }

  if (node.type === 'XOR') {
    formattedChildren = children.map((c) => {
      const needParens = getOperatorPrecedence(c.type) < currentPrec;
      const s = formatAST(c, style, currentPrec);
      return needParens ? `(${s})` : s;
    });
    const sep = style === 'words' ? ' XOR ' : ' ⊕ ';
    const res = formattedChildren.join(sep);
    if (currentPrec < parentPrec) return `(${res})`;
    return res;
  }

  if (node.type === 'XNOR') {
    formattedChildren = children.map((c) => {
      const needParens = getOperatorPrecedence(c.type) < currentPrec;
      const s = formatAST(c, style, currentPrec);
      return needParens ? `(${s})` : s;
    });
    const sep = style === 'words' ? ' XNOR ' : ' ⊙ ';
    const res = formattedChildren.join(sep);
    if (currentPrec < parentPrec) return `(${res})`;
    return res;
  }

  if (node.type === 'NAND') {
    const andNode: ASTNode = { type: 'AND', children: node.children };
    const formatted = formatAST(andNode, style, 0);
    return style === 'words' ? `NOT (${formatted})` : `(${formatted})'`;
  }

  if (node.type === 'NOR') {
    const orNode: ASTNode = { type: 'OR', children: node.children };
    const formatted = formatAST(orNode, style, 0);
    return style === 'words' ? `NOT (${formatted})` : `(${formatted})'`;
  }

  return '';
}

/**
 * Extracts all unique variable names from an AST node in alphabetical order
 */
export function extractVariables(ast: ASTNode): string[] {
  const vars = new Set<string>();
  function recurse(n: ASTNode) {
    if (n.type === 'VAR' && n.value !== undefined) {
      vars.add(String(n.value));
    }
    if (n.children) {
      n.children.forEach(recurse);
    }
  }
  recurse(ast);
  return Array.from(vars).sort((a, b) => a.localeCompare(b));
}
