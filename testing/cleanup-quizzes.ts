import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestQuizzes() {
  console.log('\n=== Cleaning up test quizzes ===\n');

  // Find all quizzes with test-related titles
  const testQuizzes = await prisma.quiz.findMany({
    where: {
      OR: [
        { title: { contains: 'Test' } },
        { title: { contains: 'Translation Test' } },
        { title: { contains: 'Debug' } },
        { title: { contains: 'Final Test' } },
      ]
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  console.log(`Found ${testQuizzes.length} test quizzes:\n`);

  for (const quiz of testQuizzes) {
    console.log(`  - ${quiz.title} (${quiz.id}) - ${quiz.createdAt.toISOString()}`);
  }

  if (testQuizzes.length === 0) {
    console.log('\nNo test quizzes to clean up.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\nDeleting ${testQuizzes.length} test quizzes...`);

  for (const quiz of testQuizzes) {
    try {
      // Delete game sessions first
      await prisma.gameSession.deleteMany({
        where: { quizId: quiz.id },
      });

      // Delete the quiz (cascades to questions, answers, translations)
      await prisma.quiz.delete({
        where: { id: quiz.id },
      });

      console.log(`  ✓ Deleted: ${quiz.title}`);
    } catch (error) {
      console.log(`  ✗ Failed to delete: ${quiz.title} - ${error}`);
    }
  }

  console.log('\n=== Cleanup complete ===\n');
  await prisma.$disconnect();
}

cleanupTestQuizzes().catch(console.error);
