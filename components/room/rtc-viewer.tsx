import { ThemedText } from "@/components/themed-text";
import { useToast } from "@/context/toast-context";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from "react-native-webrtc";
import { io, Socket } from "socket.io-client";
import { peerConstraints, SIGNALING_URL } from "../../web-rtc.config";

interface RtcViewerProps {
    cameraId: string;
}

export function RtcViewer({ cameraId }: RtcViewerProps) {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const toast = useToast();

    useEffect(() => {
        if (!cameraId) return;

        console.log(`[RTCViewer] Initializing for camera: ${cameraId}`);
        socketRef.current = io(SIGNALING_URL);

        const pc = new RTCPeerConnection(peerConstraints);
        peerConnection.current = pc;

        (pc as any).oniceconnectionstatechange = () => {
            console.log(`[RTCViewer] ICE Connection State: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "connected") {
                toast.success("Camera connected");
            } else if (["disconnected", "failed", "closed"].includes(pc.iceConnectionState)) {
                console.log("[RTCViewer] Connection lost, resetting remote stream");
                setRemoteStream(null);
                toast.info("Camera disconnected");
            }
        };

        (pc as any).onsignalingstatechange = () => {
            console.log(`[RTCViewer] Signaling State: ${pc.signalingState}`);
        };

        // Handle Incoming Stream
        (pc as any).ontrack = (event: any) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        // --- Socket Events ---

        socketRef.current.emit("watcher", cameraId);

        socketRef.current.on("offer", async (id: string, description: RTCSessionDescription) => {
            console.log(`[RTCViewer] Received offer from ${id}`);
            if (!peerConnection.current) return;

            (peerConnection.current as any).onicecandidate = (event: any) => {
                if (event.candidate && socketRef.current) {
                    socketRef.current.emit("candidate", id, event.candidate);
                }
            };

            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(description));
                console.log("[RTCViewer] Remote description set (Offer)");

                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                console.log("[RTCViewer] Local description set (Answer)");

                socketRef.current?.emit("answer", id, peerConnection.current.localDescription);
            } catch (e) {
                console.error("[RTCViewer] Error handling offer:", e);
            }
        });

        socketRef.current.on("candidate", async (id: string, candidate: RTCIceCandidate) => {
            console.log(`[RTCViewer] Received ICE candidate from ${id}`);
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("[RTCViewer] Error adding ICE candidate:", e);
                }
            } else {
                console.warn("[RTCViewer] Received candidate before remote description, skipping or it may be queued by PC");
            }
        });

        socketRef.current.on("broadcaster", (onlineCameraId: string) => {
            if (onlineCameraId === cameraId) {
                console.log("[RTCViewer] Broadcaster came online, retrying watcher registration");
                socketRef.current?.emit("watcher", cameraId);
            }
        });

        return () => {
            console.log("[RTCViewer] Cleaning up...");
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setRemoteStream(null);
        };
    }, [cameraId]);

    return (
        <View className="flex-1 bg-black justify-center items-center">
            {remoteStream ? (
                <RTCView streamURL={remoteStream.toURL()} style={{ flex: 1, width: "100%" }} objectFit="cover" />
            ) : (
                <View className="items-center">
                    <ActivityIndicator color="white" />
                    <ThemedText className="text-white mt-4">Waiting for Broadcast...</ThemedText>
                </View>
            )}
        </View>
    );
}
