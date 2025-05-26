import chalk from 'chalk';
import boxen from 'boxen';
export function renderCodeBlock(code, language) {
    const header = language ? chalk.gray(`\n${language}\n`) : '\n';
    const boxedCode = boxen(code, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'gray',
    });
    return header + boxedCode;
}
export function renderError(message) {
    return chalk.red(`\nError: ${message}\n`);
}
export function renderSuccess(message) {
    return chalk.green(`\nSuccess: ${message}\n`);
}
export function renderInfo(message) {
    return chalk.blue(`\nInfo: ${message}\n`);
}
export function renderWarning(message) {
    return chalk.yellow(`\nWarning: ${message}\n`);
}
