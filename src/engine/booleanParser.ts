/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitComponent, GateType, Wire } from '../types/circuit';
import {
  ASTNode as NewASTNode,
  ASTNodeType as NewASTNodeType,
  parseExpression,
  formatAST as newFormatAST,
  extractVariables as newExtractVariables,
  generateTruthTable as newGenerateTruthTable,
  evaluateAST as newEvaluateAST,
  simplifyBoolean as newSimplifyBoolean,
  synthesizeCircuitFromAST as newSynthesizeCircuitFromAST,
  verifyEquivalence as newVerifyEquivalence,
  TruthTableResult,
  SimplificationResult,
} from './boolean';

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
  value?: string | number;
  children?: ASTNode[];
}

/**
 * Converts internal engine AST to legacy AST format if needed
 */
function convertToLegacyAST(node: NewASTNode): ASTNode {
  let legacyType: ASTNodeType = 'VARIABLE';
  if (node.type === 'VAR') legacyType = 'VARIABLE';
  else if (node.type === 'CONST') legacyType = 'CONSTANT';
  else legacyType = node.type as ASTNodeType;

  return {
    type: legacyType,
    value: node.value,
    children: node.children ? node.children.map(convertToLegacyAST) : undefined,
  };
}

/**
 * Converts legacy AST to new engine AST
 */
function convertFromLegacyAST(node: ASTNode): NewASTNode {
  let newType: any = 'VAR';
  if (node.type === 'VARIABLE') newType = 'VAR';
  else if (node.type === 'CONSTANT') newType = 'CONST';
  else newType = node.type;

  return {
    type: newType,
    value: node.value,
    children: node.children ? node.children.map(convertFromLegacyAST) : undefined,
  };
}

export function parseBooleanExpression(expr: string): ASTNode {
  const newAst = parseExpression(expr);
  return convertToLegacyAST(newAst);
}

export function formatAST(ast: ASTNode): string {
  return newFormatAST(convertFromLegacyAST(ast));
}

export function extractVariablesFromAST(ast: ASTNode): string[] {
  return newExtractVariables(convertFromLegacyAST(ast));
}

export function evaluateAST(ast: ASTNode, inputs: Record<string, 0 | 1>): 0 | 1 {
  return newEvaluateAST(convertFromLegacyAST(ast), inputs);
}

export interface LiveTruthTableRow {
  index: number;
  inputs: Record<string, 0 | 1>;
  output: 0 | 1;
  minterm: string;
}

export interface LiveTruthTableResult {
  variables: string[];
  rows: LiveTruthTableRow[];
  minterms: number[];
  maxterms: number[];
  sopExpression: string;
  posExpression: string;
}

export function generateTruthTableFromAST(ast: ASTNode): LiveTruthTableResult {
  const newAst = convertFromLegacyAST(ast);
  const res = newGenerateTruthTable(newAst);

  return {
    variables: res.variables,
    rows: res.rows.map((r) => ({
      index: r.minterm,
      inputs: r.values,
      output: r.output,
      minterm: `m${r.minterm}`,
    })),
    minterms: res.minterms,
    maxterms: res.maxterms,
    sopExpression: res.canonicalSOP,
    posExpression: res.canonicalPOS,
  };
}

export function synthesizeCircuitFromAST(
  ast: ASTNode,
  outputLabel: string = 'Y',
  baseX: number = 100,
  baseY: number = 100
): { components: CircuitComponent[]; wires: Wire[] } {
  const newAst = convertFromLegacyAST(ast);
  const result = newSynthesizeCircuitFromAST(newAst, outputLabel, baseX, baseY);
  return { components: result.components, wires: result.wires };
}

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
  isVerified?: boolean;
} {
  const simRes = newSimplifyBoolean(rawExpr);
  const legacyTT = generateTruthTableFromAST(convertToLegacyAST(simRes.originalAST));

  return {
    original: simRes.originalExpression,
    simplified: simRes.simplifiedExpression,
    steps: simRes.steps.map((s) => ({
      rule: s.lawName,
      expression: s.expression,
      explanation: s.explanation,
    })),
    truthTable: legacyTT,
    isVerified: simRes.isVerified,
  };
}

// Re-export the modern engine for direct access
export * from './boolean';
