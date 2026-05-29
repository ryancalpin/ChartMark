import { PluginKey } from "prosemirror-state";
import type { MentionState } from "./mentionTrigger";
import type { LockState } from "./lockState";

export const mentionPluginKey = new PluginKey<MentionState>("chartmark-mention");
export const lockStatePluginKey = new PluginKey<LockState>("chartmark-lock");
