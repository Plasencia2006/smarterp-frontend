import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DarkModeToggle({ className }) {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        return saved ? JSON.parse(saved) : false
    })

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className={cn(
                className,
                darkMode
                    ? "text-yellow-400 hover:bg-gray-700 hover:text-yellow-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {darkMode ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </Button>
    )
}