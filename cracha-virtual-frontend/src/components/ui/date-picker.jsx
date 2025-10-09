"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({ value, onSelect, className }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {/* Ícone agora à esquerda */}
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onSelect(date);
            setOpen(false);
          }}
          captionLayout="dropdown"
          // AJUSTE: Limites de ano removidos para maior flexibilidade
          // fromYear={1930}
          // toYear={new Date().getFullYear() - 10}
          locale={ptBR}
          initialFocus
          // Desabilita a seleção de datas futuras, se desejar
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
