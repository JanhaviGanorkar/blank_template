import React from 'react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen w-full ">
      <div className="text-center">
        <h1 className="text-3xl mb-4">Home</h1>
        <Button className="bg-black text-white">Button</Button>
      </div>
    </div>
  )
}


