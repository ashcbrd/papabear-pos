"use client"

import * as React from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MonthSelect({ 
  value, 
  onValueChange, 
  placeholder = "Select month",
  className,
  disabled = false
}: MonthSelectProps) {
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    // Generate options for the last 24 months (2 years)
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthValue = format(date, "yyyy-MM")
      const monthLabel = format(date, "MMMM yyyy")
      
      options.push({
        value: monthValue,
        label: monthLabel
      })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}