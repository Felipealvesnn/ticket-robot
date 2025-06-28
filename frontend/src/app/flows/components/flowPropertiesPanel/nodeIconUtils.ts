import {
  Clock,
  Database,
  FileText,
  GitBranch,
  Headphones,
  Image,
  Link,
  Mail,
  MessageSquare,
  Phone,
  Play,
  StopCircle,
} from "lucide-react";
import { NodeIconConfig } from "./types";

export const getNodeIcon = (type: string): NodeIconConfig => {
  switch (type) {
    case "message":
      return {
        Icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    case "image":
      return { Icon: Image, color: "text-green-600", bg: "bg-green-50" };
    case "file":
      return { Icon: FileText, color: "text-purple-600", bg: "bg-purple-50" };
    case "condition":
      return {
        Icon: GitBranch,
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    case "delay":
      return { Icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" };
    case "start":
      return { Icon: Play, color: "text-green-600", bg: "bg-green-50" };
    case "end":
      return { Icon: StopCircle, color: "text-red-600", bg: "bg-red-50" };
    case "transfer":
      return { Icon: Headphones, color: "text-blue-600", bg: "bg-blue-50" };
    case "ticket":
      return {
        Icon: MessageSquare, // Usar um ícone diferente se disponível
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      };
    case "webhook":
      return { Icon: Link, color: "text-indigo-600", bg: "bg-indigo-50" };
    case "database":
      return { Icon: Database, color: "text-gray-600", bg: "bg-gray-50" };
    case "email":
      return { Icon: Mail, color: "text-red-600", bg: "bg-red-50" };
    case "phone":
      return { Icon: Phone, color: "text-green-600", bg: "bg-green-50" };
    default:
      return {
        Icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
  }
};
