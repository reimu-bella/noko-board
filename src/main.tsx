import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BoardProvider } from "./hooks/useBoardStore";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BoardProvider>
      <App />
    </BoardProvider>
  </StrictMode>,
);
