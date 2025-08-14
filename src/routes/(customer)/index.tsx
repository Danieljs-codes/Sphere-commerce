import { createFileRoute } from '@tanstack/react-router'
import { Heading } from '@/components/ui/heading'

export const Route = createFileRoute('/(customer)/')({
  component: App,
})

function App() {
  return <Heading>Home page</Heading>
}
