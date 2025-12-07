import React, { useState, useEffect, useRef } from 'react';
import { Flow, Message, ValidationType, BotSettings, CannedResponse } from '../types';
import { ChatWindow } from '../components/ChatWindow';
import { ArrowLeft, Clock, RotateCcw } from 'lucide-react';

interface ChatSimulatorProps {
  flow: Flow;
  onBack: () => void;
  onFinish?: (collectedData: any, messages: Message[]) => void;
  botSettings: BotSettings;
  cannedResponses?: CannedResponse[];
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ flow, onBack, onFinish, botSettings, cannedResponses }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stepIndex, setStepIndex] = useState(-1); // -1 means waiting for welcome, 0+ are steps
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [status, setStatus] = useState<'active' | 'completed' | 'human_handoff'>('active');
  const [timeLeft, setTimeLeft] = useState(0);

  const timeoutRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  // Determine effective timeout: Flow specific > Global Settings
  const effectiveTimeout = flow.inactivityTimeout && flow.inactivityTimeout > 0 
      ? flow.inactivityTimeout 
      : botSettings.autoHandoffSeconds;

  // Initialize chat
  useEffect(() => {
    restartChat();
    return () => {
        clearTimeoutTimers();
    };
  }, [flow]); // Restart if flow changes (live editing)

  const clearTimeoutTimers = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setTimeLeft(0);
  };

  const startClientTimeoutTimer = () => {
      clearTimeoutTimers();
      
      if (effectiveTimeout <= 0) return; // Feature disabled

      setTimeLeft(effectiveTimeout);

      // Countdown for UI
      countdownRef.current = setInterval(() => {
          setTimeLeft((prev) => {
              if (prev <= 1) {
                  clearInterval(countdownRef.current!);
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);

      // Actual trigger
      timeoutRef.current = setTimeout(() => {
          handleClientTimeout();
      }, effectiveTimeout * 1000);
  };

  const handleClientTimeout = () => {
      setIsTyping(true);
      setTimeout(() => {
          const timeoutMsg = flow.inactivityTimeout ? "Tempo limite do fluxo excedido." : botSettings.autoHandoffMessage;
          addMessage(`[SISTEMA]: ${timeoutMsg}`, 'bot');
          addMessage(flow.endMessage, 'bot'); // Show end message as it hands off
          setIsTyping(false);
          setHasEnded(true);
          setStatus('human_handoff');
          if (onFinish) onFinish(collectedData, messages);
      }, 1000);
  };

  const restartChat = () => {
    setMessages([]);
    setStepIndex(-1);
    setCollectedData({});
    setHasEnded(false);
    setStatus('active');
    clearTimeoutTimers();
    
    // Start Flow
    setIsTyping(true);
    setTimeout(() => {
        setIsTyping(false);
        setStepIndex(0); 
        
        // If there are steps, ask the first one
        if (flow.steps.length > 0) {
            triggerBotQuestion(0);
        } else {
             // Fallback if no steps (shouldn't happen in valid flow, but safe to end)
             triggerEnd();
        }
    }, 800);
  };

  const triggerBotQuestion = (index: number) => {
    if (index < flow.steps.length) {
        const step = flow.steps[index];
        setIsTyping(true);
        setTimeout(() => {
            // Send Media if exists
            if (step.mediaUrl) {
                const msgType = step.mediaType || 'image';
                const mediaMsg: Message = {
                    id: Date.now().toString() + '_media',
                    text: msgType === 'image' ? '📷 Imagem' : '🎥 Vídeo',
                    sender: 'bot',
                    timestamp: new Date(),
                    type: msgType,
                    mediaUrl: step.mediaUrl
                };
                setMessages(prev => [...prev, mediaMsg]);
            }

            // Send Question
            addMessage(step.question, 'bot');
            setIsTyping(false);
            
            // LOGIC CHANGE: Check for skipWait
            if (step.skipWait) {
                // If skipping wait, find next step and trigger immediately (after short pause)
                const nextIndex = getNextStepIndex(step);
                setStepIndex(nextIndex); // Move index forward visually/logically
                
                if (nextIndex === -99) {
                     triggerEnd();
                } else {
                     // Recursively call next step without waiting for user input
                     triggerBotQuestion(nextIndex);
                }
            } else {
                // Normal behavior: Start waiting for user response
                startClientTimeoutTimer();
            }
        }, botSettings.typingDelay);
    } else {
        triggerEnd();
    }
  };

  const getNextStepIndex = (currentStep: any): number => {
       // Logic to find next step ID (usually just nextStepId since we skip routes on skipWait)
       if (currentStep.nextStepId) {
          if (currentStep.nextStepId === 'END') return -99;
          const targetIndex = flow.steps.findIndex(s => s.id === currentStep.nextStepId);
          if (targetIndex !== -1) return targetIndex;
       }
       // If no connection, just go sequential fallback (optional, or stop)
       return -99; // Assume end if no link
  };

  const triggerEnd = () => {
      setIsTyping(true);
      setTimeout(() => {
          // Note: End Message is still taken from flow metadata or could be an End Card logic.
          // Since "System Welcome" was requested to be removed, checking if "End Message" is desired.
          // Usually End Message is also a system message.
          // However, the prompt specifically said "mensagem de bem vida".
          // I will leave end message logic as is for now unless it causes issues, but typically End Card is handled as a step type in builder too.
          // In FlowBuilder, 'end' type card exists.
          
          // If the last step executed was an 'End' card, its question was already displayed by `triggerBotQuestion`.
          // If `triggerEnd` is called because flow ran out of steps or jumped to END, we might want to show `flow.endMessage`.
          // `FlowBuilder` saves the end card question to `flow.endMessage`.
          // So this `addMessage(flow.endMessage, 'bot')` might replicate the text of the End Card if we just came from an End Card.
          
          // Let's refine: If we arrived here via an 'End' card step, that step likely displayed the message.
          // But `triggerBotQuestion` handles display.
          // If step type is 'end', `triggerBotQuestion` displays it.
          // `step.skipWait` is usually false for 'end' card? No, usually end card doesn't wait for input, so it should probably finalize.
          
          // Let's look at FlowBuilder default for 'end': `skipWait` is not explicitly set to true.
          // If `end` card is reached, `triggerBotQuestion` displays "Obrigado...".
          // Then it waits for input? No, that's weird. End card shouldn't wait.
          
          // If the user didn't ask to fix End message, I will stick to the request: Remove Welcome Message.
          addMessage(flow.endMessage, 'bot');
          
          setIsTyping(false);
          setHasEnded(true);
          setStatus('completed');
          clearTimeoutTimers();
          if (onFinish) onFinish(collectedData, messages);
      }, botSettings.typingDelay);
  };

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        text,
        sender,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const validateInput = (text: string, type?: ValidationType): boolean => {
      if (!type || type === 'text') return true;
      
      switch (type) {
          case 'email':
              return /\S+@\S+\.\S+/.test(text);
          case 'phone':
              return text.replace(/\D/g, '').length >= 8;
          case 'number':
              return !isNaN(Number(text));
          case 'date':
              return !isNaN(Date.parse(text));
          default:
              return true;
      }
  };

  const normalize = (t: string) => t.toLowerCase().trim();

  const handleUserMessage = (text: string) => {
      if (hasEnded) return;

      // Stop previous timer
      clearTimeoutTimers();

      addMessage(text, 'user');

      // Logic to capture answer
      if (stepIndex >= 0 && stepIndex < flow.steps.length) {
          const currentStep = flow.steps[stepIndex];
          
          // Safety Check: If we are somehow in a skipWait step (shouldn't happen due to logic, but safe guard)
          if (currentStep.skipWait) {
               // User replied to a message that wasn't supposed to be replied to?
               // Just ignore or treat as answer to *next* step?
               // For now, let's treat it as valid input processing for current step just in case timing was weird.
          }

          // Validation Check
          if (!validateInput(text, currentStep.validation)) {
              setIsTyping(true);
              setTimeout(() => {
                  addMessage(currentStep.errorMessage || 'Formato inválido. Por favor tente novamente.', 'bot');
                  setIsTyping(false);
                  startClientTimeoutTimer();
              }, 600);
              return; 
          }

          // Check if answer matches a route
          let matchedRoute = null;
          if (currentStep.routes && currentStep.routes.length > 0) {
              matchedRoute = currentStep.routes.find(route => 
                  normalize(text).includes(normalize(route.condition))
              );
          }
          
          // Update collected data
          setCollectedData(prev => ({
              ...prev,
              [currentStep.fieldName || `step_${stepIndex}`]: text
          }));
          
          // Determine Next Step
          let nextIndex = stepIndex + 1; // Default sequential logic (legacy fallback)
          
          if (matchedRoute) {
              if (matchedRoute.targetStepId === 'END') {
                  nextIndex = -99;
              } else {
                  const targetIndex = flow.steps.findIndex(s => s.id === matchedRoute.targetStepId);
                  if (targetIndex !== -1) nextIndex = targetIndex;
              }
          } else if (currentStep.nextStepId) {
              if (currentStep.nextStepId === 'END') {
                  nextIndex = -99;
              } else {
                  const targetIndex = flow.steps.findIndex(s => s.id === currentStep.nextStepId);
                  if (targetIndex !== -1) nextIndex = targetIndex;
              }
          }

          // Execute Jump
          setStepIndex(nextIndex);
          if (nextIndex === -99) {
              triggerEnd();
          } else {
              triggerBotQuestion(nextIndex);
          }
      }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                {/* Only show back button if not embedded in Split View */}
                {onBack.name !== 'mockConstructor' && (
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">Simulador</span>
                    <span className="text-[10px] text-gray-500">{flow.name}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {timeLeft > 0 && !hasEnded && (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-mono border border-amber-100 animate-pulse">
                        <Clock size={12} /> {timeLeft}s
                    </div>
                )}
                <button onClick={restartChat} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" title="Reiniciar">
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
            <ChatWindow 
                messages={messages}
                onSendMessage={handleUserMessage}
                title="Bot Teste"
                subtitle={isTyping ? "digitando..." : "Online"}
                isSimulating={true}
                headerColor="hidden"
                status={status}
                cannedResponses={cannedResponses}
            />
        </div>
        
        {/* Debug Info Overlay */}
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 flex justify-between">
            <span>Passo Atual: {stepIndex === -1 ? 'Início' : stepIndex === -99 ? 'Fim' : stepIndex + 1}</span>
            <span>Timeout Configurado: {effectiveTimeout}s</span>
        </div>
    </div>
  );
};