'use server';

import { db } from '@database/drizzle';
import { transactions } from '@database/drizzle';
import { eq, and, inArray, desc, like } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { revalidatePath } from 'next/cache';
import {
  type TransactionResponse,
  type TransactionsResponse,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionType,
  type Transaction,
  CreateTransactionSchema,
  UpdateTransactionSchema
} from '@/modules/assetmanager/schemas/transactions.schemas';
import {
  type StakeholderLockup,
  type StakeholderLockupsResponse
} from '@/modules/assetmanager/schemas/securities.schemas';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get next sequential transaction reference
 * @param transactionType Optional transaction type to determine prefix
 * @returns Promise with next sequential reference
 */
export async function getNextTransactionReference(transactionType?: TransactionType): Promise<string> {
  return withAuth(async (profile) => {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // Choose prefix based on transaction type
      let prefix = 'TXN';
      if (transactionType) {
        switch (transactionType) {
          case 'CASH_IN':
          case 'CASH_OUT':
            prefix = 'CASH';
            break;
          case 'ISSUANCE':
            prefix = 'ISS';
            break;
          case 'TRANSFER_IN':
          case 'TRANSFER_OUT':
            prefix = 'TRF';
            break;
          case 'DIVIDEND':
            prefix = 'DIV';
            break;
          case 'GRANT':
          case 'VEST':
          case 'EXERCISE':
            prefix = 'OPT';
            break;
          default:
            prefix = 'TXN';
        }
      }
      
      // Query for the last transaction reference created today
      const lastTransaction = await db
        .select({ transactionReference: transactions.transactionReference })
        .from(transactions)
        .where(like(transactions.transactionReference, `%-${today}-%`))
        .orderBy(desc(transactions.transactionReference))
        .limit(1);
      
      let nextNumber = 1;
      
      if (lastTransaction.length > 0) {
        // Extract the number from the last reference (e.g., "TXN-20250616-003" -> 3)
        const lastRef = lastTransaction[0].transactionReference;
        const match = lastRef.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      // Format with leading zeros (001, 002, etc.)
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      return `${prefix}-${today}-${paddedNumber}`;
      
    } catch (error) {
      console.error('Error generating sequential reference:', error);
      // Fallback to random if database query fails
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `TXN-${today}-${random}`;
    }
  });
}

// ==========================================
// Core CRUD Operations
// ==========================================

/**
 * Create a new transaction
 * @param data Transaction data
 * @returns Promise with transaction response
 */
export async function createTransaction(data: CreateTransactionInput): Promise<TransactionResponse> {
  return withAuth(async (profile) => {
    try {
      // Validate input data
      CreateTransactionSchema.parse(data);
      
      // Check if user has permission to create transactions
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create transactions'
        };
      }
      
      // Insert the transaction
      // @ts-ignore - Ignore TypeScript error about database transaction
      const [newTransaction] = await db.insert(transactions)
        .values({
          transactionDate: new Date(data.transactionDate),
          transactionReference: data.transactionReference,
          stakeholderId: data.stakeholderId,
          securityId: data.securityId,
          fundId: data.fundId,
          roundId: data.roundId,
          transactionType: data.transactionType,
          amountDebit: data.amountDebit || 0,
          amountCredit: data.amountCredit || 0,
          unitsDebit: data.unitsDebit || 0,
          unitsCredit: data.unitsCredit || 0,
          relatedTransactionId: data.relatedTransactionId || null,
          notes: data.notes || null
        })
        .returning();
      
      // Convert database types to schema types
      const typedTransaction = convertToTypedTransaction(newTransaction);
      
      // Revalidate related pages
      revalidatePath('/dashboard/transactions');
      
      return {
        success: true,
        data: typedTransaction
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction'
      };
    }
  });
}

/**
 * Get a transaction by ID
 * @param id ID of the transaction to retrieve
 * @returns Promise with transaction response
 */
