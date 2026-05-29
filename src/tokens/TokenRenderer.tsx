/**
 * Dispatches a token's attrs to the right render component based on its type's
 * render mode (pill / expandable / linked). Rendered inside a React portal by
 * TokenPortalProvider, so it has full access to all app contexts.
 */

import type { EditorView } from "prosemirror-view";
import type { TokenAttrs } from "../types/tokens";
import { RENDER_MODE } from "./tokenTheme";
import { PillToken } from "./PillToken";
import { ExpandableToken } from "./ExpandableToken";
import { LinkedToken } from "./LinkedToken";

interface Props {
  attrs: TokenAttrs;
  view: EditorView;
  getPos: () => number | undefined;
}

export function TokenRenderer({ attrs, view, getPos }: Props) {
  switch (RENDER_MODE[attrs.type]) {
    case "expandable":
      return <ExpandableToken attrs={attrs} view={view} getPos={getPos} />;
    case "linked":
      return <LinkedToken attrs={attrs} />;
    case "pill":
    default:
      return <PillToken attrs={attrs} view={view} getPos={getPos} />;
  }
}
