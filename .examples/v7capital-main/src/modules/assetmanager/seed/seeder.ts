/**
 * V7 Capital Fund Seeder Script
 * 
 * This script seeds the database with V7 Fund data using raw SQL for reliability.
 * Run with: npx tsx src/modules/assetmanager/seed/seeder.ts
 */

import { db } from '@database/drizzle/index';
import { sql } from 'drizzle-orm';
import { seedData } from './data';

async function clearExistingData() {
  console.log('🗑️  Clearing existing data...');
  
  try {
    await db.execute(sql`DELETE FROM transactions`);
    console.log('   ✓ Cleared transactions');
  } catch {
    console.log('   - No transactions to clear');
  }
  
  try {
    await db.execute(sql`DELETE FROM securities`);
    console.log('   ✓ Cleared securities');
  } catch {
    console.log('   - No securities to clear');
  }
  
  try {
    await db.execute(sql`DELETE FROM rounds`);
    console.log('   ✓ Cleared rounds');
  } catch {
    console.log('   - No rounds to clear');
  }
  
  try {
    await db.execute(sql`DELETE FROM funds`);
    console.log('   ✓ Cleared funds');
  } catch {
    console.log('   - No funds to clear');
  }
  
  try {
    await db.execute(sql`DELETE FROM stakeholder_users`);
    console.log('   ✓ Cleared stakeholder users');
  } catch {
    console.log('   - No stakeholder users to clear');
  }

  try {
    await db.execute(sql`DELETE FROM stakeholders`);
    console.log('   ✓ Cleared stakeholders');
  } catch {
    console.log('   - No stakeholders to clear');
  }
}

async function createStakeholders() {
  console.log('👥 Creating stakeholders...');
  
  const stakeholderMap: { [key: string]: number } = {};
  
  for (const stakeholder of seedData.stakeholders) {
    try {
      const result = await db.execute(sql`
        INSERT INTO stakeholders (stakeholder_name, type)
        VALUES (${stakeholder.stakeholderName}, ${stakeholder.type})
        RETURNING id
      `);
      
      const id = (result.rows[0] as any).id;
      stakeholderMap[stakeholder.stakeholderName] = id;
      console.log(`   ✓ Created stakeholder: ${stakeholder.stakeholderName} (ID: ${id})`);
    } catch (error) {
      console.error(`   ❌ Error creating stakeholder ${stakeholder.stakeholderName}:`, error);
      throw error;
    }
  }
  
  return stakeholderMap;
}

async function createStakeholderUserRelationships(stakeholderMap: { [key: string]: number }) {
  console.log('🔗 Creating stakeholder-user relationships...');
  
  // Get the first admin user (typically the one who would access all stakeholders)
  const adminUserResult = await db.execute(sql`
    SELECT id FROM user_profiles 
    WHERE role = 'ADMIN' OR role = 'EDITOR' OR role = 'VIEWER'
    ORDER BY id ASC 
    LIMIT 1
  `);
  
  if (adminUserResult.rows.length === 0) {
    console.log('   ⚠️  No admin/editor/viewer user found - stakeholder-user relationships not created');
    console.log('   ℹ️  Stakeholders will only be visible if you create them manually through the UI');
    return;
  }
  
  const adminUserId = (adminUserResult.rows[0] as any).id;
  console.log(`   ℹ️  Using user ID ${adminUserId} for stakeholder relationships`);
  
  for (const [stakeholderName, stakeholderId] of Object.entries(stakeholderMap)) {
    try {
      await db.execute(sql`
        INSERT INTO stakeholder_users (user_profile_id, stakeholder_id, role)
        VALUES (${adminUserId}, ${stakeholderId}, 'ADMIN')
      `);
      console.log(`   ✓ Linked user ${adminUserId} to stakeholder: ${stakeholderName}`);
    } catch (error) {
      console.error(`   ❌ Error linking user to stakeholder ${stakeholderName}:`, error);
      throw error;
    }
  }
}

async function createFundAndRounds() {
  console.log('💰 Creating fund and rounds...');
  
  // Create fund
  const fundResult = await db.execute(sql`
    INSERT INTO funds (name, description, target_size, vintage, status)
    VALUES (
      ${seedData.fund.name},
      ${seedData.fund.description},
      ${seedData.fund.targetSize},
      ${seedData.fund.vintage},
      ${seedData.fund.status}
    )
    RETURNING id
  `);
  
  const fundId = (fundResult.rows[0] as any).id;
  console.log(`   ✓ Created fund: ${seedData.fund.name} (ID: ${fundId})`);
  
  // Create rounds
  const roundIds: number[] = [];
  
  for (const round of seedData.rounds) {
    try {
      const roundResult = await db.execute(sql`
        INSERT INTO rounds (
          fund_id, round_name, round_type, round_date, 
          target_amount, raised_amount, pre_money_valuation, post_money_valuation
        )
        VALUES (
          ${fundId},
          ${round.roundName},
          ${round.roundType},
          ${round.roundDate},
          ${round.targetAmount},
          ${round.raisedAmount},
          ${round.preMoneyValuation},
          ${round.postMoneyValuation}
        )
        RETURNING id
      `);
      
      const roundId = (roundResult.rows[0] as any).id;
      roundIds.push(roundId);
      console.log(`   ✓ Created round: ${round.roundName} (ID: ${roundId})`);
    } catch (error) {
      console.error(`   ❌ Error creating round ${round.roundName}:`, error);
      throw error;
    }
  }
  
  return { fundId, roundIds };
}

