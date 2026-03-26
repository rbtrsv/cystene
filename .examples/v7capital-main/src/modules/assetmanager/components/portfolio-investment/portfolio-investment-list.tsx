'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvestmentPortfolio } from '@/modules/assetmanager/hooks/use-portfolio-investment';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
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
import { Pencil, Trash2, Eye, Plus, TrendingUp, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  type InvestmentPortfolio,
  portfolioStatusEnum,
  sectorTypeEnum
} from '@/modules/assetmanager/schemas/portfolio-investment.schemas';

export default function InvestmentPortfolioList() {
  const router = useRouter();
  const {
    portfolios,
    totalFundUnits,
    isLoading,
    error,
    fetchPortfoliosWithRelations,
    fetchFundUnits,
    removePortfolio,
    clearError,
    getPortfolioMetrics,
    getCompanyName,
    getFundName,
    getRoundName,
    getWeightedAverageIRR
  } = useInvestmentPortfolio();

  const { funds } = useFunds();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [portfolioToDelete, setPortfolioToDelete] = useState<InvestmentPortfolio | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: 'company' | 'investmentType' | 'investment' | 'fairValue' | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  useEffect(() => {
    fetchPortfoliosWithRelations();
    fetchFundUnits();
  }, [fetchPortfoliosWithRelations, fetchFundUnits]);
  
  // Filter portfolios based on search term and filters
  const filteredPortfolios = portfolios.filter(portfolio => {
    const matchesSearch =
      getCompanyName(portfolio.companyId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getFundName(portfolio.fundId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portfolio.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || portfolio.portfolioStatus === statusFilter;
    const matchesSector = sectorFilter === 'ALL' || portfolio.sector === sectorFilter;
    const matchesFund = filterFund === 'ALL' ? true : portfolio.fundId.toString() === filterFund;

    return matchesSearch && matchesStatus && matchesSector && matchesFund;
  });

  // Sort portfolios based on sort configuration
  const sortedPortfolios = React.useMemo(() => {
    if (!sortConfig.key) return filteredPortfolios;

    return [...filteredPortfolios].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      switch (sortConfig.key) {
        case 'company':
          aValue = getCompanyName(a.companyId) || '';
          bValue = getCompanyName(b.companyId) || '';
          break;
        case 'investmentType':
          aValue = a.investmentType;
          bValue = b.investmentType;
          break;
        case 'investment':
          aValue = a.investmentAmount || 0;
          bValue = b.investmentAmount || 0;
          break;
        case 'fairValue':
          aValue = a.currentFairValue || 0;
          bValue = b.currentFairValue || 0;
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === '') return 1;
      if (bValue === null || bValue === '') return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredPortfolios, sortConfig, getCompanyName]);
  
  const handleDelete = async (portfolio: InvestmentPortfolio) => {
    if (portfolio.id) {
      const success = await removePortfolio(portfolio.id);
      if (success) {
        setPortfolioToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/portfolio/investments/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/portfolio/investments/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/portfolio/investments/new');
  };

  const handleSort = (key: 'company' | 'investmentType' | 'investment' | 'fairValue') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: 'company' | 'investmentType' | 'investment' | 'fairValue') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 inline-block" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 inline-block" />
      : <ArrowDown className="ml-1 h-3 w-3 inline-block" />;
  };

  const formatPercentage = (value: number | null) => {
    if (!value) return 'N/A';
    return `${value}%`;
  };

  const formatCurrency = (value: number | null) => {
    if (!value || value === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const metrics = getPortfolioMetrics();

  // Calculate MOIC automatically based on current fair value and investment
  const calculateMOIC = (portfolio: InvestmentPortfolio) => {
    if (!portfolio.investmentAmount || !portfolio.currentFairValue) return 'N/A';

    const investment = portfolio.investmentAmount;
    const currentFairValue = portfolio.currentFairValue;

    if (investment === 0) return 'N/A';

    const moic = currentFairValue / investment;
    return moic.toFixed(2);
  };

  // Calculate average MOIC
  const calculateAverageMOIC = () => {
    const validPortfolios = portfolios.filter(p =>
      p.investmentAmount &&
      p.currentFairValue &&
      p.investmentAmount > 0
    );

    if (validPortfolios.length === 0) return 'N/A';

    const totalMOIC = validPortfolios.reduce((sum, p) => {
      const investment = p.investmentAmount!;
      const currentFairValue = p.currentFairValue!;
      return sum + (currentFairValue / investment);
    }, 0);

    return (totalMOIC / validPortfolios.length).toFixed(2);
  };

  // Calculate weighted average IRR using the hook method
  const calculateAverageIRR = () => {
    const weightedIRR = getWeightedAverageIRR();
    return weightedIRR === 0 ? 'N/A' : weightedIRR.toFixed(1);
  };

  // Calculate NAV and NAV per Share using fund units from transactions
  const calculateNAVMetrics = () => {
    // NAV/SHARE CALCULATION - DO NOT CHANGE DATA SOURCES:
    // NAV = Sum of ALL portfolio currentFairValue (regardless of status - Exited/Written Off should have €0)
    // Total Fund Units = Sum of (unitsDebit - unitsCredit) from TRANSACTIONS table (NOT company shares from portfolio!)
    // NAV/Share = NAV ÷ Total Fund Units
    const totalNAV = portfolios.reduce((sum, p) => sum + (p.currentFairValue || 0), 0);
    const navPerShare = (totalFundUnits && totalFundUnits > 0) ? totalNAV / totalFundUnits : 0;

    return {
      totalNAV,
      totalFundUnits: totalFundUnits || 0,
      navPerShare
    };
  };

  const navMetrics = calculateNAVMetrics();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Exited':
        return 'secondary';
      case 'Written Off':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>Loading portfolio investments...</CardDescription>
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
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>Error loading portfolio investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchPortfoliosWithRelations()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalCurrentValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.portfolioCount} investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NAV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(navMetrics.totalNAV)}</div>
            <p className="text-xs text-muted-foreground">
              Net Asset Value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NAV/Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {navMetrics.navPerShare > 0
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(navMetrics.navPerShare)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {navMetrics.totalFundUnits > 0 ? `${new Intl.NumberFormat('en-US').format(navMetrics.totalFundUnits)} fund units` : 'No fund units'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average MOIC</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageMOIC()}{calculateAverageMOIC() !== 'N/A' ? 'x' : ''}</div>
            <p className="text-xs text-muted-foreground">
              Multiple on invested capital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average IRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageIRR()}{calculateAverageIRR() !== 'N/A' ? '%' : ''}</div>
            <p className="text-xs text-muted-foreground">
              Internal rate of return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Portfolio Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Investment Portfolio</CardTitle>
            <CardDescription>Manage your portfolio investments</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Investment
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search companies, funds, or notes..."
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {portfolioStatusEnum.options.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sectors</SelectItem>
                {sectorTypeEnum.options.map((sector) => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterFund} onValueChange={setFilterFund}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id!.toString()}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="text-sm min-w-[1700px]">
              <TableCaption className="text-xs text-muted-foreground">
                {filteredPortfolios.length === 0 
                  ? 'No portfolio investments found' 
                  : `Showing ${filteredPortfolios.length} of ${portfolios.length} investments`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center">
                      Company{getSortIcon('company')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('investmentType')}
                  >
                    <div className="flex items-center">
                      Inv. Type{getSortIcon('investmentType')}
                    </div>
                  </TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('investment')}
                  >
                    <div className="flex items-center justify-end">
                      Investment{getSortIcon('investment')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ownership</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Share Price</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => handleSort('fairValue')}
                  >
                    <div className="flex items-center justify-end">
                      Current Fair Value{getSortIcon('fairValue')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">MOIC</TableHead>
                  <TableHead className="text-right">IRR</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPortfolios.map((portfolio) => (
                  <TableRow key={portfolio.id}>
                    <TableCell className="font-medium">
                      {getCompanyName(portfolio.companyId) || `Company ${portfolio.companyId}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(portfolio.portfolioStatus)}>
                        {portfolio.portfolioStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{portfolio.companyType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{portfolio.investmentType}</Badge>
                    </TableCell>
                    <TableCell>
                      {portfolio.sector}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(portfolio.investmentAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(portfolio.ownershipPercentage)}
                    </TableCell>
                    <TableCell className="text-right">
                      {portfolio.numberOfShares ? new Intl.NumberFormat('en-US').format(portfolio.numberOfShares) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(portfolio.sharePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(portfolio.currentFairValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {calculateMOIC(portfolio)}{calculateMOIC(portfolio) !== 'N/A' ? 'x' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(portfolio.irr)}
                    </TableCell>
                    <TableCell>
                      {getFundName(portfolio.fundId) || `Fund ${portfolio.fundId}`}
                    </TableCell>
                    <TableCell>
                      {getRoundName(portfolio.roundId) || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => portfolio.id && handleViewDetails(portfolio.id)}
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
                                onClick={() => portfolio.id && handleEdit(portfolio.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <AlertDialog open={portfolioToDelete?.id === portfolio.id} onOpenChange={(open) => {
                          if (!open) setPortfolioToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPortfolioToDelete(portfolio)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Investment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this portfolio investment for &quot;{getCompanyName(portfolio.companyId) || `Company ${portfolio.companyId}`}&quot;? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(portfolio)}
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
            {filteredPortfolios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No portfolio investments found
              </div>
            ) : (
              filteredPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                  {/* Header row with company and actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {getCompanyName(portfolio.companyId) || `Company ${portfolio.companyId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => portfolio.id && handleViewDetails(portfolio.id)}
                        className="h-7 w-7"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => portfolio.id && handleEdit(portfolio.id)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog open={portfolioToDelete?.id === portfolio.id} onOpenChange={(open) => {
                        if (!open) setPortfolioToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPortfolioToDelete(portfolio)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this portfolio investment for &quot;{getCompanyName(portfolio.companyId) || `Company ${portfolio.companyId}`}&quot;? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(portfolio)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Status and fund row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(portfolio.portfolioStatus)}>{portfolio.portfolioStatus}</Badge>
                    <Badge variant="outline">{portfolio.companyType}</Badge>
                    <Badge variant="secondary">{portfolio.investmentType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {getFundName(portfolio.fundId) || `Fund ${portfolio.fundId}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {getRoundName(portfolio.roundId) || 'N/A'}
                    </span>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Investment: </span>
                      <span className="font-mono">{formatCurrency(portfolio.investmentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Fair Value: </span>
                      <span className="font-mono">{formatCurrency(portfolio.currentFairValue)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shares: </span>
                      <span className="font-mono">{portfolio.numberOfShares ? new Intl.NumberFormat('en-US').format(portfolio.numberOfShares) : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Share Price: </span>
                      <span className="font-mono">{formatCurrency(portfolio.sharePrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MOIC: </span>
                      <span className="font-mono">{calculateMOIC(portfolio)}x</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ownership: </span>
                      <span className="font-mono">{portfolio.ownershipPercentage ? `${portfolio.ownershipPercentage}%` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
