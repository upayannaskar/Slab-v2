import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { useChatContext } from "stream-chat-react";

import * as Sentry from "@sentry/react";
import { CircleIcon } from "lucide-react";

const UsersList = ({ activeChannel }) => {
  const { client } = useChatContext();
  const [_, setSearchParams] = useSearchParams();

  const fetchUsers = useCallback(async () => {
    if (!client?.user) return;

    const response = await client.queryUsers(
      { id: { $ne: client.user.id } },
      { name: 1 },
      { limit: 20 }
    );

    const usersOnly = response.users.filter(
      (user) =>
        user.id.startsWith("user_") &&
        !user.id.startsWith("recording-")
    );

    return usersOnly;
  }, [client]);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users-list", client?.user?.id],
    queryFn: fetchUsers,
    enabled: !!client?.user,
    staleTime: 1000 * 60 * 5,
  });

  const startDirectMessage = async (targetUser) => {
    if (!targetUser || !client?.user) return;

    try {
      const channelId = [client.user.id, targetUser.id].sort().join("-").slice(0, 64);
      const channel = client.channel("messaging", channelId, {
        members: [client.user.id, targetUser.id],
      });
      await channel.watch();
      setSearchParams({ channel: channel.id });
    } catch (error) {
      console.log("Error creating DM", error),
        Sentry.captureException(error, {
          tags: { component: "UsersList" },
          extra: {
            context: "create_direct_message",
            targetUserId: targetUser?.id,
          },
        });
    }
  };

  if (isLoading)
    return <div className="px-2 text-sm text-white/60">Loading users...</div>;

  if (isError)
    return <div className="px-2 text-sm text-red-300">Failed to load users</div>;

  if (!users.length)
    return <div className="px-2 text-sm text-white/50">No other users found</div>;

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const channelId = [client.user.id, user.id].sort().join("-").slice(0, 64);
        const channel = client.channel("messaging", channelId, {
          members: [client.user.id, user.id],
        });
        const unreadCount = channel.countUnread();
        const isActive = activeChannel && activeChannel.id === channelId;

        return (
          <button
            key={user.id}
            onClick={() => startDirectMessage(user)}
            className={`flex w-full items-center rounded-2xl px-4 py-3 transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-purple-600/30 to-fuchsia-500/20 border border-purple-400/30 shadow-lg backdrop-blur-md text-white"
                : "bg-white/5 hover:bg-white/10 text-white/80"
            }`}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || user.id}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                    {(user.name || user.id).charAt(0).toUpperCase()}
                  </div>
                )}

                <CircleIcon
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                    user.online
                      ? "fill-green-500 text-green-500"
                      : "fill-gray-400 text-gray-400"
                  }`}
                />
              </div>

              <span className="flex-1 truncate text-sm tracking-wide">
                {user.name || user.id}
              </span>

              {unreadCount > 0 && (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default UsersList;