
"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileText } from "lucide-react";
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from 'react-day-picker';
import { useData } from '@/context/DataContext';
import type { ProductionLog, DeliveryLog, TemperatureLog, CleaningChecklistItem, Supplier, Appliance, User } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  reportTitle: string;
  dateRangeFormatted: string;
  generatedAt: string;
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  columns: string[];
  data: any[][];
  emptyMessage: string;
}

// Extend jsPDF with autoTable - required for TypeScript
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
  lastAutoTable?: { finalY?: number }; // Add this to reflect jspdf-autotable's extension
}

export default function ReportsPage() {
  const { 
    productionLogs, 
    deliveryLogs, 
    temperatureLogs, 
    cleaningChecklistItems,
    suppliers,
    appliances,
    users, // Assuming users are available from context for resolving names
    findUserById 
  } = useData();
  const { toast } = useToast();

  const [generalReportDateRange, setGeneralReportDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [nonCompliantReportDateRange, setNonCompliantReportDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const getSupplierName = (supplierId: string): string => suppliers.find(s => s.id === supplierId)?.name || supplierId;
  const getApplianceName = (applianceId: string): string => appliances.find(a => a.id === applianceId)?.name || applianceId;
  const getUserName = (userId?: string): string => {
    if (!userId) return 'N/A';
    const user = findUserById(userId);
    return user ? user.name : userId;
  }

  const handleGenerateGeneralReport = () => {
    if (!generalReportDateRange?.from || !generalReportDateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a start and end date for the general report.",
        variant: "destructive",
      });
      return;
    }

    const from = startOfDay(generalReportDateRange.from);
    const to = endOfDay(generalReportDateRange.to);
    const interval = { start: from, end: to };

    const filteredProductionLogs = productionLogs.filter(log => isWithinInterval(parseISO(log.logTime), interval));
    const productionReportData = filteredProductionLogs.map(log => [
      log.productName,
      log.batchCode,
      format(parseISO(log.logTime), "PPpp", { locale: enUS }),
      log.criticalLimitDetails,
      log.isCompliant ? "Compliant" : "Non-Compliant",
      log.correctiveAction || "N/A",
      getUserName(log.verifiedBy)
    ]);

    const filteredDeliveryLogs = deliveryLogs.filter(log => isWithinInterval(parseISO(log.deliveryTime), interval));
    const deliveryReportData = filteredDeliveryLogs.map(log => [
      format(parseISO(log.deliveryTime), "PPpp", { locale: enUS }),
      getSupplierName(log.supplierId),
      log.items.map(item => `${item.name} (Qty: ${item.quantity} ${item.unit}, Temp: ${item.temperature ?? 'N/A'}°C, ${item.isCompliant ? 'OK' : 'Not OK'})`).join('; '),
      log.isCompliant ? "Compliant" : "Non-Compliant",
      log.correctiveAction || "N/A",
      log.receivedBy || "N/A", // Assuming receivedBy might be a name string for now
      log.vehicleReg || "N/A",
    ]);
    
    const filteredTemperatureLogs = temperatureLogs.filter(log => isWithinInterval(parseISO(log.logTime), interval));
    const temperatureReportData = filteredTemperatureLogs.map(log => [
      getApplianceName(log.applianceId),
      `${log.temperature.toFixed(1)}°C`,
      format(parseISO(log.logTime), "PPpp", { locale: enUS }),
      log.isCompliant ? "Compliant" : "Non-Compliant",
      log.correctiveAction || "N/A",
      getUserName(log.loggedBy),
    ]);

    const filteredCleaningItems = cleaningChecklistItems.filter(item => 
      item.completed && item.completedAt && isWithinInterval(parseISO(item.completedAt), interval)
    );
    const cleaningReportData = filteredCleaningItems.map(item => [
      item.name,
      item.area,
      item.frequency,
      item.completedAt ? format(parseISO(item.completedAt), "PPpp", { locale: enUS }) : "N/A",
      getUserName(item.completedBy),
      item.notes || "N/A"
    ]);
    
    const reportData: ReportData = {
      reportTitle: "General Compliance Report",
      dateRangeFormatted: `${format(from, "PPP", { locale: enUS })} - ${format(to, "PPP", { locale: enUS })}`,
      generatedAt: format(new Date(), "PPpp", { locale: enUS }),
      sections: [
        {
          title: "Production Logs",
          columns: ["Product", "Batch", "Time", "Limit", "Status", "Correction", "Verified By"],
          data: productionReportData,
          emptyMessage: "No production logs found for this period."
        },
        {
          title: "Delivery Logs",
          columns: ["Time", "Supplier", "Items", "Status", "Correction", "Received By", "Vehicle"],
          data: deliveryReportData,
          emptyMessage: "No delivery logs found for this period."
        },
        {
          title: "Temperature Logs",
          columns: ["Appliance", "Temp", "Time", "Status", "Correction", "Logged By"],
          data: temperatureReportData,
          emptyMessage: "No temperature logs found for this period."
        },
        {
          title: "Completed Cleaning Tasks",
          columns: ["Task", "Area", "Freq", "Completed", "By", "Notes"],
          data: cleaningReportData,
          emptyMessage: "No completed cleaning tasks found for this period."
        }
      ]
    };

    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      let yPos = 15;

      doc.setFontSize(18);
      doc.text(reportData.reportTitle, 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Date Range: ${reportData.dateRangeFormatted}`, 14, yPos);
      yPos += 5;
      doc.text(`Generated At: ${reportData.generatedAt}`, 14, yPos);
      yPos += 10;

      reportData.sections.forEach(section => {
        if (yPos > 260 && section.data.length > 0) { // Add new page only if there's content and yPos is low
          doc.addPage();
          yPos = 15;
        }
        doc.setFontSize(14);
        doc.text(section.title, 14, yPos);
        yPos += 6;

        if (section.data.length > 0) {
          const tableStartY = yPos;
          doc.autoTable({
            head: [section.columns],
            body: section.data,
            startY: tableStartY,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, // Tailwind primary blue
            margin: { top: 10 },
            // didDrawPage is useful if you need to do something on each page the table spans
            // but for final yPos, doc.lastAutoTable.finalY is more direct.
          });
          if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') {
            yPos = doc.lastAutoTable.finalY + 10; // Space after table
          } else {
            // Fallback if lastAutoTable or finalY is not available
            yPos = tableStartY + 20 + (section.data.length * 5); // Rough estimate
          }
        } else {
          doc.setFontSize(10);
          doc.text(section.emptyMessage, 14, yPos);
          yPos += 7; // Space after text for empty message
        }
        yPos += 5; // Add some space before the next section header
      });
      
      const fileName = `General_Compliance_Report_${format(new Date(), "yyyy-MM-dd", { locale: enUS })}.pdf`;
      doc.save(fileName);

      toast({
        title: "General Report Generated",
        description: `${fileName} has been downloaded.`,
        className: "bg-accent text-accent-foreground"
      });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "An error occurred while generating the PDF. Please check the console for details.",
            variant: "destructive",
        });
    }
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
    // Placeholder for non-compliant report generation logic
    console.log("Generating Non-Compliant Logs Report for:", nonCompliantReportDateRange);
    toast({
      title: "Non-Compliant Logs Report Generation (Placeholder)",
      description: `Report for ${format(nonCompliantReportDateRange.from, "PPP", { locale: enUS })} to ${format(nonCompliantReportDateRange.to, "PPP", { locale: enUS })} is being generated. (Not yet implemented)`,
      className: "bg-accent text-accent-foreground"
    });
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
              <CardDescription>Generate a comprehensive report for all logs within a selected date range.</CardDescription>
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
                <FileText className="mr-2 h-4 w-4" /> Generate General Report
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Non-Compliant Logs Report</CardTitle>
              <CardDescription>Generate a report focusing on non-compliant logs and corrective actions.</CardDescription>
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
                <FileText className="mr-2 h-4 w-4" /> Generate Non-Compliant Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
