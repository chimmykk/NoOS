import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import OpenAI from 'openai';
import { getToken, getAuthUrl, clearToken, authenticate, saveToken } from '../utils/auth.js';
import { loadTools } from '../utils/tools.js';
import { loadPlugins } from '../utils/plugins.js';
import { uploadImage, listImageFiles } from '../utils/image.js';
import { ChatInput } from './ChatInput.js';
import { MessageList } from './MessageList.js';
import { renderError } from '../utils/rendering.js';
import { config, initConfig } from '../config.js';
import open from 'open';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
const TOOLS_STATE_FILE = path.join(os.homedir(), '.shapes-cli', 'tools-state.json');
const saveToolsState = async (tools) => {
    try {
        const dir = path.dirname(TOOLS_STATE_FILE);
        await fs.mkdir(dir, { recursive: true });
        const toolsState = tools.reduce((acc, tool) => {
            acc[tool.name] = tool.enabled;
            return acc;
        }, {});
        await fs.writeFile(TOOLS_STATE_FILE, JSON.stringify(toolsState), 'utf-8');
    }
    catch (error) {
        // Ignore save errors to not break the app
        console.warn('Failed to save tools state:', error);
    }
};
const loadToolsState = async () => {
    try {
        const data = await fs.readFile(TOOLS_STATE_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        // Return empty state if file doesn't exist or is invalid
        return {};
    }
};
export const App = () => {
    const { stdout } = useStdout();
    const [messages, setMessages] = useState([]);
    const [client, setClient] = useState(null);
    const [tools, setTools] = useState([]);
    const [images, setImages] = useState([]);
    const [availableTools, setAvailableTools] = useState([]);
    const [shapeName, setShapeName] = useState('');
    const [authStatus, setAuthStatus] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [error, setError] = useState(null);
    const [inputMode, setInputMode] = useState('normal');
    const terminalHeight = stdout?.rows || 24;
    const terminalWidth = stdout?.columns || 80;
    useEffect(() => {
        const initialize = async () => {
            try {
                // Initialize config with auto-discovered endpoints
                const discoveredConfig = await initConfig();
                // Check for API key or user authentication
                const token = await getToken();
                if (!discoveredConfig.apiKey && !token) {
                    setError('No API key configured and not authenticated. Please set SHAPESINC_API_KEY or use /login to authenticate.');
                    return;
                }
                // Create client with API key or user authentication
                const clientConfig = {
                    apiKey: discoveredConfig.apiKey,
                    baseURL: discoveredConfig.apiUrl,
                    defaultHeaders: {
                        'X-App-ID': discoveredConfig.appId,
                    },
                };
                // Add user auth header if available
                if (token) {
                    clientConfig.defaultHeaders['X-User-Auth'] = token;
                }
                const shapesClient = new OpenAI(clientConfig);
                setClient(shapesClient);
                // Set shape name, auth status, and endpoint
                setShapeName(discoveredConfig.model);
                if (token) {
                    setAuthStatus(`Authenticated (${token.slice(-4)})`);
                }
                else {
                    setAuthStatus('API Key');
                }
                setEndpoint(discoveredConfig.apiUrl);
                // Load tools and plugins
                const [loadedTools] = await Promise.all([
                    loadTools(),
                    loadPlugins(),
                ]);
                setTools(loadedTools);
                // Initialize test tools with saved state
                const savedToolsState = await loadToolsState();
                const testTools = [
                    {
                        name: 'ping',
                        description: 'Simple ping tool that returns pong',
                        parameters: {
                            type: 'object',
                            properties: {},
                            required: []
                        },
                        enabled: savedToolsState['ping'] ?? false
                    },
                    {
                        name: 'echo',
                        description: 'Echo tool that returns the input message',
                        parameters: {
                            type: 'object',
                            properties: {
                                message: { type: 'string', description: 'Message to echo' }
                            },
                            required: ['message']
                        },
                        enabled: savedToolsState['echo'] ?? false
                    }
                ];
                setAvailableTools(testTools);
            }
            catch (err) {
                setError(err.message);
            }
        };
        initialize();
    }, []);
    const handleSendMessage = async (content, messageImages) => {
        // Handle awaiting auth token
        if (inputMode === 'awaiting_auth') {
            await handleAuthCode(content);
            return;
        }
        // Handle slash commands
        if (content.startsWith('/')) {
            await handleSlashCommand(content.slice(1));
            return;
        }
        if (!client) {
            const systemMessage = {
                type: 'system',
                content: 'No API key configured and not authenticated. Please set SHAPESINC_API_KEY or use /login to authenticate.'
            };
            setMessages(prev => [...prev, systemMessage]);
            return;
        }
        // Use current images state if no specific images provided
        const currentImageUrls = images.map(img => img.dataUrl);
        const currentImages = messageImages || currentImageUrls;
        const userMessage = { type: 'user', content, images: currentImages };
        setMessages(prev => [...prev, userMessage]);
        // Clear images after sending
        setImages([]);
        try {
            // Prepare message content - text only or multimodal with images
            let messageContent;
            if (currentImages.length > 0) {
                messageContent = [
                    { type: "text", text: content },
                    ...currentImages.map(img => ({
                        type: "image_url",
                        image_url: { url: img }
                    }))
                ];
            }
            else {
                messageContent = content;
            }
            // Prepare the request with tools and plugins
            const request = {
                model: config.model,
                messages: [
                    ...messages.filter(msg => msg.type !== 'system' && msg.type !== 'tool').map(msg => {
                        if (msg.type === 'user' && msg.images && msg.images.length > 0) {
                            return {
                                role: 'user',
                                content: [
                                    { type: "text", text: msg.content },
                                    ...msg.images.map(img => ({
                                        type: "image_url",
                                        image_url: { url: img }
                                    }))
                                ]
                            };
                        }
                        else {
                            return {
                                role: msg.type === 'user' ? 'user' : 'assistant',
                                content: msg.content,
                            };
                        }
                    }),
                    { role: 'user', content: messageContent },
                ],
                tools: availableTools.filter(t => t.enabled).map(tool => ({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    },
                })),
            };
            const response = await client.chat.completions.create(request);
            // Check for tool calls
            if (response.choices?.[0]?.message?.tool_calls) {
                const toolCalls = response.choices[0].message.tool_calls;
                // Add assistant message with tool calls
                const assistantMessage = {
                    type: 'assistant',
                    content: response.choices[0]?.message?.content || '',
                    tool_calls: toolCalls
                };
                setMessages(prev => [...prev, assistantMessage]);
                // Process each tool call
                const toolResults = [];
                for (const toolCall of toolCalls) {
                    const result = await handleToolCall(toolCall);
                    toolResults.push({
                        type: 'tool',
                        content: result,
                        tool_call_id: toolCall.id
                    });
                }
                // Add tool result messages
                setMessages(prev => [...prev, ...toolResults]);
                // Make second API call with tool results
                const updatedMessages = [
                    ...messages.filter(msg => msg.type !== 'system' && msg.type !== 'tool').map(msg => {
                        if (msg.type === 'user' && msg.images && msg.images.length > 0) {
                            return {
                                role: 'user',
                                content: [
                                    { type: "text", text: msg.content },
                                    ...msg.images.map(img => ({
                                        type: "image_url",
                                        image_url: { url: img }
                                    }))
                                ]
                            };
                        }
                        else {
                            return {
                                role: msg.type === 'user' ? 'user' : 'assistant',
                                content: msg.content,
                            };
                        }
                    }),
                    { role: 'user', content: messageContent },
                    {
                        role: 'assistant',
                        content: response.choices[0]?.message?.content || '',
                        tool_calls: toolCalls.map(tc => ({
                            id: tc.id,
                            type: tc.type,
                            function: {
                                name: tc.function.name,
                                arguments: tc.function.arguments,
                            },
                        }))
                    },
                    ...toolResults.map(tr => ({
                        role: 'tool',
                        content: tr.content,
                        tool_call_id: tr.tool_call_id
                    }))
                ];
                const secondResponse = await client.chat.completions.create({
                    model: config.model,
                    messages: updatedMessages,
                    tools: availableTools.filter(t => t.enabled).map(tool => ({
                        type: 'function',
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters,
                        },
                    })),
                });
                // Check if second response also has tool calls
                if (secondResponse.choices?.[0]?.message?.tool_calls) {
                    const secondToolCalls = secondResponse.choices[0].message.tool_calls;
                    // Add assistant message with second tool calls
                    const secondAssistantMessage = {
                        type: 'assistant',
                        content: secondResponse.choices[0]?.message?.content || '',
                        tool_calls: secondToolCalls
                    };
                    setMessages(prev => [...prev, secondAssistantMessage]);
                    // Process second set of tool calls
                    const secondToolResults = [];
                    for (const toolCall of secondToolCalls) {
                        const result = await handleToolCall(toolCall);
                        secondToolResults.push({
                            type: 'tool',
                            content: result,
                            tool_call_id: toolCall.id
                        });
                    }
                    // Add second tool result messages
                    setMessages(prev => [...prev, ...secondToolResults]);
                    // Make third API call with second tool results
                    const finalMessages = [
                        ...updatedMessages,
                        {
                            role: 'assistant',
                            content: secondResponse.choices[0]?.message?.content || '',
                            tool_calls: secondToolCalls.map(tc => ({
                                id: tc.id,
                                type: tc.type,
                                function: {
                                    name: tc.function.name,
                                    arguments: tc.function.arguments,
                                },
                            }))
                        },
                        ...secondToolResults.map(tr => ({
                            role: 'tool',
                            content: tr.content,
                            tool_call_id: tr.tool_call_id
                        }))
                    ];
                    const thirdResponse = await client.chat.completions.create({
                        model: config.model,
                        messages: finalMessages,
                        tools: availableTools.filter(t => t.enabled).map(tool => ({
                            type: 'function',
                            function: {
                                name: tool.name,
                                description: tool.description,
                                parameters: tool.parameters,
                            },
                        })),
                    });
                    const finalMessage = {
                        type: 'assistant',
                        content: thirdResponse.choices[0]?.message?.content || '',
                    };
                    setMessages(prev => [...prev, finalMessage]);
                }
                else {
                    // No more tool calls, add the final message
                    const finalMessage = {
                        type: 'assistant',
                        content: secondResponse.choices[0]?.message?.content || '',
                    };
                    setMessages(prev => [...prev, finalMessage]);
                }
            }
            else {
                // No tool calls, just add the assistant message
                const assistantMessage = {
                    type: 'assistant',
                    content: response.choices[0]?.message?.content || '',
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleToolCall = async (toolCall) => {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            switch (toolCall.function.name) {
                case 'ping':
                    return 'pong';
                case 'echo':
                    return args.message || 'No message provided';
                default:
                    return `Unknown tool: ${toolCall.function.name}`;
            }
        }
        catch (error) {
            return `Error executing tool ${toolCall.function.name}: ${error.message}`;
        }
    };
    const handleSlashCommand = async (command) => {
        const [cmd, ...args] = command.split(' ');
        switch (cmd.toLowerCase()) {
            case 'login':
                await handleLogin();
                break;
            case 'logout':
                await handleLogout();
                break;
            case 'exit':
            case 'quit':
                process.exit(0);
                break;
            case 'image': {
                const [, filename] = command.split(' ', 2);
                try {
                    const result = await uploadImage(filename);
                    setImages(prev => [...prev, { dataUrl: result.dataUrl, filename: result.filename, size: result.size }]);
                    const sizeKB = Math.round(result.size / 1024);
                    const totalImages = images.length + 1;
                    const imageMessage = {
                        type: 'system',
                        content: `Image uploaded: "${result.filename}" (${sizeKB}KB) - ${totalImages} image${totalImages > 1 ? 's' : ''} queued for next message.`
                    };
                    setMessages(prev => [...prev, imageMessage]);
                }
                catch (error) {
                    const errorMessage = {
                        type: 'system',
                        content: `Failed to upload image: ${error.message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'images': {
                try {
                    const imageFiles = await listImageFiles();
                    let content = '';
                    // Show queued images first
                    if (images.length > 0) {
                        const queuedList = images.map((img, i) => `  ${i + 1}. ${img.filename} (${Math.round(img.size / 1024)}KB)`).join('\n');
                        content += `Queued for next message (${images.length}):\n${queuedList}\n\n`;
                    }
                    // Show available files in directory
                    if (imageFiles.length > 0) {
                        const availableList = imageFiles.map(file => `  • ${file}`).join('\n');
                        content += `Available in current directory:\n${availableList}`;
                    }
                    else {
                        content += 'No image files found in current directory.';
                    }
                    if (images.length === 0 && imageFiles.length === 0) {
                        content = 'No images queued and no image files found in current directory.';
                    }
                    content += '\n\nUse "/image <filename>" to upload a file, or "/image" to upload the first available file.';
                    const listMessage = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, listMessage]);
                }
                catch (error) {
                    const errorMessage = {
                        type: 'system',
                        content: `Failed to list images: ${error.message}`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
                break;
            }
            case 'clear': {
                const clearedCount = images.length;
                setImages([]);
                const clearMessage = {
                    type: 'system',
                    content: clearedCount > 0 ? `Cleared ${clearedCount} queued image${clearedCount > 1 ? 's' : ''}.` : 'No images to clear.'
                };
                setMessages(prev => [...prev, clearMessage]);
                break;
            }
            case 'tools': {
                if (args.length === 0) {
                    // List all tools
                    const enabledCount = availableTools.filter(t => t.enabled).length;
                    let content = `Available tools (${enabledCount} enabled):\n`;
                    if (availableTools.length === 0) {
                        content += 'No tools available.';
                    }
                    else {
                        availableTools.forEach(tool => {
                            const status = tool.enabled ? '✓' : '○';
                            content += `  ${status} ${tool.name} - ${tool.description}\n`;
                        });
                    }
                    content += '\nUse "/tools:enable <name>" to enable a tool or "/tools:disable <name>" to disable it.';
                    const toolsMessage = {
                        type: 'system',
                        content
                    };
                    setMessages(prev => [...prev, toolsMessage]);
                }
                break;
            }
            case 'tools:enable': {
                const toolName = args[0];
                if (!toolName) {
                    const errorMessage = {
                        type: 'system',
                        content: 'Please specify a tool name. Use "/tools" to see available tools.'
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }
                const toolIndex = availableTools.findIndex(t => t.name === toolName);
                if (toolIndex === -1) {
                    const errorMessage = {
                        type: 'system',
                        content: `Tool "${toolName}" not found. Use "/tools" to see available tools.`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }
                const updatedTools = [...availableTools];
                updatedTools[toolIndex].enabled = true;
                setAvailableTools(updatedTools);
                // Save state to disk
                await saveToolsState(updatedTools);
                const successMessage = {
                    type: 'system',
                    content: `Tool "${toolName}" enabled.`
                };
                setMessages(prev => [...prev, successMessage]);
                break;
            }
            case 'tools:disable': {
                const toolName = args[0];
                if (!toolName) {
                    const errorMessage = {
                        type: 'system',
                        content: 'Please specify a tool name. Use "/tools" to see available tools.'
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }
                const toolIndex = availableTools.findIndex(t => t.name === toolName);
                if (toolIndex === -1) {
                    const errorMessage = {
                        type: 'system',
                        content: `Tool "${toolName}" not found. Use "/tools" to see available tools.`
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    break;
                }
                const updatedTools = [...availableTools];
                updatedTools[toolIndex].enabled = false;
                setAvailableTools(updatedTools);
                // Save state to disk
                await saveToolsState(updatedTools);
                const successMessage = {
                    type: 'system',
                    content: `Tool "${toolName}" disabled.`
                };
                setMessages(prev => [...prev, successMessage]);
                break;
            }
            case 'help': {
                const helpMessage = {
                    type: 'system',
                    content: 'Available commands:\n/login - Authenticate with Shapes API\n/logout - Clear authentication token\n/images - List available image files\n/image [filename] - Upload an image (specify filename or auto-select first)\n/clear - Clear uploaded images\n/tools - List available tools\n/tools:enable <name> - Enable a tool\n/tools:disable <name> - Disable a tool\n/exit - Exit the application\n/help - Show this help message'
                };
                setMessages(prev => [...prev, helpMessage]);
                break;
            }
            default: {
                const unknownMessage = {
                    type: 'system',
                    content: `Unknown command: /${cmd}. Type /help for available commands.`
                };
                setMessages(prev => [...prev, unknownMessage]);
                break;
            }
        }
    };
    const handleLogin = async () => {
        try {
            const authUrl = await getAuthUrl();
            const loginMessage = {
                type: 'system',
                content: `Opening browser for authentication...\nAuth URL: ${authUrl}\n\nAfter authorizing, please enter the code you receive:`
            };
            setMessages(prev => [...prev, loginMessage]);
            await open(authUrl);
            // Switch to auth code input mode
            setInputMode('awaiting_auth');
        }
        catch (err) {
            const errorMessage = {
                type: 'system',
                content: `Authentication failed: ${err.message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };
    const handleAuthCode = async (code) => {
        try {
            const token = await authenticate(code);
            await saveToken(token);
            // Update auth status
            setAuthStatus(`Authenticated (${token.slice(-4)})`);
            // Re-initialize client with new token
            const discoveredConfig = await initConfig();
            const clientConfig = {
                apiKey: discoveredConfig.apiKey,
                baseURL: discoveredConfig.apiUrl,
                defaultHeaders: {
                    'X-App-ID': discoveredConfig.appId,
                    'X-User-Auth': token,
                },
            };
            const shapesClient = new OpenAI(clientConfig);
            setClient(shapesClient);
            const successMessage = {
                type: 'system',
                content: 'Successfully authenticated!'
            };
            setMessages(prev => [...prev, successMessage]);
            // Return to normal input mode
            setInputMode('normal');
        }
        catch (err) {
            const errorMessage = {
                type: 'system',
                content: `Authentication failed: ${err.message}`
            };
            setMessages(prev => [...prev, errorMessage]);
            // Return to normal input mode on error
            setInputMode('normal');
        }
    };
    const handleLogout = async () => {
        try {
            const currentToken = await getToken();
            if (!currentToken) {
                const notAuthMessage = {
                    type: 'system',
                    content: 'Not currently authenticated.'
                };
                setMessages(prev => [...prev, notAuthMessage]);
                return;
            }
            await clearToken();
            setClient(null);
            const logoutMessage = {
                type: 'system',
                content: 'Successfully logged out! You can use /login to authenticate again.'
            };
            setMessages(prev => [...prev, logoutMessage]);
        }
        catch (err) {
            const errorMessage = {
                type: 'system',
                content: `Logout failed: ${err.message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };
    if (error) {
        return (_jsx(Box, { height: terminalHeight, flexDirection: "column", justifyContent: "center", alignItems: "center", children: _jsx(Text, { children: renderError(error) }) }));
    }
    // Reserve 3 lines for input (1 for input box + 1 for status + 1 for spacing)
    const messageAreaHeight = Math.max(1, terminalHeight - 3);
    return (_jsxs(Box, { height: terminalHeight, width: terminalWidth, flexDirection: "column", children: [_jsx(Box, { height: messageAreaHeight, flexDirection: "column", overflow: "hidden", children: _jsx(MessageList, { messages: messages, shapeName: shapeName }) }), _jsx(Box, { flexShrink: 0, children: _jsx(ChatInput, { onSend: handleSendMessage, images: images, enabledToolsCount: availableTools.filter(t => t.enabled).length, shapeName: shapeName, authStatus: authStatus, endpoint: endpoint, terminalWidth: terminalWidth, inputMode: inputMode, onEscape: () => {
                        if (inputMode === 'awaiting_auth') {
                            setInputMode('normal');
                            const cancelMessage = {
                                type: 'system',
                                content: 'Authentication cancelled.'
                            };
                            setMessages(prev => [...prev, cancelMessage]);
                        }
                    } }) })] }));
};
