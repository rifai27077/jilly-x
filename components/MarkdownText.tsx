import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface MarkdownTextProps {
  children: string;
  style?: TextStyle | TextStyle[];
}

export function MarkdownText({ children, style }: MarkdownTextProps) {
  if (!children) return null;

  // Simple Markdown parser for **bold** and *italic*
  const parseMarkdown = (text: string) => {
    // Regex matches **bold**, *italic*, and regular text chunks
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text key={index} style={{ fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return <Text style={style}>{parseMarkdown(children)}</Text>;
}
