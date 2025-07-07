import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedHistoricalRates() {
  console.log('@@historical exchange rates seeding when DB init@@');

  const mockDataDir = path.join(process.cwd(), 'historical-mock');
  const jsonFiles = fs
    .readdirSync(mockDataDir)
    .filter((file) => file.endsWith('.json'));

  let totalProcessed = 0;
  for (const jsonFile of jsonFiles) {
    const year = jsonFile.replace('.json', '');

    const filePath = path.join(mockDataDir, jsonFile);
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!jsonData.success || !jsonData.quotes) {
      console.log(`⚠️  Invalid data format in ${jsonFile}, skipping...`);
      continue;
    }

    const dailyQuotes = jsonData.quotes;
    let yearProcessed = 0;

    // 배치 처리를 위한 배열
    const batchData: any[] = [];

    for (const [dateStr, rates] of Object.entries(dailyQuotes)) {
      const rateDate = new Date(dateStr);

      for (const [currencyPair, rate] of Object.entries(
        rates as Record<string, number>,
      )) {
        // 통화 추출 (KRWUSD -> USD)
        const currencyCode = currencyPair.replace('KRW', '');

        // 1 KRW당 외화 비율을 1 외화당 KRW로 변환
        const krwRate = 1 / rate;

        batchData.push({
          baseCurrency: 'KRW',
          currencyCode: currencyCode,
          rate: krwRate,
          rateDate: rateDate,
        });
      }
    }

    // 배치로 DB에 저장
    if (batchData.length > 0) {
      try {
        await prisma.exchangeRatesDaily.createMany({
          data: batchData,
          skipDuplicates: true,
        });

        yearProcessed = Object.keys(dailyQuotes).length;
        totalProcessed += yearProcessed;
        console.log(
          `✅ ${year}: ${yearProcessed} days, ${batchData.length} records inserted`,
        );
      } catch (error) {
        console.error(`❌ Failed to insert ${year} data:`, error.message);
      }
    }
  }

  console.log(`Historical rates seeding completed! Total: ${totalProcessed}`);
}

async function main() {
  console.log('starting historical data seeding process...');

  await prisma.$connect();

  // 기존 환율 데이터 확인
  const existingCount = await prisma.exchangeRatesDaily.count();
  if (existingCount > 0) {
    console.log(
      `Current exchange rate records in DB: ${existingCount}, no seeding`,
    );
    return;
  }

  await seedHistoricalRates();
  const finalCount = await prisma.exchangeRatesDaily.count();
  console.log(
    `✅ Historical data seeding completed successfully! [${finalCount} records]`,
  );
}

main()
  .catch((e) => {
    console.error('failed to seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