export async function getTransaction(id: number): Promise<TransactionResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view transactions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view transactions'
        };
      }
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, id)
      });

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Check if stakeholder user has access to this transaction
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(transaction.stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this transaction'
        };
      }

      // Convert database types to schema types
      const typedTransaction = convertToTypedTransaction(transaction);

      return {
        success: true,
        data: typedTransaction
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction'
      };
    }
  });
}

/**
 * Update a transaction
 * @param id ID of the transaction to update
 * @param data Updated transaction data
 * @returns Promise with transaction response
 */
export async function updateTransaction(id: number, data: UpdateTransactionInput): Promise<TransactionResponse> {
  return withAuth(async (profile) => {
    try {
      // Validate input data
      UpdateTransactionSchema.parse(data);
      
      // Get the transaction to check permissions
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, id)
      });
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }
      
      // Check if user has permission to update this transaction
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this transaction'
        };
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);
      if (data.transactionReference !== undefined) updateData.transactionReference = data.transactionReference;
      if (data.stakeholderId) updateData.stakeholderId = data.stakeholderId;
      if (data.securityId) updateData.securityId = data.securityId;
      if (data.fundId) updateData.fundId = data.fundId;
      if (data.roundId) updateData.roundId = data.roundId;
      if (data.transactionType) updateData.transactionType = data.transactionType;
      if (data.amountDebit !== undefined) updateData.amountDebit = data.amountDebit;
      if (data.amountCredit !== undefined) updateData.amountCredit = data.amountCredit;
      if (data.unitsDebit !== undefined) updateData.unitsDebit = data.unitsDebit;
      if (data.unitsCredit !== undefined) updateData.unitsCredit = data.unitsCredit;
      if (data.relatedTransactionId !== undefined) updateData.relatedTransactionId = data.relatedTransactionId;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      // Update the transaction
      // @ts-ignore - Ignore TypeScript error about database transaction
      const [updatedTransaction] = await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      
      // Convert database types to schema types
      const typedTransaction = convertToTypedTransaction(updatedTransaction);
      
      return {
        success: true,
        data: typedTransaction
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transaction'
      };
    }
  });
}

/**
 * Delete a transaction
 * @param id ID of the transaction to delete
 * @returns Promise with transaction response
 */
export async function deleteTransaction(id: number): Promise<TransactionResponse> {
  return withAuth(async (profile) => {
    try {
      // Get the transaction to check permissions
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, id)
      });
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }
      
      // Check if user has permission to delete this transaction
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete this transaction'
        };
      }
      
      // Delete the transaction
      // @ts-ignore - Ignore TypeScript error about database transaction
      const [deletedTransaction] = await db.delete(transactions)
        .where(eq(transactions.id, id))
        .returning();
      
      // Convert database types to schema types
      const typedTransaction = {
        ...deletedTransaction,
        transactionDate: new Date(deletedTransaction.transactionDate),
        transactionType: deletedTransaction.transactionType as TransactionType,
        amountDebit: Number(deletedTransaction.amountDebit),
        amountCredit: Number(deletedTransaction.amountCredit),
        unitsDebit: Number(deletedTransaction.unitsDebit),
        unitsCredit: Number(deletedTransaction.unitsCredit)
      };
      
      return {
        success: true,
        data: typedTransaction
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete transaction'
      };
    }
  });
}

/**
 * Helper function to convert database transaction to typed transaction
 */
function convertToTypedTransaction(dbTransaction: any): Transaction {
  return {
    ...dbTransaction,
    transactionDate: new Date(dbTransaction.transactionDate),
    transactionType: dbTransaction.transactionType as TransactionType,
    amountDebit: dbTransaction.amountDebit ?? 0,
    amountCredit: dbTransaction.amountCredit ?? 0,
    unitsDebit: dbTransaction.unitsDebit ?? 0,
    unitsCredit: dbTransaction.unitsCredit ?? 0
  };
}

/**
 * Get all transactions
 * @returns Promise with transactions response
 */
