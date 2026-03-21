import { UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useStreamChat } from "../hooks/useStreamChat";
import PageLoader from "../components/PageLoader";

import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";

import "../styles/stream-chat-theme.css";
import { HashIcon, PlusIcon, UsersIcon } from "lucide-react";
import CreateChannelModal from "../components/CreateChannelModal";
import CustomChannelPreview from "../components/CustomChannelPreview";
import UsersList from "../components/UsersList";
import CustomChannelHeader from "../components/CustomChannelHeader";

const HomePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { chatClient, error, isLoading } = useStreamChat();

  // set active channel from URL params
  useEffect(() => {
    if (chatClient) {
      const channelId = searchParams.get("channel");
      if (channelId) {
        const channel = chatClient.channel("messaging", channelId);
        setActiveChannel(channel);
      }
    }
  }, [chatClient, searchParams]);

  // todo: handle this with a better component
  if (error) return <p>Something went wrong...</p>;
  if (isLoading || !chatClient) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-700 p-4">
      <Chat client={chatClient}>
        <div className="flex h-[95vh] overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">

          {/* LEFT SIDEBAR */}
          <div className="w-[320px] border-r border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex h-full flex-col">

              {/* HEADER */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-12 w-12 rounded-2xl bg-white/10 p-2 shadow-lg"
                  />
                  <span className="text-2xl font-bold tracking-wide text-white">
                    Slab
                  </span>
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 p-1 backdrop-blur-md">
                  <UserButton />
                </div>
              </div>

              {/* CHANNELS LIST */}
              <div className="flex-1 overflow-hidden px-4 py-5">

                <div className="mb-6">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.02]"
                  >
                    <PlusIcon className="size-4" />
                    <span>Create Channel</span>
                  </button>
                </div>

                {/* CHANNEL LIST */}
                <ChannelList
                  filters={{
                    members: { $in: [chatClient?.user?.id] },
                    member_count: { $gt: 2 }
                  }}
                  options={{ state: true, watch: true }}
                  Preview={({ channel }) => (
                    <CustomChannelPreview
                      channel={channel}
                      activeChannel={activeChannel}
                      setActiveChannel={(channel) =>
                        setSearchParams({ channel: channel.id })
                      }
                    />
                  )}
                  List={({ children, loading, error }) => (
                    <div className="space-y-6">

                      <div>
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-semibold uppercase tracking-wider text-white/80">
                          <HashIcon className="size-4" />
                          <span>Channels</span>
                        </div>

                        {loading && (
                          <div className="px-2 text-sm text-white/60">
                            Loading channels...
                          </div>
                        )}

                        {error && (
                          <div className="px-2 text-sm text-red-300">
                            Error loading channels
                          </div>
                        )}

                        <div className="space-y-2">{children}</div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-semibold uppercase tracking-wider text-white/80">
                          <UsersIcon className="size-4" />
                          <span>Direct Messages</span>
                        </div>

                        <UsersList activeChannel={activeChannel} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER */}
          <div className="flex flex-1 overflow-hidden bg-white/90 backdrop-blur-xl">
            <Channel channel={activeChannel}>
              <Window>
                <div className="flex h-[95vh] flex-col overflow-hidden">
                  <CustomChannelHeader />

                  <div className="flex-1 overflow-hidden">
                    <MessageList />
                  </div>

                  <div className="border-t border-gray-200">
                    <MessageInput />
                  </div>
                </div>
              </Window>
            </Channel>
          </div>
        </div>

        {isCreateModalOpen && (
          <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </Chat>
    </div>
  );
};
export default HomePage;
