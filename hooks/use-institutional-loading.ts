"use client";

import { useState, useEffect } from "react";

interface UseInstitutionalLoadingOptions {
  initialLoading?: boolean;
  autoHideDelay?: number;
  messages?: string[];
}

export function useInstitutionalLoading({
  initialLoading = true,
  autoHideDelay = 0,
  messages = ["Carregando sistema..."]
}: UseInstitutionalLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (autoHideDelay > 0 && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isLoading, autoHideDelay]);

  useEffect(() => {
    if (isLoading && messages.length > 1) {
      const messageTimer = setInterval(() => {
        setMessageIndex(prev => {
          const nextIndex = (prev + 1) % messages.length;
          setCurrentMessage(messages[nextIndex]);
          return nextIndex;
        });
      }, 1500);

      return () => clearInterval(messageTimer);
    }
  }, [isLoading, messages]);

  const showLoading = () => {
    setIsLoading(true);
    setMessageIndex(0);
    setCurrentMessage(messages[0]);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    currentMessage,
    showLoading,
    hideLoading,
    setIsLoading
  };
}