export async function getTransactions(): Promise<TransactionsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view transactions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view transactions'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      
      let result;
      
      if (stakeholderIds.length > 0) {
        // For stakeholder users - filter by their stakeholder IDs
        result = await db.select()
          .from(transactions)
          .where(inArray(transactions.stakeholderId, stakeholderIds))
          .orderBy(desc(transactions.transactionDate));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(transactions)
          .orderBy(desc(transactions.transactionDate));
      }
        
      // Convert database types to schema types
      const typedTransactions = result.map(convertToTypedTransaction);
      
      return {
        success: true,
        data: typedTransactions
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  });
}

/**
 * Get transactions for a specific stakeholder
 * @param stakeholderId ID of the stakeholder
 * @returns Promise with transactions response
 */
export async function getTransactionsByStakeholder(stakeholderId: number): Promise<TransactionsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view transactions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view transactions'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder\'s transactions'
        };
      }
      
      const result = await db.select().from(transactions)
        .where(eq(transactions.stakeholderId, stakeholderId))
        .orderBy(desc(transactions.transactionDate));
        
      // Convert database types to schema types
      const typedTransactions = result.map(convertToTypedTransaction);
      
      return {
        success: true,
        data: typedTransactions
      };
    } catch (error) {
      console.error('Error fetching transactions by stakeholder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  });
}

/**
 * Get transactions for a specific security
 * @param securityId ID of the security
 * @returns Promise with transactions response
 */
export async function getTransactionsBySecurity(securityId: number): Promise<TransactionsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view transactions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view transactions'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      
      let result;
      
      if (stakeholderIds.length > 0) {
        // For stakeholder users - filter by security AND stakeholder
        result = await db.select()
          .from(transactions)
          .where(
            and(
              eq(transactions.securityId, securityId),
              inArray(transactions.stakeholderId, stakeholderIds)
            )
          )
          .orderBy(desc(transactions.transactionDate));
      } else {
        // For global users - filter by security only
        result = await db.select()
          .from(transactions)
          .where(eq(transactions.securityId, securityId))
          .orderBy(desc(transactions.transactionDate));
      }
        
      // Convert database types to schema types
      const typedTransactions = result.map(convertToTypedTransaction);
      
      return {
        success: true,
        data: typedTransactions
      };
    } catch (error) {
      console.error('Error fetching transactions by security:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  });
}

/**
 * Get transactions for a specific round
 * @param roundId ID of the round
 * @returns Promise with transactions response
 */
export async function getTransactionsByRound(roundId: number): Promise<TransactionsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view transactions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.TRANSACTIONS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view transactions'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      
      let result;
      
      if (stakeholderIds.length > 0) {
        // For stakeholder users - filter by round AND stakeholder
        result = await db.select()
          .from(transactions)
          .where(
            and(
              eq(transactions.roundId, roundId),
              inArray(transactions.stakeholderId, stakeholderIds)
            )
          )
          .orderBy(desc(transactions.transactionDate));
      } else {
        // For global users - filter by round only
        result = await db.select()
          .from(transactions)
          .where(eq(transactions.roundId, roundId))
          .orderBy(desc(transactions.transactionDate));
      }
        
      // Convert database types to schema types
      const typedTransactions = result.map(convertToTypedTransaction);
      
      return {
        success: true,
        data: typedTransactions
      };
    } catch (error) {
      console.error('Error fetching transactions by round:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      };
    }
  });
}

// ==========================================
// Specialized Transaction Patterns
// ==========================================

/**
 * Create an investment transaction (TRANSFER_OUT from fund, TRANSFER_IN to investor, CASH_IN to fund)
 * @param fundId ID of the fund
 * @param investorStakeholderId ID of the investor stakeholder
 * @param securityId ID of the security
 * @param roundId ID of the round
 * @param units Number of units being transferred
 * @param amount Amount of cash being invested
 * @param transactionDate Date of the transaction
 * @param notes Optional notes
 * @returns Promise with the created transactions
 */
