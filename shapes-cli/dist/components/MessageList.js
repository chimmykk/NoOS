import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { renderCodeBlock } from '../utils/rendering.js';
export const MessageList = ({ messages, shapeName }) => {
    const getAssistantLabel = () => {
        if (shapeName && shapeName.startsWith('shapesinc/')) {
            const parts = shapeName.split('/');
            return `${parts[1]}:`;
        }
        return shapeName ? `${shapeName}:` : 'Assistant:';
    };
    const renderMessage = (message, index) => {
        const formattedContent = message.content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => renderCodeBlock(code, language));
        return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: message.type === 'user' ? 'green' : message.type === 'system' ? 'magenta' : message.type === 'tool' ? 'yellow' : 'cyan', children: message.type === 'user' ? 'You:' : message.type === 'system' ? 'System:' : message.type === 'tool' ? 'Tool:' : getAssistantLabel() }), _jsx(Box, { marginLeft: 2, children: _jsx(Text, { children: formattedContent }) }), message.tool_calls && message.tool_calls.length > 0 && (_jsx(Box, { marginLeft: 2, marginTop: 1, children: message.tool_calls.map((toolCall, tcIndex) => (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsxs(Text, { color: "yellow", children: ["\uD83D\uDD27 ", toolCall.function.name, "(", toolCall.function.arguments, ")"] }) }, tcIndex))) })), message.images && message.images.length > 0 && (_jsx(Box, { marginLeft: 2, marginTop: 1, children: _jsxs(Text, { color: "gray", children: ["Images: ", message.images.length] }) }))] }, `message-${index}`));
    };
    return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: messages.map((message, index) => renderMessage(message, index)) }));
};
