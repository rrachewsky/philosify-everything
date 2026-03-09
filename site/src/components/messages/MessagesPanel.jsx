// MessagesPanel - Direct Messages container (conversations list + chat view + group features)
import { useState, useCallback } from 'react';
import { useDM } from '../../hooks/useDM.js';
import { ConversationList } from './ConversationList.jsx';
import { ChatView } from './ChatView.jsx';
import { GroupMembersModal } from './GroupMembersModal.jsx';
import { NewGroupModal } from './NewGroupModal.jsx';
import { ForwardModal } from './ForwardModal.jsx';

export function MessagesPanel({ startWithUser = null, onBackToAgora = null, isOnline = null }) {
  const dm = useDM();
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);

  // If startWithUser is provided, open that conversation immediately
  if (startWithUser && !dm.activeConversation) {
    const { id, displayName, ...options } = startWithUser;
    dm.startConversation(id, displayName, options);
  }

  // Back handler: if came from Agora/Collective, go back; otherwise go to conversation list
  const handleBack = useCallback(() => {
    if (onBackToAgora) {
      onBackToAgora();
    } else {
      dm.closeConversation();
    }
  }, [onBackToAgora, dm]);

  const handleCreateGroup = useCallback(
    async (memberIds, name) => {
      const conv = await dm.createGroup(memberIds, name);
      if (conv) {
        setShowNewGroup(false);
      }
    },
    [dm]
  );

  // Forward handler: open ForwardModal, then send forwarded message to selected user
  const handleForward = useCallback((message) => {
    setForwardingMessage(message);
  }, []);

  const handleForwardSend = useCallback(
    async (targetUserId, targetDisplayName) => {
      if (!forwardingMessage) return;
      const messageText = forwardingMessage.message;
      setForwardingMessage(null);

      // Open conversation with target, then send the forwarded message
      await dm.startConversation(targetUserId, targetDisplayName);
      await dm.sendMessage(messageText, { isForwarded: true });
    },
    [forwardingMessage, dm]
  );

  // Chat view when a conversation is active
  if (dm.activeConversation) {
    return (
      <>
        <ChatView
          conversation={dm.activeConversation}
          messages={dm.messages}
          loading={dm.loadingMessages}
          error={dm.messagesError}
          hasMore={dm.hasMoreMessages}
          sending={dm.sending}
          currentUserId={dm.userId}
          onBack={handleBack}
          onSend={dm.sendMessage}
          onLoadMore={dm.loadMoreMessages}
          onDeleteMessage={dm.deleteMessage}
          onEditMessage={dm.editMessage}
          onBlockUser={dm.blockUser}
          onLeave={dm.leaveConversation}
          onShowMembers={() => setShowGroupMembers(true)}
          onForward={handleForward}
          onToggleReaction={dm.toggleReaction}
          isOnline={isOnline}
          replyingTo={dm.replyingTo}
          setReplyingTo={dm.setReplyingTo}
          editingMessage={dm.editingMessage}
          setEditingMessage={dm.setEditingMessage}
          typingUsers={dm.typingUsers}
          onTyping={dm.broadcastTyping}
        />

        {/* Group members modal */}
        {showGroupMembers && dm.activeConversation?.type === 'group' && (
          <GroupMembersModal
            conversation={dm.activeConversation}
            currentUserId={dm.userId}
            onClose={() => setShowGroupMembers(false)}
            onAddMembers={dm.addMembers}
            onRemoveMember={dm.removeMember}
            onRename={dm.renameConversation}
          />
        )}

        {/* Forward modal */}
        {forwardingMessage && (
          <ForwardModal
            message={forwardingMessage}
            onClose={() => setForwardingMessage(null)}
            onForward={handleForwardSend}
          />
        )}
      </>
    );
  }

  // Conversations list (default view)
  return (
    <>
      <ConversationList
        conversations={dm.conversations}
        loading={dm.loadingConversations}
        error={dm.conversationsError}
        currentUserId={dm.userId}
        onSelect={(conversationId) => dm.openConversation(conversationId)}
        onRefresh={dm.loadConversations}
        onDelete={dm.leaveConversation}
        onNewGroup={() => setShowNewGroup(true)}
        isOnline={isOnline}
      />

      {/* New group modal */}
      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} onCreate={handleCreateGroup} />
      )}
    </>
  );
}

export default MessagesPanel;
