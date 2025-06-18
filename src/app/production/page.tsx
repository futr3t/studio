"use client";

import React, { useState } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { ProductionLog } from "@/lib/types";
import { mockProductionLogs } from "@/lib/data";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const productionLogSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  batchCode: z.string().min(1, "Batch code is required"),
  criticalLimitDetails: z.string().min(1, "Critical limit details are required"),
  isCompliant: z.boolean().default(true),
  correctiveAction: z.string().optional(),
  verifiedBy: z.string().optional(),
});

type ProductionLogFormData = z.infer<typeof productionLogSchema>;

export default function ProductionPage() {
  const [logs, setLogs] = useState<ProductionLog[]>(mockProductionLogs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<ProductionLogFormData>({
    resolver: zodResolver(productionLogSchema),
    defaultValues: {
      productName: "",
      batchCode: "",
      criticalLimitDetails: "",
      isCompliant: true,
      correctiveAction: "",
      verifiedBy: "",
    },
  });

  const openDialogForNew = () => {
    reset({
      productName: "",
      batchCode: "",
      criticalLimitDetails: "",
      isCompliant: true,
      correctiveAction: "",
      verifiedBy: "",
    });
    setEditingLog(null);
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (log: ProductionLog) => {
    setEditingLog(log);
    reset({
      productName: log.productName,
      batchCode: log.batchCode,
      criticalLimitDetails: log.criticalLimitDetails,
      isCompliant: log.isCompliant,
      correctiveAction: log.correctiveAction || "",
      verifiedBy: log.verifiedBy || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<ProductionLogFormData> = (data) => {
    if (editingLog) {
      setLogs(logs.map(log => log.id === editingLog.id ? { ...editingLog, ...data, logTime: new Date().toISOString() } : log));
    } else {
      const newLog: ProductionLog = {
        id: `prod${logs.length + 1}`,
        ...data,
        logTime: new Date().toISOString(),
      };
      setLogs([newLog, ...logs]);
    }
    setIsDialogOpen(false);
    setEditingLog(null);
  };
  
  const deleteLog = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Production Logging</h1>
          <Button onClick={openDialogForNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Log
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit" : "Add New"} Production Log</DialogTitle>
              <DialogDescription>
                {editingLog ? "Update the details of this production log." : "Enter details for a new production log."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <Controller
                name="productName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" {...field} placeholder="e.g., Chicken Soup" />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="batchCode"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label htmlFor="batchCode">Batch Code</Label>
                    <Input id="batchCode" {...field} placeholder="e.g., CS20240728A" />
                     {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="criticalLimitDetails"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label htmlFor="criticalLimitDetails">Critical Limit Details</Label>
                    <Textarea id="criticalLimitDetails" {...field} placeholder="e.g., Cooked to 75°C internal temperature" />
                     {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
               <Controller
                name="isCompliant"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isCompliant" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="isCompliant">Is Compliant?</Label>
                  </div>
                )}
              />
              <Controller
                name="correctiveAction"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="correctiveAction">Corrective Action (if not compliant)</Label>
                    <Textarea id="correctiveAction" {...field} placeholder="e.g., Re-cooked to target temperature, Discarded batch" />
                  </div>
                )}
              />
              <Controller
                name="verifiedBy"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="verifiedBy">Verified By</Label>
                    <Input id="verifiedBy" {...field} placeholder="e.g., Chef John Doe" />
                  </div>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLog ? "Save Changes" : "Add Log"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Logged Production Activities</CardTitle>
            <CardDescription>Overview of all recorded production logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Batch Code</TableHead>
                  <TableHead>Log Time</TableHead>
                  <TableHead>Critical Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Corrective Action</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No production logs yet.</TableCell>
                  </TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id} className={!log.isCompliant ? "bg-destructive/10" : ""}>
                    <TableCell className="font-medium">{log.productName}</TableCell>
                    <TableCell>{log.batchCode}</TableCell>
                    <TableCell>{format(new Date(log.logTime), "PPpp")}</TableCell>
                    <TableCell>{log.criticalLimitDetails}</TableCell>
                    <TableCell>
                      <Badge variant={log.isCompliant ? "default" : "destructive"} className={log.isCompliant ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}>
                        {log.isCompliant ? "Compliant" : "Non-Compliant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.correctiveAction || "N/A"}</TableCell>
                    <TableCell>{log.verifiedBy || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(log)}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit Log</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Log</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
