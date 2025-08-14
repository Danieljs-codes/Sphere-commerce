import { useTheme } from 'next-themes'
import { IconCircleHalf } from '@intentui/icons'
import { Button } from './ui/button'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      intent="plain"
      size="sq-sm"
      isCircle
      onPress={() =>
        setTheme(
          theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light',
        )
      }
    >
      <IconCircleHalf />
    </Button>
  )
}
