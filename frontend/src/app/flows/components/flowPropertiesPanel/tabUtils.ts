import { TabType } from "./types";

export const getAvailableTabs = (type: string): TabType[] => {
  const baseTabs: TabType[] = ["basic"];

  switch (type) {
    case "condition":
      return [...baseTabs, "conditions", "advanced"];
    case "input":
      return [...baseTabs, "config", "advanced"];
    case "transfer":
    case "ticket":
      return [...baseTabs, "config", "advanced"];
    case "webhook":
    case "database":
      return [...baseTabs, "integration", "advanced"];
    case "delay":
      return [...baseTabs, "timing", "advanced"];
    case "email":
    case "phone":
      return [...baseTabs, "contact", "advanced"];
    case "image":
    case "file":
      return [...baseTabs, "media", "advanced"];
    default:
      return [...baseTabs, "advanced"];
  }
};
