import { HashIcon, LockIcon, UsersIcon, PinIcon, VideoIcon } from "lucide-react";
import { useChannelStateContext } from "stream-chat-react";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import MembersModal from "./MembersModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import InviteModal from "./InviteModal";

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const { user } = useUser();

  const memberCount = Object.keys(channel.state.members).length;

  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  const otherUser = Object.values(channel.state.members).find(
    (member) => member.user.id !== user.id
  );

  const isDM = channel.data?.member_count === 2 && channel.data?.id.includes("user_");

  const handleShowPinned = async () => {
    const channelState = await channel.query();
    setPinnedMessages(channelState.pinned_messages);
    setShowPinnedMessages(true);
  };

  const handleVideoCall = async () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      await channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-black/5 bg-white/80 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {channel.data?.private ? (
            <LockIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <HashIcon className="h-4 w-4 text-gray-500" />
          )}

          {isDM && otherUser?.user?.image && (
            <img
              src={otherUser.user.image}
              alt={otherUser.user.name || otherUser.user.id}
              className="h-8 w-8 rounded-full object-cover shadow-sm"
            />
          )}

          <span className="text-sm font-semibold tracking-wide text-gray-800">
            {isDM ? otherUser?.user?.name || otherUser?.user?.id : channel.data?.id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-black/5"
          onClick={() => setShowMembers(true)}
        >
          <UsersIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">{memberCount}</span>
        </button>

        <button
          className="rounded-xl p-2 transition hover:bg-purple-50"
          onClick={handleVideoCall}
          title="Start Video Call"
        >
          <VideoIcon className="h-5 w-5 text-purple-600" />
        </button>

        {channel.data?.private && (
          <button
            className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:scale-[1.02]"
            onClick={() => setShowInvite(true)}
          >
            Invite
          </button>
        )}

        <button
          className="rounded-xl p-2 transition hover:bg-black/5"
          onClick={handleShowPinned}
        >
          <PinIcon className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {showMembers && (
        <MembersModal
          members={Object.values(channel.state.members)}
          onClose={() => setShowMembers(false)}
        />
      )}

      {showPinnedMessages && (
        <PinnedMessagesModal
          pinnedMessages={pinnedMessages}
          onClose={() => setShowPinnedMessages(false)}
        />
      )}

      {showInvite && <InviteModal channel={channel} onClose={() => setShowInvite(false)} />}
    </div>
  );
};

export default CustomChannelHeader;