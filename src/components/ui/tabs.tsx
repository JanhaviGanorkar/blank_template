import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: '', onValueChange: () => {} })

const Tabs = ({ value, onValueChange, children, className }: TabsProps) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>
      {children}
    </div>
  </TabsContext.Provider>
)

const TabsList = ({ children, className }: TabsListProps) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1", className)}>
    {children}
  </div>
)

const TabsTrigger = ({ value: triggerValue, children, className }: TabsTriggerProps) => {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isActive = value === triggerValue
  
  return (
    <button
      onClick={() => onValueChange(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        isActive 
          ? "bg-white text-gray-900 shadow-sm" 
          : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value: contentValue, children, className }: TabsContentProps) => {
  const { value } = React.useContext(TabsContext)
  
  if (value !== contentValue) return null
  
  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }