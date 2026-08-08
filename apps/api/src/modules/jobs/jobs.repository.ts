import type { Prisma, PrismaClient } from "@ai-job-platform/database";
import { AppError } from "../../common/errors/app-error";
import type { JobAutocompleteQuery, JobSearchQuery } from "./jobs.schemas";

export class JobsRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(query: JobSearchQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.findSearchResults(where, query, skip);

    return {
      items: items.map((job) => {
        const earlyCareerQuality = calculateEarlyCareerQuality(job);

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          applyUrl: job.canonicalUrl ?? job.applyUrl,
          locationCity: job.locationCity,
          locationState: job.locationState,
          country: job.country,
          isRemote: job.isRemote,
          isHybrid: job.isHybrid,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          postedAt: job.postedAt,
          lastSeenAt: job.lastSeenAt,
          company: {
            id: job.company.id,
            name: job.company.name,
            industry: job.company.industry,
            website: job.company.website,
          },
          earlyCareerQuality,
        };
      }),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async findSearchResults(where: Prisma.JobWhereInput, query: JobSearchQuery, skip: number) {
    if (query.sortBy !== "early_career") {
      return this.db.$transaction([
        this.db.job.findMany({
          where,
          include: {
            company: true,
          },
          orderBy: this.buildOrderBy(query),
          skip,
          take: query.limit,
        }),
        this.db.job.count({ where }),
      ]);
    }

    const total = await this.db.job.count({ where });
    const candidates = await this.db.job.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: [{ lastSeenAt: "desc" }, { postedAt: "desc" }, { createdAt: "desc" }],
      take: Math.min(Math.max(skip + query.limit * 8, query.limit), 400),
    });

    const items = candidates
      .sort((left, right) => {
        const qualityDelta = calculateEarlyCareerQuality(right).score - calculateEarlyCareerQuality(left).score;
        if (qualityDelta !== 0) return qualityDelta;

        return new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime();
      })
      .slice(skip, skip + query.limit);

    return [items, total] as const;
  }

  async findById(id: string) {
    const job = await this.db.job.findFirst({
      where: {
        id,
        status: "ACTIVE",
      },
      include: {
        company: true,
        jobSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      throw new AppError(404, "Job not found.", "JOB_NOT_FOUND");
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      applyUrl: job.applyUrl,
      canonicalUrl: job.canonicalUrl,
      locationCity: job.locationCity,
      locationState: job.locationState,
      country: job.country,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minExperience: job.minExperience,
      maxExperience: job.maxExperience,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      postedAt: job.postedAt,
      lastSeenAt: job.lastSeenAt,
      company: {
        id: job.company.id,
        name: job.company.name,
        industry: job.company.industry,
        website: job.company.website,
        headquarters: job.company.headquarters,
      },
      skills: job.jobSkills.map((jobSkill) => ({
        id: jobSkill.skill.id,
        name: jobSkill.skill.name,
        importance: jobSkill.importance,
      })),
    };
  }

  async facets() {
    const where: Prisma.JobWhereInput = {
      status: "ACTIVE",
      country: "India",
    };

    const [locations, companies, experienceLevels, remoteCount, hybridCount, earlyCareerCount, internshipCount, strongEarlyCareerCount] = await this.db.$transaction([
      this.db.job.groupBy({
        by: ["locationCity"],
        where: {
          ...where,
          locationCity: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            locationCity: "desc",
          },
        },
        take: 20,
      }),
      this.db.company.findMany({
        where: {
          jobs: {
            some: where,
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              jobs: {
                where,
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: 30,
      }),
      this.db.job.groupBy({
        by: ["experienceLevel"],
        where,
        _count: true,
        orderBy: {
          experienceLevel: "asc",
        },
      }),
      this.db.job.count({
        where: {
          ...where,
          isRemote: true,
        },
      }),
      this.db.job.count({
        where: {
          ...where,
          isHybrid: true,
        },
      }),
      this.db.job.count({
        where: {
          ...where,
          ...buildEarlyCareerWhere(),
        },
      }),
      this.db.job.count({
        where: {
          ...where,
          employmentType: "INTERNSHIP",
        },
      }),
      this.db.job.count({
        where: {
          ...where,
          ...buildStrongEarlyCareerWhere(),
        },
      }),
    ]);

    return {
      locations: locations.map((location) => ({
        value: location.locationCity,
        count: location._count,
      })),
      companies: companies.map((company) => ({
        id: company.id,
        value: company.name,
        count: company._count.jobs,
      })),
      experienceLevels: experienceLevels.map((level) => ({
        value: level.experienceLevel,
        count: level._count,
      })),
      workModes: {
        remote: remoteCount,
        hybrid: hybridCount,
      },
      careerStages: {
        earlyCareer: earlyCareerCount,
        internships: internshipCount,
        strongEarlyCareer: strongEarlyCareerCount,
      },
    };
  }

  async autocomplete(query: JobAutocompleteQuery) {
    const jobs = await this.db.job.findMany({
      where: {
        AND: [
          { status: "ACTIVE" },
          { country: "India" },
          {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { normalizedTitle: { contains: query.q.toLowerCase(), mode: "insensitive" } },
              { company: { name: { contains: query.q, mode: "insensitive" } } },
              { locationCity: { contains: query.q, mode: "insensitive" } },
            ],
          },
        ],
      },
      include: {
        company: true,
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: query.limit,
    });

    const suggestions = new Set<string>();

    jobs.forEach((job) => {
      if (job.title.toLowerCase().includes(query.q.toLowerCase())) suggestions.add(job.title);
      if (job.company.name.toLowerCase().includes(query.q.toLowerCase())) suggestions.add(job.company.name);
      if (job.locationCity?.toLowerCase().includes(query.q.toLowerCase())) suggestions.add(job.locationCity);
    });

    return {
      suggestions: Array.from(suggestions).slice(0, query.limit),
    };
  }

  private buildWhere(query: JobSearchQuery): Prisma.JobWhereInput {
    const and: Prisma.JobWhereInput[] = [{ status: "ACTIVE" }, { country: "India" }];

    if (query.q) {
      and.push({
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { normalizedTitle: { contains: query.q.toLowerCase(), mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
          { company: { name: { contains: query.q, mode: "insensitive" } } },
        ],
      });
    }

    if (query.location) {
      and.push({
        OR: [
          { locationCity: { contains: query.location, mode: "insensitive" } },
          { locationState: { contains: query.location, mode: "insensitive" } },
        ],
      });
    }

    if (query.company) {
      and.push({ company: { name: { contains: query.company, mode: "insensitive" } } });
    }

    if (query.remote) {
      and.push({ isRemote: query.remote === "true" });
    }

    if (query.hybrid) {
      and.push({ isHybrid: query.hybrid === "true" });
    }

    if (query.careerStage === "early") {
      and.push(buildEarlyCareerWhere());
    }

    if (query.earlyCareerFilter !== "all") {
      and.push(buildEarlyCareerFilterWhere(query.earlyCareerFilter));
    }

    if (query.experienceLevel) {
      and.push({ experienceLevel: query.experienceLevel });
    }

    if (query.minSalary) {
      and.push({ salaryMax: { gte: query.minSalary } });
    }

    return { AND: and };
  }

  private buildOrderBy(query: JobSearchQuery): Prisma.JobOrderByWithRelationInput[] {
    if (query.sortBy === "early_career") {
      return [{ experienceLevel: "asc" }, { minExperience: "asc" }, { lastSeenAt: "desc" }, { postedAt: "desc" }, { createdAt: "desc" }];
    }

    if (query.sortBy === "salary_high") {
      return [{ salaryMax: "desc" }, { salaryMin: "desc" }, { postedAt: "desc" }];
    }

    if (query.sortBy === "salary_low") {
      return [{ salaryMin: "asc" }, { salaryMax: "asc" }, { postedAt: "desc" }];
    }

    if (query.sortBy === "company") {
      return [{ company: { name: "asc" } }, { postedAt: "desc" }];
    }

    return [{ postedAt: "desc" }, { createdAt: "desc" }];
  }
}

function buildEarlyCareerWhere(): Prisma.JobWhereInput {
  const seniorTitleFilters: Prisma.JobWhereInput[] = ["senior", "sr.", "staff", "principal", "lead", "manager", "architect", "director", "head"].map((term) => ({
    title: { contains: term, mode: "insensitive" },
  }));
  const earlyCareerSignals: Prisma.JobWhereInput[] = [
    { experienceLevel: { in: ["ENTRY", "JUNIOR"] } },
    { minExperience: { lte: 1 } },
    { maxExperience: { lte: 2 } },
    { title: { contains: "fresher", mode: "insensitive" } },
    { title: { contains: "trainee", mode: "insensitive" } },
    { title: { contains: "new grad", mode: "insensitive" } },
    { title: { contains: "graduate", mode: "insensitive" } },
    { title: { contains: "entry level", mode: "insensitive" } },
    { title: { contains: "junior", mode: "insensitive" } },
    { title: { contains: "associate software engineer", mode: "insensitive" } },
    { description: { contains: "freshers", mode: "insensitive" } },
    { description: { contains: "fresh graduates", mode: "insensitive" } },
    { description: { contains: "0-1 years", mode: "insensitive" } },
    { description: { contains: "0-2 years", mode: "insensitive" } },
  ];

  return {
    OR: [
      buildInternshipWhere(),
      {
        AND: [
          {
            OR: earlyCareerSignals,
          },
          {
            NOT: {
              OR: seniorTitleFilters,
            },
          },
        ],
      },
    ],
  };
}

function buildEarlyCareerFilterWhere(filter: JobSearchQuery["earlyCareerFilter"]): Prisma.JobWhereInput {
  if (filter === "internships") {
    return buildInternshipWhere();
  }

  if (filter === "remote_internships") {
    return {
      AND: [buildInternshipWhere(), { isRemote: true }],
    };
  }

  if (filter === "fresher") {
    return {
      AND: [
        buildFresherWhere(),
        {
          NOT: buildInternshipWhere(),
        },
      ],
    };
  }

  if (filter === "zero_one") {
    return {
      OR: [{ experienceLevel: "ENTRY" }, { minExperience: { lte: 1 } }, { maxExperience: { lte: 1 } }],
    };
  }

  return {};
}

function buildStrongEarlyCareerWhere(): Prisma.JobWhereInput {
  return {
    OR: [buildInternshipWhere(), buildFresherWhere()],
  };
}

function buildInternshipWhere(): Prisma.JobWhereInput {
  return {
    AND: [
      {
        OR: [
          { employmentType: "INTERNSHIP" },
          { title: { contains: "apprentice", mode: "insensitive" } },
          { title: { contains: "industrial trainee", mode: "insensitive" } },
        ],
      },
      {
        NOT: {
          OR: ["senior", "sr.", "staff", "principal", "lead", "manager", "architect", "director", "head"].map((term) => ({
            title: { contains: term, mode: "insensitive" },
          })),
        },
      },
    ],
  };
}

function buildFresherWhere(): Prisma.JobWhereInput {
  return {
    OR: [
      { title: { contains: "fresher", mode: "insensitive" } },
      { title: { contains: "trainee", mode: "insensitive" } },
      { title: { contains: "new grad", mode: "insensitive" } },
      { title: { contains: "graduate engineer", mode: "insensitive" } },
      { title: { contains: "entry level", mode: "insensitive" } },
      { title: { contains: "associate software engineer", mode: "insensitive" } },
      { title: { contains: "software engineer i", mode: "insensitive" } },
      { title: { contains: "sde i", mode: "insensitive" } },
      { description: { contains: "freshers", mode: "insensitive" } },
      { description: { contains: "fresh graduates", mode: "insensitive" } },
    ],
  };
}

function calculateEarlyCareerQuality(job: {
  readonly title: string;
  readonly description: string;
  readonly employmentType: string;
  readonly experienceLevel: string;
  readonly minExperience: unknown;
  readonly maxExperience: unknown;
}) {
  const title = job.title.toLowerCase();
  const description = job.description.toLowerCase();
  const minExperience = Number(job.minExperience ?? 99);
  const maxExperience = Number(job.maxExperience ?? 99);
  const seniorTitle = /\b(senior|sr\.?|staff|principal|lead|manager|architect|director|head)\b/.test(title);
  let score = 0;
  const signals: string[] = [];

  if ((job.employmentType === "INTERNSHIP" && !seniorTitle) || /\b(intern|apprentice|industrial trainee)\b/.test(title)) {
    score += 80;
    signals.push("internship");
  }

  if (/\b(fresher|trainee|new grad|graduate engineer|entry level|associate software engineer|software engineer i|sde i)\b/.test(title)) {
    score += 65;
    signals.push("fresher-title");
  }

  if (job.experienceLevel === "ENTRY") {
    score += 42;
    signals.push("entry-level");
  } else if (job.experienceLevel === "JUNIOR") {
    score += 28;
    signals.push("junior");
  }

  if (minExperience <= 1 || maxExperience <= 1) {
    score += 34;
    signals.push("0-1-years");
  } else if (maxExperience <= 2) {
    score += 20;
    signals.push("0-2-years");
  }

  if (/\b(freshers|fresh graduates|no prior professional experience)\b/.test(description)) {
    score += 20;
    signals.push("fresher-friendly");
  }

  if (seniorTitle && !/\b(intern|apprentice|industrial trainee)\b/.test(title)) {
    score -= 90;
    signals.push("senior-title-penalty");
  }

  return {
    score,
    label: score >= 70 ? "STRONG" : score >= 35 ? "MEDIUM" : "WEAK",
    signals,
  };
}
