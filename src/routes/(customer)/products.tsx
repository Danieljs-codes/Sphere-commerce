import { createFileRoute } from '@tanstack/react-router'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/(customer)/products')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Heading>Products Page</Heading>
}
