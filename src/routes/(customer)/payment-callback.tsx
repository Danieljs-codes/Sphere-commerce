import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(customer)/payment-callback')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(customer)/payment-callback"!</div>
}
