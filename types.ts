

export type Sender = 'bot' | 'user' | 'agent' | 'system';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document';

export type UserRole = 'admin' | 'user';

export interface UserSubscription {
    planId: string;
    status: 'trial' | 'active' | 'expired' | 'canceled';
    expiresAt: Date;
    startDate: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  nickname?: string;
  about?: string;
  phoneNumber?: string;
  status?: 'online' | 'busy' | 'offline';
  color?: string;
  subscription?: UserSubscription; // New Subscription Field
  tourCompleted?: boolean; // Track if tour is done
  ownerId?: string; // ID of the account owner (if this user is an employee)
}

export interface Contact {
    id: string; // chatdId (e.g., 551199999999@c.us)
    name: string;
    type: 'user' | 'group' | 'broadcast';
    contactName?: string;
}

export interface TagDefinition {
    id: string;
    name: string;
    color: string;
}

export interface CannedResponse {
    id: string;
    label: string;
    text: string;
}

export interface SuperRobotAction {
    changeStatus?: 'human_handoff' | 'active' | 'in_progress' | 'completed';
    addTags?: string[];
    removeTags?: string[];
}

export interface SuperRobotItem {
    id: string;
    name: string;
    price?: string;
    description?: string;
}

export interface SuperRobotTrigger {
    id: string;
    keywords: string[]; // OR logic (any of these)
    requiredWords?: string[]; // AND logic (must contain all of these)
    excludedWords?: string[]; // NOT logic (must not contain any of these)
    response: string;
    isActive: boolean;
    matchType?: 'contains' | 'exact';
    // New Logic Features
    useFuzzyMatch?: boolean; // Enable Levenshtein distance
    mediaUrl?: string; // Send media
    mediaType?: MessageType;
    actions?: SuperRobotAction; // Side effects
    items?: SuperRobotItem[]; // Dynamic list of products
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  type?: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  scheduledTime?: Date;
  isScheduled?: boolean;
  replyTo?: Message;
}

export type ValidationType = 'text' | 'email' | 'phone' | 'number' | 'date';

export interface FlowRoute {
    id: string;
    condition: string; // The answer keyword (e.g., "sim", "não")
    targetStepId: string; // Where to go
}

// Updated StepType with new cards
export type StepType = 'welcome' | 'name' | 'email' | 'phone' | 'date' | 'menu' | 'location' | 'question' | 'end' | 'image' | 'video' | 'audio' | 'document' | 'custom';

export interface FlowStep {
  id: string;
  stepType?: StepType; // New: Type of card
  customLabel?: string; // New: User defined title for the card
  position?: { x: number; y: number }; // New: Canvas coordinates
  question: string;
  fieldName: string;
  validation?: ValidationType;
  errorMessage?: string;
  mediaUrl?: string; // Bot sends media before question
  mediaType?: 'image' | 'video';
  skipWait?: boolean; // New: If true, bot sends message and moves to next immediately
  nextStepId?: string; // Default branch (if no route matches)
  routes?: FlowRoute[]; // Conditional branches
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  welcomeMessage: string;
  endMessage: string;
  inactivityTimeout?: number; // Time in seconds to wait before handoff specifically for this flow
  steps: FlowStep[];
}

export type KanbanStage = 'new' | 'open' | 'pending' | 'closed';

// Updated status type to include 'in_progress'
export interface Conversation {
  id: string;
  customerName: string; // Used as Group Name if isGroup is true
  customerPhone: string;
  chatId?: string; // Green API Chat ID (e.g., 5511999999999@c.us)
  avatarUrl?: string; // New: WhatsApp Profile Picture
  status: 'active' | 'human_handoff' | 'in_progress' | 'completed';
  stage: KanbanStage; 
  lastActivity: Date;
  messages: Message[];
  collectedData: Record<string, string>;
  currentStepIndex: number;
  flowId: string;
  notes?: string;
  tags?: string[];
  resolutionSummary?: string;
  isPinned?: boolean; // New: Pin conversation to top
  unreadCount?: number; // New: Number of unread messages
  isGroup?: boolean; // New: Is this a group chat?
  participants?: { name: string; phone: string }[]; // New: Group members
}

export type ViewState = 'dashboard' | 'flows' | 'flow-builder' | 'conversations' | 'contacts' | 'connect' | 'health' | 'settings' | 'subscription' | 'team' | 'developer';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'error';

export interface WhatsAppSession {
  status: ConnectionStatus;
  qrCode?: string;
  phoneNumber?: string;
  deviceInfo?: string;
  batteryLevel?: number;
  error?: string;
}

export interface ApiConfig {
    idInstance: string;
    apiTokenInstance: string;
    hostUrl: string; // e.g. https://1103.api.green-api.com
}

export interface WebhookConfig {
    incomingToken?: string; // Token generated by us for the user
    defaultRoute: string; // Outgoing URL
    messageRoute?: string;
    callRoute?: string;
    statusRoute?: string;
}

export interface BotSettings {
    typingDelay: number;
    inactivityThresholdSeconds: number;
    inactivityWarningMessage: string;
    autoHandoffSeconds: number;
    autoHandoffMessage: string;
    autoArchiveMinutes: number; // New setting for auto cleanup
    disableBotOnAgentInitiated: boolean; // New setting to prevent bot reply if agent started chat
    // Writing Assistant
    enableSmartCompose: boolean;
    fuzzySensitivity: number; // 1 to 5 (distance)
}