import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const { user, isLoaded } = useUser();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!user,
  });

  useEffect(() => {
    const initCall = async () => {
      if (!tokenData.token || !user || !callId) return;

      try {
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: user.id,
            name: user.fullName,
            image: user.imageUrl,
          },
          token: tokenData.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.log("Error init call:", error);
        toast.error("Cannot connect to the call.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [tokenData, user, callId]);

  if (isConnecting || !isLoaded) {
    return (
      <div className="h-screen flex justify-center items-center bg-zinc-950 text-white text-lg font-medium">
        Connecting to call...
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center px-4 py-6 text-white">
      <div className="w-full max-w-6xl h-[92vh] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-300 text-lg">
            Could not initialize call. Please refresh or try again later
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <div className="relative h-full w-full bg-black text-white">
        <SpeakerLayout />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;