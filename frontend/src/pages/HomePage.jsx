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
import {
  HashIcon,
  PlusIcon,
  UsersIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";

import CreateChannelModal from "../components/CreateChannelModal";
import CustomChannelPreview from "../components/CustomChannelPreview";
import UsersList from "../components/UsersList";
import CustomChannelHeader from "../components/CustomChannelHeader";

const HomePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // 👇 NEW STATE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { chatClient, error, isLoading } = useStreamChat();

  useEffect(() => {
    if (chatClient) {
      const channelId = searchParams.get("channel");
      if (channelId) {
        const channel = chatClient.channel("messaging", channelId);
        setActiveChannel(channel);
      }
    }
  }, [chatClient, searchParams]);

  if (error) return <p>Something went wrong...</p>;
  if (isLoading || !chatClient) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-700 p-2 md:p-4">
      <Chat client={chatClient}>
        <div className="flex h-[95vh] overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl relative">

          {/* 🔥 MOBILE OVERLAY */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* 🔥 SIDEBAR */}
          <div
            className={`
              fixed md:static z-50 md:z-auto
              h-full w-[280px] md:w-[320px]
              bg-black/20 backdrop-blur-xl border-r border-white/10
              transform transition-transform duration-300
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              md:translate-x-0
            `}
          >
            <div className="flex h-full flex-col">

              {/* HEADER */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-12 w-12 rounded-2xl bg-white/10 p-2 shadow-lg"
                  />
                  <span className="text-2xl font-bold text-white">Slab</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* CLOSE BUTTON (mobile only) */}
                  <button
                    className="md:hidden text-white"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <XIcon />
                  </button>

                  <UserButton />
                </div>
              </div>

              {/* CHANNELS */}
              <div className="flex-1 overflow-hidden px-4 py-5">
                <div className="mb-6">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-4 font-semibold text-white shadow-lg hover:scale-[1.02]"
                  >
                    <PlusIcon className="size-4" />
                    Create Channel
                  </button>
                </div>

                <ChannelList
                  filters={{
                    members: { $in: [chatClient?.user?.id] },
                    member_count: { $gt: 2 },
                  }}
                  options={{ state: true, watch: true }}
                  Preview={({ channel }) => (
                    <CustomChannelPreview
                      channel={channel}
                      activeChannel={activeChannel}
                      setActiveChannel={(channel) => {
                        setSearchParams({ channel: channel.id });
                        setIsSidebarOpen(false); // 👈 close on select (mobile UX)
                      }}
                    />
                  )}
                  List={({ children, loading, error }) => (
                    <div className="flex flex-col space-y-6">

                      {/* CHANNELS */}
                      <div>
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-semibold text-white/80">
                          <HashIcon className="size-4" />
                          Channels
                        </div>

                        {loading && <p className="text-white/60">Loading...</p>}
                        {error && <p className="text-red-300">Error</p>}

                        <div className="space-y-2">{children}</div>
                      </div>

                      {/* DM */}
                      <div>
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-semibold text-white/80">
                          <UsersIcon className="size-4" />
                          Direct Messages
                        </div>

                        <UsersList activeChannel={activeChannel} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 🔥 RIGHT SIDE */}
          <div className="flex flex-1 flex-col overflow-hidden bg-white/90">

            {/* 🔥 TOP BAR (MOBILE ONLY) */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white">
              <button onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon />
              </button>

              <span className="font-semibold">Slab</span>

              <UserButton />
            </div>

            <Channel channel={activeChannel}>
              <Window>
                <div className="flex h-full flex-col overflow-hidden">
                  <CustomChannelHeader />

                  <div className="flex-1 overflow-hidden">
                    <MessageList />
                  </div>

                  <div className="border-t">
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