/**
 * Create an investment transaction (ISSUANCE)
 * Entity Perspective: Fund receives cash (amountDebit), issues units to stakeholder (unitsCredit)
 * @param fundId ID of the fund
 * @param investorStakeholderId ID of the investor stakeholder receiving units
 * @param securityId ID of the security
 * @param roundId ID of the round
 * @param units Number of units being issued to the investor
 * @param amount Amount of cash received from investor
 * @param transactionDate Date of the transaction
 * @param notes Optional notes
 * @returns Promise with the created ISSUANCE transaction
 */
export async function createInvestmentTransaction(
  fundId: number,
  investorStakeholderId: number,
  securityId: number,
  roundId: number,
  units: number,
  amount: number,
  transactionDate: Date | string,
  notes?: string
): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions for creating transactions
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.TRANSACTIONS);

      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create investment transactions'
        };
      }

      // Generate transaction reference
      const transactionReference = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Entity Perspective: Single ISSUANCE transaction
      // - amountDebit = Fund RECEIVES cash from investor
      // - unitsCredit = Fund ISSUES units TO investor (stakeholder receives)
      const issuanceResult = await createTransaction({
        stakeholderId: investorStakeholderId,
        securityId,
        fundId,
        roundId,
        transactionType: 'ISSUANCE',
        transactionDate,
        amountDebit: amount,   // Fund receives cash
        unitsCredit: units,    // Fund issues units to stakeholder
        notes: notes || `Investment: ${amount} for ${units} units`,
        transactionReference
      });

      if (!issuanceResult.success) {
        return {
          success: false,
          error: issuanceResult.error || 'Failed to create issuance transaction'
        };
      }

      return {
        success: true,
        data: issuanceResult.data!
      };
    } catch (error) {
      console.error('Error creating investment transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create investment transaction'
      };
    }
  });
}

/**
 * Create a security transfer (TRANSFER_OUT from sender, TRANSFER_IN to receiver)
 * Entity Perspective:
 * - TRANSFER_OUT: unitsDebit = sender loses units
 * - TRANSFER_IN: unitsCredit = receiver gains units
 * @param fromStakeholderId ID of the sender stakeholder
 * @param toStakeholderId ID of the receiver stakeholder
 * @param securityId ID of the security
 * @param fundId ID of the fund
 * @param roundId ID of the round
 * @param units Number of units being transferred
 * @param transactionDate Date of the transaction
 * @param notes Optional notes
 * @returns Promise with the created transactions
 */
export async function createSecurityTransfer(
  fromStakeholderId: number,
  toStakeholderId: number,
  securityId: number,
  fundId: number,
  roundId: number,
  units: number,
  transactionDate: Date | string,
  notes?: string
): Promise<{ success: boolean; data?: { transferOut: Transaction; transferIn: Transaction }; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions for creating transactions
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.TRANSACTIONS);

      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create security transfer'
        };
      }

      // Generate a shared transaction reference
      const transactionReference = `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Entity Perspective:
      // 1. TRANSFER_OUT: sender loses units (unitsDebit)
      const transferOutResult = await createTransaction({
        stakeholderId: fromStakeholderId,
        securityId,
        fundId,
        roundId,
        transactionType: 'TRANSFER_OUT',
        transactionDate,
        unitsDebit: units, // Sender loses units
        notes: notes ? `${notes} - Transfer out` : `Transfer of ${units} units to stakeholder ${toStakeholderId}`,
        transactionReference
      });

      if (!transferOutResult.success) {
        return {
          success: false,
          error: transferOutResult.error || 'Failed to create transfer out transaction'
        };
      }

      // 2. TRANSFER_IN: receiver gains units (unitsCredit)
      const transferInResult = await createTransaction({
        stakeholderId: toStakeholderId,
        securityId,
        fundId,
        roundId,
        transactionType: 'TRANSFER_IN',
        transactionDate,
        unitsCredit: units, // Receiver gains units
        notes: notes ? `${notes} - Transfer in` : `Receipt of ${units} units from stakeholder ${fromStakeholderId}`,
        transactionReference,
        relatedTransactionId: transferOutResult.data?.id
      });

      if (!transferInResult.success) {
        return {
          success: false,
          error: transferInResult.error || 'Failed to create transfer in transaction'
        };
      }

      // Return both transactions
      return {
        success: true,
        data: {
          transferOut: transferOutResult.data!,
          transferIn: transferInResult.data!
        }
      };
    } catch (error) {
      console.error('Error creating security transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create security transfer'
      };
    }
  });
}

/**
 * Create a distribution transaction (DISTRIBUTION)
 * Entity Perspective: Fund pays cash to stakeholder (amountCredit)
 * @param fundId ID of the fund
 * @param stakeholderId ID of the stakeholder receiving the distribution
 * @param securityId ID of the security
 * @param roundId ID of the round
 * @param amount Amount of the distribution
 * @param transactionDate Date of the transaction
 * @param notes Optional notes
 * @returns Promise with the created DISTRIBUTION transaction
 */
export async function createDividendTransaction(
  fundId: number,
  stakeholderId: number,
  securityId: number,
  roundId: number,
  amount: number,
  transactionDate: Date | string,
  notes?: string
): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions for creating transactions
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.TRANSACTIONS);

      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create distribution transaction'
        };
      }

      // Generate transaction reference
      const transactionReference = `DIV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Entity Perspective: Single DISTRIBUTION transaction
      // - amountCredit = Fund PAYS cash to stakeholder
      const distributionResult = await createTransaction({
        stakeholderId,
        securityId,
        fundId,
        roundId,
        transactionType: 'DISTRIBUTION',
        transactionDate,
        amountCredit: amount, // Fund pays cash to stakeholder
        notes: notes || `Distribution: ${amount}`,
        transactionReference
      });

      if (!distributionResult.success) {
        return {
          success: false,
          error: distributionResult.error || 'Failed to create distribution transaction'
        };
      }

      return {
        success: true,
        data: distributionResult.data!
      };
    } catch (error) {
      console.error('Error creating distribution transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create distribution transaction'
      };
    }
  });
}

