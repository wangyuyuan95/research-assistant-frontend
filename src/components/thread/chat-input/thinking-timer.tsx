import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ThinkingTimerProps {
  isThinking: boolean;
}

export const ThinkingTimer: React.FC<ThinkingTimerProps> = ({ isThinking }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevThinkingRef = useRef<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Reset timer when thinking starts after being stopped
    if (isThinking && !prevThinkingRef.current) {
      setElapsedTime(0);
    }
    prevThinkingRef.current = isThinking;

    if (isThinking) {
      // Start or continue timer
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [isThinking]);

  // Reset timer when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Don't show anything until we have some elapsed time
  if (elapsedTime === 0) return null;

  const hours = Math.floor(elapsedTime / 3600000);
  const minutes = Math.floor((elapsedTime % 3600000) / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);

  let timeString = '';
  if (hours > 0) {
    timeString = t('chat.thinkingTime', { hours, minutes, seconds });
  } else if (minutes > 0) {
    timeString = t('chat.thinkingTimeMinutes', { minutes, seconds });
  } else {
    timeString = t('chat.thinkingTimeSeconds', { seconds });
  }

  return <span>{timeString}</span>;
}; 