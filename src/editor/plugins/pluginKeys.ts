import { PluginKey } from "prosemirror-state";
import type { MentionState } from "./mentionTrigger";

export const mentionPluginKey = new PluginKey<MentionState>("chartmark-mention");
export const lockStatePluginKey = new PluginKey<boolean>("chartmark-lock");