// ==========================================
// Stakeholder Lockup Data
// ==========================================

/**
 * Get lockup data for stakeholder's investments
 * Joins transactions with securities to include lockupMonths
 * @returns Promise with lockup data response
 */
export async function getStakeholderLockupData(): Promise<StakeholderLockupsResponse> {
  // Import securities table here to avoid circular dependency
  const { securities } = await import('@database/drizzle');

  return withAuth(async (profile) => {
    try {
      // Get stakeholder IDs for filtering (same pattern as getTransactions)
      const stakeholderIds = await getStakeholderIds(profile);

      let result;

      if (stakeholderIds.length > 0) {
        // For stakeholder users - filter by their stakeholder IDs and join with securities
        result = await db
          .select({
            transactionId: transactions.id,
            transactionDate: transactions.transactionDate,
            securityId: transactions.securityId,
            securityCode: securities.code,
            securityName: securities.securityName,
            amountDebit: transactions.amountDebit,
            amountCredit: transactions.amountCredit,
            unitsCredit: transactions.unitsCredit,
            lockupMonths: securities.lockupMonths,
          })
          .from(transactions)
          .innerJoin(securities, eq(transactions.securityId, securities.id))
          .where(
            and(
              inArray(transactions.stakeholderId, stakeholderIds),
              // Only get transactions where stakeholder received units
            )
          )
          .orderBy(desc(transactions.transactionDate));
      } else {
        // No stakeholder IDs - return empty
        return {
          success: true,
          data: []
        };
      }

      // Convert to typed response
      const lockupData: StakeholderLockup[] = result.map(row => ({
        transactionId: row.transactionId,
        transactionDate: new Date(row.transactionDate),
        securityId: row.securityId,
        securityCode: row.securityCode,
        securityName: row.securityName,
        amount: Number(row.amountDebit) > 0 ? Number(row.amountDebit) : Number(row.amountCredit),
        unitsCredit: Number(row.unitsCredit),
        lockupMonths: row.lockupMonths ? Number(row.lockupMonths) : null,
      }));

      return {
        success: true,
        data: lockupData
      };
    } catch (error) {
      console.error('Error fetching stakeholder lockup data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lockup data'
      };
    }
  });
}
