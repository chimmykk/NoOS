#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './components/App.js';
import { login, logout } from './commands/auth.js';
const program = new Command();
program
    .name('shapes-cli')
    .description('Interactive CLI for Shapes API')
    .version('1.0.0');
// Authentication commands
program.addCommand(login);
program.addCommand(logout);
// Default action - start interactive mode
program.action(() => {
    render(_jsx(App, {}));
});
// If no command specified, run interactive mode
if (process.argv.length === 2) {
    render(_jsx(App, {}));
}
else {
    program.parse();
}
