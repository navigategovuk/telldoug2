import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import Page_0 from "./pages/jobs.tsx";
import PageLayout_0 from "./pages/jobs.pageLayout.tsx";
import Page_1 from "./pages/goals.tsx";
import PageLayout_1 from "./pages/goals.pageLayout.tsx";
import Page_2 from "./pages/_index.tsx";
import PageLayout_2 from "./pages/_index.pageLayout.tsx";
import Page_3 from "./pages/events.tsx";
import PageLayout_3 from "./pages/events.pageLayout.tsx";
import Page_4 from "./pages/import.tsx";
import PageLayout_4 from "./pages/import.pageLayout.tsx";
import Page_5 from "./pages/people.tsx";
import PageLayout_5 from "./pages/people.pageLayout.tsx";
import Page_6 from "./pages/skills.tsx";
import PageLayout_6 from "./pages/skills.pageLayout.tsx";
import Page_7 from "./pages/content.tsx";
import PageLayout_7 from "./pages/content.pageLayout.tsx";
import Page_8 from "./pages/feedback.tsx";
import PageLayout_8 from "./pages/feedback.pageLayout.tsx";
import Page_9 from "./pages/learning.tsx";
import PageLayout_9 from "./pages/learning.pageLayout.tsx";
import Page_10 from "./pages/projects.tsx";
import PageLayout_10 from "./pages/projects.pageLayout.tsx";
import Page_11 from "./pages/timeline.tsx";
import PageLayout_11 from "./pages/timeline.pageLayout.tsx";
import Page_12 from "./pages/dashboard.legacy.tsx";
import PageLayout_12 from "./pages/dashboard.pageLayout.tsx";
import Page_13 from "./pages/achievements.tsx";
import PageLayout_13 from "./pages/achievements.pageLayout.tsx";
import Page_14 from "./pages/compensation.tsx";
import PageLayout_14 from "./pages/compensation.pageLayout.tsx";
import Page_15 from "./pages/institutions.tsx";
import PageLayout_15 from "./pages/institutions.pageLayout.tsx";
import Page_16 from "./pages/interactions.tsx";
import PageLayout_16 from "./pages/interactions.pageLayout.tsx";
import Page_17 from "./pages/relationships.tsx";
import PageLayout_17 from "./pages/relationships.pageLayout.tsx";
// Authentication pages (from Helm)
import Page_Login from "./pages/login.legacy.tsx";
import PageLayout_Login from "./pages/login.pageLayout.tsx";
// Resume Builder page (from Helm)
import Page_ResumeBuilder from "./pages/resume-builder.tsx";
import PageLayout_ResumeBuilder from "./pages/resume-builder.pageLayout.tsx";

if (!window.requestIdleCallback) {
  (window as any).requestIdleCallback = (cb: IdleRequestCallback): number => {
    return window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 1);
  };
}

import "./base.css";

const fileNameToRoute = new Map([["./pages/jobs.tsx","/jobs"],["./pages/goals.tsx","/goals"],["./pages/_index.tsx","/"],["./pages/events.tsx","/events"],["./pages/import.tsx","/import"],["./pages/people.tsx","/people"],["./pages/skills.tsx","/skills"],["./pages/content.tsx","/content"],["./pages/feedback.tsx","/feedback"],["./pages/learning.tsx","/learning"],["./pages/projects.tsx","/projects"],["./pages/timeline.tsx","/timeline"],["./pages/dashboard.legacy.tsx","/dashboard"],["./pages/achievements.tsx","/achievements"],["./pages/compensation.tsx","/compensation"],["./pages/institutions.tsx","/institutions"],["./pages/interactions.tsx","/interactions"],["./pages/relationships.tsx","/relationships"],["./pages/login.legacy.tsx","/login"],["./pages/resume-builder.tsx","/resume-builder"]]);
const fileNameToComponent = new Map([
    ["./pages/jobs.tsx", Page_0],
["./pages/goals.tsx", Page_1],
["./pages/_index.tsx", Page_2],
["./pages/events.tsx", Page_3],
["./pages/import.tsx", Page_4],
["./pages/people.tsx", Page_5],
["./pages/skills.tsx", Page_6],
["./pages/content.tsx", Page_7],
["./pages/feedback.tsx", Page_8],
["./pages/learning.tsx", Page_9],
["./pages/projects.tsx", Page_10],
["./pages/timeline.tsx", Page_11],
["./pages/dashboard.legacy.tsx", Page_12],
["./pages/achievements.tsx", Page_13],
["./pages/compensation.tsx", Page_14],
["./pages/institutions.tsx", Page_15],
["./pages/interactions.tsx", Page_16],
["./pages/relationships.tsx", Page_17],
["./pages/login.legacy.tsx", Page_Login],
["./pages/resume-builder.tsx", Page_ResumeBuilder],
  ]);

