import React from "react";
// @ts-expect-error - missing type declarations for react-dom/client
import { createRoot } from "react-dom/client";
import { App } from "./App";
const container = document.getElementById("root") as HTMLDivElement;
createRoot(container).render(<App />);
    