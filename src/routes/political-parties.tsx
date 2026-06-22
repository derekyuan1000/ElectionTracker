import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/political-parties")({
  component: () => <Outlet />,
});