function makePageRoute(filename: string) {
  const Component = fileNameToComponent.get(filename);
  if (!Component) {
    return <div>Page not found: {filename}</div>;
  }
  return <Component />;
}

function toElement({
  trie,
  fileNameToRoute,
  makePageRoute,
}: {
  trie: LayoutTrie;
  fileNameToRoute: Map<string, string>;
  makePageRoute: (filename: string) => React.ReactNode;
}) {
  return [
    ...trie.topLevel.map((filename) => (
      <Route
        key={fileNameToRoute.get(filename)}
        path={fileNameToRoute.get(filename)}
        element={makePageRoute(filename)}
      />
    )),
    ...Array.from(trie.trie.entries()).map(([Component, child], index) => (
      <Route
        key={index}
        element={
          <Component>
            <Outlet />
          </Component>
        }
      >
        {toElement({ trie: child, fileNameToRoute, makePageRoute })}
      </Route>
    )),
  ];
}

type LayoutTrieNode = Map<
  React.ComponentType<{ children: React.ReactNode }>,
  LayoutTrie
>;
type LayoutTrie = { topLevel: string[]; trie: LayoutTrieNode };
function buildLayoutTrie(layouts: {
  [fileName: string]: React.ComponentType<{ children: React.ReactNode }>[];
}): LayoutTrie {
  const result: LayoutTrie = { topLevel: [], trie: new Map() };
  Object.entries(layouts).forEach(([fileName, components]) => {
    let cur: LayoutTrie = result;
    for (const component of components) {
      if (!cur.trie.has(component)) {
        cur.trie.set(component, {
          topLevel: [],
          trie: new Map(),
        });
      }
      cur = cur.trie.get(component)!;
    }
    cur.topLevel.push(fileName);
  });
  return result;
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Go back to the <a href="/" style={{ color: 'blue' }}>home page</a>.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          {toElement({ trie: buildLayoutTrie({
"./pages/jobs.tsx": PageLayout_0,
"./pages/goals.tsx": PageLayout_1,
"./pages/_index.tsx": PageLayout_2,
"./pages/events.tsx": PageLayout_3,
"./pages/import.tsx": PageLayout_4,
"./pages/people.tsx": PageLayout_5,
"./pages/skills.tsx": PageLayout_6,
"./pages/content.tsx": PageLayout_7,
"./pages/feedback.tsx": PageLayout_8,
"./pages/learning.tsx": PageLayout_9,
"./pages/projects.tsx": PageLayout_10,
"./pages/timeline.tsx": PageLayout_11,
"./pages/dashboard.legacy.tsx": PageLayout_12,
"./pages/achievements.tsx": PageLayout_13,
"./pages/compensation.tsx": PageLayout_14,
"./pages/institutions.tsx": PageLayout_15,
"./pages/interactions.tsx": PageLayout_16,
"./pages/relationships.tsx": PageLayout_17,
"./pages/login.legacy.tsx": PageLayout_Login,
"./pages/resume-builder.tsx": PageLayout_ResumeBuilder,
}), fileNameToRoute, makePageRoute })} 
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
