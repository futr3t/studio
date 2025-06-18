
"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileText } from "lucide-react";
import { format, subDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from 'react-day-picker';

export default function ReportsPage() {
  const [generalReportDateRange, setGeneralReportDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), // Default to last 30 days
    to: new Date(),
  });
  const [nonCompliantReportDateRange, setNonCompliantReportDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const { toast } = useToast();

  const handleGenerateGeneralReport = () => {
    if (!generalReportDateRange?.from || !generalReportDateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a start and end date for the general report.",
        variant: "destructive",
      });
      return;
    }
    console.log("Generating General Report for:", generalReportDateRange);
    toast({
      title: "General Report Generation Started",
      description: `Report for ${format(generalReportDateRange.from, "PPP", { locale: enUS })} to ${format(generalReportDateRange.to, "PPP", { locale: enUS })} is being generated. (Placeholder)`,
      className: "bg-accent text-accent-foreground"
    });
    // Actual PDF generation logic would go here
  };

  const handleGenerateNonCompliantReport = () => {
     if (!nonCompliantReportDateRange?.from || !nonCompliantReportDateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a start and end date for the non-compliant report.",
        variant: "destructive",
      });
      return;
    }
    console.log("Generating Non-Compliant Logs Report for:", nonCompliantReportDateRange);
    toast({
      title: "Non-Compliant Logs Report Started",
      description: `Report for ${format(nonCompliantReportDateRange.from, "PPP", { locale: enUS })} to ${format(nonCompliantReportDateRange.to, "PPP", { locale: enUS })} is being generated. (Placeholder)`,
      className: "bg-accent text-accent-foreground"
    });
    // Actual PDF generation logic and filtering would go here
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Compliance Reports</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>General Compliance Report</CardTitle>
              <CardDescription>Generate a comprehensive PDF report for all logs within a selected date range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="general-date-range" className="mb-2 block">Select Date Range:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="general-date-range"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !generalReportDateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {generalReportDateRange?.from ? (
                        generalReportDateRange.to ? (
                          <>
                            {format(generalReportDateRange.from, "LLL dd, y", { locale: enUS })} -{" "}
                            {format(generalReportDateRange.to, "LLL dd, y", { locale: enUS })}
                          </>
                        ) : (
                          format(generalReportDateRange.from, "LLL dd, y", { locale: enUS })
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={generalReportDateRange?.from}
                      selected={generalReportDateRange}
                      onSelect={setGeneralReportDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerateGeneralReport} className="w-full md:w-auto">
                <FileText className="mr-2 h-4 w-4" /> Generate General Report (PDF)
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Non-Compliant Logs Report</CardTitle>
              <CardDescription>Generate a PDF report focusing on non-compliant logs and corrective actions within a selected date range.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
              <div>
                <Label htmlFor="noncompliant-date-range" className="mb-2 block">Select Date Range:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="noncompliant-date-range"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nonCompliantReportDateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nonCompliantReportDateRange?.from ? (
                        nonCompliantReportDateRange.to ? (
                          <>
                            {format(nonCompliantReportDateRange.from, "LLL dd, y", { locale: enUS })} -{" "}
                            {format(nonCompliantReportDateRange.to, "LLL dd, y", { locale: enUS })}
                          </>
                        ) : (
                          format(nonCompliantReportDateRange.from, "LLL dd, y", { locale: enUS })
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={nonCompliantReportDateRange?.from}
                      selected={nonCompliantReportDateRange}
                      onSelect={setNonCompliantReportDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerateNonCompliantReport} className="w-full md:w-auto">
                <FileText className="mr-2 h-4 w-4" /> Generate Non-Compliant Report (PDF)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