async function createSecurities(roundIds: number[]) {
  console.log('📜 Creating securities...');
  
  const securityIds: number[] = [];
  
  for (const security of seedData.securities) {
    try {
      const roundId = roundIds[security.roundIndex];
      
      const securityResult = await db.execute(sql`
        INSERT INTO securities (
          round_id, security_name, code, security_type, currency, 
          issue_price, is_preferred, has_voting_rights, voting_ratio
        )
        VALUES (
          ${roundId},
          ${security.securityName},
          ${security.code},
          ${security.securityType},
          ${security.currency},
          ${security.issuePrice},
          ${security.isPreferred},
          ${security.hasVotingRights},
          ${security.votingRatio}
        )
        RETURNING id
      `);
      
      const securityId = (securityResult.rows[0] as any).id;
      securityIds.push(securityId);
      console.log(`   ✓ Created security: ${security.securityName} (ID: ${securityId})`);
    } catch (error) {
      console.error(`   ❌ Error creating security ${security.securityName}:`, error);
      throw error;
    }
  }
  
  return securityIds;
}

async function createTransactions(
  stakeholderMap: { [key: string]: number },
  fundId: number,
  roundIds: number[],
  securityIds: number[]
) {
  console.log('💸 Creating transactions...');
  
  let transactionCount = 0;
  
  for (const transaction of seedData.transactions) {
    try {
      const stakeholderId = stakeholderMap[transaction.stakeholder];
      const roundId = roundIds[transaction.roundIndex];
      const securityId = securityIds[transaction.roundIndex];
      
      if (!stakeholderId) {
        console.error(`   ❌ Stakeholder not found: ${transaction.stakeholder}`);
        continue;
      }
      
      await db.execute(sql`
        INSERT INTO transactions (
          transaction_date, transaction_reference, transaction_type,
          stakeholder_id, security_id, fund_id, round_id,
          amount_debit, amount_credit, units_debit, units_credit, notes
        )
        VALUES (
          ${transaction.date},
          ${transaction.ref},
          ${transaction.type},
          ${stakeholderId},
          ${securityId},
          ${fundId},
          ${roundId},
          ${transaction.debit},
          ${transaction.credit},
          ${transaction.unitsDebit},
          ${transaction.unitsCredit},
          ${transaction.notes}
        )
      `);
      
      transactionCount++;
      
      // Log progress every 10 transactions
      if (transactionCount % 10 === 0) {
        console.log(`   📊 Created ${transactionCount} transactions...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error creating transaction ${transaction.ref}:`, error);
      throw error;
    }
  }
  
  console.log(`   ✅ Created total ${transactionCount} transactions`);
  return transactionCount;
}

async function runSeeder() {
  console.log('🌱 Starting V7 Capital Fund seeding...\n');
  
  try {
    // Step 1: Clear existing data
    await clearExistingData();
    console.log('');
    
    // Step 2: Create stakeholders
    const stakeholderMap = await createStakeholders();
    console.log('');
    
    // Step 3: Create stakeholder-user relationships
    await createStakeholderUserRelationships(stakeholderMap);
    console.log('');
    
    // Step 4: Create fund and rounds
    const { fundId, roundIds } = await createFundAndRounds();
    console.log('');
    
    // Step 5: Create securities
    const securityIds = await createSecurities(roundIds);
    console.log('');
    
    // Step 6: Create transactions
    const transactionCount = await createTransactions(
      stakeholderMap,
      fundId,
      roundIds,
      securityIds
    );
    console.log('');
    
    // Summary
    console.log('✅ Seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Stakeholders: ${Object.keys(stakeholderMap).length}`);
    console.log(`   - Fund: 1 (${seedData.fund.name})`);
    console.log(`   - Rounds: ${roundIds.length}`);
    console.log(`   - Securities: ${securityIds.length}`);
    console.log(`   - Transactions: ${transactionCount}`);
    console.log('');
    console.log('🎉 V7 Capital Fund data has been successfully seeded!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Check if this is the main module being run
if (require.main === module) {
  runSeeder().catch((error) => {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  });
}

export { runSeeder };
