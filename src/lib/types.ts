export interface IChecklistItem {
  id: string;
  checklistSectionId: string;
  name: string;
  completed: boolean;
}

export interface IChecklistSection {
  id: string;
  checklistId: string;
  name: string;
  items: IChecklistItem[];
}

export interface IChecklist {
  id: string;
  name: string;
  sections: IChecklistSection[];
}
