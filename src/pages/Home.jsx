import { Button } from "../components/ui/button"
import { ModeToggle } from "../components/mode-toggle"

export default function Home() {
  return (
  
        <>
            <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Your App</h1>
        <ModeToggle />
      </div>
    
      <div className="bg-background text-foreground p-4">
      
        <div className="bg-primary text-primary-foreground p-2 mt-2">Hello</div>
        <div className="bg-warning text-warning-foreground">world</div>
        <Button className="mt-2">Click</Button>
      </div>
    </>
  )
}
