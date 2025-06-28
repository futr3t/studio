
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
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useData } from '@/context/DataContext';
import { useToast } from "@/hooks/use-toast";
import { safeLength, safeMap, safeFilter, safeFind, ensureArray } from '@/lib/array-utils';

const NO_USER_VALUE = "__NONE__";

const productionLogSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  batchCode: z.string().min(1, "Batch code is required"),
  criticalLimitDetails: z.string().min(1, "Critical limit details are required"),
  isCompliant: z.boolean().default(true),
  correctiveAction: z.string().optional(),
  verifiedBy: z.string().optional(), // Stores User ID or NO_USER_VALUE
});

type ProductionLogFormData = z.infer<typeof productionLogSchema>;

export default function ProductionPage() {
  const { productionLogs, addProductionLog, updateProductionLog, deleteProductionLog: deleteLogFromContext, users, findUserById } = useData();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<ProductionLogFormData>({
    resolver: zodResolver(productionLogSchema),
    defaultValues: {
      productName: "",
      batchCode: "",
      criticalLimitDetails: "",
      isCompliant: true,
      correctiveAction: "",
      verifiedBy: "", // Empty string will show placeholder
    },
  });

  const isCompliantValue = watch("isCompliant");
  React.useEffect(() => {
    if (!isCompliantValue) {
        // If marked as non-compliant, correctiveAction might become required or focused
    } else {
        setValue("correctiveAction", ""); // Clear corrective action if compliant
    }
  }, [isCompliantValue, setValue]);


  const openDialogForNew = () => {
    reset({
      productName: "",
      batchCode: "",
      criticalLimitDetails: "",
      isCompliant: true,
      correctiveAction: "",
      verifiedBy: "", // Empty string for placeholder
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
     const submittedData = {
      ...data,
      verifiedBy: data.verifiedBy === NO_USER_VALUE ? undefined : data.verifiedBy,
    };
    if (editingLog) {
      updateProductionLog({ ...editingLog, ...submittedData });
      toast({ title: "Log Updated", description: `${submittedData.productName} log has been updated.`, className: "bg-accent text-accent-foreground" });
    } else {
      addProductionLog(submittedData);
      toast({ title: "Log Added", description: `${submittedData.productName} log has been added.`, className: "bg-accent text-accent-foreground" });
    }
    setIsDialogOpen(false);
    setEditingLog(null);
  };
  
  const handleDelete = (id: string) => {
    const logToDelete = safeFind(productionLogs, log => log.id === id);
    deleteLogFromContext(id);
    if (logToDelete) {
      toast({ title: "Log Deleted", description: `${logToDelete.productName} log has been removed.`, variant: "destructive" });
    }
  };

  const getVerifierNameForDisplay = (userId?: string) => {
    if (!userId || userId === NO_USER_VALUE) return 'N/A';
    const user = findUserById(userId);
    return user ? user.name : 'Unknown User';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-4 md:p-8 space-y-6">
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                    <Checkbox id="isCompliantProd" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="isCompliantProd">Is Compliant?</Label>
                  </div>
                )}
              />
              <Controller
                name="correctiveAction"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="correctiveAction">Corrective Action (if not compliant)</Label>
                    <Textarea id="correctiveAction" {...field} placeholder="e.g., Re-cooked to target temperature, Discarded batch" disabled={isCompliantValue} />
                  </div>
                )}
              />
              <Controller
                name="verifiedBy"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="verifiedBy">Verified By</Label>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger id="verifiedBy">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_USER_VALUE}>N/A (No Verifier)</SelectItem>
                        {safeMap(users, user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <CardTitle>Production History</CardTitle>
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
                {safeLength(productionLogs) === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No production logs yet.</TableCell>
                  </TableRow>
                )}
                {safeMap(productionLogs, (log) => {
                  const verifierName = getVerifierNameForDisplay(log.verifiedBy);
                  return (
                    <TableRow key={log.id} className={!log.isCompliant ? "bg-destructive/10" : ""}>
                      <TableCell className="font-medium">{log.productName}</TableCell>
                      <TableCell>{log.batchCode}</TableCell>
                      <TableCell>{format(parseISO(log.logTime), "PPpp", { locale: enUS })}</TableCell>
                      <TableCell>{log.criticalLimitDetails}</TableCell>
                      <TableCell>
                        <Badge variant={log.isCompliant ? "default" : "destructive"} className={log.isCompliant ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}>
                          {log.isCompliant ? "Compliant" : "Non-Compliant"}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.correctiveAction || "N/A"}</TableCell>
                      <TableCell>{verifierName}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(log)}>
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit Log</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Log</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

