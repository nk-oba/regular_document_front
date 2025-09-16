// Legacy wrapper for backward compatibility
import React from 'react';
import { ChatSession as LegacyChatSession, Message as LegacyMessage } from '@/types/chat';
import { ChatSession } from '@/domain/models/ChatSession';
import { Message } from '@/domain/models/Message';
import ChatContainer from '@/presentation/containers/ChatContainer';

interface ChatProps {
  session: LegacyChatSession | null;
  onSessionUpdate: (session: LegacyChatSession) => void;
}

const Chat: React.FC<ChatProps> = ({ session, onSessionUpdate }) => {
  // Convert legacy types to domain models
  const convertToDomainSession = (legacySession: LegacyChatSession): ChatSession => {
    const domainMessages = legacySession.messages.map((msg: LegacyMessage) =>
      new Message(
        msg.id,
        msg.content,
        msg.sender,
        msg.timestamp,
        msg.artifactDelta,
        msg.invocationId
      )
    );

    return new ChatSession(
      legacySession.id,
      domainMessages,
      legacySession.title,
      legacySession.createdAt,
      legacySession.selectedAgent
    );
  };

  // Convert domain model back to legacy format
  const convertToLegacySession = (domainSession: ChatSession): LegacyChatSession => {
    return {
      id: domainSession.id,
      messages: domainSession.messages.map(msg => msg.toPlainObject()),
      title: domainSession.title,
      createdAt: domainSession.createdAt,
      selectedAgent: domainSession.selectedAgent,
    };
  };

  const domainSession = session ? convertToDomainSession(session) : null;

  const handleSessionUpdate = (updatedDomainSession: ChatSession) => {
    const legacySession = convertToLegacySession(updatedDomainSession);
    onSessionUpdate(legacySession);
  };

  return (
    <ChatContainer
      session={domainSession}
      onSessionUpdate={handleSessionUpdate}
    />
  );
};

export default Chat;
