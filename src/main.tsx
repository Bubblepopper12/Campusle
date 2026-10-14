import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/graduate/400.css";
import "@fontsource-variable/archivo/index.css";
import "@fontsource/cabin-sketch/700.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource/anton/400.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
