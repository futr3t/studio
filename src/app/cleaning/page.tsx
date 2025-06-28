
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CleaningChecklistItem, CleaningFrequency, User } from "@/lib/types";
import { format, formatISO, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/DataContext'; // Import useData hook
import { safeLength, safeMap, safeFilter, safeFind, ensureArray } from '@/lib/array-utils';

// Assume a current user for example purposes - this would typically come from auth
const MOCK_CURRENT_USER_ID = 'user1'; // Alice Wonderland

export default function CleaningPage() {
  const { cleaningChecklistItems, users, updateCleaningChecklistItem, findUserById } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItemToComplete, setCurrentItemToComplete] = useState<CleaningChecklistItem | null>(null);
  const [completedByUserId, setCompletedByUserId] = useState(MOCK_CURRENT_USER_ID);
  const [completionNotes, setCompletionNotes] = useState('');

  const [filterFrequency, setFilterFrequency] = useState<CleaningFrequency | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // The checklist displayed is now derived directly from the context state
  const filteredChecklist = useMemo(() => {
    let items = ensureArray(cleaningChecklistItems);
    if (filterFrequency !== 'all') {
      items = safeFilter(items, item => item.frequency === filterFrequency);
    }
    if (filterStatus === 'completed') {
      items = safeFilter(items, item => item.completed);
    } else if (filterStatus === 'pending') {
      items = safeFilter(items, item => !item.completed);
    }
    if (filterDate) {
       items = safeFilter(items, item => {
        if (!item.completedAt) return filterStatus === 'pending'; // Only show pending if filtering by date and item not completed
        return format(parseISO(item.completedAt), 'yyyy-MM-dd', { locale: enUS }) === format(filterDate, 'yyyy-MM-dd', { locale: enUS });
      });
    }
    return items;
  }, [cleaningChecklistItems, filterFrequency, filterStatus, filterDate]);

  const handleToggleComplete = (item: CleaningChecklistItem, isNowChecked: boolean) => {
    if (isNowChecked) {
      setCurrentItemToComplete(item);
      setCompletedByUserId(MOCK_CURRENT_USER_ID); 
      setCompletionNotes(item.notes || ''); // Pre-fill notes if editing, or empty for new
      setIsDialogOpen(true);
    } else {
      // Mark as incomplete directly
      updateCleaningChecklistItem({ 
        ...item, 
        completed: false, 
        completedAt: undefined, 
        completedBy: undefined, 
        notes: undefined 
      });
    }
  };

  const handleSaveCompletion = () => {
    if (!currentItemToComplete || !completedByUserId) return;
    
    const updatedItem: CleaningChecklistItem = {
      ...currentItemToComplete,
      completed: true,
      completedAt: formatISO(new Date()),
      completedBy: completedByUserId,
      notes: completionNotes
    };
    updateCleaningChecklistItem(updatedItem);
    
    setIsDialogOpen(false);
    setCurrentItemToComplete(null);
    setCompletionNotes('');
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
        // If dialog is closed without saving, and an item was selected (intended to be marked complete),
        // we need to revert its checkbox state in the UI if it wasn't actually saved.
        // The source of truth is the context. If the item in context is not completed,
        // the checkbox will naturally reflect that on next render.
        // No explicit revert needed here if UI reflects context state.
        setCurrentItemToComplete(null);
    }
    setIsDialogOpen(isOpen);
  }

  const getFrequencyLabel = (freq: CleaningFrequency) => {
    const labels: Record<CleaningFrequency, string> = {
      daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', as_needed: 'As Needed'
    };
    return labels[freq];
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Cleaning Checklist</h1>

        <Card>
           <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Cleaning Schedule</CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filterFrequency} onValueChange={(value) => setFilterFrequency(value as CleaningFrequency | 'all')}>
                  <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Filter by frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'completed' | 'pending')}>
                  <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full md:w-[200px] justify-start text-left font-normal",!filterDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate ? format(filterDate, "PPP", { locale: enUS }) : <span>Filter by date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus /></PopoverContent>
                </Popover>
                <Button variant="ghost" onClick={() => { setFilterFrequency('all'); setFilterStatus('all'); setFilterDate(undefined);}} className="text-sm">Clear Filters</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Completed</TableHead>
                  <TableHead>Completed By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeLength(filteredChecklist) === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center">No cleaning tasks match your filters, or no tasks available.</TableCell></TableRow>
                )}
                {safeMap(filteredChecklist, (item) => {
                  const completedByUser = item.completedBy ? findUserById(item.completedBy)?.name : undefined;
                  return (
                    <TableRow key={item.id} className={item.completed ? "" : "font-semibold"}>
                      <TableCell>
                        <Checkbox
                          id={`task-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={(checked) => handleToggleComplete(item, !!checked)}
                          aria-label={`Mark ${item.name} as ${item.completed ? 'incomplete' : 'complete'}`}
                        />
                      </TableCell>
                      <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>{item.name}</TableCell>
                      <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>{item.area}</TableCell>
                      <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>
                        <Badge variant="secondary">{getFrequencyLabel(item.frequency)}</Badge>
                      </TableCell>
                      <TableCell className={item.completed ? "text-muted-foreground" : ""}>
                        {item.completedAt ? format(parseISO(item.completedAt), "PPpp", { locale: enUS }) : "Pending"}
                      </TableCell>
                      <TableCell className={item.completed ? "text-muted-foreground" : ""}>{completedByUser || (item.completedBy ? "Unknown User" : "N/A")}</TableCell>
                      <TableCell className={cn("text-xs", item.completed ? "text-muted-foreground" : "")}>{item.notes || "N/A"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Task Completion: {currentItemToComplete?.name}</DialogTitle>
                    <DialogDescription>Please provide completion details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="completedBy">Completed By</Label>
                        <Select value={completedByUserId} onValueChange={setCompletedByUserId}>
                            <SelectTrigger id="completedBy"><SelectValue placeholder="Select user" /></SelectTrigger>
                            <SelectContent>
                                {safeMap(users, user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="completionNotes">Notes (Optional)</Label>
                        <Textarea id="completionNotes" value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Any relevant notes"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                    <Button onClick={handleSaveCompletion} disabled={!completedByUserId.trim()}>Save Completion</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
