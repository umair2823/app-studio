document.addEventListener('DOMContentLoaded', () => {

    const calculator = document.getElementById('calculator');
    const expressionEl = document.getElementById('expression');
    const resultEl = document.getElementById('result');
    const modeTag = document.getElementById('mode-tag');
    const themeToggle = document.getElementById('theme-toggle');
    const csrfInput = document.querySelector('input[name=csrfmiddlewaretoken]');

    let expression = '';

    // ---- Screen rendering ----

    function renderExpression() {
        expressionEl.textContent = expression;
    }

    function showResult(text, isError) {
        resultEl.textContent = text;
        resultEl.classList.toggle('is-error', !!isError);
    }

    function clearResult() {
        resultEl.textContent = '';
        resultEl.classList.remove('is-error');
    }

    // ---- Insert / action handling ----

    function insertValue(value) {
        expression += value;
        renderExpression();
        clearResult();
    }

    function handleAction(action) {
        switch (action) {
            case 'clear':
                expression = '';
                renderExpression();
                clearResult();
                break;

            case 'clear-entry':
                expression = '';
                renderExpression();
                break;

            case 'backspace':
                expression = expression.slice(0, -1);
                renderExpression();
                break;

            case 'mode':
                toggleMode();
                break;

            case 'evaluate':
                evaluateExpression();
                break;
        }
    }

    function toggleMode() {
        const current = calculator.getAttribute('data-mode');
        const next = current === 'deg' ? 'rad' : 'deg';
        calculator.setAttribute('data-mode', next);
        modeTag.textContent = next.toUpperCase();
    }

    // ---- Evaluate (backend call) ----

    async function evaluateExpression() {
        if (!expression.trim()) {
            return;
        }

        const mode = calculator.getAttribute('data-mode') || 'deg';

        try {
            const response = await fetch('evaluate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfInput.value,
                },
                body: new URLSearchParams({
                    expression: expression,
                    mode: mode,
                }),
            });

            const data = await response.json();

            if (data.ok) {
                showResult(data.result, false);
            } else {
                showResult(data.error, true);
            }
        } catch (err) {
            showResult('Network error. Please try again.', true);
        }
    }

    // ---- Button click wiring ----

    calculator.addEventListener('click', (event) => {
        const target = event.target.closest('[data-insert], [data-action]');
        if (!target) return;

        if (target.hasAttribute('data-insert')) {
            insertValue(target.getAttribute('data-insert'));
        } else if (target.hasAttribute('data-action')) {
            handleAction(target.getAttribute('data-action'));
        }
    });

    // ---- Theme toggle ----

    function applyTheme(theme) {
        calculator.setAttribute('data-theme', theme);
    }

    themeToggle.addEventListener('click', () => {
        const current = calculator.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('calc-theme', next);
    });

    const savedTheme = localStorage.getItem('calc-theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }

    // ---- Keyboard support ----

    document.addEventListener('keydown', (event) => {
        const key = event.key;

        if (/^[0-9]$/.test(key)) {
            insertValue(key);
            return;
        }

        if ('+-*/().'.includes(key)) {
            insertValue(key);
            return;
        }

        if (key === 'Enter') {
            event.preventDefault();
            evaluateExpression();
            return;
        }

        if (key === 'Backspace') {
            handleAction('backspace');
            return;
        }

        if (key === 'Escape') {
            handleAction('clear');
            return;
        }
    });

    // ---- Initial render ----
    renderExpression();
});
