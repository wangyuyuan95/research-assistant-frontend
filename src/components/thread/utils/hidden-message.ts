/**
 * Utility functions for handling frontend hidden messages in chat
 * Used for todo confirmations and other system messages that should not be displayed in chat history
 * 
 * These messages are wrapped with <frontend_hidden_message_tag> to:
 * 1. Allow backend to process them normally (store, trigger workflows)
 * 2. Hide them from frontend chat display to keep UI clean
 * 3. Avoid conflicts with other backend logic by using a specific frontend namespace
 */

/**
 * Wrap a message content with frontend hidden tags
 */
export function wrapAsHiddenMessage(content: string): string {
  return `<frontend_hidden_message_tag>${content}`;
}

/**
 * Check if a message content contains frontend hidden tags
 */
export function isHiddenMessage(content: string): boolean {
  return content.includes('<frontend_hidden_message_tag>') || content.includes('<modified_todo_content>');
}

/**
 * Check if a message should be hidden from the chat display
 */
export function shouldHideMessage(message: any): boolean {
  if (message.type !== 'user') {
    return false;
  }
  
  const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  return isHiddenMessage(content);
} 