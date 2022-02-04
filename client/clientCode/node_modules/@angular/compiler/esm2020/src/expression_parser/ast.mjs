/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export class ParserError {
    constructor(message, input, errLocation, ctxLocation) {
        this.input = input;
        this.errLocation = errLocation;
        this.ctxLocation = ctxLocation;
        this.message = `Parser Error: ${message} ${errLocation} [${input}] in ${ctxLocation}`;
    }
}
export class ParseSpan {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    toAbsolute(absoluteOffset) {
        return new AbsoluteSourceSpan(absoluteOffset + this.start, absoluteOffset + this.end);
    }
}
export class AST {
    constructor(span, 
    /**
     * Absolute location of the expression AST in a source code file.
     */
    sourceSpan) {
        this.span = span;
        this.sourceSpan = sourceSpan;
    }
    toString() {
        return 'AST';
    }
}
export class ASTWithName extends AST {
    constructor(span, sourceSpan, nameSpan) {
        super(span, sourceSpan);
        this.nameSpan = nameSpan;
    }
}
/**
 * Represents a quoted expression of the form:
 *
 * quote = prefix `:` uninterpretedExpression
 * prefix = identifier
 * uninterpretedExpression = arbitrary string
 *
 * A quoted expression is meant to be pre-processed by an AST transformer that
 * converts it into another AST that no longer contains quoted expressions.
 * It is meant to allow third-party developers to extend Angular template
 * expression language. The `uninterpretedExpression` part of the quote is
 * therefore not interpreted by the Angular's own expression parser.
 */
export class Quote extends AST {
    constructor(span, sourceSpan, prefix, uninterpretedExpression, location) {
        super(span, sourceSpan);
        this.prefix = prefix;
        this.uninterpretedExpression = uninterpretedExpression;
        this.location = location;
    }
    visit(visitor, context = null) {
        return visitor.visitQuote(this, context);
    }
    toString() {
        return 'Quote';
    }
}
export class EmptyExpr extends AST {
    visit(visitor, context = null) {
        // do nothing
    }
}
export class ImplicitReceiver extends AST {
    visit(visitor, context = null) {
        return visitor.visitImplicitReceiver(this, context);
    }
}
/**
 * Receiver when something is accessed through `this` (e.g. `this.foo`). Note that this class
 * inherits from `ImplicitReceiver`, because accessing something through `this` is treated the
 * same as accessing it implicitly inside of an Angular template (e.g. `[attr.title]="this.title"`
 * is the same as `[attr.title]="title"`.). Inheriting allows for the `this` accesses to be treated
 * the same as implicit ones, except for a couple of exceptions like `$event` and `$any`.
 * TODO: we should find a way for this class not to extend from `ImplicitReceiver` in the future.
 */
export class ThisReceiver extends ImplicitReceiver {
    visit(visitor, context = null) {
        return visitor.visitThisReceiver?.(this, context);
    }
}
/**
 * Multiple expressions separated by a semicolon.
 */
export class Chain extends AST {
    constructor(span, sourceSpan, expressions) {
        super(span, sourceSpan);
        this.expressions = expressions;
    }
    visit(visitor, context = null) {
        return visitor.visitChain(this, context);
    }
}
export class Conditional extends AST {
    constructor(span, sourceSpan, condition, trueExp, falseExp) {
        super(span, sourceSpan);
        this.condition = condition;
        this.trueExp = trueExp;
        this.falseExp = falseExp;
    }
    visit(visitor, context = null) {
        return visitor.visitConditional(this, context);
    }
}
export class PropertyRead extends ASTWithName {
    constructor(span, sourceSpan, nameSpan, receiver, name) {
        super(span, sourceSpan, nameSpan);
        this.receiver = receiver;
        this.name = name;
    }
    visit(visitor, context = null) {
        return visitor.visitPropertyRead(this, context);
    }
}
export class PropertyWrite extends ASTWithName {
    constructor(span, sourceSpan, nameSpan, receiver, name, value) {
        super(span, sourceSpan, nameSpan);
        this.receiver = receiver;
        this.name = name;
        this.value = value;
    }
    visit(visitor, context = null) {
        return visitor.visitPropertyWrite(this, context);
    }
}
export class SafePropertyRead extends ASTWithName {
    constructor(span, sourceSpan, nameSpan, receiver, name) {
        super(span, sourceSpan, nameSpan);
        this.receiver = receiver;
        this.name = name;
    }
    visit(visitor, context = null) {
        return visitor.visitSafePropertyRead(this, context);
    }
}
export class KeyedRead extends AST {
    constructor(span, sourceSpan, receiver, key) {
        super(span, sourceSpan);
        this.receiver = receiver;
        this.key = key;
    }
    visit(visitor, context = null) {
        return visitor.visitKeyedRead(this, context);
    }
}
export class SafeKeyedRead extends AST {
    constructor(span, sourceSpan, receiver, key) {
        super(span, sourceSpan);
        this.receiver = receiver;
        this.key = key;
    }
    visit(visitor, context = null) {
        return visitor.visitSafeKeyedRead(this, context);
    }
}
export class KeyedWrite extends AST {
    constructor(span, sourceSpan, receiver, key, value) {
        super(span, sourceSpan);
        this.receiver = receiver;
        this.key = key;
        this.value = value;
    }
    visit(visitor, context = null) {
        return visitor.visitKeyedWrite(this, context);
    }
}
export class BindingPipe extends ASTWithName {
    constructor(span, sourceSpan, exp, name, args, nameSpan) {
        super(span, sourceSpan, nameSpan);
        this.exp = exp;
        this.name = name;
        this.args = args;
    }
    visit(visitor, context = null) {
        return visitor.visitPipe(this, context);
    }
}
export class LiteralPrimitive extends AST {
    constructor(span, sourceSpan, value) {
        super(span, sourceSpan);
        this.value = value;
    }
    visit(visitor, context = null) {
        return visitor.visitLiteralPrimitive(this, context);
    }
}
export class LiteralArray extends AST {
    constructor(span, sourceSpan, expressions) {
        super(span, sourceSpan);
        this.expressions = expressions;
    }
    visit(visitor, context = null) {
        return visitor.visitLiteralArray(this, context);
    }
}
export class LiteralMap extends AST {
    constructor(span, sourceSpan, keys, values) {
        super(span, sourceSpan);
        this.keys = keys;
        this.values = values;
    }
    visit(visitor, context = null) {
        return visitor.visitLiteralMap(this, context);
    }
}
export class Interpolation extends AST {
    constructor(span, sourceSpan, strings, expressions) {
        super(span, sourceSpan);
        this.strings = strings;
        this.expressions = expressions;
    }
    visit(visitor, context = null) {
        return visitor.visitInterpolation(this, context);
    }
}
export class Binary extends AST {
    constructor(span, sourceSpan, operation, left, right) {
        super(span, sourceSpan);
        this.operation = operation;
        this.left = left;
        this.right = right;
    }
    visit(visitor, context = null) {
        return visitor.visitBinary(this, context);
    }
}
/**
 * For backwards compatibility reasons, `Unary` inherits from `Binary` and mimics the binary AST
 * node that was originally used. This inheritance relation can be deleted in some future major,
 * after consumers have been given a chance to fully support Unary.
 */
export class Unary extends Binary {
    /**
     * During the deprecation period this constructor is private, to avoid consumers from creating
     * a `Unary` with the fallback properties for `Binary`.
     */
    constructor(span, sourceSpan, operator, expr, binaryOp, binaryLeft, binaryRight) {
        super(span, sourceSpan, binaryOp, binaryLeft, binaryRight);
        this.operator = operator;
        this.expr = expr;
        // Redeclare the properties that are inherited from `Binary` as `never`, as consumers should not
        // depend on these fields when operating on `Unary`.
        this.left = null;
        this.right = null;
        this.operation = null;
    }
    /**
     * Creates a unary minus expression "-x", represented as `Binary` using "0 - x".
     */
    static createMinus(span, sourceSpan, expr) {
        return new Unary(span, sourceSpan, '-', expr, '-', new LiteralPrimitive(span, sourceSpan, 0), expr);
    }
    /**
     * Creates a unary plus expression "+x", represented as `Binary` using "x - 0".
     */
    static createPlus(span, sourceSpan, expr) {
        return new Unary(span, sourceSpan, '+', expr, '-', expr, new LiteralPrimitive(span, sourceSpan, 0));
    }
    visit(visitor, context = null) {
        if (visitor.visitUnary !== undefined) {
            return visitor.visitUnary(this, context);
        }
        return visitor.visitBinary(this, context);
    }
}
export class PrefixNot extends AST {
    constructor(span, sourceSpan, expression) {
        super(span, sourceSpan);
        this.expression = expression;
    }
    visit(visitor, context = null) {
        return visitor.visitPrefixNot(this, context);
    }
}
export class NonNullAssert extends AST {
    constructor(span, sourceSpan, expression) {
        super(span, sourceSpan);
        this.expression = expression;
    }
    visit(visitor, context = null) {
        return visitor.visitNonNullAssert(this, context);
    }
}
export class Call extends AST {
    constructor(span, sourceSpan, receiver, args, argumentSpan) {
        super(span, sourceSpan);
        this.receiver = receiver;
        this.args = args;
        this.argumentSpan = argumentSpan;
    }
    visit(visitor, context = null) {
        return visitor.visitCall(this, context);
    }
}
/**
 * Records the absolute position of a text span in a source file, where `start` and `end` are the
 * starting and ending byte offsets, respectively, of the text span in a source file.
 */
