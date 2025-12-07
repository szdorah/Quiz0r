"use client";

import { Plus, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionEmptyStateProps {
  onAddQuestion: () => void;
}

export function QuestionEmptyState({ onAddQuestion }: QuestionEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileQuestion className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No questions yet</h3>
        <p className="text-muted-foreground text-sm text-center mb-6 max-w-sm">
          Start building your quiz by adding your first question. You can also
          add sections to organize your questions into groups.
        </p>
        <Button onClick={onAddQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Question
        </Button>
      </CardContent>
    </Card>
  );
}
