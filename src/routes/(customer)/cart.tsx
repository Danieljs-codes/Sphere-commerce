import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(customer)/cart')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(customer)/cart"!</div>
}
