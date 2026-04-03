import type { LucideIcon } from 'lucide-react';
import {
  Car,
  Home,
  Landmark,
  Heart,
  Palmtree,
  CircleEllipsis,
} from 'lucide-react';
import type { LoanPurpose } from './types';

export const LOAN_PURPOSE_UI: {
  purpose: LoanPurpose;
  label: string;
  Icon: LucideIcon;
}[] = [
  { purpose: 'Car', label: 'Car', Icon: Car },
  { purpose: 'Home Improvement', label: 'Home', Icon: Home },
  { purpose: 'Debt Consolidation', label: 'Debt', Icon: Landmark },
  { purpose: 'Wedding', label: 'Wedding', Icon: Heart },
  { purpose: 'Holiday', label: 'Holiday', Icon: Palmtree },
  { purpose: 'Other', label: 'Other', Icon: CircleEllipsis },
];