export class AbsoluteSourceSpan {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
export class ASTWithSource extends AST {
    constructor(ast, source, location, absoluteOffset, errors) {
        super(new ParseSpan(0, source === null ? 0 : source.length), new AbsoluteSourceSpan(absoluteOffset, source === null ? absoluteOffset : absoluteOffset + source.length));
        this.ast = ast;
        this.source = source;
        this.location = location;
        this.errors = errors;
    }
    visit(visitor, context = null) {
        if (visitor.visitASTWithSource) {
            return visitor.visitASTWithSource(this, context);
        }
        return this.ast.visit(visitor, context);
    }
    toString() {
        return `${this.source} in ${this.location}`;
    }
}
export class VariableBinding {
    /**
     * @param sourceSpan entire span of the binding.
     * @param key name of the LHS along with its span.
     * @param value optional value for the RHS along with its span.
     */
    constructor(sourceSpan, key, value) {
        this.sourceSpan = sourceSpan;
        this.key = key;
        this.value = value;
    }
}
export class ExpressionBinding {
    /**
     * @param sourceSpan entire span of the binding.
     * @param key binding name, like ngForOf, ngForTrackBy, ngIf, along with its
     * span. Note that the length of the span may not be the same as
     * `key.source.length`. For example,
     * 1. key.source = ngFor, key.span is for "ngFor"
     * 2. key.source = ngForOf, key.span is for "of"
     * 3. key.source = ngForTrackBy, key.span is for "trackBy"
     * @param value optional expression for the RHS.
     */
    constructor(sourceSpan, key, value) {
        this.sourceSpan = sourceSpan;
        this.key = key;
        this.value = value;
    }
}
export class RecursiveAstVisitor {
    visit(ast, context) {
        // The default implementation just visits every node.
        // Classes that extend RecursiveAstVisitor should override this function
        // to selectively visit the specified node.
        ast.visit(this, context);
    }
    visitUnary(ast, context) {
        this.visit(ast.expr, context);
    }
    visitBinary(ast, context) {
        this.visit(ast.left, context);
        this.visit(ast.right, context);
    }
    visitChain(ast, context) {
        this.visitAll(ast.expressions, context);
    }
    visitConditional(ast, context) {
        this.visit(ast.condition, context);
        this.visit(ast.trueExp, context);
        this.visit(ast.falseExp, context);
    }
    visitPipe(ast, context) {
        this.visit(ast.exp, context);
        this.visitAll(ast.args, context);
    }
    visitImplicitReceiver(ast, context) { }
    visitThisReceiver(ast, context) { }
    visitInterpolation(ast, context) {
        this.visitAll(ast.expressions, context);
    }
    visitKeyedRead(ast, context) {
        this.visit(ast.receiver, context);
        this.visit(ast.key, context);
    }
    visitKeyedWrite(ast, context) {
        this.visit(ast.receiver, context);
        this.visit(ast.key, context);
        this.visit(ast.value, context);
    }
    visitLiteralArray(ast, context) {
        this.visitAll(ast.expressions, context);
    }
    visitLiteralMap(ast, context) {
        this.visitAll(ast.values, context);
    }
    visitLiteralPrimitive(ast, context) { }
    visitPrefixNot(ast, context) {
        this.visit(ast.expression, context);
    }
    visitNonNullAssert(ast, context) {
        this.visit(ast.expression, context);
    }
    visitPropertyRead(ast, context) {
        this.visit(ast.receiver, context);
    }
    visitPropertyWrite(ast, context) {
        this.visit(ast.receiver, context);
        this.visit(ast.value, context);
    }
    visitSafePropertyRead(ast, context) {
        this.visit(ast.receiver, context);
    }
    visitSafeKeyedRead(ast, context) {
        this.visit(ast.receiver, context);
        this.visit(ast.key, context);
    }
    visitCall(ast, context) {
        this.visit(ast.receiver, context);
        this.visitAll(ast.args, context);
    }
    visitQuote(ast, context) { }
    // This is not part of the AstVisitor interface, just a helper method
    visitAll(asts, context) {
        for (const ast of asts) {
            this.visit(ast, context);
        }
    }
}
export class AstTransformer {
    visitImplicitReceiver(ast, context) {
        return ast;
    }
    visitThisReceiver(ast, context) {
        return ast;
    }
    visitInterpolation(ast, context) {
        return new Interpolation(ast.span, ast.sourceSpan, ast.strings, this.visitAll(ast.expressions));
    }
    visitLiteralPrimitive(ast, context) {
        return new LiteralPrimitive(ast.span, ast.sourceSpan, ast.value);
    }
    visitPropertyRead(ast, context) {
        return new PropertyRead(ast.span, ast.sourceSpan, ast.nameSpan, ast.receiver.visit(this), ast.name);
    }
    visitPropertyWrite(ast, context) {
        return new PropertyWrite(ast.span, ast.sourceSpan, ast.nameSpan, ast.receiver.visit(this), ast.name, ast.value.visit(this));
    }
    visitSafePropertyRead(ast, context) {
        return new SafePropertyRead(ast.span, ast.sourceSpan, ast.nameSpan, ast.receiver.visit(this), ast.name);
    }
    visitLiteralArray(ast, context) {
        return new LiteralArray(ast.span, ast.sourceSpan, this.visitAll(ast.expressions));
    }
    visitLiteralMap(ast, context) {
        return new LiteralMap(ast.span, ast.sourceSpan, ast.keys, this.visitAll(ast.values));
    }
    visitUnary(ast, context) {
        switch (ast.operator) {
            case '+':
                return Unary.createPlus(ast.span, ast.sourceSpan, ast.expr.visit(this));
            case '-':
                return Unary.createMinus(ast.span, ast.sourceSpan, ast.expr.visit(this));
            default:
                throw new Error(`Unknown unary operator ${ast.operator}`);
        }
    }
    visitBinary(ast, context) {
        return new Binary(ast.span, ast.sourceSpan, ast.operation, ast.left.visit(this), ast.right.visit(this));
    }
    visitPrefixNot(ast, context) {
        return new PrefixNot(ast.span, ast.sourceSpan, ast.expression.visit(this));
    }
    visitNonNullAssert(ast, context) {
        return new NonNullAssert(ast.span, ast.sourceSpan, ast.expression.visit(this));
    }
    visitConditional(ast, context) {
        return new Conditional(ast.span, ast.sourceSpan, ast.condition.visit(this), ast.trueExp.visit(this), ast.falseExp.visit(this));
    }
    visitPipe(ast, context) {
        return new BindingPipe(ast.span, ast.sourceSpan, ast.exp.visit(this), ast.name, this.visitAll(ast.args), ast.nameSpan);
    }
    visitKeyedRead(ast, context) {
        return new KeyedRead(ast.span, ast.sourceSpan, ast.receiver.visit(this), ast.key.visit(this));
    }
    visitKeyedWrite(ast, context) {
        return new KeyedWrite(ast.span, ast.sourceSpan, ast.receiver.visit(this), ast.key.visit(this), ast.value.visit(this));
    }
    visitCall(ast, context) {
        return new Call(ast.span, ast.sourceSpan, ast.receiver.visit(this), this.visitAll(ast.args), ast.argumentSpan);
    }
    visitAll(asts) {
        const res = [];
        for (let i = 0; i < asts.length; ++i) {
            res[i] = asts[i].visit(this);
        }
        return res;
    }
    visitChain(ast, context) {
        return new Chain(ast.span, ast.sourceSpan, this.visitAll(ast.expressions));
    }
    visitQuote(ast, context) {
        return new Quote(ast.span, ast.sourceSpan, ast.prefix, ast.uninterpretedExpression, ast.location);
    }
    visitSafeKeyedRead(ast, context) {
        return new SafeKeyedRead(ast.span, ast.sourceSpan, ast.receiver.visit(this), ast.key.visit(this));
    }
}
// A transformer that only creates new nodes if the transformer makes a change or
// a change is made a child node.
export class AstMemoryEfficientTransformer {
    visitImplicitReceiver(ast, context) {
        return ast;
    }
    visitThisReceiver(ast, context) {
        return ast;
    }
    visitInterpolation(ast, context) {
        const expressions = this.visitAll(ast.expressions);
        if (expressions !== ast.expressions)
            return new Interpolation(ast.span, ast.sourceSpan, ast.strings, expressions);
        return ast;
    }
    visitLiteralPrimitive(ast, context) {
        return ast;
    }
    visitPropertyRead(ast, context) {
        const receiver = ast.receiver.visit(this);
        if (receiver !== ast.receiver) {
            return new PropertyRead(ast.span, ast.sourceSpan, ast.nameSpan, receiver, ast.name);
        }
        return ast;
    }
    visitPropertyWrite(ast, context) {
        const receiver = ast.receiver.visit(this);
        const value = ast.value.visit(this);
        if (receiver !== ast.receiver || value !== ast.value) {
            return new PropertyWrite(ast.span, ast.sourceSpan, ast.nameSpan, receiver, ast.name, value);
        }
        return ast;
    }
    visitSafePropertyRead(ast, context) {
        const receiver = ast.receiver.visit(this);
        if (receiver !== ast.receiver) {
            return new SafePropertyRead(ast.span, ast.sourceSpan, ast.nameSpan, receiver, ast.name);
        }
        return ast;
    }
    visitLiteralArray(ast, context) {
        const expressions = this.visitAll(ast.expressions);
        if (expressions !== ast.expressions) {
            return new LiteralArray(ast.span, ast.sourceSpan, expressions);
        }
        return ast;
    }
    visitLiteralMap(ast, context) {
        const values = this.visitAll(ast.values);
        if (values !== ast.values) {
            return new LiteralMap(ast.span, ast.sourceSpan, ast.keys, values);
        }
        return ast;
    }
    visitUnary(ast, context) {
        const expr = ast.expr.visit(this);
        if (expr !== ast.expr) {
            switch (ast.operator) {
                case '+':
                    return Unary.createPlus(ast.span, ast.sourceSpan, expr);
                case '-':
                    return Unary.createMinus(ast.span, ast.sourceSpan, expr);
                default:
                    throw new Error(`Unknown unary operator ${ast.operator}`);
            }
        }
        return ast;
    }
    visitBinary(ast, context) {
        const left = ast.left.visit(this);
        const right = ast.right.visit(this);
        if (left !== ast.left || right !== ast.right) {
            return new Binary(ast.span, ast.sourceSpan, ast.operation, left, right);
        }
        return ast;
    }
    visitPrefixNot(ast, context) {
        const expression = ast.expression.visit(this);
        if (expression !== ast.expression) {
            return new PrefixNot(ast.span, ast.sourceSpan, expression);
        }
        return ast;
    }
    visitNonNullAssert(ast, context) {
        const expression = ast.expression.visit(this);
        if (expression !== ast.expression) {
            return new NonNullAssert(ast.span, ast.sourceSpan, expression);
        }
        return ast;
    }
    visitConditional(ast, context) {
        const condition = ast.condition.visit(this);
        const trueExp = ast.trueExp.visit(this);
        const falseExp = ast.falseExp.visit(this);
        if (condition !== ast.condition || trueExp !== ast.trueExp || falseExp !== ast.falseExp) {
            return new Conditional(ast.span, ast.sourceSpan, condition, trueExp, falseExp);
        }
        return ast;
    }
    visitPipe(ast, context) {
        const exp = ast.exp.visit(this);
        const args = this.visitAll(ast.args);
        if (exp !== ast.exp || args !== ast.args) {
            return new BindingPipe(ast.span, ast.sourceSpan, exp, ast.name, args, ast.nameSpan);
        }
        return ast;
    }
    visitKeyedRead(ast, context) {
        const obj = ast.receiver.visit(this);
        const key = ast.key.visit(this);
        if (obj !== ast.receiver || key !== ast.key) {
            return new KeyedRead(ast.span, ast.sourceSpan, obj, key);
        }
        return ast;
    }
    visitKeyedWrite(ast, context) {
        const obj = ast.receiver.visit(this);
        const key = ast.key.visit(this);
        const value = ast.value.visit(this);
        if (obj !== ast.receiver || key !== ast.key || value !== ast.value) {
            return new KeyedWrite(ast.span, ast.sourceSpan, obj, key, value);
        }
        return ast;
    }
    visitAll(asts) {
        const res = [];
        let modified = false;
        for (let i = 0; i < asts.length; ++i) {
            const original = asts[i];
            const value = original.visit(this);
            res[i] = value;
            modified = modified || value !== original;
        }
        return modified ? res : asts;
    }
    visitChain(ast, context) {
        const expressions = this.visitAll(ast.expressions);
        if (expressions !== ast.expressions) {
            return new Chain(ast.span, ast.sourceSpan, expressions);
        }
        return ast;
    }
    visitCall(ast, context) {
        const receiver = ast.receiver.visit(this);
        const args = this.visitAll(ast.args);
        if (receiver !== ast.receiver || args !== ast.args) {
            return new Call(ast.span, ast.sourceSpan, receiver, args, ast.argumentSpan);
        }
        return ast;
    }
    visitQuote(ast, context) {
        return ast;
    }
    visitSafeKeyedRead(ast, context) {
        const obj = ast.receiver.visit(this);
        const key = ast.key.visit(this);
        if (obj !== ast.receiver || key !== ast.key) {
            return new SafeKeyedRead(ast.span, ast.sourceSpan, obj, key);
        }
        return ast;
    }
}
// Bindings
export class ParsedProperty {
    constructor(name, expression, type, sourceSpan, keySpan, valueSpan) {
        this.name = name;
        this.expression = expression;
        this.type = type;
        this.sourceSpan = sourceSpan;
        this.keySpan = keySpan;
        this.valueSpan = valueSpan;
        this.isLiteral = this.type === ParsedPropertyType.LITERAL_ATTR;
        this.isAnimation = this.type === ParsedPropertyType.ANIMATION;
    }
}
export var ParsedPropertyType;
(function (ParsedPropertyType) {
    ParsedPropertyType[ParsedPropertyType["DEFAULT"] = 0] = "DEFAULT";
    ParsedPropertyType[ParsedPropertyType["LITERAL_ATTR"] = 1] = "LITERAL_ATTR";
    ParsedPropertyType[ParsedPropertyType["ANIMATION"] = 2] = "ANIMATION";
})(ParsedPropertyType || (ParsedPropertyType = {}));
export class ParsedEvent {
    // Regular events have a target
    // Animation events have a phase
    constructor(name, targetOrPhase, type, handler, sourceSpan, handlerSpan, keySpan) {
        this.name = name;
        this.targetOrPhase = targetOrPhase;
        this.type = type;
        this.handler = handler;
        this.sourceSpan = sourceSpan;
        this.handlerSpan = handlerSpan;
        this.keySpan = keySpan;
    }
}
/**
 * ParsedVariable represents a variable declaration in a microsyntax expression.
 */
export class ParsedVariable {
    constructor(name, value, sourceSpan, keySpan, valueSpan) {
        this.name = name;
        this.value = value;
        this.sourceSpan = sourceSpan;
        this.keySpan = keySpan;
        this.valueSpan = valueSpan;
    }
}
export class BoundElementProperty {
    constructor(name, type, securityContext, value, unit, sourceSpan, keySpan, valueSpan) {
        this.name = name;
        this.type = type;
        this.securityContext = securityContext;
        this.value = value;
        this.unit = unit;
        this.sourceSpan = sourceSpan;
        this.keySpan = keySpan;
        this.valueSpan = valueSpan;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2V4cHJlc3Npb25fcGFyc2VyL2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFLSCxNQUFNLE9BQU8sV0FBVztJQUV0QixZQUNJLE9BQWUsRUFBUyxLQUFhLEVBQVMsV0FBbUIsRUFBUyxXQUFpQjtRQUFuRSxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQVMsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBUyxnQkFBVyxHQUFYLFdBQVcsQ0FBTTtRQUM3RixJQUFJLENBQUMsT0FBTyxHQUFHLGlCQUFpQixPQUFPLElBQUksV0FBVyxLQUFLLEtBQUssUUFBUSxXQUFXLEVBQUUsQ0FBQztJQUN4RixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sU0FBUztJQUNwQixZQUFtQixLQUFhLEVBQVMsR0FBVztRQUFqQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQVMsUUFBRyxHQUFILEdBQUcsQ0FBUTtJQUFHLENBQUM7SUFDeEQsVUFBVSxDQUFDLGNBQXNCO1FBQy9CLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBZ0IsR0FBRztJQUN2QixZQUNXLElBQWU7SUFDdEI7O09BRUc7SUFDSSxVQUE4QjtRQUo5QixTQUFJLEdBQUosSUFBSSxDQUFXO1FBSWYsZUFBVSxHQUFWLFVBQVUsQ0FBb0I7SUFBRyxDQUFDO0lBSTdDLFFBQVE7UUFDTixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBZ0IsV0FBWSxTQUFRLEdBQUc7SUFDM0MsWUFDSSxJQUFlLEVBQUUsVUFBOEIsRUFBUyxRQUE0QjtRQUN0RixLQUFLLENBQUMsSUFB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QUFPLENBQTJCO1FBQVMsY0FBUyxHQUFULFNBQVMsQ0FBMkI7SUFBRyxDQUFDO0NBQ2pHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2VjdXJpdHlDb250ZXh0fSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7UGFyc2VTb3VyY2VTcGFufSBmcm9tICcuLi9wYXJzZV91dGlsJztcblxuZXhwb3J0IGNsYXNzIFBhcnNlckVycm9yIHtcbiAgcHVibGljIG1lc3NhZ2U6IHN0cmluZztcbiAgY29uc3RydWN0b3IoXG4gICAgICBtZXNzYWdlOiBzdHJpbmcsIHB1YmxpYyBpbnB1dDogc3RyaW5nLCBwdWJsaWMgZXJyTG9jYXRpb246IHN0cmluZywgcHVibGljIGN0eExvY2F0aW9uPzogYW55KSB7XG4gICAgdGhpcy5tZXNzYWdlID0gYFBhcnNlciBFcnJvcjogJHttZXNzYWdlfSAke2VyckxvY2F0aW9ufSBbJHtpbnB1dH1dIGluICR7Y3R4TG9jYXRpb259YDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VTcGFuIHtcbiAgY29uc3RydWN0b3IocHVibGljIHN0YXJ0OiBudW1iZXIsIHB1YmxpYyBlbmQ6IG51bWJlcikge31cbiAgdG9BYnNvbHV0ZShhYnNvbHV0ZU9mZnNldDogbnVtYmVyKTogQWJzb2x1dGVTb3VyY2VTcGFuIHtcbiAgICByZXR1cm4gbmV3IEFic29sdXRlU291cmNlU3BhbihhYnNvbHV0ZU9mZnNldCArIHRoaXMuc3RhcnQsIGFic29sdXRlT2Zmc2V0ICsgdGhpcy5lbmQpO1xuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBzcGFuOiBQYXJzZVNwYW4sXG4gICAgICAvKipcbiAgICAgICAqIEFic29sdXRlIGxvY2F0aW9uIG9mIHRoZSBleHByZXNzaW9uIEFTVCBpbiBhIHNvdXJjZSBjb2RlIGZpbGUuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4pIHt9XG5cbiAgYWJzdHJhY3QgdmlzaXQodmlzaXRvcjogQXN0VmlzaXRvciwgY29udGV4dD86IGFueSk6IGFueTtcblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiAnQVNUJztcbiAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQVNUV2l0aE5hbWUgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgbmFtZVNwYW46IEFic29sdXRlU291cmNlU3Bhbikge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHF1b3RlZCBleHByZXNzaW9uIG9mIHRoZSBmb3JtOlxuICpcbiAqIHF1b3RlID0gcHJlZml4IGA6YCB1bmludGVycHJldGVkRXhwcmVzc2lvblxuICogcHJlZml4ID0gaWRlbnRpZmllclxuICogdW5pbnRlcnByZXRlZEV4cHJlc3Npb24gPSBhcmJpdHJhcnkgc3RyaW5nXG4gKlxuICogQSBxdW90ZWQgZXhwcmVzc2lvbiBpcyBtZWFudCB0byBiZSBwcmUtcHJvY2Vzc2VkIGJ5IGFuIEFTVCB0cmFuc2Zvcm1lciB0aGF0XG4gKiBjb252ZXJ0cyBpdCBpbnRvIGFub3RoZXIgQVNUIHRoYXQgbm8gbG9uZ2VyIGNvbnRhaW5zIHF1b3RlZCBleHByZXNzaW9ucy5cbiAqIEl0IGlzIG1lYW50IHRvIGFsbG93IHRoaXJkLXBhcnR5IGRldmVsb3BlcnMgdG8gZXh0ZW5kIEFuZ3VsYXIgdGVtcGxhdGVcbiAqIGV4cHJlc3Npb24gbGFuZ3VhZ2UuIFRoZSBgdW5pbnRlcnByZXRlZEV4cHJlc3Npb25gIHBhcnQgb2YgdGhlIHF1b3RlIGlzXG4gKiB0aGVyZWZvcmUgbm90IGludGVycHJldGVkIGJ5IHRoZSBBbmd1bGFyJ3Mgb3duIGV4cHJlc3Npb24gcGFyc2VyLlxuICovXG5leHBvcnQgY2xhc3MgUXVvdGUgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgcHJlZml4OiBzdHJpbmcsXG4gICAgICBwdWJsaWMgdW5pbnRlcnByZXRlZEV4cHJlc3Npb246IHN0cmluZywgcHVibGljIGxvY2F0aW9uOiBhbnkpIHtcbiAgICBzdXBlcihzcGFuLCBzb3VyY2VTcGFuKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdFF1b3RlKHRoaXMsIGNvbnRleHQpO1xuICB9XG4gIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdRdW90ZSc7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVtcHR5RXhwciBleHRlbmRzIEFTVCB7XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpIHtcbiAgICAvLyBkbyBub3RoaW5nXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEltcGxpY2l0UmVjZWl2ZXIgZXh0ZW5kcyBBU1Qge1xuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdEltcGxpY2l0UmVjZWl2ZXIodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWNlaXZlciB3aGVuIHNvbWV0aGluZyBpcyBhY2Nlc3NlZCB0aHJvdWdoIGB0aGlzYCAoZS5nLiBgdGhpcy5mb29gKS4gTm90ZSB0aGF0IHRoaXMgY2xhc3NcbiAqIGluaGVyaXRzIGZyb20gYEltcGxpY2l0UmVjZWl2ZXJgLCBiZWNhdXNlIGFjY2Vzc2luZyBzb21ldGhpbmcgdGhyb3VnaCBgdGhpc2AgaXMgdHJlYXRlZCB0aGVcbiAqIHNhbWUgYXMgYWNjZXNzaW5nIGl0IGltcGxpY2l0bHkgaW5zaWRlIG9mIGFuIEFuZ3VsYXIgdGVtcGxhdGUgKGUuZy4gYFthdHRyLnRpdGxlXT1cInRoaXMudGl0bGVcImBcbiAqIGlzIHRoZSBzYW1lIGFzIGBbYXR0ci50aXRsZV09XCJ0aXRsZVwiYC4pLiBJbmhlcml0aW5nIGFsbG93cyBmb3IgdGhlIGB0aGlzYCBhY2Nlc3NlcyB0byBiZSB0cmVhdGVkXG4gKiB0aGUgc2FtZSBhcyBpbXBsaWNpdCBvbmVzLCBleGNlcHQgZm9yIGEgY291cGxlIG9mIGV4Y2VwdGlvbnMgbGlrZSBgJGV2ZW50YCBhbmQgYCRhbnlgLlxuICogVE9ETzogd2Ugc2hvdWxkIGZpbmQgYSB3YXkgZm9yIHRoaXMgY2xhc3Mgbm90IHRvIGV4dGVuZCBmcm9tIGBJbXBsaWNpdFJlY2VpdmVyYCBpbiB0aGUgZnV0dXJlLlxuICovXG5leHBvcnQgY2xhc3MgVGhpc1JlY2VpdmVyIGV4dGVuZHMgSW1wbGljaXRSZWNlaXZlciB7XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0VGhpc1JlY2VpdmVyPy4odGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBNdWx0aXBsZSBleHByZXNzaW9ucyBzZXBhcmF0ZWQgYnkgYSBzZW1pY29sb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGFpbiBleHRlbmRzIEFTVCB7XG4gIGNvbnN0cnVjdG9yKHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgZXhwcmVzc2lvbnM6IGFueVtdKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3Bhbik7XG4gIH1cbiAgb3ZlcnJpZGUgdmlzaXQodmlzaXRvcjogQXN0VmlzaXRvciwgY29udGV4dDogYW55ID0gbnVsbCk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRDaGFpbih0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29uZGl0aW9uYWwgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgY29uZGl0aW9uOiBBU1QsIHB1YmxpYyB0cnVlRXhwOiBBU1QsXG4gICAgICBwdWJsaWMgZmFsc2VFeHA6IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0Q29uZGl0aW9uYWwodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5UmVhZCBleHRlbmRzIEFTVFdpdGhOYW1lIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgbmFtZVNwYW46IEFic29sdXRlU291cmNlU3BhbixcbiAgICAgIHB1YmxpYyByZWNlaXZlcjogQVNULCBwdWJsaWMgbmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3BhbiwgbmFtZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0UHJvcGVydHlSZWFkKHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eVdyaXRlIGV4dGVuZHMgQVNUV2l0aE5hbWUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBuYW1lU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLFxuICAgICAgcHVibGljIHJlY2VpdmVyOiBBU1QsIHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB2YWx1ZTogQVNUKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3BhbiwgbmFtZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0UHJvcGVydHlXcml0ZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2FmZVByb3BlcnR5UmVhZCBleHRlbmRzIEFTVFdpdGhOYW1lIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgbmFtZVNwYW46IEFic29sdXRlU291cmNlU3BhbixcbiAgICAgIHB1YmxpYyByZWNlaXZlcjogQVNULCBwdWJsaWMgbmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3BhbiwgbmFtZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0U2FmZVByb3BlcnR5UmVhZCh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5ZWRSZWFkIGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIHJlY2VpdmVyOiBBU1QsIHB1YmxpYyBrZXk6IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0S2V5ZWRSZWFkKHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTYWZlS2V5ZWRSZWFkIGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIHJlY2VpdmVyOiBBU1QsIHB1YmxpYyBrZXk6IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0U2FmZUtleWVkUmVhZCh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5ZWRXcml0ZSBleHRlbmRzIEFTVCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgc3BhbjogUGFyc2VTcGFuLCBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4sIHB1YmxpYyByZWNlaXZlcjogQVNULCBwdWJsaWMga2V5OiBBU1QsXG4gICAgICBwdWJsaWMgdmFsdWU6IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0S2V5ZWRXcml0ZSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmluZGluZ1BpcGUgZXh0ZW5kcyBBU1RXaXRoTmFtZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgc3BhbjogUGFyc2VTcGFuLCBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4sIHB1YmxpYyBleHA6IEFTVCwgcHVibGljIG5hbWU6IHN0cmluZyxcbiAgICAgIHB1YmxpYyBhcmdzOiBhbnlbXSwgbmFtZVNwYW46IEFic29sdXRlU291cmNlU3Bhbikge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4sIG5hbWVTcGFuKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdFBpcGUodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExpdGVyYWxQcmltaXRpdmUgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIHZhbHVlOiBhbnkpIHtcbiAgICBzdXBlcihzcGFuLCBzb3VyY2VTcGFuKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdExpdGVyYWxQcmltaXRpdmUodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExpdGVyYWxBcnJheSBleHRlbmRzIEFTVCB7XG4gIGNvbnN0cnVjdG9yKHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgZXhwcmVzc2lvbnM6IGFueVtdKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3Bhbik7XG4gIH1cbiAgb3ZlcnJpZGUgdmlzaXQodmlzaXRvcjogQXN0VmlzaXRvciwgY29udGV4dDogYW55ID0gbnVsbCk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRMaXRlcmFsQXJyYXkodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgTGl0ZXJhbE1hcEtleSA9IHtcbiAga2V5OiBzdHJpbmc7IHF1b3RlZDogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBjbGFzcyBMaXRlcmFsTWFwIGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIGtleXM6IExpdGVyYWxNYXBLZXlbXSxcbiAgICAgIHB1YmxpYyB2YWx1ZXM6IGFueVtdKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3Bhbik7XG4gIH1cbiAgb3ZlcnJpZGUgdmlzaXQodmlzaXRvcjogQXN0VmlzaXRvciwgY29udGV4dDogYW55ID0gbnVsbCk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRMaXRlcmFsTWFwKHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcnBvbGF0aW9uIGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIHN0cmluZ3M6IGFueVtdLFxuICAgICAgcHVibGljIGV4cHJlc3Npb25zOiBhbnlbXSkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0SW50ZXJwb2xhdGlvbih0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmluYXJ5IGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIG9wZXJhdGlvbjogc3RyaW5nLCBwdWJsaWMgbGVmdDogQVNULFxuICAgICAgcHVibGljIHJpZ2h0OiBBU1QpIHtcbiAgICBzdXBlcihzcGFuLCBzb3VyY2VTcGFuKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdEJpbmFyeSh0aGlzLCBjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSByZWFzb25zLCBgVW5hcnlgIGluaGVyaXRzIGZyb20gYEJpbmFyeWAgYW5kIG1pbWljcyB0aGUgYmluYXJ5IEFTVFxuICogbm9kZSB0aGF0IHdhcyBvcmlnaW5hbGx5IHVzZWQuIFRoaXMgaW5oZXJpdGFuY2UgcmVsYXRpb24gY2FuIGJlIGRlbGV0ZWQgaW4gc29tZSBmdXR1cmUgbWFqb3IsXG4gKiBhZnRlciBjb25zdW1lcnMgaGF2ZSBiZWVuIGdpdmVuIGEgY2hhbmNlIHRvIGZ1bGx5IHN1cHBvcnQgVW5hcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBVbmFyeSBleHRlbmRzIEJpbmFyeSB7XG4gIC8vIFJlZGVjbGFyZSB0aGUgcHJvcGVydGllcyB0aGF0IGFyZSBpbmhlcml0ZWQgZnJvbSBgQmluYXJ5YCBhcyBgbmV2ZXJgLCBhcyBjb25zdW1lcnMgc2hvdWxkIG5vdFxuICAvLyBkZXBlbmQgb24gdGhlc2UgZmllbGRzIHdoZW4gb3BlcmF0aW5nIG9uIGBVbmFyeWAuXG4gIG92ZXJyaWRlIGxlZnQ6IG5ldmVyID0gbnVsbCBhcyBuZXZlcjtcbiAgb3ZlcnJpZGUgcmlnaHQ6IG5ldmVyID0gbnVsbCBhcyBuZXZlcjtcbiAgb3ZlcnJpZGUgb3BlcmF0aW9uOiBuZXZlciA9IG51bGwgYXMgbmV2ZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB1bmFyeSBtaW51cyBleHByZXNzaW9uIFwiLXhcIiwgcmVwcmVzZW50ZWQgYXMgYEJpbmFyeWAgdXNpbmcgXCIwIC0geFwiLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZU1pbnVzKHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBleHByOiBBU1QpOiBVbmFyeSB7XG4gICAgcmV0dXJuIG5ldyBVbmFyeShcbiAgICAgICAgc3Bhbiwgc291cmNlU3BhbiwgJy0nLCBleHByLCAnLScsIG5ldyBMaXRlcmFsUHJpbWl0aXZlKHNwYW4sIHNvdXJjZVNwYW4sIDApLCBleHByKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdW5hcnkgcGx1cyBleHByZXNzaW9uIFwiK3hcIiwgcmVwcmVzZW50ZWQgYXMgYEJpbmFyeWAgdXNpbmcgXCJ4IC0gMFwiLlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVBsdXMoc3BhbjogUGFyc2VTcGFuLCBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4sIGV4cHI6IEFTVCk6IFVuYXJ5IHtcbiAgICByZXR1cm4gbmV3IFVuYXJ5KFxuICAgICAgICBzcGFuLCBzb3VyY2VTcGFuLCAnKycsIGV4cHIsICctJywgZXhwciwgbmV3IExpdGVyYWxQcmltaXRpdmUoc3Bhbiwgc291cmNlU3BhbiwgMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIER1cmluZyB0aGUgZGVwcmVjYXRpb24gcGVyaW9kIHRoaXMgY29uc3RydWN0b3IgaXMgcHJpdmF0ZSwgdG8gYXZvaWQgY29uc3VtZXJzIGZyb20gY3JlYXRpbmdcbiAgICogYSBgVW5hcnlgIHdpdGggdGhlIGZhbGxiYWNrIHByb3BlcnRpZXMgZm9yIGBCaW5hcnlgLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgb3BlcmF0b3I6IHN0cmluZywgcHVibGljIGV4cHI6IEFTVCxcbiAgICAgIGJpbmFyeU9wOiBzdHJpbmcsIGJpbmFyeUxlZnQ6IEFTVCwgYmluYXJ5UmlnaHQ6IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4sIGJpbmFyeU9wLCBiaW5hcnlMZWZ0LCBiaW5hcnlSaWdodCk7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICBpZiAodmlzaXRvci52aXNpdFVuYXJ5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB2aXNpdG9yLnZpc2l0VW5hcnkodGhpcywgY29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0QmluYXJ5KHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQcmVmaXhOb3QgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihzcGFuOiBQYXJzZVNwYW4sIHNvdXJjZVNwYW46IEFic29sdXRlU291cmNlU3BhbiwgcHVibGljIGV4cHJlc3Npb246IEFTVCkge1xuICAgIHN1cGVyKHNwYW4sIHNvdXJjZVNwYW4pO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0UHJlZml4Tm90KHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb25OdWxsQXNzZXJ0IGV4dGVuZHMgQVNUIHtcbiAgY29uc3RydWN0b3Ioc3BhbjogUGFyc2VTcGFuLCBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4sIHB1YmxpYyBleHByZXNzaW9uOiBBU1QpIHtcbiAgICBzdXBlcihzcGFuLCBzb3VyY2VTcGFuKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdCh2aXNpdG9yOiBBc3RWaXNpdG9yLCBjb250ZXh0OiBhbnkgPSBudWxsKTogYW55IHtcbiAgICByZXR1cm4gdmlzaXRvci52aXNpdE5vbk51bGxBc3NlcnQodGhpcywgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhbGwgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNwYW46IFBhcnNlU3Bhbiwgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLCBwdWJsaWMgcmVjZWl2ZXI6IEFTVCwgcHVibGljIGFyZ3M6IGFueVtdLFxuICAgICAgcHVibGljIGFyZ3VtZW50U3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuKSB7XG4gICAgc3VwZXIoc3Bhbiwgc291cmNlU3Bhbik7XG4gIH1cbiAgb3ZlcnJpZGUgdmlzaXQodmlzaXRvcjogQXN0VmlzaXRvciwgY29udGV4dDogYW55ID0gbnVsbCk6IGFueSB7XG4gICAgcmV0dXJuIHZpc2l0b3IudmlzaXRDYWxsKHRoaXMsIGNvbnRleHQpO1xuICB9XG59XG5cbi8qKlxuICogUmVjb3JkcyB0aGUgYWJzb2x1dGUgcG9zaXRpb24gb2YgYSB0ZXh0IHNwYW4gaW4gYSBzb3VyY2UgZmlsZSwgd2hlcmUgYHN0YXJ0YCBhbmQgYGVuZGAgYXJlIHRoZVxuICogc3RhcnRpbmcgYW5kIGVuZGluZyBieXRlIG9mZnNldHMsIHJlc3BlY3RpdmVseSwgb2YgdGhlIHRleHQgc3BhbiBpbiBhIHNvdXJjZSBmaWxlLlxuICovXG5leHBvcnQgY2xhc3MgQWJzb2x1dGVTb3VyY2VTcGFuIHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHN0YXJ0OiBudW1iZXIsIHB1YmxpYyByZWFkb25seSBlbmQ6IG51bWJlcikge31cbn1cblxuZXhwb3J0IGNsYXNzIEFTVFdpdGhTb3VyY2UgZXh0ZW5kcyBBU1Qge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBhc3Q6IEFTVCwgcHVibGljIHNvdXJjZTogc3RyaW5nfG51bGwsIHB1YmxpYyBsb2NhdGlvbjogc3RyaW5nLCBhYnNvbHV0ZU9mZnNldDogbnVtYmVyLFxuICAgICAgcHVibGljIGVycm9yczogUGFyc2VyRXJyb3JbXSkge1xuICAgIHN1cGVyKFxuICAgICAgICBuZXcgUGFyc2VTcGFuKDAsIHNvdXJjZSA9PT0gbnVsbCA/IDAgOiBzb3VyY2UubGVuZ3RoKSxcbiAgICAgICAgbmV3IEFic29sdXRlU291cmNlU3BhbihcbiAgICAgICAgICAgIGFic29sdXRlT2Zmc2V0LCBzb3VyY2UgPT09IG51bGwgPyBhYnNvbHV0ZU9mZnNldCA6IGFic29sdXRlT2Zmc2V0ICsgc291cmNlLmxlbmd0aCkpO1xuICB9XG4gIG92ZXJyaWRlIHZpc2l0KHZpc2l0b3I6IEFzdFZpc2l0b3IsIGNvbnRleHQ6IGFueSA9IG51bGwpOiBhbnkge1xuICAgIGlmICh2aXNpdG9yLnZpc2l0QVNUV2l0aFNvdXJjZSkge1xuICAgICAgcmV0dXJuIHZpc2l0b3IudmlzaXRBU1RXaXRoU291cmNlKHRoaXMsIGNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hc3QudmlzaXQodmlzaXRvciwgY29udGV4dCk7XG4gIH1cbiAgb3ZlcnJpZGUgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5zb3VyY2V9IGluICR7dGhpcy5sb2NhdGlvbn1gO1xuICB9XG59XG5cbi8qKlxuICogVGVtcGxhdGVCaW5kaW5nIHJlZmVycyB0byBhIHBhcnRpY3VsYXIga2V5LXZhbHVlIHBhaXIgaW4gYSBtaWNyb3N5bnRheFxuICogZXhwcmVzc2lvbi4gQSBmZXcgZXhhbXBsZXMgYXJlOlxuICpcbiAqICAgfC0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS18LS0tLS0tLS0tLS0tLS18XG4gKiAgIHwgICAgIGV4cHJlc3Npb24gICAgICB8ICAgICBrZXkgICAgICB8ICB2YWx1ZSAgfCBiaW5kaW5nIHR5cGUgfFxuICogICB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLXxcbiAqICAgfCAxLiBsZXQgaXRlbSAgICAgICAgIHwgICAgaXRlbSAgICAgIHwgIG51bGwgICB8ICAgdmFyaWFibGUgICB8XG4gKiAgIHwgMi4gb2YgaXRlbXMgICAgICAgICB8ICAgbmdGb3JPZiAgICB8ICBpdGVtcyAgfCAgZXhwcmVzc2lvbiAgfFxuICogICB8IDMuIGxldCB4ID0geSAgICAgICAgfCAgICAgIHggICAgICAgfCAgICB5ICAgIHwgICB2YXJpYWJsZSAgIHxcbiAqICAgfCA0LiBpbmRleCBhcyBpICAgICAgIHwgICAgICBpICAgICAgIHwgIGluZGV4ICB8ICAgdmFyaWFibGUgICB8XG4gKiAgIHwgNS4gdHJhY2tCeTogZnVuYyAgICB8IG5nRm9yVHJhY2tCeSB8ICAgZnVuYyAgfCAgZXhwcmVzc2lvbiAgfFxuICogICB8IDYuICpuZ0lmPVwiY29uZFwiICAgICB8ICAgICBuZ0lmICAgICB8ICAgY29uZCAgfCAgZXhwcmVzc2lvbiAgfFxuICogICB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLXxcbiAqXG4gKiAoNikgaXMgYSBub3RhYmxlIGV4Y2VwdGlvbiBiZWNhdXNlIGl0IGlzIGEgYmluZGluZyBmcm9tIHRoZSB0ZW1wbGF0ZSBrZXkgaW5cbiAqIHRoZSBMSFMgb2YgYSBIVE1MIGF0dHJpYnV0ZSB0byB0aGUgZXhwcmVzc2lvbiBpbiB0aGUgUkhTLiBBbGwgb3RoZXIgYmluZGluZ3NcbiAqIGluIHRoZSBleGFtcGxlIGFib3ZlIGFyZSBkZXJpdmVkIHNvbGVseSBmcm9tIHRoZSBSSFMuXG4gKi9cbmV4cG9ydCB0eXBlIFRlbXBsYXRlQmluZGluZyA9IFZhcmlhYmxlQmluZGluZ3xFeHByZXNzaW9uQmluZGluZztcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlQmluZGluZyB7XG4gIC8qKlxuICAgKiBAcGFyYW0gc291cmNlU3BhbiBlbnRpcmUgc3BhbiBvZiB0aGUgYmluZGluZy5cbiAgICogQHBhcmFtIGtleSBuYW1lIG9mIHRoZSBMSFMgYWxvbmcgd2l0aCBpdHMgc3Bhbi5cbiAgICogQHBhcmFtIHZhbHVlIG9wdGlvbmFsIHZhbHVlIGZvciB0aGUgUkhTIGFsb25nIHdpdGggaXRzIHNwYW4uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyByZWFkb25seSBzb3VyY2VTcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4sXG4gICAgICBwdWJsaWMgcmVhZG9ubHkga2V5OiBUZW1wbGF0ZUJpbmRpbmdJZGVudGlmaWVyLFxuICAgICAgcHVibGljIHJlYWRvbmx5IHZhbHVlOiBUZW1wbGF0ZUJpbmRpbmdJZGVudGlmaWVyfG51bGwpIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBFeHByZXNzaW9uQmluZGluZyB7XG4gIC8qKlxuICAgKiBAcGFyYW0gc291cmNlU3BhbiBlbnRpcmUgc3BhbiBvZiB0aGUgYmluZGluZy5cbiAgICogQHBhcmFtIGtleSBiaW5kaW5nIG5hbWUsIGxpa2UgbmdGb3JPZiwgbmdGb3JUcmFja0J5LCBuZ0lmLCBhbG9uZyB3aXRoIGl0c1xuICAgKiBzcGFuLiBOb3RlIHRoYXQgdGhlIGxlbmd0aCBvZiB0aGUgc3BhbiBtYXkgbm90IGJlIHRoZSBzYW1lIGFzXG4gICAqIGBrZXkuc291cmNlLmxlbmd0aGAuIEZvciBleGFtcGxlLFxuICAgKiAxLiBrZXkuc291cmNlID0gbmdGb3IsIGtleS5zcGFuIGlzIGZvciBcIm5nRm9yXCJcbiAgICogMi4ga2V5LnNvdXJjZSA9IG5nRm9yT2YsIGtleS5zcGFuIGlzIGZvciBcIm9mXCJcbiAgICogMy4ga2V5LnNvdXJjZSA9IG5nRm9yVHJhY2tCeSwga2V5LnNwYW4gaXMgZm9yIFwidHJhY2tCeVwiXG4gICAqIEBwYXJhbSB2YWx1ZSBvcHRpb25hbCBleHByZXNzaW9uIGZvciB0aGUgUkhTLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcmVhZG9ubHkgc291cmNlU3BhbjogQWJzb2x1dGVTb3VyY2VTcGFuLFxuICAgICAgcHVibGljIHJlYWRvbmx5IGtleTogVGVtcGxhdGVCaW5kaW5nSWRlbnRpZmllciwgcHVibGljIHJlYWRvbmx5IHZhbHVlOiBBU1RXaXRoU291cmNlfG51bGwpIHt9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVCaW5kaW5nSWRlbnRpZmllciB7XG4gIHNvdXJjZTogc3RyaW5nO1xuICBzcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXN0VmlzaXRvciB7XG4gIC8qKlxuICAgKiBUaGUgYHZpc2l0VW5hcnlgIG1ldGhvZCBpcyBkZWNsYXJlZCBhcyBvcHRpb25hbCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuIEluIGFuIHVwY29taW5nXG4gICAqIG1ham9yIHJlbGVhc2UsIHRoaXMgbWV0aG9kIHdpbGwgYmUgbWFkZSByZXF1aXJlZC5cbiAgICovXG4gIHZpc2l0VW5hcnk/KGFzdDogVW5hcnksIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRCaW5hcnkoYXN0OiBCaW5hcnksIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRDaGFpbihhc3Q6IENoYWluLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0Q29uZGl0aW9uYWwoYXN0OiBDb25kaXRpb25hbCwgY29udGV4dDogYW55KTogYW55O1xuICAvKipcbiAgICogVGhlIGB2aXNpdFRoaXNSZWNlaXZlcmAgbWV0aG9kIGlzIGRlY2xhcmVkIGFzIG9wdGlvbmFsIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgICogSW4gYW4gdXBjb21pbmcgbWFqb3IgcmVsZWFzZSwgdGhpcyBtZXRob2Qgd2lsbCBiZSBtYWRlIHJlcXVpcmVkLlxuICAgKi9cbiAgdmlzaXRUaGlzUmVjZWl2ZXI/KGFzdDogVGhpc1JlY2VpdmVyLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3Q6IEltcGxpY2l0UmVjZWl2ZXIsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdDogSW50ZXJwb2xhdGlvbiwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdEtleWVkUmVhZChhc3Q6IEtleWVkUmVhZCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdEtleWVkV3JpdGUoYXN0OiBLZXllZFdyaXRlLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0TGl0ZXJhbEFycmF5KGFzdDogTGl0ZXJhbEFycmF5LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0TGl0ZXJhbE1hcChhc3Q6IExpdGVyYWxNYXAsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRMaXRlcmFsUHJpbWl0aXZlKGFzdDogTGl0ZXJhbFByaW1pdGl2ZSwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFBpcGUoYXN0OiBCaW5kaW5nUGlwZSwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFByZWZpeE5vdChhc3Q6IFByZWZpeE5vdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdE5vbk51bGxBc3NlcnQoYXN0OiBOb25OdWxsQXNzZXJ0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0UHJvcGVydHlSZWFkKGFzdDogUHJvcGVydHlSZWFkLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0UHJvcGVydHlXcml0ZShhc3Q6IFByb3BlcnR5V3JpdGUsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRRdW90ZShhc3Q6IFF1b3RlLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3Q6IFNhZmVQcm9wZXJ0eVJlYWQsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRTYWZlS2V5ZWRSZWFkKGFzdDogU2FmZUtleWVkUmVhZCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdENhbGwoYXN0OiBDYWxsLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QVNUV2l0aFNvdXJjZT8oYXN0OiBBU1RXaXRoU291cmNlLCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIG9wdGlvbmFsbHkgZGVmaW5lZCB0byBhbGxvdyBjbGFzc2VzIHRoYXQgaW1wbGVtZW50IHRoaXNcbiAgICogaW50ZXJmYWNlIHRvIHNlbGVjdGl2ZWx5IGRlY2lkZSBpZiB0aGUgc3BlY2lmaWVkIGBhc3RgIHNob3VsZCBiZSB2aXNpdGVkLlxuICAgKiBAcGFyYW0gYXN0IG5vZGUgdG8gdmlzaXRcbiAgICogQHBhcmFtIGNvbnRleHQgY29udGV4dCB0aGF0IGdldHMgcGFzc2VkIHRvIHRoZSBub2RlIGFuZCBhbGwgaXRzIGNoaWxkcmVuXG4gICAqL1xuICB2aXNpdD8oYXN0OiBBU1QsIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWN1cnNpdmVBc3RWaXNpdG9yIGltcGxlbWVudHMgQXN0VmlzaXRvciB7XG4gIHZpc2l0KGFzdDogQVNULCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICAvLyBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBqdXN0IHZpc2l0cyBldmVyeSBub2RlLlxuICAgIC8vIENsYXNzZXMgdGhhdCBleHRlbmQgUmVjdXJzaXZlQXN0VmlzaXRvciBzaG91bGQgb3ZlcnJpZGUgdGhpcyBmdW5jdGlvblxuICAgIC8vIHRvIHNlbGVjdGl2ZWx5IHZpc2l0IHRoZSBzcGVjaWZpZWQgbm9kZS5cbiAgICBhc3QudmlzaXQodGhpcywgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRVbmFyeShhc3Q6IFVuYXJ5LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHRoaXMudmlzaXQoYXN0LmV4cHIsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0QmluYXJ5KGFzdDogQmluYXJ5LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHRoaXMudmlzaXQoYXN0LmxlZnQsIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXQoYXN0LnJpZ2h0LCBjb250ZXh0KTtcbiAgfVxuICB2aXNpdENoYWluKGFzdDogQ2hhaW4sIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdEFsbChhc3QuZXhwcmVzc2lvbnMsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0Q29uZGl0aW9uYWwoYXN0OiBDb25kaXRpb25hbCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5jb25kaXRpb24sIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXQoYXN0LnRydWVFeHAsIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXQoYXN0LmZhbHNlRXhwLCBjb250ZXh0KTtcbiAgfVxuICB2aXNpdFBpcGUoYXN0OiBCaW5kaW5nUGlwZSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5leHAsIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXRBbGwoYXN0LmFyZ3MsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3Q6IFRoaXNSZWNlaXZlciwgY29udGV4dDogYW55KTogYW55IHt9XG4gIHZpc2l0VGhpc1JlY2VpdmVyKGFzdDogVGhpc1JlY2VpdmVyLCBjb250ZXh0OiBhbnkpOiBhbnkge31cbiAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdDogSW50ZXJwb2xhdGlvbiwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucywgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRLZXllZFJlYWQoYXN0OiBLZXllZFJlYWQsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdChhc3QucmVjZWl2ZXIsIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXQoYXN0LmtleSwgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRLZXllZFdyaXRlKGFzdDogS2V5ZWRXcml0ZSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5yZWNlaXZlciwgY29udGV4dCk7XG4gICAgdGhpcy52aXNpdChhc3Qua2V5LCBjb250ZXh0KTtcbiAgICB0aGlzLnZpc2l0KGFzdC52YWx1ZSwgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0OiBMaXRlcmFsQXJyYXksIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdEFsbChhc3QuZXhwcmVzc2lvbnMsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0TGl0ZXJhbE1hcChhc3Q6IExpdGVyYWxNYXAsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdEFsbChhc3QudmFsdWVzLCBjb250ZXh0KTtcbiAgfVxuICB2aXNpdExpdGVyYWxQcmltaXRpdmUoYXN0OiBMaXRlcmFsUHJpbWl0aXZlLCBjb250ZXh0OiBhbnkpOiBhbnkge31cbiAgdmlzaXRQcmVmaXhOb3QoYXN0OiBQcmVmaXhOb3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdChhc3QuZXhwcmVzc2lvbiwgY29udGV4dCk7XG4gIH1cbiAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdDogTm9uTnVsbEFzc2VydCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5leHByZXNzaW9uLCBjb250ZXh0KTtcbiAgfVxuICB2aXNpdFByb3BlcnR5UmVhZChhc3Q6IFByb3BlcnR5UmVhZCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5yZWNlaXZlciwgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogUHJvcGVydHlXcml0ZSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5yZWNlaXZlciwgY29udGV4dCk7XG4gICAgdGhpcy52aXNpdChhc3QudmFsdWUsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3Q6IFNhZmVQcm9wZXJ0eVJlYWQsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdChhc3QucmVjZWl2ZXIsIGNvbnRleHQpO1xuICB9XG4gIHZpc2l0U2FmZUtleWVkUmVhZChhc3Q6IFNhZmVLZXllZFJlYWQsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy52aXNpdChhc3QucmVjZWl2ZXIsIGNvbnRleHQpO1xuICAgIHRoaXMudmlzaXQoYXN0LmtleSwgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRDYWxsKGFzdDogQ2FsbCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnZpc2l0KGFzdC5yZWNlaXZlciwgY29udGV4dCk7XG4gICAgdGhpcy52aXNpdEFsbChhc3QuYXJncywgY29udGV4dCk7XG4gIH1cbiAgdmlzaXRRdW90ZShhc3Q6IFF1b3RlLCBjb250ZXh0OiBhbnkpOiBhbnkge31cbiAgLy8gVGhpcyBpcyBub3QgcGFydCBvZiB0aGUgQXN0VmlzaXRvciBpbnRlcmZhY2UsIGp1c3QgYSBoZWxwZXIgbWV0aG9kXG4gIHZpc2l0QWxsKGFzdHM6IEFTVFtdLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGZvciAoY29uc3QgYXN0IG9mIGFzdHMpIHtcbiAgICAgIHRoaXMudmlzaXQoYXN0LCBjb250ZXh0KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzdFRyYW5zZm9ybWVyIGltcGxlbWVudHMgQXN0VmlzaXRvciB7XG4gIHZpc2l0SW1wbGljaXRSZWNlaXZlcihhc3Q6IEltcGxpY2l0UmVjZWl2ZXIsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0VGhpc1JlY2VpdmVyKGFzdDogVGhpc1JlY2VpdmVyLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBhc3Q7XG4gIH1cblxuICB2aXNpdEludGVycG9sYXRpb24oYXN0OiBJbnRlcnBvbGF0aW9uLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBuZXcgSW50ZXJwb2xhdGlvbihhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5zdHJpbmdzLCB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucykpO1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsUHJpbWl0aXZlKGFzdDogTGl0ZXJhbFByaW1pdGl2ZSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxQcmltaXRpdmUoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QudmFsdWUpO1xuICB9XG5cbiAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0OiBQcm9wZXJ0eVJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBQcm9wZXJ0eVJlYWQoXG4gICAgICAgIGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0Lm5hbWVTcGFuLCBhc3QucmVjZWl2ZXIudmlzaXQodGhpcyksIGFzdC5uYW1lKTtcbiAgfVxuXG4gIHZpc2l0UHJvcGVydHlXcml0ZShhc3Q6IFByb3BlcnR5V3JpdGUsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBQcm9wZXJ0eVdyaXRlKFxuICAgICAgICBhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5uYW1lU3BhbiwgYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpLCBhc3QubmFtZSxcbiAgICAgICAgYXN0LnZhbHVlLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3Q6IFNhZmVQcm9wZXJ0eVJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBTYWZlUHJvcGVydHlSZWFkKFxuICAgICAgICBhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5uYW1lU3BhbiwgYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpLCBhc3QubmFtZSk7XG4gIH1cblxuICB2aXNpdExpdGVyYWxBcnJheShhc3Q6IExpdGVyYWxBcnJheSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxBcnJheShhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIHRoaXMudmlzaXRBbGwoYXN0LmV4cHJlc3Npb25zKSk7XG4gIH1cblxuICB2aXNpdExpdGVyYWxNYXAoYXN0OiBMaXRlcmFsTWFwLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbE1hcChhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5rZXlzLCB0aGlzLnZpc2l0QWxsKGFzdC52YWx1ZXMpKTtcbiAgfVxuXG4gIHZpc2l0VW5hcnkoYXN0OiBVbmFyeSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBzd2l0Y2ggKGFzdC5vcGVyYXRvcikge1xuICAgICAgY2FzZSAnKyc6XG4gICAgICAgIHJldHVybiBVbmFyeS5jcmVhdGVQbHVzKGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LmV4cHIudmlzaXQodGhpcykpO1xuICAgICAgY2FzZSAnLSc6XG4gICAgICAgIHJldHVybiBVbmFyeS5jcmVhdGVNaW51cyhhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5leHByLnZpc2l0KHRoaXMpKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB1bmFyeSBvcGVyYXRvciAke2FzdC5vcGVyYXRvcn1gKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdEJpbmFyeShhc3Q6IEJpbmFyeSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IEJpbmFyeShcbiAgICAgICAgYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3Qub3BlcmF0aW9uLCBhc3QubGVmdC52aXNpdCh0aGlzKSwgYXN0LnJpZ2h0LnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIHZpc2l0UHJlZml4Tm90KGFzdDogUHJlZml4Tm90LCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBuZXcgUHJlZml4Tm90KGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LmV4cHJlc3Npb24udmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdDogTm9uTnVsbEFzc2VydCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IE5vbk51bGxBc3NlcnQoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QuZXhwcmVzc2lvbi52aXNpdCh0aGlzKSk7XG4gIH1cblxuICB2aXNpdENvbmRpdGlvbmFsKGFzdDogQ29uZGl0aW9uYWwsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBDb25kaXRpb25hbChcbiAgICAgICAgYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QuY29uZGl0aW9uLnZpc2l0KHRoaXMpLCBhc3QudHJ1ZUV4cC52aXNpdCh0aGlzKSxcbiAgICAgICAgYXN0LmZhbHNlRXhwLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIHZpc2l0UGlwZShhc3Q6IEJpbmRpbmdQaXBlLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBuZXcgQmluZGluZ1BpcGUoXG4gICAgICAgIGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LmV4cC52aXNpdCh0aGlzKSwgYXN0Lm5hbWUsIHRoaXMudmlzaXRBbGwoYXN0LmFyZ3MpLFxuICAgICAgICBhc3QubmFtZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRLZXllZFJlYWQoYXN0OiBLZXllZFJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBLZXllZFJlYWQoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QucmVjZWl2ZXIudmlzaXQodGhpcyksIGFzdC5rZXkudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXRLZXllZFdyaXRlKGFzdDogS2V5ZWRXcml0ZSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IEtleWVkV3JpdGUoXG4gICAgICAgIGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpLCBhc3Qua2V5LnZpc2l0KHRoaXMpLFxuICAgICAgICBhc3QudmFsdWUudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXRDYWxsKGFzdDogQ2FsbCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gbmV3IENhbGwoXG4gICAgICAgIGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpLCB0aGlzLnZpc2l0QWxsKGFzdC5hcmdzKSxcbiAgICAgICAgYXN0LmFyZ3VtZW50U3Bhbik7XG4gIH1cblxuICB2aXNpdEFsbChhc3RzOiBhbnlbXSk6IGFueVtdIHtcbiAgICBjb25zdCByZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHJlc1tpXSA9IGFzdHNbaV0udmlzaXQodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICB2aXNpdENoYWluKGFzdDogQ2hhaW4sIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbihhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIHRoaXMudmlzaXRBbGwoYXN0LmV4cHJlc3Npb25zKSk7XG4gIH1cblxuICB2aXNpdFF1b3RlKGFzdDogUXVvdGUsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIG5ldyBRdW90ZShcbiAgICAgICAgYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QucHJlZml4LCBhc3QudW5pbnRlcnByZXRlZEV4cHJlc3Npb24sIGFzdC5sb2NhdGlvbik7XG4gIH1cblxuICB2aXNpdFNhZmVLZXllZFJlYWQoYXN0OiBTYWZlS2V5ZWRSZWFkLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIHJldHVybiBuZXcgU2FmZUtleWVkUmVhZChcbiAgICAgICAgYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QucmVjZWl2ZXIudmlzaXQodGhpcyksIGFzdC5rZXkudmlzaXQodGhpcykpO1xuICB9XG59XG5cbi8vIEEgdHJhbnNmb3JtZXIgdGhhdCBvbmx5IGNyZWF0ZXMgbmV3IG5vZGVzIGlmIHRoZSB0cmFuc2Zvcm1lciBtYWtlcyBhIGNoYW5nZSBvclxuLy8gYSBjaGFuZ2UgaXMgbWFkZSBhIGNoaWxkIG5vZGUuXG5leHBvcnQgY2xhc3MgQXN0TWVtb3J5RWZmaWNpZW50VHJhbnNmb3JtZXIgaW1wbGVtZW50cyBBc3RWaXNpdG9yIHtcbiAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdDogSW1wbGljaXRSZWNlaXZlciwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRUaGlzUmVjZWl2ZXIoYXN0OiBUaGlzUmVjZWl2ZXIsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0SW50ZXJwb2xhdGlvbihhc3Q6IEludGVycG9sYXRpb24sIGNvbnRleHQ6IGFueSk6IEludGVycG9sYXRpb24ge1xuICAgIGNvbnN0IGV4cHJlc3Npb25zID0gdGhpcy52aXNpdEFsbChhc3QuZXhwcmVzc2lvbnMpO1xuICAgIGlmIChleHByZXNzaW9ucyAhPT0gYXN0LmV4cHJlc3Npb25zKVxuICAgICAgcmV0dXJuIG5ldyBJbnRlcnBvbGF0aW9uKGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0LnN0cmluZ3MsIGV4cHJlc3Npb25zKTtcbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsUHJpbWl0aXZlKGFzdDogTGl0ZXJhbFByaW1pdGl2ZSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0OiBQcm9wZXJ0eVJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3QgcmVjZWl2ZXIgPSBhc3QucmVjZWl2ZXIudmlzaXQodGhpcyk7XG4gICAgaWYgKHJlY2VpdmVyICE9PSBhc3QucmVjZWl2ZXIpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvcGVydHlSZWFkKGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0Lm5hbWVTcGFuLCByZWNlaXZlciwgYXN0Lm5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdDogUHJvcGVydHlXcml0ZSwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCByZWNlaXZlciA9IGFzdC5yZWNlaXZlci52aXNpdCh0aGlzKTtcbiAgICBjb25zdCB2YWx1ZSA9IGFzdC52YWx1ZS52aXNpdCh0aGlzKTtcbiAgICBpZiAocmVjZWl2ZXIgIT09IGFzdC5yZWNlaXZlciB8fCB2YWx1ZSAhPT0gYXN0LnZhbHVlKSB7XG4gICAgICByZXR1cm4gbmV3IFByb3BlcnR5V3JpdGUoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3QubmFtZVNwYW4sIHJlY2VpdmVyLCBhc3QubmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdDogU2FmZVByb3BlcnR5UmVhZCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCByZWNlaXZlciA9IGFzdC5yZWNlaXZlci52aXNpdCh0aGlzKTtcbiAgICBpZiAocmVjZWl2ZXIgIT09IGFzdC5yZWNlaXZlcikge1xuICAgICAgcmV0dXJuIG5ldyBTYWZlUHJvcGVydHlSZWFkKGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgYXN0Lm5hbWVTcGFuLCByZWNlaXZlciwgYXN0Lm5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0OiBMaXRlcmFsQXJyYXksIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucyk7XG4gICAgaWYgKGV4cHJlc3Npb25zICE9PSBhc3QuZXhwcmVzc2lvbnMpIHtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbEFycmF5KGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgZXhwcmVzc2lvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRMaXRlcmFsTWFwKGFzdDogTGl0ZXJhbE1hcCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLnZpc2l0QWxsKGFzdC52YWx1ZXMpO1xuICAgIGlmICh2YWx1ZXMgIT09IGFzdC52YWx1ZXMpIHtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbE1hcChhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGFzdC5rZXlzLCB2YWx1ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRVbmFyeShhc3Q6IFVuYXJ5LCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIGNvbnN0IGV4cHIgPSBhc3QuZXhwci52aXNpdCh0aGlzKTtcbiAgICBpZiAoZXhwciAhPT0gYXN0LmV4cHIpIHtcbiAgICAgIHN3aXRjaCAoYXN0Lm9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgIHJldHVybiBVbmFyeS5jcmVhdGVQbHVzKGFzdC5zcGFuLCBhc3Quc291cmNlU3BhbiwgZXhwcik7XG4gICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgIHJldHVybiBVbmFyeS5jcmVhdGVNaW51cyhhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGV4cHIpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB1bmFyeSBvcGVyYXRvciAke2FzdC5vcGVyYXRvcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0QmluYXJ5KGFzdDogQmluYXJ5LCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIGNvbnN0IGxlZnQgPSBhc3QubGVmdC52aXNpdCh0aGlzKTtcbiAgICBjb25zdCByaWdodCA9IGFzdC5yaWdodC52aXNpdCh0aGlzKTtcbiAgICBpZiAobGVmdCAhPT0gYXN0LmxlZnQgfHwgcmlnaHQgIT09IGFzdC5yaWdodCkge1xuICAgICAgcmV0dXJuIG5ldyBCaW5hcnkoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBhc3Qub3BlcmF0aW9uLCBsZWZ0LCByaWdodCk7XG4gICAgfVxuICAgIHJldHVybiBhc3Q7XG4gIH1cblxuICB2aXNpdFByZWZpeE5vdChhc3Q6IFByZWZpeE5vdCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gYXN0LmV4cHJlc3Npb24udmlzaXQodGhpcyk7XG4gICAgaWYgKGV4cHJlc3Npb24gIT09IGFzdC5leHByZXNzaW9uKSB7XG4gICAgICByZXR1cm4gbmV3IFByZWZpeE5vdChhc3Quc3BhbiwgYXN0LnNvdXJjZVNwYW4sIGV4cHJlc3Npb24pO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdDogTm9uTnVsbEFzc2VydCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gYXN0LmV4cHJlc3Npb24udmlzaXQodGhpcyk7XG4gICAgaWYgKGV4cHJlc3Npb24gIT09IGFzdC5leHByZXNzaW9uKSB7XG4gICAgICByZXR1cm4gbmV3IE5vbk51bGxBc3NlcnQoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBleHByZXNzaW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0Q29uZGl0aW9uYWwoYXN0OiBDb25kaXRpb25hbCwgY29udGV4dDogYW55KTogQVNUIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBhc3QuY29uZGl0aW9uLnZpc2l0KHRoaXMpO1xuICAgIGNvbnN0IHRydWVFeHAgPSBhc3QudHJ1ZUV4cC52aXNpdCh0aGlzKTtcbiAgICBjb25zdCBmYWxzZUV4cCA9IGFzdC5mYWxzZUV4cC52aXNpdCh0aGlzKTtcbiAgICBpZiAoY29uZGl0aW9uICE9PSBhc3QuY29uZGl0aW9uIHx8IHRydWVFeHAgIT09IGFzdC50cnVlRXhwIHx8IGZhbHNlRXhwICE9PSBhc3QuZmFsc2VFeHApIHtcbiAgICAgIHJldHVybiBuZXcgQ29uZGl0aW9uYWwoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBjb25kaXRpb24sIHRydWVFeHAsIGZhbHNlRXhwKTtcbiAgICB9XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0UGlwZShhc3Q6IEJpbmRpbmdQaXBlLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIGNvbnN0IGV4cCA9IGFzdC5leHAudmlzaXQodGhpcyk7XG4gICAgY29uc3QgYXJncyA9IHRoaXMudmlzaXRBbGwoYXN0LmFyZ3MpO1xuICAgIGlmIChleHAgIT09IGFzdC5leHAgfHwgYXJncyAhPT0gYXN0LmFyZ3MpIHtcbiAgICAgIHJldHVybiBuZXcgQmluZGluZ1BpcGUoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBleHAsIGFzdC5uYW1lLCBhcmdzLCBhc3QubmFtZVNwYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG5cbiAgdmlzaXRLZXllZFJlYWQoYXN0OiBLZXllZFJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3Qgb2JqID0gYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpO1xuICAgIGNvbnN0IGtleSA9IGFzdC5rZXkudmlzaXQodGhpcyk7XG4gICAgaWYgKG9iaiAhPT0gYXN0LnJlY2VpdmVyIHx8IGtleSAhPT0gYXN0LmtleSkge1xuICAgICAgcmV0dXJuIG5ldyBLZXllZFJlYWQoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBvYmosIGtleSk7XG4gICAgfVxuICAgIHJldHVybiBhc3Q7XG4gIH1cblxuICB2aXNpdEtleWVkV3JpdGUoYXN0OiBLZXllZFdyaXRlLCBjb250ZXh0OiBhbnkpOiBBU1Qge1xuICAgIGNvbnN0IG9iaiA9IGFzdC5yZWNlaXZlci52aXNpdCh0aGlzKTtcbiAgICBjb25zdCBrZXkgPSBhc3Qua2V5LnZpc2l0KHRoaXMpO1xuICAgIGNvbnN0IHZhbHVlID0gYXN0LnZhbHVlLnZpc2l0KHRoaXMpO1xuICAgIGlmIChvYmogIT09IGFzdC5yZWNlaXZlciB8fCBrZXkgIT09IGFzdC5rZXkgfHwgdmFsdWUgIT09IGFzdC52YWx1ZSkge1xuICAgICAgcmV0dXJuIG5ldyBLZXllZFdyaXRlKGFzdC5zcGFuLCBhc3Quc291cmNlU3Bhbiwgb2JqLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0QWxsKGFzdHM6IGFueVtdKTogYW55W10ge1xuICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgIGxldCBtb2RpZmllZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXN0cy5sZW5ndGg7ICsraSkge1xuICAgICAgY29uc3Qgb3JpZ2luYWwgPSBhc3RzW2ldO1xuICAgICAgY29uc3QgdmFsdWUgPSBvcmlnaW5hbC52aXNpdCh0aGlzKTtcbiAgICAgIHJlc1tpXSA9IHZhbHVlO1xuICAgICAgbW9kaWZpZWQgPSBtb2RpZmllZCB8fCB2YWx1ZSAhPT0gb3JpZ2luYWw7XG4gICAgfVxuICAgIHJldHVybiBtb2RpZmllZCA/IHJlcyA6IGFzdHM7XG4gIH1cblxuICB2aXNpdENoYWluKGFzdDogQ2hhaW4sIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucyk7XG4gICAgaWYgKGV4cHJlc3Npb25zICE9PSBhc3QuZXhwcmVzc2lvbnMpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhaW4oYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCBleHByZXNzaW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBhc3Q7XG4gIH1cblxuXG4gIHZpc2l0Q2FsbChhc3Q6IENhbGwsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3QgcmVjZWl2ZXIgPSBhc3QucmVjZWl2ZXIudmlzaXQodGhpcyk7XG4gICAgY29uc3QgYXJncyA9IHRoaXMudmlzaXRBbGwoYXN0LmFyZ3MpO1xuICAgIGlmIChyZWNlaXZlciAhPT0gYXN0LnJlY2VpdmVyIHx8IGFyZ3MgIT09IGFzdC5hcmdzKSB7XG4gICAgICByZXR1cm4gbmV3IENhbGwoYXN0LnNwYW4sIGFzdC5zb3VyY2VTcGFuLCByZWNlaXZlciwgYXJncywgYXN0LmFyZ3VtZW50U3Bhbik7XG4gICAgfVxuICAgIHJldHVybiBhc3Q7XG4gIH1cblxuICB2aXNpdFF1b3RlKGFzdDogUXVvdGUsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgcmV0dXJuIGFzdDtcbiAgfVxuXG4gIHZpc2l0U2FmZUtleWVkUmVhZChhc3Q6IFNhZmVLZXllZFJlYWQsIGNvbnRleHQ6IGFueSk6IEFTVCB7XG4gICAgY29uc3Qgb2JqID0gYXN0LnJlY2VpdmVyLnZpc2l0KHRoaXMpO1xuICAgIGNvbnN0IGtleSA9IGFzdC5rZXkudmlzaXQodGhpcyk7XG4gICAgaWYgKG9iaiAhPT0gYXN0LnJlY2VpdmVyIHx8IGtleSAhPT0gYXN0LmtleSkge1xuICAgICAgcmV0dXJuIG5ldyBTYWZlS2V5ZWRSZWFkKGFzdC5zcGFuLCBhc3Quc291cmNlU3Bhbiwgb2JqLCBrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gYXN0O1xuICB9XG59XG5cbi8vIEJpbmRpbmdzXG5cbmV4cG9ydCBjbGFzcyBQYXJzZWRQcm9wZXJ0eSB7XG4gIHB1YmxpYyByZWFkb25seSBpc0xpdGVyYWw6IGJvb2xlYW47XG4gIHB1YmxpYyByZWFkb25seSBpc0FuaW1hdGlvbjogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBleHByZXNzaW9uOiBBU1RXaXRoU291cmNlLCBwdWJsaWMgdHlwZTogUGFyc2VkUHJvcGVydHlUeXBlLFxuICAgICAgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbiwgcmVhZG9ubHkga2V5U3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgcHVibGljIHZhbHVlU3BhbjogUGFyc2VTb3VyY2VTcGFufHVuZGVmaW5lZCkge1xuICAgIHRoaXMuaXNMaXRlcmFsID0gdGhpcy50eXBlID09PSBQYXJzZWRQcm9wZXJ0eVR5cGUuTElURVJBTF9BVFRSO1xuICAgIHRoaXMuaXNBbmltYXRpb24gPSB0aGlzLnR5cGUgPT09IFBhcnNlZFByb3BlcnR5VHlwZS5BTklNQVRJT047XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gUGFyc2VkUHJvcGVydHlUeXBlIHtcbiAgREVGQVVMVCxcbiAgTElURVJBTF9BVFRSLFxuICBBTklNQVRJT05cbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUGFyc2VkRXZlbnRUeXBlIHtcbiAgLy8gRE9NIG9yIERpcmVjdGl2ZSBldmVudFxuICBSZWd1bGFyLFxuICAvLyBBbmltYXRpb24gc3BlY2lmaWMgZXZlbnRcbiAgQW5pbWF0aW9uLFxufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VkRXZlbnQge1xuICAvLyBSZWd1bGFyIGV2ZW50cyBoYXZlIGEgdGFyZ2V0XG4gIC8vIEFuaW1hdGlvbiBldmVudHMgaGF2ZSBhIHBoYXNlXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHRhcmdldE9yUGhhc2U6IHN0cmluZywgcHVibGljIHR5cGU6IFBhcnNlZEV2ZW50VHlwZSxcbiAgICAgIHB1YmxpYyBoYW5kbGVyOiBBU1RXaXRoU291cmNlLCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgcHVibGljIGhhbmRsZXJTcGFuOiBQYXJzZVNvdXJjZVNwYW4sIHJlYWRvbmx5IGtleVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cbn1cblxuLyoqXG4gKiBQYXJzZWRWYXJpYWJsZSByZXByZXNlbnRzIGEgdmFyaWFibGUgZGVjbGFyYXRpb24gaW4gYSBtaWNyb3N5bnRheCBleHByZXNzaW9uLlxuICovXG5leHBvcnQgY2xhc3MgUGFyc2VkVmFyaWFibGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmcsIHB1YmxpYyByZWFkb25seSB2YWx1ZTogc3RyaW5nLFxuICAgICAgcHVibGljIHJlYWRvbmx5IHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbiwgcHVibGljIHJlYWRvbmx5IGtleVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHB1YmxpYyByZWFkb25seSB2YWx1ZVNwYW4/OiBQYXJzZVNvdXJjZVNwYW4pIHt9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdUeXBlIHtcbiAgLy8gQSByZWd1bGFyIGJpbmRpbmcgdG8gYSBwcm9wZXJ0eSAoZS5nLiBgW3Byb3BlcnR5XT1cImV4cHJlc3Npb25cImApLlxuICBQcm9wZXJ0eSxcbiAgLy8gQSBiaW5kaW5nIHRvIGFuIGVsZW1lbnQgYXR0cmlidXRlIChlLmcuIGBbYXR0ci5uYW1lXT1cImV4cHJlc3Npb25cImApLlxuICBBdHRyaWJ1dGUsXG4gIC8vIEEgYmluZGluZyB0byBhIENTUyBjbGFzcyAoZS5nLiBgW2NsYXNzLm5hbWVdPVwiY29uZGl0aW9uXCJgKS5cbiAgQ2xhc3MsXG4gIC8vIEEgYmluZGluZyB0byBhIHN0eWxlIHJ1bGUgKGUuZy4gYFtzdHlsZS5ydWxlXT1cImV4cHJlc3Npb25cImApLlxuICBTdHlsZSxcbiAgLy8gQSBiaW5kaW5nIHRvIGFuIGFuaW1hdGlvbiByZWZlcmVuY2UgKGUuZy4gYFthbmltYXRlLmtleV09XCJleHByZXNzaW9uXCJgKS5cbiAgQW5pbWF0aW9uLFxufVxuXG5leHBvcnQgY2xhc3MgQm91bmRFbGVtZW50UHJvcGVydHkge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB0eXBlOiBCaW5kaW5nVHlwZSwgcHVibGljIHNlY3VyaXR5Q29udGV4dDogU2VjdXJpdHlDb250ZXh0LFxuICAgICAgcHVibGljIHZhbHVlOiBBU1RXaXRoU291cmNlLCBwdWJsaWMgdW5pdDogc3RyaW5nfG51bGwsIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sXG4gICAgICByZWFkb25seSBrZXlTcGFuOiBQYXJzZVNvdXJjZVNwYW58dW5kZWZpbmVkLCBwdWJsaWMgdmFsdWVTcGFuOiBQYXJzZVNvdXJjZVNwYW58dW5kZWZpbmVkKSB7fVxufVxuIl19