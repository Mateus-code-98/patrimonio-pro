export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export interface Source {
  id: string;
  name: string;
  icon: string;
}

export interface Transaction {
  id: string;
  report_id: string;
  value: number;
  type: TransactionType;
  source_id: string;
  date: string;
  is_mandatory: boolean;
  category_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_logo?: string;
  card_id?: string;
  card_name?: string;
  card_logo?: string;
}

export interface Report {
  id: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  initial_patrimony: number;
  okr_min: number;
  okr_ambitious: number;
  daily_spent_default: number;
  selic_tax: number;
  transactions?: Transaction[];
  projected_surplus?: number;
  projection_date?: string;
  projection_reason?: string;
}

export interface DefaultIncomeConfig {
  name: string;
  value: number;
  source_id: string;
  category_id: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: TransactionType;
  logo?: string;
  is_system?: number;
  expense_category_id?: string;
  income_category_id?: string;
  category_ids: string[]; // DEPRECATED
  alias_ids: string[];
}

export interface Alias {
  id: string;
  name: string;
  supplier_id?: string;
}

export interface GlobalConfig {
  daily_spent_avg: number;
  okr_min_default: number;
  okr_ambitious_default: number;
  cycle_day_default: number;
  daily_spent_estimate_default: number;
  goal_target_default: number;
  default_incomes: DefaultIncomeConfig[];
}
