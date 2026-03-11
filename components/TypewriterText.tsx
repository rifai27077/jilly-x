import React, { useState, useEffect } from 'react';
import { TextStyle } from 'react-native';
import { MarkdownText } from './MarkdownText';

interface TypewriterTextProps {
  text: string;
  delay?: number;
  style?: TextStyle | TextStyle[];
  onComplete?: () => void;
  enabled?: boolean;
}

export function TypewriterText({ text, delay = 15, style, onComplete, enabled = true }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [currentIndex, setCurrentIndex] = useState(enabled ? 0 : text.length);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length) {
      onComplete();
    }
  }, [currentIndex, delay, text, enabled, onComplete]);

  // Reset if text changes
  useEffect(() => {
    if (enabled) {
      setDisplayedText('');
      setCurrentIndex(0);
    } else {
      setDisplayedText(text);
    }
  }, [text, enabled]);

  return <MarkdownText style={style as any}>{displayedText}</MarkdownText>;
}
