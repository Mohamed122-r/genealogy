"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxOptions { value: string; label: string; description?: string }
interface ComboboxProps {
  options: ComboboxOptions[]
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
}

export function Combobox({ options, value, onChange, placeholder, emptyMessage }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState<string | null>(value || null)

  React.useEffect(() => { setSelectedValue(value || null) }, [value])

  const selectedOption = options.find((option) => option.value === selectedValue)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedOption ? selectedOption.label : placeholder || "اختر..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="ابحث..." />
          <CommandEmpty>{emptyMessage || "لا توجد نتائج"}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem key={option.value} value={option.label} onSelect={() => {
                onChange(option.value === selectedValue ? null : option.value)
                setSelectedValue(option.value === selectedValue ? null : option.value)
                setOpen(false)
              }}>
                <Check className={cn("mr-2 h-4 w-4", selectedValue === option.value ? "opacity-100" : "opacity-0")} />
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
