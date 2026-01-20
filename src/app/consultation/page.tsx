"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageSquare,
  User,
  Shield,
  X,
  Send,
  AlertCircle,
} from "lucide-react";

const provider = {
  name: "Dr. Sarah Chen",
  credentials: "MD, FRCSC",
  cpsoNumber: "12345",
  location: "Toronto, Ontario",
  phone: "(416) 555-0100",
};

export default function ConsultationPage() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    {
      sender: "system",
      text: "Consultation started. Your conversation is private and secure.",
      time: "10:30 AM",
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        { sender: "patient", text: message, time: "10:32 AM" },
      ]);
      setMessage("");
    }
  };

  const handleEndCall = () => {
    router.push("/dashboard");
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {showDisclosure && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Provider Information
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                As required by the College of Physicians and Surgeons of Ontario
                (CPSO), please review your provider&apos;s information:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div>
                  <div className="text-xs text-gray-500">Provider Name</div>
                  <div className="font-medium text-gray-900">{provider.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Credentials</div>
                  <div className="font-medium text-gray-900">
                    {provider.credentials}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">CPSO Registration #</div>
                  <div className="font-medium text-gray-900">
                    {provider.cpsoNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="font-medium text-gray-900">
                    {provider.location}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Contact</div>
                  <div className="font-medium text-gray-900">{provider.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-6">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Please confirm you are in a private location where your
                  conversation cannot be overheard.
                </span>
              </div>
              <Button
                onClick={() => setShowDisclosure(false)}
                className="w-full"
                size="lg"
              >
                I Confirm & Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary-400" />
          <span className="text-white font-semibold">Klara</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Connected
          </div>
          <div className="text-sm text-gray-400">
            Duration: <span className="text-white">12:34</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <div className="absolute inset-4 bg-gray-800 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12 text-gray-500" />
              </div>
              <div className="text-white font-medium">{provider.name}</div>
              <div className="text-gray-400 text-sm">{provider.credentials}</div>
              <div className="text-gray-500 text-xs mt-1">
                CPSO #{provider.cpsoNumber}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 w-48 h-36 bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-600">
            {isVideoOn ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="text-white text-sm">You</div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Camera Off</div>
            )}
          </div>

          <div className="absolute top-8 left-8 bg-black/50 rounded-lg px-4 py-2">
            <div className="text-white text-sm font-medium">{provider.name}</div>
            <div className="text-gray-300 text-xs">{provider.location}</div>
          </div>
        </div>

        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${
                    msg.sender === "patient" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.sender === "system" ? (
                    <div className="text-gray-500 text-xs text-center">
                      {msg.text}
                    </div>
                  ) : (
                    <div
                      className={`inline-block px-3 py-2 rounded-lg ${
                        msg.sender === "patient"
                          ? "bg-primary-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      <div className="text-sm">{msg.text}</div>
                      <div className="text-xs opacity-60 mt-1">{msg.time}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "secondary" : "ghost"}
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-full w-14 h-14 ${
              isMuted ? "bg-red-600 hover:bg-red-700 text-white" : "text-white"
            }`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant={!isVideoOn ? "secondary" : "ghost"}
            size="lg"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`rounded-full w-14 h-14 ${
              !isVideoOn ? "bg-red-600 hover:bg-red-700 text-white" : "text-white"
            }`}
          >
            {isVideoOn ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className={`rounded-full w-14 h-14 text-white ${
              showChat ? "bg-primary-600" : ""
            }`}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            onClick={handleEndCall}
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
          >
            <Phone className="h-6 w-6 rotate-[135deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
