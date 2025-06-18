
"use client";

import React, { useState, useEffect } from 'react';
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CleaningChecklistItem, CleaningFrequency, User } from "@/lib/types";
import { mockCleaningChecklist, mockUsers } from "@/lib/data";
import { format, formatISO, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface CompletionFormData {
  completedBy: string;
  notes?: string;
}

// Assume the first user is the currently logged-in user for this example
const currentUser: User | undefined = mockUsers[0];

export default function CleaningPage() {
  const [checklist, setChecklist] = useState<CleaningChecklistItem[]>(mockCleaningChecklist);
  const [filteredChecklist, setFilteredChecklist] = useState<CleaningChecklistItem[]>(mockCleaningChecklist);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<CleaningChecklistItem | null>(null);
  const [completedBy, setCompletedBy] = useState(currentUser?.name || '');
  const [completionNotes, setCompletionNotes] = useState('');
  const { toast } = useToast();

  const [filterFrequency, setFilterFrequency] = useState<CleaningFrequency | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);


  useEffect(() => {
    let items = [...checklist];
    if (filterFrequency !== 'all') {
      items = items.filter(item => item.frequency === filterFrequency);
    }
    if (filterStatus === 'completed') {
      items = items.filter(item => item.completed);
    } else if (filterStatus === 'pending') {
      items = items.filter(item => !item.completed);
    }
    if (filterDate) {
       items = items.filter(item => {
        if (!item.completedAt) return filterStatus === 'pending'; 
        return format(parseISO(item.completedAt), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
      });
    }
    setFilteredChecklist(items);
  }, [checklist, filterFrequency, filterStatus, filterDate]);


  const handleToggleComplete = (itemId: string, completed: boolean) => {
    const item = checklist.find(i => i.id === itemId);
    if (!item) return;

    if (completed) { 
      setCurrentItem(item);
      setCompletedBy(currentUser?.name || item.completedBy || ""); // Pre-fill with current user or existing
      setCompletionNotes(item.notes || "");
      setIsDialogOpen(true);
    } else { 
      setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, completed: false, completedAt: undefined, completedBy: undefined, notes: undefined } : i));
      toast({ title: "Task Incomplete", description: `${item.name} marked as pending.` });
    }
  };

  const handleSaveCompletion = () => {
    if (!currentItem) return;
    setChecklist(prev => prev.map(i => i.id === currentItem.id ? { 
      ...i, 
      completed: true, 
      completedAt: formatISO(new Date()), 
      completedBy: completedBy,
      notes: completionNotes
    } : i));
    toast({ title: "Task Completed!", description: `${currentItem.name} marked as complete.`, className: "bg-accent text-accent-foreground" });
    setIsDialogOpen(false);
    setCurrentItem(null);
    // Reset notes, completedBy will be pre-filled next time
    setCompletionNotes(''); 
  };
  
  const getFrequencyLabel = (freq: CleaningFrequency) => {
    const labels: Record<CleaningFrequency, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      as_needed: 'As Needed'
    };
    return labels[freq];
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Cleaning Checklist</h1>

        <Card>
           <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Cleaning Schedule</CardTitle>
                <CardDescription>Manage and track all cleaning tasks.</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filterFrequency} onValueChange={(value) => setFilterFrequency(value as CleaningFrequency | 'all')}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Filter by frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frequencies</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'completed' | 'pending')}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full md:w-[200px] justify-start text-left font-normal",
                        !filterDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate ? format(filterDate, "PPP") : <span>Filter by date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" onClick={() => {
                  setFilterFrequency('all');
                  setFilterStatus('all');
                  setFilterDate(undefined);
                }} className="text-sm">Clear Filters</Button>
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
                {filteredChecklist.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No cleaning tasks match your filters, or no tasks available.</TableCell>
                  </TableRow>
                )}
                {filteredChecklist.map((item) => (
                  <TableRow key={item.id} className={item.completed ? "" : "font-semibold"}>
                    <TableCell>
                      <Checkbox
                        id={`task-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={(checked) => handleToggleComplete(item.id, !!checked)}
                        aria-label={`Mark ${item.name} as ${item.completed ? 'incomplete' : 'complete'}`}
                      />
                    </TableCell>
                    <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>{item.name}</TableCell>
                    <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>{item.area}</TableCell>
                    <TableCell className={item.completed ? "text-muted-foreground line-through" : ""}>
                      <Badge variant="secondary">{getFrequencyLabel(item.frequency)}</Badge>
                    </TableCell>
                    <TableCell className={item.completed ? "text-muted-foreground" : ""}>
                      {item.completedAt ? format(parseISO(item.completedAt), "PPpp") : "Pending"}
                    </TableCell>
                    <TableCell className={item.completed ? "text-muted-foreground" : ""}>{item.completedBy || "N/A"}</TableCell>
                    <TableCell className={cn("text-xs", item.completed ? "text-muted-foreground" : "")}>{item.notes || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Task Completion: {currentItem?.name}</DialogTitle>
                    <DialogDescription>Please provide completion details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="completedBy">Completed By</Label>
                        <Input 
                            id="completedBy" 
                            value={completedBy} 
                            onChange={(e) => setCompletedBy(e.target.value)} 
                            placeholder="Your name"
                            readOnly // Made read-only as it's pre-filled
                        />
                    </div>
                    <div>
                        <Label htmlFor="completionNotes">Notes (Optional)</Label>
                        <Textarea id="completionNotes" value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Any relevant notes"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setIsDialogOpen(false);
                        setCurrentItem(null);
                        if(currentItem) {
                           setChecklist(prev => prev.map(i => i.id === currentItem.id ? { ...i, completed: false } : i));
                        }
                    }}>Cancel</Button>
                    <Button onClick={handleSaveCompletion} disabled={!completedBy.trim()}>Save Completion</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

    