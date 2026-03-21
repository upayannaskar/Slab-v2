import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon } from "lucide-react";

const CreateChannelModal = ({ onClose }) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [_, setSearchParams] = useSearchParams();

  const { client, setActiveChannel } = useChatContext();

  // fetch users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      if (!client?.user) return;
      setLoadingUsers(true);

      try {
        const response = await client.queryUsers(
          { id: { $ne: client.user.id } },
          { name: 1 },
          { limit: 100 }
        );

        const usersOnly = response.users.filter((user) => !user.id.startsWith("recording-"));

        setUsers(usersOnly || []);
      } catch (error) {
        console.log("Error fetching users");
        Sentry.captureException(error, {
          tags: { component: "CreateChannelModal" },
          extra: { context: "fetch_users_for_channel" },
        });
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [client]);

  // reset the form on open: this is not needed, we just deleted it later in the video
  // useEffect(() => {
  //   setChannelName("");
  //   setDescription("");
  //   setChannelType("public");
  //   setError("");
  //   setSelectedMembers([]);
  // }, []);

  // auto-select all users for public channels
  useEffect(() => {
    if (channelType === "public") setSelectedMembers(users.map((u) => u.id));
    else setSelectedMembers([]);
  }, [channelType, users]);

  const validateChannelName = (name) => {
    if (!name.trim()) return "Channel name is required";
    if (name.length < 3) return "Channel name must be at least 3 characters";
    if (name.length > 22) return "Channel name must be less than 22 characters";

    return "";
  };

  const handleChannelNameChange = (e) => {
    const value = e.target.value;
    setChannelName(value);
    setError(validateChannelName(value));
  };

  const handleMemberToggle = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((uid) => uid !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateChannelName(channelName);
    if (validationError) return setError(validationError);

    if (isCreating || !client?.user) return;

    setIsCreating(true);
    setError("");

    try {
      // MY COOL CHANNEL !#1 => my-cool-channel-1
      const channelId = channelName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .slice(0, 20);

      // prepare the channel data

      const channelData = {
        name: channelName.trim(),
        created_by_id: client.user.id,
        members: [client.user.id, ...selectedMembers],
      };

      if (description) channelData.description = description;

      if (channelType === "private") {
        channelData.private = true;
        channelData.visibility = "private";
      } else {
        channelData.visibility = "public";
        channelData.discoverable = true;
      }

      const channel = client.channel("messaging", channelId, channelData);

      await channel.watch();

      setActiveChannel(channel);
      setSearchParams({ channel: channelId });

      toast.success(`Channel "${channelName}" created successfully!`);
      onClose();
    } catch (error) {
      console.log("Error creating the channel", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create a channel</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-black/5"
          >
            <XIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
  
        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircleIcon className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
  
          {/* Channel name */}
          <div className="space-y-2">
            <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-3 focus-within:border-purple-500">
              <HashIcon className="mr-2 h-4 w-4 text-gray-400" />
              <input
                id="channelName"
                type="text"
                value={channelName}
                onChange={handleChannelNameChange}
                placeholder="e.g. marketing"
                className={`w-full bg-transparent outline-none ${
                  error ? "text-red-500" : "text-gray-800"
                }`}
                autoFocus
                maxLength={22}
              />
            </div>
  
            {channelName && (
              <div className="text-xs text-gray-500">
                Channel ID will be: #
                {channelName
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-_]/g, "")}
              </div>
            )}
          </div>
  
          {/* CHANNEL TYPE */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Channel type</label>
  
            <div className="grid gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4 hover:bg-gray-50">
                <input
                  type="radio"
                  value="public"
                  checked={channelType === "public"}
                  onChange={(e) => setChannelType(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <HashIcon className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-500">
                      Anyone can join this channel
                    </div>
                  </div>
                </div>
              </label>
  
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4 hover:bg-gray-50">
                <input
                  type="radio"
                  value="private"
                  checked={channelType === "private"}
                  onChange={(e) => setChannelType(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <LockIcon className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-500">
                      Only invited members can join
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
  
          {/* add members */}
          {channelType === "private" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Add members</label>
  
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm transition hover:bg-gray-200"
                  onClick={() => setSelectedMembers(users.map((u) => u.id))}
                  disabled={loadingUsers || users.length === 0}
                >
                  <UsersIcon className="h-4 w-4" />
                  Select Everyone
                </button>
  
                <span className="text-sm text-gray-500">
                  {selectedMembers.length} selected
                </span>
              </div>
  
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 p-3">
                {loadingUsers ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-gray-500">No users found</p>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={() => handleMemberToggle(user.id)}
                      />
  
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || user.id}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm text-white">
                          {(user.name || user.id).charAt(0).toUpperCase()}
                        </div>
                      )}
  
                      <span className="text-sm text-gray-700">
                        {user.name || user.id}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
  
          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description (optional)
            </label>
  
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full rounded-2xl border border-gray-200 px-3 py-3 outline-none focus:border-purple-500"
              rows={3}
            />
          </div>
  
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-4 py-2 transition hover:bg-gray-200"
            >
              Cancel
            </button>
  
            <button
              type="submit"
              disabled={!channelName.trim() || isCreating}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2 font-medium text-white shadow-md transition hover:scale-[1.02]"
            >
              {isCreating ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;