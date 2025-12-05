# Implementation Plan: Section-based Question Organization with Drag & Drop

## Overview
Add the ability to organize questions into sections with full drag-and-drop reordering support.

## Current State
- Questions have `orderIndex` for ordering
- Sections are just questions with `questionType === "SECTION"`
- No explicit parent-child relationship between sections and questions
- No drag-and-drop library installed

## Approach: Visual Grouping (No Schema Change)

Instead of adding a `sectionId` field to the database, we'll use a **visual grouping approach**:
- Questions that appear after a SECTION item (until the next SECTION or end) are visually grouped under that section
- The `orderIndex` is the single source of truth for ordering
- This avoids database migrations and keeps the data model simple

## Implementation Steps

### 1. Install @dnd-kit library
- Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop
- This is a modern, accessible, lightweight DnD library that works well with React

### 2. Create API endpoint for reordering
- `PUT /api/quizzes/[quizId]/questions/reorder`
- Accepts an array of question IDs in the new order
- Updates all `orderIndex` values in a single transaction

### 3. Update Questions Page UI
- Group questions visually by section (questions after a section belong to it)
- Add drag handles to each item
- Sections show with their contained questions indented
- "Standalone" questions (before any section) appear at top level

### 4. Drag & Drop Behaviors
- **Drag a question**: Can move within its section, to another section, or to standalone
- **Drag a section**: Moves the section AND all its contained questions together
- **Drop zones**: Between items, at top of list, at end of sections

### 5. UI Changes
- Questions under a section are indented and visually connected
- Sections are collapsible (optional, nice-to-have)
- Drag handle icon on hover (using existing GripVertical icon)
- Visual feedback during drag (highlight drop zones)

## File Changes

1. **package.json** - Add @dnd-kit dependencies
2. **src/app/api/quizzes/[quizId]/questions/reorder/route.ts** - New reorder API
3. **src/app/admin/quiz/[quizId]/questions/page.tsx** - Main UI changes:
   - Import DnD components
   - Group questions by section for display
   - Implement drag-and-drop handlers
   - Add visual indentation for section children
   - Call reorder API on drop

## Technical Details

### Grouping Logic
```typescript
// Group questions into sections
function groupQuestionsBySections(questions: Question[]) {
  const groups: { section: Question | null; questions: Question[] }[] = [];
  let currentGroup: { section: Question | null; questions: Question[] } = {
    section: null,
    questions: []
  };

  for (const q of questions) {
    if (q.questionType === "SECTION") {
      // Save previous group if it has content
      if (currentGroup.section || currentGroup.questions.length > 0) {
        groups.push(currentGroup);
      }
      // Start new group with this section
      currentGroup = { section: q, questions: [] };
    } else {
      currentGroup.questions.push(q);
    }
  }
  // Don't forget the last group
  if (currentGroup.section || currentGroup.questions.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}
```

### Reorder API
```typescript
// PUT /api/quizzes/[quizId]/questions/reorder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params;
  const { questionIds } = await request.json();

  // Update all orderIndex values in a transaction
  await prisma.$transaction(
    questionIds.map((id: string, index: number) =>
      prisma.question.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
```

## Estimated Complexity
- Low-medium complexity
- No database schema changes
- Straightforward DnD implementation with @dnd-kit
