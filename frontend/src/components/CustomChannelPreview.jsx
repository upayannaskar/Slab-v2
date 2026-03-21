import { HashIcon } from "lucide-react";

const CustomChannelPreview = ({ channel, setActiveChannel, activeChannel }) => {
  const isActive = activeChannel && activeChannel.id === channel.id;
  const isDM = channel.data.member_count === 2 && channel.data.id.includes("user_");

  if (isDM) return null;

  const unreadCount = channel.countUnread();

  return (
    <button
      onClick={() => setActiveChannel(channel)}
      className={`flex w-full items-center rounded-2xl px-4 py-3 mb-2 text-left font-medium transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-purple-600/30 to-fuchsia-500/20 border border-purple-400/30 shadow-lg backdrop-blur-md text-white"
          : "bg-white/5 hover:bg-white/10 text-white/80"
      }`}
    >
      <HashIcon
        className={`mr-3 h-4 w-4 ${
          isActive ? "text-purple-300" : "text-white/50"
        }`}
      />

      <span className="flex-1 truncate text-sm tracking-wide">
        {channel.data.id}
      </span>

      {unreadCount > 0 && (
        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white shadow">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default CustomChannelPreview;