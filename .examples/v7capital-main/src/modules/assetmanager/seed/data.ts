/**
 * Complete Seed Data for V7 Capital Fund - CORRECTED ACCOUNTING LOGIC
 * 
 * This file contains all the seed data with properly fixed transaction accounting
 * using correct debit/credit logic: debit = increase, credit = decrease for units
 */

export const seedData = {
  // V7 Fund data
  fund: {
    name: "V7 Fund",
    description: "V7 Capital investment fund",
    targetSize: "10000000.00", // €10M target
    vintage: 2017,
    status: "Active"
  },

  // Fund rounds data
  rounds: [
    {
      roundName: "Round 1",
      roundType: "Seed",
      roundDate: "2017-09-01",
      targetAmount: "5500000.00",
      raisedAmount: "5500000.00",
      preMoneyValuation: "0.00",
      postMoneyValuation: "5500000.00"
    },
    {
      roundName: "Round 2", 
      roundType: "Series A",
      roundDate: "2022-12-01",
      targetAmount: "2700000.00",
      raisedAmount: "2700000.00",
      preMoneyValuation: "8000000.00",
      postMoneyValuation: "10700000.00"
    },
    {
      roundName: "Round 3",
      roundType: "Series A+",
      roundDate: "2023-09-07", 
      targetAmount: "1250000.00",
      raisedAmount: "1250000.00",
      preMoneyValuation: "9500000.00",
      postMoneyValuation: "10750000.00"
    },
    {
      roundName: "Round 4",
      roundType: "Series B",
      roundDate: "2024-06-04",
      targetAmount: "1650000.00",
      raisedAmount: "1650000.00",
      preMoneyValuation: "12000000.00",
      postMoneyValuation: "13650000.00"
    },
    {
      roundName: "Round 5",
      roundType: "Series B+",
      roundDate: "2025-03-20",
      targetAmount: "3300000.00",
      raisedAmount: "3300000.00",
      preMoneyValuation: "15000000.00",
      postMoneyValuation: "18300000.00"
    }
  ],

  // All unique stakeholders from Excel data
  stakeholders: [
    { stakeholderName: "V7 Stakeholder", type: "Fund" },
    { stakeholderName: "Iulian Circiumaru", type: "Investor" },
    { stakeholderName: "Andrei Cretu", type: "Investor" },
    { stakeholderName: "Catalin Ivascu/ CI Equity", type: "Investor" },
    { stakeholderName: "Cristian Circiumaru", type: "Investor" },
    { stakeholderName: "Sergiu Gidei", type: "Investor" },
    { stakeholderName: "Paul Murariu/ Tengo Office", type: "Investor" },
    { stakeholderName: "Anca Macovei", type: "Investor" },
    { stakeholderName: "Bogdan Ionascu/ BFI Corporation", type: "Investor" },
    { stakeholderName: "Alexandru Birsan", type: "Investor" },
    { stakeholderName: "Catalin Suliman", type: "Investor" },
    { stakeholderName: "Difrnt Ventures", type: "Investor" },
    { stakeholderName: "Vlad Ionescu", type: "Investor" },
    { stakeholderName: "Cosmin Alexandru", type: "Investor" },
    { stakeholderName: "Octavian Petrescu", type: "Investor" },
    { stakeholderName: "Andrei Costescu", type: "Investor" },
    { stakeholderName: "Sabrina Chiriches", type: "Investor" },
    { stakeholderName: "Cristina Filip", type: "Investor" },
    { stakeholderName: "Robert Maxim", type: "Investor" },
    { stakeholderName: "Toni Pera", type: "Investor" },
    { stakeholderName: "Flip Ventures", type: "Investor" },
    { stakeholderName: "Stefan Toderita", type: "Investor" },
    { stakeholderName: "InspireAM", type: "Investor" }
  ],

  // Securities for each round (Common Shares)
  securities: [
    {
      roundIndex: 0, // Round 1
      securityName: "V7 Fund Common Shares - Round 1",
      code: "V7-CS-R1",
      securityType: "Common Shares",
      currency: "EUR",
      issuePrice: "2.75",
      isPreferred: false,
      hasVotingRights: true,
      votingRatio: "1.00"
    },
    {
      roundIndex: 1, // Round 2
      securityName: "V7 Fund Common Shares - Round 2", 
      code: "V7-CS-R2",
      securityType: "Common Shares",
      currency: "EUR",
      issuePrice: "2.75",
      isPreferred: false,
      hasVotingRights: true,
      votingRatio: "1.00"
    },
    {
      roundIndex: 2, // Round 3
      securityName: "V7 Fund Common Shares - Round 3",
      code: "V7-CS-R3", 
      securityType: "Common Shares",
      currency: "EUR",
      issuePrice: "3.05",
      isPreferred: false,
      hasVotingRights: true,
      votingRatio: "1.00"
    },
    {
      roundIndex: 3, // Round 4
      securityName: "V7 Fund Common Shares - Round 4",
      code: "V7-CS-R4",
      securityType: "Common Shares", 
      currency: "EUR",
      issuePrice: "3.00",
      isPreferred: false,
      hasVotingRights: true,
      votingRatio: "1.00"
    },
    {
      roundIndex: 4, // Round 5
      securityName: "V7 Fund Common Shares - Round 5",
      code: "V7-CS-R5",
      securityType: "Common Shares",
      currency: "EUR", 
      issuePrice: "2.88",
      isPreferred: false,
      hasVotingRights: true,
      votingRatio: "1.00"
    }
  ],

  // ALL transactions with CORRECTED accounting logic
  transactions: [
    // ===== ROUND 1 - 2017-09-01 =====
    
    // Group 1: Initial issuance - CORRECTED: Fund gains shares via debit
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "ISS-20170901-001", type: "ISSUANCE", debit: "0.00", credit: "0.00", unitsDebit: "2000000", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 issues 2000000 shares at €2.75" },
    
    // Group 2: Iulian Circiumaru - 812,000 shares for €2,233,000
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-002", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "812000", date: "2017-09-01", notes: "V7 transfers 812000 shares to Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 0, ref: "TRF-20170901-002", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "812000", unitsCredit: "0.00", date: "2017-09-01", notes: "Iulian Circiumaru receives 812000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-003", type: "CASH_IN", debit: "2233000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €2233000 from Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 0, ref: "CASH-20170901-003", type: "CASH_OUT", debit: "0.00", credit: "2233000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Iulian Circiumaru pays €2233000 to V7 Fund" },
    
    // Group 3: Andrei Cretu - 602,000 shares for €1,655,500
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-004", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "602000", date: "2017-09-01", notes: "V7 transfers 602000 shares to Andrei Cretu" },
    { stakeholder: "Andrei Cretu", roundIndex: 0, ref: "TRF-20170901-004", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "602000", unitsCredit: "0.00", date: "2017-09-01", notes: "Andrei Cretu receives 602000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-005", type: "CASH_IN", debit: "1655500", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €1655500 from Andrei Cretu" },
    { stakeholder: "Andrei Cretu", roundIndex: 0, ref: "CASH-20170901-005", type: "CASH_OUT", debit: "0.00", credit: "1655500", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Andrei Cretu pays €1655500 to V7 Fund" },
    
    // Group 4: Catalin Ivascu/ CI Equity - 334,000 shares for €918,500
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-006", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "334000", date: "2017-09-01", notes: "V7 transfers 334000 shares to Catalin Ivascu/ CI Equity" },
    { stakeholder: "Catalin Ivascu/ CI Equity", roundIndex: 0, ref: "TRF-20170901-006", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "334000", unitsCredit: "0.00", date: "2017-09-01", notes: "Catalin Ivascu/ CI Equity receives 334000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-007", type: "CASH_IN", debit: "918500", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €918500 from Catalin Ivascu/ CI Equity" },
    { stakeholder: "Catalin Ivascu/ CI Equity", roundIndex: 0, ref: "CASH-20170901-007", type: "CASH_OUT", debit: "0.00", credit: "918500", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Catalin Ivascu/ CI Equity pays €918500 to V7 Fund" },
    
    // Group 5: Cristian Circiumaru - 112,000 shares for €308,000
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-008", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "112000", date: "2017-09-01", notes: "V7 transfers 112000 shares to Cristian Circiumaru" },
    { stakeholder: "Cristian Circiumaru", roundIndex: 0, ref: "TRF-20170901-008", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "112000", unitsCredit: "0.00", date: "2017-09-01", notes: "Cristian Circiumaru receives 112000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-009", type: "CASH_IN", debit: "308000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €308000 from Cristian Circiumaru" },
    { stakeholder: "Cristian Circiumaru", roundIndex: 0, ref: "CASH-20170901-009", type: "CASH_OUT", debit: "0.00", credit: "308000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Cristian Circiumaru pays €308000 to V7 Fund" },
    
    // Group 6: Sergiu Gidei - 88,000 shares for €242,000
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-010", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "88000", date: "2017-09-01", notes: "V7 transfers 88000 shares to Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 0, ref: "TRF-20170901-010", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "88000", unitsCredit: "0.00", date: "2017-09-01", notes: "Sergiu Gidei receives 88000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-011", type: "CASH_IN", debit: "242000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €242000 from Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 0, ref: "CASH-20170901-011", type: "CASH_OUT", debit: "0.00", credit: "242000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Sergiu Gidei pays €242000 to V7 Fund" },
    
    // Group 7: Paul Murariu/ Tengo Office - 32,000 shares for €88,000
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-012", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "32000", date: "2017-09-01", notes: "V7 transfers 32000 shares to Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 0, ref: "TRF-20170901-012", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "32000", unitsCredit: "0.00", date: "2017-09-01", notes: "Paul Murariu/ Tengo Office receives 32000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-013", type: "CASH_IN", debit: "88000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €88000 from Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 0, ref: "CASH-20170901-013", type: "CASH_OUT", debit: "0.00", credit: "88000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Paul Murariu/ Tengo Office pays €88000 to V7 Fund" },
    
    // Group 8: Anca Macovei - 20,000 shares for €55,000
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "TRF-20170901-014", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "20000", date: "2017-09-01", notes: "V7 transfers 20000 shares to Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 0, ref: "TRF-20170901-014", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "20000", unitsCredit: "0.00", date: "2017-09-01", notes: "Anca Macovei receives 20000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 0, ref: "CASH-20170901-015", type: "CASH_IN", debit: "55000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "V7 receives €55000 from Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 0, ref: "CASH-20170901-015", type: "CASH_OUT", debit: "0.00", credit: "55000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2017-09-01", notes: "Anca Macovei pays €55000 to V7 Fund" },

    // ===== ROUND 2 - 2022-12-01 =====
    
    // Group 1: Initial issuance - CORRECTED: Fund gains shares via debit
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "ISS-20221201-001", type: "ISSUANCE", debit: "0.00", credit: "0.00", unitsDebit: "940001", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 issues 940001 shares at €2.75" },
    
    // Group 2: Bogdan Ionascu/ BFI Corporation - 363,636 shares for €999,999
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-002", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "363636", date: "2022-12-01", notes: "V7 transfers 363636 shares to Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 1, ref: "TRF-20221201-002", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "363636", unitsCredit: "0.00", date: "2022-12-01", notes: "Bogdan Ionascu/ BFI Corporation receives 363636 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-003", type: "CASH_IN", debit: "999999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €999999 from Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 1, ref: "CASH-20221201-003", type: "CASH_OUT", debit: "0.00", credit: "999999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Bogdan Ionascu/ BFI Corporation pays €999999 to V7 Fund" },
    
    // Group 3: Alexandru Birsan - 145,455 shares for €400,001
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-004", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "145455", date: "2022-12-01", notes: "V7 transfers 145455 shares to Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 1, ref: "TRF-20221201-004", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "145455", unitsCredit: "0.00", date: "2022-12-01", notes: "Alexandru Birsan receives 145455 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-005", type: "CASH_IN", debit: "400001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €400001 from Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 1, ref: "CASH-20221201-005", type: "CASH_OUT", debit: "0.00", credit: "400001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Alexandru Birsan pays €400001 to V7 Fund" },
    
    // Group 4: Catalin Suliman - 72,727 shares for €199,999
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-006", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "72727", date: "2022-12-01", notes: "V7 transfers 72727 shares to Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 1, ref: "TRF-20221201-006", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "72727", unitsCredit: "0.00", date: "2022-12-01", notes: "Catalin Suliman receives 72727 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-007", type: "CASH_IN", debit: "199999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €199999 from Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 1, ref: "CASH-20221201-007", type: "CASH_OUT", debit: "0.00", credit: "199999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Catalin Suliman pays €199999 to V7 Fund" },
    
    // Group 5: Difrnt Ventures - 36,364 shares for €100,001
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-008", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "36364", date: "2022-12-01", notes: "V7 transfers 36364 shares to Difrnt Ventures" },
    { stakeholder: "Difrnt Ventures", roundIndex: 1, ref: "TRF-20221201-008", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "36364", unitsCredit: "0.00", date: "2022-12-01", notes: "Difrnt Ventures receives 36364 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-009", type: "CASH_IN", debit: "100001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €100001 from Difrnt Ventures" },
    { stakeholder: "Difrnt Ventures", roundIndex: 1, ref: "CASH-20221201-009", type: "CASH_OUT", debit: "0.00", credit: "100001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Difrnt Ventures pays €100001 to V7 Fund" },
    
    // Group 6: Vlad Ionescu - 36,364 shares for €100,001
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-010", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "36364", date: "2022-12-01", notes: "V7 transfers 36364 shares to Vlad Ionescu" },
    { stakeholder: "Vlad Ionescu", roundIndex: 1, ref: "TRF-20221201-010", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "36364", unitsCredit: "0.00", date: "2022-12-01", notes: "Vlad Ionescu receives 36364 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-011", type: "CASH_IN", debit: "100001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €100001 from Vlad Ionescu" },
    { stakeholder: "Vlad Ionescu", roundIndex: 1, ref: "CASH-20221201-011", type: "CASH_OUT", debit: "0.00", credit: "100001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Vlad Ionescu pays €100001 to V7 Fund" },
    
    // Group 7: Cosmin Alexandru - 29,091 shares for €80,000
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-012", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "29091", date: "2022-12-01", notes: "V7 transfers 29091 shares to Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 1, ref: "TRF-20221201-012", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "29091", unitsCredit: "0.00", date: "2022-12-01", notes: "Cosmin Alexandru receives 29091 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-013", type: "CASH_IN", debit: "80000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €80000 from Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 1, ref: "CASH-20221201-013", type: "CASH_OUT", debit: "0.00", credit: "80000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Cosmin Alexandru pays €80000 to V7 Fund" },
    
    // Group 8: Octavian Petrescu - 36,364 shares for €100,001
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-014", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "36364", date: "2022-12-01", notes: "V7 transfers 36364 shares to Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 1, ref: "TRF-20221201-014", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "36364", unitsCredit: "0.00", date: "2022-12-01", notes: "Octavian Petrescu receives 36364 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-015", type: "CASH_IN", debit: "100001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €100001 from Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 1, ref: "CASH-20221201-015", type: "CASH_OUT", debit: "0.00", credit: "100001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Octavian Petrescu pays €100001 to V7 Fund" },
    
    // Group 9: Paul Murariu/ Tengo Office - 29,091 shares for €80,000
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-016", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "29091", date: "2022-12-01", notes: "V7 transfers 29091 shares to Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 1, ref: "TRF-20221201-016", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "29091", unitsCredit: "0.00", date: "2022-12-01", notes: "Paul Murariu/ Tengo Office receives 29091 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-017", type: "CASH_IN", debit: "80000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €80000 from Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 1, ref: "CASH-20221201-017", type: "CASH_OUT", debit: "0.00", credit: "80000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Paul Murariu/ Tengo Office pays €80000 to V7 Fund" },
    
    // Group 10: Andrei Costescu - 9,091 shares for €25,000
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-018", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "9091", date: "2022-12-01", notes: "V7 transfers 9091 shares to Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 1, ref: "TRF-20221201-018", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "9091", unitsCredit: "0.00", date: "2022-12-01", notes: "Andrei Costescu receives 9091 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-019", type: "CASH_IN", debit: "25000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €25000 from Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 1, ref: "CASH-20221201-019", type: "CASH_OUT", debit: "0.00", credit: "25000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Andrei Costescu pays €25000 to V7 Fund" },
    
    // Group 11: Sabrina Chiriches - 181,818 shares for €500,000
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "TRF-20221201-020", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "181818", date: "2022-12-01", notes: "V7 transfers 181818 shares to Sabrina Chiriches" },
    { stakeholder: "Sabrina Chiriches", roundIndex: 1, ref: "TRF-20221201-020", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "181818", unitsCredit: "0.00", date: "2022-12-01", notes: "Sabrina Chiriches receives 181818 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 1, ref: "CASH-20221201-021", type: "CASH_IN", debit: "500000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "V7 receives €500000 from Sabrina Chiriches" },
    { stakeholder: "Sabrina Chiriches", roundIndex: 1, ref: "CASH-20221201-021", type: "CASH_OUT", debit: "0.00", credit: "500000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2022-12-01", notes: "Sabrina Chiriches pays €500000 to V7 Fund" },

    // ===== ROUND 3 - 2023-09-07 =====
    
    // Group 1: Initial issuance - CORRECTED: Fund gains shares via debit
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "ISS-20230907-001", type: "ISSUANCE", debit: "0.00", credit: "0.00", unitsDebit: "409908", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 issues 409908 shares at €3.05" },
    
    // Group 2: Iulian Circiumaru - 98,182 shares for €299,455
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-002", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "98182", date: "2023-09-07", notes: "V7 transfers 98182 shares to Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 2, ref: "TRF-20230907-002", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "98182", unitsCredit: "0.00", date: "2023-09-07", notes: "Iulian Circiumaru receives 98182 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-003", type: "CASH_IN", debit: "299455", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €299455 from Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 2, ref: "CASH-20230907-003", type: "CASH_OUT", debit: "0.00", credit: "299455", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Iulian Circiumaru pays €299455 to V7 Fund" },
    
    // Group 3: Andrei Cretu - 98,182 shares for €299,455
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-004", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "98182", date: "2023-09-07", notes: "V7 transfers 98182 shares to Andrei Cretu" },
    { stakeholder: "Andrei Cretu", roundIndex: 2, ref: "TRF-20230907-004", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "98182", unitsCredit: "0.00", date: "2023-09-07", notes: "Andrei Cretu receives 98182 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-005", type: "CASH_IN", debit: "299455", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €299455 from Andrei Cretu" },
    { stakeholder: "Andrei Cretu", roundIndex: 2, ref: "CASH-20230907-005", type: "CASH_OUT", debit: "0.00", credit: "299455", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Andrei Cretu pays €299455 to V7 Fund" },
    
    // Group 4: Catalin Ivascu/ CI Equity - 2,530 shares for €7,717
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-006", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "2530", date: "2023-09-07", notes: "V7 transfers 2530 shares to Catalin Ivascu/ CI Equity" },
    { stakeholder: "Catalin Ivascu/ CI Equity", roundIndex: 2, ref: "TRF-20230907-006", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "2530", unitsCredit: "0.00", date: "2023-09-07", notes: "Catalin Ivascu/ CI Equity receives 2530 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-007", type: "CASH_IN", debit: "7717", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €7717 from Catalin Ivascu/ CI Equity" },
    { stakeholder: "Catalin Ivascu/ CI Equity", roundIndex: 2, ref: "CASH-20230907-007", type: "CASH_OUT", debit: "0.00", credit: "7717", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Catalin Ivascu/ CI Equity pays €7717 to V7 Fund" },
    
    // Group 5: Cristian Circiumaru - 848 shares for €2,586
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-008", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "848", date: "2023-09-07", notes: "V7 transfers 848 shares to Cristian Circiumaru" },
    { stakeholder: "Cristian Circiumaru", roundIndex: 2, ref: "TRF-20230907-008", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "848", unitsCredit: "0.00", date: "2023-09-07", notes: "Cristian Circiumaru receives 848 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-009", type: "CASH_IN", debit: "2586", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €2586 from Cristian Circiumaru" },
    { stakeholder: "Cristian Circiumaru", roundIndex: 2, ref: "CASH-20230907-009", type: "CASH_OUT", debit: "0.00", credit: "2586", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Cristian Circiumaru pays €2586 to V7 Fund" },
    
    // Group 6: Sergiu Gidei - 667 shares for €2,034
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-010", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "667", date: "2023-09-07", notes: "V7 transfers 667 shares to Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 2, ref: "TRF-20230907-010", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "667", unitsCredit: "0.00", date: "2023-09-07", notes: "Sergiu Gidei receives 667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-011", type: "CASH_IN", debit: "2034", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €2034 from Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 2, ref: "CASH-20230907-011", type: "CASH_OUT", debit: "0.00", credit: "2034", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Sergiu Gidei pays €2034 to V7 Fund" },
    
    // Group 7: Paul Murariu/ Tengo Office - 463 shares for €1,412
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-012", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "463", date: "2023-09-07", notes: "V7 transfers 463 shares to Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 2, ref: "TRF-20230907-012", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "463", unitsCredit: "0.00", date: "2023-09-07", notes: "Paul Murariu/ Tengo Office receives 463 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-013", type: "CASH_IN", debit: "1412", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €1412 from Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 2, ref: "CASH-20230907-013", type: "CASH_OUT", debit: "0.00", credit: "1412", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Paul Murariu/ Tengo Office pays €1412 to V7 Fund" },
    
    // Group 8: Anca Macovei - 5,110 shares for €15,586
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-014", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "5110", date: "2023-09-07", notes: "V7 transfers 5110 shares to Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 2, ref: "TRF-20230907-014", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "5110", unitsCredit: "0.00", date: "2023-09-07", notes: "Anca Macovei receives 5110 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-015", type: "CASH_IN", debit: "15586", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €15586 from Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 2, ref: "CASH-20230907-015", type: "CASH_OUT", debit: "0.00", credit: "15586", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Anca Macovei pays €15586 to V7 Fund" },
    
    // Group 9: Bogdan Ionascu/ BFI Corporation - 92,926 shares for €283,424
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-016", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "92926", date: "2023-09-07", notes: "V7 transfers 92926 shares to Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 2, ref: "TRF-20230907-016", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "92926", unitsCredit: "0.00", date: "2023-09-07", notes: "Bogdan Ionascu/ BFI Corporation receives 92926 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-017", type: "CASH_IN", debit: "283424", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €283424 from Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 2, ref: "CASH-20230907-017", type: "CASH_OUT", debit: "0.00", credit: "283424", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Bogdan Ionascu/ BFI Corporation pays €283424 to V7 Fund" },
    
    // Group 10: Alexandru Birsan - 37,171 shares for €113,372
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-018", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "37171", date: "2023-09-07", notes: "V7 transfers 37171 shares to Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 2, ref: "TRF-20230907-018", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "37171", unitsCredit: "0.00", date: "2023-09-07", notes: "Alexandru Birsan receives 37171 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-019", type: "CASH_IN", debit: "113372", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €113372 from Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 2, ref: "CASH-20230907-019", type: "CASH_OUT", debit: "0.00", credit: "113372", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Alexandru Birsan pays €113372 to V7 Fund" },
    
    // Group 11: Catalin Suliman - 18,585 shares for €56,684
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-020", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "18585", date: "2023-09-07", notes: "V7 transfers 18585 shares to Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 2, ref: "TRF-20230907-020", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "18585", unitsCredit: "0.00", date: "2023-09-07", notes: "Catalin Suliman receives 18585 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-021", type: "CASH_IN", debit: "56684", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €56684 from Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 2, ref: "CASH-20230907-021", type: "CASH_OUT", debit: "0.00", credit: "56684", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Catalin Suliman pays €56684 to V7 Fund" },
    
    // Group 12: Difrnt Ventures - 275 shares for €839
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-022", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "275", date: "2023-09-07", notes: "V7 transfers 275 shares to Difrnt Ventures" },
    { stakeholder: "Difrnt Ventures", roundIndex: 2, ref: "TRF-20230907-022", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "275", unitsCredit: "0.00", date: "2023-09-07", notes: "Difrnt Ventures receives 275 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-023", type: "CASH_IN", debit: "839", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €839 from Difrnt Ventures" },
    { stakeholder: "Difrnt Ventures", roundIndex: 2, ref: "CASH-20230907-023", type: "CASH_OUT", debit: "0.00", credit: "839", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Difrnt Ventures pays €839 to V7 Fund" },
    
    // Group 13: Vlad Ionescu - 9,293 shares for €28,344
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-024", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "9293", date: "2023-09-07", notes: "V7 transfers 9293 shares to Vlad Ionescu" },
    { stakeholder: "Vlad Ionescu", roundIndex: 2, ref: "TRF-20230907-024", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "9293", unitsCredit: "0.00", date: "2023-09-07", notes: "Vlad Ionescu receives 9293 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-025", type: "CASH_IN", debit: "28344", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €28344 from Vlad Ionescu" },
    { stakeholder: "Vlad Ionescu", roundIndex: 2, ref: "CASH-20230907-025", type: "CASH_OUT", debit: "0.00", credit: "28344", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Vlad Ionescu pays €28344 to V7 Fund" },
    
    // Group 14: Cosmin Alexandru - 7,434 shares for €22,674
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-026", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "7434", date: "2023-09-07", notes: "V7 transfers 7434 shares to Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 2, ref: "TRF-20230907-026", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "7434", unitsCredit: "0.00", date: "2023-09-07", notes: "Cosmin Alexandru receives 7434 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-027", type: "CASH_IN", debit: "22674", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €22674 from Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 2, ref: "CASH-20230907-027", type: "CASH_OUT", debit: "0.00", credit: "22674", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Cosmin Alexandru pays €22674 to V7 Fund" },
    
    // Group 15: Octavian Petrescu - 9,293 shares for €28,344
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-028", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "9293", date: "2023-09-07", notes: "V7 transfers 9293 shares to Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 2, ref: "TRF-20230907-028", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "9293", unitsCredit: "0.00", date: "2023-09-07", notes: "Octavian Petrescu receives 9293 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-029", type: "CASH_IN", debit: "28344", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €28344 from Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 2, ref: "CASH-20230907-029", type: "CASH_OUT", debit: "0.00", credit: "28344", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Octavian Petrescu pays €28344 to V7 Fund" },
    
    // Group 16: Andrei Costescu - 2,323 shares for €7,085
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-030", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "2323", date: "2023-09-07", notes: "V7 transfers 2323 shares to Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 2, ref: "TRF-20230907-030", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "2323", unitsCredit: "0.00", date: "2023-09-07", notes: "Andrei Costescu receives 2323 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-031", type: "CASH_IN", debit: "7085", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €7085 from Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 2, ref: "CASH-20230907-031", type: "CASH_OUT", debit: "0.00", credit: "7085", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Andrei Costescu pays €7085 to V7 Fund" },
    
    // Group 17: Sabrina Chiriches - 26,626 shares for €81,209
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "TRF-20230907-032", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "26626", date: "2023-09-07", notes: "V7 transfers 26626 shares to Sabrina Chiriches" },
    { stakeholder: "Sabrina Chiriches", roundIndex: 2, ref: "TRF-20230907-032", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "26626", unitsCredit: "0.00", date: "2023-09-07", notes: "Sabrina Chiriches receives 26626 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 2, ref: "CASH-20230907-033", type: "CASH_IN", debit: "81209", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "V7 receives €81209 from Sabrina Chiriches" },
    { stakeholder: "Sabrina Chiriches", roundIndex: 2, ref: "CASH-20230907-033", type: "CASH_OUT", debit: "0.00", credit: "81209", unitsDebit: "0.00", unitsCredit: "0.00", date: "2023-09-07", notes: "Sabrina Chiriches pays €81209 to V7 Fund" },

    // ===== ROUND 4 - 2024-06-04 =====
    
    // Group 1: Initial issuance - CORRECTED: Fund gains shares via debit
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "ISS-20240604-001", type: "ISSUANCE", debit: "0.00", credit: "0.00", unitsDebit: "545600", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 issues 545600 shares at €3.00" },
    
    // Group 2: Iulian Circiumaru - 5,600 shares for €16,800
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-002", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "5600", date: "2024-06-04", notes: "V7 transfers 5600 shares to Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 3, ref: "TRF-20240604-002", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "5600", unitsCredit: "0.00", date: "2024-06-04", notes: "Iulian Circiumaru receives 5600 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-003", type: "CASH_IN", debit: "16800", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €16800 from Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 3, ref: "CASH-20240604-003", type: "CASH_OUT", debit: "0.00", credit: "16800", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Iulian Circiumaru pays €16800 to V7 Fund" },
    
    // Group 3: Bogdan Ionascu/ BFI Corporation - 66,667 shares for €200,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-004", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "66667", date: "2024-06-04", notes: "V7 transfers 66667 shares to Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 3, ref: "TRF-20240604-004", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "66667", unitsCredit: "0.00", date: "2024-06-04", notes: "Bogdan Ionascu/ BFI Corporation receives 66667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-005", type: "CASH_IN", debit: "200001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €200001 from Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 3, ref: "CASH-20240604-005", type: "CASH_OUT", debit: "0.00", credit: "200001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Bogdan Ionascu/ BFI Corporation pays €200001 to V7 Fund" },
    
    // Group 4: Alexandru Birsan - 26,667 shares for €80,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-006", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "26667", date: "2024-06-04", notes: "V7 transfers 26667 shares to Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 3, ref: "TRF-20240604-006", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "26667", unitsCredit: "0.00", date: "2024-06-04", notes: "Alexandru Birsan receives 26667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-007", type: "CASH_IN", debit: "80001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €80001 from Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 3, ref: "CASH-20240604-007", type: "CASH_OUT", debit: "0.00", credit: "80001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Alexandru Birsan pays €80001 to V7 Fund" },
    
    // Group 5: Catalin Suliman - 16,667 shares for €50,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-008", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "16667", date: "2024-06-04", notes: "V7 transfers 16667 shares to Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 3, ref: "TRF-20240604-008", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "16667", unitsCredit: "0.00", date: "2024-06-04", notes: "Catalin Suliman receives 16667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-009", type: "CASH_IN", debit: "50001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €50001 from Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 3, ref: "CASH-20240604-009", type: "CASH_OUT", debit: "0.00", credit: "50001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Catalin Suliman pays €50001 to V7 Fund" },
    
    // Group 6: Sergiu Gidei - 6,666 shares for €19,998
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-010", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "6666", date: "2024-06-04", notes: "V7 transfers 6666 shares to Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 3, ref: "TRF-20240604-010", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "6666", unitsCredit: "0.00", date: "2024-06-04", notes: "Sergiu Gidei receives 6666 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-011", type: "CASH_IN", debit: "19998", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €19998 from Sergiu Gidei" },
    { stakeholder: "Sergiu Gidei", roundIndex: 3, ref: "CASH-20240604-011", type: "CASH_OUT", debit: "0.00", credit: "19998", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Sergiu Gidei pays €19998 to V7 Fund" },
    
    // Group 7: Paul Murariu/ Tengo Office - 2,333 shares for €6,999
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-012", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "2333", date: "2024-06-04", notes: "V7 transfers 2333 shares to Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 3, ref: "TRF-20240604-012", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "2333", unitsCredit: "0.00", date: "2024-06-04", notes: "Paul Murariu/ Tengo Office receives 2333 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-013", type: "CASH_IN", debit: "6999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €6999 from Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 3, ref: "CASH-20240604-013", type: "CASH_OUT", debit: "0.00", credit: "6999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Paul Murariu/ Tengo Office pays €6999 to V7 Fund" },
    
    // Group 8: Octavian Petrescu - 6,667 shares for €20,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-014", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "6667", date: "2024-06-04", notes: "V7 transfers 6667 shares to Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 3, ref: "TRF-20240604-014", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "6667", unitsCredit: "0.00", date: "2024-06-04", notes: "Octavian Petrescu receives 6667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-015", type: "CASH_IN", debit: "20001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €20001 from Octavian Petrescu" },
    { stakeholder: "Octavian Petrescu", roundIndex: 3, ref: "CASH-20240604-015", type: "CASH_OUT", debit: "0.00", credit: "20001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Octavian Petrescu pays €20001 to V7 Fund" },
    
    // Group 9: Cosmin Alexandru - 5,333 shares for €15,999
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-016", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "5333", date: "2024-06-04", notes: "V7 transfers 5333 shares to Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 3, ref: "TRF-20240604-016", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "5333", unitsCredit: "0.00", date: "2024-06-04", notes: "Cosmin Alexandru receives 5333 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-017", type: "CASH_IN", debit: "15999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €15999 from Cosmin Alexandru" },
    { stakeholder: "Cosmin Alexandru", roundIndex: 3, ref: "CASH-20240604-017", type: "CASH_OUT", debit: "0.00", credit: "15999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Cosmin Alexandru pays €15999 to V7 Fund" },
    
    // Group 10: Anca Macovei - 4,000 shares for €12,000
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-018", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "4000", date: "2024-06-04", notes: "V7 transfers 4000 shares to Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 3, ref: "TRF-20240604-018", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "4000", unitsCredit: "0.00", date: "2024-06-04", notes: "Anca Macovei receives 4000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-019", type: "CASH_IN", debit: "12000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €12000 from Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 3, ref: "CASH-20240604-019", type: "CASH_OUT", debit: "0.00", credit: "12000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Anca Macovei pays €12000 to V7 Fund" },
    
    // Group 11: Andrei Costescu - 1,667 shares for €5,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-020", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "1667", date: "2024-06-04", notes: "V7 transfers 1667 shares to Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 3, ref: "TRF-20240604-020", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "1667", unitsCredit: "0.00", date: "2024-06-04", notes: "Andrei Costescu receives 1667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-021", type: "CASH_IN", debit: "5001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €5001 from Andrei Costescu" },
    { stakeholder: "Andrei Costescu", roundIndex: 3, ref: "CASH-20240604-021", type: "CASH_OUT", debit: "0.00", credit: "5001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Andrei Costescu pays €5001 to V7 Fund" },
    
    // Group 12: Cristina Filip - 83,333 shares for €249,999
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-022", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "83333", date: "2024-06-04", notes: "V7 transfers 83333 shares to Cristina Filip" },
    { stakeholder: "Cristina Filip", roundIndex: 3, ref: "TRF-20240604-022", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "83333", unitsCredit: "0.00", date: "2024-06-04", notes: "Cristina Filip receives 83333 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-023", type: "CASH_IN", debit: "249999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €249999 from Cristina Filip" },
    { stakeholder: "Cristina Filip", roundIndex: 3, ref: "CASH-20240604-023", type: "CASH_OUT", debit: "0.00", credit: "249999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Cristina Filip pays €249999 to V7 Fund" },
    
    // Group 13: Robert Maxim - 100,000 shares for €300,000
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-024", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "100000", date: "2024-06-04", notes: "V7 transfers 100000 shares to Robert Maxim" },
    { stakeholder: "Robert Maxim", roundIndex: 3, ref: "TRF-20240604-024", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "100000", unitsCredit: "0.00", date: "2024-06-04", notes: "Robert Maxim receives 100000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-025", type: "CASH_IN", debit: "300000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €300000 from Robert Maxim" },
    { stakeholder: "Robert Maxim", roundIndex: 3, ref: "CASH-20240604-025", type: "CASH_OUT", debit: "0.00", credit: "300000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Robert Maxim pays €300000 to V7 Fund" },
    
    // Group 14: Toni Pera - 83,333 shares for €249,999
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-026", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "83333", date: "2024-06-04", notes: "V7 transfers 83333 shares to Toni Pera" },
    { stakeholder: "Toni Pera", roundIndex: 3, ref: "TRF-20240604-026", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "83333", unitsCredit: "0.00", date: "2024-06-04", notes: "Toni Pera receives 83333 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-027", type: "CASH_IN", debit: "249999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €249999 from Toni Pera" },
    { stakeholder: "Toni Pera", roundIndex: 3, ref: "CASH-20240604-027", type: "CASH_OUT", debit: "0.00", credit: "249999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Toni Pera pays €249999 to V7 Fund" },
    
    // Group 15: Flip Ventures - 70,000 shares for €210,000
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-028", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "70000", date: "2024-06-04", notes: "V7 transfers 70000 shares to Flip Ventures" },
    { stakeholder: "Flip Ventures", roundIndex: 3, ref: "TRF-20240604-028", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "70000", unitsCredit: "0.00", date: "2024-06-04", notes: "Flip Ventures receives 70000 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-029", type: "CASH_IN", debit: "210000", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €210000 from Flip Ventures" },
    { stakeholder: "Flip Ventures", roundIndex: 3, ref: "CASH-20240604-029", type: "CASH_OUT", debit: "0.00", credit: "210000", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Flip Ventures pays €210000 to V7 Fund" },
    
    // Group 16: Stefan Toderita - 66,667 shares for €200,001
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "TRF-20240604-030", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "66667", date: "2024-06-04", notes: "V7 transfers 66667 shares to Stefan Toderita" },
    { stakeholder: "Stefan Toderita", roundIndex: 3, ref: "TRF-20240604-030", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "66667", unitsCredit: "0.00", date: "2024-06-04", notes: "Stefan Toderita receives 66667 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 3, ref: "CASH-20240604-031", type: "CASH_IN", debit: "200001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "V7 receives €200001 from Stefan Toderita" },
    { stakeholder: "Stefan Toderita", roundIndex: 3, ref: "CASH-20240604-031", type: "CASH_OUT", debit: "0.00", credit: "200001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2024-06-04", notes: "Stefan Toderita pays €200001 to V7 Fund" },

    // ===== ROUND 5 - 2025-03-20 =====
    
    // Group 1: Initial issuance - CORRECTED: Fund gains shares via debit
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "ISS-20250320-001", type: "ISSUANCE", debit: "0.00", credit: "0.00", unitsDebit: "1139700", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 issues 1139700 shares at €2.88" },
    
    // Group 2: Iulian Circiumaru - 10,417 shares for €30,001
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-002", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "10417", date: "2025-03-20", notes: "V7 transfers 10417 shares to Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 4, ref: "TRF-20250320-002", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "10417", unitsCredit: "0.00", date: "2025-03-20", notes: "Iulian Circiumaru receives 10417 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-003", type: "CASH_IN", debit: "30001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €30001 from Iulian Circiumaru" },
    { stakeholder: "Iulian Circiumaru", roundIndex: 4, ref: "CASH-20250320-003", type: "CASH_OUT", debit: "0.00", credit: "30001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Iulian Circiumaru pays €30001 to V7 Fund" },
    
    // Group 3: Bogdan Ionascu/ BFI Corporation - 18,245 shares for €52,546
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-004", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "18245", date: "2025-03-20", notes: "V7 transfers 18245 shares to Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 4, ref: "TRF-20250320-004", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "18245", unitsCredit: "0.00", date: "2025-03-20", notes: "Bogdan Ionascu/ BFI Corporation receives 18245 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-005", type: "CASH_IN", debit: "52546", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €52546 from Bogdan Ionascu/ BFI Corporation" },
    { stakeholder: "Bogdan Ionascu/ BFI Corporation", roundIndex: 4, ref: "CASH-20250320-005", type: "CASH_OUT", debit: "0.00", credit: "52546", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Bogdan Ionascu/ BFI Corporation pays €52546 to V7 Fund" },
    
    // Group 4: Alexandru Birsan - 67,072 shares for €193,167
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-006", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "67072", date: "2025-03-20", notes: "V7 transfers 67072 shares to Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 4, ref: "TRF-20250320-006", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "67072", unitsCredit: "0.00", date: "2025-03-20", notes: "Alexandru Birsan receives 67072 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-007", type: "CASH_IN", debit: "193167", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €193167 from Alexandru Birsan" },
    { stakeholder: "Alexandru Birsan", roundIndex: 4, ref: "CASH-20250320-007", type: "CASH_OUT", debit: "0.00", credit: "193167", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Alexandru Birsan pays €193167 to V7 Fund" },
    
    // Group 5: Catalin Suliman - 44,771 shares for €128,940
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-008", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "44771", date: "2025-03-20", notes: "V7 transfers 44771 shares to Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 4, ref: "TRF-20250320-008", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "44771", unitsCredit: "0.00", date: "2025-03-20", notes: "Catalin Suliman receives 44771 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-009", type: "CASH_IN", debit: "128940", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €128940 from Catalin Suliman" },
    { stakeholder: "Catalin Suliman", roundIndex: 4, ref: "CASH-20250320-009", type: "CASH_OUT", debit: "0.00", credit: "128940", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Catalin Suliman pays €128940 to V7 Fund" },
    
    // Group 6: Robert Maxim - 54,688 shares for €157,501
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-010", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "54688", date: "2025-03-20", notes: "V7 transfers 54688 shares to Robert Maxim" },
    { stakeholder: "Robert Maxim", roundIndex: 4, ref: "TRF-20250320-010", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "54688", unitsCredit: "0.00", date: "2025-03-20", notes: "Robert Maxim receives 54688 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-011", type: "CASH_IN", debit: "157501", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €157501 from Robert Maxim" },
    { stakeholder: "Robert Maxim", roundIndex: 4, ref: "CASH-20250320-011", type: "CASH_OUT", debit: "0.00", credit: "157501", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Robert Maxim pays €157501 to V7 Fund" },
    
    // Group 7: Cristina Filip - 26,649 shares for €76,749
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-012", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "26649", date: "2025-03-20", notes: "V7 transfers 26649 shares to Cristina Filip" },
    { stakeholder: "Cristina Filip", roundIndex: 4, ref: "TRF-20250320-012", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "26649", unitsCredit: "0.00", date: "2025-03-20", notes: "Cristina Filip receives 26649 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-013", type: "CASH_IN", debit: "76749", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €76749 from Cristina Filip" },
    { stakeholder: "Cristina Filip", roundIndex: 4, ref: "CASH-20250320-013", type: "CASH_OUT", debit: "0.00", credit: "76749", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Cristina Filip pays €76749 to V7 Fund" },
    
    // Group 8: Toni Pera - 19,661 shares for €56,624
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-014", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "19661", date: "2025-03-20", notes: "V7 transfers 19661 shares to Toni Pera" },
    { stakeholder: "Toni Pera", roundIndex: 4, ref: "TRF-20250320-014", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "19661", unitsCredit: "0.00", date: "2025-03-20", notes: "Toni Pera receives 19661 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-015", type: "CASH_IN", debit: "56624", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €56624 from Toni Pera" },
    { stakeholder: "Toni Pera", roundIndex: 4, ref: "CASH-20250320-015", type: "CASH_OUT", debit: "0.00", credit: "56624", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Toni Pera pays €56624 to V7 Fund" },
    
    // Group 9: Flip Ventures - 17,641 shares for €50,806
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-016", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "17641", date: "2025-03-20", notes: "V7 transfers 17641 shares to Flip Ventures" },
    { stakeholder: "Flip Ventures", roundIndex: 4, ref: "TRF-20250320-016", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "17641", unitsCredit: "0.00", date: "2025-03-20", notes: "Flip Ventures receives 17641 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-017", type: "CASH_IN", debit: "50806", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €50806 from Flip Ventures" },
    { stakeholder: "Flip Ventures", roundIndex: 4, ref: "CASH-20250320-017", type: "CASH_OUT", debit: "0.00", credit: "50806", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Flip Ventures pays €50806 to V7 Fund" },
    
    // Group 10: Paul Murariu/ Tengo Office - 3,472 shares for €9,999
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-018", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "3472", date: "2025-03-20", notes: "V7 transfers 3472 shares to Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 4, ref: "TRF-20250320-018", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "3472", unitsCredit: "0.00", date: "2025-03-20", notes: "Paul Murariu/ Tengo Office receives 3472 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-019", type: "CASH_IN", debit: "9999", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €9999 from Paul Murariu/ Tengo Office" },
    { stakeholder: "Paul Murariu/ Tengo Office", roundIndex: 4, ref: "CASH-20250320-019", type: "CASH_OUT", debit: "0.00", credit: "9999", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Paul Murariu/ Tengo Office pays €9999 to V7 Fund" },
    
    // Group 11: Anca Macovei - 9,028 shares for €26,001
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-020", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "9028", date: "2025-03-20", notes: "V7 transfers 9028 shares to Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 4, ref: "TRF-20250320-020", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "9028", unitsCredit: "0.00", date: "2025-03-20", notes: "Anca Macovei receives 9028 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-021", type: "CASH_IN", debit: "26001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €26001 from Anca Macovei" },
    { stakeholder: "Anca Macovei", roundIndex: 4, ref: "CASH-20250320-021", type: "CASH_OUT", debit: "0.00", credit: "26001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "Anca Macovei pays €26001 to V7 Fund" },
    
    // Group 12: InspireAM - 868,056 shares for €2,500,001
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "TRF-20250320-022", type: "TRANSFER_OUT", debit: "0.00", credit: "0.00", unitsDebit: "0.00", unitsCredit: "868056", date: "2025-03-20", notes: "V7 transfers 868056 shares to InspireAM" },
    { stakeholder: "InspireAM", roundIndex: 4, ref: "TRF-20250320-022", type: "TRANSFER_IN", debit: "0.00", credit: "0.00", unitsDebit: "868056", unitsCredit: "0.00", date: "2025-03-20", notes: "InspireAM receives 868056 shares from V7" },
    { stakeholder: "V7 Stakeholder", roundIndex: 4, ref: "CASH-20250320-023", type: "CASH_IN", debit: "2500001", credit: "0.00", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "V7 receives €2500001 from InspireAM" },
    { stakeholder: "InspireAM", roundIndex: 4, ref: "CASH-20250320-023", type: "CASH_OUT", debit: "0.00", credit: "2500001", unitsDebit: "0.00", unitsCredit: "0.00", date: "2025-03-20", notes: "InspireAM pays €2500001 to V7 Fund" }
  ]
};