import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
export const ChatInput = ({ onSend, images, enabledToolsCount, shapeName, authStatus, endpoint, terminalWidth, inputMode = 'normal', onEscape }) => {
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useInput((input, key) => {
        if (key.escape && inputMode === 'awaiting_auth' && onEscape) {
            onEscape();
        }
    });
    const handleSubmit = () => {
        if (input.trim() && !isSubmitting) {
            setIsSubmitting(true);
            const imageUrls = images.map(img => img.dataUrl);
            onSend(input, images.length > 0 ? imageUrls : undefined);
            setInput('');
            // Reset submitting state after a brief delay
            setTimeout(() => setIsSubmitting(false), 100);
        }
    };
    const renderShapeName = () => {
        if (shapeName.startsWith('shapesinc/')) {
            const parts = shapeName.split('/');
            return (_jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "shapesinc/" }), _jsx(Text, { color: "cyan", children: parts[1] })] }));
        }
        return _jsx(Text, { color: "cyan", children: shapeName });
    };
    const getAuthColor = () => {
        return authStatus.startsWith('Authenticated') ? 'green' : 'yellow';
    };
    const getEndpointInfo = () => {
        const isProduction = endpoint.includes('api.shapes.inc');
        const displayUrl = isProduction ? 'prod' : endpoint.replace(/^https?:\/\//, '');
        const color = isProduction ? 'green' : 'yellow';
        return { displayUrl, color };
    };
    return (_jsxs(Box, { flexDirection: "column", width: terminalWidth, children: [_jsx(Box, { borderStyle: "round", borderColor: "blue", width: terminalWidth, children: _jsxs(Box, { width: "100%", paddingX: 1, children: [_jsx(Text, { color: "green", children: "\u276F " }), _jsx(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: inputMode === 'awaiting_auth' ? 'Enter authorization code (ESC to cancel)...' : 'Type your message or use /help for commands...' })] }) }), _jsxs(Box, { width: terminalWidth, paddingX: 2, justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "Shape: " }), renderShapeName(), images.length > 0 && (_jsxs(Text, { color: "yellow", children: [" | Images: ", images.length] })), enabledToolsCount > 0 && (_jsxs(Text, { color: "green", children: [" | Tools: ", enabledToolsCount] }))] }), _jsxs(Box, { children: [_jsx(Text, { color: getAuthColor(), children: authStatus }), _jsx(Text, { color: "gray", children: " | " }), _jsx(Text, { color: getEndpointInfo().color, children: getEndpointInfo().displayUrl })] })] })] }));
};
