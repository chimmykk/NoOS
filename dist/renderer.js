const outputElement = document.getElementById('output');
const inputElement = document.getElementById('terminal-input');
const form = document.getElementById('terminal-form');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = inputElement.value.trim();
    if (!value) return;

    if (value === '!shape') {
        window.terminal.runShapeCli();
        inputElement.value = '';
        return;
    }

    window.terminal.sendInput(value + '\n');
    inputElement.value = '';
});

window.terminal.onOutput((data) => {
    outputElement.textContent += data;
    outputElement.scrollTop = outputElement.scrollHeight;
});