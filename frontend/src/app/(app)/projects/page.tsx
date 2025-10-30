import React, { Suspense } from "react";
import ProjectsIndexClient from "./page.client";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div />}> 
      <ProjectsIndexClient />
    </Suspense>
  );
}


