import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { FABButton } from './FABButton'
import { FABSubItem } from './FABSubItem'

interface BookingsFABProps {
  onNewBooking: () => void
}

export function BookingsFAB({ onNewBooking }: BookingsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleNewBooking = () => {
    setIsExpanded(false)
    onNewBooking()
  }

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Expanded Options */}
      {isExpanded && (
                 <div className="absolute bottom-16 right-0 flex flex-col space-y-3">
           {/* New Table Booking Option */}
           <FABSubItem
             icon={Calendar}
             label="New Table Booking"
             onClick={handleNewBooking}
             animationClass="animate-fab-slide-in"
           />
         </div>
      )}

             {/* Main FAB Button */}
       <FABButton
         isExpanded={isExpanded}
         onClick={toggleExpanded}
       />
    </div>
  )
}
