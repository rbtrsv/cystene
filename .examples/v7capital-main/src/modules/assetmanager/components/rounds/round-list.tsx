'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRounds } from '../../hooks/use-rounds';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/modules/shadcnui/components/ui/table';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/modules/shadcnui/components/ui/tooltip';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { type Round, type RoundType, roundTypeEnum } from '../../schemas/rounds.schemas';

export default function RoundList() {
  const router = useRouter();
  const { 
    rounds, 
    isLoading, 
    error, 
    fetchRounds, 
    removeRound,
    clearError 
  } = useRounds();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<RoundType | 'ALL'>('ALL');
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null);
  
  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);
  
  // Filter rounds based on search term and type filter
  const filteredRounds = rounds.filter(round => {
    const matchesSearch = round.roundName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' ? true : round.roundType === filterType;
    
    return matchesSearch && matchesType;
  });
  
  const handleDelete = async (round: Round) => {
    if (round.id) {
      const success = await removeRound(round.id);
      if (success) {
        setRoundToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/rounds/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/rounds/${id}/edit`);
  };
  
  const handleCreate = () => {
    router.push('/dashboard/rounds/new');
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Helper function to format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  // Helper function to get round type badge
  const getRoundTypeBadge = (type: RoundType) => {
    const colorMap: Record<RoundType, string> = {
      'Seed': 'bg-green-500',
      'Pre Series A': 'bg-blue-500',
      'Series A': 'bg-purple-500',
      'Series B': 'bg-indigo-500',
      'Series C': 'bg-pink-500',
      'Debt': 'bg-red-500',
      'Convertible': 'bg-orange-500',
      'SAFE': 'bg-yellow-500',
      'Bridge': 'bg-teal-500',
      'Secondary': 'bg-gray-500',
      'Other': 'bg-slate-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {type}
      </Badge>
    );
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
          <CardDescription>Loading rounds...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
          <CardDescription>Error loading rounds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchRounds()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rounds</CardTitle>
          <CardDescription>Manage funding rounds</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Round
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search rounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as RoundType | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.values(roundTypeEnum.enum).map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="text-sm min-w-[1000px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredRounds.length === 0 
                ? 'No rounds found' 
                : `Showing ${filteredRounds.length} of ${rounds.length} rounds`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Target Amount</TableHead>
                <TableHead>Raised Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRounds.map((round) => (
                <TableRow key={round.id}>
                  <TableCell className="font-medium">{round.roundName}</TableCell>
                  <TableCell>{getRoundTypeBadge(round.roundType)}</TableCell>
                  <TableCell>{formatDate(round.roundDate)}</TableCell>
                  <TableCell>{formatCurrency(round.targetAmount)}</TableCell>
                  <TableCell>{formatCurrency(round.raisedAmount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => round.id && handleViewDetails(round.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => round.id && handleEdit(round.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={roundToDelete?.id === round.id} onOpenChange={(open) => {
                        if (!open) setRoundToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRoundToDelete(round)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Round</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the round &quot;{round.roundName}&quot;? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(round)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {filteredRounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rounds found
            </div>
          ) : (
            filteredRounds.map((round) => (
              <div key={round.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {round.roundName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => round.id && handleViewDetails(round.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => round.id && handleEdit(round.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={roundToDelete?.id === round.id} onOpenChange={(open) => {
                      if (!open) setRoundToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRoundToDelete(round)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Round</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the round &quot;{round.roundName}&quot;? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(round)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Type and date row */}
                <div className="flex items-center gap-2 mb-2">
                  {getRoundTypeBadge(round.roundType)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(round.roundDate)}
                  </span>
                </div>

                {/* Amounts row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Target: </span>
                    <span className="font-mono">{formatCurrency(round.targetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Raised: </span>
                    <span className="font-mono">{formatCurrency(round.raisedAmount)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
