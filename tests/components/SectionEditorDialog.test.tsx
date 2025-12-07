/// <reference types="vitest" />
/* @vitest-environment jsdom */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SectionEditorDialog } from "@/components/quiz/editor/SectionEditorDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof SectionEditorDialog>> = {}) {
  const props: React.ComponentProps<typeof SectionEditorDialog> = {
    open: true,
    onOpenChange: () => {},
    editingSection: null,
    sectionTitle: "",
    setSectionTitle: () => {},
    sectionDescription: "",
    setSectionDescription: () => {},
    imageUrl: "",
    setImageUrl: () => {},
    availableTranslationLanguages: ["en"],
    activeTranslationTab: "en",
    setActiveTranslationTab: () => {},
    sectionTranslations: { en: {} },
    onAddTranslationLanguage: () => {},
    onUpdateSectionTranslation: () => {},
    onCopyToTranslation: () => {},
    onAutoTranslate: () => {},
    onSaveTranslation: () => {},
    autoTranslatingSection: null,
    savingTranslation: null,
    getTranslationStatus: () => "empty",
    uploading: false,
    onImageUpload: () => {},
    onRemoveImage: () => {},
    onSave: () => {},
    onCancel: () => {},
    ...overrides,
  };
  return render(<SectionEditorDialog {...props} />);
}

describe("SectionEditorDialog", () => {
  it("disables save when title is empty and enables when filled", () => {
    const saveSpy = vi.fn();
    renderDialog({ onSave: saveSpy, sectionTitle: "" });

    expect(screen.getByRole("button", { name: /add section/i })).toBeDisabled();

    const setTitle = vi.fn();
    cleanup();
    renderDialog({
      sectionTitle: "New Section",
      setSectionTitle: setTitle,
      onSave: saveSpy,
    });

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Geography" } });
    expect(setTitle).toHaveBeenCalledWith("Geography");
    expect(screen.getByRole("button", { name: /add section/i })).toBeEnabled();
  });

  it("shows translation tab status icons when editing a section", () => {
    renderDialog({
      editingSection: { id: "s1", questionText: "Section", questionType: "SECTION" },
      availableTranslationLanguages: ["en", "es"],
      activeTranslationTab: "en",
      getTranslationStatus: () => "complete",
    });
    expect(screen.getByText(/Sections help organize/i)).toBeInTheDocument();
    expect(screen.getByText("Add Translation")).toBeInTheDocument();
  });
});
