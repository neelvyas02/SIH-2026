import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tracking/journey")({
  beforeLoad: () => {
    throw redirect({ to: "/journey" });
  },
});
