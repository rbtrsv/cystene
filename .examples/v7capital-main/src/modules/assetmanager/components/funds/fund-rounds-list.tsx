'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunds } from '../../hooks/use-funds';
import { useRounds } from '../../hooks/use-rounds';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { PlusCircle, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/modules/shadcnui/components/ui/table';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/modules/shadcnui/components/ui/tooltip';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { type Round } from '../../schemas/rounds.schemas';
import { type FundWithRounds } from '../../schemas/funds.schemas';

interface FundRoundsListProps {
  fundId: number;
}

export default function FundRoundsList({ fundId }: FundRoundsListProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { selectedFund, fetchFundWithRounds, isLoading: fundLoading, error: fundError, clearError: clearFundError } = useFunds();
  const { removeRound, isLoading: roundLoading, error: roundError, clearError: clearRoundError } = useRounds();

  const [searchTerm, setSearchTerm] = useState('');
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null);
  
  // Combined loading and error states
  const isLoading = fundLoading || roundLoading;
  const error = fundError || roundError;
  const clearError = () => {
    clearFundError();
    clearRoundError();
  };
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchFundWithRounds(fundId);
  }, [fundId, fetchFundWithRounds]);
  
  // ===== EVENT HANDLERS =====
  const handleAddRound = () => {
    router.push(`/dashboard/funds/${fundId}/rounds/new`);
  };
  
  const handleEditRound = (roundId: number) => {
    router.push(`/dashboard/funds/${fundId}/rounds/${roundId}/edit`);
  };
  
  const handleDeleteRound = async (round: Round) => {
    if (round.id) {
      const success = await removeRound(round.id);
      if (success) {
        setRoundToDelete(null);
        fetchFundWithRounds(fundId);
      }
    }
  };
  
  // ===== HELPER FUNCTIONS =====
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // ===== DERIVED STATE =====
  const rounds = selectedFund && 'rounds' in selectedFund 
    ? (selectedFund as FundWithRounds).rounds || [] 
    : [];
  
  // Filter rounds based on search term
  const filteredRounds = rounds.filter(round => {
    return (
      round.roundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      round.roundType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // ===== CONDITIONAL RENDERING =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Rounds</CardTitle>
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
          <CardTitle>Fund Rounds</CardTitle>
          <CardDescription>Error loading rounds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchFundWithRounds(fundId)} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rounds for {selectedFund?.name}</CardTitle>
          <CardDescription>Manage funding rounds</CardDescription>
        </div>
        <Button onClick={handleAddRound}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Round
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
        </div>
        
        {rounds.length === 0 ? (
          <div className="py-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No rounds have been added to this fund yet.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleAddRound}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add First Round
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                {filteredRounds.length === 0 
                  ? 'No rounds found' 
                  : `Showing ${filteredRounds.length} of ${rounds.length} rounds`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">{round.roundName}</TableCell>
                    <TableCell>
                      <Badge>{round.roundType}</Badge>
                    </TableCell>
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
                                onClick={() => round.id && handleEditRound(round.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <AlertDialog open={roundToDelete?.id === round.id} onOpenChange={(open) => {
                            if (!open) setRoundToDelete(null);
                          }}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setRoundToDelete(round)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Round</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the round &quot;{round.roundName}&quot;? 
                                  This action cannot be undone and will affect all associated transactions and securities.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRound(round)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
