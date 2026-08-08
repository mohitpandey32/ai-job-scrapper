import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  {
    name: "Tata Consultancy Services",
    slug: "tata-consultancy-services",
    website: "https://www.tcs.com/careers",
    industry: "Information Technology",
    headquarters: "Mumbai, Maharashtra",
  },
  {
    name: "Zomato",
    slug: "zomato",
    website: "https://www.zomato.com/careers",
    industry: "Consumer Internet",
    headquarters: "Gurugram, Haryana",
  },
  {
    name: "Razorpay",
    slug: "razorpay",
    website: "https://razorpay.com/jobs",
    industry: "Fintech",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "Urban Company",
    slug: "urban-company",
    website: "https://www.urbancompany.com/careers",
    industry: "Marketplace",
    headquarters: "Gurugram, Haryana",
  },
  {
    name: "Freshworks",
    slug: "freshworks",
    website: "https://www.freshworks.com/company/careers",
    industry: "SaaS",
    headquarters: "Chennai, Tamil Nadu",
  },
  {
    name: "Dun & Bradstreet",
    slug: "dun-bradstreet",
    website: "https://www.dnb.com/careers.html",
    industry: "Data and Analytics",
    headquarters: "Jacksonville, Florida",
  },
  {
    name: "Hevo Data",
    slug: "hevo-data",
    website: "https://hevodata.com/careers",
    industry: "Data Infrastructure",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "Weekday",
    slug: "weekday",
    website: "https://weekday.works",
    industry: "Recruiting Technology",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "Meesho",
    slug: "meesho",
    website: "https://www.meesho.io/jobs",
    industry: "E-commerce",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "Zeta",
    slug: "zeta",
    website: "https://www.zeta.tech/careers",
    industry: "Fintech",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "PhonePe",
    slug: "phonepe",
    website: "https://www.phonepe.com/careers",
    industry: "Fintech",
    headquarters: "Bengaluru, Karnataka",
  },
  {
    name: "Rubrik",
    slug: "rubrik",
    website: "https://www.rubrik.com/company/careers",
    industry: "Cybersecurity",
    headquarters: "Palo Alto, California",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    website: "https://www.cloudflare.com/careers",
    industry: "Cloud Infrastructure",
    headquarters: "San Francisco, California",
  },
  {
    name: "Binance",
    slug: "binance",
    website: "https://www.binance.com/en/careers",
    industry: "Crypto / Fintech",
    headquarters: "Global",
  },
  {
    name: "The Block",
    slug: "the-block",
    website: "https://www.theblock.co/careers",
    industry: "Media / Research",
    headquarters: "Remote",
  },
  {
    name: "Stripe",
    slug: "stripe",
    website: "https://stripe.com/jobs",
    industry: "Fintech",
    headquarters: "San Francisco, California",
  },
  {
    name: "Twilio",
    slug: "twilio",
    website: "https://www.twilio.com/company/jobs",
    industry: "Cloud Communications",
    headquarters: "San Francisco, California",
  },
  {
    name: "Databricks",
    slug: "databricks",
    website: "https://www.databricks.com/company/careers",
    industry: "Data and AI",
    headquarters: "San Francisco, California",
  },
  {
    name: "Postman",
    slug: "postman",
    website: "https://www.postman.com/company/careers",
    industry: "Developer Tools",
    headquarters: "San Francisco, California",
  },
  {
    name: "MongoDB",
    slug: "mongodb",
    website: "https://www.mongodb.com/careers",
    industry: "Database",
    headquarters: "New York, New York",
  },
  {
    name: "Airbnb",
    slug: "airbnb",
    website: "https://careers.airbnb.com",
    industry: "Marketplace",
    headquarters: "San Francisco, California",
  },
  {
    name: "Coinbase",
    slug: "coinbase",
    website: "https://www.coinbase.com/careers",
    industry: "Crypto / Fintech",
    headquarters: "Remote-first",
  },
  {
    name: "Okta",
    slug: "okta",
    website: "https://www.okta.com/company/careers",
    industry: "Identity and Security",
    headquarters: "San Francisco, California",
  },
];

