import prisma from '../src/config/prisma';
import { importCampusCatalog } from '../src/utils/campus-catalog-import';
import {
  resolveAddressCoordinates,
  searchInstitutionCampuses,
} from '../src/utils/geocode';

async function main(): Promise<void> {
  const applyChanges = process.argv.includes('--apply');
  const summaries = await importCampusCatalog({
    getActiveInstitutions: async () => prisma.institution.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: 'asc' },
    }),
    getExistingCampusNames: async () => {
      const campuses = await prisma.campus.findMany({ select: { name: true } });
      return new Set(campuses.map((campus) => campus.name.trim().toLocaleLowerCase()));
    },
    findCampusSuggestions: searchInstitutionCampuses,
    resolveCoordinates: resolveAddressCoordinates,
    createCampus: async (data) => {
      await prisma.campus.create({ data });
    },
  }, !applyChanges);

  console.log(applyChanges ? 'Campus import results:' : 'Campus import dry run (no changes written):');
  for (const summary of summaries) {
    const created = applyChanges ? summary.created.length : summary.wouldCreate.length;
    console.log(
      `${summary.institution}: ${created} ${applyChanges ? 'created' : 'ready'}, ` +
      `${summary.alreadyExists.length} already exist, ${summary.unresolved.length} unresolved, ` +
      `${summary.unmapped ? 'no mapped campuses' : `${summary.notProcessed} beyond per-institution limit`}`
    );
    for (const name of summary.created) console.log(`  Created: ${name}`);
    for (const name of summary.wouldCreate) console.log(`  Ready: ${name}`);
    for (const name of summary.alreadyExists) console.log(`  Existing: ${name}`);
    for (const name of summary.unresolved) console.log(`  Unresolved: ${name}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Campus catalog import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
