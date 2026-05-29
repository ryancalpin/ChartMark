import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: StrictMode is intentionally omitted. Its double-invoke of effects
// would construct and tear down the ProseMirror EditorView twice on mount,
// which fights ProseMirror's imperative DOM ownership.
createRoot(document.getElementById("root")!).render(<App />);
