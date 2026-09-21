export interface CurrentSpeakerContext {
  messageId?: string;
  caseId: string;
  sessionId: string;
  channelId?: string;
  senderMemberId?: string;
  senderDisplayName: string;
  senderRole?: string;
  senderPersonaType?: string;
  recipientPersona?: string;
}
