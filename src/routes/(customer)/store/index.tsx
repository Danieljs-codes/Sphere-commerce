import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(customer)/store/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(customer)/store/"!</div>
}
