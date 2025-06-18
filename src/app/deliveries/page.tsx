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
import { PlusCircle, Edit2, Trash2, PackagePlus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliveryLog, DeliveryItem, Supplier } from "@/lib/types";
import { mockDeliveryLogs, mockSuppliers } from "@/lib/data";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm, Controller, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const deliveryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(0.1, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  temperature: z.coerce.number().optional(),
  isCompliant: z.boolean().default(true),
  notes: z.string().optional(),
});

const deliveryLogSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  vehicleReg: z.string().optional(),
  driverName: z.string().optional(),
  overallCondition: z.enum(['good', 'fair', 'poor']).optional(),
  items: z.array(deliveryItemSchema).min(1, "At least one item is required"),
  isCompliant: z.boolean().default(true),
  correctiveAction: z.string().optional(),
  receivedBy: z.string().optional(),
});

type DeliveryLogFormData = z.infer<typeof deliveryLogSchema>;

export default function DeliveriesPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>(mockDeliveryLogs);
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DeliveryLog | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<DeliveryLogFormData>({
    resolver: zodResolver(deliveryLogSchema),
    defaultValues: {
      supplierId: "",
      items: [{ name: "", quantity: 1, unit: "pcs", isCompliant: true }],
      isCompliant: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const overallCompliance = watch("items").every(item => item.isCompliant);
  React.useEffect(() => {
    setValue("isCompliant", overallCompliance);
  }, [overallCompliance, setValue]);

  const openDialogForNew = () => {
    reset({
      supplierId: "",
      items: [{ name: "", quantity: 1, unit: "pcs", isCompliant: true }],
      isCompliant: true,
      vehicleReg: "",
      driverName: "",
      correctiveAction: "",
      receivedBy: "",
    });
    setEditingLog(null);
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (log: DeliveryLog) => {
    setEditingLog(log);
    reset({
      supplierId: log.supplierId,
      items: log.items.map(item => ({...item})), // Ensure a deep copy for field array
      isCompliant: log.isCompliant,
      vehicleReg: log.vehicleReg || "",
      driverName: log.driverName || "",
      overallCondition: log.overallCondition,
      correctiveAction: log.correctiveAction || "",
      receivedBy: log.receivedBy || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<DeliveryLogFormData> = (data) => {
    if (editingLog) {
      setLogs(logs.map(log => log.id === editingLog.id ? { ...editingLog, ...data, deliveryTime: new Date().toISOString() } : log));
    } else {
      const newLog: DeliveryLog = {
        id: `del${logs.length + 1}`,
        ...data,
        deliveryTime: new Date().toISOString(),
      };
      setLogs([newLog, ...logs]);
    }
    setIsDialogOpen(false);
    setEditingLog(null);
  };

  const deleteLog = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };
  
  const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Delivery Logging</h1>
          <Button onClick={openDialogForNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Delivery
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit" : "Log New"} Delivery</DialogTitle>
              <DialogDescription>
                {editingLog ? "Update details for this delivery." : "Record a new incoming delivery."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Controller
                name="supplierId"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Label htmlFor="supplierId">Supplier</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="supplierId">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller name="vehicleReg" control={control} render={({ field }) => ( <div> <Label htmlFor="vehicleReg">Vehicle Registration</Label> <Input id="vehicleReg" {...field} /> </div> )} />
                <Controller name="driverName" control={control} render={({ field }) => ( <div> <Label htmlFor="driverName">Driver Name</Label> <Input id="driverName" {...field} /> </div> )} />
              </div>

              <Controller
                name="overallCondition"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="overallCondition">Overall Condition of Delivery</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="overallCondition"><SelectValue placeholder="Select condition" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Label className="block text-md font-medium mb-1">Items Delivered</Label>
              {fields.map((item, index) => (
                <Card key={item.id} className="p-4 space-y-3 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}><X className="h-4 w-4" /></Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Controller name={`items.${index}.name`} control={control} render={({ field, fieldState }) => (<div><Label>Item Name</Label><Input {...field} placeholder="e.g., Tomatoes"/> {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}</div>)} />
                    <Controller name={`items.${index}.quantity`} control={control} render={({ field, fieldState }) => (<div><Label>Quantity</Label><Input type="number" {...field} step="0.1"/> {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}</div>)} />
                    <Controller name={`items.${index}.unit`} control={control} render={({ field, fieldState }) => (<div><Label>Unit</Label><Input {...field} placeholder="e.g., kg, box"/> {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}</div>)} />
                  </div>
                  <Controller name={`items.${index}.temperature`} control={control} render={({ field }) => (<div><Label>Temperature (°C)</Label><Input type="number" {...field} placeholder="If applicable"/></div>)} />
                  <Controller name={`items.${index}.isCompliant`} control={control} render={({ field }) => (<div className="flex items-center space-x-2 pt-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`item-compliant-${index}`}/><Label htmlFor={`item-compliant-${index}`}>Item Compliant?</Label></div>)} />
                  <Controller name={`items.${index}.notes`} control={control} render={({ field }) => (<div><Label>Item Notes</Label><Textarea {...field} placeholder="e.g. Packaging damaged"/></div>)} />
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", quantity: 1, unit: "pcs", isCompliant: true })}>
                <PackagePlus className="mr-2 h-4 w-4" /> Add Another Item
              </Button>

              <Controller name="isCompliant" control={control} render={({ field }) => (<div className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} id="overallCompliant" /><Label htmlFor="overallCompliant">Overall Delivery Compliant?</Label></div>)} />
              <Controller name="correctiveAction" control={control} render={({ field }) => (<div><Label>Corrective Action (if not compliant)</Label><Textarea {...field} /></div>)} />
              <Controller name="receivedBy" control={control} render={({ field }) => (<div><Label>Received By</Label><Input {...field} /></div>)} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLog ? "Save Changes" : "Log Delivery"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Logged Deliveries</CardTitle>
            <CardDescription>History of all received deliveries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No deliveries logged yet.</TableCell>
                  </TableRow>
                )}
                {logs.map((log) => (
                  <TableRow key={log.id} className={!log.isCompliant ? "bg-destructive/10" : ""}>
                    <TableCell>{format(new Date(log.deliveryTime), "PPpp")}</TableCell>
                    <TableCell>{getSupplierName(log.supplierId)}</TableCell>
                    <TableCell>{log.items.length} item(s)</TableCell>
                    <TableCell>
                      <Badge variant={log.isCompliant ? "default" : "destructive"} className={log.isCompliant ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}>
                        {log.isCompliant ? "Compliant" : "Non-Compliant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.receivedBy || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(log)}><Edit2 className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
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
