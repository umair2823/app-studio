import ast
import math

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST


def index(request):
    return render(request, 'calculator/index.html')


# ---- Safe math evaluator ---------------------------------------------

_ALLOWED_FUNCS = {
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'asin': math.asin,
    'acos': math.acos,
    'atan': math.atan,
    'sqrt': math.sqrt,
    'log': math.log10,
    'ln': math.log,
    'exp': math.exp,
    'abs': abs,
    'factorial': math.factorial,
}

_TRIG_FUNCS = {'sin', 'cos', 'tan'}
_INVERSE_TRIG_FUNCS = {'asin', 'acos', 'atan'}

_ALLOWED_CONSTANTS = {
    'pi': math.pi,
    'e': math.e,
}

_ALLOWED_BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.Pow)
_ALLOWED_UNARYOPS = (ast.UAdd, ast.USub)


class CalcError(Exception):
    """Raised for any problem we want to show the user as a friendly message."""
    pass


def _safe_eval(node, mode):
    if isinstance(node, ast.Expression):
        return _safe_eval(node.body, mode)

    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise CalcError("Invalid value in expression.")

    if isinstance(node, ast.Name):
        if node.id in _ALLOWED_CONSTANTS:
            return _ALLOWED_CONSTANTS[node.id]
        raise CalcError(f"Unknown name: {node.id}")

    if isinstance(node, ast.BinOp):
        if not isinstance(node.op, _ALLOWED_BINOPS):
            raise CalcError("That operation isn't allowed.")
        left = _safe_eval(node.left, mode)
        right = _safe_eval(node.right, mode)
        try:
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
            if isinstance(node.op, ast.Mod):
                return left % right
            if isinstance(node.op, ast.Pow):
                return left ** right
        except ZeroDivisionError:
            raise CalcError("Cannot divide by zero.")
        except OverflowError:
            raise CalcError("Result is too large.")

    if isinstance(node, ast.UnaryOp):
        if not isinstance(node.op, _ALLOWED_UNARYOPS):
            raise CalcError("That operation isn't allowed.")
        val = _safe_eval(node.operand, mode)
        return val if isinstance(node.op, ast.UAdd) else -val

    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name):
            raise CalcError("Invalid function call.")
        fname = node.func.id
        if fname not in _ALLOWED_FUNCS:
            raise CalcError(f"Unknown function: {fname}")
        if node.keywords:
            raise CalcError("Invalid function call.")
        args = [_safe_eval(arg, mode) for arg in node.args]
        if len(args) != 1:
            raise CalcError(f"{fname}() takes exactly 1 argument.")
        arg = args[0]

        try:
            if mode == 'deg' and fname in _TRIG_FUNCS:
                arg = math.radians(arg)
                return _ALLOWED_FUNCS[fname](arg)
            if fname in _INVERSE_TRIG_FUNCS:
                result = _ALLOWED_FUNCS[fname](arg)
                return math.degrees(result) if mode == 'deg' else result
            if fname == 'factorial':
                if arg < 0 or arg != int(arg):
                    raise CalcError("factorial() needs a non-negative whole number.")
                return math.factorial(int(arg))
            return _ALLOWED_FUNCS[fname](arg)
        except ValueError:
            raise CalcError(f"Invalid input for {fname}().")
        except OverflowError:
            raise CalcError("Result is too large.")

    raise CalcError("Invalid expression.")


def safe_calculate(expression, mode):
    expression = expression.strip()
    if not expression:
        raise CalcError("Nothing to calculate.")

    replacements = {
        '×': '*',
        '÷': '/',
        '^': '**',
        'π': 'pi',
    }
    for old, new in replacements.items():
        expression = expression.replace(old, new)

    try:
        tree = ast.parse(expression, mode='eval')
    except SyntaxError:
        raise CalcError("Invalid expression.")

    result = _safe_eval(tree, mode)

    if isinstance(result, complex):
        raise CalcError("Result is not a real number.")
    if isinstance(result, float) and (math.isnan(result) or math.isinf(result)):
        raise CalcError("Result is undefined.")

    return result


# ---- View ---------------------------------------------------------------

@require_POST
def evaluate(request):
    expression = request.POST.get('expression', '')
    mode = request.POST.get('mode', 'deg')

    if mode not in ('deg', 'rad'):
        mode = 'deg'

    try:
        result = safe_calculate(expression, mode)
        return JsonResponse({'ok': True, 'result': result})
    except CalcError as e:
        return JsonResponse({'ok': False, 'error': str(e)})
    except ZeroDivisionError:
        return JsonResponse({'ok': False, 'error': 'Cannot divide by zero.'})
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Something went wrong with that expression.'})