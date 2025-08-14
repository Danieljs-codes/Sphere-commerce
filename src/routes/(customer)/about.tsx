import { createFileRoute } from '@tanstack/react-router'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/(customer)/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Heading>About page</Heading>
}
