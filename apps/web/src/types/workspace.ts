export interface WorkspaceSummary {
  workspace_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  owner_user_id: string | null;
  owner_org_id: string | null;
  role: string | null;
  membership_type: string;
}

export interface CollaboratorSummary {
  collaborator_id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  is_active: boolean;
  email: string;
  first_name: string;
  last_name: string;
}
