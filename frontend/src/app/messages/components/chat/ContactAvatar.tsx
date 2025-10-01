"use client";

interface ContactAvatarProps {
  name?: string;
  isMe: boolean;
}

export default function ContactAvatar({ name, isMe }: ContactAvatarProps) {
  if (isMe) return null;

  return (
    <div className="order-1 mr-3 mt-auto flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
    </div>
  );
}