const jobSources = [
  {
    companySlug: "dun-bradstreet",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/dnb?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "hevo-data",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/hevodata?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "weekday",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/weekdayworks?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "meesho",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/meesho?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "zeta",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/zeta?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "phonepe",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/phonepe/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "rubrik",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/rubrik/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "cloudflare",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "binance",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/binance?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "the-block",
    sourceType: "LEVER" as const,
    sourceUrl: "https://api.lever.co/v0/postings/theblockcrypto?mode=json",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "stripe",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "twilio",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/twilio/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "databricks",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/databricks/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "postman",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/postman/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "mongodb",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/mongodb/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "airbnb",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/airbnb/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "coinbase",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/coinbase/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
  {
    companySlug: "okta",
    sourceType: "GREENHOUSE" as const,
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/okta/jobs?content=true",
    riskLevel: "LOW" as const,
    termsReviewStatus: "ALLOWED" as const,
    crawlFrequencyMinutes: 720,
  },
];

const jobs = [
  {
    companySlug: "tata-consultancy-services",
    externalJobId: "seed-tcs-data-analyst",
    title: "Data Analyst",
    normalizedTitle: "data analyst",
    description:
      "Analyze business datasets, build dashboards, write SQL queries, and work with stakeholders to improve reporting quality.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "JUNIOR" as const,
    minExperience: 1,
    maxExperience: 3,
    locationCity: "Mumbai",
    locationState: "Maharashtra",
    isRemote: false,
    isHybrid: true,
    salaryMin: 600000,
    salaryMax: 1000000,
  },
  {
    companySlug: "zomato",
    externalJobId: "seed-zomato-ops-associate",
    title: "Operations Associate",
    normalizedTitle: "operations associate",
    description:
      "Coordinate city operations, support partner onboarding, track daily metrics, and improve service quality across local markets.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "ENTRY" as const,
    minExperience: 0,
    maxExperience: 2,
    locationCity: "Gurugram",
    locationState: "Haryana",
    isRemote: false,
    isHybrid: false,
    salaryMin: 400000,
    salaryMax: 700000,
  },
  {
    companySlug: "razorpay",
    externalJobId: "seed-razorpay-backend-engineer",
    title: "Backend Engineer",
    normalizedTitle: "backend engineer",
    description:
      "Build reliable payment APIs, design distributed services, write tests, and improve latency for high-volume fintech systems.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "MID" as const,
    minExperience: 3,
    maxExperience: 6,
    locationCity: "Bengaluru",
    locationState: "Karnataka",
    isRemote: false,
    isHybrid: true,
    salaryMin: 1800000,
    salaryMax: 3200000,
  },
  {
    companySlug: "urban-company",
    externalJobId: "seed-urban-company-product-manager",
    title: "Product Manager",
    normalizedTitle: "product manager",
    description:
      "Own marketplace growth experiments, define product requirements, partner with engineering and design, and measure launch outcomes.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "MID" as const,
    minExperience: 3,
    maxExperience: 7,
    locationCity: "Gurugram",
    locationState: "Haryana",
    isRemote: false,
    isHybrid: true,
    salaryMin: 2000000,
    salaryMax: 3800000,
  },
  {
    companySlug: "freshworks",
    externalJobId: "seed-freshworks-customer-success",
    title: "Customer Success Manager",
    normalizedTitle: "customer success manager",
    description:
      "Manage SaaS customer relationships, drive adoption, identify expansion opportunities, and coordinate with support and product teams.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "MID" as const,
    minExperience: 4,
    maxExperience: 8,
    locationCity: "Chennai",
    locationState: "Tamil Nadu",
    isRemote: false,
    isHybrid: true,
    salaryMin: 1200000,
    salaryMax: 2200000,
  },
  {
    companySlug: "razorpay",
    externalJobId: "seed-razorpay-remote-support",
    title: "Remote Customer Support Specialist",
    normalizedTitle: "customer support specialist",
    description:
      "Resolve merchant queries, document support patterns, and coordinate issue escalation across payment operations teams.",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "JUNIOR" as const,
    minExperience: 1,
    maxExperience: 4,
    locationCity: "Bengaluru",
    locationState: "Karnataka",
    isRemote: true,
    isHybrid: false,
    salaryMin: 500000,
    salaryMax: 900000,
  },
];

async function main() {
  const includeSampleJobs = process.env.INCLUDE_SAMPLE_JOBS === "true";

  for (const company of companies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      create: company,
      update: company,
    });
  }

  for (const source of jobSources) {
    const company = await prisma.company.findUniqueOrThrow({
      where: { slug: source.companySlug },
    });

    const jobSource = await prisma.jobSource.upsert({
      where: { sourceUrl: source.sourceUrl },
      create: {
        companyId: company.id,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        status: "ACTIVE",
        riskLevel: source.riskLevel,
        termsReviewStatus: source.termsReviewStatus,
        crawlFrequencyMinutes: source.crawlFrequencyMinutes,
        robotsAllowed: true,
      },
      update: {
        companyId: company.id,
        status: "ACTIVE",
        riskLevel: source.riskLevel,
        termsReviewStatus: source.termsReviewStatus,
        crawlFrequencyMinutes: source.crawlFrequencyMinutes,
        robotsAllowed: true,
      },
    });

    await prisma.sourcePolicy.upsert({
      where: { sourceId: jobSource.id },
      create: {
        sourceId: jobSource.id,
        allowed: true,
        riskLevel: source.riskLevel,
        robotsAllowed: true,
        termsReviewStatus: source.termsReviewStatus,
        requiresJavascript: false,
        allowBrowserRender: false,
        maxRequestsPerHour: 12,
        reviewedBy: "seed",
        reviewedAt: new Date(),
      },
      update: {
        allowed: true,
        riskLevel: source.riskLevel,
        robotsAllowed: true,
        termsReviewStatus: source.termsReviewStatus,
        reviewedBy: "seed",
        reviewedAt: new Date(),
      },
    });
  }

  if (includeSampleJobs) {
    for (const job of jobs) {
      const company = await prisma.company.findUniqueOrThrow({
        where: { slug: job.companySlug },
      });
      const applyUrl = `${company.website ?? "https://example.com"}/${job.externalJobId}`;
      const canonicalUrl = `${applyUrl}?source=seed`;

      await prisma.job.upsert({
        where: { canonicalUrl },
        create: {
          companyId: company.id,
          externalJobId: job.externalJobId,
          canonicalUrl,
          applyUrl,
          title: job.title,
          normalizedTitle: job.normalizedTitle,
          description: job.description,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          locationCity: job.locationCity,
          locationState: job.locationState,
          country: "India",
          isRemote: job.isRemote,
          isHybrid: job.isHybrid,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: "INR",
          postedAt: new Date(),
          status: "ACTIVE",
          metadata: {
            seeded: true,
          },
        },
        update: {
          title: job.title,
          normalizedTitle: job.normalizedTitle,
          description: job.description,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          locationCity: job.locationCity,
          locationState: job.locationState,
          isRemote: job.isRemote,
          isHybrid: job.isHybrid,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          postedAt: new Date(),
          lastSeenAt: new Date(),
          status: "ACTIVE",
        },
      });
    }
  }

  console.log(
    `Seeded ${companies.length} companies, ${jobSources.length} sources, and ${
      includeSampleJobs ? jobs.length : 0
    } sample jobs.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
