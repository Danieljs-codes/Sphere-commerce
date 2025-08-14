import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(customer)/orders')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(customer)/orders"!</div>
}
