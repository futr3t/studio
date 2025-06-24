
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
// Remove dependency on mock data - use current date instead
const STATIC_NOW = new Date(); 

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

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
  lastAutoTable?: { finalY?: number }; 
}

export default function ReportsPage() {
  const { 
    productionLogs, 
    deliveryLogs, 
    temperatureLogs, 
    cleaningChecklistItems,
    suppliers,
    appliances,
    users, 
    findUserById 
  } = useData();
  const { toast } = useToast();

  const [generalReportDateRange, setGeneralReportDateRange] = useState<DateRange | undefined>({
    from: subDays(STATIC_NOW, 29), 
    to: STATIC_NOW, 
  });
  const [nonCompliantReportDateRange, setNonCompliantReportDateRange] = useState<DateRange | undefined>({
    from: subDays(STATIC_NOW, 29), 
    to: STATIC_NOW, 
  });

  const getSupplierName = (supplierId: string): string => suppliers.find(s => s.id === supplierId)?.name || supplierId;
  const getApplianceName = (applianceId: string): string => appliances.find(a => a.id === applianceId)?.name || applianceId;
  const getApplianceById = (applianceId: string): Appliance | undefined => appliances.find(a => a.id === applianceId);

  const getUserName = (userId?: string): string => {
    if (!userId || userId === "__NONE__") return 'N/A';
    const user = findUserById(userId);
    return user ? user.name : userId;
  }

  const generatePdfForReport = (reportData: ReportData, fileNamePrefix: string) => {
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
        if (yPos > 260 && section.data.length > 0) { 
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
            headStyles: { fillColor: [59, 130, 246] }, 
            margin: { top: 10 },
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: { 0: { cellWidth: 'auto' } } 
          });
          if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') {
            yPos = doc.lastAutoTable.finalY + 10; 
          } else {
            yPos = tableStartY + 20 + (section.data.length * 5); 
          }
        } else {
          doc.setFontSize(10);
          doc.text(section.emptyMessage, 14, yPos);
          yPos += 7; 
        }
        yPos += 5; 
      });
      
      const fileName = `${fileNamePrefix}_Report_${format(new Date(), "yyyy-MM-dd", { locale: enUS })}.pdf`;
      doc.save(fileName);

      toast({
        title: `${fileNamePrefix} Report Generated`,
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
      log.items.map(item => `${item.name} (Qty: ${item.quantity} ${item.unit}, Temp: ${item.temperature ?? 'N/A'}°C, ${item.isCompliant ? 'OK' : 'Not OK'})`).join('; ') || "N/A",
      log.isCompliant ? "Compliant" : "Non-Compliant",
      log.correctiveAction || "N/A",
      getUserName(log.receivedBy),
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

    generatePdfForReport(reportData, "General_Compliance");
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
    
    const from = startOfDay(nonCompliantReportDateRange.from);
    const to = endOfDay(nonCompliantReportDateRange.to);
    const interval = { start: from, end: to };

    const nonCompliantProduction = productionLogs
      .filter(log => !log.isCompliant && isWithinInterval(parseISO(log.logTime), interval))
      .map(log => [
        log.productName,
        log.batchCode,
        format(parseISO(log.logTime), "PPpp", { locale: enUS }),
        log.criticalLimitDetails,
        log.correctiveAction || "N/A",
        getUserName(log.verifiedBy)
      ]);

    const nonCompliantDeliveries = deliveryLogs
      .filter(log => !log.isCompliant && isWithinInterval(parseISO(log.deliveryTime), interval))
      .map(log => {
        const nonCompliantItemsSummary = log.items
          .filter(item => !item.isCompliant)
          .map(item => `${item.name} (Qty: ${item.quantity} ${item.unit}, Temp: ${item.temperature ?? 'N/A'}°C, Notes: ${item.notes || 'N/A'})`)
          .join('; ') || "Overall delivery non-compliant.";
        return [
          format(parseISO(log.deliveryTime), "PPpp", { locale: enUS }),
          getSupplierName(log.supplierId),
          nonCompliantItemsSummary,
          log.correctiveAction || "N/A",
          getUserName(log.receivedBy),
          log.vehicleReg || "N/A"
        ];
      });
    
    const nonCompliantTemperatures = temperatureLogs
      .filter(log => !log.isCompliant && isWithinInterval(parseISO(log.logTime), interval))
      .map(log => {
        const appliance = getApplianceById(log.applianceId);
        const expectedRange = appliance 
          ? `${appliance.minTemp ?? 'N/A'}°C - ${appliance.maxTemp ?? 'N/A'}°C`
          : 'N/A';
        return [
          getApplianceName(log.applianceId),
          `${log.temperature.toFixed(1)}°C`,
          format(parseISO(log.logTime), "PPpp", { locale: enUS }),
          expectedRange,
          log.correctiveAction || "N/A",
          getUserName(log.loggedBy)
        ];
      });

    const reportData: ReportData = {
      reportTitle: "Non-Compliant Logs Report",
      dateRangeFormatted: `${format(from, "PPP", { locale: enUS })} - ${format(to, "PPP", { locale: enUS })}`,
      generatedAt: format(new Date(), "PPpp", { locale: enUS }),
      sections: [
        {
          title: "Non-Compliant Production Logs",
          columns: ["Product", "Batch", "Time", "Limit Details", "Corrective Action", "Verified By"],
          data: nonCompliantProduction,
          emptyMessage: "No non-compliant production logs found for this period."
        },
        {
          title: "Non-Compliant Delivery Logs",
          columns: ["Time", "Supplier", "Non-Compliant Details", "Corrective Action", "Received By", "Vehicle Reg"],
          data: nonCompliantDeliveries,
          emptyMessage: "No non-compliant delivery logs found for this period."
        },
        {
          title: "Non-Compliant Temperature Logs",
          columns: ["Appliance", "Temp (°C)", "Time", "Expected Range", "Corrective Action", "Logged By"],
          data: nonCompliantTemperatures,
          emptyMessage: "No non-compliant temperature logs found for this period."
        }
      ]
    };
    
    generatePdfForReport(reportData, "Non_Compliant");
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
    

    